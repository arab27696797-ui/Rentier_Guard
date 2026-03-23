/**
 * Типы и интерфейсы модуля экспертов
 * RentierGuard Bot
 */

import { Context } from 'telegraf';

/**
 * Тип эксперта
 */
export enum ExpertType {
  LAWYER = 'lawyer',           // Юрист ⚖️
  TAX = 'tax',                 // Налоговый консультант 💼
  ACCOUNTANT = 'accountant',   // Бухгалтер 📊
}

/**
 * Статусы запроса к эксперту
 */
export enum ExpertRequestStatus {
  PENDING = 'pending',           // Ожидает обработки
  IN_PROGRESS = 'in_progress',   // В работе
  WAITING_INFO = 'waiting_info', // Ожидает доп. информации
  COMPLETED = 'completed',       // Завершён
  CANCELLED = 'cancelled',       // Отменён
}

/**
 * Приоритет запроса
 */
export enum RequestPriority {
  LOW = 'low',       // Низкий
  MEDIUM = 'medium', // Средний
  HIGH = 'high',     // Высокий
  URGENT = 'urgent', // Срочный
}

/**
 * Данные запроса к эксперту
 */
export interface ExpertRequestData {
  /** Уникальный идентификатор запроса */
  id: string;
  /** ID пользователя Telegram */
  userId: number;
  /** Username пользователя */
  username?: string;
  /** Имя пользователя */
  firstName?: string;
  /** Фамилия пользователя */
  lastName?: string;
  /** Тип эксперта */
  expertType: ExpertType;
  /** Описание вопроса */
  description: string;
  /** Дополнительные детали (опционально) */
  details?: string;
  /** Статус запроса */
  status: ExpertRequestStatus;
  /** Приоритет */
  priority: RequestPriority;
  /** Бесплатная консультация */
  isFree: boolean;
  /** Дата создания */
  createdAt: Date;
  /** Дата обновления */
  updatedAt: Date;
  /** Дата завершения */
  completedAt?: Date;
  /** ID эксперта, назначенного на запрос */
  assignedExpertId?: number;
  /** Комментарий эксперта */
  expertComment?: string;
}

/**
 * Уведомление для канала экспертов
 */
export interface ExpertNotification {
  /** Тип уведомления */
  type: 'new_request' | 'status_change' | 'urgent';
  /** Данные запроса */
  request: ExpertRequestData;
  /** Дополнительное сообщение */
  message?: string;
}

/**
 * Результат создания запроса
 */
export interface CreateRequestResult {
  /** Успешность операции */
  success: boolean;
  /** Сообщение об ошибке */
  error?: string;
  /** Созданный запрос */
  request?: ExpertRequestData;
}

/**
 * Данные о бесплатной консультации пользователя
 */
export interface FreeConsultationInfo {
  /** Использована ли бесплатная консультация */
  used: boolean;
  /** Дата использования */
  usedAt?: Date;
  /** Год использования */
  year?: number;
}

/**
 * Расширенный контекст сессии для модуля экспертов
 */
export interface ExpertWizardSession {
  /** Текущий шаг визарда */
  step: number;
  /** Выбранный тип эксперта */
  expertType?: ExpertType;
  /** Описание вопроса */
  description?: string;
  /** Дополнительные детали */
  details?: string;
  /** Приоритет запроса */
  priority?: RequestPriority;
  /** Флаг бесплатной консультации */
  isFree?: boolean;
}

/**
 * Расширенный контекст для сцен экспертов
 */
export interface ExpertWizardContext extends Context {
  /** Данные сессии визарда */
  wizard: {
    state: ExpertWizardSession;
    next: () => Promise<void>;
    back: () => Promise<void>;
    selectStep: (step: number) => void;
  };
  /** Сессия пользователя */
  session: {
    expertWizard?: ExpertWizardSession;
    [key: string]: unknown;
  };
}

/**
 * Опции для отправки уведомления
 */
export interface NotificationOptions {
  /** Отправлять ли уведомление в канал */
  sendToChannel?: boolean;
  /** Отправлять ли уведомление пользователю */
  notifyUser?: boolean;
  /** Дополнительный текст */
  customMessage?: string;
}

/**
 * Конфигурация канала уведомлений
 */
export interface NotificationChannelConfig {
  /** ID канала/группы */
  channelId: string;
  /** ID топика (для супергрупп) */
  messageThreadId?: number;
  /** Токен бота для отправки */
  botToken?: string;
  /** URL вебхука для отправки */
  webhookUrl?: string;
}

/**
 * Фильтр для получения списка запросов
 */
export interface RequestFilter {
  /** Фильтр по статусу */
  status?: ExpertRequestStatus;
  /** Фильтр по типу эксперта */
  expertType?: ExpertType;
  /** Фильтр по дате (от) */
  fromDate?: Date;
  /** Фильтр по дате (до) */
  toDate?: Date;
  /** Только бесплатные */
  isFree?: boolean;
}

/**
 * Статистика по запросам пользователя
 */
export interface UserRequestStats {
  /** Всего запросов */
  total: number;
  /** Активных запросов */
  active: number;
  /** Завершённых */
  completed: number;
  /** Бесплатных использовано */
  freeUsed: number;
  /** Доступно бесплатных */
  freeAvailable: number;
}
