/**
 * Типы для налогового модуля RentierGuard
 * Определяет интерфейсы для расчета налогов на доход от аренды
 */

import type { ServiceResult } from '../../types/index';

// ============================================================================
// Перечисления
// ============================================================================

/**
 * Режимы налогообложения в РФ
 */
export enum TaxRegime {
  /** НДФЛ (основной режим) - 13% */
  NDFL = 'NDFL',
  /** Самозанятость - 4% или 6% */
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  /** Патентная система */
  PATENT = 'PATENT',
  /** Упрощенка 6% (доходы) */
  USN_6 = 'USN_6',
  /** Упрощенка 15% (доходы минус расходы) */
  USN_15 = 'USN_15',
  /** Налог на профессиональный доход (НПД) */
  NPD = 'NPD',
}

/**
 * Типы объектов недвижимости для налоговых целей
 */
export enum PropertyTaxType {
  /** Жилая недвижимость */
  RESIDENTIAL = 'RESIDENTIAL',
  /** Нежилая коммерческая */
  COMMERCIAL = 'COMMERCIAL',
  /** Земельный участок */
  LAND = 'LAND',
}

/**
 * Статусы налогового расчета
 */
export enum TaxCalculationStatus {
  /** Черновик */
  DRAFT = 'DRAFT',
  /** Рассчитан */
  CALCULATED = 'CALCULATED',
  /** Подтвержден пользователем */
  CONFIRMED = 'CONFIRMED',
  /** Оплачен */
  PAID = 'PAID',
  /** Архивный */
  ARCHIVED = 'ARCHIVED',
}

/**
 * Периоды расчета налогов
 */
export enum TaxPeriod {
  /** Месяц */
  MONTH = 'MONTH',
  /** Квартал */
  QUARTER = 'QUARTER',
  /** Год */
  YEAR = 'YEAR',
}

// ============================================================================
// Интерфейсы сущностей
// ============================================================================

/**
 * Налоговый расчет
 */
export interface TaxCalculation {
  /** Уникальный ID расчета */
  id: string;
  /** ID пользователя */
  userId: string;
  /** ID объекта недвижимости (опционально) */
  propertyId: string | null;
  /** Режим налогообложения */
  regime: TaxRegime;
  /** Период расчета */
  period: TaxPeriod;
  /** Начало периода */
  periodStart: Date;
  /** Конец периода */
  periodEnd: Date;
  /** Общий доход за период */
  totalIncome: number;
  /** Налоговая база */
  taxBase: number;
  /** Ставка налога */
  taxRate: number;
  /** Сумма налога */
  taxAmount: number;
  /** Вычеты и льготы */
  deductions: TaxDeduction[];
  /** Сумма вычетов */
  totalDeductions: number;
  /** Статус расчета */
  status: TaxCalculationStatus;
  /** Дата создания */
  createdAt: Date;
  /** Дата обновления */
  updatedAt: Date;
}

/**
 * Налоговый вычет
 */
export interface TaxDeduction {
  /** Тип вычета */
  type: DeductionType;
  /** Описание вычета */
  description: string;
  /** Сумма вычета */
  amount: number;
  /** Подтверждающие документы */
  documents?: string[];
}

/**
 * Типы налоговых вычетов
 */
export enum DeductionType {
  /** Имущественный вычет */
  PROPERTY = 'PROPERTY',
  /** Расходы на ремонт */
  REPAIR = 'REPAIR',
  /** Коммунальные услуги (если оплачивает арендодатель) */
  UTILITIES = 'UTILITIES',
  /** Страховка */
  INSURANCE = 'INSURANCE',
  /** Услуги управляющей компании */
  MANAGEMENT = 'MANAGEMENT',
  /** Другие расходы */
  OTHER = 'OTHER',
}

/**
 * Налоговый платеж
 */
export interface TaxPayment {
  id: string;
  calculationId: string;
  userId: string;
  amount: number;
  paymentDate: Date | null;
  dueDate: Date;
  status: PaymentStatus;
  paymentMethod: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}

/**
 * Статусы платежа
 */
export enum PaymentStatus {
  /** Ожидает оплаты */
  PENDING = 'PENDING',
  /** Оплачен */
  PAID = 'PAID',
  /** Просрочен */
  OVERDUE = 'OVERDUE',
  /** Отменен */
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// Интерфейсы для расчетов
// ============================================================================

/**
 * Параметры для расчета налога
 */
export interface TaxCalculationInput {
  /** ID пользователя */
  userId: string;
  /** ID объекта (опционально) */
  propertyId?: string;
  /** Режим налогообложения */
  regime: TaxRegime;
  /** Период расчета */
  period: TaxPeriod;
  /** Начало периода */
  periodStart: Date;
  /** Конец периода */
  periodEnd: Date;
  /** Доходы за период */
  income: number;
  /** Расходы (для УСН 15%) */
  expenses?: number;
  /** Вычеты */
  deductions?: DeductionInput[];
  /** Тип объекта */
  propertyType?: PropertyTaxType;
  /** Город (для патента) */
  city?: string;
  /** Площадь в кв.м. (для патента) */
  area?: number;
}

/**
 * Входные данные для вычета
 */
export interface DeductionInput {
  type: DeductionType;
  description: string;
  amount: number;
  documentIds?: string[];
}

/**
 * Результат расчета налога
 */
export interface TaxCalculationResult {
  /** Рассчитанный налог */
  calculation: TaxCalculation;
  /** Детализация расчета */
  breakdown: TaxBreakdown;
  /** Рекомендации по оптимизации */
  recommendations: TaxRecommendation[];
  /** Срок уплаты */
  dueDate: Date;
}

/**
 * Детализация налогового расчета
 */
export interface TaxBreakdown {
  /** Исходный доход */
  grossIncome: number;
  /** Примененные вычеты */
  appliedDeductions: DeductionBreakdown[];
  /** Налоговая база после вычетов */
  taxableBase: number;
  /** Ставка налога */
  appliedRate: number;
  /** Итоговый налог */
  calculatedTax: number;
  /** Эффективная налоговая ставка */
  effectiveRate: number;
}

/**
 * Детализация вычета
 */
export interface DeductionBreakdown {
  type: DeductionType;
  description: string;
  requestedAmount: number;
  appliedAmount: number;
  limitation?: string;
}

/**
 * Рекомендация по налоговой оптимизации
 */
export interface TaxRecommendation {
  /** Тип рекомендации */
  type: 'OPTIMIZATION' | 'WARNING' | 'INFO';
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Потенциальная экономия */
  potentialSavings?: number;
  /** Действие для применения */
  action?: string;
}

// ============================================================================
// Интерфейсы для отчетов
// ============================================================================

/**
 * Налоговый отчет за период
 */
export interface TaxReport {
  /** Период отчета */
  period: TaxPeriod;
  /** Начало периода */
  periodStart: Date;
  /** Конец периода */
  periodEnd: Date;
  /** Режим налогообложения */
  regime: TaxRegime;
  /** Сводка по доходам */
  incomeSummary: IncomeSummary;
  /** Сводка по налогам */
  taxSummary: TaxSummary;
  /** Список расчетов */
  calculations: TaxCalculation[];
  /** Платежи */
  payments: TaxPayment[];
}

/**
 * Сводка по доходам
 */
export interface IncomeSummary {
  /** Общий доход */
  totalIncome: number;
  /** Доход по объектам */
  byProperty: Record<string, number>;
  /** Динамика по месяцам */
  monthlyTrend: MonthlyIncome[];
}

/**
 * Доход за месяц
 */
export interface MonthlyIncome {
  month: number;
  year: number;
  income: number;
}

/**
 * Сводка по налогам
 */
export interface TaxSummary {
  /** Начислено налогов */
  totalAccrued: number;
  /** Оплачено */
  totalPaid: number;
  /** К уплате */
  outstanding: number;
  /** Просрочено */
  overdue: number;
  /** Средняя эффективная ставка */
  averageEffectiveRate: number;
}

// ============================================================================
// Интерфейсы сервиса
// ============================================================================

/**
 * Интерфейс налогового калькулятора
 */
export interface ITaxCalculatorService {
  /** Рассчитывает налог */
  calculateTax(input: TaxCalculationInput): Promise<ServiceResult<TaxCalculationResult>>;
  
  /** Получает расчет по ID */
  getCalculation(calculationId: string): Promise<ServiceResult<TaxCalculation>>;
  
  /** Получает историю расчетов пользователя */
  getUserCalculations(
    userId: string,
    options?: CalculationQueryOptions
  ): Promise<ServiceResult<TaxCalculation[]>>;
  
  /** Сохраняет расчет */
  saveCalculation(
    calculation: TaxCalculation
  ): Promise<ServiceResult<TaxCalculation>>;
  
  /** Генерирует отчет за период */
  generateReport(
    userId: string,
    period: TaxPeriod,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ServiceResult<TaxReport>>;
  
  /** Получает срок уплаты налога */
  getDueDate(period: TaxPeriod, periodEnd: Date, regime: TaxRegime): Date;
  
  /** Проверяет возможность применения режима */
  canApplyRegime(
    regime: TaxRegime,
    userId: string,
    annualIncome: number
  ): Promise<ServiceResult<RegimeEligibility>>;
}

/**
 * Опции запроса расчетов
 */
export interface CalculationQueryOptions {
  /** Фильтр по статусу */
  status?: TaxCalculationStatus;
  /** Фильтр по периоду */
  period?: TaxPeriod;
  /** Начало диапазона дат */
  dateFrom?: Date;
  /** Конец диапазона дат */
  dateTo?: Date;
  /** Лимит */
  limit?: number;
  /** Смещение */
  offset?: number;
}

/**
 * Результат проверки применимости режима
 */
export interface RegimeEligibility {
  /** Можно применять */
  eligible: boolean;
  /** Причина невозможности */
  reason?: string;
  /** Ограничения */
  limitations?: string[];
  /** Рекомендуемая альтернатива */
  recommendedAlternative?: TaxRegime;
}

// ============================================================================
// Константы
// ============================================================================

/** Ставки налогов по режимам */
export const TAX_RATES: Record<TaxRegime, number | Record<string, number>> = {
  [TaxRegime.NDFL]: 0.13,
  [TaxRegime.SELF_EMPLOYED]: {
    /** Физическим лицам */
    individual: 0.04,
    /** Юридическим лицам и ИП */
    entity: 0.06,
  },
  [TaxRegime.PATENT]: 0, // Рассчитывается индивидуально
  [TaxRegime.USN_6]: 0.06,
  [TaxRegime.USN_15]: 0.15,
  [TaxRegime.NPD]: 0, // Зависит от плательщика
};

/** Максимальный доход для самозанятости */
export const SELF_EMPLOYED_INCOME_LIMIT = 2_400_000;

/** Максимальный доход для УСН */
export const USN_INCOME_LIMIT = 265_000_000;

/** Максимальный доход для патента */
export const PATENT_INCOME_LIMIT = 60_000_000;

/** Сроки уплаты налогов по периодам */
export const TAX_DUE_DATES: Record<TaxPeriod, { day: number; monthOffset: number }> = {
  [TaxPeriod.MONTH]: { day: 25, monthOffset: 1 },
  [TaxPeriod.QUARTER]: { day: 25, monthOffset: 1 },
  [TaxPeriod.YEAR]: { day: 30, monthOffset: 4 }, // 30 апреля
};
