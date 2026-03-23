/**
 * ============================================
 * RentierGuard - Модуль генерации документов
 * Типы и интерфейсы
 * ============================================
 */

import { Buffer } from 'buffer';

/**
 * Типы документов
 */
export enum DocumentType {
  RESIDENTIAL_CONTRACT = 'residential_contract',    // Договор аренды жилого помещения
  COMMERCIAL_CONTRACT = 'commercial_contract',      // Договор аренды нежилого помещения
  ACT_TRANSFER = 'act_transfer',                    // Акт приема-передачи
  ACT_RETURN = 'act_return',                        // Акт возврата
  ADDENDUM = 'addendum',                            // Дополнительное соглашение
  CLAIM = 'claim',                                  // Претензия
  RECEIPT = 'receipt',                              // Квитанция об оплате
  NOTICE_TERMINATION = 'notice_termination',        // Уведомление о расторжении
  INVENTORY_LIST = 'inventory_list',                // Опись имущества
}

/**
 * Форматы экспорта
 */
export enum ExportFormat {
  DOCX = 'docx',
  PDF = 'pdf',
  CSV = 'csv',
}

/**
 * Данные арендодателя
 */
export interface LandlordData {
  fullName: string;           // ФИО полностью
  passportSeries: string;     // Серия паспорта
  passportNumber: string;     // Номер паспорта
  passportIssuedBy: string;   // Кем выдан
  passportIssueDate: string;  // Дата выдачи
  passportDepartmentCode: string; // Код подразделения
  registrationAddress: string; // Адрес регистрации
  phone: string;              // Телефон
  email?: string;             // Email
  inn?: string;               // ИНН (для ИП/юрлиц)
  ogrn?: string;              // ОГРН (для юрлиц)
  companyName?: string;       // Название компании (для юрлиц)
}

/**
 * Данные арендатора
 */
export interface TenantData {
  fullName: string;           // ФИО полностью
  passportSeries: string;     // Серия паспорта
  passportNumber: string;     // Номер паспорта
  passportIssuedBy: string;   // Кем выдан
  passportIssueDate: string;  // Дата выдачи
  passportDepartmentCode: string; // Код подразделения
  registrationAddress: string; // Адрес регистрации
  phone: string;              // Телефон
  email?: string;             // Email
  inn?: string;               // ИНН (для ИП/юрлиц)
  companyName?: string;       // Название компании (для юрлиц)
}

/**
 * Данные об объекте недвижимости
 */
export interface PropertyData {
  address: string;            // Полный адрес
  cadastralNumber?: string;   // Кадастровый номер
  propertyType: string;       // Тип: квартира, дом, офис и т.д.
  totalArea: number;          // Общая площадь
  livingArea?: number;        // Жилая площадь
  roomsCount?: number;        // Количество комнат
  floor?: number;             // Этаж
  totalFloors?: number;       // Всего этажей в доме
  description?: string;       // Описание
}

/**
 * Элемент инвентаризации
 */
export interface InventoryItem {
  name: string;               // Наименование
  quantity: number;           // Количество
  condition: string;          // Состояние
  description?: string;       // Описание/примечание
}

/**
 * Условия договора
 */
export interface ContractTerms {
  startDate: string;          // Дата начала
  endDate: string;            // Дата окончания
  monthlyRent: number;        // Ежемесячная арендная плата
  deposit: number;            // Залог
  paymentDay: number;         // День оплаты (число месяца)
  paymentMethod: string;      // Способ оплаты
  utilitiesIncluded: boolean; // Коммунальные включены
  utilitiesAmount?: number;   // Сумма коммунальных
  maxOccupants?: number;      // Максимальное количество проживающих
  petsAllowed?: boolean;      // Разрешены ли животные
  additionalTerms?: string;   // Дополнительные условия
}

/**
 * Данные для генерации документа
 */
export interface DocumentGenerationData {
  // Основные данные
  documentType: DocumentType;
  contractNumber?: string;
  contractDate?: string;
  
  // Стороны договора
  landlord: LandlordData;
  tenant: TenantData;
  
  // Объект
  property: PropertyData;
  
  // Условия
  terms: ContractTerms;
  
  // Инвентарь (для актов)
  inventory?: InventoryItem[];
  
  // Данные для допсоглашения
  addendumData?: {
    changeType: string;
    oldValue: string;
    newValue: string;
    reason?: string;
  };
  
  // Данные для претензии
  claimData?: {
    violationType: string;
    violationDescription: string;
    deadlineDays: number;
    claimAmount?: number;
  };
  
  // Дополнительные переменные
  additionalVariables?: Record<string, string | number | boolean>;
  
  // Текущая дата (автоматически)
  currentDate?: string;
}

/**
 * Результат генерации документа
 */
export interface GeneratedDocument {
  buffer: Buffer;             // Буфер с содержимым файла
  filename: string;           // Имя файла
  mimeType: string;           // MIME-тип
  size: number;               // Размер в байтах
  extension: string;          // Расширение файла
}

/**
 * Переменные шаблона
 */
export interface TemplateVariable {
  name: string;               // Имя переменной ({{variableName}})
  description: string;        // Описание на русском
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'table';
  required: boolean;          // Обязательная ли
  defaultValue?: string | number | boolean;
  example?: string;           // Пример значения
}

/**
 * Описание переменных шаблона по типу документа
 */
export type TemplateVariables = {
  [key in DocumentType]?: TemplateVariable[];
};

/**
 * Опции генерации PDF
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  landscape?: boolean;
  margin?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  printBackground?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

/**
 * Опции генерации DOCX
 */
export interface DOCXGenerationOptions {
  templatePath: string;
  outputPath?: string;
  compression?: 'DEFLATE' | 'STORE';
}

/**
 * Результат валидации
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Ошибка валидации
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Предупреждение валидации
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Данные для экспорта за год
 */
export interface YearExportData {
  year: number;
  format: ExportFormat;
  userId: number;
  includeContracts?: boolean;
  includePayments?: boolean;
  includeExpenses?: boolean;
}

/**
 * Конфигурация шаблона
 */
export interface TemplateConfig {
  type: DocumentType;
  name: string;
  description: string;
  filename: string;
  path: string;
  supportedFormats: ExportFormat[];
  variables: TemplateVariable[];
}

/**
 * Данные таблицы для шаблона
 */
export interface TemplateTable {
  headers: string[];
  rows: (string | number | boolean)[][];
}

/**
 * Параметры для FOR-LOOP в шаблоне
 */
export interface TemplateLoop {
  arrayName: string;
  itemName: string;
  indexName?: string;
}
