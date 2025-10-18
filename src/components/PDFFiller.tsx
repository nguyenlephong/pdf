import React, { useState } from 'react';
import { FormField, PDFFormData } from '../types/FormField';
import { AdvancedPDFService } from '../services/AdvancedPDFService';
import { PDFService } from '../services/PDFService';

interface PDFFillerProps {
  pdfFile: File | null;
  formFields: FormField[];
  onPDFGenerated: (pdfBytes: Uint8Array) => void;
}

const PDFFiller: React.FC<PDFFillerProps> = ({
  pdfFile,
  formFields,
  onPDFGenerated
}) => {
  const [formData, setFormData] = useState<PDFFormData>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (fieldName: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const loadSampleData = () => {
    const sampleData = AdvancedPDFService.createSampleFormData(formFields);
    setFormData(sampleData);
  };

  const generateFilledPDF = async () => {
    if (!pdfFile || formFields.length === 0) {
      alert('Please load a PDF and add form fields first');
      return;
    }

    setIsLoading(true);
    try {
      // First generate PDF with form fields
      const pdfWithForm = await AdvancedPDFService.generatePDFWithForm(pdfFile, formFields);
      
      // Then fill the form with data
      const filledPdf = await AdvancedPDFService.fillPDFForm(
        new File([pdfWithForm], 'form.pdf', { type: 'application/pdf' }),
        formData
      );
      
      onPDFGenerated(filledPdf);
      AdvancedPDFService.downloadPDF(filledPdf, 'filled-form.pdf');
    } catch (error) {
      console.error('Error generating filled PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFormPDF = async () => {
    if (!pdfFile || formFields.length === 0) {
      alert('Please load a PDF and add form fields first');
      return;
    }

    setIsLoading(true);
    try {
      const pdfWithForm = await PDFService.generatePDFWithForm(pdfFile, formFields);
      onPDFGenerated(pdfWithForm);
      PDFService.downloadPDF(pdfWithForm, 'form-template.pdf');
    } catch (error) {
      console.error('Error generating form PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (formFields.length === 0) {
    return (
      <div className="config-section">
        <h3>Fill PDF Form</h3>
        <p>Add form fields to the PDF to enable form filling.</p>
      </div>
    );
  }

  return (
    <div className="config-section">
      <h3>Fill PDF Form</h3>
      
      <div className="form-group">
        <button 
          className="button"
          onClick={loadSampleData}
        >
          Load Sample Data
        </button>
        
        <button 
          className="button success"
          onClick={downloadFormPDF}
          disabled={isLoading}
        >
          Download Form Template
        </button>
      </div>

      {formFields.map(field => (
        <div key={field.id} className="form-group">
          <label>
            {field.label} {field.required && <span style={{color: 'red'}}>*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={{ width: '100%' }}
          />
        </div>
      ))}

      <div className="form-group">
        <button 
          className="button success"
          onClick={generateFilledPDF}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Filled PDF'}
        </button>
      </div>

      {Object.keys(formData).length > 0 && (
        <div className="form-group">
          <h4>Form Data Preview:</h4>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PDFFiller;
