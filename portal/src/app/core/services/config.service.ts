import { Injectable } from '@angular/core';
import { FormField, PDFConfig } from '../models/form-field.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  /**
   * Export PDF file + JSON config separately
   */
  async exportPDFWithConfig(
    pdfFile: File,
    formFields: FormField[]
  ): Promise<void> {
    try {
      const config: PDFConfig = {
        formFields: formFields,
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        version: '1.0.0'
      };

      // Create and download PDF file
      const pdfBlob = new Blob([pdfFile], { type: 'application/pdf' });
      this.downloadFile(pdfBlob, 'form-template.pdf');

      // Create and download config file
      const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      this.downloadFile(configBlob, 'form-config.json');

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Import PDF and config from files
   */
  async importPDFWithConfig(
    pdfFile: File,
    configFile: File
  ): Promise<{ pdfFile: File, formFields: FormField[] }> {
    try {
      const configText = await configFile.text();
      const config: PDFConfig = JSON.parse(configText);

      // Validate config
      if (!config.formFields || !Array.isArray(config.formFields)) {
        throw new Error('Invalid config format');
      }

      // Validate and clean form fields
      const validatedFields = config.formFields.map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        type: field.type || 'text',
        label: field.label || 'Imported Field',
        name: field.name || `field_${Date.now()}`,
        x: field.x || 0,
        y: field.y || 0,
        width: field.width || 150,
        height: field.height || 30,
        fontSize: field.fontSize || 12,
        color: field.color || '#000000',
        required: field.required || false,
        placeholder: field.placeholder || '',
        pageNumber: field.pageNumber || 1
      }));

      return {
        pdfFile,
        formFields: validatedFields
      };
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  /**
   * Load PDF and config from files
   */
  async loadPDFWithConfig(
    pdfFile: File,
    configText: string
  ): Promise<{ pdfFile: File, formFields: FormField[] }> {
    try {
      const config: PDFConfig = JSON.parse(configText);

      // Validate config
      if (!config.formFields || !Array.isArray(config.formFields)) {
        throw new Error('Invalid config format');
      }

      // Validate and clean form fields
      const validatedFields = config.formFields.map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        type: field.type || 'text',
        label: field.label || 'Imported Field',
        name: field.name || `field_${Date.now()}`,
        x: field.x || 0,
        y: field.y || 0,
        width: field.width || 150,
        height: field.height || 30,
        fontSize: field.fontSize || 12,
        color: field.color || '#000000',
        required: field.required || false,
        placeholder: field.placeholder || '',
        pageNumber: field.pageNumber || 1
      }));

      return {
        pdfFile,
        formFields: validatedFields
      };
    } catch (error) {
      console.error('Error loading PDF with config:', error);
      throw error;
    }
  }

  /**
   * Download a file
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Create sample form data for testing
   */
  createSampleFormData(formFields: FormField[]): { [key: string]: string | number } {
    const sampleData: { [key: string]: string | number } = {};
    
    formFields.forEach(field => {
      switch (field.type) {
        case 'text':
          sampleData[field.name] = `Sample ${field.label}`;
          break;
        case 'email':
          sampleData[field.name] = 'sample@example.com';
          break;
        case 'date':
          sampleData[field.name] = new Date().toISOString().split('T')[0];
          break;
        case 'number':
          sampleData[field.name] = Math.floor(Math.random() * 1000);
          break;
        default:
          sampleData[field.name] = `Sample ${field.label}`;
      }
    });
    
    return sampleData;
  }
}
