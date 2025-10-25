import {FormFieldSetting, PDFSettingData} from "../types/pdf-setting.type";
import { pdfLogger } from '@/modules/docs-setting/pdf/services/logger.service';

export class PDFConfigService {
  
  static handleDownloadWithUrl = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name || "document.pdf";
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      pdfLogger.error("Download failed:", err);
    }
  };
  
  static handleDownload = async (config: PDFSettingData) => {
    // Download JSON config file
    const configBlob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const configUrl = URL.createObjectURL(configBlob);
    const configLink = document.createElement('a');
    configLink.href = configUrl;
    configLink.download = "config.json";
    configLink.click();
    URL.revokeObjectURL(configUrl);
  }
  
  static async exportConfig(formFields: FormFieldSetting[]): Promise<PDFSettingData> {
    try {
      return {
        name: "config.json",
        form_fields: formFields,
        ts: new Date().toISOString(),
        version: '1.0'
      };
    } catch (e) {
      return {
        name: "config.json",
        form_fields: [],
        ts: new Date().toISOString(),
        version: '1.0'
      };
    }
  }
  /**
   * Export PDF file + JSON config separately
   */
  static async exportPDFWithConfig(
    pdfFile: File,
    formFields: FormFieldSetting[]
  ): Promise<void> {
    try {
      // Create config object
      const config: PDFSettingData = {
        name: pdfFile.name,
        form_fields: formFields,
        ts: new Date().toISOString(),
        version: '1.0'
      };
      // @ts-ignore
      if (pdfFile?.url) {
        // @ts-ignore
        await this.handleDownloadWithUrl(pdfFile.url, pdfFile.name);
      } else {
        
        // Download original PDF file
        const pdfUrl = URL.createObjectURL(pdfFile);
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = pdfFile.name;
        pdfLink.click();
        URL.revokeObjectURL(pdfUrl);
      }

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
      
      pdfLogger.log('Exported PDF and config files successfully');
    } catch (error) {
      pdfLogger.error('Error exporting PDF with config:', error);
      throw error;
    }
  }

  /**
   * Import PDF file + JSON config
   */
  static async importPDFWithConfig(
    pdfFile: File,
    configFile: File
  ): Promise<{ pdfFile: File, form_fields: FormFieldSetting[] }> {
    try {
      // Read config file
      const configText = await configFile.text();
      const config: PDFSettingData = JSON.parse(configText);

      // Validate config
      if (!config.form_fields || !Array.isArray(config.form_fields)) {
        throw new Error('Invalid config format');
      }

      // Validate and clean form fields
      const validatedFields = config.form_fields.map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        font_size: field.font_size || 12,
        color: field.meta.color || '#000000',
        page_number: field.page_number || 1,
        position: field.position || 1,
        box: field.box,
        meta: field.meta,
      }));

      return {
        pdfFile,
        form_fields: validatedFields
      };
    } catch (error) {
      pdfLogger.error('Error importing PDF with config:', error)
      throw error;
    }
  }

  /**
   * Load PDF and config from files
   */
  static async loadPDFWithConfig(
    pdfFile: File,
    configText: string
  ): Promise<{ pdfFile: File, form_fields: FormFieldSetting[] }> {
    try {
      const config: PDFSettingData = JSON.parse(configText);

      // Validate config
      if (!config.form_fields || !Array.isArray(config.form_fields)) {
        throw new Error('Invalid config format');
      }

      // Validate and clean form fields
      const validatedFields = config.form_fields.map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random()}`,
        font_size: field.fontSize || 12,
        color: field.color || '#000000',
        position: field.position || 1,
        box: {
          x: field.x || 0,
          y: field.y || 0,
          width: field.width || 150,
          height: field.height || 30,
        },
        meta: {
          type: field.type || 'text',
          label: field.label || 'Imported Field',
          name: field.name || `field_${Date.now()}`,
          required: field.required || false,
          placeholder: field.placeholder || '',
          ts: field.ts || Date.now()
        },
        page_number: field.pageNumber || 1,
      }));

      return {
        pdfFile,
        form_fields: validatedFields
      };
    } catch (error) {
      pdfLogger.error('Error loading PDF with config:', error);
      throw error;
    }
  }

}
