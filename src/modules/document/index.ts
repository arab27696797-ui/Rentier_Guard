/**
 * ============================================
 * RentierGuard - Модуль генерации документов
 * Главный файл экспорта
 * ============================================
 */

// ========== ТИПЫ ==========
export {
  // Enums
  DocumentType,
  ExportFormat,
  
  // Интерфейсы данных
  type LandlordData,
  type TenantData,
  type PropertyData,
  type InventoryItem,
  type ContractTerms,
  type DocumentGenerationData,
  type GeneratedDocument,
  type TemplateVariable,
  type TemplateVariables,
  type TemplateTable,
  type TemplateLoop,
  
  // Интерфейсы опций
  type PDFGenerationOptions,
  type DOCXGenerationOptions,
  
  // Интерфейсы валидации
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  
  // Интерфейсы экспорта
  type YearExportData,
  type TemplateConfig,
} from './types';

// ========== СЕРВИСЫ ==========
export {
  DOCXGeneratorService,
  docxGenerator,
} from './services/docxGenerator.service';

export {
  PDFGeneratorService,
  pdfGenerator,
} from './services/pdfGenerator.service';

export {
  TemplateService,
  templateService,
} from './services/template.service';

// ========== СЦЕНЫ ==========
export { exportYearScene } from './scenes/exportYear.scene';

// ========== СООБЩЕНИЯ ==========
export {
  documentMessages,
  exportYearMessages,
  documentGenerationMessages,
  templateMessages,
  inventoryMessages,
  commonMessages,
  formatFileSize,
  formatDate,
  formatCurrency,
} from './templates/messages';

// ========== ФАБРИКА ДОКУМЕНТОВ ==========

import {
  DocumentGenerationData,
  GeneratedDocument,
  DocumentType,
  ExportFormat,
} from './types';
import { docxGenerator } from './services/docxGenerator.service';
import { pdfGenerator } from './services/pdfGenerator.service';
import { templateService } from './services/template.service';

/**
 * Фабрика генерации документов
 * Упрощает создание документов разных типов и форматов
 */
export class DocumentFactory {
  /**
   * Генерирует документ указанного типа в указанном формате
   * @param data - Данные для генерации
   * @param format - Формат выходного файла
   * @returns Сгенерированный документ
   */
  public static async generate(
    data: DocumentGenerationData,
    format: ExportFormat = ExportFormat.DOCX
  ): Promise<GeneratedDocument> {
    // Валидация данных
    const validation = templateService.validateTemplateData(data);
    if (!validation.valid) {
      const errorMessage = templateService.formatValidationErrors(validation);
      throw new Error(errorMessage);
    }

    // Генерация в зависимости от формата
    switch (format) {
      case ExportFormat.DOCX:
        return this.generateDOCX(data);
      
      case ExportFormat.PDF:
        return this.generatePDF(data);
      
      default:
        throw new Error(`Неподдерживаемый формат: ${format}`);
    }
  }

  /**
   * Генерирует DOCX документ
   */
  private static async generateDOCX(
    data: DocumentGenerationData
  ): Promise<GeneratedDocument> {
    const templatePath = templateService.getTemplatePath(data.documentType);

    switch (data.documentType) {
      case DocumentType.RESIDENTIAL_CONTRACT:
      case DocumentType.COMMERCIAL_CONTRACT:
        return docxGenerator.generateContract(data, templatePath);
      
      case DocumentType.ACT_TRANSFER:
        return docxGenerator.generateAct(data, templatePath);
      
      case DocumentType.ACT_RETURN:
        return docxGenerator.generateReturnAct(data, templatePath);
      
      case DocumentType.ADDENDUM:
        return docxGenerator.generateAddendum(data, templatePath);
      
      case DocumentType.CLAIM:
        return docxGenerator.generateClaim(data, templatePath);
      
      case DocumentType.RECEIPT:
        return docxGenerator.generateReceipt(data, templatePath);
      
      default:
        throw new Error(`Неподдерживаемый тип документа для DOCX: ${data.documentType}`);
    }
  }

  /**
   * Генерирует PDF документ
   */
  private static async generatePDF(
    data: DocumentGenerationData
  ): Promise<GeneratedDocument> {
    switch (data.documentType) {
      case DocumentType.RESIDENTIAL_CONTRACT:
      case DocumentType.COMMERCIAL_CONTRACT:
        return pdfGenerator.generateContractPDF(data);
      
      case DocumentType.ACT_TRANSFER:
        return pdfGenerator.generateActPDF(data, false);
      
      case DocumentType.ACT_RETURN:
        return pdfGenerator.generateActPDF(data, true);
      
      case DocumentType.CLAIM:
        return pdfGenerator.generateClaimPDF(data);
      
      case DocumentType.RECEIPT:
        return pdfGenerator.generateReceiptPDF(data);
      
      default:
        throw new Error(`Неподдерживаемый тип документа для PDF: ${data.documentType}`);
    }
  }

  /**
   * Генерирует договор аренды
   */
  public static async generateContract(
    data: DocumentGenerationData,
    format: ExportFormat = ExportFormat.DOCX
  ): Promise<GeneratedDocument> {
    data.documentType = DocumentType.RESIDENTIAL_CONTRACT;
    return this.generate(data, format);
  }

  /**
   * Генерирует акт приема-передачи
   */
  public static async generateAct(
    data: DocumentGenerationData,
    isReturn: boolean = false,
    format: ExportFormat = ExportFormat.DOCX
  ): Promise<GeneratedDocument> {
    data.documentType = isReturn ? DocumentType.ACT_RETURN : DocumentType.ACT_TRANSFER;
    return this.generate(data, format);
  }

  /**
   * Генерирует дополнительное соглашение
   */
  public static async generateAddendum(
    data: DocumentGenerationData,
    format: ExportFormat = ExportFormat.DOCX
  ): Promise<GeneratedDocument> {
    data.documentType = DocumentType.ADDENDUM;
    return this.generate(data, format);
  }

  /**
   * Генерирует претензию
   */
  public static async generateClaim(
    data: DocumentGenerationData,
    format: ExportFormat = ExportFormat.DOCX
  ): Promise<GeneratedDocument> {
    data.documentType = DocumentType.CLAIM;
    return this.generate(data, format);
  }

  /**
   * Генерирует квитанцию
   */
  public static async generateReceipt(
    data: DocumentGenerationData,
    format: ExportFormat = ExportFormat.PDF
  ): Promise<GeneratedDocument> {
    data.documentType = DocumentType.RECEIPT;
    return this.generate(data, format);
  }
}

/**
 * Утилиты модуля документов
 */
export class DocumentUtils {
  /**
   * Проверяет поддерживается ли тип документа
   */
  public static isDocumentTypeSupported(type: DocumentType): boolean {
    return Object.values(DocumentType).includes(type);
  }

  /**
   * Проверяет поддерживается ли формат
   */
  public static isFormatSupported(format: ExportFormat): boolean {
    return Object.values(ExportFormat).includes(format);
  }

  /**
   * Возвращает список поддерживаемых форматов для типа документа
   */
  public static getSupportedFormats(type: DocumentType): ExportFormat[] {
    try {
      const config = templateService.getTemplateConfig(type);
      return config.supportedFormats;
    } catch {
      return [];
    }
  }

  /**
   * Возвращает название типа документа на русском
   */
  public static getDocumentTypeName(type: DocumentType): string {
    const names: Record<DocumentType, string> = {
      [DocumentType.RESIDENTIAL_CONTRACT]: 'Договор аренды жилого помещения',
      [DocumentType.COMMERCIAL_CONTRACT]: 'Договор аренды нежилого помещения',
      [DocumentType.ACT_TRANSFER]: 'Акт приема-передачи',
      [DocumentType.ACT_RETURN]: 'Акт возврата',
      [DocumentType.ADDENDUM]: 'Дополнительное соглашение',
      [DocumentType.CLAIM]: 'Претензия',
      [DocumentType.RECEIPT]: 'Квитанция об оплате',
      [DocumentType.NOTICE_TERMINATION]: 'Уведомление о расторжении',
      [DocumentType.INVENTORY_LIST]: 'Опись имущества',
    };
    return names[type] || 'Неизвестный тип документа';
  }

  /**
   * Возвращает расширение файла по формату
   */
  public static getFileExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      [ExportFormat.DOCX]: 'docx',
      [ExportFormat.PDF]: 'pdf',
      [ExportFormat.CSV]: 'csv',
    };
    return extensions[format] || 'bin';
  }

  /**
   * Возвращает MIME-тип по формату
   */
  public static getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      [ExportFormat.DOCX]: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      [ExportFormat.PDF]: 'application/pdf',
      [ExportFormat.CSV]: 'text/csv; charset=utf-8',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}

// Экспорт фабрики и утилит по умолчанию
export default {
  DocumentFactory,
  DocumentUtils,
  docxGenerator,
  pdfGenerator,
  templateService,
};
