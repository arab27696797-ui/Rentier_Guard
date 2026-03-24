import { logger } from '../logger';

export const DATE_FORMAT_RU = 'DD.MM.YYYY';

export function formatDate(date: Date | string | number): string {
  try {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    logger.error({ date, error }, 'Ошибка форматирования даты');
    return '—';
  }
}

export function formatDateTime(date: Date | string | number): string {
  try {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${formatDate(d)} ${hours}:${minutes}`;
  } catch (error) {
    logger.error({ date, error }, 'Ошибка форматирования даты и времени');
    return '—';
  }
}

export function parseDate(
  dateString: string,
  format: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'DD.MM.YYYY'
): Date | null {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    let day = 0;
    let month = 0;
    let year = 0;

    if (format === 'DD.MM.YYYY') {
      const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!match) return null;
      day = Number(match[1]);
      month = Number(match[2]);
      year = Number(match[3]);
    } else if (format === 'YYYY-MM-DD') {
      const match = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (!match) return null;
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) return null;
      month = Number(match[1]);
      day = Number(match[2]);
      year = Number(match[3]);
    }

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch (error) {
    logger.error({ dateString, format, error }, 'Ошибка парсинга даты');
    return null;
  }
}

export function addDays(date: Date | string | number, days: number): Date {
  try {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    d.setDate(d.getDate() + days);
    return d;
  } catch (error) {
    logger.error({ date, days, error }, 'Ошибка при добавлении дней');
    return new Date();
  }
}

export function addMonths(date: Date | string | number, months: number): Date {
  try {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }

    d.setMonth(d.getMonth() + months);
    return d;
  } catch (error) {
    logger.error({ date, months, error }, 'Ошибка при добавлении месяцев');
    return new Date();
  }
}

export function isOverdue(
  date: Date | string | number,
  compareWith: Date | string | number = new Date()
): boolean {
  try {
    const checkDate = new Date(date);
    const compareDate = new Date(compareWith);

    checkDate.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);

    return checkDate < compareDate;
  } catch (error) {
    logger.error({ date, compareWith, error }, 'Ошибка при проверке просрочки');
    return false;
  }
}

export function isExpiringSoon(
  date: Date | string | number,
  days = 7
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
    logger.error({ date, days, error }, 'Ошибка при проверке срока');
    return false;
  }
}

export function getQuarter(date: Date | string | number = new Date()): number {
  try {
    const d = new Date(date);
    return Math.floor(d.getMonth() / 3) + 1;
  } catch (error) {
    logger.error({ date, error }, 'Ошибка при определении квартала');
    return 1;
  }
}

export function getQuarterStart(
  date: Date | string | number = new Date()
): Date {
  try {
    const d = new Date(date);
    const quarter = getQuarter(d);
    const month = (quarter - 1) * 3;

    return new Date(d.getFullYear(), month, 1);
  } catch (error) {
    logger.error({ date, error }, 'Ошибка при получении начала квартала');
    return new Date();
  }
}

export function getQuarterEnd(
  date: Date | string | number = new Date()
): Date {
  try {
    const d = new Date(date);
    const quarter = getQuarter(d);
    const month = quarter * 3;

    return new Date(d.getFullYear(), month, 0);
  } catch (error) {
    logger.error({ date, error }, 'Ошибка при получении конца квартала');
    return new Date();
  }
}

export type TaxType =
  | 'ndfl'
  | 'usn'
  | 'nds'
  | 'property'
  | 'land'
  | 'transport';

export function getTaxDeadline(
  taxType: TaxType,
  year = new Date().getFullYear()
): Date {
  const deadlines: Record<TaxType, Date> = {
    ndfl: new Date(year + 1, 3, 15),
    usn: new Date(year, 3, 28),
    nds: new Date(year, 3, 25),
    property: new Date(year + 1, 2, 1),
    land: new Date(year + 1, 2, 1),
    transport: new Date(year + 1, 2, 1),
  };

  return deadlines[taxType];
}

export function getDaysRemaining(date: Date | string | number): number {
  try {
    const targetDate = new Date(date);
    const today = new Date();

    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    logger.error({ date, error }, 'Ошибка при расчете оставшихся дней');
    return 0;
  }
}

export function getMonthName(
  month: number | Date,
  short = false
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

  if (monthIndex < 0 || monthIndex > 11) {
    return '';
  }

  return names[monthIndex];
}

export function isValidDateObject(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}
