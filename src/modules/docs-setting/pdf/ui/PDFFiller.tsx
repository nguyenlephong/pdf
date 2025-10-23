import React, {useState} from 'react';
import {PDFFormData} from '../types/form-field.type';
import {PDFSettingService} from "../services/pdf-setting.service";
import {PDFService} from '../services/pdf.service';
import {FormFieldSetting} from "../types/pdf-setting.type";

interface PDFFillerProps {
  pdfFile: File | null;
  formFields: FormFieldSetting[];
  onPDFGenerated: (pdfBytes: Uint8Array) => void;
}

const PDFFiller: React.FC<PDFFillerProps> = ({
  pdfFile,
  formFields,
  onPDFGenerated
}) => {
  const [formData, setFormData] = useState<PDFFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [flattenForm, setFlattenForm] = useState(true); // Default to flatten (no borders)

  const handleFieldChange = (fieldName: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const loadSampleData = () => {
    const sampleData = PDFSettingService.createSampleFormData(formFields);
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
      const pdfWithForm = await PDFSettingService.generatePDFWithForm(pdfFile, formFields);
      
      let filledPdf: Uint8Array;
      
      if (flattenForm) {
        // Fill the form with data and flatten (remove borders)
        filledPdf = await PDFSettingService.fillAndFlattenPDFForm(
          new File([new Uint8Array(pdfWithForm)], 'form.pdf', { type: 'application/pdf' }),
          formData,
          formFields // Pass formFields to get page information
        );
      } else {
        // Fill the form with data but keep borders
        filledPdf = await PDFSettingService.fillPDFForm(
          new File([new Uint8Array(pdfWithForm)], 'form.pdf', { type: 'application/pdf' }),
          formData
        );
      }
      
      onPDFGenerated(filledPdf);
      PDFSettingService.downloadPDF(filledPdf, 'filled-form.pdf');
    } catch (error) {
      console.error('Error generating filled PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  //@ts-ignore
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
        
    
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <input
            type="checkbox"
            checked={flattenForm}
            onChange={(e) => setFlattenForm(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          <span>
            <strong>Flatten form fields</strong> - Remove borders and keep only text content
            <br />
            <small style={{ color: '#666' }}>
              {flattenForm ? '✓ PDF will contain only text without form field borders' : '⚠ PDF will keep form field borders'}
            </small>
          </span>
        </label>
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
          {isLoading ? 'Generating...' : 
           flattenForm ? 'Generate Filled PDF (No Borders)' : 'Generate Filled PDF (With Borders)'}
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
