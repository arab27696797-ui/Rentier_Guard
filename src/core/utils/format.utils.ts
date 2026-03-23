/**
 * Format Utilities
 * Утилиты для форматирования данных
 */

import { logger } from '../logger';

/**
 * Форматировать сумму в рублях
 * @param amount - сумма (число или строка)
 * @param showCurrency - показывать символ валюты
 * @returns string - отформатированная сумма
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  showCurrency: boolean = true
): string {
  try {
    if (amount === null || amount === undefined) {
      return '—';
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return '—';
    }

    // Форматируем с разделителями тысяч
    const formatted = numAmount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return showCurrency ? `${formatted} ₽` : formatted;
  } catch (error) {
    logger.error('Ошибка форматирования валюты', { amount, error });
    return '—';
  }
}

/**
 * Форматировать телефонный номер
 * @param phone - номер телефона
 * @returns string - отформатированный номер
 */
export function formatPhone(phone: string | null | undefined): string {
  try {
    if (!phone) {
      return '—';
    }

    // Удаляем все нецифровые символы
    const digits = phone.replace(/\D/g, '');

    // Проверяем длину
    if (digits.length < 10 || digits.length > 11) {
      return phone; // Возвращаем как есть если не похоже на телефон
    }

    // Нормализуем к формату 7XXXXXXXXXX
    let normalized = digits;
    if (digits.length === 10) {
      normalized = '7' + digits;
    } else if (digits.startsWith('8')) {
      normalized = '7' + digits.slice(1);
    }

    // Форматируем: +7 (XXX) XXX-XX-XX
    const formatted = `+${normalized.slice(0, 1)} (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;

    return formatted;
  } catch (error) {
    logger.error('Ошибка форматирования телефона', { phone, error });
    return phone || '—';
  }
}

/**
 * Экранировать специальные символы Markdown
 * @param text - текст для экранирования
 * @returns string - экранированный текст
 */
export function escapeMarkdown(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    // Экранируем специальные символы Markdown v2
    return text
      .replace(/\\/g, '\\\\')   // Обратный слеш
      .replace(/\*/g, '\\*')    // Звездочка
      .replace(/_/g, '\\_')     // Подчеркивание
      .replace(/\[/g, '\\[')    // Открывающая скобка
      .replace(/\]/g, '\\]')    // Закрывающая скобка
      .replace(/\(/g, '\\(')    // Открывающая скобка
      .replace(/\)/g, '\\)')    // Закрывающая скобка
      .replace(/~/g, '\\~')     // Тильда
      .replace(/`/g, '\\`')     // Обратная кавычка
      .replace(/>/g, '\\>')     // Больше
      .replace(/#/g, '\\#')     // Решетка
      .replace(/\+/g, '\\+')    // Плюс
      .replace(/-/g, '\\-')     // Минус
      .replace(/=/g, '\\=')     // Равно
      .replace(/\|/g, '\\|')    // Вертикальная черта
      .replace(/\{/g, '\\{')    // Фигурная скобка
      .replace(/\}/g, '\\}')    // Фигурная скобка
      .replace(/\./g, '\\.')    // Точка
      .replace(/!/g, '\\!');    // Восклицательный знак
  } catch (error) {
    logger.error('Ошибка экранирования Markdown', { text, error });
    return text || '';
  }
}

/**
 * Экранировать HTML-теги
 * @param text - текст для экранирования
 * @returns string - экранированный текст
 */
export function escapeHtml(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } catch (error) {
    logger.error('Ошибка экранирования HTML', { text, error });
    return text || '';
  }
}

/**
 * Обрезать текст до указанной длины
 * @param text - исходный текст
 * @param length - максимальная длина
 * @param suffix - суффикс для обрезанного текста
 * @returns string - обрезанный текст
 */
export function truncate(
  text: string | null | undefined,
  length: number = 100,
  suffix: string = '...'
): string {
  try {
    if (!text) {
      return '';
    }

    if (text.length <= length) {
      return text;
    }

    return text.slice(0, length - suffix.length) + suffix;
  } catch (error) {
    logger.error('Ошибка обрезки текста', { text, length, error });
    return text || '';
  }
}

/**
 * Форматировать процент
 * @param value - значение (0.15 = 15%)
 * @param decimals - количество знаков после запятой
 * @returns string - отформатированный процент
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  try {
    if (value === null || value === undefined) {
      return '—';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '—';
    }

    return `${(numValue * 100).toFixed(decimals)}%`;
  } catch (error) {
    logger.error('Ошибка форматирования процента', { value, error });
    return '—';
  }
}

/**
 * Форматировать число с разделителями
 * @param value - число
 * @param decimals - количество знаков после запятой
 * @returns string - отформатированное число
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 0
): string {
  try {
    if (value === null || value === undefined) {
      return '—';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '—';
    }

    return numValue.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    logger.error('Ошибка форматирования числа', { value, error });
    return '—';
  }
}

/**
 * Форматировать адрес в одну строку
 * @param city - город
 * @param street - улица
 * @param house - дом
 * @param apartment - квартира
 * @returns string - отформатированный адрес
 */
export function formatAddress(
  city?: string | null,
  street?: string | null,
  house?: string | null,
  apartment?: string | null
): string {
  try {
    const parts: string[] = [];

    if (city) parts.push(`г. ${city}`);
    if (street) parts.push(`ул. ${street}`);
    if (house) parts.push(`д. ${house}`);
    if (apartment) parts.push(`кв. ${apartment}`);

    return parts.length > 0 ? parts.join(', ') : '—';
  } catch (error) {
    logger.error('Ошибка форматирования адреса', {
      city,
      street,
      house,
      apartment,
      error,
    });
    return '—';
  }
}

/**
 * Форматировать ФИО
 * @param lastName - фамилия
 * @param firstName - имя
 * @param middleName - отчество
 * @returns string - отформатированное ФИО
 */
export function formatFullName(
  lastName?: string | null,
  firstName?: string | null,
  middleName?: string | null
): string {
  try {
    const parts: string[] = [];

    if (lastName) parts.push(lastName);
    if (firstName) parts.push(firstName);
    if (middleName) parts.push(middleName);

    return parts.length > 0 ? parts.join(' ') : '—';
  } catch (error) {
    logger.error('Ошибка форматирования ФИО', {
      lastName,
      firstName,
      middleName,
      error,
    });
    return '—';
  }
}

/**
 * Форматировать ИНН с разделителями
 * @param inn - ИНН
 * @returns string - отформатированный ИНН
 */
export function formatINN(inn: string | null | undefined): string {
  try {
    if (!inn) {
      return '—';
    }

    const digits = inn.replace(/\D/g, '');

    if (digits.length === 10) {
      // Юридическое лицо: XXXXXXXXXX
      return digits;
    } else if (digits.length === 12) {
      // Физическое лицо: XXXXXXXXXXXX
      return digits;
    }

    return inn;
  } catch (error) {
    logger.error('Ошибка форматирования ИНН', { inn, error });
    return inn || '—';
  }
}

/**
 * Преобразовать первую букву в заглавную
 * @param text - исходный текст
 * @returns string - текст с заглавной буквы
 */
export function capitalize(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  } catch (error) {
    logger.error('Ошибка при capitalizing', { text, error });
    return text || '';
  }
}

/**
 * Убрать лишние пробелы из текста
 * @param text - исходный текст
 * @returns string - текст без лишних пробелов
 */
export function normalizeWhitespace(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    logger.error('Ошибка нормализации пробелов', { text, error });
    return text || '';
  }
}
