import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { StateService } from '../../../core/services/state.service';
import { PdfService } from '../../../core/services/pdf.service';
import { ConfigService } from '../../../core/services/config.service';
import { FormField, PDFFormData } from '../../../core/models/form-field.model';

@Component({
  selector: 'app-pdf-filler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-filler.component.html',
  styleUrls: ['./pdf-filler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfFillerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State observables
  formFields$ = this.stateService.formFields$;
  formData$ = this.stateService.formData$;
  isLoading$ = this.stateService.isLoading$;
  flattenForm$ = this.stateService.flattenForm$;
  pdfFile$ = this.stateService.pdfFile$;

  // Local state
  flattenForm = true;

  constructor(
    private stateService: StateService,
    private pdfService: PdfService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    // Subscribe to flatten form state
    this.flattenForm$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(flatten => {
      this.flattenForm = flatten;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleFieldChange(fieldName: string, value: string | number): void {
    this.stateService.updateFormData(fieldName, value);
  }

  loadSampleData(): void {
    this.formFields$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(formFields => {
      const sampleData = this.configService.createSampleFormData(formFields);
      this.stateService.setFormData(sampleData);
    });
  }

  async generateFilledPDF(): Promise<void> {
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

      this.stateService.setIsLoading(true);
      try {
        // First generate PDF with form fields
        const pdfWithForm = await this.pdfService.generatePDFWithForm(pdfFile, formFields);
        
        const formData = this.stateService.getCurrentFormData();
        
        let filledPdf: Uint8Array;
        
        if (this.flattenForm) {
          // Fill the form with data and flatten (remove borders)
          filledPdf = await this.pdfService.fillAndFlattenPDFForm(
            new File([new Uint8Array(pdfWithForm)], 'form.pdf', { type: 'application/pdf' }),
            formData,
            formFields // Pass formFields to get page information
          );
        } else {
          // Fill the form with data but keep borders
          filledPdf = await this.pdfService.fillPDFForm(
            new File([new Uint8Array(pdfWithForm)], 'form.pdf', { type: 'application/pdf' }),
            formData
          );
        }
        
        this.pdfService.downloadPDF(filledPdf, 'filled-form.pdf');
      } catch (error) {
        console.error('Error generating filled PDF:', error);
        alert('Error generating PDF. Please check the console for details.');
      } finally {
        this.stateService.setIsLoading(false);
      }
    });
  }

  async downloadFormPDF(): Promise<void> {
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

      this.stateService.setIsLoading(true);
      try {
        const pdfWithForm = await this.pdfService.generatePDFWithForm(pdfFile, formFields);
        this.pdfService.downloadPDF(pdfWithForm, 'form-template.pdf');
      } catch (error) {
        console.error('Error generating form PDF:', error);
        alert('Error generating PDF. Please check the console for details.');
      } finally {
        this.stateService.setIsLoading(false);
      }
    });
  }

  onFlattenFormChange(checked: boolean): void {
    this.stateService.setFlattenForm(checked);
  }

  // Utility method for template
  trackByFieldId(index: number, field: FormField): string {
    return field.id;
  }

  // Get form data for template
  getFormDataValue(fieldName: string): string {
    const formData = this.stateService.getCurrentFormData();
    return formData[fieldName]?.toString() || '';
  }
}
