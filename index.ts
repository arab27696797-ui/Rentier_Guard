/**
 * Глобальные типы для RentierGuard Bot
 * Определяет расширенный Context с сессией и пользовательскими данными
 */

import type { Context as TelegrafContext, Scenes } from 'telegraf';
import type { UserRole } from '@prisma/client';

// ============================================================================
// Сессия пользователя
// ============================================================================

/**
 * Данные сессии пользователя в боте
 */
export interface SessionData {
  /** ID пользователя в системе */
  userId: string | null;
  /** Текущая роль пользователя */
  role: UserRole | null;
  /** Выбранный объект недвижимости */
  selectedPropertyId: string | null;
  /** Данные для временного хранения в wizard-сценах */
  wizardData: Record<string, unknown>;
  /** Временные данные форм */
  formData: Record<string, unknown>;
  /** Время последней активности */
  lastActivity: Date;
}

/**
 * Пустая сессия (начальное состояние)
 */
export const createEmptySession = (): SessionData => ({
  userId: null,
  role: null,
  selectedPropertyId: null,
  wizardData: {},
  formData: {},
  lastActivity: new Date(),
});

// ============================================================================
// Расширенный Context
// ============================================================================

/**
 * Расширенный контекст Telegraf с сессией и сценами
 */
export interface BotContext extends TelegrafContext {
  /** Сессия пользователя */
  session: SessionData;
  /** Scene context для wizard-сцен */
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  /** Wizard state для многошаговых сцен */
  wizard: Scenes.WizardContextWizard<BotContext>;
}

// ============================================================================
// Типы для работы с пользователями
// ============================================================================

/**
 * Базовая информация о пользователе
 */
export interface UserInfo {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Данные для создания пользователя
 */
export interface CreateUserInput {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  role?: UserRole;
}

// ============================================================================
// Типы для ответов сервисов
// ============================================================================

/**
 * Результат операции сервиса
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Пагинированный результат
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Типы для клавиатур
// ============================================================================

/**
 * Кнопка inline-клавиатуры
 */
export interface InlineButton {
  text: string;
  callbackData: string;
}

/**
 * Строка inline-клавиатуры
 */
export type InlineKeyboardRow = InlineButton[];

// ============================================================================
// Типы для ошибок
// ============================================================================

/**
 * Коды ошибок приложения
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Пользовательская ошибка приложения
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================================
// Константы
// ============================================================================

/** Максимальное количество объектов на одного пользователя */
export const MAX_PROPERTIES_PER_USER = 50;

/** Максимальное количество договоров на один объект */
export const MAX_CONTRACTS_PER_PROPERTY = 20;

/** Роли пользователей */
export const USER_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  TENANT: 'TENANT',
  EXPERT: 'EXPERT',
} as const;

/** Типы объектов недвижимости */
export const PROPERTY_TYPES = {
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  ROOM: 'ROOM',
  COMMERCIAL: 'COMMERCIAL',
  LAND: 'LAND',
} as const;

/** Статусы договоров */
export const CONTRACT_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const;
