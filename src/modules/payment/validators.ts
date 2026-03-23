/**
 * @fileoverview Zod схемы валидации для модуля платежей
 * @module modules/payment/validators
 */

import { z } from 'zod';
import { PaymentType, PaymentStatus } from './types';

// ============================================
// CONSTANTS
// ============================================

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100_000_000; // 100 млн рублей
const MAX_DESCRIPTION_LENGTH = 500;

// ============================================
// ERROR MESSAGES
// ============================================

const ErrorMessages = {
  CONTRACT_ID: {
    REQUIRED: '❌ Необходимо выбрать договор',
    INVALID: '❌ Неверный формат ID договора',
  },
  TYPE: {
    REQUIRED: '❌ Тип платежа обязателен',
    INVALID: '❌ Неверный тип платежа',
  },
  AMOUNT: {
    REQUIRED: '❌ Сумма платежа обязательна',
    INVALID: '❌ Сумма должна быть числом',
    MIN: `❌ Сумма не может быть меньше ${MIN_AMOUNT} руб.`,
    MAX: `❌ Сумма не может превышать ${MAX_AMOUNT} руб.`,
  },
  DATE: {
    REQUIRED: '❌ Дата платежа обязательна',
    INVALID: '❌ Неверный формат даты',
    PAST: '❌ Дата не может быть в прошлом для запланированных платежей',
  },
  STATUS: {
    REQUIRED: '❌ Статус платежа обязателен',
    INVALID: '❌ Неверный статус платежа',
  },
  DESCRIPTION: {
    MAX_LENGTH: `❌ Описание слишком длинное (максимум ${MAX_DESCRIPTION_LENGTH} символов)`,
  },
  PAYMENT_ID: {
    INVALID: '❌ Неверный формат ID платежа',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Парсит дату из строки в формате DD.MM.YYYY или DD/MM/YYYY
 */
function parseDateString(dateStr: string): Date | null {
  const patterns = [
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,     // DD.MM.YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,     // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/,           // YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let day: number, month: number, year: number;
      
      if (pattern.source.startsWith('^\\d{4}')) {
        // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // DD.MM.YYYY или DD/MM/YYYY
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      const date = new Date(year, month - 1, day);
      
      // Проверяем, что дата валидна
      if (
        date.getDate() === day &&
        date.getMonth() === month - 1 &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }

  return null;
}

// ============================================
// SCHEMAS
// ============================================

/** Схема валидации ID договора */
export const contractIdSchema = z
  .string({
    required_error: ErrorMessages.CONTRACT_ID.REQUIRED,
  })
  .uuid(ErrorMessages.CONTRACT_ID.INVALID);

/** Схема валидации типа платежа */
export const paymentTypeSchema = z.nativeEnum(PaymentType, {
  required_error: ErrorMessages.TYPE.REQUIRED,
  invalid_type_error: ErrorMessages.TYPE.INVALID,
});

/** Схема валидации суммы */
export const amountSchema = z
  .union([
    z.number({
      required_error: ErrorMessages.AMOUNT.REQUIRED,
      invalid_type_error: ErrorMessages.AMOUNT.INVALID,
    }),
    z.string().transform((val) => {
      const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(parsed)) {
        throw new Error(ErrorMessages.AMOUNT.INVALID);
      }
      return parsed;
    }),
  ])
  .refine((val) => val >= MIN_AMOUNT, ErrorMessages.AMOUNT.MIN)
  .refine((val) => val <= MAX_AMOUNT, ErrorMessages.AMOUNT.MAX);

/** Схема валидации даты платежа */
export const paymentDateSchema = z
  .union([
    z.date({
      required_error: ErrorMessages.DATE.REQUIRED,
      invalid_type_error: ErrorMessages.DATE.INVALID,
    }),
    z.string().transform((val) => {
      const date = parseDateString(val);
      if (!date) {
        throw new Error(ErrorMessages.DATE.INVALID);
      }
      return date;
    }),
  ]);

/** Схема валидации статуса платежа */
export const paymentStatusSchema = z.nativeEnum(PaymentStatus, {
  required_error: ErrorMessages.STATUS.REQUIRED,
  invalid_type_error: ErrorMessages.STATUS.INVALID,
});

/** Схема валидации описания (опционально) */
export const descriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, ErrorMessages.DESCRIPTION.MAX_LENGTH)
  .nullable()
  .optional()
  .transform((val) => (val === '' ? null : val));

/** Схема валидации ID платежа */
export const paymentIdSchema = z
  .string()
  .uuid(ErrorMessages.PAYMENT_ID.INVALID);

/** Схема валидации данных для создания платежа */
export const createPaymentSchema = z.object({
  userId: z.number().int().positive('❌ Неверный ID пользователя'),
  contractId: contractIdSchema,
  type: paymentTypeSchema,
  amount: amountSchema,
  date: paymentDateSchema,
  status: paymentStatusSchema,
  description: descriptionSchema,
});

/** Схема валидации данных для обновления платежа */
export const updatePaymentSchema = z.object({
  type: paymentTypeSchema.optional(),
  amount: amountSchema.optional(),
  date: paymentDateSchema.optional(),
  status: paymentStatusSchema.optional(),
  description: descriptionSchema,
  paidAt: z.date().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  '❌ Необходимо указать хотя бы одно поле для обновления'
);

/** Схема для периода экспорта */
export const exportPeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12).optional(),
});

// ============================================
// TYPES
// ============================================

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentSchema = z.infer<typeof updatePaymentSchema>;
export type ExportPeriodSchema = z.infer<typeof exportPeriodSchema>;
