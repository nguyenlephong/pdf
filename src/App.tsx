import React, { useState } from 'react';
import './App.css';
import PDFViewer from './components/PDFViewer';
import FormConfigPanel from './components/FormConfigPanel';
import PDFFiller from './components/PDFFiller';
import { FormField } from './types/FormField';
import { AdvancedPDFService as SimplePDFService } from './services/AdvancedPDFService';

function App(props: any) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  React.useEffect(() => {
    console.log('PDF Docs Setting App received props:', props);
  }, [props])
  
  const handlePDFLoad = async (file: File) => {
    setPdfFile(file);
    setFormFields([]);
    setSelectedField(null);
    
    // Try to extract existing form fields from PDF
    try {
      const existingFields = await SimplePDFService.extractFormFields(file);
      if (existingFields.length > 0) {
        setFormFields(existingFields);
      }
    } catch (error) {
      console.log('No existing form fields found or error extracting:', error);
    }
  };

  const handleAddField = (field: FormField) => {
    setFormFields([...formFields, field]);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setFormFields(formFields.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleSelectField = (field: FormField | null) => {
    setSelectedField(field);
  };

  const handleGeneratePDF = async () => {
    if (!pdfFile || formFields.length === 0) {
      alert('Please load a PDF and add form fields first');
      return;
    }

    try {
      const pdfBytes = await SimplePDFService.generatePDFWithForm(pdfFile, formFields);
      SimplePDFService.downloadPDF(pdfBytes, 'form-template.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };

  const handleLoadSamplePDF = (pdfBytes: Uint8Array) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], 'sample-contract.pdf', { type: 'application/pdf' });
    handlePDFLoad(file);
  };

  const handleImportConfig = (fields: FormField[]) => {
    setFormFields(fields);
    setSelectedField(null);
  };

  const handleLoadPDFWithConfig = (loadedPDF: File, loadedFields: FormField[]) => {
    setPdfFile(loadedPDF);
    setFormFields(loadedFields);
    setSelectedField(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF Form Builder</h1>
      </header>
      <div className="main-container">
        <div className="pdf-container">
          <PDFViewer 
            pdfFile={pdfFile}
            formFields={formFields}
            onAddField={handleAddField}
            onSelectField={handleSelectField}
            selectedField={selectedField}
            onPDFLoad={handlePDFLoad}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
          />
        </div>
        <div className="config-container">
          <FormConfigPanel
            selectedField={selectedField}
            formFields={formFields}
            pdfFile={pdfFile}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onSelectField={handleSelectField}
            onLoadSamplePDF={handleLoadSamplePDF}
            onImportConfig={handleImportConfig}
            onLoadPDFWithConfig={handleLoadPDFWithConfig}
          />
          
          <PDFFiller
            pdfFile={pdfFile}
            formFields={formFields}
            onPDFGenerated={(pdfBytes) => {
              console.log('PDF generated:', pdfBytes.length, 'bytes');
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;