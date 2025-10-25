import React from 'react';
import {CustomerAttributeData, FormFieldSetting, PDFSettingData, ToolSettingConfig} from '../types/pdf-setting.type';
import {PDFConfigService} from '../services/config-pdf.service';
import FieldItemSettingUI from './form-field-setting.ui';
import {Box, Grid, Button} from "@mui/material";
import { pdfLogger } from '@/modules/docs-setting/pdf/services/logger.service';
import {useTranslation} from "react-i18next";

interface FormConfigPanelProps {
  config?: ToolSettingConfig;
  selectedField: FormFieldSetting | null;
  attributes?: CustomerAttributeData[];
  formFields: FormFieldSetting[];
  pageActive: number;
  setPageActive: (page: number) => void;
  pdfFile: File | null;
  onUpdateField: (fieldId: string, updates: Partial<FormFieldSetting>) => void;
  onDeleteField: (fieldId: string) => void;
  onSelectField: (field: FormFieldSetting) => void;
  onImportConfig: (fields: FormFieldSetting[]) => void;
  onLoadPDFWithConfig: (pdfFile: File, formFields: FormFieldSetting[]) => void;
  onSaveSetting?: (setting: PDFSettingData) => void;
}

const FormConfigPanelUi: React.FC<FormConfigPanelProps> = (props) => {
  const {
    attributes,
    selectedField,
    formFields,
    pdfFile,
    pageActive,
    setPageActive,
    onUpdateField,
    onImportConfig,
    config,
    onLoadPDFWithConfig,
    onSaveSetting
  } = props;
  
  const {t} = useTranslation();
  
  const childRefs = React.useRef<Record<string, { ref: {save: () => any}, field: FormFieldSetting }>>({});
  
  // @ts-ignore
  const handleFieldUpdate = (field: FormFieldSetting, value: any) => {
    if (!field) return;
    onUpdateField(field.id, {...value});
  };
  
  const handleSaveAll = async () => {
    const results = Object.entries(childRefs.current).map(([id, data]) => ({
      id,
      data: data?.ref?.save(),
      field: data.field
    }));

    const isErr = results.some((res) => res.data === -1);
    if (isErr) {
      let firstError = results.find(x=> x.data === -1);
      pdfLogger.error("❌ Please fix errors in form fields before saving.", firstError);
      if (firstError?.field?.page_number) setPageActive(firstError?.field?.page_number);
      return;
    }
    
    let configExport: PDFSettingData = {
      name: "config.json",
      form_fields: results.map(x => x.data),
      ts: new Date().toISOString(),
      version: '1.0'
    };
    if (onSaveSetting) onSaveSetting(configExport);
  };
  
  return (
    <div className="pdf-config-panel">
      <div className={'f-between'}>
        <h2>{t('modules.docs_setting.pdf.field_opts.text.conf_title')}</h2>
        {formFields.length > 0 && (
          <Button onClick={handleSaveAll} variant="contained">
            {t('common.save')}
          </Button>
        )}
      </div>
      <Grid container rowSpacing={2} sx={{mt: 3}}>
        {formFields
          .sort((x, y) => x.meta.ts - y.meta.ts)
          .map((x, ind) => {
            return {...x, position: x.position || ind + 1};
          })
          .map((field: FormFieldSetting) => {
            return (
              <Grid size={12} key={field.id} style={{display: field.page_number !== pageActive ? 'none': 'unset'}}>
                <FieldItemSettingUI
                  /*@ts-ignore*/
                  ref={(r) => (childRefs.current[field.id] = {ref: r, field})}
                  attributes={attributes}
                  data={field}
                  selectedField={selectedField}
                  onChange={(v) => handleFieldUpdate(field, v)}/>
              </Grid>
            )
          })}
      </Grid>
      
      {config?.enableExportToolBox && (
        <Box sx={{mt: 3}}>
          <div className="config-section">
            <h3>PDF Actions</h3>
            
            <Button
              sx={{ml: 2, mt: 2}}
              variant={'outlined'}
              onClick={async () => {
                if (!pdfFile || formFields.length === 0) {
                  pdfLogger.log('Please load a PDF and add form fields first');
                  return;
                }
                try {
                  await PDFConfigService.exportPDFWithConfig(pdfFile, formFields);
                } catch (error) {
                  pdfLogger.error('Export error:', error);
                }
              }}
              disabled={formFields.length === 0 || !pdfFile}
            >
              Export PDF + Config
            </Button>
            
            <Button
              sx={{ml: 2, mt: 2}}
              variant={'outlined'}
              onClick={async () => {
                if (formFields.length === 0) {
                  pdfLogger.log('Please load a PDF and add form fields first');
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
              sx={{ml: 2, mt: 2}}
              variant={'outlined'}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.json';
                input.multiple = true;
                input.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files || files.length < 1) {
                    pdfLogger.log('Please select at least one file');
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
                      pdfLogger.log('PDF file selected. Please also select a JSON config file, or create new form fields.');
                      onLoadPDFWithConfig(pdfFile, []);
                    } else if (configFile) {
                      pdfLogger.log('Config file selected. Please also select the corresponding PDF file.');
                    }
                  } else if (files.length === 2) {
                    // Both files selected
                    if (!pdfFile || !configFile) {
                      pdfLogger.log('Please select one PDF file and one JSON config file');
                      return;
                    }
                    
                    try {
                      const {pdfFile: loadedPDF, form_fields: loadedFields} =
                        await PDFConfigService.importPDFWithConfig(pdfFile, configFile);
                      onLoadPDFWithConfig(loadedPDF, loadedFields);
                      pdfLogger.log(`Successfully loaded PDF with ${loadedFields.length} form fields`);
                    } catch (error) {
                      pdfLogger.error('Import error:', error);
                      pdfLogger.log('Error importing files');
                    }
                  } else {
                    pdfLogger.log('Please select maximum 2 files (one PDF and one JSON config)');
                  }
                };
                input.click();
              }}
            >
              Import PDF + Config
            </Button>
            
            <Button
              sx={{ml: 2, mt: 2}}
              variant={'outlined'}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (!files || files.length !== 1) {
                    pdfLogger.log('Please select one JSON config file');
                    return;
                  }
                  
                  const configFile = files[0];
                  if (!configFile.name.endsWith('.json') && configFile.type !== 'application/json') {
                    pdfLogger.log('Please select a valid JSON config file');
                    return;
                  }
                  
                  // Read and parse config
                  try {
                    const configText = await configFile.text();
                    const config = JSON.parse(configText);
                    
                    if (!config.form_fields || !Array.isArray(config.form_fields)) {
                      pdfLogger.log('Invalid config format. Config must contain formFields array.');
                      return;
                    }
                    
                    onImportConfig(config.form_fields);
                    pdfLogger.log(`Successfully imported ${config.form_fields.length} form fields from config. Please load the corresponding PDF file.`);
                  } catch (error) {
                    pdfLogger.error('Config import error:', error);
                  }
                };
                input.click();
              }}
            >
              Import Config Only
            </Button>
          </div>
        </Box>
      )}
    
    </div>
  );
};

export default FormConfigPanelUi;
