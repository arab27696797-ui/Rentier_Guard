/**
 * Типы и интерфейсы модуля Росреестра
 * RentierGuard Bot
 */

import { Context } from 'telegraf';

/**
 * Пункт чек-листа документов
 */
export interface ChecklistItem {
  /** Уникальный идентификатор пункта */
  id: string;
  /** Название документа */
  name: string;
  /** Описание/требования к документу */
  description: string;
  /** Emoji для визуального отображения */
  emoji: string;
  /** Количество экземпляров (если применимо) */
  copies?: number;
  /** Отмечен ли пункт */
  checked: boolean;
  /** Ссылка на бланк/шаблон */
  templateUrl?: string;
}

/**
 * Чек-лист документов для регистрации договора аренды
 */
export interface RosreestrChecklist {
  /** ID пользователя */
  userId: number;
  /** Дата создания чек-листа */
  createdAt: Date;
  /** Список пунктов */
  items: ChecklistItem[];
  /** Все ли пункты отмечены */
  isComplete: boolean;
  /** Требуется ли регистрация (срок > 1 года) */
  registrationRequired: boolean;
}

/**
 * Информация о МФЦ
 */
export interface MFCInfo {
  /** Название МФЦ */
  name: string;
  /** Адрес */
  address: string;
  /** Город */
  city: string;
  /** Координаты */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Режим работы */
  workingHours?: string;
  /** Телефон */
  phone?: string;
  /** Ссылка на Яндекс.Карты */
  yandexMapUrl: string;
}

/**
 * Данные договора для проверки
 */
export interface ContractData {
  /** Срок договора в месяцах */
  durationMonths: number;
  /** Тип недвижимости */
  propertyType: 'residential' | 'commercial' | 'land';
  /** Арендодатель - юрлицо? */
  isLandlordLegalEntity: boolean;
  /** Арендатор - юрлицо? */
  isTenantLegalEntity: boolean;
}

/**
 * Расширенный контекст с сессией для чек-листа
 */
export interface RosreestrContext extends Context {
  session: {
    /** Текущий чек-лист пользователя */
    checklist?: RosreestrChecklist;
    /** Данные для поиска МФЦ */
    mfcSearch?: {
      city?: string;
      coordinates?: { lat: number; lng: number };
    };
    /** Временные данные сцены */
    sceneData?: {
      step?: number;
      contractDuration?: number;
    };
  };
}

/**
 * Результат проверки необходимости регистрации
 */
export interface RegistrationCheckResult {
  /** Требуется ли регистрация */
  required: boolean;
  /** Причина/пояснение */
  reason: string;
  /** Ссылка на закон */
  lawReference: string;
}

/**
 * Инструкция по регистрации
 */
export interface RegistrationGuide {
  /** Заголовок */
  title: string;
  /** Шаги инструкции */
  steps: string[];
  /** Сроки регистрации */
  timeline: string;
  /** Стоимость */
  cost: string;
  /** Предупреждения */
  warnings: string[];
}
