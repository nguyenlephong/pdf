import { FormField, PDFFormData } from '../types/FormField';

export interface PDFConfig {
  pdfFileName: string;
  formFields: FormField[];
  timestamp: string;
  version: string;
}

export class ConfigPDFService {
  /**
   * Export PDF file + JSON config separately
   */
  static async exportPDFWithConfig(
    pdfFile: File,
    formFields: FormField[]
  ): Promise<void> {
    try {
      // Create config object
      const config: PDFConfig = {
        pdfFileName: pdfFile.name,
        formFields: formFields,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Download original PDF file
      const pdfUrl = URL.createObjectURL(pdfFile);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = pdfFile.name;
      pdfLink.click();
      URL.revokeObjectURL(pdfUrl);

      // Download JSON config file
      const configBlob = new Blob([JSON.stringify(config, null, 2)], { 
        type: 'application/json' 
      });
      const configUrl = URL.createObjectURL(configBlob);
      const configLink = document.createElement('a');
      configLink.href = configUrl;
      configLink.download = `${pdfFile.name.replace('.pdf', '')}_config.json`;
      configLink.click();
      URL.revokeObjectURL(configUrl);

      console.log('Exported PDF and config files successfully');
    } catch (error) {
      console.error('Error exporting PDF with config:', error);
      throw error;
    }
  }

  /**
   * Import PDF file + JSON config
   */
  static async importPDFWithConfig(
    pdfFile: File,
    configFile: File
  ): Promise<{ pdfFile: File, formFields: FormField[] }> {
    try {
      // Read config file
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
      console.error('Error importing PDF with config:', error);
      throw error;
    }
  }

  /**
   * Load PDF and config from files
   */
  static async loadPDFWithConfig(
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
