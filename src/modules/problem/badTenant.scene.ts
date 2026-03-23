/**
 * Сцена управления чёрным списком арендаторов
 * RentierGuard Bot
 */

import { Composer, Markup, Scenes } from 'telegraf';
import {
  BadTenantReason,
  BadTenantReasonLabels,
  ProblemContext,
  BadTenantData,
} from '../types';
import {
  badTenantMenuMessage,
  badTenantAddPrompts,
  badTenantListMessage,
  badTenantDeleteMessages,
} from '../templates/messages';
import {
  addToBadTenant,
  getUserBadTenants,
  deleteBadTenant,
  getBadTenantById,
} from '../services/problem.service';
import { validateFullName, validateDebtAmount } from '../validators';

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка контекста сессии
 */
function ensureSession(ctx: ProblemContext): void {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.badTenantData) {
    ctx.session.badTenantData = {};
  }
}

/**
 * Очистка данных сессии
 */
function clearSession(ctx: ProblemContext): void {
  ctx.session.badTenantData = undefined;
  ctx.session.selectedBadTenantId = undefined;
}

// ============================================
// INLINE KEYBOARDS
// ============================================

/**
 * Главное меню чёрного списка
 */
const badTenantMenuKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('➕ Добавить запись', 'badtenant:add'),
  ],
  [
    Markup.button.callback('📋 Мой чёрный список', 'badtenant:list'),
  ],
  [
    Markup.button.callback('🗑 Удалить запись', 'badtenant:delete_menu'),
  ],
  [
    Markup.button.callback('🏠 Главное меню', 'badtenant:main_menu'),
  ],
]);

/**
 * Клавиатура выбора причины
 */
const reasonKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(BadTenantReasonLabels[BadTenantReason.NON_PAYMENT], `badtenant_reason:${BadTenantReason.NON_PAYMENT}`),
  ],
  [
    Markup.button.callback(BadTenantReasonLabels[BadTenantReason.PROPERTY_DAMAGE], `badtenant_reason:${BadTenantReason.PROPERTY_DAMAGE}`),
  ],
  [
    Markup.button.callback(BadTenantReasonLabels[BadTenantReason.RULES_VIOLATION], `badtenant_reason:${BadTenantReason.RULES_VIOLATION}`),
  ],
  [
    Markup.button.callback(BadTenantReasonLabels[BadTenantReason.FRAUD], `badtenant_reason:${BadTenantReason.FRAUD}`),
  ],
  [
    Markup.button.callback(BadTenantReasonLabels[BadTenantReason.OTHER], `badtenant_reason:${BadTenantReason.OTHER}`),
  ],
  [
    Markup.button.callback('❌ Отмена', 'badtenant:cancel'),
  ],
]);

/**
 * Клавиатура пропуска/отмены
 */
const skipCancelKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('⏭ Пропустить', 'badtenant:skip'),
  ],
  [
    Markup.button.callback('❌ Отмена', 'badtenant:cancel'),
  ],
]);

/**
 * Клавиатура отмены
 */
const cancelKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('❌ Отмена', 'badtenant:cancel')],
]);

/**
 * Клавиатура подтверждения удаления
 */
const deleteConfirmKeyboard = (id: string) => Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Да, удалить', `badtenant:confirm_delete:${id}`),
    Markup.button.callback('❌ Нет, отмена', 'badtenant:cancel_delete'),
  ],
]);

/**
 * Клавиатура после успешного добавления
 */
const afterAddKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('➕ Добавить ещё', 'badtenant:add'),
    Markup.button.callback('📋 Мой список', 'badtenant:list'),
  ],
  [
    Markup.button.callback('🏠 Главное меню', 'badtenant:main_menu'),
  ],
]);

// ============================================
// СЦЕНА ПРОСМОТРА И УПРАВЛЕНИЯ (НЕ WIZARD)
// ============================================

export const badTenantScene = new Scenes.BaseScene<ProblemContext>('bad-tenant');

// Вход в сцену
badTenantScene.enter(async (ctx) => {
  await ctx.reply(
    badTenantMenuMessage,
    {
      parse_mode: 'HTML',
      ...badTenantMenuKeyboard,
    }
  );
});

// ============================================
// ОБРАБОТЧИКИ ГЛАВНОГО МЕНЮ
// ============================================

// Добавить запись - переход в wizard
badTenantScene.action('badtenant:add', async (ctx) => {
  await ctx.answerCbQuery('Добавление записи...');
  return ctx.scene.enter('bad-tenant-wizard');
});

// Просмотр списка
badTenantScene.action('badtenant:list', async (ctx) => {
  try {
    await ctx.answerCbQuery('Загружаю список...');
    
    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply('❌ Ошибка: не удалось определить пользователя');
      return;
    }
    
    const result = await getUserBadTenants(userId);
    
    if (!result.success) {
      await ctx.reply(`❌ Ошибка: ${result.error}`);
      return;
    }
    
    const tenants = result.data as BadTenantData[];
    
    if (tenants.length === 0) {
      await ctx.editMessageText(
        badTenantListMessage.empty,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Добавить запись', 'badtenant:add')],
            [Markup.button.callback('◀️ Назад', 'badtenant:back')],
          ]),
        }
      );
      return;
    }
    
    // Формируем список с кнопками
    const buttons = tenants.map((tenant, index) => [
      Markup.button.callback(
        `${index + 1}. ${tenant.fullName.slice(0, 25)}`,
        `badtenant:view:${tenant.id}`
      ),
    ]);
    
    buttons.push([Markup.button.callback('◀️ Назад', 'badtenant:back')]);
    
    await ctx.editMessageText(
      badTenantListMessage.header(tenants.length),
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('Error listing bad tenants:', error);
    await ctx.reply('❌ Ошибка при загрузке списка');
  }
});

// Просмотр деталей записи
badTenantScene.action(/badtenant:view:(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const tenantId = ctx.match[1];
    const userId = ctx.from?.id.toString();
    
    if (!userId) {
      await ctx.reply('❌ Ошибка: не удалось определить пользователя');
      return;
    }
    
    const result = await getBadTenantById(tenantId, userId);
    
    if (!result.success || !result.data) {
      await ctx.reply('❌ Запись не найдена');
      return;
    }
    
    const tenant = result.data as BadTenantData;
    
    const detailMessage = badTenantListMessage.detail({
      fullName: tenant.fullName,
      reason: BadTenantReasonLabels[tenant.reason],
      description: tenant.description,
      contractDate: tenant.contractDate,
      debtAmount: tenant.debtAmount,
      createdAt: tenant.createdAt || new Date(),
    });
    
    await ctx.editMessageText(
      detailMessage,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('🗑 Удалить', `badtenant:delete:${tenant.id}`),
            Markup.button.callback('◀️ Назад к списку', 'badtenant:list'),
          ],
        ]),
      }
    );
  } catch (error) {
    console.error('Error viewing bad tenant:', error);
    await ctx.reply('❌ Ошибка при просмотре записи');
  }
});

// Меню удаления
badTenantScene.action('badtenant:delete_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply('❌ Ошибка: не удалось определить пользователя');
      return;
    }
    
    const result = await getUserBadTenants(userId);
    
    if (!result.success || !(result.data as BadTenantData[])?.length) {
      await ctx.editMessageText(
        '📋 <b>Удаление записи</b>\n\nВаш чёрный список пуст. Нечего удалять.',
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('◀️ Назад', 'badtenant:back')],
          ]),
        }
      );
      return;
    }
    
    const tenants = result.data as BadTenantData[];
    
    const buttons = tenants.map((tenant) => [
      Markup.button.callback(
        `🗑 ${tenant.fullName.slice(0, 25)}`,
        `badtenant:delete:${tenant.id}`
      ),
    ]);
    
    buttons.push([Markup.button.callback('◀️ Назад', 'badtenant:back')]);
    
    await ctx.editMessageText(
      '🗑 <b>Удаление записи</b>\n\nВыберите запись для удаления:',
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('Error showing delete menu:', error);
    await ctx.reply('❌ Ошибка');
  }
});

// Подтверждение удаления
badTenantScene.action(/badtenant:delete:(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const tenantId = ctx.match[1];
    const userId = ctx.from?.id.toString();
    
    if (!userId) {
      await ctx.reply('❌ Ошибка: не удалось определить пользователя');
      return;
    }
    
    const result = await getBadTenantById(tenantId, userId);
    
    if (!result.success || !result.data) {
      await ctx.reply(badTenantDeleteMessages.notFound);
      return;
    }
    
    const tenant = result.data as BadTenantData;
    
    await ctx.editMessageText(
      badTenantDeleteMessages.confirm(tenant.fullName),
      {
        parse_mode: 'HTML',
        ...deleteConfirmKeyboard(tenant.id!),
      }
    );
  } catch (error) {
    console.error('Error confirming delete:', error);
    await ctx.reply('❌ Ошибка');
  }
});

// Подтверждённое удаление
badTenantScene.action(/badtenant:confirm_delete:(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery('Удаляю...');
    
    const tenantId = ctx.match[1];
    const userId = ctx.from?.id.toString();
    
    if (!userId) {
      await ctx.reply('❌ Ошибка: не удалось определить пользователя');
      return;
    }
    
    const result = await deleteBadTenant(tenantId, userId);
    
    if (result.success) {
      await ctx.editMessageText(
        badTenantDeleteMessages.success,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📋 Мой список', 'badtenant:list')],
            [Markup.button.callback('◀️ Назад в меню', 'badtenant:back')],
          ]),
        }
      );
    } else {
      await ctx.reply(badTenantDeleteMessages.error);
    }
  } catch (error) {
    console.error('Error deleting tenant:', error);
    await ctx.reply(badTenantDeleteMessages.error);
  }
});

// Отмена удаления
badTenantScene.action('badtenant:cancel_delete', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageText(
    '❌ Удаление отменено',
    {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Назад', 'badtenant:back')],
      ]),
    }
  );
});

// Назад
badTenantScene.action('badtenant:back', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    badTenantMenuMessage,
    {
      parse_mode: 'HTML',
      ...badTenantMenuKeyboard,
    }
  );
});

// Главное меню
badTenantScene.action('badtenant:main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('🏠 Возвращаемся в главное меню...');
  return ctx.scene.leave();
});

// ============================================
// WIZARD ДОБАВЛЕНИЯ ЗАПИСИ
// ============================================

// Шаг 1: ФИО
const addStep1 = new Composer<ProblemContext>();

addStep1.on('text', async (ctx) => {
  try {
    const fullName = ctx.message.text.trim();
    
    const validation = validateFullName(fullName);
    if (!validation.success) {
      await ctx.reply(`❌ ${validation.error}`);
      return;
    }
    
    ensureSession(ctx);
    ctx.session.badTenantData = {
      ...ctx.session.badTenantData,
      userId: ctx.from.id.toString(),
      fullName,
    };
    
    await ctx.reply(
      badTenantAddPrompts.passportData,
      { parse_mode: 'HTML', ...skipCancelKeyboard }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep1:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 2: Паспортные данные
const addStep2 = new Composer<ProblemContext>();

addStep2.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    ensureSession(ctx);
    
    if (text !== '-' && text !== '⏭ Пропустить') {
      // Валидация паспортных данных
      const passportRegex = /^\d{4}\s?\d{6}$/;
      if (!passportRegex.test(text)) {
        await ctx.reply(
          '❌ Неверный формат. Введите в формате: 1234 567890\nИли отправьте "-" чтобы пропустить',
          skipCancelKeyboard
        );
        return;
      }
      ctx.session.badTenantData!.passportData = text;
    }
    
    await ctx.reply(
      badTenantAddPrompts.phoneNumber,
      { parse_mode: 'HTML', ...skipCancelKeyboard }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep2:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 3: Телефон
const addStep3 = new Composer<ProblemContext>();

addStep3.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    ensureSession(ctx);
    
    if (text !== '-' && text !== '⏭ Пропустить') {
      // Валидация телефона
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(text.replace(/\s/g, ''))) {
        await ctx.reply(
          '❌ Неверный формат. Введите в формате: +79001234567\nИли отправьте "-" чтобы пропустить',
          skipCancelKeyboard
        );
        return;
      }
      ctx.session.badTenantData!.phoneNumber = text;
    }
    
    await ctx.reply(
      badTenantAddPrompts.reason,
      { parse_mode: 'HTML', ...reasonKeyboard }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep3:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 4: Причина
const addStep4 = new Composer<ProblemContext>();

addStep4.action(/badtenant_reason:(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const reason = ctx.match[1] as BadTenantReason;
    
    ensureSession(ctx);
    ctx.session.badTenantData!.reason = reason;
    
    await ctx.editMessageText(
      badTenantAddPrompts.description,
      { parse_mode: 'HTML' }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep4:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 5: Описание
const addStep5 = new Composer<ProblemContext>();

addStep5.on('text', async (ctx) => {
  try {
    const description = ctx.message.text.trim();
    
    if (description.length < 10) {
      await ctx.reply(
        '❌ Описание слишком короткое. Расскажите подробнее (минимум 10 символов):',
        cancelKeyboard
      );
      return;
    }
    
    ensureSession(ctx);
    ctx.session.badTenantData!.description = description;
    
    await ctx.reply(
      badTenantAddPrompts.contractDate,
      { parse_mode: 'HTML', ...skipCancelKeyboard }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep5:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 6: Дата договора
const addStep6 = new Composer<ProblemContext>();

addStep6.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    ensureSession(ctx);
    
    if (text !== '-' && text !== '⏭ Пропустить') {
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!dateRegex.test(text)) {
        await ctx.reply(
          '❌ Неверный формат. Введите дату в формате ДД.ММ.ГГГГ\nИли отправьте "-" чтобы пропустить',
          skipCancelKeyboard
        );
        return;
      }
      ctx.session.badTenantData!.contractDate = text;
    }
    
    await ctx.reply(
      badTenantAddPrompts.debtAmount,
      { parse_mode: 'HTML', ...skipCancelKeyboard }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in addStep6:', error);
    await ctx.reply('❌ Ошибка. Попробуйте ещё раз.');
  }
});

// Шаг 7: Сумма долга и сохранение
const addStep7 = new Composer<ProblemContext>();

addStep7.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    
    ensureSession(ctx);
    
    if (text !== '-' && text !== '⏭ Пропустить') {
      const validation = validateDebtAmount(text);
      if (!validation.success) {
        await ctx.reply(
          `❌ ${validation.error}\nИли отправьте "-" чтобы пропустить`,
          skipCancelKeyboard
        );
        return;
      }
      ctx.session.badTenantData!.debtAmount = validation.value;
    }
    
    // Сохраняем в базу
    const result = await addToBadTenant(ctx.session.badTenantData as Omit<BadTenantData, 'id' | 'createdAt' | 'updatedAt'>);
    
    if (result.success) {
      const tenant = result.data as BadTenantData;
      await ctx.reply(
        badTenantAddPrompts.success(tenant.fullName),
        {
          parse_mode: 'HTML',
          ...afterAddKeyboard,
        }
      );
    } else {
      await ctx.reply(
        `❌ ${badTenantAddPrompts.error}\n${result.error || ''}`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Попробовать снова', 'badtenant:add')],
            [Markup.button.callback('◀️ Назад', 'badtenant:back')],
          ]),
        }
      );
    }
    
    clearSession(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in addStep7:', error);
    await ctx.reply('❌ Ошибка при сохранении. Попробуйте позже.');
    clearSession(ctx);
    return ctx.scene.leave();
  }
});

// ============================================
// CALLBACK ОБРАБОТЧИКИ WIZARD
// ============================================

// Пропустить шаг
addStep2.action('badtenant:skip', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(badTenantAddPrompts.phoneNumber, { parse_mode: 'HTML', ...skipCancelKeyboard });
  return ctx.wizard.next();
});

addStep3.action('badtenant:skip', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(badTenantAddPrompts.reason, { parse_mode: 'HTML', ...reasonKeyboard });
  return ctx.wizard.next();
});

addStep6.action('badtenant:skip', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(badTenantAddPrompts.debtAmount, { parse_mode: 'HTML', ...skipCancelKeyboard });
  return ctx.wizard.next();
});

addStep7.action('badtenant:skip', async (ctx) => {
  await ctx.answerCbQuery();
  // Сохраняем без суммы долга
  ensureSession(ctx);
  const result = await addToBadTenant(ctx.session.badTenantData as Omit<BadTenantData, 'id' | 'createdAt' | 'updatedAt'>);
  
  if (result.success) {
    const tenant = result.data as BadTenantData;
    await ctx.editMessageText(
      badTenantAddPrompts.success(tenant.fullName),
      {
        parse_mode: 'HTML',
        ...afterAddKeyboard,
      }
    );
  } else {
    await ctx.editMessageText(
      `❌ ${badTenantAddPrompts.error}\n${result.error || ''}`
    );
  }
  
  clearSession(ctx);
  return ctx.scene.leave();
});

// Отмена
const cancelHandler = async (ctx: ProblemContext) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageText('❌ Добавление отменено');
  clearSession(ctx);
  return ctx.scene.leave();
};

addStep1.action('badtenant:cancel', cancelHandler);
addStep2.action('badtenant:cancel', cancelHandler);
addStep3.action('badtenant:cancel', cancelHandler);
addStep4.action('badtenant:cancel', cancelHandler);
addStep5.action('badtenant:cancel', cancelHandler);
addStep6.action('badtenant:cancel', cancelHandler);
addStep7.action('badtenant:cancel', cancelHandler);

// ============================================
// СОЗДАНИЕ WIZARD СЦЕНЫ
// ============================================

export const badTenantWizardScene = new Scenes.WizardScene<ProblemContext>(
  'bad-tenant-wizard',
  addStep1,
  addStep2,
  addStep3,
  addStep4,
  addStep5,
  addStep6,
  addStep7
);

// Вход в wizard
badTenantWizardScene.enter(async (ctx) => {
  clearSession(ctx);
  await ctx.reply(
    badTenantAddPrompts.fullName,
    { parse_mode: 'HTML', ...cancelKeyboard }
  );
});

// Обработка ошибок
badTenantWizardScene.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error in bad tenant wizard:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    clearSession(ctx);
    return ctx.scene.leave();
  }
});

export { badTenantScene };
export default { badTenantScene, badTenantWizardScene };
