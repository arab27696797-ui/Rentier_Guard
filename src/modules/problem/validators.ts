/**
 * Zod валидаторы для модуля работы с проблемами
 * RentierGuard Bot
 */

import { z } from 'zod';
import { ProblemType, BadTenantReason } from './types';

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Валидация суммы (положительное число)
 */
const positiveAmount = z.number().positive('Сумма должна быть больше 0');

/**
 * Валидация строки (не пустая, обрезка)
 */
const requiredString = z.string().min(1, 'Обязательное поле').trim();

/**
 * Валидация даты в формате DD.MM.YYYY
 */
const dateString = z.string().regex(
  /^\d{2}\.\d{2}\.\d{4}$/,
  'Дата должна быть в формате ДД.ММ.ГГГГ'
);

/**
 * Валидация опциональной даты
 */
const optionalDateString = z.string()
  .regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Дата должна быть в формате ДД.ММ.ГГГГ')
  .optional()
  .or(z.literal(''));

// ============================================
// СХЕМЫ ПРОБЛЕМ
// ============================================

/**
 * Схема для проблемы неуплаты аренды
 */
export const nonPaymentSchema = z.object({
  type: z.literal(ProblemType.NON_PAYMENT),
  debtAmount: positiveAmount,
  delayDays: z.number().int().min(1, 'Количество дней должно быть больше 0'),
  lastPaymentDate: optionalDateString,
  monthlyRent: positiveAmount.optional(),
  tenantName: requiredString.optional(),
  contractDate: optionalDateString,
  propertyAddress: requiredString.optional(),
});

/**
 * Схема для проблемы повреждения имущества
 */
export const damageSchema = z.object({
  type: z.literal(ProblemType.PROPERTY_DAMAGE),
  damageDescription: requiredString.min(10, 'Описание должно быть не менее 10 символов'),
  repairCost: positiveAmount,
  photosAvailable: z.boolean(),
  inventoryListAvailable: z.boolean(),
  tenantName: requiredString.optional(),
  contractDate: optionalDateString,
  propertyAddress: requiredString.optional(),
});

/**
 * Схема для проблемы выезда без оплаты
 */
export const evictionSchema = z.object({
  type: z.literal(ProblemType.EVICTION_WITHOUT_PAY),
  debtAmount: positiveAmount,
  evictionDate: dateString,
  keysReturned: z.boolean(),
  forwardingAddress: z.string().optional(),
  tenantName: requiredString.optional(),
  contractDate: optionalDateString,
  propertyAddress: requiredString.optional(),
});

/**
 * Схема для других проблем
 */
export const otherProblemSchema = z.object({
  type: z.literal(ProblemType.OTHER),
  description: requiredString.min(10, 'Описание должно быть не менее 10 символов'),
  tenantName: requiredString.optional(),
  contractDate: optionalDateString,
  propertyAddress: requiredString.optional(),
});

/**
 * Объединённая схема данных проблемы
 */
export const problemDataSchema = z.discriminatedUnion('type', [
  nonPaymentSchema,
  damageSchema,
  evictionSchema,
  otherProblemSchema,
]);

// ============================================
// СХЕМА СЦЕНАРИЯ ПРОБЛЕМЫ
// ============================================

/**
 * Схема шага сценария
 */
export const problemScenarioStepSchema = z.object({
  order: z.number().int().min(1),
  title: requiredString,
  description: requiredString,
  deadline: z.string().optional(),
  documents: z.array(z.string()).optional(),
  tips: z.array(z.string()).optional(),
});

/**
 * Схема сценария решения проблемы
 */
export const problemScenarioSchema = z.object({
  type: z.nativeEnum(ProblemType),
  title: requiredString,
  description: requiredString,
  steps: z.array(problemScenarioStepSchema).min(1),
  legalBasis: z.array(z.string()),
  timeLimits: z.object({
    preTrial: requiredString,
    courtFiling: requiredString,
  }),
  documents: z.array(z.string()),
});

// ============================================
// СХЕМА ЧЁРНОГО СПИСКА
// ============================================

/**
 * Схема паспортных данных
 */
export const passportDataSchema = z.string()
  .regex(
    /^\d{4}\s?\d{6}$/,
    'Паспортные данные должны быть в формате: 1234 567890'
  )
  .optional()
  .or(z.literal(''));

/**
 * Схема телефонного номера
 */
export const phoneNumberSchema = z.string()
  .regex(
    /^\+?\d{10,15}$/,
    'Номер телефона должен содержать от 10 до 15 цифр'
  )
  .optional()
  .or(z.literal(''));

/**
 * Схема данных для чёрного списка
 */
export const badTenantSchema = z.object({
  userId: requiredString,
  fullName: requiredString.min(3, 'ФИО должно быть не менее 3 символов'),
  passportData: passportDataSchema,
  phoneNumber: phoneNumberSchema,
  reason: z.nativeEnum(BadTenantReason),
  description: requiredString.min(10, 'Описание должно быть не менее 10 символов'),
  contractDate: optionalDateString,
  contractEndDate: optionalDateString,
  debtAmount: positiveAmount.optional(),
});

/**
 * Схема для обновления записи в чёрном списке
 */
export const badTenantUpdateSchema = badTenantSchema.partial().omit({ userId: true });

/**
 * Схема для удаления записи
 */
export const badTenantDeleteSchema = z.object({
  id: requiredString,
  userId: requiredString,
});

// ============================================
// ТИПЫ ДЛЯ TYPESCRIPT
// ============================================

export type NonPaymentInput = z.infer<typeof nonPaymentSchema>;
export type DamageInput = z.infer<typeof damageSchema>;
export type EvictionInput = z.infer<typeof evictionSchema>;
export type OtherProblemInput = z.infer<typeof otherProblemSchema>;
export type ProblemDataInput = z.infer<typeof problemDataSchema>;
export type ProblemScenarioInput = z.infer<typeof problemScenarioSchema>;
export type BadTenantInput = z.infer<typeof badTenantSchema>;
export type BadTenantUpdateInput = z.infer<typeof badTenantUpdateSchema>;
export type BadTenantDeleteInput = z.infer<typeof badTenantDeleteSchema>;

// ============================================
// ФУНКЦИИ ВАЛИДАЦИИ
// ============================================

/**
 * Валидировать данные проблемы
 */
export function validateProblemData(data: unknown): {
  success: boolean;
  data?: ProblemDataInput;
  errors?: string[];
} {
  const result = problemDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Валидировать данные чёрного списка
 */
export function validateBadTenantData(data: unknown): {
  success: boolean;
  data?: BadTenantInput;
  errors?: string[];
} {
  const result = badTenantSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Валидировать сумму долга
 */
export function validateDebtAmount(amount: string): {
  success: boolean;
  value?: number;
  error?: string;
} {
  const cleaned = amount.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  
  if (isNaN(num) || num <= 0) {
    return { success: false, error: 'Введите корректную сумму больше 0' };
  }
  
  return { success: true, value: num };
}

/**
 * Валидировать количество дней
 */
export function validateDays(days: string): {
  success: boolean;
  value?: number;
  error?: string;
} {
  const num = parseInt(days.trim(), 10);
  
  if (isNaN(num) || num < 1) {
    return { success: false, error: 'Введите корректное количество дней (минимум 1)' };
  }
  
  return { success: true, value: num };
}

/**
 * Валидировать ФИО
 */
export function validateFullName(name: string): {
  success: boolean;
  error?: string;
} {
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { success: false, error: 'ФИО должно быть не менее 3 символов' };
  }
  
  // Проверка на наличие хотя бы двух слов (Фамилия Имя)
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) {
    return { success: false, error: 'Введите полное ФИО (Фамилия Имя Отчество)' };
  }
  
  return { success: true };
}
