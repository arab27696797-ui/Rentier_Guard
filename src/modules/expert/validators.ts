/**
 * Zod валидаторы для модуля экспертов
 * RentierGuard Bot
 */

import { z } from 'zod';
import {
  ExpertType,
  ExpertRequestStatus,
  RequestPriority,
} from './types';

/**
 * Схема типа эксперта
 */
export const expertTypeSchema = z.nativeEnum(ExpertType, {
  errorMap: () => ({ message: '❌ Неверный тип эксперта. Выберите из предложенных вариантов.' }),
});

/**
 * Схема статуса запроса
 */
export const expertRequestStatusSchema = z.nativeEnum(ExpertRequestStatus, {
  errorMap: () => ({ message: '❌ Неверный статус запроса.' }),
});

/**
 * Схема приоритета
 */
export const requestPrioritySchema = z.nativeEnum(RequestPriority, {
  errorMap: () => ({ message: '❌ Неверный приоритет.' }),
});

/**
 * Схема описания вопроса
 * - Минимум 20 символов (чтобы был понятен вопрос)
 * - Максимум 2000 символов
 */
export const descriptionSchema = z
  .string()
  .min(20, '❌ Описание слишком короткое. Минимум 20 символов.')
  .max(2000, '❌ Описание слишком длинное. Максимум 2000 символов.')
  .transform((val) => val.trim());

/**
 * Схема дополнительных деталей (опционально)
 * - Можно пропустить
 * - Максимум 3000 символов
 */
export const detailsSchema = z
  .string()
  .max(3000, '❌ Детали слишком длинные. Максимум 3000 символов.')
  .optional()
  .transform((val) => (val ? val.trim() : undefined));

/**
 * Схема ID пользователя
 */
export const userIdSchema = z
  .number()
  .int()
  .positive('❌ Неверный ID пользователя');

/**
 * Схема username
 */
export const usernameSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/, '❌ Неверный формат username')
  .optional();

/**
 * Основная схема запроса к эксперту
 * Используется для валидации данных при создании запроса
 */
export const expertRequestSchema = z.object({
  /** ID пользователя */
  userId: userIdSchema,

  /** Username пользователя */
  username: usernameSchema,

  /** Имя пользователя */
  firstName: z.string().max(64).optional(),

  /** Фамилия пользователя */
  lastName: z.string().max(64).optional(),

  /** Тип эксперта */
  expertType: expertTypeSchema,

  /** Описание вопроса */
  description: descriptionSchema,

  /** Дополнительные детали */
  details: detailsSchema,

  /** Приоритет (по умолчанию medium) */
  priority: requestPrioritySchema.default(RequestPriority.MEDIUM),

  /** Бесплатная консультация */
  isFree: z.boolean().default(false),
});

/**
 * Тип данных, получаемых из схемы expertRequestSchema
 */
export type ExpertRequestInput = z.infer<typeof expertRequestSchema>;

/**
 * Схема для обновления статуса запроса
 */
export const updateRequestStatusSchema = z.object({
  /** ID запроса */
  requestId: z.string().uuid('❌ Неверный формат ID запроса'),

  /** Новый статус */
  status: expertRequestStatusSchema,

  /** Комментарий эксперта (опционально) */
  comment: z.string().max(1000).optional(),

  /** ID эксперта, назначенного на запрос */
  assignedExpertId: z.number().int().positive().optional(),
});

/**
 * Тип для обновления статуса
 */
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;

/**
 * Схема для проверки бесплатной консультации
 */
export const freeConsultationSchema = z.object({
  /** ID пользователя */
  userId: userIdSchema,

  /** Год проверки (по умолчанию текущий) */
  year: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .default(() => new Date().getFullYear()),
});

/**
 * Схема для фильтрации запросов
 */
export const requestFilterSchema = z.object({
  /** Фильтр по статусу */
  status: expertRequestStatusSchema.optional(),

  /** Фильтр по типу эксперта */
  expertType: expertTypeSchema.optional(),

  /** Фильтр по дате (от) */
  fromDate: z.date().optional(),

  /** Фильтр по дате (до) */
  toDate: z.date().optional(),

  /** Только бесплатные */
  isFree: z.boolean().optional(),
});

/**
 * Схема для callback данных при выборе типа эксперта
 */
export const expertTypeCallbackSchema = z.object({
  /** Тип действия */
  action: z.literal('select_expert_type'),

  /** Выбранный тип */
  type: expertTypeSchema,
});

/**
 * Схема для callback данных при подтверждении
 */
export const confirmCallbackSchema = z.object({
  /** Тип действия */
  action: z.enum(['confirm', 'cancel', 'back']),

  /** Дополнительные данные */
  data: z.string().optional(),
});

/**
 * Схема для callback данных при пропуске шага
 */
export const skipCallbackSchema = z.object({
  /** Тип действия */
  action: z.literal('skip'),

  /** Что пропускаем */
  step: z.enum(['details']),
});

/**
 * Вспомогательная функция для безопасного парсинга callback данных
 * @param data - строка с JSON данными
 * @param schema - Zod схема для валидации
 * @returns результат парсинга или null при ошибке
 */
export function parseCallbackData<T>(
  data: string,
  schema: z.ZodSchema<T>
): T | null {
  try {
    const parsed = JSON.parse(data);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Функция для валидации с преобразованием ошибок в читаемый формат
 * @param schema - Zod схема
 * @param data - данные для валидации
 * @returns объект с результатом валидации
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}
