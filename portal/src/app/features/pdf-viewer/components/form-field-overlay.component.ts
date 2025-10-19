import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormField } from '../../../core/models/form-field.model';

export interface FieldMoveEvent {
  x: number;
  y: number;
  isValidPosition?: boolean;
}

export interface FieldResizeEvent {
  width: number;
  height: number;
}

@Component({
  selector: 'app-form-field-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field-overlay.component.html',
  styleUrls: ['./form-field-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldOverlayComponent implements OnInit, OnDestroy {
  @Input() field!: FormField;
  @Input() scale: number = 1.0;
  @Input() isSelected: boolean = false;
  @Input() allFields: FormField[] = [];
  @Input() snapToGrid: boolean = false;
  @Input() gridSize: number = 10;

  @Output() fieldClick = new EventEmitter<FormField>();
  @Output() fieldMove = new EventEmitter<FieldMoveEvent>();
  @Output() fieldResize = new EventEmitter<FieldResizeEvent>();
  @Output() fieldDelete = new EventEmitter<void>();

  @ViewChild('overlayRef', { static: false }) overlayRef!: ElementRef;

  private destroy$ = new Subject<void>();

  // Local state
  isDragging = false;
  isResizing = false;
  isOverlapping = false;
  dragStart = { x: 0, y: 0 };
  resizeStart = { x: 0, y: 0, width: 0, height: 0 };
  dragPreview = { x: 0, y: 0 };

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = this.overlayRef?.nativeElement.getBoundingClientRect();
    if (!rect) return;

    const isResizeHandle = event.target === event.currentTarget.querySelector('.resize-handle');
    
    if (isResizeHandle) {
      this.isResizing = true;
      this.resizeStart = {
        x: event.clientX,
        y: event.clientY,
        width: this.field.width,
        height: this.field.height
      };
    } else {
      this.isDragging = true;
      this.dragStart = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    // Add global event listeners
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  onClick(): void {
    this.fieldClick.emit(this.field);
  }

  onDelete(): void {
    this.fieldDelete.emit();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      let newX = (event.clientX - this.dragStart.x) / this.scale;
      let newY = (event.clientY - this.dragStart.y) / this.scale;
      
      // Apply snap to grid if enabled
      const snappedPosition = this.snapToGridPosition(newX, newY);
      newX = snappedPosition.x;
      newY = snappedPosition.y;
      
      // Update drag preview for visual feedback
      this.dragPreview = { x: newX, y: newY };
      
      // Check for overlap
      const wouldOverlap = this.checkForOverlap(newX, newY, this.field.width, this.field.height);
      this.isOverlapping = wouldOverlap;
      
      // Move the field with overlap information
      this.fieldMove.emit({
        x: newX,
        y: newY,
        isValidPosition: !wouldOverlap
      });
    } else if (this.isResizing) {
      const deltaX = (event.clientX - this.resizeStart.x) / this.scale;
      const deltaY = (event.clientY - this.resizeStart.y) / this.scale;
      const newWidth = Math.max(50, this.resizeStart.width + deltaX);
      const newHeight = Math.max(20, this.resizeStart.height + deltaY);
      
      this.fieldResize.emit({
        width: newWidth,
        height: newHeight
      });
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.isResizing = false;
    this.isOverlapping = false;

    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  // Function to check if a position would cause overlap with other fields
  private checkForOverlap(x: number, y: number, width: number, height: number): boolean {
    const currentField = {
      x, y, width, height, pageNumber: this.field.pageNumber
    };
    
    return this.allFields.some(otherField => {
      if (otherField.id === this.field.id || otherField.pageNumber !== this.field.pageNumber) {
        return false;
      }
      
      return !(
        currentField.x >= otherField.x + otherField.width ||
        currentField.x + currentField.width <= otherField.x ||
        currentField.y >= otherField.y + otherField.height ||
        currentField.y + currentField.height <= otherField.y
      );
    });
  }

  // Function to snap position to grid
  private snapToGridPosition(x: number, y: number): { x: number, y: number } {
    if (!this.snapToGrid) return { x, y };
    
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize
    };
  }

  // Determine border color based on state
  getBorderColor(): string {
    if (this.isOverlapping) return '#dc3545'; // Red for overlap
    if (this.isSelected) return '#007bff'; // Blue for selected
    return '#ddd'; // Default gray
  }

  // Determine background color based on state
  getBackgroundColor(): string {
    if (this.isOverlapping) return 'rgba(220, 53, 69, 0.1)'; // Red tint for overlap
    if (this.isSelected) return 'rgba(0, 123, 255, 0.1)'; // Blue tint for selected
    return 'rgba(255, 255, 255, 0.8)'; // Default white
  }

  // Get overlay styles
  getOverlayStyles(): { [key: string]: any } {
    return {
      left: this.field.x * this.scale + 'px',
      top: this.field.y * this.scale + 'px',
      width: this.field.width * this.scale + 'px',
      height: this.field.height * this.scale + 'px',
      fontSize: this.field.fontSize * this.scale + 'px',
      color: this.field.color,
      border: `2px solid ${this.getBorderColor()}`,
      backgroundColor: this.getBackgroundColor(),
      cursor: this.isDragging ? 'grabbing' : 'grab',
      transition: this.isDragging ? 'none' : 'all 0.2s ease',
      boxShadow: this.isOverlapping ? '0 0 10px rgba(220, 53, 69, 0.5)' : 
                 this.isSelected ? '0 0 5px rgba(0, 123, 255, 0.3)' : 'none',
      zIndex: this.isDragging ? 1000 : (this.isSelected ? 100 : 10),
    };
  }

  // Get label styles
  getLabelStyles(): { [key: string]: any } {
    return {
      color: this.isOverlapping ? '#dc3545' : this.field.color,
      textShadow: this.isOverlapping ? '1px 1px 2px rgba(255,255,255,0.8)' : 'none'
    };
  }
}
