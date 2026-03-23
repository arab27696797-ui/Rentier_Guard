/**
 * @fileoverview Сцена добавления платежа
 * @module modules/payment/scenes/addPayment.scene
 * 
 * Шаги сцены:
 * 1. Выбор договора
 * 2. Тип платежа (аренда/залог/коммуналка/штраф)
 * 3. Сумма
 * 4. Дата платежа
 * 5. Статус (запланирован/оплачен)
 * 6. Описание (опционально)
 */

import { Scenes, Markup } from 'telegraf';
import { PaymentWizardContext, PaymentType, PaymentStatus, PaymentTypeLabels, PaymentStatusLabels } from '../types';
import { paymentTypeSchema, amountSchema, paymentDateSchema, paymentStatusSchema, descriptionSchema } from '../validators';
import { paymentService } from '../services/payment.service';
import { messages } from '../templates/messages';
import { logger } from '../../../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Имя сцены
export const ADD_PAYMENT_SCENE = 'add_payment';

// ============================================
// KEYBOARD BUILDERS
// ============================================

/** Клавиатура для выбора типа платежа */
const paymentTypeKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(PaymentTypeLabels[PaymentType.RENT], `type:${PaymentType.RENT}`)],
  [Markup.button.callback(PaymentTypeLabels[PaymentType.DEPOSIT], `type:${PaymentType.DEPOSIT}`)],
  [Markup.button.callback(PaymentTypeLabels[PaymentType.UTILITIES], `type:${PaymentType.UTILITIES}`)],
  [Markup.button.callback(PaymentTypeLabels[PaymentType.FINE], `type:${PaymentType.FINE}`)],
  [Markup.button.callback(PaymentTypeLabels[PaymentType.OTHER], `type:${PaymentType.OTHER}`)],
  [Markup.button.callback('❌ Отменить', 'action:cancel')],
]);

/** Клавиатура для выбора статуса */
const statusKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(PaymentStatusLabels[PaymentStatus.PLANNED], `status:${PaymentStatus.PLANNED}`)],
  [Markup.button.callback(PaymentStatusLabels[PaymentStatus.PAID], `status:${PaymentStatus.PAID}`)],
  [Markup.button.callback('❌ Отменить', 'action:cancel')],
]);

/** Клавиатура пропуска описания */
const skipDescriptionKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⏭️ Пропустить', 'skip:description')],
  [Markup.button.callback('❌ Отменить', 'action:cancel')],
]);

/** Клавиатура подтверждения */
const confirmKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('✅ Сохранить', 'confirm:save')],
  [Markup.button.callback('❌ Отменить', 'action:cancel')],
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Получает список договоров пользователя
 */
async function getUserContracts(userId: number) {
  return await prisma.contract.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          address: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Создает клавиатуру выбора договора
 */
function buildContractKeyboard(contracts: Awaited<ReturnType<typeof getUserContracts>>) {
  const buttons = contracts.map((contract) => [
    Markup.button.callback(
      `📄 ${contract.tenantName} — ${contract.property.address.substring(0, 25)}...`,
      `contract:${contract.id}`
    ),
  ]);

  buttons.push([Markup.button.callback('❌ Отменить', 'action:cancel')]);

  return Markup.inlineKeyboard(buttons);
}

// ============================================
// SCENE
// ============================================

export const addPaymentScene = new Scenes.WizardScene<PaymentWizardContext>(
  ADD_PAYMENT_SCENE,

  // ========== ШАГ 1: Выбор договора ==========
  async (ctx) => {
    try {
      const userId = ctx.from!.id;
      const contracts = await getUserContracts(userId);

      if (contracts.length === 0) {
        await ctx.reply(
          messages.addPayment.noContracts,
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Добавить договор', 'action:add_contract')],
            [Markup.button.callback('🔙 В главное меню', 'action:main_menu')],
          ])
        );
        return ctx.scene.leave();
      }

      // Сохраняем договоры в сессии
      ctx.session.userContracts = contracts.map((c) => ({
        id: c.id,
        tenantName: c.tenantName,
        propertyAddress: c.property.address,
      }));

      await ctx.reply(
        messages.addPayment.step1Contract,
        buildContractKeyboard(contracts)
      );

      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 1:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Выбор типа платежа ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'action:cancel') {
        await ctx.reply(messages.addPayment.cancelled);
        return ctx.scene.leave();
      }

      if (!data.startsWith('contract:')) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const contractId = data.replace('contract:', '');
      ctx.session.paymentData = {
        ...ctx.session.paymentData,
        contractId,
      };

      await ctx.reply(
        messages.addPayment.step2Type,
        paymentTypeKeyboard
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 2:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Ввод суммы ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'action:cancel') {
        await ctx.reply(messages.addPayment.cancelled);
        return ctx.scene.leave();
      }

      if (!data.startsWith('type:')) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const type = data.replace('type:', '') as PaymentType;
      const typeResult = paymentTypeSchema.safeParse(type);

      if (!typeResult.success) {
        await ctx.reply(typeResult.error.errors[0].message);
        return;
      }

      ctx.session.paymentData = {
        ...ctx.session.paymentData,
        type: typeResult.data,
      };

      await ctx.reply(
        messages.addPayment.step3Amount,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Отменить', 'action:cancel')]])
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 3:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 4: Ввод даты ==========
  async (ctx) => {
    try {
      // Проверяем callback
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        if (data === 'action:cancel') {
          await ctx.answerCbQuery();
          await ctx.reply(messages.addPayment.cancelled);
          return ctx.scene.leave();
        }
      }

      // Валидация суммы
      const message = ctx.message;
      if (!message || !('text' in message)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const amountResult = amountSchema.safeParse(message.text);
      if (!amountResult.success) {
        await ctx.reply(amountResult.error.errors[0].message);
        return;
      }

      ctx.session.paymentData = {
        ...ctx.session.paymentData,
        amount: amountResult.data,
      };

      await ctx.reply(
        messages.addPayment.step4Date,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Отменить', 'action:cancel')]])
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 4:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 5: Выбор статуса ==========
  async (ctx) => {
    try {
      // Проверяем callback
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        if (data === 'action:cancel') {
          await ctx.answerCbQuery();
          await ctx.reply(messages.addPayment.cancelled);
          return ctx.scene.leave();
        }
      }

      // Валидация даты
      const message = ctx.message;
      if (!message || !('text' in message)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const dateResult = paymentDateSchema.safeParse(message.text);
      if (!dateResult.success) {
        await ctx.reply(dateResult.error.errors[0].message);
        return;
      }

      ctx.session.paymentData = {
        ...ctx.session.paymentData,
        date: dateResult.data,
      };

      await ctx.reply(
        messages.addPayment.step5Status,
        statusKeyboard
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 5:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 6: Описание (опционально) ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'action:cancel') {
        await ctx.reply(messages.addPayment.cancelled);
        return ctx.scene.leave();
      }

      if (!data.startsWith('status:')) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const status = data.replace('status:', '') as PaymentStatus;
      const statusResult = paymentStatusSchema.safeParse(status);

      if (!statusResult.success) {
        await ctx.reply(statusResult.error.errors[0].message);
        return;
      }

      ctx.session.paymentData = {
        ...ctx.session.paymentData,
        status: statusResult.data,
      };

      await ctx.reply(
        messages.addPayment.step6Description,
        skipDescriptionKeyboard
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 6:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 7: Подтверждение и сохранение ==========
  async (ctx) => {
    try {
      // Обработка callback
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        await ctx.answerCbQuery();

        if (data === 'action:cancel') {
          await ctx.reply(messages.addPayment.cancelled);
          return ctx.scene.leave();
        }

        if (data === 'skip:description') {
          ctx.session.paymentData = {
            ...ctx.session.paymentData,
            description: undefined,
          };
        } else {
          return;
        }
      } else if (ctx.message && 'text' in ctx.message) {
        // Валидация описания
        const descResult = descriptionSchema.safeParse(ctx.message.text);
        if (!descResult.success) {
          await ctx.reply(descResult.error.errors[0].message);
          return;
        }

        ctx.session.paymentData = {
          ...ctx.session.paymentData,
          description: descResult.data || undefined,
        };
      }

      // Получаем информацию о договоре для отображения
      const contract = ctx.session.userContracts?.find(
        (c) => c.id === ctx.session.paymentData?.contractId
      );

      // Формируем сводку
      const { type, amount, date, status, description } = ctx.session.paymentData;
      const summary = messages.addPayment.summary(
        contract?.tenantName || 'Неизвестно',
        contract?.propertyAddress || 'Неизвестно',
        PaymentTypeLabels[type!],
        amount!,
        date!,
        PaymentStatusLabels[status!],
        description
      );

      await ctx.reply(summary, confirmKeyboard);
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addPayment scene step 7:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 8: Сохранение ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'action:cancel') {
        await ctx.reply(messages.addPayment.cancelled);
        return ctx.scene.leave();
      }

      if (data === 'confirm:save') {
        const { contractId, type, amount, date, status, description } = ctx.session.paymentData;

        // Сохраняем платёж
        const payment = await paymentService.createPayment({
          userId: ctx.from!.id,
          contractId: contractId!,
          type: type!,
          amount: amount!,
          date: date!,
          status: status!,
          description,
        });

        await ctx.reply(
          messages.addPayment.success(payment.amount, payment.date),
          Markup.inlineKeyboard([
            [Markup.button.callback('📅 График платежей', 'view:schedule')],
            [Markup.button.callback('➕ Добавить ещё', 'action:add_payment')],
          ])
        );

        // Очищаем сессию
        delete ctx.session.paymentData;
        delete ctx.session.userContracts;
        return ctx.scene.leave();
      }

      await ctx.reply(messages.errors.invalidInput);
    } catch (error) {
      logger.error('Error in addPayment scene step 8:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  }
);

// ============================================
// MIDDLEWARE
// ============================================

// Проверка авторизации при входе в сцену
addPaymentScene.enter(async (ctx, next) => {
  if (!ctx.from) {
    await ctx.reply(messages.errors.unauthorized);
    return ctx.scene.leave();
  }
  await next();
});

// Очистка сессии при выходе
addPaymentScene.leave(async (ctx, next) => {
  delete ctx.session.paymentData;
  delete ctx.session.userContracts;
  await next();
});
