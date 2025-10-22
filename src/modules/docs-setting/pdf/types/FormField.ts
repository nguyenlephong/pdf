export interface FormField {
  id: string;
  type: 'text' | 'date' | 'number' | 'email';
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

export interface PDFFormData {
  [fieldName: string]: string | number;
}
