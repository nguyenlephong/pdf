import React, {useState} from "react";
import "./pdf.style.scss";
import PDFViewer from "./ui/pdf-viewer.ui";
import FormConfigPanel from "./ui/form-config-panel.ui";
import PDFFiller from "./ui/PDFFiller";
import {FormFieldBox, FormFieldSetting, PDFSettingData} from "./types/pdf-setting.type";
import {PDFSettingService} from "./services/pdf-setting.service";
import {Col, Row} from 'antd';

interface IProps {
  pdfUrl?: string; // CDN URL or local file path
  settingData?: PDFSettingData;
  onSaveSetting: (data: PDFSettingData) => void;
}

function PDFSettingPage(props: IProps) {
  const {pdfUrl, settingData, onSaveSetting} = props;
  const [pageActive, setPageActive] = useState<number>(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormFieldSetting[]>([]);
  const [selectedField, setSelectedField] = useState<FormFieldSetting | null>(null);
  
  React.useEffect(() => {
    console.log("PDF Docs Setting App received props:", props);
  }, [props]);
  
  React.useEffect(() => {
    if (pdfUrl) handlePDFLoad(pdfUrl);
  }, [pdfUrl]);
  
  React.useEffect(() => {
    if (settingData) {
      const formFieldLoaded = PDFSettingService.handleLoadPDFConfig(settingData);
      setFormFields(formFieldLoaded);
    }
  }, [settingData]);
  
  React.useEffect(() => {
    if (onSaveSetting) onSaveSetting({form_fields: formFields, ts: Date.now().toString(), name: 'testing.json', version: '1.0'});
  }, [formFields]);
  
  const handlePDFLoad = async (input: File | string) => {
    try {
      setPdfFile(null);
      setFormFields([]);
      setSelectedField(null);
      
      let pdfData: ArrayBuffer;
      
      // ✅ If input is a CDN URL
      if (typeof input === "string") {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to load PDF from URL: ${input}`);
        pdfData = await response.arrayBuffer();
        setPdfFile({name: input.split('/').pop() || "remote.pdf", url: input} as any);
      }
      // ✅ If input is a local File
      else {
        pdfData = await input.arrayBuffer();
        setPdfFile(input);
      }
      
      // Extract form fields (if any)
      const existingFields = await PDFSettingService.extractFormFields(pdfData);
      if (existingFields.length > 0) {
        setFormFields(existingFields);
      }
    } catch (error) {
      console.error("Error loading or extracting PDF:", error);
    }
  };
  
  const handleAddField = (field: FormFieldSetting) => {
    const dataFields = [...formFields, field]
      .sort((x, y) => x.meta?.ts - y.meta?.ts)
      .map((x, ind) => {
        return {...x, position: ind + 1};
      });
    
    setFormFields(dataFields);
  };
  
  const handleUpdateBoxField = (fieldId: string, updates: Partial<FormFieldBox>) => {
    setFormFields(
      formFields.map((field) => {
        if (field.id !== fieldId) return field;
        let fieldUpdate: FormFieldSetting = {...field}
        fieldUpdate.box = {...field.box, ...updates}
        return fieldUpdate;
      })
    );
    
    if (selectedField?.id === fieldId) {
      setSelectedField({
        ...selectedField,
        box: {...selectedField.box, ...updates}
      });
    }
  };
  
  const handleUpdateField = (fieldId: string, updates: Partial<FormFieldSetting>) => {
    setFormFields(
      formFields.map((field) => {
        if (field.id !== fieldId) return field;
        return {...field, ...updates};
      })
    );
    
    if (selectedField?.id === fieldId) {
      setSelectedField({
        ...selectedField,
        ...updates
      });
    }
  };
  
  const handleDeleteField = (fieldId: string) => {
    const fieldAfterDelete = formFields.filter((field) => field.id !== fieldId);
    setFormFields(fieldAfterDelete);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };
  
  const handleSelectField = (field: FormFieldSetting | null) => {
    setSelectedField(field);
  };
  
  const handleImportConfig = (fields: FormFieldSetting[]) => {
    setFormFields(fields);
    setSelectedField(null);
  };
  
  const handleLoadPDFWithConfig = (
    loadedPDF: File,
    loadedFields: FormFieldSetting[]
  ) => {
    setPdfFile(loadedPDF);
    setFormFields(loadedFields);
    setSelectedField(null);
  };
  
  return (
    <div className="mfe-pdf-setting-page">
      <Row className={"main-container"} gutter={24}>
        <Col xs={24} xl={12} xxl={16}>
          <div className="pdf-container">
            <PDFViewer
              pdfFile={pdfFile}
              setPageActive={setPageActive}
              formFields={formFields}
              onAddField={handleAddField}
              onSelectField={handleSelectField}
              selectedField={selectedField}
              onPDFLoad={handlePDFLoad}
              onUpdateBoxField={handleUpdateBoxField}
              onDeleteField={handleDeleteField}
            />
          </div>
        </Col>
        <Col xs={24} xl={12} xxl={8}>
          <div className="pdf-config-container">
            <FormConfigPanel
              selectedField={selectedField}
              formFields={formFields}
              pdfFile={pdfFile}
              pageActive={pageActive}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
              onSelectField={handleSelectField}
              onImportConfig={handleImportConfig}
              onLoadPDFWithConfig={handleLoadPDFWithConfig}
            />
            
            {1 < 0 && (
              <PDFFiller
                pdfFile={pdfFile}
                formFields={formFields}
                onPDFGenerated={(pdfBytes) => {
                  console.log("PDF generated:", pdfBytes.length, "bytes");
                }}
              />
            )}
          </div>
        </Col>
      </Row>
    
    
    </div>
  );
}

export default PDFSettingPage;
