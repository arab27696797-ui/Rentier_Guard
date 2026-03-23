/**
 * @fileoverview Zod схемы валидации для модуля объектов недвижимости
 * @module modules/property/validators
 */

import { z } from 'zod';
import { PropertyType, TaxRegime } from './types';

// ============================================
// CONSTANTS
// ============================================

const MIN_ADDRESS_LENGTH = 10;
const MAX_ADDRESS_LENGTH = 500;
const CADASTRAL_NUMBER_REGEX = /^\d{2}:\d{2}:\d{6,7}:\d+$/;

// ============================================
// ERROR MESSAGES
// ============================================

const ErrorMessages = {
  ADDRESS: {
    REQUIRED: '❌ Адрес обязателен для заполнения',
    MIN_LENGTH: `❌ Адрес слишком короткий (минимум ${MIN_ADDRESS_LENGTH} символов)`,
    MAX_LENGTH: `❌ Адрес слишком длинный (максимум ${MAX_ADDRESS_LENGTH} символов)`,
  },
  CADASTRAL_NUMBER: {
    INVALID: '❌ Неверный формат кадастрового номера. Пример: 77:01:0001012:15',
  },
  TYPE: {
    REQUIRED: '❌ Тип объекта обязателен',
    INVALID: '❌ Неверный тип объекта',
  },
  TAX_REGIME: {
    REQUIRED: '❌ Налоговый режим обязателен',
    INVALID: '❌ Неверный налоговый режим',
  },
};

// ============================================
// SCHEMAS
// ============================================

/** Схема валидации адреса */
export const addressSchema = z
  .string({
    required_error: ErrorMessages.ADDRESS.REQUIRED,
    invalid_type_error: ErrorMessages.ADDRESS.REQUIRED,
  })
  .trim()
  .min(MIN_ADDRESS_LENGTH, ErrorMessages.ADDRESS.MIN_LENGTH)
  .max(MAX_ADDRESS_LENGTH, ErrorMessages.ADDRESS.MAX_LENGTH);

/** Схема валидации кадастрового номера (опционально) */
export const cadastralNumberSchema = z
  .string()
  .trim()
  .transform((val) => (val === '' ? null : val))
  .refine(
    (val) => val === null || CADASTRAL_NUMBER_REGEX.test(val),
    ErrorMessages.CADASTRAL_NUMBER.INVALID
  )
  .nullable()
  .optional();

/** Схема валидации типа объекта */
export const propertyTypeSchema = z.nativeEnum(PropertyType, {
  required_error: ErrorMessages.TYPE.REQUIRED,
  invalid_type_error: ErrorMessages.TYPE.INVALID,
});

/** Схема валидации налогового режима */
export const taxRegimeSchema = z.nativeEnum(TaxRegime, {
  required_error: ErrorMessages.TAX_REGIME.REQUIRED,
  invalid_type_error: ErrorMessages.TAX_REGIME.INVALID,
});

/** Схема валидации ID объекта */
export const propertyIdSchema = z
  .string()
  .uuid('❌ Неверный формат ID объекта');

/** Схема валидации данных для создания объекта */
export const createPropertySchema = z.object({
  userId: z.number().int().positive('❌ Неверный ID пользователя'),
  address: addressSchema,
  cadastralNumber: cadastralNumberSchema,
  type: propertyTypeSchema,
  taxRegime: taxRegimeSchema,
});

/** Схема валидации данных для обновления объекта */
export const updatePropertySchema = z.object({
  address: addressSchema.optional(),
  cadastralNumber: cadastralNumberSchema,
  type: propertyTypeSchema.optional(),
  taxRegime: taxRegimeSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  '❌ Необходимо указать хотя бы одно поле для обновления'
);

// ============================================
// TYPES
// ============================================

export type CreatePropertySchema = z.infer<typeof createPropertySchema>;
export type UpdatePropertySchema = z.infer<typeof updatePropertySchema>;
