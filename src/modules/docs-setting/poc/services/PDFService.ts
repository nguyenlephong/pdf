import { PDFDocument, PDFForm, PDFTextField, rgb } from 'pdf-lib';
import { FormField, PDFFormData } from '../types/FormField';

export class PDFService {
  /**
   * Generate a new PDF with form fields from the original PDF
   */
  static async generatePDFWithForm(
    originalPdfFile: File,
    formFields: FormField[]
  ): Promise<Uint8Array> {
    try {
      // Load the original PDF
      const existingPdfBytes = await originalPdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the form from the PDF
      const form = pdfDoc.getForm();
      
      // Clear any existing form fields
      const existingFields = form.getFields();
      existingFields.forEach(field => {
        form.removeField(field);
      });

      // Add new form fields
      const pages = pdfDoc.getPages();
      
      formFields.forEach(field => {
        // Get the page (assuming single page for now, can be extended)
        const page = pages[0]; // You might want to add page selection logic
        
        // Create text field
        const textField = form.createTextField(field.name);
        
        // Set field properties
        textField.setText(field.placeholder || '');
        
        // Add the field to the page
        const pageHeight = page.getHeight();
        textField.addToPage(page, {
          x: field.x,
          y: pageHeight - field.y - field.height, // PDF coordinates are from bottom
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          backgroundColor: rgb(1, 1, 1), // White background
          borderWidth: 1,
        });

        // Set field properties based on type
        // switch (field.type) {
        //   case 'date':
        //     textField.setPlaceholder('YYYY-MM-DD');
        //     break;
        //   case 'email':
        //     textField.setPlaceholder('example@email.com');
        //     break;
        //   case 'number':
        //     textField.setPlaceholder('Enter number');
        //     break;
        //   default:
        //     textField.setPlaceholder(field.placeholder || 'Enter text');
        // }
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error generating PDF with form:', error);
      throw error;
    }
  }

  /**
   * Fill form data into an existing PDF form
   */
  static async fillPDFForm(
    pdfFile: File,
    formData: PDFFormData
  ): Promise<Uint8Array> {
    try {
      // Load the PDF
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the form
      const form = pdfDoc.getForm();
      
      // Fill the form fields
      Object.entries(formData).forEach(([fieldName, value]) => {
        try {
          const field = form.getFieldMaybe(fieldName);
          if (field && field instanceof PDFTextField) {
            field.setText(String(value));
          }
        } catch (error) {
          console.warn(`Could not fill field ${fieldName}:`, error);
        }
      });

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error filling PDF form:', error);
      throw error;
    }
  }

  /**
   * Extract form field information from an existing PDF
   */
  static async extractFormFields(pdfFile: File): Promise<FormField[]> {
    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const extractedFields: FormField[] = [];
      
      fields.forEach(field => {
        if (field instanceof PDFTextField) {
          // Get field appearance to extract position and size
          // const appearance = field?.getDefaultAppearance();
          
          extractedFields.push({
            id: `extracted_${field.getName()}`,
            type: 'text', // Default type, could be enhanced
            label: field.getName(),
            name: field.getName(),
            x: 0, // Would need to extract from appearance
            y: 0, // Would need to extract from appearance
            width: 150, // Default width
            height: 30, // Default height
            fontSize: 12,
            color: '#000000',
            required: false,
            pageNumber: 1,
            // placeholder: field?.getPlaceholder() || ''
          });
        }
      });
      
      return extractedFields;
    } catch (error) {
      console.error('Error extracting form fields:', error);
      throw error;
    }
  }

  /**
   * Download PDF as file
   */
  static downloadPDF(pdfBytes: Uint8Array, filename: string = 'form.pdf') {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Create sample form data for testing
   */
  static createSampleFormData(formFields: FormField[]): PDFFormData {
    const sampleData: PDFFormData = {};
    
    formFields.forEach(field => {
      switch (field.type) {
        case 'text':
          sampleData[field.name] = `Sample ${field.label}`;
          break;
        case 'date':
          sampleData[field.name] = '2024-01-01';
          break;
        case 'number':
          sampleData[field.name] = '12345';
          break;
        case 'email':
          sampleData[field.name] = 'sample@example.com';
          break;
        default:
          sampleData[field.name] = `Sample ${field.label}`;
      }
    });
    
    return sampleData;
  }
}
