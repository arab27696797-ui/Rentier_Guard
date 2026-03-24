import { logger } from '../logger';

export function formatCurrency(
  amount: number | string | null | undefined,
  showCurrency = true
): string {
  try {
    if (amount === null || amount === undefined) {
      return '—';
    }

    const numAmount = typeof amount === 'string' ? Number(amount) : amount;

    if (!Number.isFinite(numAmount)) {
      return '—';
    }

    const formatted = numAmount.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return showCurrency ? `${formatted} ₽` : formatted;
  } catch (error) {
    logger.error({ amount, error }, 'Ошибка форматирования валюты');
    return '—';
  }
}

export function formatPhone(phone: string | null | undefined): string {
  try {
    if (!phone) {
      return '—';
    }

    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 11) {
      return phone;
    }

    let normalized = digits;

    if (digits.length === 10) {
      normalized = `7${digits}`;
    } else if (digits.startsWith('8')) {
      normalized = `7${digits.slice(1)}`;
    }

    if (normalized.length !== 11) {
      return phone;
    }

    return `+${normalized.slice(0, 1)} (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  } catch (error) {
    logger.error({ phone, error }, 'Ошибка форматирования телефона');
    return phone ?? '—';
  }
}

export function escapeMarkdown(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  } catch (error) {
    logger.error({ text, error }, 'Ошибка экранирования Markdown');
    return text ?? '';
  }
}

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
    logger.error({ text, error }, 'Ошибка экранирования HTML');
    return text ?? '';
  }
}

export function truncate(
  text: string | null | undefined,
  length = 100,
  suffix = '...'
): string {
  try {
    if (!text) {
      return '';
    }

    if (text.length <= length) {
      return text;
    }

    if (length <= suffix.length) {
      return suffix.slice(0, length);
    }

    return `${text.slice(0, length - suffix.length)}${suffix}`;
  } catch (error) {
    logger.error({ text, length, error }, 'Ошибка обрезки текста');
    return text ?? '';
  }
}

export function formatPercent(
  value: number | string | null | undefined,
  decimals = 0
): string {
  try {
    if (value === null || value === undefined) {
      return '—';
    }

    const numValue = typeof value === 'string' ? Number(value) : value;

    if (!Number.isFinite(numValue)) {
      return '—';
    }

    return `${(numValue * 100).toFixed(decimals)}%`;
  } catch (error) {
    logger.error({ value, error }, 'Ошибка форматирования процента');
    return '—';
  }
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 0
): string {
  try {
    if (value === null || value === undefined) {
      return '—';
    }

    const numValue = typeof value === 'string' ? Number(value) : value;

    if (!Number.isFinite(numValue)) {
      return '—';
    }

    return numValue.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    logger.error({ value, error }, 'Ошибка форматирования числа');
    return '—';
  }
}

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
    logger.error(
      { city, street, house, apartment, error },
      'Ошибка форматирования адреса'
    );
    return '—';
  }
}

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
    logger.error(
      { lastName, firstName, middleName, error },
      'Ошибка форматирования ФИО'
    );
    return '—';
  }
}

export function formatINN(inn: string | null | undefined): string {
  try {
    if (!inn) {
      return '—';
    }

    const digits = inn.replace(/\D/g, '');

    if (digits.length === 10 || digits.length === 12) {
      return digits;
    }

    return inn;
  } catch (error) {
    logger.error({ inn, error }, 'Ошибка форматирования ИНН');
    return inn ?? '—';
  }
}

export function capitalize(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  } catch (error) {
    logger.error({ text, error }, 'Ошибка приведения к Capitalize');
    return text ?? '';
  }
}

export function normalizeWhitespace(text: string | null | undefined): string {
  try {
    if (!text) {
      return '';
    }

    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    logger.error({ text, error }, 'Ошибка нормализации пробелов');
    return text ?? '';
  }
}
