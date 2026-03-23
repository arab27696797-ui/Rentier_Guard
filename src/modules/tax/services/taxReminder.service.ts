/**
 * Сервис напоминаний о налогах
 * Проверяет даты и отправляет уведомления пользователям
 */

import type { Telegraf } from 'telegraf';
import type { BotContext } from '@types/index';
import { TAX_REPORT_MESSAGES } from '../templates/messages';
import { TaxRegime } from '../types';

// ============================================================================
// Типы и интерфейсы
// ============================================================================

/**
 * Информация о напоминании
 */
interface TaxReminder {
  /** ID пользователя */
  userId: string;
  /** Тип налогового режима */
  regime: TaxRegime;
  /** Дата напоминания */
  reminderDate: Date;
  /** Тип напоминания (предварительное, в день) */
  type: 'advance' | 'due' | 'overdue';
  /** Сообщение */
  message: string;
  /** Отправлено ли */
  sent: boolean;
}

/**
 * Настройки пользователя для напоминаний
 */
interface UserReminderSettings {
  userId: string;
  /** Включены ли напоминания */
  enabled: boolean;
  /** Режимы, по которым нужны напоминания */
  regimes: TaxRegime[];
  /** Час отправки (0-23) */
  sendHour: number;
  /** Минута отправки (0-59) */
  sendMinute: number;
  /** Часовой пояс */
  timezone: string;
}

/**
 * Результат проверки напоминаний
 */
interface ReminderCheckResult {
  checkedAt: Date;
  remindersFound: number;
  remindersSent: number;
  errors: string[];
}

// ============================================================================
// Константы
// ============================================================================

/** Дни для предварительных напоминаний */
const ADVANCE_REMINDER_DAYS = 3;

/** Сроки уплаты налогов */
const TAX_DEADLINES = {
  /** НПД: 25-е число каждого месяца */
  NPD: { day: 25, monthOffset: 0 },
  /** НДФЛ декларация: 30 апреля */
  NDFL_DECLARATION: { day: 30, month: 4 },
  /** НДФЛ уплата: 15 июля */
  NDFL_PAYMENT: { day: 15, month: 7 },
} as const;

// ============================================================================
// Сервис напоминаний
// ============================================================================

export class TaxReminderService {
  private bot: Telegraf<BotContext>;
  private userSettings: Map<string, UserReminderSettings> = new Map();
  private reminders: TaxReminder[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(bot: Telegraf<BotContext>) {
    this.bot = bot;
  }

  // ============================================================================
  // Публичные методы
  // ============================================================================

  /**
   * Запускает периодическую проверку напоминаний
   * @param intervalMinutes - интервал проверки в минутах (по умолчанию 60)
   */
  start(intervalMinutes: number = 60): void {
    console.log(`[TaxReminderService] Запущен с интервалом ${intervalMinutes} мин`);
    
    // Немедленная первая проверка
    this.checkAndSendReminders();
    
    // Периодические проверки
    this.checkInterval = setInterval(
      () => this.checkAndSendReminders(),
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * Останавливает проверку напоминаний
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[TaxReminderService] Остановлен');
    }
  }

  /**
   * Проверяет даты и отправляет напоминания
   * Главный метод сервиса
   */
  async checkAndSendReminders(): Promise<ReminderCheckResult> {
    const result: ReminderCheckResult = {
      checkedAt: new Date(),
      remindersFound: 0,
      remindersSent: 0,
      errors: [],
    };

    try {
      console.log('[TaxReminderService] Проверка напоминаний:', result.checkedAt.toISOString());

      // Проверяем напоминания для каждого пользователя
      for (const [userId, settings] of this.userSettings) {
        if (!settings.enabled) continue;

        for (const regime of settings.regimes) {
          const reminders = this.generateRemindersForUser(userId, regime);
          
          for (const reminder of reminders) {
            result.remindersFound++;
            
            // Проверяем, нужно ли отправлять сейчас
            if (this.shouldSendReminder(reminder, settings)) {
              const sent = await this.sendReminder(userId, reminder);
              if (sent) {
                result.remindersSent++;
                reminder.sent = true;
              } else {
                result.errors.push(`Не удалось отправить напоминание для ${userId}`);
              }
            }
          }
        }
      }

      console.log(`[TaxReminderService] Найдено: ${result.remindersFound}, Отправлено: ${result.remindersSent}`);
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error('[TaxReminderService] Ошибка проверки:', error);
      return result;
    }
  }

  /**
   * Добавляет пользователя для напоминаний
   */
  addUser(settings: UserReminderSettings): void {
    this.userSettings.set(settings.userId, settings);
    console.log(`[TaxReminderService] Добавлен пользователь: ${settings.userId}`);
  }

  /**
   * Удаляет пользователя из напоминаний
   */
  removeUser(userId: string): void {
    this.userSettings.delete(userId);
    console.log(`[TaxReminderService] Удален пользователь: ${userId}`);
  }

  /**
   * Обновляет настройки пользователя
   */
  updateUserSettings(userId: string, updates: Partial<UserReminderSettings>): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    this.userSettings.set(userId, { ...settings, ...updates });
    return true;
  }

  /**
   * Получает настройки пользователя
   */
  getUserSettings(userId: string): UserReminderSettings | undefined {
    return this.userSettings.get(userId);
  }

  /**
   * Включает/выключает напоминания для пользователя
   */
  toggleReminders(userId: string, enabled: boolean): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    settings.enabled = enabled;
    this.userSettings.set(userId, settings);
    return true;
  }

  /**
   * Добавляет режим для напоминаний пользователя
   */
  addRegimeForUser(userId: string, regime: TaxRegime): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    if (!settings.regimes.includes(regime)) {
      settings.regimes.push(regime);
      this.userSettings.set(userId, settings);
    }
    return true;
  }

  /**
   * Удаляет режим из напоминаний пользователя
   */
  removeRegimeForUser(userId: string, regime: TaxRegime): boolean {
    const settings = this.userSettings.get(userId);
    if (!settings) return false;

    settings.regimes = settings.regimes.filter((r) => r !== regime);
    this.userSettings.set(userId, settings);
    return true;
  }

  // ============================================================================
  // Приватные методы
  // ============================================================================

  /**
   * Генерирует напоминания для пользователя по режиму
   */
  private generateRemindersForUser(userId: string, regime: TaxRegime): TaxReminder[] {
    const reminders: TaxReminder[] = [];
    const now = new Date();

    switch (regime) {
      case TaxRegime.NPD:
        // НПД: 25-е число каждого месяца
        reminders.push(...this.generateNPDReminders(userId, now));
        break;
        
      case TaxRegime.PATENT:
        // Патент: за 5 дней до окончания
        reminders.push(...this.generatePatentReminders(userId, now));
        break;
        
      case TaxRegime.NDFL:
        // НДФЛ: 1 апреля (декларация), 15 июля (уплата)
        reminders.push(...this.generateNDFLReminders(userId, now));
        break;
    }

    return reminders;
  }

  /**
   * Генерирует напоминания для НПД
   */
  private generateNPDReminders(userId: string, now: Date): TaxReminder[] {
    const reminders: TaxReminder[] = [];
    
    // Следующий месяц
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, TAX_DEADLINES.NPD.day);
    
    // Предварительное напоминание (за 3 дня)
    const advanceDate = new Date(nextMonth);
    advanceDate.setDate(advanceDate.getDate() - ADVANCE_REMINDER_DAYS);
    
    reminders.push({
      userId,
      regime: TaxRegime.NPD,
      reminderDate: advanceDate,
      type: 'advance',
      message: TAX_REPORT_MESSAGES.REMINDER_MESSAGE({
        regime: 'НПД (Самозанятый)',
        dueDate: `${TAX_DEADLINES.NPD.day} ${this.getMonthName(nextMonth.getMonth() + 1)}`,
        action: 'Уплатите налог через приложение "Мой налог"',
      }),
      sent: false,
    });

    // Напоминание в день уплаты
    reminders.push({
      userId,
      regime: TaxRegime.NPD,
      reminderDate: nextMonth,
      type: 'due',
      message: TAX_REPORT_MESSAGES.REMINDER_MESSAGE({
        regime: 'НПД (Самозанятый)',
        dueDate: `СЕГОДНЯ, ${TAX_DEADLINES.NPD.day} ${this.getMonthName(nextMonth.getMonth() + 1)}`,
        action: 'Срочно уплатите налог до конца дня!',
      }),
      sent: false,
    });

    return reminders;
  }

  /**
   * Генерирует напоминания для патента
   */
  private generatePatentReminders(userId: string, now: Date): TaxReminder[] {
    const reminders: TaxReminder[] = [];
    
    // Патент обычно оформляется на квартал/полгода/год
    // Напоминаем за 5 дней до окончания каждого квартала
    
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterEndMonths = [2, 5, 8, 11]; // Март, Июнь, Сентябрь, Декабрь
    
    for (const endMonth of quarterEndMonths) {
      const quarterEnd = new Date(now.getFullYear(), endMonth + 1, 0); // Последний день месяца
      const reminderDate = new Date(quarterEnd);
      reminderDate.setDate(reminderDate.getDate() - 5);
      
      // Пропускаем прошедшие даты
      if (reminderDate < now) continue;
      
      reminders.push({
        userId,
        regime: TaxRegime.PATENT,
        reminderDate,
        type: 'advance',
        message: TAX_REPORT_MESSAGES.REMINDER_MESSAGE({
          regime: 'Патент',
          dueDate: quarterEnd.toLocaleDateString('ru-RU'),
          action: 'Продлите патент или уплатите следующий взнос',
        }),
        sent: false,
      });
    }

    return reminders;
  }

  /**
   * Генерирует напоминания для НДФЛ
   */
  private generateNDFLReminders(userId: string, now: Date): TaxReminder[] {
    const reminders: TaxReminder[] = [];
    const currentYear = now.getFullYear();
    
    // Декларация: 30 апреля
    const declarationDeadline = new Date(currentYear, TAX_DEADLINES.NDFL_DECLARATION.month - 1, TAX_DEADLINES.NDFL_DECLARATION.day);
    const declarationReminder = new Date(declarationDeadline);
    declarationReminder.setDate(declarationReminder.getDate() - ADVANCE_REMINDER_DAYS);
    
    // Если дедлайн уже прошел, показываем на следующий год
    if (declarationDeadline < now) {
      declarationDeadline.setFullYear(currentYear + 1);
      declarationReminder.setFullYear(currentYear + 1);
    }
    
    if (declarationReminder > now) {
      reminders.push({
        userId,
        regime: TaxRegime.NDFL,
        reminderDate: declarationReminder,
        type: 'advance',
        message: TAX_REPORT_MESSAGES.REMINDER_MESSAGE({
          regime: 'НДФЛ - Декларация 3-НДФЛ',
          dueDate: `${TAX_DEADLINES.NDFL_DECLARATION.day} апреля`,
          action: 'Подготовьте и подайте декларацию через ЛК ФНС или Госуслуги',
        }),
        sent: false,
      });
    }

    // Уплата: 15 июля
    const paymentDeadline = new Date(currentYear, TAX_DEADLINES.NDFL_PAYMENT.month - 1, TAX_DEADLINES.NDFL_PAYMENT.day);
    const paymentReminder = new Date(paymentDeadline);
    paymentReminder.setDate(paymentReminder.getDate() - ADVANCE_REMINDER_DAYS);
    
    if (paymentDeadline < now) {
      paymentDeadline.setFullYear(currentYear + 1);
      paymentReminder.setFullYear(currentYear + 1);
    }
    
    if (paymentReminder > now) {
      reminders.push({
        userId,
        regime: TaxRegime.NDFL,
        reminderDate: paymentReminder,
        type: 'advance',
        message: TAX_REPORT_MESSAGES.REMINDER_MESSAGE({
          regime: 'НДФЛ - Уплата налога',
          dueDate: `${TAX_DEADLINES.NDFL_PAYMENT.day} июля`,
          action: 'Уплатите налог через банк или онлайн',
        }),
        sent: false,
      });
    }

    return reminders;
  }

  /**
   * Проверяет, нужно ли отправлять напоминание сейчас
   */
  private shouldSendReminder(reminder: TaxReminder, settings: UserReminderSettings): boolean {
    if (reminder.sent) return false;

    const now = new Date();
    const reminderDate = new Date(reminder.reminderDate);
    
    // Учитываем часовой пояс пользователя (упрощенно)
    const userHour = settings.sendHour;
    const userMinute = settings.sendMinute;
    
    // Проверяем дату
    const isSameDate = 
      now.getDate() === reminderDate.getDate() &&
      now.getMonth() === reminderDate.getMonth() &&
      now.getFullYear() === reminderDate.getFullYear();
    
    // Проверяем время (с погрешностью в 1 час)
    const currentHour = now.getHours();
    const isRightTime = Math.abs(currentHour - userHour) <= 1;
    
    return isSameDate && isRightTime;
  }

  /**
   * Отправляет напоминание пользователю
   */
  private async sendReminder(userId: string, reminder: TaxReminder): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(userId, reminder.message, {
        parse_mode: 'MarkdownV2',
      });
      
      console.log(`[TaxReminderService] Отправлено напоминание ${userId}: ${reminder.regime}`);
      return true;
    } catch (error) {
      console.error(`[TaxReminderService] Ошибка отправки ${userId}:`, error);
      return false;
    }
  }

  /**
   * Получает название месяца
   */
  private getMonthName(month: number): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return months[month - 1] || '';
  }
}

// ============================================================================
// Экспорт singleton
// ============================================================================

let reminderServiceInstance: TaxReminderService | null = null;

/**
 * Инициализирует сервис напоминаний
 */
export function initTaxReminderService(bot: Telegraf<BotContext>): TaxReminderService {
  if (!reminderServiceInstance) {
    reminderServiceInstance = new TaxReminderService(bot);
  }
  return reminderServiceInstance;
}

/**
 * Получает экземпляр сервиса
 */
export function getTaxReminderService(): TaxReminderService | null {
  return reminderServiceInstance;
}

export default TaxReminderService;
