/**
 * Сервис расчета налогов для RentierGuard
 * Реализует бизнес-логику расчета налогов по различным режимам
 */

import { addMonths, addDays, isAfter, startOfMonth, endOfMonth, format } from 'date-fns';
import type {
  ITaxCalculatorService,
  TaxCalculationInput,
  TaxCalculationResult,
  TaxCalculation,
  TaxReport,
  TaxBreakdown,
  DeductionBreakdown,
  TaxRecommendation,
  TaxPeriod,
  TaxRegime,
  RegimeEligibility,
  CalculationQueryOptions,
} from '../types';
import {
  TaxCalculationStatus,
  DeductionType,
  TAX_RATES,
  TAX_DUE_DATES,
  SELF_EMPLOYED_INCOME_LIMIT,
  USN_INCOME_LIMIT,
  PATENT_INCOME_LIMIT,
} from '../types';
import type { ServiceResult } from '../../../types/index';
import { ErrorCode, AppError } from '../../../types/index';
import { createModuleLogger } from '../../../core/utils/logger';
import { v4 as uuidv4 } from 'crypto';

// ============================================================================
// Логгер модуля
// ============================================================================

const logger = createModuleLogger('TaxCalculatorService');

// ============================================================================
// Интерфейс репозитория
// ============================================================================

/**
 * Интерфейс репозитория налоговых данных
 */
export interface ITaxRepository {
  saveCalculation(calculation: TaxCalculation): Promise<TaxCalculation>;
  findById(id: string): Promise<TaxCalculation | null>;
  findByUserId(userId: string, options?: CalculationQueryOptions): Promise<TaxCalculation[]>;
  findByPeriod(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TaxCalculation[]>;
  updateStatus(id: string, status: TaxCalculationStatus): Promise<TaxCalculation>;
  getTotalIncomeForYear(userId: string, year: number): Promise<number>;
}

// ============================================================================
// Реализация сервиса
// ============================================================================

export class TaxCalculatorService implements ITaxCalculatorService {
  constructor(private readonly repository: ITaxRepository) {}

  // ========================================================================
  // Основной метод расчета налога
  // ========================================================================

  /**
   * Рассчитывает налог на основе входных данных
   * @param input - Параметры для расчета
   * @returns Результат расчета
   */
  async calculateTax(
    input: TaxCalculationInput
  ): Promise<ServiceResult<TaxCalculationResult>> {
    try {
      logger.info(
        { userId: input.userId, regime: input.regime, period: input.period },
        'Начало расчета налога'
      );

      // Проверяем применимость режима
      const eligibility = await this.canApplyRegime(
        input.regime,
        input.userId,
        input.income
      );

      if (!eligibility.data?.eligible) {
        return {
          success: false,
          error: eligibility.data?.reason || 'Режим не может быть применен',
          code: ErrorCode.VALIDATION_ERROR,
        };
      }

      // Рассчитываем налог в зависимости от режима
      const calculation = await this.performCalculation(input);

      // Формируем детализацию
      const breakdown = this.createBreakdown(calculation, input);

      // Генерируем рекомендации
      const recommendations = this.generateRecommendations(input, calculation);

      // Определяем срок уплаты
      const dueDate = this.getDueDate(input.period, input.periodEnd, input.regime);

      const result: TaxCalculationResult = {
        calculation,
        breakdown,
        recommendations,
        dueDate,
      };

      logger.info(
        { calculationId: calculation.id, taxAmount: calculation.taxAmount },
        'Расчет налога завершен'
      );

      return { success: true, data: result };
    } catch (error) {
      logger.error({ error, input }, 'Ошибка при расчете налога');
      return {
        success: false,
        error: 'Не удалось рассчитать налог',
        code: ErrorCode.UNKNOWN_ERROR,
      };
    }
  }

  // ========================================================================
  // Методы расчета по режимам
  // ========================================================================

  /**
   * Выполняет расчет налога в зависимости от режима
   */
  private async performCalculation(input: TaxCalculationInput): Promise<TaxCalculation> {
    switch (input.regime) {
      case TaxRegime.NDFL:
        return this.calculateNDFL(input);
      case TaxRegime.SELF_EMPLOYED:
        return this.calculateSelfEmployed(input);
      case TaxRegime.USN_6:
        return this.calculateUSN6(input);
      case TaxRegime.USN_15:
        return this.calculateUSN15(input);
      case TaxRegime.PATENT:
        return this.calculatePatent(input);
      case TaxRegime.NPD:
        return this.calculateNPD(input);
      default:
        throw new AppError('Неизвестный режим налогообложения', ErrorCode.VALIDATION_ERROR);
    }
  }

  /**
   * Расчет НДФЛ (13%)
   */
  private calculateNDFL(input: TaxCalculationInput): TaxCalculation {
    const rate = TAX_RATES[TaxRegime.NDFL] as number;
    const deductions = input.deductions || [];

    // Применяем имущественный вычет (макс. 1 млн руб. или фактические расходы)
    const propertyDeduction = this.calculatePropertyDeduction(deductions, input.income);

    const taxBase = Math.max(0, input.income - propertyDeduction.totalApplied);
    const taxAmount = Math.round(taxBase * rate * 100) / 100;

    return this.createCalculationEntity(input, {
      taxBase,
      taxRate: rate * 100,
      taxAmount,
      deductions: propertyDeduction.deductions,
      totalDeductions: propertyDeduction.totalApplied,
    });
  }

  /**
   * Расчет для самозанятых (4% физлицам, 6% юрлицам)
   */
  private calculateSelfEmployed(input: TaxCalculationInput): TaxCalculation {
    const rates = TAX_RATES[TaxRegime.SELF_EMPLOYED] as Record<string, number>;
    // По умолчанию 4% (физлица)
    const rate = rates.individual;

    const taxBase = input.income;
    const taxAmount = Math.round(taxBase * rate * 100) / 100;

    // Самозанятые не применяют вычеты
    return this.createCalculationEntity(input, {
      taxBase,
      taxRate: rate * 100,
      taxAmount,
      deductions: [],
      totalDeductions: 0,
    });
  }

  /**
   * Расчет УСН 6% (доходы)
   */
  private calculateUSN6(input: TaxCalculationInput): TaxCalculation {
    const rate = TAX_RATES[TaxRegime.USN_6] as number;

    const taxBase = input.income;
    let taxAmount = Math.round(taxBase * rate * 100) / 100;

    // УСН 6% позволяет уменьшить налог на сумму страховых взносов
    // (макс. 50% для ИП с работниками, 100% без работников)
    // Здесь упрощенная логика - можно доработать

    return this.createCalculationEntity(input, {
      taxBase,
      taxRate: rate * 100,
      taxAmount,
      deductions: [],
      totalDeductions: 0,
    });
  }

  /**
   * Расчет УСН 15% (доходы минус расходы)
   */
  private calculateUSN15(input: TaxCalculationInput): TaxCalculation {
    const rate = TAX_RATES[TaxRegime.USN_15] as number;
    const expenses = input.expenses || 0;

    const taxBase = Math.max(0, input.income - expenses);
    // Минимальный налог 1% от дохода
    const calculatedTax = taxBase * rate;
    const minimumTax = input.income * 0.01;
    const taxAmount = Math.round(Math.max(calculatedTax, minimumTax) * 100) / 100;

    return this.createCalculationEntity(input, {
      taxBase,
      taxRate: rate * 100,
      taxAmount,
      deductions: [
        {
          type: DeductionType.OTHER,
          description: 'Расходы по УСН 15%',
          amount: expenses,
        },
      ],
      totalDeductions: expenses,
    });
  }

  /**
   * Расчет патента (упрощенный)
   * В реальности патент рассчитывается по потенциально возможному доходу
   */
  private calculatePatent(input: TaxCalculationInput): TaxCalculation {
    // Упрощенный расчет - в реальности нужен калькулятор по регионам
    const baseAmount = input.area ? input.area * 1000 : 50000; // Условная база
    const rate = 0.06; // 6% от потенциального дохода
    const taxAmount = Math.round(baseAmount * rate * 100) / 100;

    return this.createCalculationEntity(input, {
      taxBase: baseAmount,
      taxRate: rate * 100,
      taxAmount,
      deductions: [],
      totalDeductions: 0,
    });
  }

  /**
   * Расчет НПД (налог на профессиональный доход)
   */
  private calculateNPD(input: TaxCalculationInput): TaxCalculation {
    // НПД: 4% от физлиц, 6% от юрлиц и ИП
    // Упрощенно считаем 4%
    const rate = 0.04;
    const taxAmount = Math.round(input.income * rate * 100) / 100;

    return this.createCalculationEntity(input, {
      taxBase: input.income,
      taxRate: rate * 100,
      taxAmount,
      deductions: [],
      totalDeductions: 0,
    });
  }

  // ========================================================================
  // Вспомогательные методы расчета
  // ========================================================================

  /**
   * Рассчитывает имущественный вычет
   */
  private calculatePropertyDeduction(
    deductions: Array<{ type: DeductionType; amount: number; description: string }>,
    income: number
  ): { totalApplied: number; deductions: Array<{ type: DeductionType; amount: number; description: string }> } {
    let totalApplied = 0;
    const appliedDeductions: Array<{ type: DeductionType; amount: number; description: string }> = [];

    for (const deduction of deductions) {
      // Ограничение вычета размером дохода
      const maxAllowed = income - totalApplied;
      const appliedAmount = Math.min(deduction.amount, maxAllowed);

      if (appliedAmount > 0) {
        totalApplied += appliedAmount;
        appliedDeductions.push({
          ...deduction,
          amount: appliedAmount,
        });
      }
    }

    return { totalApplied, deductions: appliedDeductions };
  }

  /**
   * Создает сущность расчета
   */
  private createCalculationEntity(
    input: TaxCalculationInput,
    params: {
      taxBase: number;
      taxRate: number;
      taxAmount: number;
      deductions: Array<{ type: DeductionType; amount: number; description: string }>;
      totalDeductions: number;
    }
  ): TaxCalculation {
    const now = new Date();

    return {
      id: uuidv4(),
      userId: input.userId,
      propertyId: input.propertyId || null,
      regime: input.regime,
      period: input.period,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalIncome: input.income,
      taxBase: params.taxBase,
      taxRate: params.taxRate,
      taxAmount: params.taxAmount,
      deductions: params.deductions,
      totalDeductions: params.totalDeductions,
      status: TaxCalculationStatus.CALCULATED,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Создает детализацию расчета
   */
  private createBreakdown(
    calculation: TaxCalculation,
    input: TaxCalculationInput
  ): TaxBreakdown {
    const deductionBreakdowns: DeductionBreakdown[] = calculation.deductions.map((d) => ({
      type: d.type,
      description: d.description,
      requestedAmount: input.deductions?.find((ded) => ded.type === d.type)?.amount || d.amount,
      appliedAmount: d.amount,
      limitation: d.amount < (input.deductions?.find((ded) => ded.type === d.type)?.amount || 0)
        ? 'Ограничено размером дохода'
        : undefined,
    }));

    return {
      grossIncome: calculation.totalIncome,
      appliedDeductions: deductionBreakdowns,
      taxableBase: calculation.taxBase,
      appliedRate: calculation.taxRate,
      calculatedTax: calculation.taxAmount,
      effectiveRate: calculation.totalIncome > 0
        ? Math.round((calculation.taxAmount / calculation.totalIncome) * 10000) / 100
        : 0,
    };
  }

  /**
   * Генерирует рекомендации по оптимизации
   */
  private generateRecommendations(
    input: TaxCalculationInput,
    calculation: TaxCalculation
  ): TaxRecommendation[] {
    const recommendations: TaxRecommendation[] = [];

    // Рекомендация по смене режима
    if (input.regime === TaxRegime.NDFL && input.income > 500000) {
      recommendations.push({
        type: 'OPTIMIZATION',
        title: 'Рассмотрите самозанятость',
        description:
          'При доходе более 500 000 ₽ в год режим самозанятости (4-6%) может быть выгоднее НДФЛ (13%)',
        potentialSavings: Math.round(input.income * 0.09 * 100) / 100,
        action: 'Проверьте eligibility для самозанятости с помощью /tax_regime',
      });
    }

    // Рекомендация по вычетам
    if (calculation.totalDeductions === 0 && input.regime === TaxRegime.NDFL) {
      recommendations.push({
        type: 'INFO',
        title: 'Используйте имущественный вычет',
        description:
          'При покупке квартиры вы можете получить вычет до 2 млн ₽, что снизит ваш налог',
        action: 'Добавьте вычет в следующем расчете',
      });
    }

    // Предупреждение о лимитах
    if (input.regime === TaxRegime.SELF_EMPLOYED && input.income > 2_000_000) {
      recommendations.push({
        type: 'WARNING',
        title: 'Приближаетесь к лимиту самозанятости',
        description:
          'Лимит дохода для самозанятости - 2.4 млн ₽ в год. При превышении потребуется смена режима.',
      });
    }

    return recommendations;
  }

  // ========================================================================
  // Публичные методы интерфейса
  // ========================================================================

  /**
   * Получает расчет по ID
   */
  async getCalculation(calculationId: string): Promise<ServiceResult<TaxCalculation>> {
    try {
      const calculation = await this.repository.findById(calculationId);

      if (!calculation) {
        return {
          success: false,
          error: 'Расчет не найден',
          code: ErrorCode.NOT_FOUND,
        };
      }

      return { success: true, data: calculation };
    } catch (error) {
      logger.error({ error, calculationId }, 'Ошибка при получении расчета');
      return {
        success: false,
        error: 'Не удалось получить расчет',
        code: ErrorCode.DATABASE_ERROR,
      };
    }
  }

  /**
   * Получает историю расчетов пользователя
   */
  async getUserCalculations(
    userId: string,
    options?: CalculationQueryOptions
  ): Promise<ServiceResult<TaxCalculation[]>> {
    try {
      const calculations = await this.repository.findByUserId(userId, options);
      return { success: true, data: calculations };
    } catch (error) {
      logger.error({ error, userId }, 'Ошибка при получении расчетов пользователя');
      return {
        success: false,
        error: 'Не удалось получить расчеты',
        code: ErrorCode.DATABASE_ERROR,
      };
    }
  }

  /**
   * Сохраняет расчет
   */
  async saveCalculation(
    calculation: TaxCalculation
  ): Promise<ServiceResult<TaxCalculation>> {
    try {
      const saved = await this.repository.saveCalculation(calculation);
      return { success: true, data: saved };
    } catch (error) {
      logger.error({ error, calculationId: calculation.id }, 'Ошибка при сохранении расчета');
      return {
        success: false,
        error: 'Не удалось сохранить расчет',
        code: ErrorCode.DATABASE_ERROR,
      };
    }
  }

  /**
   * Генерирует отчет за период
   */
  async generateReport(
    userId: string,
    period: TaxPeriod,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ServiceResult<TaxReport>> {
    try {
      const calculations = await this.repository.findByPeriod(userId, periodStart, periodEnd);

      const totalIncome = calculations.reduce((sum, c) => sum + c.totalIncome, 0);
      const totalTax = calculations.reduce((sum, c) => sum + c.taxAmount, 0);

      const report: TaxReport = {
        period,
        periodStart,
        periodEnd,
        regime: calculations[0]?.regime || TaxRegime.NDFL,
        incomeSummary: {
          totalIncome,
          byProperty: {},
          monthlyTrend: [],
        },
        taxSummary: {
          totalAccrued: totalTax,
          totalPaid: 0,
          outstanding: totalTax,
          overdue: 0,
          averageEffectiveRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,
        },
        calculations,
        payments: [],
      };

      return { success: true, data: report };
    } catch (error) {
      logger.error({ error, userId }, 'Ошибка при генерации отчета');
      return {
        success: false,
        error: 'Не удалось сгенерировать отчет',
        code: ErrorCode.DATABASE_ERROR,
      };
    }
  }

  /**
   * Получает срок уплаты налога
   */
  getDueDate(period: TaxPeriod, periodEnd: Date, regime: TaxRegime): Date {
    const dueDateConfig = TAX_DUE_DATES[period];

    if (regime === TaxRegime.NDFL && period === TaxPeriod.YEAR) {
      // НДФЛ за год - до 30 апреля следующего года
      return new Date(periodEnd.getFullYear() + 1, 3, 30);
    }

    // Для остальных случаев
    let dueDate = addMonths(periodEnd, dueDateConfig.monthOffset);
    dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDateConfig.day);

    // Если выпадает на выходной - переносим на следующий рабочий
    const dayOfWeek = dueDate.getDay();
    if (dayOfWeek === 0) {
      // Воскресенье -> понедельник
      dueDate = addDays(dueDate, 1);
    } else if (dayOfWeek === 6) {
      // Суббота -> понедельник
      dueDate = addDays(dueDate, 2);
    }

    return dueDate;
  }

  /**
   * Проверяет возможность применения режима
   */
  async canApplyRegime(
    regime: TaxRegime,
    userId: string,
    annualIncome: number
  ): Promise<ServiceResult<RegimeEligibility>> {
    const year = new Date().getFullYear();
    const currentIncome = await this.repository.getTotalIncomeForYear(userId, year);
    const projectedIncome = currentIncome + annualIncome;

    switch (regime) {
      case TaxRegime.SELF_EMPLOYED:
        if (projectedIncome > SELF_EMPLOYED_INCOME_LIMIT) {
          return {
            success: true,
            data: {
              eligible: false,
              reason: `Превышен лимит дохода для самозанятости (${SELF_EMPLOYED_INCOME_LIMIT.toLocaleString('ru-RU')} ₽)`,
              recommendedAlternative: TaxRegime.NDFL,
            },
          };
        }
        break;

      case TaxRegime.USN_6:
      case TaxRegime.USN_15:
        if (projectedIncome > USN_INCOME_LIMIT) {
          return {
            success: true,
            data: {
              eligible: false,
              reason: `Превышен лимит дохода для УСН (${USN_INCOME_LIMIT.toLocaleString('ru-RU')} ₽)`,
              recommendedAlternative: TaxRegime.NDFL,
            },
          };
        }
        break;

      case TaxRegime.PATENT:
        if (projectedIncome > PATENT_INCOME_LIMIT) {
          return {
            success: true,
            data: {
              eligible: false,
              reason: `Превышен лимит дохода для патента (${PATENT_INCOME_LIMIT.toLocaleString('ru-RU')} ₽)`,
              recommendedAlternative: TaxRegime.USN_6,
            },
          };
        }
        break;
    }

    return {
      success: true,
      data: {
        eligible: true,
      },
    };
  }
}

// ============================================================================
// Фабрика сервиса
// ============================================================================

/**
 * Создает экземпляр сервиса налогового калькулятора
 * @param repository - Репозиторий налоговых данных
 * @returns Экземпляр сервиса
 */
export function createTaxCalculatorService(
  repository: ITaxRepository
): ITaxCalculatorService {
  return new TaxCalculatorService(repository);
}
