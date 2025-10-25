import { Logger } from '@/core/logger/logger.service';

export class PDFLogger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!PDFLogger.instance) {
      PDFLogger.instance = Logger.getInstance('PDF');
    }
    return PDFLogger.instance;
  }
}

export const pdfLogger = PDFLogger.getInstance();
