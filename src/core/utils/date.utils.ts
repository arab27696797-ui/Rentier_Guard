/**
 * Date Utilities
 * Утилиты для работы с датами
 */

import { logger } from '../logger';

/**
 * Формат даты: ДД.ММ.ГГГГ
 */
const DATE_FORMAT_RU = 'DD.MM.YYYY';

/**
 * Форматировать дату в формат ДД.ММ.ГГГГ
 * @param date - дата для форматирования (Date, string или number)
 * @returns string - отформатированная дата
 */
export function formatDate(date: Date | string | number): string {
  try {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    logger.error('Ошибка форматирования даты', { date, error });
    return '—';
  }
}

/**
 * Форматировать дату и время в формат ДД.ММ.ГГГГ ЧЧ:ММ
 * @param date - дата для форматирования
 * @returns string - отформатированная дата и время
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    const dateStr = formatDate(d);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${dateStr} ${hours}:${minutes}`;
  } catch (error) {
    logger.error('Ошибка форматирования даты и времени', { date, error });
    return '—';
  }
}

/**
 * Парсить дату из строки
 * @param dateString - строка с датой
 * @param format - формат даты (по умолчанию ДД.ММ.ГГГГ)
 * @returns Date | null - объект Date или null при ошибке
 */
export function parseDate(
  dateString: string,
  format: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'DD.MM.YYYY'
): Date | null {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    let day: number, month: number, year: number;

    switch (format) {
      case 'DD.MM.YYYY': {
        const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (!match) return null;
        [, day, month, year] = match.map(Number);
        break;
      }
      case 'YYYY-MM-DD': {
        const match = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!match) return null;
        [, year, month, day] = match.map(Number);
        break;
      }
      case 'MM/DD/YYYY': {
        const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) return null;
        [, month, day, year] = match.map(Number);
        break;
      }
      default:
        return null;
    }

    const date = new Date(year, month - 1, day);

    // Проверяем корректность даты
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return null;
    }

    return date;
  } catch (error) {
    logger.error('Ошибка парсинга даты', { dateString, format, error });
    return null;
  }
}

/**
 * Добавить дни к дате
 * @param date - исходная дата
 * @param days - количество дней (может быть отрицательным)
 * @returns Date - новая дата
 */
export function addDays(date: Date | string | number, days: number): Date {
  try {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  } catch (error) {
    logger.error('Ошибка при добавлении дней', { date, days, error });
    return new Date();
  }
}

/**
 * Добавить месяцы к дате
 * @param date - исходная дата
 * @param months - количество месяцев
 * @returns Date - новая дата
 */
export function addMonths(date: Date | string | number, months: number): Date {
  try {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  } catch (error) {
    logger.error('Ошибка при добавлении месяцев', { date, months, error });
    return new Date();
  }
}

/**
 * Проверить, просрочена ли дата
 * @param date - дата для проверки
 * @param compareWith - дата сравнения (по умолчанию текущая)
 * @returns boolean - true если дата просрочена
 */
export function isOverdue(
  date: Date | string | number,
  compareWith: Date | string | number = new Date()
): boolean {
  try {
    const checkDate = new Date(date);
    const compareDate = new Date(compareWith);

    // Сбрасываем время для корректного сравнения дат
    checkDate.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);

    return checkDate < compareDate;
  } catch (error) {
    logger.error('Ошибка при проверке просрочки', { date, compareWith, error });
    return false;
  }
}

/**
 * Проверить, истекает ли срок в ближайшие N дней
 * @param date - дата для проверки
 * @param days - количество дней
 * @returns boolean - true если срок истекает
 */
export function isExpiringSoon(
  date: Date | string | number,
  days: number = 7
): boolean {
  try {
    const checkDate = new Date(date);
    const today = new Date();
    const future = addDays(today, days);

    today.setHours(0, 0, 0, 0);
    future.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= today && checkDate <= future;
  } catch (error) {
    logger.error('Ошибка при проверке срока', { date, days, error });
    return false;
  }
}

/**
 * Получить номер квартала
 * @param date - дата
 * @returns number - номер квартала (1-4)
 */
export function getQuarter(date: Date | string | number = new Date()): number {
  try {
    const d = new Date(date);
    const month = d.getMonth();
    return Math.floor(month / 3) + 1;
  } catch (error) {
    logger.error('Ошибка при определении квартала', { date, error });
    return 1;
  }
}

/**
 * Получить начало квартала
 * @param date - дата
 * @returns Date - начало квартала
 */
export function getQuarterStart(date: Date | string | number = new Date()): Date {
  try {
    const d = new Date(date);
    const quarter = getQuarter(d);
    const month = (quarter - 1) * 3;
    return new Date(d.getFullYear(), month, 1);
  } catch (error) {
    logger.error('Ошибка при получении начала квартала', { date, error });
    return new Date();
  }
}

/**
 * Получить конец квартала
 * @param date - дата
 * @returns Date - конец квартала
 */
export function getQuarterEnd(date: Date | string | number = new Date()): Date {
  try {
    const d = new Date(date);
    const quarter = getQuarter(d);
    const month = quarter * 3;
    return new Date(d.getFullYear(), month, 0);
  } catch (error) {
    logger.error('Ошибка при получении конца квартала', { date, error });
    return new Date();
  }
}

/**
 * Типы налогов
 */
export type TaxType = 'ndfl' | 'usn' | 'nds' | 'property' | 'land' | 'transport';

/**
 * Получить срок уплаты налога
 * @param taxType - тип налога
 * @param year - год
 * @returns Date - срок уплаты
 */
export function getTaxDeadline(taxType: TaxType, year: number = new Date().getFullYear()): Date {
  const deadlines: Record<TaxType, Date> = {
    // НДФЛ - 15 апреля следующего года
    ndfl: new Date(year + 1, 3, 15),
    // УСН - 28 апреля, 28 июля, 28 октября (ежеквартально)
    usn: new Date(year, 3, 28),
    // НДС - 25 число месяца следующего за кварталом
    nds: new Date(year, 3, 25),
    // Налог на имущество - 1 марта следующего года
    property: new Date(year + 1, 2, 1),
    // Земельный налог - 1 марта следующего года
    land: new Date(year + 1, 2, 1),
    // Транспортный налог - 1 марта следующего года
    transport: new Date(year + 1, 2, 1),
  };

  return deadlines[taxType] || new Date(year, 11, 31);
}

/**
 * Получить оставшиеся дни до даты
 * @param date - целевая дата
 * @returns number - количество дней (отрицательное если просрочено)
 */
export function getDaysRemaining(date: Date | string | number): number {
  try {
    const targetDate = new Date(date);
    const today = new Date();

    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    logger.error('Ошибка при расчете оставшихся дней', { date, error });
    return 0;
  }
}

/**
 * Получить название месяца на русском
 * @param month - номер месяца (0-11) или дата
 * @param short - короткое название
 * @returns string - название месяца
 */
export function getMonthName(
  month: number | Date,
  short: boolean = false
): string {
  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  const shortNames = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ];

  const monthIndex = month instanceof Date ? month.getMonth() : month;
  const names = short ? shortNames : monthNames;

  return names[monthIndex] || '';
}

/**
 * Проверить, является ли дата валидной
 * @param date - значение для проверки
 * @returns boolean - true если дата валидна
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
