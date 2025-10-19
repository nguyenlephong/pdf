export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  required: boolean;
  placeholder?: string;
  pageNumber: number;
}

export type FormFieldType = 'text' | 'date' | 'number' | 'email';

export interface PDFFormData {
  [fieldName: string]: string | number;
}

export interface PDFConfig {
  formFields: FormField[];
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  version: string;
}

export interface PDFViewerState {
  pdfFile: File | null;
  formFields: FormField[];
  selectedField: FormField | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  isAddingField: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface PDFFillerState {
  formData: PDFFormData;
  isLoading: boolean;
  flattenForm: boolean;
}
