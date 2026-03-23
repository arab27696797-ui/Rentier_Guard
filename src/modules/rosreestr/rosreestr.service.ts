/**
 * Сервис бизнес-логики модуля Росреестра
 * RentierGuard Bot
 */

import {
  ChecklistItem,
  ContractData,
  RegistrationCheckResult,
  RegistrationGuide,
  RosreestrChecklist,
} from '../types';
import {
  BASE_CHECKLIST_ITEMS,
  LEGAL_ENTITY_DOCUMENTS,
  REGISTRATION_GUIDE,
  PAYMENT_DETAILS,
  DOCUMENT_REQUIREMENTS,
} from '../content/checklistData';

/**
 * Сервис для работы с Росреестром
 */
export class RosreestrService {
  /**
   * Проверяет, требуется ли регистрация договора
   * @param contractDuration - срок договора в месяцах
   * @returns Результат проверки с пояснением
   */
  static isRegistrationRequired(contractDuration: number): RegistrationCheckResult {
    // Срок более 12 месяцев (1 года) требует регистрации
    if (contractDuration > 12) {
      return {
        required: true,
        reason: `Срок договора ${contractDuration} месяцев (${Math.floor(contractDuration / 12)} лет ${contractDuration % 12} мес.) превышает 1 год. Согласно ст. 651 ГК РФ, такой договор подлежит обязательной государственной регистрации.`,
        lawReference: 'Ст. 651 ГК РФ, п. 2 ст. 674 ГК РФ',
      };
    }

    // Договор на 1 год (12 месяцев) - граничный случай
    if (contractDuration === 12) {
      return {
        required: true,
        reason: 'Договор на срок ровно 1 год также подлежит регистрации, так как закон требует регистрации для договоров "на срок не менее года".',
        lawReference: 'Ст. 651 ГК РФ',
      };
    }

    // Срок менее 1 года - регистрация не требуется
    return {
      required: false,
      reason: `Срок договора ${contractDuration} месяцев менее 1 года. Регистрация в Росреестре не требуется. Договор вступает в силу с момента подписания сторонами.`,
      lawReference: 'Ст. 651 ГК РФ',
    };
  }

  /**
   * Получает список необходимых документов на основе данных договора
   * @param contractData - данные договора
   * @returns Массив пунктов чек-листа
   */
  static getRequiredDocuments(contractData: ContractData): ChecklistItem[] {
    const items: ChecklistItem[] = [];

    // Базовые документы (всегда нужны)
    BASE_CHECKLIST_ITEMS.forEach((item) => {
      items.push({
        ...item,
        checked: false,
      });
    });

    // Дополнительные документы для юридических лиц
    if (contractData.isLandlordLegalEntity || contractData.isTenantLegalEntity) {
      LEGAL_ENTITY_DOCUMENTS.forEach((item) => {
        items.push({
          ...item,
          checked: false,
        });
      });
    }

    return items;
  }

  /**
   * Генерирует инструкцию по регистрации
   * @param contractData - данные договора
   * @returns Инструкция с учетом типа сторон
   */
  static generateRegistrationGuide(contractData: ContractData): RegistrationGuide {
    const baseGuide = { ...REGISTRATION_GUIDE };
    const steps = [...baseGuide.steps];

    // Добавляем специфичные шаги для юрлиц
    if (contractData.isLandlordLegalEntity || contractData.isTenantLegalEntity) {
      steps.splice(1, 0, '1️⃣* Подготовьте выписки из ЕГРЮЛ/ЕГРИП (не старше 30 дней)');
    }

    // Добавляем шаги для разных типов недвижимости
    if (contractData.propertyType === 'commercial') {
      steps.push('8️⃣ Проверьте соответствие помещения заявленному виду использования');
    }

    return {
      ...baseGuide,
      steps,
      cost: this.getRegistrationCost(contractData),
    };
  }

  /**
   * Определяет стоимость регистрации
   * @param contractData - данные договора
   * @returns Стоимость в рублях
   */
  static getRegistrationCost(contractData: ContractData): string {
    if (contractData.isLandlordLegalEntity || contractData.isTenantLegalEntity) {
      return `💰 Стоимость: ${PAYMENT_DETAILS.legal.amount.toLocaleString('ru-RU')}₽ (юридическое лицо)`;
    }
    return `💰 Стоимость: ${PAYMENT_DETAILS.individual.amount.toLocaleString('ru-RU')}₽ (физическое лицо)`;
  }

  /**
   * Создает новый чек-лист для пользователя
   * @param userId - ID пользователя
   * @param contractData - данные договора
   * @returns Новый чек-лист
   */
  static createChecklist(userId: number, contractData: ContractData): RosreestrChecklist {
    const registrationCheck = this.isRegistrationRequired(contractData.durationMonths);

    return {
      userId,
      createdAt: new Date(),
      items: this.getRequiredDocuments(contractData),
      isComplete: false,
      registrationRequired: registrationCheck.required,
    };
  }

  /**
   * Переключает состояние пункта чек-листа
   * @param checklist - текущий чек-лист
   * @param itemId - ID пункта
   * @returns Обновленный чек-лист
   */
  static toggleChecklistItem(checklist: RosreestrChecklist, itemId: string): RosreestrChecklist {
    const updatedItems = checklist.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });

    const allChecked = updatedItems.every((item) => item.checked);

    return {
      ...checklist,
      items: updatedItems,
      isComplete: allChecked,
    };
  }

  /**
   * Получает требования к конкретному документу
   * @param documentId - ID документа
   * @returns Список требований
   */
  static getDocumentRequirements(documentId: string): string[] {
    return DOCUMENT_REQUIREMENTS[documentId] || ['Нет специальных требований'];
  }

  /**
   * Получает прогресс заполнения чек-листа
   * @param checklist - чек-лист
   * @returns Объект с прогрессом
   */
  static getChecklistProgress(checklist: RosreestrChecklist): {
    checked: number;
    total: number;
    percentage: number;
  } {
    const checked = checklist.items.filter((item) => item.checked).length;
    const total = checklist.items.length;
    const percentage = Math.round((checked / total) * 100);

    return { checked, total, percentage };
  }

  /**
   * Получает список неотмеченных пунктов
   * @param checklist - чек-лист
   * @returns Список неотмеченных пунктов
   */
  static getUncheckedItems(checklist: RosreestrChecklist): ChecklistItem[] {
    return checklist.items.filter((item) => !item.checked);
  }

  /**
   * Сбрасывает чек-лист (все пункты неотмечены)
   * @param checklist - чек-лист
   * @returns Сброшенный чек-лист
   */
  static resetChecklist(checklist: RosreestrChecklist): RosreestrChecklist {
    return {
      ...checklist,
      items: checklist.items.map((item) => ({ ...item, checked: false })),
      isComplete: false,
    };
  }

  /**
   * Проверяет валидность срока договора
   * @param duration - введенный срок
   * @returns true если валидно
   */
  static isValidDuration(duration: number): boolean {
    return Number.isInteger(duration) && duration > 0 && duration <= 600; // Макс 50 лет
  }

  /**
   * Форматирует срок договора для отображения
   * @param months - срок в месяцах
   * @returns Отформатированная строка
   */
  static formatDuration(months: number): string {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${months} мес.`;
    }
    if (remainingMonths === 0) {
      return `${years} ${this.pluralizeYears(years)}`;
    }
    return `${years} ${this.pluralizeYears(years)} ${remainingMonths} мес.`;
  }

  /**
   * Склонение слова "год"
   */
  private static pluralizeYears(years: number): string {
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'лет';
    }
    if (lastDigit === 1) {
      return 'год';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'года';
    }
    return 'лет';
  }
}

export default RosreestrService;
