/**
 * Zod схемы валидации для налогового модуля
 * Валидация входных данных для расчета налогов
 */

import { z } from 'zod';
import {
  TaxRegime,
  TaxPeriod,
  TaxCalculationStatus,
  DeductionType,
  PropertyTaxType,
  PaymentStatus,
} from './types';

// ============================================================================
// Вспомогательные схемы
// ============================================================================

/**
 * Схема для UUID
 */
const uuidSchema = z.string().uuid('Некорректный формат ID');

/**
 * Схема для положительного числа
 */
const positiveNumberSchema = z.number().nonnegative('Значение не может быть отрицательным');

/**
 * Схема для денежной суммы
 */
const moneySchema = z
  .number()
  .nonnegative('Сумма не может быть отрицательной')
  .max(1_000_000_000, 'Сумма превышает допустимый лимит');

/**
 * Схема для процента (0-100)
 */
const percentageSchema = z
  .number()
  .min(0, 'Процент не может быть меньше 0')
  .max(100, 'Процент не может быть больше 100');

// ============================================================================
// Схемы для перечислений
// ============================================================================

/**
 * Схема для режима налогообложения
 */
export const taxRegimeSchema = z.nativeEnum(TaxRegime, {
  errorMap: () => ({ message: 'Некорректный режим налогообложения' }),
});

/**
 * Схема для налогового периода
 */
export const taxPeriodSchema = z.nativeEnum(TaxPeriod, {
  errorMap: () => ({ message: 'Некорректный налоговый период' }),
});

/**
 * Схема для статуса расчета
 */
export const taxCalculationStatusSchema = z.nativeEnum(TaxCalculationStatus, {
  errorMap: () => ({ message: 'Некорректный статус расчета' }),
});

/**
 * Схема для типа вычета
 */
export const deductionTypeSchema = z.nativeEnum(DeductionType, {
  errorMap: () => ({ message: 'Некорректный тип вычета' }),
});

/**
 * Схема для типа объекта налогообложения
 */
export const propertyTaxTypeSchema = z.nativeEnum(PropertyTaxType, {
  errorMap: () => ({ message: 'Некорректный тип объекта' }),
});

/**
 * Схема для статуса платежа
 */
export const paymentStatusSchema = z.nativeEnum(PaymentStatus, {
  errorMap: () => ({ message: 'Некорректный статус платежа' }),
});

// ============================================================================
// Схемы для сущностей
// ============================================================================

/**
 * Схема для налогового вычета
 */
export const taxDeductionSchema = z.object({
  type: deductionTypeSchema,
  description: z
    .string()
    .min(3, 'Описание должно содержать минимум 3 символа')
    .max(500, 'Описание не должно превышать 500 символов'),
  amount: moneySchema,
  documents: z.array(z.string()).optional(),
});

/**
 * Схема для входных данных вычета
 */
export const deductionInputSchema = z.object({
  type: deductionTypeSchema,
  description: z
    .string()
    .min(3, 'Описание должно содержать минимум 3 символа')
    .max(500, 'Описание не должно превышать 500 символов'),
  amount: moneySchema,
  documentIds: z.array(uuidSchema).optional(),
});

/**
 * Схема для налогового расчета
 */
export const taxCalculationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  propertyId: uuidSchema.nullable(),
  regime: taxRegimeSchema,
  period: taxPeriodSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
  totalIncome: moneySchema,
  taxBase: moneySchema,
  taxRate: percentageSchema,
  taxAmount: moneySchema,
  deductions: z.array(taxDeductionSchema),
  totalDeductions: moneySchema,
  status: taxCalculationStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Схема для налогового платежа
 */
export const taxPaymentSchema = z.object({
  id: uuidSchema,
  calculationId: uuidSchema,
  userId: uuidSchema,
  amount: moneySchema,
  paymentDate: z.date().nullable(),
  dueDate: z.date(),
  status: paymentStatusSchema,
  paymentMethod: z.string().nullable(),
  receiptNumber: z.string().nullable(),
  createdAt: z.date(),
});

// ============================================================================
// Схемы для входных данных расчета
// ============================================================================

/**
 * Базовая схема для расчета налога
 */
export const taxCalculationInputBaseSchema = z.object({
  userId: uuidSchema,
  propertyId: uuidSchema.optional(),
  regime: taxRegimeSchema,
  period: taxPeriodSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
  income: moneySchema,
  expenses: moneySchema.optional(),
  deductions: z.array(deductionInputSchema).max(50, 'Максимум 50 вычетов').optional(),
  propertyType: propertyTaxTypeSchema.optional(),
  city: z.string().min(2).max(100).optional(),
  area: positiveNumberSchema.optional(),
});

/**
 * Расширенная схема с валидацией бизнес-правил
 */
export const taxCalculationInputSchema = taxCalculationInputBaseSchema
  .refine(
    (data) => data.periodStart <= data.periodEnd,
    {
      message: 'Дата начала периода должна быть меньше или равна дате окончания',
      path: ['periodStart'],
    }
  )
  .refine(
    (data) => {
      // Проверка периода для патента
      if (data.regime === TaxRegime.PATENT && !data.city) {
        return false;
      }
      return true;
    },
    {
      message: 'Для патентной системы необходимо указать город',
      path: ['city'],
    }
  )
  .refine(
    (data) => {
      // Для УСН 15% нужны расходы
      if (data.regime === TaxRegime.USN_15 && data.expenses === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Для УСН 15% необходимо указать расходы',
      path: ['expenses'],
    }
  )
  .refine(
    (data) => {
      // Расходы не могут превышать доходы
      if (data.expenses !== undefined && data.expenses > data.income) {
        return false;
      }
      return true;
    },
    {
      message: 'Расходы не могут превышать доходы',
      path: ['expenses'],
    }
  )
  .refine(
    (data) => {
      // Проверка максимальной суммы вычетов
      const totalDeductions = data.deductions?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
      return totalDeductions <= data.income;
    },
    {
      message: 'Сумма вычетов не может превышать доход',
      path: ['deductions'],
    }
  );

// ============================================================================
// Схемы для запросов
// ============================================================================

/**
 * Схема для опций запроса расчетов
 */
export const calculationQueryOptionsSchema = z.object({
  status: taxCalculationStatusSchema.optional(),
  period: taxPeriodSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Схема для генерации отчета
 */
export const taxReportQuerySchema = z.object({
  userId: uuidSchema,
  period: taxPeriodSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
});

// ============================================================================
// Схемы для обновления данных
// ============================================================================

/**
 * Схема для обновления статуса расчета
 */
export const updateCalculationStatusSchema = z.object({
  calculationId: uuidSchema,
  status: taxCalculationStatusSchema,
});

/**
 * Схема для создания платежа
 */
export const createTaxPaymentSchema = z.object({
  calculationId: uuidSchema,
  userId: uuidSchema,
  amount: moneySchema,
  dueDate: z.date(),
});

/**
 * Схема для подтверждения платежа
 */
export const confirmTaxPaymentSchema = z.object({
  paymentId: uuidSchema,
  paymentDate: z.date(),
  paymentMethod: z.string().min(1).max(100),
  receiptNumber: z.string().min(1).max(100),
});

// ============================================================================
// Схемы для wizard-сцен
// ============================================================================

/**
 * Схема для шага 1: выбор режима налогообложения
 */
export const wizardStep1Schema = z.object({
  regime: taxRegimeSchema,
});

/**
 * Схема для шага 2: ввод периода
 */
export const wizardStep2Schema = z.object({
  period: taxPeriodSchema,
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

/**
 * Схема для шага 3: ввод дохода
 */
export const wizardStep3Schema = z.object({
  income: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Введите сумму в формате 10000 или 10000.50')
    .transform((val) => parseFloat(val)),
});

/**
 * Схема для шага 4: ввод расходов (для УСН 15%)
 */
export const wizardStep4Schema = z.object({
  expenses: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Введите сумму в формате 10000 или 10000.50')
    .transform((val) => parseFloat(val))
    .optional(),
});

/**
 * Схема для шага 5: добавление вычетов
 */
export const wizardStep5Schema = z.object({
  addDeduction: z.enum(['yes', 'no']),
  deductionType: deductionTypeSchema.optional(),
  deductionAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Введите сумму в формате 10000 или 10000.50')
    .transform((val) => parseFloat(val))
    .optional(),
  deductionDescription: z.string().min(3).max(500).optional(),
});

// ============================================================================
// Типы на основе схем
// ============================================================================

/** Тип для входных данных расчета налога */
export type TaxCalculationInputDTO = z.infer<typeof taxCalculationInputSchema>;

/** Тип для налогового вычета */
export type TaxDeductionDTO = z.infer<typeof taxDeductionSchema>;

/** Тип для входных данных вычета */
export type DeductionInputDTO = z.infer<typeof deductionInputSchema>;

/** Тип для опций запроса */
export type CalculationQueryOptionsDTO = z.infer<typeof calculationQueryOptionsSchema>;

/** Тип для создания платежа */
export type CreateTaxPaymentDTO = z.infer<typeof createTaxPaymentSchema>;

/** Тип для подтверждения платежа */
export type ConfirmTaxPaymentDTO = z.infer<typeof confirmTaxPaymentSchema>;

// ============================================================================
// Функции валидации
// ============================================================================

/**
 * Валидирует входные данные для расчета налога
 * @param data - Данные для валидации
 * @returns Результат валидации
 */
export function validateTaxCalculationInput(
  data: unknown
): { success: true; data: TaxCalculationInputDTO } | { success: false; errors: string[] } {
  const result = taxCalculationInputSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}

/**
 * Валидирует сумму дохода из строки
 * @param input - Строковое значение
 * @returns Результат валидации
 */
export function validateIncomeInput(
  input: string
): { success: true; value: number } | { success: false; error: string } {
  const schema = z
    .string()
    .regex(/^\d+[.,]?\d{0,2}$/, 'Введите корректную сумму (например: 50000 или 50000.50)')
    .transform((val) => val.replace(',', '.'))
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, 'Сумма должна быть больше 0')
    .refine((val) => val <= 1_000_000_000, 'Сумма слишком большая');

  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, value: result.data };
  }

  return { success: false, error: result.error.errors[0]?.message || 'Некорректная сумма' };
}

/**
 * Валидирует дату периода
 * @param year - Год
 * @param month - Месяц (опционально)
 * @param quarter - Квартал (опционально)
 * @returns Результат валидации
 */
export function validatePeriodInput(
  year: number,
  month?: number,
  quarter?: number
): { success: true } | { success: false; error: string } {
  const currentYear = new Date().getFullYear();

  if (year < 2020 || year > currentYear + 1) {
    return { success: false, error: `Год должен быть между 2020 и ${currentYear + 1}` };
  }

  if (month !== undefined && (month < 1 || month > 12)) {
    return { success: false, error: 'Месяц должен быть от 1 до 12' };
  }

  if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
    return { success: false, error: 'Квартал должен быть от 1 до 4' };
  }

  return { success: true };
}
