import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FormField, PDFFormData } from '../types/FormField';

export class SimplePDFService {
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
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const page = pages[0];
      
      // Get fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Draw form field labels and input areas
      formFields.forEach(field => {
        // Draw field label
        page.drawText(field.label + ':', {
          x: field.x,
          y: page.getHeight() - field.y - 15,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        // Draw input box
        page.drawRectangle({
          x: field.x,
          y: page.getHeight() - field.y - field.height,
          width: field.width,
          height: field.height,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        
        // Draw placeholder text
        if (field.placeholder) {
          page.drawText(field.placeholder, {
            x: field.x + 5,
            y: page.getHeight() - field.y - field.height + 5,
            size: field.fontSize,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
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
      
      // Get the first page
      const pages = pdfDoc.getPages();
      const page = pages[0];
      
      // Get fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Fill the form fields with data
      Object.entries(formData).forEach(([fieldName, value]) => {
        // Find the field in the PDF (this is a simplified approach)
        // In a real implementation, you'd need to track field positions
        const y = 700; // This would need to be calculated based on field position
        const x = 100; // This would need to be calculated based on field position
        
        page.drawText(String(value), {
          x: x,
          y: y,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
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
    // For now, return empty array as extracting fields from PDF is complex
    return [];
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
