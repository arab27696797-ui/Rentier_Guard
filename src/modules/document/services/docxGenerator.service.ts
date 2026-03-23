/**
 * ============================================
 * RentierGuard - Сервис генерации DOCX документов
 * Использует библиотеку docx-templates
 * ============================================
 */

import { createReport } from 'docx-templates';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Buffer } from 'buffer';
import {
  DocumentGenerationData,
  GeneratedDocument,
  DocumentType,
  TemplateTable,
  InventoryItem,
} from '../types';

/**
 * Сервис генерации DOCX документов
 */
export class DOCXGeneratorService {
  /**
   * Генерирует договор аренды в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateContract(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      // Подготовка переменных для шаблона
      const variables = this.prepareContractVariables(data);
      
      // Генерация документа
      const buffer = await this.generateFromTemplate(templatePath, variables);
      
      // Формирование имени файла
      const filename = this.generateFilename('dogovor_arendy', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации договора аренды', error);
    }
  }

  /**
   * Генерирует акт приема-передачи в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateAct(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      // Подготовка переменных для шаблона
      const variables = this.prepareActVariables(data);
      
      // Генерация документа
      const buffer = await this.generateFromTemplate(templatePath, variables);
      
      // Формирование имени файла
      const filename = this.generateFilename('akt_priema_peredachi', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации акта приема-передачи', error);
    }
  }

  /**
   * Генерирует дополнительное соглашение в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateAddendum(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      if (!data.addendumData) {
        throw new Error('Отсутствуют данные для дополнительного соглашения');
      }

      // Подготовка переменных для шаблона
      const variables = this.prepareAddendumVariables(data);
      
      // Генерация документа
      const buffer = await this.generateFromTemplate(templatePath, variables);
      
      // Формирование имени файла
      const filename = this.generateFilename('dop_soglashenie', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации дополнительного соглашения', error);
    }
  }

  /**
   * Генерирует претензию в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateClaim(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      if (!data.claimData) {
        throw new Error('Отсутствуют данные для претензии');
      }

      // Подготовка переменных для шаблона
      const variables = this.prepareClaimVariables(data);
      
      // Генерация документа
      const buffer = await this.generateFromTemplate(templatePath, variables);
      
      // Формирование имени файла
      const filename = this.generateFilename('pretenziya', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации претензии', error);
    }
  }

  /**
   * Генерирует акт возврата помещения в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateReturnAct(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      // Подготовка переменных для шаблона
      const variables = this.prepareActVariables(data, true);
      
      // Генерация документа
      const buffer = await this.generateFromTemplate(templatePath, variables);
      
      // Формирование имени файла
      const filename = this.generateFilename('akt_vozvrata', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации акта возврата', error);
    }
  }

  /**
   * Генерирует квитанцию об оплате в формате DOCX
   * @param data - Данные для генерации
   * @param templatePath - Путь к шаблону
   * @returns Buffer с DOCX документом
   */
  public async generateReceipt(
    data: DocumentGenerationData,
    templatePath: string
  ): Promise<GeneratedDocument> {
    try {
      const variables = this.prepareReceiptVariables(data);
      const buffer = await this.generateFromTemplate(templatePath, variables);
      const filename = this.generateFilename('kvitanciya', data);
      
      return {
        buffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        extension: 'docx',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации квитанции', error);
    }
  }

  /**
   * Универсальный метод генерации из шаблона
   * @param templatePath - Путь к шаблону
   * @param variables - Переменные для подстановки
   * @returns Buffer с документом
   */
  private async generateFromTemplate(
    templatePath: string,
    variables: Record<string, unknown>
  ): Promise<Buffer> {
    try {
      // Проверка существования файла шаблона
      await fs.access(templatePath);

      // Генерация документа с помощью docx-templates
      const buffer = await createReport({
        template: templatePath,
        data: variables,
        cmdDelimiter: ['{{', '}}'],
        failFast: false,
        rejectNullish: false,
        errorHandler: (err: Error) => {
          console.warn('Предупреждение при генерации DOCX:', err.message);
          return '';
        },
      });

      return buffer;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Шаблон не найден: ${templatePath}`);
      }
      throw error;
    }
  }

  /**
   * Подготавливает переменные для договора аренды
   */
  private prepareContractVariables(data: DocumentGenerationData): Record<string, unknown> {
    const { landlord, tenant, property, terms } = data;
    const currentDate = new Date();

    return {
      // Данные договора
      contractNumber: data.contractNumber || 'б/н',
      contractDate: data.contractDate || this.formatDate(currentDate),
      
      // Данные арендодателя
      landlordName: landlord.fullName,
      landlordPassport: `${landlord.passportSeries} ${landlord.passportNumber}`,
      landlordPassportIssuedBy: landlord.passportIssuedBy,
      landlordPassportIssueDate: landlord.passportIssueDate,
      landlordPassportDepartmentCode: landlord.passportDepartmentCode,
      landlordAddress: landlord.registrationAddress,
      landlordPhone: landlord.phone,
      landlordEmail: landlord.email || '',
      landlordInn: landlord.inn || '',
      landlordCompany: landlord.companyName || '',
      
      // Данные арендатора
      tenantName: tenant.fullName,
      tenantPassport: `${tenant.passportSeries} ${tenant.passportNumber}`,
      tenantPassportIssuedBy: tenant.passportIssuedBy,
      tenantPassportIssueDate: tenant.passportIssueDate,
      tenantPassportDepartmentCode: tenant.passportDepartmentCode,
      tenantAddress: tenant.registrationAddress,
      tenantPhone: tenant.phone,
      tenantEmail: tenant.email || '',
      tenantInn: tenant.inn || '',
      tenantCompany: tenant.companyName || '',
      
      // Данные объекта
      propertyAddress: property.address,
      propertyCadastral: property.cadastralNumber || 'не указан',
      propertyType: property.propertyType,
      propertyTotalArea: property.totalArea,
      propertyLivingArea: property.livingArea || '',
      propertyRoomsCount: property.roomsCount || '',
      propertyFloor: property.floor || '',
      propertyTotalFloors: property.totalFloors || '',
      propertyDescription: property.description || '',
      
      // Условия договора
      startDate: terms.startDate,
      endDate: terms.endDate,
      monthlyRent: this.formatCurrency(terms.monthlyRent),
      monthlyRentWords: this.numberToWords(terms.monthlyRent),
      deposit: this.formatCurrency(terms.deposit),
      depositWords: this.numberToWords(terms.deposit),
      paymentDay: terms.paymentDay,
      paymentMethod: terms.paymentMethod,
      utilitiesIncluded: terms.utilitiesIncluded ? 'включены' : 'не включены',
      utilitiesAmount: terms.utilitiesAmount ? this.formatCurrency(terms.utilitiesAmount) : '',
      maxOccupants: terms.maxOccupants || '',
      petsAllowed: terms.petsAllowed ? 'разрешены' : 'запрещены',
      additionalTerms: terms.additionalTerms || '',
      
      // Текущая дата
      currentDate: this.formatDate(currentDate),
      currentDay: currentDate.getDate(),
      currentMonth: this.getMonthName(currentDate.getMonth()),
      currentYear: currentDate.getFullYear(),
      
      // Дополнительные переменные
      ...data.additionalVariables,
    };
  }

  /**
   * Подготавливает переменные для акта приема-передачи
   */
  private prepareActVariables(
    data: DocumentGenerationData,
    isReturn: boolean = false
  ): Record<string, unknown> {
    const { landlord, tenant, property } = data;
    const currentDate = new Date();

    // Подготовка таблицы инвентаря
    const inventoryTable = this.prepareInventoryTable(data.inventory || []);

    return {
      // Данные договора
      contractNumber: data.contractNumber || 'б/н',
      contractDate: data.contractDate || '',
      
      // Тип акта
      actType: isReturn ? 'возврата' : 'приема-передачи',
      
      // Данные объекта
      propertyAddress: property.address,
      propertyCadastral: property.cadastralNumber || 'не указан',
      propertyType: property.propertyType,
      propertyTotalArea: property.totalArea,
      
      // Стороны
      landlordName: landlord.fullName,
      tenantName: tenant.fullName,
      
      // Инвентарь
      inventoryTable,
      hasInventory: (data.inventory?.length || 0) > 0,
      inventoryCount: data.inventory?.length || 0,
      
      // Даты
      currentDate: this.formatDate(currentDate),
      transferDate: this.formatDate(currentDate),
      
      // Дополнительные переменные
      ...data.additionalVariables,
    };
  }

  /**
   * Подготавливает переменные для дополнительного соглашения
   */
  private prepareAddendumVariables(data: DocumentGenerationData): Record<string, unknown> {
    const { landlord, tenant, addendumData } = data;
    const currentDate = new Date();

    return {
      // Данные договора
      contractNumber: data.contractNumber || 'б/н',
      contractDate: data.contractDate || '',
      
      // Данные изменения
      changeType: addendumData!.changeType,
      oldValue: addendumData!.oldValue,
      newValue: addendumData!.newValue,
      changeReason: addendumData!.reason || '',
      
      // Стороны
      landlordName: landlord.fullName,
      tenantName: tenant.fullName,
      
      // Даты
      currentDate: this.formatDate(currentDate),
      addendumDate: this.formatDate(currentDate),
      
      // Дополнительные переменные
      ...data.additionalVariables,
    };
  }

  /**
   * Подготавливает переменные для претензии
   */
  private prepareClaimVariables(data: DocumentGenerationData): Record<string, unknown> {
    const { landlord, tenant, claimData, property } = data;
    const currentDate = new Date();

    // Расчет даты дедлайна
    const deadlineDate = new Date(currentDate);
    deadlineDate.setDate(deadlineDate.getDate() + claimData!.deadlineDays);

    return {
      // Данные договора
      contractNumber: data.contractNumber || 'б/н',
      contractDate: data.contractDate || '',
      
      // Данные нарушения
      violationType: claimData!.violationType,
      violationDescription: claimData!.violationDescription,
      deadlineDays: claimData!.deadlineDays,
      deadlineDate: this.formatDate(deadlineDate),
      claimAmount: claimData!.claimAmount ? this.formatCurrency(claimData!.claimAmount) : '',
      
      // Стороны
      landlordName: landlord.fullName,
      landlordAddress: landlord.registrationAddress,
      tenantName: tenant.fullName,
      tenantAddress: tenant.registrationAddress,
      
      // Объект
      propertyAddress: property.address,
      
      // Даты
      currentDate: this.formatDate(currentDate),
      claimDate: this.formatDate(currentDate),
      
      // Дополнительные переменные
      ...data.additionalVariables,
    };
  }

  /**
   * Подготавливает переменные для квитанции
   */
  private prepareReceiptVariables(data: DocumentGenerationData): Record<string, unknown> {
    const { landlord, tenant, terms } = data;
    const currentDate = new Date();

    return {
      // Данные оплаты
      paymentAmount: this.formatCurrency(terms.monthlyRent),
      paymentAmountWords: this.numberToWords(terms.monthlyRent),
      paymentPeriod: `${this.getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`,
      paymentPurpose: 'Арендная плата',
      
      // Стороны
      landlordName: landlord.fullName,
      tenantName: tenant.fullName,
      
      // Даты
      currentDate: this.formatDate(currentDate),
      receiptDate: this.formatDate(currentDate),
      
      // Дополнительные переменные
      ...data.additionalVariables,
    };
  }

  /**
   * Подготавливает таблицу инвентаря для шаблона
   */
  private prepareInventoryTable(inventory: InventoryItem[]): TemplateTable {
    return {
      headers: ['№', 'Наименование', 'Количество', 'Состояние', 'Примечание'],
      rows: inventory.map((item, index) => [
        index + 1,
        item.name,
        item.quantity,
        item.condition,
        item.description || '',
      ]),
    };
  }

  /**
   * Генерирует имя файла
   */
  private generateFilename(prefix: string, data: DocumentGenerationData): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const contractNum = data.contractNumber ? `_№${data.contractNumber}` : '';
    
    // Транслитерация для безопасного имени файла
    const addressShort = this.transliterate(
      data.property.address.split(',')[0].substring(0, 20)
    );
    
    return `${prefix}${contractNum}_${addressShort}_${dateStr}.docx`;
  }

  /**
   * Форматирует дату в русском формате
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Возвращает название месяца
   */
  private getMonthName(monthIndex: number): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    return months[monthIndex];
  }

  /**
   * Форматирует сумму в валюте
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Преобразует число в слова (упрощенная версия)
   */
  private numberToWords(num: number): string {
    // Упрощенная реализация - в продакшене использовать полноценную библиотеку
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 
                   'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 
                  'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 
                      'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    if (num === 0) return 'ноль рублей';

    const rubles = Math.floor(num);
    const kopecks = Math.round((num - rubles) * 100);

    let result = '';

    // Тысячи
    const thousands = Math.floor(rubles / 1000);
    if (thousands > 0) {
      result += this.convertThousands(thousands) + ' ';
    }

    // Единицы
    const remainder = rubles % 1000;
    if (remainder > 0) {
      const h = Math.floor(remainder / 100);
      const t = Math.floor((remainder % 100) / 10);
      const u = remainder % 10;

      if (h > 0) result += hundreds[h] + ' ';
      if (t === 1) {
        result += teens[u] + ' ';
      } else {
        if (t > 1) result += tens[t] + ' ';
        if (u > 0) result += units[u] + ' ';
      }
    }

    // Склонение "рубль"
    const lastTwo = rubles % 100;
    const lastOne = rubles % 10;
    if (lastTwo >= 11 && lastTwo <= 19) {
      result += 'рублей';
    } else if (lastOne === 1) {
      result += 'рубль';
    } else if (lastOne >= 2 && lastOne <= 4) {
      result += 'рубля';
    } else {
      result += 'рублей';
    }

    // Копейки
    if (kopecks > 0) {
      result += ` ${kopecks} коп.`;
    }

    return result.trim();
  }

  /**
   * Конвертирует тысячи
   */
  private convertThousands(num: number): string {
    const units = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
                   'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят',
                  'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];

    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (h > 0) {
      const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот',
                        'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
      result += hundreds[h] + ' ';
    }

    if (t === 1) {
      result += teens[u] + ' ';
    } else {
      if (t > 1) result += tens[t] + ' ';
      if (u > 0) result += units[u] + ' ';
    }

    // Склонение "тысяча"
    const lastTwo = num % 100;
    const lastOne = num % 10;
    if (lastTwo >= 11 && lastTwo <= 19) {
      result += 'тысяч';
    } else if (lastOne === 1) {
      result += 'тысяча';
    } else if (lastOne >= 2 && lastOne <= 4) {
      result += 'тысячи';
    } else {
      result += 'тысяч';
    }

    return result;
  }

  /**
   * Транслитерация русского текста
   */
  private transliterate(text: string): string {
    const map: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      ' ': '_', '-': '_', '.': '', ',': '', '/': '_', '\\': '_',
    };

    return text
      .toLowerCase()
      .split('')
      .map(char => map[char] || char)
      .join('')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Обработка ошибок
   */
  private handleError(message: string, error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DOCXGenerator] ${message}:`, errorMessage);
    return new Error(`${message}: ${errorMessage}`);
  }
}

// Экспорт singleton экземпляра
export const docxGenerator = new DOCXGeneratorService();
