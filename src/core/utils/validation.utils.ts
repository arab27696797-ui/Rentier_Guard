import { logger } from '../logger';

export function isValidINN(inn: string | null | undefined): boolean {
  try {
    if (!inn) {
      return false;
    }

    const digits = inn.replace(/\D/g, '');

    if (digits.length !== 10 && digits.length !== 12) {
      return false;
    }

    if (digits.length === 10) {
      const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
      let sum = 0;

      for (let i = 0; i < 9; i += 1) {
        sum += Number(digits[i]) * coefficients[i];
      }

      const checkDigit = (sum % 11) % 10;
      return checkDigit === Number(digits[9]);
    }

    const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum1 = 0;

    for (let i = 0; i < 10; i += 1) {
      sum1 += Number(digits[i]) * coefficients1[i];
    }

    const checkDigit1 = (sum1 % 11) % 10;

    const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum2 = 0;

    for (let i = 0; i < 11; i += 1) {
      sum2 += Number(digits[i]) * coefficients2[i];
    }

    const checkDigit2 = (sum2 % 11) % 10;

    return checkDigit1 === Number(digits[10]) && checkDigit2 === Number(digits[11]);
  } catch (error) {
    logger.error({ inn, error }, 'Ошибка валидации ИНН');
    return false;
  }
}

export function isValidPassport(passport: string | null | undefined): boolean {
  try {
    if (!passport) {
      return false;
    }

    const digits = passport.replace(/\D/g, '');

    if (digits.length !== 10) {
      return false;
    }

    const regionCode = Number(digits.slice(0, 2));
    const passportNumber = Number(digits.slice(4, 10));

    if (regionCode < 1 || regionCode > 99) {
      return false;
    }

    if (passportNumber < 1 || passportNumber > 999999) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ passport, error }, 'Ошибка валидации паспорта');
    return false;
  }
}

export function isValidCadastralNumber(
  value: string | null | undefined
): boolean {
  try {
    if (!value) {
      return false;
    }

    const cleaned = value.replace(/\s/g, '');
    const pattern = /^\d{2}:\d{2}:\d{6,7}:\d{1,4}$/;

    if (!pattern.test(cleaned)) {
      return false;
    }

    const parts = cleaned.split(':');
    const regionCode = Number(parts[0]);
    const districtCode = Number(parts[1]);

    if (regionCode < 1 || regionCode > 99) {
      return false;
    }

    if (districtCode < 0 || districtCode > 99) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ value, error }, 'Ошибка валидации кадастрового номера');
    return false;
  }
}

export function isValidDate(value: unknown): boolean {
  try {
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return !Number.isNaN(parsed.getTime());
    }

    return false;
  } catch (error) {
    logger.error({ value, error }, 'Ошибка валидации даты');
    return false;
  }
}

export function isValidEmail(email: string | null | undefined): boolean {
  try {
    if (!email) {
      return false;
    }

    const pattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return pattern.test(email);
  } catch (error) {
    logger.error({ email, error }, 'Ошибка валидации email');
    return false;
  }
}

export function isValidPhone(phone: string | null | undefined): boolean {
  try {
    if (!phone) {
      return false;
    }

    const digits = phone.replace(/\D/g, '');

    if (digits.length !== 10 && digits.length !== 11) {
      return false;
    }

    if (digits.length === 11) {
      const firstDigit = digits[0];
      if (firstDigit !== '7' && firstDigit !== '8') {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error({ phone, error }, 'Ошибка валидации телефона');
    return false;
  }
}

export function isValidSNILS(snils: string | null | undefined): boolean {
  try {
    if (!snils) {
      return false;
    }

    const digits = snils.replace(/\D/g, '');

    if (digits.length !== 11) {
      return false;
    }

    const numberPart = digits.slice(0, 9);
    const checkDigits = Number(digits.slice(9, 11));

    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      sum += Number(numberPart[i]) * (9 - i);
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

    return checkNumber === checkDigits;
  } catch (error) {
    logger.error({ snils, error }, 'Ошибка валидации СНИЛС');
    return false;
  }
}

export function isValidOGRN(ogrn: string | null | undefined): boolean {
  try {
    if (!ogrn) {
      return false;
    }

    const digits = ogrn.replace(/\D/g, '');

    if (digits.length === 13) {
      const numberPart = digits.slice(0, 12);
      const checkDigit = Number(digits[12]);
      const calculatedCheck = Number(BigInt(numberPart) % 11n % 10n);
      return calculatedCheck === checkDigit;
    }

    if (digits.length === 15) {
      const numberPart = digits.slice(0, 14);
      const checkDigit = Number(digits[14]);
      const calculatedCheck = Number(BigInt(numberPart) % 13n % 10n);
      return calculatedCheck === checkDigit;
    }

    return false;
  } catch (error) {
    logger.error({ ogrn, error }, 'Ошибка валидации ОГРН');
    return false;
  }
}

export function isValidKPP(kpp: string | null | undefined): boolean {
  try {
    if (!kpp) {
      return false;
    }

    const digits = kpp.replace(/\D/g, '');

    if (digits.length !== 9) {
      return false;
    }

    const taxCode = Number(digits.slice(0, 4));
    const reasonCode = Number(digits.slice(4, 6));

    if (taxCode < 101 || taxCode > 9999) {
      return false;
    }

    const validReasons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 43, 44, 45, 57, 58];
    return validReasons.includes(reasonCode);
  } catch (error) {
    logger.error({ kpp, error }, 'Ошибка валидации КПП');
    return false;
  }
}

export function isNotEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isLengthValid(
  value: string | null | undefined,
  min = 0,
  max = Number.POSITIVE_INFINITY
): boolean {
  if (!value) {
    return min === 0;
  }

  const length = value.length;
  return length >= min && length <= max;
}

export function isNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return !Number.isNaN(Number(value));
  }

  return false;
}

export function isPositiveNumber(value: unknown): boolean {
  if (!isNumber(value)) {
    return false;
  }

  const num = typeof value === 'string' ? Number(value) : value;
  return num > 0;
}
