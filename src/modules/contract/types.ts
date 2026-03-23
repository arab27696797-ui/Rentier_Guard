/**
 * =========================================
 * Модуль Договоров - Типы и Интерфейсы
 * RentierGuard Telegram Bot
 * =========================================
 */

import { Context } from 'telegraf';
import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes';

// =========================================
// ENUMS
// =========================================

/**
 * Тип договора аренды
 */
export enum ContractType {
  RESIDENTIAL = 'residential',   // Жилое помещение
  COMMERCIAL = 'commercial',     // Коммерческое помещение
}

/**
 * Статус договора
 */
export enum ContractStatus {
  DRAFT = 'draft',               // Черновик
  ACTIVE = 'active',             // Действующий
  EXPIRED = 'expired',           // Истёк
  TERMINATED = 'terminated',     // Расторгнут
  PENDING = 'pending',           // Ожидает подписания
}

/**
 * Тип дополнительного соглашения
 */
export enum AddendumType {
  PRICE_CHANGE = 'price_change',     // Изменение цены
  TERM_CHANGE = 'term_change',       // Изменение срока
  OTHER = 'other',                   // Другое
}

/**
 * Состояние инвентарного пункта
 */
export enum InventoryItemCondition {
  NEW = 'new',                       // Новое
  GOOD = 'good',                     // Хорошее
  SATISFACTORY = 'satisfactory',     // Удовлетворительное
  POOR = 'poor',                     // Плохое
}

// =========================================
// INTERFACES - Данные договора
// =========================================

/**
 * Данные для генерации договора аренды
 */
export interface ContractData {
  /** ID договора в БД */
  id?: string;
  
  /** ID пользователя-арендодателя */
  landlordId: string;
  
  /** Тип договора */
  contractType: ContractType;
  
  /** Адрес арендуемого объекта */
  propertyAddress: string;
  
  /** ФИО арендатора */
  tenantFullName: string;
  
  /** Паспортные данные арендатора */
  tenantPassport: string;
  
  /** Телефон арендатора */
  tenantPhone: string;
  
  /** Дата начала аренды */
  startDate: Date;
  
  /** Дата окончания аренды */
  endDate: Date;
  
  /** Ежемесячная арендная плата */
  monthlyRent: number;
  
  /** Сумма залога (депозит) */
  depositAmount: number;
  
  /** Требуется регистрация в Росреестре */
  needsRosreestrRegistration: boolean;
  
  /** Дополнительные условия */
  additionalTerms?: string;
  
  /** Статус договора */
  status?: ContractStatus;
  
  /** Дата создания */
  createdAt?: Date;
  
  /** Дата обновления */
  updatedAt?: Date;
}

/**
 * Данные для акта приема-передачи
 */
export interface ActData {
  /** ID акта в БД */
  id?: string;
  
  /** ID связанного договора */
  contractId: string;
  
  /** ID пользователя */
  userId: string;
  
  /** Тип акта: прием или передача */
  actType: 'acceptance' | 'transfer';
  
  /** Дата составления акта */
  actDate: Date;
  
  /** Пункты инвентаризации */
  inventoryItems: InventoryItemData[];
  
  /** Показания счетчиков (опционально) */
  meterReadings?: {
    electricity?: number;
    water?: number;
    gas?: number;
  };
  
  /** Примечания */
  notes?: string;
  
  /** Дата создания */
  createdAt?: Date;
}

/**
 * Пункт инвентаризации
 */
export interface InventoryItemData {
  /** ID пункта */
  id?: string;
  
  /** Название предмета */
  name: string;
  
  /** Количество */
  quantity: number;
  
  /** Состояние */
  condition: InventoryItemCondition;
  
  /** Описание/примечания */
  description?: string;
}

/**
 * Данные для дополнительного соглашения
 */
export interface AddendumData {
  /** ID допсоглашения */
  id?: string;
  
  /** ID связанного договора */
  contractId: string;
  
  /** ID пользователя */
  userId: string;
  
  /** Тип изменения */
  addendumType: AddendumType;
  
  /** Новое значение */
  newValue: string;
  
  /** Предыдущее значение (для истории) */
  oldValue?: string;
  
  /** Дата вступления в силу */
  effectiveDate: Date;
  
  /** Причина изменения */
  reason?: string;
  
  /** Дата создания */
  createdAt?: Date;
}

// =========================================
// INTERFACES - Контекст сцен
// =========================================

/**
 * Расширенный контекст сцены создания договора
 */
export interface ContractWizardContext extends WizardContext {
  session: WizardSessionData & {
    contractData?: Partial<ContractData>;
    actData?: Partial<ActData>;
    addendumData?: Partial<AddendumData>;
    tempInventoryItems?: InventoryItemData[];
    userContracts?: { id: string; address: string }[];
  };
}

/**
 * Результат валидации
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Ответ сервиса
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =========================================
// TYPE ALIASES
// =========================================

/** Краткая информация о договоре для списка */
export type ContractSummary = {
  id: string;
  address: string;
  tenantName: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
};

/** Параметры для создания договора */
export type CreateContractInput = Omit<ContractData, 'id' | 'createdAt' | 'updatedAt'>;

/** Параметры для создания акта */
export type CreateActInput = Omit<ActData, 'id' | 'createdAt'>;

/** Параметры для создания допсоглашения */
export type CreateAddendumInput = Omit<AddendumData, 'id' | 'createdAt'>;
