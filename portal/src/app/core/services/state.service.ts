import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { FormField, PDFFormData, PDFViewerState, PDFFillerState } from '../models/form-field.model';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  
  // PDF Viewer State
  private pdfFileSubject = new BehaviorSubject<File | null>(null);
  private formFieldsSubject = new BehaviorSubject<FormField[]>([]);
  private selectedFieldSubject = new BehaviorSubject<FormField | null>(null);
  private currentPageSubject = new BehaviorSubject<number>(1);
  private totalPagesSubject = new BehaviorSubject<number>(0);
  private scaleSubject = new BehaviorSubject<number>(1.0);
  private isAddingFieldSubject = new BehaviorSubject<boolean>(false);
  private snapToGridSubject = new BehaviorSubject<boolean>(false);
  private gridSizeSubject = new BehaviorSubject<number>(10);

  // PDF Filler State
  private formDataSubject = new BehaviorSubject<PDFFormData>({});
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private flattenFormSubject = new BehaviorSubject<boolean>(true);

  // Observable getters for PDF Viewer
  pdfFile$ = this.pdfFileSubject.asObservable();
  formFields$ = this.formFieldsSubject.asObservable();
  selectedField$ = this.selectedFieldSubject.asObservable();
  currentPage$ = this.currentPageSubject.asObservable();
  totalPages$ = this.totalPagesSubject.asObservable();
  scale$ = this.scaleSubject.asObservable();
  isAddingField$ = this.isAddingFieldSubject.asObservable();
  snapToGrid$ = this.snapToGridSubject.asObservable();
  gridSize$ = this.gridSizeSubject.asObservable();

  // Observable getters for PDF Filler
  formData$ = this.formDataSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  flattenForm$ = this.flattenFormSubject.asObservable();

  // Combined state observables
  pdfViewerState$ = combineLatest([
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
    map(([
      pdfFile,
      formFields,
      selectedField,
      currentPage,
      totalPages,
      scale,
      isAddingField,
      snapToGrid,
      gridSize
    ]) => ({
      pdfFile,
      formFields,
      selectedField,
      currentPage,
      totalPages,
      scale,
      isAddingField,
      snapToGrid,
      gridSize
    } as PDFViewerState))
  );

  pdfFillerState$ = combineLatest([
    this.formData$,
    this.isLoading$,
    this.flattenForm$
  ]).pipe(
    map(([formData, isLoading, flattenForm]) => ({
      formData,
      isLoading,
      flattenForm
    } as PDFFillerState))
  );

  // Current page form fields
  currentPageFormFields$ = combineLatest([
    this.formFields$,
    this.currentPage$
  ]).pipe(
    map(([formFields, currentPage]) => 
      formFields.filter(field => field.pageNumber === currentPage)
    )
  );

  // PDF Viewer Actions
  setPdfFile(file: File | null): void {
    this.pdfFileSubject.next(file);
  }

  setFormFields(fields: FormField[]): void {
    this.formFieldsSubject.next(fields);
  }

  addFormField(field: FormField): void {
    const currentFields = this.formFieldsSubject.value;
    this.formFieldsSubject.next([...currentFields, field]);
  }

  updateFormField(fieldId: string, updates: Partial<FormField>): void {
    const currentFields = this.formFieldsSubject.value;
    const updatedFields = currentFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    this.formFieldsSubject.next(updatedFields);
  }

  deleteFormField(fieldId: string): void {
    const currentFields = this.formFieldsSubject.value;
    const updatedFields = currentFields.filter(field => field.id !== fieldId);
    this.formFieldsSubject.next(updatedFields);
    
    // Clear selection if deleted field was selected
    const selectedField = this.selectedFieldSubject.value;
    if (selectedField && selectedField.id === fieldId) {
      this.selectedFieldSubject.next(null);
    }
  }

  selectField(field: FormField | null): void {
    this.selectedFieldSubject.next(field);
  }

  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  setTotalPages(pages: number): void {
    this.totalPagesSubject.next(pages);
  }

  setScale(scale: number): void {
    this.scaleSubject.next(scale);
  }

  setIsAddingField(isAdding: boolean): void {
    this.isAddingFieldSubject.next(isAdding);
  }

  setSnapToGrid(snap: boolean): void {
    this.snapToGridSubject.next(snap);
  }

  setGridSize(size: number): void {
    this.gridSizeSubject.next(size);
  }

  // PDF Filler Actions
  setFormData(data: PDFFormData): void {
    this.formDataSubject.next(data);
  }

  updateFormData(fieldName: string, value: string | number): void {
    const currentData = this.formDataSubject.value;
    this.formDataSubject.next({
      ...currentData,
      [fieldName]: value
    });
  }

  setIsLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  setFlattenForm(flatten: boolean): void {
    this.flattenFormSubject.next(flatten);
  }

  // Utility methods
  clearState(): void {
    this.pdfFileSubject.next(null);
    this.formFieldsSubject.next([]);
    this.selectedFieldSubject.next(null);
    this.currentPageSubject.next(1);
    this.totalPagesSubject.next(0);
    this.scaleSubject.next(1.0);
    this.isAddingFieldSubject.next(false);
    this.snapToGridSubject.next(false);
    this.gridSizeSubject.next(10);
    this.formDataSubject.next({});
    this.isLoadingSubject.next(false);
    this.flattenFormSubject.next(true);
  }

  // Get current values (for synchronous access)
  getCurrentPdfFile(): File | null {
    return this.pdfFileSubject.value;
  }

  getCurrentFormFields(): FormField[] {
    return this.formFieldsSubject.value;
  }

  getCurrentSelectedField(): FormField | null {
    return this.selectedFieldSubject.value;
  }

  getCurrentFormData(): PDFFormData {
    return this.formDataSubject.value;
  }
}
