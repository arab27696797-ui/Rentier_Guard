/**
 * ============================================
 * RentierGuard - Сервис работы с шаблонами
 * Управление шаблонами документов и валидация
 * ============================================
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import {
  DocumentType,
  TemplateVariable,
  TemplateVariables,
  DocumentGenerationData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TemplateConfig,
  ExportFormat,
} from '../types';

/**
 * Базовый путь к шаблонам
 */
const TEMPLATES_BASE_PATH = path.resolve(process.cwd(), 'assets', 'templates');

/**
 * Описание переменных для каждого типа документа
 */
const TEMPLATE_VARIABLES: TemplateVariables = {
  [DocumentType.RESIDENTIAL_CONTRACT]: [
    // Данные договора
    { name: 'contractNumber', description: 'Номер договора', type: 'string', required: false, example: '123' },
    { name: 'contractDate', description: 'Дата договора', type: 'date', required: false, example: '01.01.2024' },
    
    // Арендодатель
    { name: 'landlordName', description: 'ФИО арендодателя', type: 'string', required: true, example: 'Иванов Иван Иванович' },
    { name: 'landlordPassport', description: 'Паспортные данные арендодателя', type: 'string', required: true, example: '4515 123456' },
    { name: 'landlordPassportIssuedBy', description: 'Кем выдан паспорт', type: 'string', required: true, example: 'ОВД г. Москвы' },
    { name: 'landlordPassportIssueDate', description: 'Дата выдачи паспорта', type: 'date', required: true, example: '01.01.2010' },
    { name: 'landlordPassportDepartmentCode', description: 'Код подразделения', type: 'string', required: true, example: '770-064' },
    { name: 'landlordAddress', description: 'Адрес регистрации арендодателя', type: 'string', required: true, example: 'г. Москва, ул. Ленина, д. 1' },
    { name: 'landlordPhone', description: 'Телефон арендодателя', type: 'string', required: true, example: '+7 (999) 123-45-67' },
    { name: 'landlordEmail', description: 'Email арендодателя', type: 'string', required: false, example: 'landlord@example.com' },
    { name: 'landlordInn', description: 'ИНН арендодателя', type: 'string', required: false, example: '123456789012' },
    { name: 'landlordCompany', description: 'Название компании арендодателя', type: 'string', required: false, example: 'ООО "Аренда"' },
    
    // Арендатор
    { name: 'tenantName', description: 'ФИО арендатора', type: 'string', required: true, example: 'Петров Петр Петрович' },
    { name: 'tenantPassport', description: 'Паспортные данные арендатора', type: 'string', required: true, example: '4515 654321' },
    { name: 'tenantPassportIssuedBy', description: 'Кем выдан паспорт арендатору', type: 'string', required: true, example: 'ОВД г. Санкт-Петербурга' },
    { name: 'tenantPassportIssueDate', description: 'Дата выдачи паспорта арендатору', type: 'date', required: true, example: '01.01.2015' },
    { name: 'tenantPassportDepartmentCode', description: 'Код подразделения', type: 'string', required: true, example: '780-024' },
    { name: 'tenantAddress', description: 'Адрес регистрации арендатора', type: 'string', required: true, example: 'г. Санкт-Петербург, ул. Пушкина, д. 10' },
    { name: 'tenantPhone', description: 'Телефон арендатора', type: 'string', required: true, example: '+7 (999) 987-65-43' },
    { name: 'tenantEmail', description: 'Email арендатора', type: 'string', required: false, example: 'tenant@example.com' },
    { name: 'tenantInn', description: 'ИНН арендатора', type: 'string', required: false, example: '987654321098' },
    { name: 'tenantCompany', description: 'Название компании арендатора', type: 'string', required: false, example: 'ООО "Тенант"' },
    
    // Объект
    { name: 'propertyAddress', description: 'Адрес объекта', type: 'string', required: true, example: 'г. Москва, ул. Арбат, д. 5, кв. 10' },
    { name: 'propertyCadastral', description: 'Кадастровый номер', type: 'string', required: false, example: '77:01:0001234:5678' },
    { name: 'propertyType', description: 'Тип объекта', type: 'string', required: true, example: 'квартира' },
    { name: 'propertyTotalArea', description: 'Общая площадь', type: 'number', required: true, example: '45.5' },
    { name: 'propertyLivingArea', description: 'Жилая площадь', type: 'number', required: false, example: '30.0' },
    { name: 'propertyRoomsCount', description: 'Количество комнат', type: 'number', required: false, example: '2' },
    { name: 'propertyFloor', description: 'Этаж', type: 'number', required: false, example: '5' },
    { name: 'propertyTotalFloors', description: 'Всего этажей', type: 'number', required: false, example: '9' },
    { name: 'propertyDescription', description: 'Описание объекта', type: 'string', required: false, example: 'С мебелью и техникой' },
    
    // Условия
    { name: 'startDate', description: 'Дата начала аренды', type: 'date', required: true, example: '01.02.2024' },
    { name: 'endDate', description: 'Дата окончания аренды', type: 'date', required: true, example: '01.02.2025' },
    { name: 'monthlyRent', description: 'Ежемесячная аренда (число)', type: 'number', required: true, example: '50000' },
    { name: 'monthlyRentWords', description: 'Ежемесячная аренда (прописью)', type: 'string', required: true, example: 'пятьдесят тысяч рублей' },
    { name: 'deposit', description: 'Залог (число)', type: 'number', required: true, example: '50000' },
    { name: 'depositWords', description: 'Залог (прописью)', type: 'string', required: true, example: 'пятьдесят тысяч рублей' },
    { name: 'paymentDay', description: 'День оплаты', type: 'number', required: true, example: '5' },
    { name: 'paymentMethod', description: 'Способ оплаты', type: 'string', required: true, example: 'банковский перевод' },
    { name: 'utilitiesIncluded', description: 'Коммунальные включены', type: 'string', required: true, example: 'не включены' },
    { name: 'utilitiesAmount', description: 'Сумма коммунальных', type: 'number', required: false, example: '5000' },
    { name: 'maxOccupants', description: 'Макс. количество проживающих', type: 'number', required: false, example: '3' },
    { name: 'petsAllowed', description: 'Животные разрешены', type: 'string', required: false, example: 'запрещены' },
    { name: 'additionalTerms', description: 'Дополнительные условия', type: 'string', required: false, example: 'Курение запрещено' },
    
    // Даты
    { name: 'currentDate', description: 'Текущая дата', type: 'date', required: true, example: '01.01.2024' },
    { name: 'currentDay', description: 'Текущий день', type: 'number', required: true, example: '1' },
    { name: 'currentMonth', description: 'Текущий месяц (название)', type: 'string', required: true, example: 'января' },
    { name: 'currentYear', description: 'Текущий год', type: 'number', required: true, example: '2024' },
  ],
  
  [DocumentType.ACT_TRANSFER]: [
    { name: 'contractNumber', description: 'Номер договора', type: 'string', required: true, example: '123' },
    { name: 'contractDate', description: 'Дата договора', type: 'date', required: true, example: '01.01.2024' },
    { name: 'actType', description: 'Тип акта (приема/возврата)', type: 'string', required: false, example: 'приема-передачи' },
    { name: 'propertyAddress', description: 'Адрес объекта', type: 'string', required: true, example: 'г. Москва, ул. Арбат, д. 5' },
    { name: 'propertyCadastral', description: 'Кадастровый номер', type: 'string', required: false, example: '77:01:0001234:5678' },
    { name: 'propertyType', description: 'Тип объекта', type: 'string', required: true, example: 'квартира' },
    { name: 'propertyTotalArea', description: 'Общая площадь', type: 'number', required: true, example: '45.5' },
    { name: 'landlordName', description: 'ФИО арендодателя', type: 'string', required: true, example: 'Иванов Иван Иванович' },
    { name: 'tenantName', description: 'ФИО арендатора', type: 'string', required: true, example: 'Петров Петр Петрович' },
    { name: 'inventoryTable', description: 'Таблица инвентаря', type: 'table', required: false },
    { name: 'hasInventory', description: 'Наличие инвентаря', type: 'boolean', required: false, example: 'true' },
    { name: 'inventoryCount', description: 'Количество позиций инвентаря', type: 'number', required: false, example: '5' },
    { name: 'currentDate', description: 'Текущая дата', type: 'date', required: true, example: '01.01.2024' },
    { name: 'transferDate', description: 'Дата передачи/возврата', type: 'date', required: true, example: '01.01.2024' },
  ],
  
  [DocumentType.ADDENDUM]: [
    { name: 'contractNumber', description: 'Номер договора', type: 'string', required: true, example: '123' },
    { name: 'contractDate', description: 'Дата договора', type: 'date', required: true, example: '01.01.2024' },
    { name: 'changeType', description: 'Тип изменения', type: 'string', required: true, example: 'изменение арендной платы' },
    { name: 'oldValue', description: 'Старое значение', type: 'string', required: true, example: '50000 руб.' },
    { name: 'newValue', description: 'Новое значение', type: 'string', required: true, example: '55000 руб.' },
    { name: 'changeReason', description: 'Причина изменения', type: 'string', required: false, example: 'индексация' },
    { name: 'landlordName', description: 'ФИО арендодателя', type: 'string', required: true, example: 'Иванов Иван Иванович' },
    { name: 'tenantName', description: 'ФИО арендатора', type: 'string', required: true, example: 'Петров Петр Петрович' },
    { name: 'currentDate', description: 'Текущая дата', type: 'date', required: true, example: '01.01.2024' },
    { name: 'addendumDate', description: 'Дата допсоглашения', type: 'date', required: true, example: '01.01.2024' },
  ],
  
  [DocumentType.CLAIM]: [
    { name: 'contractNumber', description: 'Номер договора', type: 'string', required: true, example: '123' },
    { name: 'contractDate', description: 'Дата договора', type: 'date', required: true, example: '01.01.2024' },
    { name: 'violationType', description: 'Вид нарушения', type: 'string', required: true, example: 'просрочка оплаты' },
    { name: 'violationDescription', description: 'Описание нарушения', type: 'string', required: true, example: 'Не оплачена аренда за январь' },
    { name: 'deadlineDays', description: 'Срок для устранения (дней)', type: 'number', required: true, example: '10' },
    { name: 'deadlineDate', description: 'Дата дедлайна', type: 'date', required: true, example: '15.01.2024' },
    { name: 'claimAmount', description: 'Сумма требования', type: 'number', required: false, example: '10000' },
    { name: 'landlordName', description: 'ФИО арендодателя', type: 'string', required: true, example: 'Иванов Иван Иванович' },
    { name: 'landlordAddress', description: 'Адрес арендодателя', type: 'string', required: true, example: 'г. Москва, ул. Ленина, д. 1' },
    { name: 'tenantName', description: 'ФИО арендатора', type: 'string', required: true, example: 'Петров Петр Петрович' },
    { name: 'tenantAddress', description: 'Адрес арендатора', type: 'string', required: true, example: 'г. Москва, ул. Арбат, д. 5' },
    { name: 'propertyAddress', description: 'Адрес объекта', type: 'string', required: true, example: 'г. Москва, ул. Арбат, д. 5' },
    { name: 'currentDate', description: 'Текущая дата', type: 'date', required: true, example: '01.01.2024' },
    { name: 'claimDate', description: 'Дата претензии', type: 'date', required: true, example: '01.01.2024' },
  ],
  
  [DocumentType.RECEIPT]: [
    { name: 'paymentAmount', description: 'Сумма оплаты', type: 'number', required: true, example: '50000' },
    { name: 'paymentAmountWords', description: 'Сумма прописью', type: 'string', required: true, example: 'пятьдесят тысяч рублей' },
    { name: 'paymentPeriod', description: 'Период оплаты', type: 'string', required: true, example: 'январь 2024' },
    { name: 'paymentPurpose', description: 'Назначение платежа', type: 'string', required: true, example: 'Арендная плата' },
    { name: 'landlordName', description: 'ФИО получателя', type: 'string', required: true, example: 'Иванов Иван Иванович' },
    { name: 'tenantName', description: 'ФИО плательщика', type: 'string', required: true, example: 'Петров Петр Петрович' },
    { name: 'currentDate', description: 'Текущая дата', type: 'date', required: true, example: '01.01.2024' },
    { name: 'receiptDate', description: 'Дата квитанции', type: 'date', required: true, example: '01.01.2024' },
  ],
};

/**
 * Конфигурации шаблонов
 */
const TEMPLATE_CONFIGS: Record<DocumentType, TemplateConfig> = {
  [DocumentType.RESIDENTIAL_CONTRACT]: {
    type: DocumentType.RESIDENTIAL_CONTRACT,
    name: 'Договор аренды жилого помещения',
    description: 'Стандартный договор аренды квартиры/дома',
    filename: 'contract_residential.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'contract_residential.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.RESIDENTIAL_CONTRACT] || [],
  },
  [DocumentType.COMMERCIAL_CONTRACT]: {
    type: DocumentType.COMMERCIAL_CONTRACT,
    name: 'Договор аренды нежилого помещения',
    description: 'Договор аренды офиса/магазина/склада',
    filename: 'contract_commercial.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'contract_commercial.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: [],
  },
  [DocumentType.ACT_TRANSFER]: {
    type: DocumentType.ACT_TRANSFER,
    name: 'Акт приема-передачи',
    description: 'Акт передачи помещения арендатору',
    filename: 'act_transfer.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'act_transfer.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.ACT_TRANSFER] || [],
  },
  [DocumentType.ACT_RETURN]: {
    type: DocumentType.ACT_RETURN,
    name: 'Акт возврата',
    description: 'Акт возврата помещения арендодателю',
    filename: 'act_return.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'act_return.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.ACT_TRANSFER] || [],
  },
  [DocumentType.ADDENDUM]: {
    type: DocumentType.ADDENDUM,
    name: 'Дополнительное соглашение',
    description: 'Допсоглашение к договору аренды',
    filename: 'addendum.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'addendum.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.ADDENDUM] || [],
  },
  [DocumentType.CLAIM]: {
    type: DocumentType.CLAIM,
    name: 'Претензия',
    description: 'Претензия к арендатору',
    filename: 'claim.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'claim.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.CLAIM] || [],
  },
  [DocumentType.RECEIPT]: {
    type: DocumentType.RECEIPT,
    name: 'Квитанция об оплате',
    description: 'Квитанция об оплате аренды',
    filename: 'receipt.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'receipt.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: TEMPLATE_VARIABLES[DocumentType.RECEIPT] || [],
  },
  [DocumentType.NOTICE_TERMINATION]: {
    type: DocumentType.NOTICE_TERMINATION,
    name: 'Уведомление о расторжении',
    description: 'Уведомление о расторжении договора',
    filename: 'notice_termination.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'notice_termination.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: [],
  },
  [DocumentType.INVENTORY_LIST]: {
    type: DocumentType.INVENTORY_LIST,
    name: 'Опись имущества',
    description: 'Перечень имущества в помещении',
    filename: 'inventory_list.docx',
    path: path.join(TEMPLATES_BASE_PATH, 'inventory_list.docx'),
    supportedFormats: [ExportFormat.DOCX, ExportFormat.PDF],
    variables: [],
  },
};

/**
 * Сервис работы с шаблонами
 */
export class TemplateService {
  /**
   * Возвращает путь к шаблону по типу документа
   * @param documentType - Тип документа
   * @returns Путь к файлу шаблона
   */
  public getTemplatePath(documentType: DocumentType): string {
    const config = TEMPLATE_CONFIGS[documentType];
    if (!config) {
      throw new Error(`Неизвестный тип документа: ${documentType}`);
    }
    return config.path;
  }

  /**
   * Возвращает список переменных для шаблона
   * @param documentType - Тип документа
   * @returns Массив переменных шаблона
   */
  public getTemplateVariables(documentType: DocumentType): TemplateVariable[] {
    return TEMPLATE_VARIABLES[documentType] || [];
  }

  /**
   * Возвращает конфигурацию шаблона
   * @param documentType - Тип документа
   * @returns Конфигурация шаблона
   */
  public getTemplateConfig(documentType: DocumentType): TemplateConfig {
    const config = TEMPLATE_CONFIGS[documentType];
    if (!config) {
      throw new Error(`Неизвестный тип документа: ${documentType}`);
    }
    return config;
  }

  /**
   * Возвращает все доступные шаблоны
   * @returns Массив конфигураций шаблонов
   */
  public getAllTemplates(): TemplateConfig[] {
    return Object.values(TEMPLATE_CONFIGS);
  }

  /**
   * Проверяет существование шаблона
   * @param documentType - Тип документа
   * @returns true если шаблон существует
   */
  public async templateExists(documentType: DocumentType): Promise<boolean> {
    try {
      const path = this.getTemplatePath(documentType);
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Валидирует данные для генерации документа
   * @param data - Данные для генерации
   * @param documentType - Тип документа (опционально, берется из data)
   * @returns Результат валидации
   */
  public validateTemplateData(
    data: DocumentGenerationData,
    documentType?: DocumentType
  ): ValidationResult {
    const type = documentType || data.documentType;
    const variables = this.getTemplateVariables(type);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Проверка обязательных полей
    for (const variable of variables) {
      if (variable.required) {
        const value = this.getNestedValue(data, variable.name);
        if (value === undefined || value === null || value === '') {
          errors.push({
            field: variable.name,
            message: `Обязательное поле "${variable.description}" не заполнено`,
            code: 'REQUIRED_FIELD_MISSING',
          });
        }
      }
    }

    // Проверка данных арендодателя
    if (!data.landlord) {
      errors.push({
        field: 'landlord',
        message: 'Данные арендодателя отсутствуют',
        code: 'LANDLORD_MISSING',
      });
    } else {
      this.validateLandlordData(data.landlord, errors, warnings);
    }

    // Проверка данных арендатора
    if (!data.tenant) {
      errors.push({
        field: 'tenant',
        message: 'Данные арендатора отсутствуют',
        code: 'TENANT_MISSING',
      });
    } else {
      this.validateTenantData(data.tenant, errors, warnings);
    }

    // Проверка данных объекта
    if (!data.property) {
      errors.push({
        field: 'property',
        message: 'Данные объекта отсутствуют',
        code: 'PROPERTY_MISSING',
      });
    } else {
      this.validatePropertyData(data.property, errors, warnings);
    }

    // Проверка условий договора
    if (!data.terms) {
      errors.push({
        field: 'terms',
        message: 'Условия договора отсутствуют',
        code: 'TERMS_MISSING',
      });
    } else {
      this.validateTermsData(data.terms, errors, warnings);
    }

    // Проверка специфичных данных
    if (type === DocumentType.ADDENDUM && !data.addendumData) {
      errors.push({
        field: 'addendumData',
        message: 'Данные для дополнительного соглашения отсутствуют',
        code: 'ADDENDUM_DATA_MISSING',
      });
    }

    if (type === DocumentType.CLAIM && !data.claimData) {
      errors.push({
        field: 'claimData',
        message: 'Данные для претензии отсутствуют',
        code: 'CLAIM_DATA_MISSING',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Валидирует данные арендодателя
   */
  private validateLandlordData(
    landlord: DocumentGenerationData['landlord'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!landlord.fullName || landlord.fullName.length < 5) {
      errors.push({
        field: 'landlord.fullName',
        message: 'ФИО арендодателя должно содержать минимум 5 символов',
        code: 'INVALID_LANDLORD_NAME',
      });
    }

    if (!landlord.passportSeries || !/^\d{4}$/.test(landlord.passportSeries)) {
      errors.push({
        field: 'landlord.passportSeries',
        message: 'Серия паспорта арендодателя должна содержать 4 цифры',
        code: 'INVALID_LANDLORD_PASSPORT_SERIES',
      });
    }

    if (!landlord.passportNumber || !/^\d{6}$/.test(landlord.passportNumber)) {
      errors.push({
        field: 'landlord.passportNumber',
        message: 'Номер паспорта арендодателя должен содержать 6 цифр',
        code: 'INVALID_LANDLORD_PASSPORT_NUMBER',
      });
    }

    if (!landlord.phone || landlord.phone.length < 10) {
      warnings.push({
        field: 'landlord.phone',
        message: 'Телефон арендодателя выглядит некорректно',
        suggestion: 'Укажите телефон в формате +7 (XXX) XXX-XX-XX',
      });
    }
  }

  /**
   * Валидирует данные арендатора
   */
  private validateTenantData(
    tenant: DocumentGenerationData['tenant'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!tenant.fullName || tenant.fullName.length < 5) {
      errors.push({
        field: 'tenant.fullName',
        message: 'ФИО арендатора должно содержать минимум 5 символов',
        code: 'INVALID_TENANT_NAME',
      });
    }

    if (!tenant.passportSeries || !/^\d{4}$/.test(tenant.passportSeries)) {
      errors.push({
        field: 'tenant.passportSeries',
        message: 'Серия паспорта арендатора должна содержать 4 цифры',
        code: 'INVALID_TENANT_PASSPORT_SERIES',
      });
    }

    if (!tenant.passportNumber || !/^\d{6}$/.test(tenant.passportNumber)) {
      errors.push({
        field: 'tenant.passportNumber',
        message: 'Номер паспорта арендатора должен содержать 6 цифр',
        code: 'INVALID_TENANT_PASSPORT_NUMBER',
      });
    }

    if (!tenant.phone || tenant.phone.length < 10) {
      warnings.push({
        field: 'tenant.phone',
        message: 'Телефон арендатора выглядит некорректно',
        suggestion: 'Укажите телефон в формате +7 (XXX) XXX-XX-XX',
      });
    }
  }

  /**
   * Валидирует данные объекта
   */
  private validatePropertyData(
    property: DocumentGenerationData['property'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!property.address || property.address.length < 10) {
      errors.push({
        field: 'property.address',
        message: 'Адрес объекта должен содержать минимум 10 символов',
        code: 'INVALID_PROPERTY_ADDRESS',
      });
    }

    if (!property.propertyType) {
      errors.push({
        field: 'property.propertyType',
        message: 'Тип объекта не указан',
        code: 'PROPERTY_TYPE_MISSING',
      });
    }

    if (!property.totalArea || property.totalArea <= 0) {
      errors.push({
        field: 'property.totalArea',
        message: 'Общая площадь должна быть больше 0',
        code: 'INVALID_PROPERTY_AREA',
      });
    }

    if (property.cadastralNumber && !/^[\d:]+$/.test(property.cadastralNumber)) {
      warnings.push({
        field: 'property.cadastralNumber',
        message: 'Кадастровый номер имеет нестандартный формат',
        suggestion: 'Проверьте правильность кадастрового номера',
      });
    }
  }

  /**
   * Валидирует условия договора
   */
  private validateTermsData(
    terms: DocumentGenerationData['terms'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!terms.startDate) {
      errors.push({
        field: 'terms.startDate',
        message: 'Дата начала аренды не указана',
        code: 'START_DATE_MISSING',
      });
    }

    if (!terms.endDate) {
      errors.push({
        field: 'terms.endDate',
        message: 'Дата окончания аренды не указана',
        code: 'END_DATE_MISSING',
      });
    }

    if (terms.startDate && terms.endDate) {
      const start = new Date(terms.startDate);
      const end = new Date(terms.endDate);
      if (end <= start) {
        errors.push({
          field: 'terms.endDate',
          message: 'Дата окончания должна быть позже даты начала',
          code: 'INVALID_DATE_RANGE',
        });
      }
    }

    if (!terms.monthlyRent || terms.monthlyRent <= 0) {
      errors.push({
        field: 'terms.monthlyRent',
        message: 'Арендная плата должна быть больше 0',
        code: 'INVALID_RENT_AMOUNT',
      });
    }

    if (terms.deposit === undefined || terms.deposit < 0) {
      errors.push({
        field: 'terms.deposit',
        message: 'Залог не может быть отрицательным',
        code: 'INVALID_DEPOSIT',
      });
    }

    if (!terms.paymentDay || terms.paymentDay < 1 || terms.paymentDay > 31) {
      warnings.push({
        field: 'terms.paymentDay',
        message: 'День оплаты должен быть от 1 до 31',
        suggestion: 'Укажите корректный день месяца',
      });
    }
  }

  /**
   * Получает вложенное значение из объекта по имени поля
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let value: unknown = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = (value as Record<string, unknown>)[key];
    }
    
    return value;
  }

  /**
   * Форматирует список ошибок в читаемый вид
   * @param result - Результат валидации
   * @returns Отформатированное сообщение об ошибках
   */
  public formatValidationErrors(result: ValidationResult): string {
    if (result.valid) {
      return '✅ Все данные корректны';
    }

    let message = '❌ Обнаружены ошибки:\n\n';
    
    result.errors.forEach((error, index) => {
      message += `${index + 1}. ${error.message}\n`;
    });

    if (result.warnings.length > 0) {
      message += '\n⚠️ Предупреждения:\n\n';
      result.warnings.forEach((warning, index) => {
        message += `${index + 1}. ${warning.message}`;
        if (warning.suggestion) {
          message += ` (${warning.suggestion})`;
        }
        message += '\n';
      });
    }

    return message;
  }

  /**
   * Возвращает пример данных для заполнения шаблона
   * @param documentType - Тип документа
   * @returns Объект с примерами значений
   */
  public getExampleData(documentType: DocumentType): Record<string, unknown> {
    const variables = this.getTemplateVariables(documentType);
    const example: Record<string, unknown> = {};

    for (const variable of variables) {
      if (variable.example !== undefined) {
        example[variable.name] = variable.example;
      } else if (variable.defaultValue !== undefined) {
        example[variable.name] = variable.defaultValue;
      }
    }

    return example;
  }
}

// Экспорт singleton экземпляра
export const templateService = new TemplateService();
