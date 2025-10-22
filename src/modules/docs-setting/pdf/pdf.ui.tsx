import React, {useState} from "react";
import "./pdf.style.scss";
import PDFViewer from "./ui/PDFViewer";
import FormConfigPanel from "./ui/FormConfigPanel";
import PDFFiller from "./ui/PDFFiller";
import {FormField} from "./types/FormField";
import {AdvancedPDFService} from "./services/AdvancedPDFService";
import {Col, Row} from 'antd';

function PDFSettingPage(props: any) {
  const [pageActive, setPageActive] = useState<number>(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  
  React.useEffect(() => {
    console.log("PDF Docs Setting App received props:", props);
  }, [props]);
  
  const handlePDFLoad = async (file: File) => {
    setPdfFile(file);
    setFormFields([]);
    setSelectedField(null);
    
    // Try to extract existing form fields from PDF
    try {
      const existingFields = await AdvancedPDFService.extractFormFields(file);
      if (existingFields.length > 0) {
        setFormFields(existingFields);
      }
    } catch (error) {
      console.log("No existing form fields found or error extracting:", error);
    }
  };
  
  const handleAddField = (field: FormField) => {
    setFormFields([...formFields, field]);
  };
  
  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(
      formFields.map((field) =>
        field.id === fieldId ? {...field, ...updates} : field
      )
    );
    if (selectedField?.id === fieldId) {
      setSelectedField({...selectedField, ...updates});
    }
    console.log("formFields", formFields, fieldId);
  };
  
  const handleDeleteField = (fieldId: string) => {
    console.log("handleDeleteField", fieldId);
    const fieldAfterDelete = formFields.filter((field) => field.id !== fieldId);
    setFormFields(fieldAfterDelete);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };
  
  const handleSelectField = (field: FormField | null) => {
    setSelectedField(field);
  };
  
  const handleImportConfig = (fields: FormField[]) => {
    setFormFields(fields);
    setSelectedField(null);
  };
  
  const handleLoadPDFWithConfig = (
    loadedPDF: File,
    loadedFields: FormField[]
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
                onUpdateField={handleUpdateField}
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
              
              <PDFFiller
                pdfFile={pdfFile}
                formFields={formFields}
                onPDFGenerated={(pdfBytes) => {
                  console.log("PDF generated:", pdfBytes.length, "bytes");
                }}
              />
            </div>
          </Col>
        </Row>
      
      
    </div>
  );
}

export default PDFSettingPage;
