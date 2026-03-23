/**
 * Налоговый модуль RentierGuard
 * 
 * Этот модуль предоставляет функционал для:
 * - Расчета налогов на доход от аренды недвижимости
 * - Сравнения налоговых режимов (НДФЛ, Самозанятый, Патент)
 * - Помощи в регистрации самозанятости
 * - Информирования о налоговой отчетности
 * - Напоминаний о сроках уплаты налогов
 */

// ============================================================================
// Экспорт сцен
// ============================================================================

export { taxCalcScene, default as TaxCalcScene } from './scenes/taxCalc.scene';
export { becomeSelfEmployedScene, default as BecomeSelfEmployedScene } from './scenes/becomeSelfemployed.scene';
export { taxReportScene, default as TaxReportScene } from './scenes/taxReport.scene';

// ============================================================================
// Экспорт сервисов
// ============================================================================

export {
  TaxReminderService,
  initTaxReminderService,
  getTaxReminderService,
} from './services/taxReminder.service';

// ============================================================================
// Экспорт шаблонов сообщений
// ============================================================================

export {
  // Приветствия
  TAX_WELCOME_MESSAGES,
  // Запросы
  TAX_PROMPTS,
  // Результаты
  TAX_RESULTS,
  // Отчетность
  TAX_REPORT_MESSAGES,
  // Ошибки
  TAX_ERROR_MESSAGES,
  // Клавиатуры
  TAX_KEYBOARD_LABELS,
  // Ссылки
  TAX_LINKS,
  // Данные для расчетов
  PATENT_BASE_RATES,
  getPatentRate,
  calculateTaxes,
} from './templates/messages';

// ============================================================================
// Экспорт типов
// ============================================================================

export {
  // Перечисления
  TaxRegime,
  PropertyTaxType,
  TaxCalculationStatus,
  TaxPeriod,
  DeductionType,
  PaymentStatus,
  // Интерфейсы
  TaxCalculation,
  TaxDeduction,
  TaxPayment,
  TaxCalculationInput,
  TaxCalculationResult,
  TaxBreakdown,
  TaxRecommendation,
  TaxReport,
  IncomeSummary,
  MonthlyIncome,
  TaxSummary,
  // Константы
  TAX_RATES,
  SELF_EMPLOYED_INCOME_LIMIT,
  USN_INCOME_LIMIT,
  PATENT_INCOME_LIMIT,
  TAX_DUE_DATES,
} from './types';

// ============================================================================
// Регистрация сцен в боте
// ============================================================================

import type { Telegraf, Scenes } from 'telegraf';
import type { BotContext } from '../../types/index';
import { taxCalcScene } from './scenes/taxCalc.scene';
import { becomeSelfEmployedScene } from './scenes/becomeSelfemployed.scene';
import { taxReportScene } from './scenes/taxReport.scene';
import { initTaxReminderService } from './services/taxReminder.service';

/**
 * Массив всех сцен налогового модуля
 */
export const taxScenes: Scenes.WizardScene<BotContext>[] = [
  taxCalcScene,
  becomeSelfEmployedScene,
  taxReportScene,
];

/**
 * Названия сцен для удобного доступа
 */
export const TAX_SCENE_NAMES = {
  TAX_CALC: 'tax_calc',
  BECOME_SELFEMPLOYED: 'become_selfemployed',
  TAX_REPORT: 'tax_report',
} as const;

/**
 * Инициализирует налоговый модуль
 * 
 * @param bot - экземпляр бота Telegraf
 * @param stage - сцена для регистрации
 * @param options - опции инициализации
 * @returns объект с настроенным сервисом напоминаний
 * 
 * @example
 * ```typescript
 * import { initTaxModule } from './modules/tax';
 * 
 * const taxModule = initTaxModule(bot, stage, {
 *   enableReminders: true,
 *   reminderIntervalMinutes: 60,
 * });
 * 
 * // Запуск сервиса напоминаний
 * taxModule.reminderService.start(60);
 * ```
 */
interface TaxModuleOptions {
  /** Включить сервис напоминаний */
  enableReminders?: boolean;
  /** Интервал проверки напоминаний в минутах */
  reminderIntervalMinutes?: number;
}

interface TaxModuleResult {
  /** Сервис напоминаний */
  reminderService: ReturnType<typeof initTaxReminderService>;
  /** Зарегистрированные сцены */
  scenes: string[];
}

export function initTaxModule(
  bot: Telegraf<BotContext>,
  stage: Scenes.Stage<BotContext>,
  options: TaxModuleOptions = {}
): TaxModuleResult {
  const { enableReminders = true, reminderIntervalMinutes = 60 } = options;

  // Регистрируем сцены в stage
  for (const scene of taxScenes) {
    stage.register(scene);
  }

  console.log(`[TaxModule] Зарегистрировано сцен: ${taxScenes.length}`);

  // Инициализируем сервис напоминаний
  const reminderService = initTaxReminderService(bot);

  if (enableReminders) {
    reminderService.start(reminderIntervalMinutes);
    console.log(`[TaxModule] Напоминания запущены (интервал: ${reminderIntervalMinutes} мин)`);
  }

  // Регистрируем команды
  registerTaxCommands(bot);

  return {
    reminderService,
    scenes: taxScenes.map((s) => s.id),
  };
}

/**
 * Регистрирует команды налогового модуля
 */
function registerTaxCommands(bot: Telegraf<BotContext>): void {
  // Команда расчета налогов
  bot.command('tax_calc', async (ctx) => {
    await ctx.scene.enter(TAX_SCENE_NAMES.TAX_CALC);
  });

  // Команда регистрации самозанятости
  bot.command('become_selfemployed', async (ctx) => {
    await ctx.scene.enter(TAX_SCENE_NAMES.BECOME_SELFEMPLOYED);
  });

  // Команда отчетности
  bot.command('tax_report', async (ctx) => {
    await ctx.scene.enter(TAX_SCENE_NAMES.TAX_REPORT);
  });

  console.log('[TaxModule] Команды зарегистрированы: /tax_calc, /become_selfemployed, /tax_report');
}

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Получает информацию о модуле
 */
export function getTaxModuleInfo(): {
  version: string;
  scenes: string[];
  commands: string[];
} {
  return {
    version: '1.0.0',
    scenes: Object.values(TAX_SCENE_NAMES),
    commands: ['/tax_calc', '/become_selfemployed', '/tax_report'],
  };
}

/**
 * Проверяет, является ли сцена частью налогового модуля
 */
export function isTaxScene(sceneName: string): boolean {
  return Object.values(TAX_SCENE_NAMES).includes(sceneName as any);
}
