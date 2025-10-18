import { PDFDocument, PDFForm, PDFTextField, rgb, StandardFonts } from 'pdf-lib';
import { FormField, PDFFormData } from '../types/FormField';

export class AdvancedPDFService {
  /**
   * Generate a new PDF with actual form fields from the original PDF
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

      // Get fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Add new form fields
      const pages = pdfDoc.getPages();
      
      formFields.forEach(field => {
        // Get the page based on page number (0-based index)
        const pageIndex = Math.max(0, Math.min(field.pageNumber - 1, pages.length - 1));
        const page = pages[pageIndex]; 
        
        // Create text field
        const textField = form.createTextField(field.name);
        
        // Set field properties
        textField.setText(field.placeholder || '');
        
        // Add the field to the page with proper positioning
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
   * Fill form data and flatten the form (remove borders, keep only text content)
   */
  static async fillAndFlattenPDFForm(
    pdfFile: File,
    formData: PDFFormData,
    formFields?: FormField[] // Add original form fields to get page info
  ): Promise<Uint8Array> {
    try {
      // Load the PDF
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the form
      const form = pdfDoc.getForm();
      
      // Fill the form fields first
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

      // Create a map of field names to page numbers if formFields is provided
      const fieldPageMap = new Map<string, number>();
      if (formFields) {
        formFields.forEach(field => {
          fieldPageMap.set(field.name, field.pageNumber);
        });
      }

      // Flatten the form - remove form field properties and keep only text content
      const fields = form.getFields();
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      for (const field of fields) {
        try {
          // Get the field's text content
          const text = field instanceof PDFTextField ? field.getText() : '';
          
          // Get the field's position and page before removing it
          if (text) {
            const widgets = field.acroField.getWidgets();
            if (widgets.length > 0) {
              const widget = widgets[0];
              const rect = widget.getRectangle();
              
              // Find the correct page for this field
              let targetPage = null;
              
              // First try to get page from our field page map
              const fieldName = field.getName();
              const pageNumber = fieldPageMap.get(fieldName);
              if (pageNumber && pageNumber > 0 && pageNumber <= pages.length) {
                targetPage = pages[pageNumber - 1]; // Convert to 0-based index
              }
              
              // If not found in map, we'll use the fallback logic below
              
              // If we couldn't find the page, try to determine it by checking if the field name contains page info
              if (!targetPage) {
                const pageMatch = fieldName.match(/page[_-]?(\d+)/i);
                if (pageMatch) {
                  const pageNumber = parseInt(pageMatch[1]) - 1; // Convert to 0-based index
                  if (pageNumber >= 0 && pageNumber < pages.length) {
                    targetPage = pages[pageNumber];
                  }
                }
              }
              
              // If still no page found, use first page as fallback
              if (!targetPage && pages.length > 0) {
                targetPage = pages[0];
              }
              
              if (targetPage) {
                // Draw the text directly on the page
                targetPage.drawText(text, {
                  x: rect.x + 2, // Small padding from the border
                  y: rect.y + rect.height - 15, // Position text in the middle of the field
                  size: 12,
                  font: font,
                  color: rgb(0, 0, 0),
                });
              }
            }
          }
          
          // Remove the form field after extracting its content
          form.removeField(field);
        } catch (error) {
          console.warn(`Could not flatten field ${field.getName()}:`, error);
        }
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error filling and flattening PDF form:', error);
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
          // const appearance = field.getDefaultAppearance();
          
            // Try to determine which page this field is on
            const fieldPages = (field as any).getPages();
            const pageNumber = fieldPages.length > 0 ? fieldPages[0].getIndex() + 1 : 1;
            
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
              pageNumber: pageNumber,
              // placeholder: field.getPlaceholder() || ''
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
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
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
