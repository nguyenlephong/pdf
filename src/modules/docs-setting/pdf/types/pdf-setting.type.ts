export interface PDFSettingData {
  form_fields: FormFieldSetting[];
  name: string;
  ts: string | number;
  version: string;
}

export interface CustomerAttributeData {
  label: string;
  value: string;
  [key: string]: any;
}

export interface FormFieldSetting {
  id: string
  box: FormFieldBox
  meta: FormFieldMeta
  
  font_size: number;
  color: string;
  position: number;
  page_number: number;
  
  [key: string]: any;
  
  setting?: SettingType;
}

type SettingType = {
  type: string;
  [key: string]: any;
}

type FormFieldMeta = {
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  ts: number;
  type: string;
}

export type FormFieldBox = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ToolSettingConfig {
  enableExportToolBox?: boolean;
  enablePDFViewerToolBar?: boolean;
  enablePDFFillerToolBox?: boolean;
  enableLogger?: boolean;
  lang?: 'en' | 'vi' | string;
}