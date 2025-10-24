import React from 'react';
import {CustomerAttributeData, FormFieldSetting, PDFSettingData} from '../types/pdf-setting.type';
import {PDFConfigService} from '../services/config-pdf.service';
import {Button, Col, Row} from "antd";
import FieldItemSettingUI from './form-field-setting.ui';

interface FormConfigPanelProps {
  selectedField: FormFieldSetting | null;
  attributes?: CustomerAttributeData[];
  formFields: FormFieldSetting[];
  pageActive: number;
  pdfFile: File | null;
  onUpdateField: (fieldId: string, updates: Partial<FormFieldSetting>) => void;
  onDeleteField: (fieldId: string) => void;
  onSelectField: (field: FormFieldSetting) => void;
  onImportConfig: (fields: FormFieldSetting[]) => void;
  onLoadPDFWithConfig: (pdfFile: File, formFields: FormFieldSetting[]) => void;
  onSaveSetting: (setting: PDFSettingData) => void;
}

const FormConfigPanelUi: React.FC<FormConfigPanelProps> = (props) => {
  const {
    attributes,
    selectedField,
    formFields,
    pdfFile,
    pageActive,
    onUpdateField,
    onImportConfig,
    onLoadPDFWithConfig,
    onSaveSetting
  } = props;
  
  const childRefs = React.useRef<Record<string, { save: () => any }>>({});
  
  // @ts-ignore
  const handleFieldUpdate = (field: FormFieldSetting, value: any) => {
    if (!field) return;
    onUpdateField(field.id, {...value});
  };
  
  const handleSaveAll = async () => {
    const results = Object.entries(childRefs.current).map(([id, ref]) => ({
      id,
      data: ref?.save(),
    }));
    
    const isErr = results.some((res) => res.data === -1);
    if (isErr) {
      console.log("❌ Please fix errors in form fields before saving.");
      return;
    }
    
    let configExport = await PDFConfigService.exportConfig(formFields);
    onSaveSetting(configExport);
  };
  
  
  return (
    <div className="pdf-config-panel">
      <div className={'f-between'}>
        <h1>Chọn vị trí và cấu hình điền</h1>
        {formFields.length > 0 && <Button onClick={handleSaveAll} variant="filled">Save</Button>}
      </div>
      <Row gutter={[12, 12]}>
        {formFields
          .sort((x, y) => x.meta.ts - y.meta.ts)
          .map((x, ind) => {
            return {...x, position: x.position || ind + 1};
          })
          .filter((field) => field.page_number === pageActive)
          .map((field: FormFieldSetting) => {
          return (
            <Col xs={24} key={field.id}>
              <FieldItemSettingUI
                /*@ts-ignore*/
                ref={(r) => (childRefs.current[field.id] = r)}
                attributes={attributes}
                data={field}
                selectedField={selectedField}
                onChange={(v) => handleFieldUpdate(field, v)} />
            </Col>
          )
        })}
      </Row>
      
      <div className="config-section">
        <h3>PDF Actions</h3>
        
        <Button
          className="button success"
          onClick={async () => {
            if (!pdfFile || formFields.length === 0) {
              console.log('Please load a PDF and add form fields first');
              return;
            }
            try {
              await PDFConfigService.exportPDFWithConfig(pdfFile, formFields);
              console.log('PDF and config files exported successfully!');
            } catch (error) {
              console.error('Export error:', error);
              console.log('Error exporting files');
            }
          }}
          disabled={formFields.length === 0 || !pdfFile}
        >
          Export PDF + Config
        </Button>
        
        <Button
          className="button success"
          onClick={async () => {
            if (formFields.length === 0) {
              console.log('Please load a PDF and add form fields first');
              return;
            }
            try {
              await PDFConfigService.exportConfig(formFields);
            } catch (error) {
            }
          }}
          disabled={formFields.length === 0}
        >
          Export Config
        </Button>
        
        
        <Button
          className="button"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.json';
            input.multiple = true;
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (!files || files.length < 1) {
                console.log('Please select at least one file');
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
                  console.log('PDF file selected. Please also select a JSON config file, or create new form fields.');
                  onLoadPDFWithConfig(pdfFile, []);
                } else if (configFile) {
                  console.log('Config file selected. Please also select the corresponding PDF file.');
                }
              } else if (files.length === 2) {
                // Both files selected
                if (!pdfFile || !configFile) {
                  console.log('Please select one PDF file and one JSON config file');
                  return;
                }
                
                try {
                  const {pdfFile: loadedPDF, form_fields: loadedFields} =
                    await PDFConfigService.importPDFWithConfig(pdfFile, configFile);
                  onLoadPDFWithConfig(loadedPDF, loadedFields);
                  console.log(`Successfully loaded PDF with ${loadedFields.length} form fields`);
                } catch (error) {
                  console.error('Import error:', error);
                  console.log('Error importing files');
                }
              } else {
                console.log('Please select maximum 2 files (one PDF and one JSON config)');
              }
            };
            input.click();
          }}
        >
          Import PDF + Config
        </Button>
        
        <Button
          className="button"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (!files || files.length !== 1) {
                console.log('Please select one JSON config file');
                return;
              }
              
              const configFile = files[0];
              if (!configFile.name.endsWith('.json') && configFile.type !== 'application/json') {
                console.log('Please select a valid JSON config file');
                return;
              }
              
              // Read and parse config
              try {
                const configText = await configFile.text();
                const config = JSON.parse(configText);
                
                if (!config.form_fields || !Array.isArray(config.form_fields)) {
                  console.log('Invalid config format. Config must contain formFields array.');
                  return;
                }
                
                onImportConfig(config.form_fields);
                console.log(`Successfully imported ${config.form_fields.length} form fields from config. Please load the corresponding PDF file.`);
              } catch (error) {
                console.error('Config import error:', error);
              }
            };
            input.click();
          }}
        >
          Import Config Only
        </Button>
       
      </div>
    </div>
  );
};

export default FormConfigPanelUi;
