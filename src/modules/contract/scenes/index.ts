/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Планировщики задач (Cron Jobs)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Модуль для инициализации и управления периодическими задачами бота:
 * - Налоговые напоминания
 * - Напоминания о платежах
 * - Проверка сроков договоров
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Telegraf, Scenes } from 'telegraf';
import { Pool } from 'pg';
import cron from 'node-cron';

// Импорт сервисов
import { UserService } from '../services/userService';
import { PaymentService } from '../services/paymentService';
import { ContractService } from '../services/contractService';
import { TaxService } from '../services/taxService';
import { NotificationService } from '../services/notificationService';

// Импорт контента
import { 
  getTaxReminderMessage,
  getPaymentReminderMessage,
  getContractExpiryMessage,
} from '../content/messages';

// ═══════════════════════════════════════════════════════════════════════════════
// Хранилище активных задач
// ═══════════════════════════════════════════════════════════════════════════════

const activeJobs: Map<string, cron.ScheduledTask> = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// Инициализация всех планировщиков
// ═══════════════════════════════════════════════════════════════════════════════

export function initCronJobs(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): void {
  console.log('⏰ Инициализация планировщиков...');

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. Налоговые напоминания (каждый день в 9:00)
  // ═════════════════════════════════════════════════════════════════════════════
  
  const taxReminderJob = cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        console.log('📅 Запуск задачи: Налоговые напоминания');
        await sendTaxReminders(bot, pool);
      } catch (error) {
        console.error('❌ Ошибка в задаче налоговых напоминаний:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow',
    }
  );
  
  activeJobs.set('tax-reminders', taxReminderJob);
  console.log('✅ Планировщик налоговых напоминаний запущен (9:00 ежедневно)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. Напоминания о платежах (каждые 6 часов)
  // ═════════════════════════════════════════════════════════════════════════════
  
  const paymentReminderJob = cron.schedule(
    '0 */6 * * *',
    async () => {
      try {
        console.log('💰 Запуск задачи: Напоминания о платежах');
        await sendPaymentReminders(bot, pool);
      } catch (error) {
        console.error('❌ Ошибка в задаче напоминаний о платежах:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow',
    }
  );
  
  activeJobs.set('payment-reminders', paymentReminderJob);
  console.log('✅ Планировщик напоминаний о платежах запущен (каждые 6 часов)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. Проверка сроков договоров (раз в день в 10:00)
  // ═════════════════════════════════════════════════════════════════════════════
  
  const contractExpiryJob = cron.schedule(
    '0 10 * * *',
    async () => {
      try {
        console.log('📄 Запуск задачи: Проверка сроков договоров');
        await checkContractExpirations(bot, pool);
      } catch (error) {
        console.error('❌ Ошибка в задаче проверки сроков договоров:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow',
    }
  );
  
  activeJobs.set('contract-expiry', contractExpiryJob);
  console.log('✅ Планировщик проверки сроков договоров запущен (10:00 ежедневно)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. Ежемесячный отчет (1-го числа каждого месяца в 8:00)
  // ═════════════════════════════════════════════════════════════════════════════
  
  const monthlyReportJob = cron.schedule(
    '0 8 1 * *',
    async () => {
      try {
        console.log('📊 Запуск задачи: Ежемесячный отчет');
        await sendMonthlyReports(bot, pool);
      } catch (error) {
        console.error('❌ Ошибка в задаче ежемесячного отчета:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow',
    }
  );
  
  activeJobs.set('monthly-report', monthlyReportJob);
  console.log('✅ Планировщик ежемесячных отчетов запущен (1-е число в 8:00)');

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. Очистка старых уведомлений (раз в неделю, воскресенье в 3:00)
  // ═════════════════════════════════════════════════════════════════════════════
  
  const cleanupJob = cron.schedule(
    '0 3 * * 0',
    async () => {
      try {
        console.log('🧹 Запуск задачи: Очистка старых уведомлений');
        await cleanupOldNotifications(pool);
      } catch (error) {
        console.error('❌ Ошибка в задаче очистки уведомлений:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Moscow',
    }
  );
  
  activeJobs.set('cleanup', cleanupJob);
  console.log('✅ Планировщик очистки запущен (воскресенье 3:00)');

  console.log('✅ Все планировщики успешно инициализированы');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Задача: Налоговые напоминания
// ═══════════════════════════════════════════════════════════════════════════════

async function sendTaxReminders(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): Promise<void> {
  try {
    const taxService = new TaxService(pool);
    const userService = new UserService(pool);
    const notificationService = new NotificationService(pool);
    
    // Получаем всех самозанятых пользователей
    const selfEmployedUsers = await userService.getSelfEmployedUsers();
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    // Проверяем, является ли сегодня последним днем месяца
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const isLastWeekOfMonth = today.getDate() >= lastDayOfMonth - 7;
    
    for (const user of selfEmployedUsers) {
      try {
        // Получаем налоговую информацию пользователя
        const taxInfo = await taxService.getTaxInfo(user.id);
        
        if (!taxInfo) continue;
        
        // Проверяем, есть ли неоплаченные налоги
        const unpaidTax = await taxService.getUnpaidTaxForMonth(user.id, currentMonth, currentYear);
        
        if (unpaidTax && unpaidTax.amount > 0) {
          const message = getTaxReminderMessage({
            amount: unpaidTax.amount,
            month: currentMonth,
            year: currentYear,
            dueDate: taxInfo.paymentDeadline,
            isUrgent: isLastWeekOfMonth,
          });
          
          await bot.telegram.sendMessage(user.telegramId, message, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💳 Оплатить налог', url: 'https://npd.nalog.ru' }],
                [{ text: '📊 Подробнее', callback_data: 'tax_details' }],
              ],
            },
          });
          
          // Сохраняем уведомление в БД
          await notificationService.create({
            userId: user.id,
            type: 'tax_reminder',
            title: 'Налоговое напоминание',
            message: `Необходимо оплатить налог НПД: ${unpaidTax.amount} ₽`,
            metadata: {
              amount: unpaidTax.amount,
              month: currentMonth,
              year: currentYear,
            },
          });
          
          console.log(`📧 Налоговое напоминание отправлено пользователю ${user.telegramId}`);
        }
      } catch (userError) {
        console.error(`❌ Ошибка отправки напоминания пользователю ${user.telegramId}:`, userError);
      }
    }
    
    console.log(`✅ Налоговые напоминания отправлены: ${selfEmployedUsers.length} пользователей`);
  } catch (error) {
    console.error('❌ Ошибка в sendTaxReminders:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Задача: Напоминания о платежах
// ═══════════════════════════════════════════════════════════════════════════════

async function sendPaymentReminders(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): Promise<void> {
  try {
    const paymentService = new PaymentService(pool);
    const userService = new UserService(pool);
    const notificationService = new NotificationService(pool);
    
    // Получаем предстоящие платежи (в следующие 7 дней)
    const upcomingPayments = await paymentService.getUpcomingPayments(7);
    
    // Группируем платежи по пользователям
    const paymentsByUser = new Map<number, typeof upcomingPayments>();
    
    for (const payment of upcomingPayments) {
      if (!paymentsByUser.has(payment.userId)) {
        paymentsByUser.set(payment.userId, []);
      }
      paymentsByUser.get(payment.userId)!.push(payment);
    }
    
    // Отправляем уведомления каждому пользователю
    for (const [userId, payments] of paymentsByUser) {
      try {
        const user = await userService.getById(userId);
        
        if (!user) continue;
        
        for (const payment of payments) {
          const daysUntilDue = Math.ceil(
            (new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          
          const message = getPaymentReminderMessage({
            amount: payment.amount,
            propertyAddress: payment.propertyAddress,
            tenantName: payment.tenantName,
            dueDate: payment.dueDate,
            daysUntilDue,
            isOverdue: daysUntilDue < 0,
          });
          
          await bot.telegram.sendMessage(user.telegramId, message, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Отметить оплаченным', callback_data: `payment_mark_${payment.id}` }],
                [{ text: '💬 Написать арендатору', callback_data: `contact_tenant_${payment.tenantId}` }],
              ],
            },
          });
          
          // Сохраняем уведомление
          await notificationService.create({
            userId: user.id,
            type: 'payment_reminder',
            title: 'Напоминание о платеже',
            message: `Платеж ${payment.amount} ₽ от ${payment.tenantName} ожидается ${payment.dueDate}`,
            metadata: {
              paymentId: payment.id,
              amount: payment.amount,
              dueDate: payment.dueDate,
            },
          });
        }
        
        console.log(`📧 Напоминания о платежах отправлены пользователю ${user.telegramId}`);
      } catch (userError) {
        console.error(`❌ Ошибка отправки напоминаний пользователю ${userId}:`, userError);
      }
    }
    
    console.log(`✅ Напоминания о платежах отправлены: ${upcomingPayments.length} платежей`);
  } catch (error) {
    console.error('❌ Ошибка в sendPaymentReminders:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Задача: Проверка сроков договоров
// ═══════════════════════════════════════════════════════════════════════════════

async function checkContractExpirations(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): Promise<void> {
  try {
    const contractService = new ContractService(pool);
    const userService = new UserService(pool);
    const notificationService = new NotificationService(pool);
    
    // Получаем договоры, истекающие в следующие 30 дней
    const expiringContracts = await contractService.getExpiringContracts(30);
    
    for (const contract of expiringContracts) {
      try {
        const user = await userService.getById(contract.userId);
        
        if (!user) continue;
        
        const daysUntilExpiry = Math.ceil(
          (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        const message = getContractExpiryMessage({
          contractNumber: contract.number,
          propertyAddress: contract.propertyAddress,
          tenantName: contract.tenantName,
          endDate: contract.endDate,
          daysUntilExpiry,
          isExpired: daysUntilExpiry < 0,
        });
        
        await bot.telegram.sendMessage(user.telegramId, message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📄 Просмотреть договор', callback_data: `contract_view_${contract.id}` }],
              [{ text: '🔄 Продлить договор', callback_data: `contract_extend_${contract.id}` }],
              [{ text: '❌ Расторгнуть', callback_data: `contract_terminate_${contract.id}` }],
            ],
          },
        });
        
        // Сохраняем уведомление
        await notificationService.create({
          userId: user.id,
          type: 'contract_expiry',
          title: daysUntilExpiry < 0 ? 'Договор истек!' : 'Договор скоро истекает',
          message: `Договор ${contract.number} (${contract.propertyAddress}) ${daysUntilExpiry < 0 ? 'истек' : `истекает через ${daysUntilExpiry} дней`}`,
          metadata: {
            contractId: contract.id,
            endDate: contract.endDate,
            daysUntilExpiry,
          },
        });
        
        console.log(`📧 Уведомление об истечении договора отправлено пользователю ${user.telegramId}`);
      } catch (userError) {
        console.error(`❌ Ошибка отправки уведомления пользователю ${contract.userId}:`, userError);
      }
    }
    
    console.log(`✅ Проверка сроков договоров завершена: ${expiringContracts.length} договоров`);
  } catch (error) {
    console.error('❌ Ошибка в checkContractExpirations:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Задача: Ежемесячный отчет
// ═══════════════════════════════════════════════════════════════════════════════

async function sendMonthlyReports(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): Promise<void> {
  try {
    const userService = new UserService(pool);
    const paymentService = new PaymentService(pool);
    const taxService = new TaxService(pool);
    
    // Получаем всех активных пользователей
    const activeUsers = await userService.getActiveUsers();
    
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    for (const user of activeUsers) {
      try {
        // Получаем статистику за прошлый месяц
        const monthlyStats = await paymentService.getMonthlyStats(user.id, prevMonth, prevYear);
        const taxStats = await taxService.getMonthlyTaxStats(user.id, prevMonth, prevYear);
        
        const reportMessage = `
📊 <b>Отчет за ${prevMonth}.${prevYear}</b>

💰 <b>Финансы:</b>
• Получено арендных платежей: ${monthlyStats.totalReceived.toLocaleString('ru-RU')} ₽
• Ожидается платежей: ${monthlyStats.totalPending.toLocaleString('ru-RU')} ₽
• Просрочено платежей: ${monthlyStats.totalOverdue.toLocaleString('ru-RU')} ₽

📋 <b>Договоры:</b>
• Активных договоров: ${monthlyStats.activeContracts}
• Новых договоров: ${monthlyStats.newContracts}
• Истекших договоров: ${monthlyStats.expiredContracts}

💸 <b>Налоги:</b>
• Начислено налога НПД: ${taxStats.taxAmount.toLocaleString('ru-RU')} ₽
• Оплачено: ${taxStats.paidAmount.toLocaleString('ru-RU')} ₽
• К оплате: ${(taxStats.taxAmount - taxStats.paidAmount).toLocaleString('ru-RU')} ₽

<i>Детальный отчет доступен в личном кабинете на сайте.</i>
        `;
        
        await bot.telegram.sendMessage(user.telegramId, reportMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📥 Скачать PDF отчет', callback_data: 'download_monthly_report' }],
              [{ text: '📊 Подробная статистика', callback_data: 'detailed_stats' }],
            ],
          },
        });
        
        console.log(`📧 Ежемесячный отчет отправлен пользователю ${user.telegramId}`);
      } catch (userError) {
        console.error(`❌ Ошибка отправки отчета пользователю ${user.telegramId}:`, userError);
      }
    }
    
    console.log(`✅ Ежемесячные отчеты отправлены: ${activeUsers.length} пользователей`);
  } catch (error) {
    console.error('❌ Ошибка в sendMonthlyReports:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Задача: Очистка старых уведомлений
// ═══════════════════════════════════════════════════════════════════════════════

async function cleanupOldNotifications(pool: Pool): Promise<void> {
  try {
    const notificationService = new NotificationService(pool);
    
    // Удаляем уведомления старше 90 дней
    const deletedCount = await notificationService.deleteOlderThan(90);
    
    console.log(`🧹 Очищено ${deletedCount} старых уведомлений`);
  } catch (error) {
    console.error('❌ Ошибка в cleanupOldNotifications:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Управление планировщиками
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Остановить все планировщики
 */
export function stopAllJobs(): void {
  console.log('⏹️ Остановка всех планировщиков...');
  
  for (const [name, job] of activeJobs) {
    job.stop();
    console.log(`⏹️ Планировщик "${name}" остановлен`);
  }
  
  activeJobs.clear();
  console.log('✅ Все планировщики остановлены');
}

/**
 * Перезапустить все планировщики
 */
export function restartAllJobs(
  bot: Telegraf<Scenes.WizardContext>,
  pool: Pool
): void {
  console.log('🔄 Перезапуск всех планировщиков...');
  stopAllJobs();
  initCronJobs(bot, pool);
}

/**
 * Получить список активных планировщиков
 */
export function getActiveJobs(): string[] {
  return Array.from(activeJobs.keys());
}

/**
 * Проверить статус планировщика
 */
export function isJobRunning(name: string): boolean {
  const job = activeJobs.get(name);
  return job !== undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default initCronJobs;
