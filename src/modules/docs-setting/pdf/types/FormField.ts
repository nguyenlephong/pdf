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
  ts: number;
  position: number;
}

export interface FormFieldSetting {
  id: string
  box: FormFieldBox
  meta: FormFieldMeta
  
  fontSize: number;
  color: string;
}

type FormFieldMeta = {
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  pageNumber: number;
  ts: number;
}

type FormFieldBox = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFFormData {
  [fieldName: string]: string | number;
}
