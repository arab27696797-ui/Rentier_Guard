/**
 * Типы данных для модуля работы с проблемами
 * RentierGuard Bot
 */

import { Context } from 'telegraf';
import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes';

// ============================================
// ТИПЫ ПРОБЛЕМ
// ============================================

/**
 * Тип проблемы с арендатором
 */
export enum ProblemType {
  NON_PAYMENT = 'non_payment',      // Не платит аренду
  PROPERTY_DAMAGE = 'damage',       // Портит имущество
  EVICTION_WITHOUT_PAY = 'eviction', // Выезд без оплаты
  OTHER = 'other',                  // Другое
}

/**
 * Названия типов проблем для отображения
 */
export const ProblemTypeLabels: Record<ProblemType, string> = {
  [ProblemType.NON_PAYMENT]: 'Не платит аренду 💰',
  [ProblemType.PROPERTY_DAMAGE]: 'Портит имущество 🔨',
  [ProblemType.EVICTION_WITHOUT_PAY]: 'Выезд без оплаты 🚪',
  [ProblemType.OTHER]: 'Другое ❓',
};

// ============================================
// СЦЕНАРИИ РЕШЕНИЯ
// ============================================

/**
 * Шаг сценария решения проблемы
 */
export interface ProblemScenarioStep {
  order: number;
  title: string;
  description: string;
  deadline?: string;      // Срок выполнения
  documents?: string[];   // Необходимые документы
  tips?: string[];        // Советы
}

/**
 * Сценарий решения проблемы
 */
export interface ProblemScenario {
  type: ProblemType;
  title: string;
  description: string;
  steps: ProblemScenarioStep[];
  legalBasis: string[];   // Правовое обоснование
  timeLimits: {
    preTrial: string;     // Досудебное урегулирование
    courtFiling: string;  // Срок подачи в суд
  };
  documents: string[];    // Список необходимых документов
}

// ============================================
// ДАННЫЕ ПРОБЛЕМЫ
// ============================================

/**
 * Базовые данные проблемы
 */
export interface ProblemData {
  type: ProblemType;
  tenantName?: string;
  contractDate?: string;
  propertyAddress?: string;
}

/**
 * Данные для проблемы неуплаты
 */
export interface NonPaymentData extends ProblemData {
  debtAmount: number;
  delayDays: number;
  lastPaymentDate?: string;
  monthlyRent: number;
}

/**
 * Данные для проблемы повреждения имущества
 */
export interface DamageData extends ProblemData {
  damageDescription: string;
  repairCost: number;
  photosAvailable: boolean;
  inventoryListAvailable: boolean;
}

/**
 * Данные для проблемы выезда без оплаты
 */
export interface EvictionData extends ProblemData {
  debtAmount: number;
  evictionDate: string;
  keysReturned: boolean;
  forwardingAddress?: string;
}

/**
 * Объединённый тип данных проблемы
 */
export type ProblemDetails = NonPaymentData | DamageData | EvictionData | ProblemData;

// ============================================
// ЧЁРНЫЙ СПИСОК
// ============================================

/**
 * Данные арендатора для чёрного списка
 */
export interface BadTenantData {
  id?: string;
  userId: string;           // ID владельца, добавившего запись
  fullName: string;         // ФИО арендатора
  passportData?: string;    // Паспортные данные (опционально)
  phoneNumber?: string;     // Телефон (опционально)
  reason: BadTenantReason;  // Причина добавления
  description: string;      // Описание ситуации
  contractDate?: string;    // Дата договора
  contractEndDate?: string; // Дата окончания договора
  debtAmount?: number;      // Сумма долга (если есть)
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Причины добавления в чёрный список
 */
export enum BadTenantReason {
  NON_PAYMENT = 'non_payment',
  PROPERTY_DAMAGE = 'property_damage',
  RULES_VIOLATION = 'rules_violation',
  FRAUD = 'fraud',
  OTHER = 'other',
}

/**
 * Названия причин для отображения
 */
export const BadTenantReasonLabels: Record<BadTenantReason, string> = {
  [BadTenantReason.NON_PAYMENT]: 'Неуплата аренды',
  [BadTenantReason.PROPERTY_DAMAGE]: 'Повреждение имущества',
  [BadTenantReason.RULES_VIOLATION]: 'Нарушение правил проживания',
  [BadTenantReason.FRAUD]: 'Мошенничество',
  [BadTenantReason.OTHER]: 'Другое',
};

// ============================================
// ШАБЛОНЫ ПРЕТЕНЗИЙ
// ============================================

/**
 * Тип шаблона претензии
 */
export enum ClaimTemplateType {
  NON_PAYMENT = 'non_payment',
  DAMAGE = 'damage',
  EVICTION = 'eviction',
  TERMINATION = 'termination',
}

/**
 * Шаблон претензии
 */
export interface ClaimTemplate {
  type: ClaimTemplateType;
  title: string;
  content: string;
  placeholders: string[];   // Список placeholder'ов для замены
  legalReference: string;   // Ссылка на закон
}

/**
 * Сгенерированная претензия
 */
export interface GeneratedClaim {
  title: string;
  content: string;
  type: ClaimTemplateType;
  generatedAt: Date;
  metadata: {
    tenantName?: string;
    contractDate?: string;
    debtAmount?: number;
    [key: string]: any;
  };
}

// ============================================
// КОНТЕКСТ СЦЕН
// ============================================

/**
 * Расширенный контекст сессии для wizard
 */
export interface ProblemWizardSession extends WizardSessionData {
  problemData?: Partial<ProblemDetails>;
  badTenantData?: Partial<BadTenantData>;
  selectedProblemType?: ProblemType;
  selectedBadTenantId?: string;
  generatedClaim?: GeneratedClaim;
}

/**
 * Контекст для сцен проблем
 */
export interface ProblemContext extends WizardContext<ProblemWizardSession> {
  session: ProblemWizardSession & WizardContext['session'];
}

// ============================================
// ОТВЕТЫ API
// ============================================

/**
 * Результат операции с чёрным списком
 */
export interface BadTenantOperationResult {
  success: boolean;
  message: string;
  data?: BadTenantData | BadTenantData[];
  error?: string;
}

/**
 * Результат генерации претензии
 */
export interface ClaimGenerationResult {
  success: boolean;
  claim?: GeneratedClaim;
  error?: string;
}
