import React, {useState} from 'react';
import {PDFFormData} from '../types/form-field.type';
import {PDFSettingService} from "../services/pdf-setting.service";
import {FormFieldSetting} from "../types/pdf-setting.type";
import {Box, Button, Grid, TextField, Typography} from "@mui/material";

interface PDFFillerProps {
  pdfFile: File | null;
  formFields: FormFieldSetting[];
  onPDFGenerated: (pdfBytes: Uint8Array) => void;
}

const PdfFiller: React.FC<PDFFillerProps> = ({
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

  if (formFields.length === 0) {
    return (
      <div className="config-section">
        <h3>Fill PDF Form</h3>
        <p>Add form fields to the PDF to enable form filling.</p>
      </div>
    );
  }

  return (
    <Box className="config-section">
      <h3>Fill PDF Form</h3>
      
      <div className="form-group">
        <Button onClick={loadSampleData} variant={'contained'}>
          Load Sample Data
        </Button>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <input
            type="checkbox"
            checked={flattenForm}
            onChange={(e) => setFlattenForm(e.target.checked)}
            style={{ marginRight: '5px', width: 40 }}
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

      <DynamicForm formData={formData} formFields={formFields} handleFieldChange={handleFieldChange} />

      <div className="form-group">
        <Button
          onClick={generateFilledPDF}
          disabled={isLoading}
          variant={'outlined'}
        >
          {isLoading ? 'Generating...' : 
           flattenForm ? 'Generate Filled PDF (No Borders)' : 'Generate Filled PDF (With Borders)'}
        </Button>
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
    </Box>
  );
};

export default PdfFiller;

interface DynamicFormProps {
  formFields: FormFieldSetting[];
  formData: Record<string, any>;
  handleFieldChange: (name: string, value: any) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ formFields, formData, handleFieldChange }) => {
  return (
    <>
      {formFields.map((field) => (
        <Box key={field.id} sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            {field.label}{' '}
            {field.required && (
              <Typography component="span" color="error">
                *
              </Typography>
            )}
          </Typography>
          
          <Grid container rowSpacing={1} alignItems="center">
            <Grid size={2}>
              <Typography variant={'body1'}>Vị trí {field.position}</Typography>
            </Grid>
            
            <Grid size={10}>
              <TextField
                fullWidth
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                size="small"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>
      ))}
    </>
  );
};