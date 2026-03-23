/**
 * =========================================
 * Модуль Договоров - Zod Валидаторы
 * RentierGuard Telegram Bot
 * =========================================
 */

import { z } from 'zod';
import {
  ContractType,
  ContractStatus,
  AddendumType,
  InventoryItemCondition,
} from './types';

// =========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =========================================

/**
 * Проверка формата даты ДД.ММ.ГГГГ
 */
const isValidDateFormat = (date: string): boolean => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(\d{4})$/;
  if (!regex.test(date)) return false;
  
  const [day, month, year] = date.split('.').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  return (
    dateObj.getDate() === day &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getFullYear() === year
  );
};

/**
 * Проверка, что дата не в прошлом
 */
const isFutureOrToday = (date: string): boolean => {
  const [day, month, year] = date.split('.').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj >= today;
};

/**
 * Проверка, что endDate позже startDate
 */
const isEndDateAfterStart = (endDate: string, startDate: string): boolean => {
  const [startDay, startMonth, startYear] = startDate.split('.').map(Number);
  const [endDay, endMonth, endYear] = endDate.split('.').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  return end > start;
};

/**
 * Проверка формата телефона
 */
const isValidPhone = (phone: string): boolean => {
  // Поддерживаемые форматы: +7XXXXXXXXXX, 8XXXXXXXXXX, +7 (XXX) XXX-XX-XX
  const regex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

/**
 * Проверка формата паспортных данных
 */
const isValidPassport = (passport: string): boolean => {
  // Формат: 1234 567890 или 1234567890
  const regex = /^\d{4}\s?\d{6}$/;
  return regex.test(passport.replace(/\s/g, ''));
};

// =========================================
// ZOD СХЕМЫ
// =========================================

/**
 * Схема для типа договора
 */
export const contractTypeSchema = z.enum([
  ContractType.RESIDENTIAL,
  ContractType.COMMERCIAL,
], {
  errorMap: () => ({ message: '❌ Выберите тип договора: жилье или коммерция' }),
});

/**
 * Схема для адреса объекта
 */
export const addressSchema = z
  .string()
  .min(10, '❌ Адрес слишком короткий. Минимум 10 символов')
  .max(300, '❌ Адрес слишком длинный. Максимум 300 символов')
  .regex(
    /^[а-яА-ЯёЁ0-9\s,.\-\/]+$/i,
    '❌ Адрес должен содержать только русские буквы, цифры и знаки препинания'
  );

/**
 * Схема для ФИО
 */
export const fullNameSchema = z
  .string()
  .min(5, '❌ ФИО слишком короткое. Минимум 5 символов')
  .max(150, '❌ ФИО слишком длинное. Максимум 150 символов')
  .regex(
    /^[а-яА-ЯёЁ\s\-]+$/i,
    '❌ ФИО должно содержать только русские буквы, пробелы и дефисы'
  );

/**
 * Схема для паспортных данных
 */
export const passportSchema = z
  .string()
  .refine(isValidPassport, {
    message: '❌ Неверный формат паспорта. Используйте формат: 1234 567890',
  });

/**
 * Схема для телефона
 */
export const phoneSchema = z
  .string()
  .refine(isValidPhone, {
    message: '❌ Неверный формат телефона. Используйте формат: +7XXXXXXXXXX',
  });

/**
 * Схема для даты (ввод пользователя)
 */
export const dateInputSchema = z
  .string()
  .refine(isValidDateFormat, {
    message: '❌ Неверный формат даты. Используйте формат: ДД.ММ.ГГГГ',
  })
  .refine(isFutureOrToday, {
    message: '❌ Дата не может быть в прошлом',
  });

/**
 * Схема для даты окончания аренды
 */
export const endDateSchema = (startDate: string) =>
  z
    .string()
    .refine(isValidDateFormat, {
      message: '❌ Неверный формат даты. Используйте формат: ДД.ММ.ГГГГ',
    })
    .refine((val) => isEndDateAfterStart(val, startDate), {
      message: '❌ Дата окончания должна быть позже даты начала',
    });

/**
 * Схема для денежной суммы
 */
export const amountSchema = z
  .string()
  .or(z.number())
  .transform((val) => (typeof val === 'string' ? parseFloat(val.replace(/\s/g, '').replace(',', '.')) : val))
  .refine((val) => !isNaN(val) && val > 0, {
    message: '❌ Сумма должна быть положительным числом',
  })
  .refine((val) => val <= 1000000000, {
    message: '❌ Сумма слишком большая',
  });

/**
 * Схема для булевого значения (да/нет)
 */
export const booleanChoiceSchema = z.enum(['yes', 'no'], {
  errorMap: () => ({ message: '❌ Выберите "Да" или "Нет"' }),
});

/**
 * =========================================
 * ОСНОВНЫЕ СХЕМЫ ДЛЯ СЦЕН
 * =========================================
 */

/**
 * Схема для полных данных договора
 */
export const contractSchema = z.object({
  landlordId: z.string().uuid('❌ Неверный ID арендодателя'),
  contractType: contractTypeSchema,
  propertyAddress: addressSchema,
  tenantFullName: fullNameSchema,
  tenantPassport: passportSchema,
  tenantPhone: phoneSchema,
  startDate: z.date(),
  endDate: z.date(),
  monthlyRent: z.number().positive('❌ Арендная плата должна быть положительной'),
  depositAmount: z.number().min(0, '❌ Залог не может быть отрицательным'),
  needsRosreestrRegistration: z.boolean(),
  additionalTerms: z.string().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
});

/**
 * Схема для пункта инвентаризации
 */
export const inventoryItemSchema = z.object({
  name: z
    .string()
    .min(2, '❌ Название слишком короткое')
    .max(200, '❌ Название слишком длинное'),
  quantity: z
    .number()
    .int('❌ Количество должно быть целым числом')
    .positive('❌ Количество должно быть положительным')
    .max(10000, '❌ Количество слишком большое'),
  condition: z.nativeEnum(InventoryItemCondition, {
    errorMap: () => ({ message: '❌ Выберите состояние из списка' }),
  }),
  description: z.string().max(500, '❌ Описание слишком длинное').optional(),
});

/**
 * Схема для акта приема-передачи
 */
export const actSchema = z.object({
  contractId: z.string().uuid('❌ Неверный ID договора'),
  userId: z.string().uuid('❌ Неверный ID пользователя'),
  actType: z.enum(['acceptance', 'transfer'], {
    errorMap: () => ({ message: '❌ Неверный тип акта' }),
  }),
  actDate: z.date(),
  inventoryItems: z
    .array(inventoryItemSchema)
    .min(1, '❌ Добавьте хотя бы один пункт инвентаризации'),
  meterReadings: z
    .object({
      electricity: z.number().optional(),
      water: z.number().optional(),
      gas: z.number().optional(),
    })
    .optional(),
  notes: z.string().max(2000, '❌ Примечания слишком длинные').optional(),
});

/**
 * Схема для дополнительного соглашения
 */
export const addendumSchema = z.object({
  contractId: z.string().uuid('❌ Неверный ID договора'),
  userId: z.string().uuid('❌ Неверный ID пользователя'),
  addendumType: z.nativeEnum(AddendumType, {
    errorMap: () => ({ message: '❌ Выберите тип изменения' }),
  }),
  newValue: z
    .string()
    .min(1, '❌ Введите новое значение')
    .max(500, '❌ Значение слишком длинное'),
  oldValue: z.string().optional(),
  effectiveDate: z.date(),
  reason: z.string().max(1000, '❌ Причина слишком длинная').optional(),
});

// =========================================
// ТИПЫ ДЛЯ ZOD СХЕМ
// =========================================

export type ContractSchemaType = z.infer<typeof contractSchema>;
export type ActSchemaType = z.infer<typeof actSchema>;
export type InventoryItemSchemaType = z.infer<typeof inventoryItemSchema>;
export type AddendumSchemaType = z.infer<typeof addendumSchema>;
