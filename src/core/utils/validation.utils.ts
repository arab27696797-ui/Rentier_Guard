/**
 * Validation Utilities
 * Утилиты для валидации данных
 */

import { logger } from '../logger';

/**
 * Проверить валидность ИНН
 * @param inn - ИНН для проверки
 * @returns boolean - true если ИНН валиден
 */
export function isValidINN(inn: string | null | undefined): boolean {
  try {
    if (!inn) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = inn.replace(/\D/g, '');

    // ИНН должен быть 10 или 12 цифр
    if (digits.length !== 10 && digits.length !== 12) {
      return false;
    }

    // Проверка контрольной суммы для 10-значного ИНН (юр. лица)
    if (digits.length === 10) {
      const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
      let sum = 0;

      for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i]) * coefficients[i];
      }

      const checkDigit = sum % 11 % 10;
      return checkDigit === parseInt(digits[9]);
    }

    // Проверка контрольной суммы для 12-значного ИНН (физ. лица)
    if (digits.length === 12) {
      // Первая контрольная цифра
      const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
      let sum1 = 0;

      for (let i = 0; i < 10; i++) {
        sum1 += parseInt(digits[i]) * coefficients1[i];
      }

      const checkDigit1 = sum1 % 11 % 10;

      // Вторая контрольная цифра
      const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
      let sum2 = 0;

      for (let i = 0; i < 11; i++) {
        sum2 += parseInt(digits[i]) * coefficients2[i];
      }

      const checkDigit2 = sum2 % 11 % 10;

      return (
        checkDigit1 === parseInt(digits[10]) &&
        checkDigit2 === parseInt(digits[11])
      );
    }

    return false;
  } catch (error) {
    logger.error('Ошибка валидации ИНН', { inn, error });
    return false;
  }
}

/**
 * Проверить валидность паспортных данных
 * @param passport - серия и номер паспорта
 * @returns boolean - true если паспорт валиден
 */
export function isValidPassport(passport: string | null | undefined): boolean {
  try {
    if (!passport) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = passport.replace(/\D/g, '');

    // Паспорт РФ: 10 цифр (4 серия + 6 номер)
    if (digits.length !== 10) {
      return false;
    }

    // Серия паспорта (первые 4 цифры)
    const series = digits.slice(0, 4);
    // Номер паспорта (последние 6 цифр)
    const number = digits.slice(4, 10);

    // Проверка серии: первая пара цифр - код региона (01-99)
    const regionCode = parseInt(series.slice(0, 2));
    if (regionCode < 1 || regionCode > 99) {
      return false;
    }

    // Вторая пара цифр - год выдачи (00-99)
    const yearCode = parseInt(series.slice(2, 4));
    if (yearCode < 0 || yearCode > 99) {
      return false;
    }

    // Номер должен быть от 000001 до 999999
    const passportNumber = parseInt(number);
    if (passportNumber < 1 || passportNumber > 999999) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Ошибка валидации паспорта', { passport, error });
    return false;
  }
}

/**
 * Проверить валидность кадастрового номера
 * @param number - кадастровый номер
 * @returns boolean - true если номер валиден
 */
export function isValidCadastralNumber(
  number: string | null | undefined
): boolean {
  try {
    if (!number) {
      return false;
    }

    // Удаляем пробелы
    const cleaned = number.replace(/\s/g, '');

    // Регулярное выражение для кадастрового номера
    // Формат: XX:XX:XXXXXXX:XX или XX:XX:XXXXXXX:XXX
    // где X - цифра
    const pattern = /^\d{2}:\d{2}:\d{7}:\d{2,3}$/;

    if (!pattern.test(cleaned)) {
      return false;
    }

    // Дополнительная проверка частей
    const parts = cleaned.split(':');

    // Код субъекта РФ (первые 2 цифры)
    const regionCode = parseInt(parts[0]);
    if (regionCode < 1 || regionCode > 99) {
      return false;
    }

    // Код района (2 цифры)
    const districtCode = parseInt(parts[1]);
    if (districtCode < 0 || districtCode > 99) {
      return false;
    }

    // Код квартала (7 цифр)
    const quarterCode = parts[2];
    if (quarterCode.length !== 7) {
      return false;
    }

    // Номер объекта (2-3 цифры)
    const objectNumber = parts[3];
    if (objectNumber.length < 2 || objectNumber.length > 3) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Ошибка валидации кадастрового номера', { number, error });
    return false;
  }
}

/**
 * Проверить валидность даты
 * @param date - дата для проверки
 * @returns boolean - true если дата валидна
 */
export function isValidDate(date: unknown): boolean {
  try {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }

    if (typeof date === 'number') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }

    return false;
  } catch (error) {
    logger.error('Ошибка валидации даты', { date, error });
    return false;
  }
}

/**
 * Проверить валидность email
 * @param email - email для проверки
 * @returns boolean - true если email валиден
 */
export function isValidEmail(email: string | null | undefined): boolean {
  try {
    if (!email) {
      return false;
    }

    // RFC 5322 compliant regex (упрощенная версия)
    const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return pattern.test(email);
  } catch (error) {
    logger.error('Ошибка валидации email', { email, error });
    return false;
  }
}

/**
 * Проверить валидность телефонного номера
 * @param phone - номер телефона
 * @returns boolean - true если телефон валиден
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  try {
    if (!phone) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = phone.replace(/\D/g, '');

    // Телефон должен содержать 10 или 11 цифр
    if (digits.length !== 10 && digits.length !== 11) {
      return false;
    }

    // Если 11 цифр, первая должна быть 7 или 8
    if (digits.length === 11) {
      const firstDigit = digits[0];
      if (firstDigit !== '7' && firstDigit !== '8') {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Ошибка валидации телефона', { phone, error });
    return false;
  }
}

/**
 * Проверить валидность СНИЛС
 * @param snils - СНИЛС для проверки
 * @returns boolean - true если СНИЛС валиден
 */
export function isValidSNILS(snils: string | null | undefined): boolean {
  try {
    if (!snils) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = snils.replace(/\D/g, '');

    // СНИЛС должен содержать 11 цифр
    if (digits.length !== 11) {
      return false;
    }

    // Проверка контрольного числа
    const numberPart = digits.slice(0, 9);
    const checkDigits = digits.slice(9, 11);

    // Вычисляем контрольную сумму
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numberPart[i]) * (9 - i);
    }

    let checkNumber: number;

    if (sum < 100) {
      checkNumber = sum;
    } else if (sum === 100 || sum === 101) {
      checkNumber = 0;
    } else {
      checkNumber = sum % 101;
      if (checkNumber === 100) {
        checkNumber = 0;
      }
    }

    return checkNumber === parseInt(checkDigits);
  } catch (error) {
    logger.error('Ошибка валидации СНИЛС', { snils, error });
    return false;
  }
}

/**
 * Проверить валидность ОГРН
 * @param ogrn - ОГРН для проверки
 * @returns boolean - true если ОГРН валиден
 */
export function isValidOGRN(ogrn: string | null | undefined): boolean {
  try {
    if (!ogrn) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = ogrn.replace(/\D/g, '');

    // ОГРН должен содержать 13 цифр (юр. лица) или 15 цифр (ИП)
    if (digits.length !== 13 && digits.length !== 15) {
      return false;
    }

    if (digits.length === 13) {
      // ОГРН для юридического лица
      const numberPart = digits.slice(0, 12);
      const checkDigit = parseInt(digits[12]);
      const remainder = parseInt(numberPart) % 11;
      const calculatedCheck = remainder % 10;
      return calculatedCheck === checkDigit;
    } else {
      // ОГРНИП для индивидуального предпринимателя
      const numberPart = digits.slice(0, 14);
      const checkDigit = parseInt(digits[14]);
      const remainder = parseInt(numberPart) % 13;
      const calculatedCheck = remainder % 10;
      return calculatedCheck === checkDigit;
    }
  } catch (error) {
    logger.error('Ошибка валидации ОГРН', { ogrn, error });
    return false;
  }
}

/**
 * Проверить валидность КПП
 * @param kpp - КПП для проверки
 * @returns boolean - true если КПП валиден
 */
export function isValidKPP(kpp: string | null | undefined): boolean {
  try {
    if (!kpp) {
      return false;
    }

    // Удаляем все нецифровые символы
    const digits = kpp.replace(/\D/g, '');

    // КПП должен содержать 9 цифр
    if (digits.length !== 9) {
      return false;
    }

    // Проверка структуры КПП
    // Первые 4 цифры - код налоговой инспекции
    // Следующие 2 цифры - причина постановки на учет
    // Последние 3 цифры - порядковый номер

    const taxCode = parseInt(digits.slice(0, 4));
    const reasonCode = parseInt(digits.slice(4, 6));
    const serialNumber = parseInt(digits.slice(6, 9));

    // Код налоговой должен быть от 0101 до 9999
    if (taxCode < 101 || taxCode > 9999) {
      return false;
    }

    // Причина постановки должна быть валидной
    const validReasons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 43, 44, 45, 57, 58];
    if (!validReasons.includes(reasonCode)) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Ошибка валидации КПП', { kpp, error });
    return false;
  }
}

/**
 * Проверить, не пустая ли строка
 * @param value - значение для проверки
 * @returns boolean - true если строка не пустая
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Проверить длину строки
 * @param value - строка для проверки
 * @param min - минимальная длина
 * @param max - максимальная длина
 * @returns boolean - true если длина в допустимом диапазоне
 */
export function isLengthValid(
  value: string | null | undefined,
  min: number = 0,
  max: number = Infinity
): boolean {
  if (!value) {
    return min === 0;
  }

  const length = value.length;
  return length >= min && length <= max;
}

/**
 * Проверить, является ли значение числом
 * @param value - значение для проверки
 * @returns boolean - true если значение - число
 */
export function isNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return !isNaN(value);
  }

  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num);
  }

  return false;
}

/**
 * Проверить, является ли число положительным
 * @param value - значение для проверки
 * @returns boolean - true если число положительное
 */
export function isPositiveNumber(value: unknown): boolean {
  if (!isNumber(value)) {
    return false;
  }

  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  return num > 0;
}
