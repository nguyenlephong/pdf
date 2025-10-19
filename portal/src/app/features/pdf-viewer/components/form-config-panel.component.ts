import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { StateService } from '../../../core/services/state.service';
import { ConfigService } from '../../../core/services/config.service';
import { FormField } from '../../../core/models/form-field.model';

@Component({
  selector: 'app-form-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-config-panel.component.html',
  styleUrls: ['./form-config-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormConfigPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State observables
  selectedField$ = this.stateService.selectedField$;
  formFields$ = this.stateService.formFields$;
  pdfFile$ = this.stateService.pdfFile$;

  constructor(
    private stateService: StateService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleFieldUpdate(field: string, value: any): void {
    this.selectedField$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(selectedField => {
      if (selectedField) {
        this.stateService.updateFormField(selectedField.id, { [field]: value });
      }
    });
  }

  handleDeleteSelected(): void {
    this.selectedField$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(selectedField => {
      if (selectedField) {
        this.stateService.deleteFormField(selectedField.id);
      }
    });
  }

  selectField(field: FormField): void {
    this.stateService.selectField(field);
  }

  async exportPDFWithConfig(): Promise<void> {
    combineLatest([
      this.pdfFile$,
      this.formFields$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(async ([pdfFile, formFields]) => {
      if (!pdfFile || formFields.length === 0) {
        alert('Please load a PDF and add form fields first');
        return;
      }
      
      try {
        await this.configService.exportPDFWithConfig(pdfFile, formFields);
        alert('PDF and config files exported successfully!');
      } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting files');
      }
    });
  }

  onFileSelected(event: Event, type: 'pdf' | 'config' | 'both'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (type === 'both') {
      this.handleMultipleFileImport(input.files);
    } else if (type === 'pdf') {
      this.handleSingleFileImport(input.files[0], 'pdf');
    } else if (type === 'config') {
      this.handleSingleFileImport(input.files[0], 'config');
    }
  }

  private async handleMultipleFileImport(files: FileList): Promise<void> {
    if (files.length < 1) {
      alert('Please select at least one file');
      return;
    }

    let pdfFile: File | null = null;
    let configFile: File | null = null;

    // Identify PDF and JSON files
    for (let i = 0; i < files.length; i++) {
      if (files[i].type === 'application/pdf') {
        pdfFile = files[i];
      } else if (files[i].type === 'application/json' || files[i].name.endsWith('.json')) {
        configFile = files[i];
      }
    }

    if (files.length === 1) {
      // Single file selected
      if (pdfFile) {
        alert('PDF file selected. Please also select a JSON config file, or create new form fields.');
        this.stateService.setPdfFile(pdfFile);
      } else if (configFile) {
        alert('Config file selected. Please also select the corresponding PDF file.');
      }
    } else if (files.length === 2) {
      // Both files selected
      if (!pdfFile || !configFile) {
        alert('Please select one PDF file and one JSON config file');
        return;
      }

      try {
        const { pdfFile: loadedPDF, formFields: loadedFields } = 
          await this.configService.importPDFWithConfig(pdfFile, configFile);
        this.stateService.setPdfFile(loadedPDF);
        this.stateService.setFormFields(loadedFields);
        alert(`Successfully loaded PDF with ${loadedFields.length} form fields`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing files');
      }
    } else {
      alert('Please select maximum 2 files (one PDF and one JSON config)');
    }
  }

  private async handleSingleFileImport(file: File, type: 'pdf' | 'config'): Promise<void> {
    if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
      }
      this.stateService.setPdfFile(file);
      alert('PDF file loaded. You can now add form fields or import a config file.');
    } else if (type === 'config') {
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        alert('Please select a valid JSON config file');
        return;
      }

      try {
        const configText = await file.text();
        const config = JSON.parse(configText);
        
        if (!config.formFields || !Array.isArray(config.formFields)) {
          alert('Invalid config format. Config must contain formFields array.');
          return;
        }

        // Validate and clean form fields
        const validatedFields = config.formFields.map((field: any) => ({
          id: field.id || `field_${Date.now()}_${Math.random()}`,
          type: field.type || 'text',
          label: field.label || 'Imported Field',
          name: field.name || `field_${Date.now()}`,
          x: field.x || 0,
          y: field.y || 0,
          width: field.width || 150,
          height: field.height || 30,
          fontSize: field.fontSize || 12,
          color: field.color || '#000000',
          required: field.required || false,
          placeholder: field.placeholder || '',
          pageNumber: field.pageNumber || 1
        }));

        this.stateService.setFormFields(validatedFields);
        alert(`Successfully imported ${validatedFields.length} form fields from config. Please load the corresponding PDF file.`);
      } catch (error) {
        console.error('Config import error:', error);
        alert('Error importing config file');
      }
    }
  }

  // Utility method for template
  trackByFieldId(index: number, field: FormField): string {
    return field.id;
  }
}
