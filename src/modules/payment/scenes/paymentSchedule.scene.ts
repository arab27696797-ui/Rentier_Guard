/**
 * @fileoverview Сцена графика платежей
 * @module modules/payment/scenes/paymentSchedule.scene
 * 
 * Функционал:
 * - Показать предстоящие платежи (сгруппировано по месяцам)
 * - Кнопки: отметить оплаченным / редактировать
 */

import { Scenes, Markup } from 'telegraf';
import { PaymentWizardContext, PaymentWithDetails, PaymentStatus, PaymentTypeLabels, PaymentStatusLabels, PaymentStatusEmojis } from '../types';
import { paymentService } from '../services/payment.service';
import { messages } from '../templates/messages';
import { logger } from '../../../utils/logger';

// Имя сцены
export const PAYMENT_SCHEDULE_SCENE = 'payment_schedule';

// ============================================
// CONSTANTS
// ============================================

const DAYS_AHEAD = 90; // Показывать платежи на 90 дней вперёд
const ITEMS_PER_PAGE = 5;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Форматирует дату
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Форматирует сумму
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Группирует платежи по месяцам
 */
function groupPaymentsByMonth(payments: PaymentWithDetails[]): Map<string, PaymentWithDetails[]> {
  const grouped = new Map<string, PaymentWithDetails[]>();

  payments.forEach((payment) => {
    const monthKey = new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
    }).format(payment.date);

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(payment);
  });

  return grouped;
}

/**
 * Создает клавиатуру для списка платежей
 */
function buildScheduleKeyboard(payments: PaymentWithDetails[], page: number): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: ReturnType<typeof Markup.button.callback>[][] = [];

  // Группируем по месяцам
  const grouped = groupPaymentsByMonth(payments);

  grouped.forEach((monthPayments, monthName) => {
    // Заголовок месяца
    buttons.push([Markup.button.callback(`📅 ${monthName.toUpperCase()}`, 'noop:month')]);

    // Платежи месяца
    monthPayments.forEach((payment) => {
      const emoji = PaymentStatusEmojis[payment.status];
      const shortDate = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(payment.date);
      const label = `${emoji} ${shortDate} — ${formatAmount(payment.amount)}`;
      
      buttons.push([Markup.button.callback(label, `payment:${payment.id}`)]);
    });

    // Разделитель
    buttons.push([Markup.button.callback('──────────────', 'noop:divider')]);
  });

  // Кнопки фильтров
  buttons.push([
    Markup.button.callback('📅 Все', 'filter:all'),
    Markup.button.callback('⏳ Запланированы', 'filter:planned'),
    Markup.button.callback('✅ Оплачены', 'filter:paid'),
  ]);

  // Кнопки пагинации
  const paginationButtons: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 0) {
    paginationButtons.push(Markup.button.callback('◀️', `page:${page - 1}`));
  }
  paginationButtons.push(Markup.button.callback('➕ Добавить', 'action:add_payment'));
  paginationButtons.push(Markup.button.callback('📊 Экспорт', 'action:export'));
  if (payments.length === ITEMS_PER_PAGE) {
    paginationButtons.push(Markup.button.callback('▶️', `page:${page + 1}`));
  }
  buttons.push(paginationButtons);

  buttons.push([Markup.button.callback('🔙 В главное меню', 'action:main_menu')]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Создает клавиатуру детального просмотра платежа
 */
function buildPaymentDetailKeyboard(payment: PaymentWithDetails): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: ReturnType<typeof Markup.button.callback>[][] = [];

  if (payment.status === PaymentStatus.PLANNED || payment.status === PaymentStatus.OVERDUE) {
    buttons.push([Markup.button.callback('✅ Отметить оплаченным', `mark_paid:${payment.id}`)]);
  }

  buttons.push(
    [Markup.button.callback('✏️ Редактировать', `edit:${payment.id}`)],
    [Markup.button.callback('🗑️ Удалить', `delete:${payment.id}`)],
    [Markup.button.callback('📅 К графику', 'action:back_to_schedule')]
  );

  return Markup.inlineKeyboard(buttons);
}

/**
 * Создает клавиатуру подтверждения удаления
 */
function buildDeleteConfirmKeyboard(paymentId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Да, удалить', `confirm_delete:${paymentId}`)],
    [Markup.button.callback('❌ Нет, отменить', `payment:${paymentId}`)],
  ]);
}

// ============================================
// SCENE
// ============================================

export const paymentScheduleScene = new Scenes.WizardScene<PaymentWizardContext>(
  PAYMENT_SCHEDULE_SCENE,

  // ========== ШАГ 1: Показ графика платежей ==========
  async (ctx) => {
    try {
      const userId = ctx.from!.id;
      const page = ctx.session.paymentPage || 0;
      const filter = ctx.session.paymentFilter || 'all';

      let payments: PaymentWithDetails[];

      if (filter === 'planned') {
        payments = await paymentService.getUpcomingPayments(userId, DAYS_AHEAD);
        payments = payments.filter((p) => p.status === PaymentStatus.PLANNED);
      } else if (filter === 'paid') {
        payments = await paymentService.getRecentPaidPayments(userId, 30);
      } else {
        payments = await paymentService.getUpcomingPayments(userId, DAYS_AHEAD);
      }

      // Применяем пагинацию
      const paginatedPayments = payments.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

      if (paginatedPayments.length === 0) {
        const emptyMessage = filter === 'all' 
          ? messages.schedule.empty 
          : messages.schedule.emptyFiltered;
        
        await ctx.reply(
          emptyMessage,
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Добавить платёж', 'action:add_payment')],
            [Markup.button.callback('🔙 В главное меню', 'action:main_menu')],
          ])
        );
        return;
      }

      // Формируем заголовок с информацией о фильтре
      let header = messages.schedule.title;
      if (filter === 'planned') {
        header += '\n\n🔍 Фильтр: запланированные';
      } else if (filter === 'paid') {
        header += '\n\n🔍 Фильтр: оплаченные';
      }

      // Добавляем статистику
      const totalPlanned = payments
        .filter((p) => p.status === PaymentStatus.PLANNED)
        .reduce((sum, p) => sum + p.amount, 0);
      
      header += `\n💰 Всего к оплате: ${formatAmount(totalPlanned)}`;

      await ctx.reply(header, buildScheduleKeyboard(paginatedPayments, page));
    } catch (error) {
      logger.error('Error in paymentSchedule scene step 1:', error);
      await ctx.reply(messages.errors.general);
    }
  }
);

// ============================================
// ACTION HANDLERS
// ============================================

// Просмотр деталей платежа
paymentScheduleScene.action(/^payment:(.+)$/, async (ctx) => {
  try {
    const paymentId = ctx.match[1];
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      await ctx.answerCbQuery('❌ Платёж не найден');
      return;
    }

    if (payment.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ У вас нет доступа к этому платежу');
      return;
    }

    const message = messages.schedule.detail(
      PaymentTypeLabels[payment.type],
      payment.amount,
      payment.date,
      PaymentStatusLabels[payment.status],
      payment.contract.tenantName,
      payment.contract.property.address,
      payment.description,
      payment.paidAt
    );

    await ctx.editMessageText(message, buildPaymentDetailKeyboard(payment));
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error viewing payment:', error);
    await ctx.answerCbQuery('❌ Ошибка при загрузке платежа');
  }
});

// Фильтры
paymentScheduleScene.action(/^filter:(.+)$/, async (ctx) => {
  try {
    const filter = ctx.match[1];
    ctx.session.paymentFilter = filter;
    ctx.session.paymentPage = 0;

    await ctx.answerCbQuery(`🔍 Фильтр: ${filter}`);
    return ctx.scene.reenter();
  } catch (error) {
    logger.error('Error applying filter:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Пагинация
paymentScheduleScene.action(/^page:(\d+)$/, async (ctx) => {
  try {
    const page = parseInt(ctx.match[1], 10);
    ctx.session.paymentPage = page;

    await ctx.answerCbQuery();
    return ctx.scene.reenter();
  } catch (error) {
    logger.error('Error in pagination:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Отметить как оплаченный
paymentScheduleScene.action(/^mark_paid:(.+)$/, async (ctx) => {
  try {
    const paymentId = ctx.match[1];
    const userId = ctx.from!.id;

    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment || payment.userId !== userId) {
      await ctx.answerCbQuery('❌ Платёж не найден');
      return;
    }

    await paymentService.markAsPaid(paymentId);

    await ctx.answerCbQuery('✅ Платёж отмечен как оплаченный!');
    
    // Обновляем сообщение
    const updatedPayment = await paymentService.getPaymentById(paymentId);
    if (updatedPayment) {
      const message = messages.schedule.detail(
        PaymentTypeLabels[updatedPayment.type],
        updatedPayment.amount,
        updatedPayment.date,
        PaymentStatusLabels[updatedPayment.status],
        updatedPayment.contract.tenantName,
        updatedPayment.contract.property.address,
        updatedPayment.description,
        updatedPayment.paidAt
      );
      await ctx.editMessageText(message, buildPaymentDetailKeyboard(updatedPayment));
    }
  } catch (error) {
    logger.error('Error marking payment as paid:', error);
    await ctx.answerCbQuery('❌ Ошибка при обновлении статуса');
  }
});

// Подтверждение удаления
paymentScheduleScene.action(/^delete:(.+)$/, async (ctx) => {
  try {
    const paymentId = ctx.match[1];
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment || payment.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Платёж не найден');
      return;
    }

    await ctx.editMessageText(
      messages.schedule.deleteConfirm(formatAmount(payment.amount), payment.date),
      buildDeleteConfirmKeyboard(paymentId)
    );
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error showing delete confirmation:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Подтвержденное удаление
paymentScheduleScene.action(/^confirm_delete:(.+)$/, async (ctx) => {
  try {
    const paymentId = ctx.match[1];
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment || payment.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Платёж не найден');
      return;
    }

    await paymentService.deletePayment(paymentId);

    await ctx.editMessageText(messages.schedule.deleteSuccess);
    await ctx.answerCbQuery('✅ Платёж удалён');

    // Возвращаемся к графику через задержку
    setTimeout(() => ctx.scene.reenter(), 1500);
  } catch (error) {
    logger.error('Error deleting payment:', error);
    await ctx.answerCbQuery('❌ Ошибка при удалении');
  }
});

// Возврат к графику
paymentScheduleScene.action('action:back_to_schedule', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.reenter();
});

// Экспорт
paymentScheduleScene.action('action:export', async (ctx) => {
  try {
    await ctx.answerCbQuery('📊 Подготовка экспорта...');
    
    const userId = ctx.from!.id;
    const year = new Date().getFullYear();
    
    const csvPath = await paymentService.exportPaymentsToCSV(userId, year);
    
    await ctx.replyWithDocument(
      { source: csvPath, filename: `payments_${year}.csv` },
      { caption: `📊 Экспорт платежей за ${year} год` }
    );
  } catch (error) {
    logger.error('Error exporting payments:', error);
    await ctx.reply('❌ Ошибка при экспорте платежей');
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// Проверка авторизации
paymentScheduleScene.enter(async (ctx, next) => {
  if (!ctx.from) {
    await ctx.reply(messages.errors.unauthorized);
    return ctx.scene.leave();
  }
  // Сбрасываем фильтры при входе
  ctx.session.paymentPage = 0;
  if (!ctx.session.paymentFilter) {
    ctx.session.paymentFilter = 'all';
  }
  await next();
});

// Очистка сессии при выходе
paymentScheduleScene.leave(async (ctx, next) => {
  delete ctx.session.paymentPage;
  delete ctx.session.paymentFilter;
  delete ctx.session.selectedPaymentId;
  await next();
});
