/**
 * @fileoverview Сервис напоминаний о платежах
 * @module modules/payment/services/reminder.service
 * 
 * Функционал:
 * - checkUpcomingPayments() — проверка каждые 6 часов
 * - sendPaymentReminder(userId, payment) — отправка уведомления
 * - Напоминания за 3 дня и в день платежа
 */

import { PrismaClient, PaymentStatus } from '@prisma/client';
import { Telegraf } from 'telegraf';
import * as cron from 'node-cron';
import { PaymentWithDetails, ReminderType, PaymentTypeLabels, PaymentStatusLabels } from '../types';
import { paymentService } from './payment.service';
import { logger } from '../../../utils/logger';

// ============================================
// PRISMA CLIENT
// ============================================

const prisma = new PrismaClient();

// ============================================
// CONSTANTS
// ============================================

/** Интервал проверки напоминаний (каждые 6 часов) */
const CHECK_INTERVAL = '0 */6 * * *';

/** За сколько дней отправлять напоминания */
const REMINDER_DAYS = [3, 1, 0]; // 3 дня, 1 день, в день платежа

// ============================================
// TYPES
// ============================================

interface ReminderRecord {
  id: string;
  paymentId: string;
  userId: number;
  reminderType: ReminderType;
  sentAt: Date;
}

// ============================================
// SERVICE
// ============================================

class ReminderService {
  private bot: Telegraf | null = null;
  private cronJob: cron.ScheduledTask | null = null;
  private isInitialized = false;

  /**
   * Инициализирует сервис напоминаний
   * @param bot - Экземпляр Telegraf бота
   */
  initialize(bot: Telegraf): void {
    if (this.isInitialized) {
      logger.warn('Reminder service already initialized');
      return;
    }

    this.bot = bot;
    this.startCronJob();
    this.isInitialized = true;

    logger.info('Reminder service initialized');
  }

  /**
   * Останавливает сервис напоминаний
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isInitialized = false;
    this.bot = null;

    logger.info('Reminder service stopped');
  }

  /**
   * Запускает cron-задачу для проверки платежей
   */
  private startCronJob(): void {
    this.cronJob = cron.schedule(CHECK_INTERVAL, async () => {
      logger.info('Running scheduled payment reminder check...');
      try {
        await this.checkUpcomingPayments();
      } catch (error) {
        logger.error('Error in scheduled reminder check:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Moscow',
    });

    logger.info(`Cron job scheduled with pattern: ${CHECK_INTERVAL}`);
  }

  /**
   * Проверяет предстоящие платежи и отправляет напоминания
   */
  async checkUpcomingPayments(): Promise<void> {
    try {
      // Сначала обновляем статусы просроченных платежей
      await paymentService.checkOverduePayments();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Проверяем напоминания для каждого периода
      for (const daysBefore of REMINDER_DAYS) {
        const reminderDate = new Date(today);
        reminderDate.setDate(reminderDate.getDate() + daysBefore);

        const reminderType = this.getReminderType(daysBefore);

        // Находим платежи, по которым нужно отправить напоминания
        const payments = await this.getPaymentsForReminder(reminderDate, reminderType);

        logger.info(`Found ${payments.length} payments for ${reminderType} reminder`);

        for (const payment of payments) {
          // Проверяем, не было ли уже отправлено напоминание
          const alreadySent = await this.isReminderSent(payment.id, reminderType);

          if (!alreadySent) {
            await this.sendPaymentReminder(payment.userId, payment, reminderType);
            await this.recordReminderSent(payment.id, payment.userId, reminderType);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking upcoming payments:', error);
      throw error;
    }
  }

  /**
   * Получает платежи, для которых нужно отправить напоминания
   * @param reminderDate - Дата напоминания
   * @param reminderType - Тип напоминания
   * @returns Массив платежей
   */
  private async getPaymentsForReminder(
    reminderDate: Date,
    reminderType: ReminderType
  ): Promise<PaymentWithDetails[]> {
    const startOfDay = new Date(reminderDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reminderDate);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [PaymentStatus.PLANNED, PaymentStatus.OVERDUE],
        },
      },
      include: {
        contract: {
          select: {
            id: true,
            tenantName: true,
            property: {
              select: {
                id: true,
                address: true,
              },
            },
          },
        },
      },
    });

    return payments.map((payment) => ({
      ...payment,
      type: payment.type as import('../types').PaymentType,
      status: payment.status as PaymentStatus,
      contract: payment.contract,
    }));
  }

  /**
   * Проверяет, было ли уже отправлено напоминание
   * @param paymentId - ID платежа
   * @param reminderType - Тип напоминания
   * @returns true если напоминание уже отправлено
   */
  private async isReminderSent(paymentId: string, reminderType: ReminderType): Promise<boolean> {
    const reminder = await prisma.paymentReminder.findUnique({
      where: {
        paymentId_reminderType: {
          paymentId,
          reminderType,
        },
      },
    });

    return reminder !== null;
  }

  /**
   * Записывает информацию об отправленном напоминании
   * @param paymentId - ID платежа
   * @param userId - ID пользователя
   * @param reminderType - Тип напоминания
   */
  private async recordReminderSent(
    paymentId: string,
    userId: number,
    reminderType: ReminderType
  ): Promise<void> {
    await prisma.paymentReminder.create({
      data: {
        paymentId,
        userId,
        reminderType,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Отправляет напоминание о платеже пользователю
   * @param userId - ID пользователя
   * @param payment - Платёж с деталями
   * @param reminderType - Тип напоминания
   */
  async sendPaymentReminder(
    userId: number,
    payment: PaymentWithDetails,
    reminderType: ReminderType
  ): Promise<void> {
    if (!this.bot) {
      logger.error('Cannot send reminder: bot not initialized');
      return;
    }

    try {
      const message = this.buildReminderMessage(payment, reminderType);

      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Отметить оплаченным',
                callback_data: `mark_paid:${payment.id}`,
              },
            ],
            [
              {
                text: '📅 Перейти к графику',
                callback_data: 'action:payment_schedule',
              },
            ],
          ],
        },
      });

      logger.info(`Reminder sent to user ${userId} for payment ${payment.id}`);
    } catch (error) {
      logger.error(`Error sending reminder to user ${userId}:`, error);
    }
  }

  /**
   * Формирует текст напоминания
   * @param payment - Платёж с деталями
   * @param reminderType - Тип напоминания
   * @returns Текст сообщения
   */
  private buildReminderMessage(payment: PaymentWithDetails, reminderType: ReminderType): string {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    };

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getReminderEmoji = (type: ReminderType): string => {
      switch (type) {
        case 'THREE_DAYS':
          return '⏰';
        case 'ONE_DAY':
          return '⚡';
        case 'TODAY':
          return '🔔';
        default:
          return '⏰';
      }
    };

    const getReminderText = (type: ReminderType): string => {
      switch (type) {
        case 'THREE_DAYS':
          return 'Через 3 дня';
        case 'ONE_DAY':
          return 'Завтра';
        case 'TODAY':
          return 'Сегодня';
        default:
          return 'Скоро';
      }
    };

    const emoji = getReminderEmoji(reminderType);
    const reminderText = getReminderText(reminderType);

    let message = `${emoji} <b>Напоминание о платеже</b>\n\n`;
    message += `📅 <b>${reminderText}</b> ожидается платёж:\n\n`;
    message += `💰 <b>Сумма:</b> ${formatAmount(payment.amount)}\n`;
    message += `📋 <b>Тип:</b> ${PaymentTypeLabels[payment.type]}\n`;
    message += `🏠 <b>Объект:</b> ${payment.contract.property.address}\n`;
    message += `👤 <b>Арендатор:</b> ${payment.contract.tenantName}\n`;
    message += `📆 <b>Дата платежа:</b> ${formatDate(payment.date)}\n`;

    if (payment.description) {
      message += `📝 <b>Примечание:</b> ${payment.description}\n`;
    }

    if (payment.status === PaymentStatus.OVERDUE) {
      message += `\n⚠️ <b>Внимание:</b> Платёж просрочен!`;
    }

    return message;
  }

  /**
   * Получает тип напоминания по количеству дней
   * @param daysBefore - Количество дней до платежа
   * @returns Тип напоминания
   */
  private getReminderType(daysBefore: number): ReminderType {
    switch (daysBefore) {
      case 3:
        return ReminderType.THREE_DAYS;
      case 1:
        return ReminderType.ONE_DAY;
      case 0:
        return ReminderType.TODAY;
      default:
        return ReminderType.THREE_DAYS;
    }
  }

  /**
   * Принудительно запускает проверку напоминаний
   * (для тестирования или ручного запуска)
   */
  async forceCheck(): Promise<void> {
    logger.info('Force checking upcoming payments...');
    await this.checkUpcomingPayments();
  }

  /**
   * Получает статистику отправленных напоминаний
   * @param userId - ID пользователя (опционально)
   * @param days - Количество дней для статистики
   * @returns Статистика напоминаний
   */
  async getReminderStatistics(
    userId?: number,
    days: number = 30
  ): Promise<{
    total: number;
    byType: Record<ReminderType, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: { userId?: number; sentAt: { gte: Date } } = {
      sentAt: { gte: startDate },
    };

    if (userId) {
      where.userId = userId;
    }

    const reminders = await prisma.paymentReminder.groupBy({
      by: ['reminderType'],
      where,
      _count: {
        id: true,
      },
    });

    const result: { total: number; byType: Record<ReminderType, number> } = {
      total: 0,
      byType: {
        [ReminderType.THREE_DAYS]: 0,
        [ReminderType.ONE_DAY]: 0,
        [ReminderType.TODAY]: 0,
      },
    };

    reminders.forEach((group) => {
      const count = group._count.id;
      result.total += count;
      result.byType[group.reminderType as ReminderType] = count;
    });

    return result;
  }
}

// ============================================
// EXPORT
// ============================================

export const reminderService = new ReminderService();
