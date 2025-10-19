import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { StateService } from '../../../core/services/state.service';
import { FormField } from '../../../core/models/form-field.model';
import { FormFieldOverlayComponent } from './form-field-overlay.component';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, FormFieldOverlayComponent],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  @ViewChild('pageRef', { static: false }) pageRef!: ElementRef;
  Math = Math;

  private destroy$ = new Subject<void>();
  // State observables
  pdfFile$ = this.stateService.pdfFile$;
  formFields$ = this.stateService.formFields$;
  selectedField$ = this.stateService.selectedField$;
  currentPage$ = this.stateService.currentPage$;
  totalPages$ = this.stateService.totalPages$;
  scale$ = this.stateService.scale$;
  isAddingField$ = this.stateService.isAddingField$;
  snapToGrid$ = this.stateService.snapToGrid$;
  gridSize$ = this.stateService.gridSize$;
  currentPageFormFields$ = this.stateService.currentPageFormFields$;

  // Local state
  numPages = 0;
  isDragActive = false;

  constructor(
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    // Combine multiple observables for template
    combineLatest([
      this.pdfFile$,
      this.formFields$,
      this.selectedField$,
      this.currentPage$,
      this.totalPages$,
      this.scale$,
      this.isAddingField$,
      this.snapToGrid$,
      this.gridSize$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDocumentLoadSuccess(numPages: number): void {
    this.numPages = numPages;
    this.stateService.setTotalPages(numPages);
  }

  onDrop(acceptedFiles: File[]): void {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        this.stateService.setPdfFile(file);
      }
    }
  }

  handlePageClick(event: MouseEvent): void {
    this.isAddingField$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAddingField => {
      if (!isAddingField) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      this.scale$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(scale => {
        this.currentPage$.pipe(
          takeUntil(this.destroy$)
        ).subscribe(pageNumber => {
          const fieldWidth = 150;
          const fieldHeight = 30;
          const clickX = x / scale;
          const clickY = y / scale;

          // Find a non-overlapping position
          const { x: finalX, y: finalY } = this.findNonOverlappingPosition(
            clickX, clickY, fieldWidth, fieldHeight, pageNumber
          );

          const newField: FormField = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'New Field',
            name: `field_${Date.now()}`,
            x: finalX,
            y: finalY,
            width: fieldWidth,
            height: fieldHeight,
            fontSize: 12,
            color: '#000000',
            required: false,
            placeholder: 'Enter text...',
            pageNumber: pageNumber
          };

          this.stateService.addFormField(newField);
          this.stateService.setIsAddingField(false);

          // Show message if position was adjusted
          if (finalX !== clickX || finalY !== clickY) {
            console.log('Field position adjusted to avoid overlap');
          }
        });
      });
    });
  }

  handleFieldSelect(field: FormField): void {
    this.stateService.selectField(field);
  }

  handleFieldMove(fieldId: string, newX: number, newY: number, isValidPosition?: boolean): void {
    // Only update position if it's valid (no overlap) or if we want to allow overlaps
    if (isValidPosition !== false) {
      this.stateService.updateFormField(fieldId, { x: newX, y: newY });
    }
  }

  handleFieldResize(fieldId: string, newWidth: number, newHeight: number): void {
    this.stateService.updateFormField(fieldId, { width: newWidth, height: newHeight });
  }

  handleDeleteField(fieldId: string): void {
    this.stateService.deleteFormField(fieldId);
  }

  toggleAddingField(): void {
    this.isAddingField$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAdding => {
      this.stateService.setIsAddingField(!isAdding);
    });
  }

  setCurrentPage(page: number): void {
    this.stateService.setCurrentPage(page);
  }

  setScale(scale: number): void {
    this.stateService.setScale(scale);
  }

  setSnapToGrid(snap: boolean): void {
    this.stateService.setSnapToGrid(snap);
  }

  setGridSize(size: number): void {
    this.stateService.setGridSize(size);
  }

  // Function to check if a position would cause overlap with existing fields
  private checkForOverlap(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    pageNumber: number,
    excludeFieldId?: string
  ): boolean {
    const formFields = this.stateService.getCurrentFormFields();
    
    return formFields.some(field => {
      if (field.id === excludeFieldId || field.pageNumber !== pageNumber) {
        return false;
      }
      
      return !(
        x >= field.x + field.width ||
        x + width <= field.x ||
        y >= field.y + field.height ||
        y + height <= field.y
      );
    });
  }

  // Function to find a non-overlapping position near the clicked position
  private findNonOverlappingPosition(
    x: number, 
    y: number, 
    width: number, 
    height: number,
    pageNumber: number
  ): { x: number, y: number } {
    if (!this.checkForOverlap(x, y, width, height, pageNumber)) {
      return { x, y };
    }

    // Try positions in a spiral pattern around the clicked point
    const step = 20;
    for (let radius = step; radius <= 200; radius += step) {
      for (let angle = 0; angle < 360; angle += 45) {
        const radians = (angle * Math.PI) / 180;
        const newX = x + radius * Math.cos(radians);
        const newY = y + radius * Math.sin(radians);
        
        // Ensure position is within reasonable bounds
        if (newX >= 0 && newY >= 0) {
          if (!this.checkForOverlap(newX, newY, width, height, pageNumber)) {
            return { x: newX, y: newY };
          }
        }
      }
    }
    
    // If no position found, return original position with warning
    return { x, y };
  }

  // Utility methods for template
  trackByFieldId(index: number, field: FormField): string {
    return field.id;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.stateService.setPdfFile(file);
      }
    }
  }
}
