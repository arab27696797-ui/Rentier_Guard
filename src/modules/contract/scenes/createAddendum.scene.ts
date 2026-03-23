/**
 * =========================================
 * Модуль Договоров - Сцена создания допсоглашения
 * RentierGuard Telegram Bot
 * =========================================
 * 
 * WizardScene для создания дополнительного соглашения:
 * 1. Выбор договора из списка
 * 2. Выбор типа изменения (цена/срок/другое)
 * 3. Ввод новых данных
 * 4. Ввод даты вступления в силу
 * 5. Подтверждение и генерация
 */

import { Scenes, Markup } from 'telegraf';
import { ContractWizardContext } from '../types';
import { AddendumType } from '../types';
import { amountSchema, dateInputSchema } from '../validators';
import { addendumMessages, commonMessages } from '../templates/messages';
import { ContractService } from '../services/contract.service';

// =========================================
// КОНСТАНТЫ
// =========================================

const SCENE_ID = 'create_addendum';

// =========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =========================================

/**
 * Очистка данных сессии
 */
const clearSessionData = (ctx: ContractWizardContext): void => {
  delete ctx.session.addendumData;
  delete ctx.session.userContracts;
};

/**
 * Парсинг даты из строки ДД.ММ.ГГГГ
 */
const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Получение названия типа допсоглашения
 */
const getAddendumTypeLabel = (type: AddendumType): string => {
  const labels: Record<AddendumType, string> = {
    [AddendumType.PRICE_CHANGE]: 'Изменение арендной платы',
    [AddendumType.TERM_CHANGE]: 'Изменение срока',
    [AddendumType.OTHER]: 'Другое изменение',
  };
  return labels[type] || type;
};

// =========================================
// WIZARD SCENE - СОЗДАНИЕ ДОПСОГЛАШЕНИЯ
// =========================================

export const createAddendumScene = new Scenes.WizardScene<ContractWizardContext>(
  SCENE_ID,
  
  // =========================================
  // ШАГ 0: Приветствие и загрузка договоров
  // =========================================
  async (ctx) => {
    try {
      // Очистка предыдущих данных
      clearSessionData(ctx);
      
      // Инициализация данных допсоглашения
      ctx.session.addendumData = {};
      
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply(commonMessages.serverError);
        return ctx.scene.leave();
      }

      // Загружаем договоры пользователя
      const contractsResult = await ContractService.getUserContracts(userId);

      if (!contractsResult.success || !contractsResult.data?.length) {
        await ctx.reply(addendumMessages.noContracts, { parse_mode: 'HTML' });
        return ctx.scene.leave();
      }

      // Фильтруем только активные договоры
      const activeContracts = contractsResult.data.filter(
        c => c.status === 'ACTIVE' || c.status === 'DRAFT'
      );

      if (activeContracts.length === 0) {
        await ctx.reply(addendumMessages.noContracts, { parse_mode: 'HTML' });
        return ctx.scene.leave();
      }

      // Сохраняем список договоров в сессии
      ctx.session.userContracts = activeContracts.map(c => ({
        id: c.id,
        address: c.address,
      }));

      // Формируем кнопки с договорами
      const contractButtons = activeContracts.map((contract, index) => [
        Markup.button.callback(
          `${index + 1}. ${contract.address.substring(0, 40)}${contract.address.length > 40 ? '...' : ''}`,
          `contract_${contract.id}`
        ),
      ]);

      await ctx.reply(
        addendumMessages.welcome,
        { parse_mode: 'HTML' }
      );

      await ctx.reply(
        addendumMessages.step1_selectContract,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(contractButtons),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createAddendumScene Шаг 0] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 1: Выбор договора
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('contract_')) {
        await ctx.answerCbQuery('Выберите договор из списка');
        return;
      }

      const contractId = callbackData.replace('contract_', '');
      
      // Проверяем, что договор есть в списке
      const contract = ctx.session.userContracts?.find(c => c.id === contractId);
      if (!contract) {
        await ctx.answerCbQuery('Договор не найден');
        return;
      }

      // Сохраняем ID договора
      ctx.session.addendumData!.contractId = contractId;
      await ctx.answerCbQuery('Договор выбран');
      await ctx.deleteMessage();

      // Переход к выбору типа изменения
      await ctx.reply(
        addendumMessages.step2_type,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(addendumMessages.typeButtons.price_change, 'type_price_change')],
            [Markup.button.callback(addendumMessages.typeButtons.term_change, 'type_term_change')],
            [Markup.button.callback(addendumMessages.typeButtons.other, 'type_other')],
          ]),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createAddendumScene Шаг 1] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 2: Выбор типа изменения
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('type_')) {
        await ctx.answerCbQuery('Выберите тип изменения');
        return;
      }

      // Определяем тип допсоглашения
      let addendumType: AddendumType;
      
      switch (callbackData) {
        case 'type_price_change':
          addendumType = AddendumType.PRICE_CHANGE;
          break;
        case 'type_term_change':
          addendumType = AddendumType.TERM_CHANGE;
          break;
        default:
          addendumType = AddendumType.OTHER;
      }

      // Сохраняем тип
      ctx.session.addendumData!.addendumType = addendumType;
      
      await ctx.answerCbQuery(getAddendumTypeLabel(addendumType));
      await ctx.deleteMessage();

      // Переход к вводу новых данных
      await ctx.reply(
        addendumMessages.step3_newValue(addendumType),
        { parse_mode: 'HTML' }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createAddendumScene Шаг 2] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 3: Ввод новых данных
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        const type = ctx.session.addendumData!.addendumType!;
        await ctx.reply(addendumMessages.step3_newValue(type), { parse_mode: 'HTML' });
        return;
      }

      const input = ctx.message.text.trim();
      const addendumType = ctx.session.addendumData!.addendumType!;

      // Валидация в зависимости от типа
      if (addendumType === AddendumType.PRICE_CHANGE) {
        const validation = amountSchema.safeParse(input);
        if (!validation.success) {
          await ctx.reply(validation.error.errors[0].message);
          await ctx.reply(addendumMessages.step3_newValue(addendumType), { parse_mode: 'HTML' });
          return;
        }
        ctx.session.addendumData!.newValue = `${validation.data} руб./мес`;
      } else if (addendumType === AddendumType.TERM_CHANGE) {
        const validation = dateInputSchema.safeParse(input);
        if (!validation.success) {
          await ctx.reply(validation.error.errors[0].message);
          await ctx.reply(addendumMessages.step3_newValue(addendumType), { parse_mode: 'HTML' });
          return;
        }
        ctx.session.addendumData!.newValue = input;
      } else {
        // OTHER - просто текст
        if (input.length < 5) {
          await ctx.reply('❌ Описание слишком короткое. Минимум 5 символов.');
          await ctx.reply(addendumMessages.step3_newValue(addendumType), { parse_mode: 'HTML' });
          return;
        }
        if (input.length > 500) {
          await ctx.reply('❌ Описание слишком длинное. Максимум 500 символов.');
          await ctx.reply(addendumMessages.step3_newValue(addendumType), { parse_mode: 'HTML' });
          return;
        }
        ctx.session.addendumData!.newValue = input;
      }

      // Переход к вводу даты вступления в силу
      await ctx.reply(addendumMessages.step4_effectiveDate, { parse_mode: 'HTML' });

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createAddendumScene Шаг 3] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 4: Ввод даты вступления в силу
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(addendumMessages.step4_effectiveDate, { parse_mode: 'HTML' });
        return;
      }

      const dateInput = ctx.message.text.trim();

      // Валидация даты
      const validation = dateInputSchema.safeParse(dateInput);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(addendumMessages.step4_effectiveDate, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем дату
      ctx.session.addendumData!.effectiveDate = parseDate(dateInput);

      // Показываем подтверждение
      const confirmMessage = addendumMessages.confirm({
        type: ctx.session.addendumData!.addendumType!,
        newValue: ctx.session.addendumData!.newValue!,
        effectiveDate: ctx.session.addendumData!.effectiveDate!,
      });

      await ctx.reply(
        confirmMessage,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(addendumMessages.confirmButtons.confirm, 'confirm_create')],
            [Markup.button.callback(addendumMessages.confirmButtons.cancel, 'confirm_cancel')],
          ]),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createAddendumScene Шаг 4] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 5: Подтверждение и создание
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;

      if (callbackData === 'confirm_cancel') {
        await ctx.answerCbQuery('Отменено');
        await ctx.deleteMessage();
        await ctx.reply(addendumMessages.cancelled);
        clearSessionData(ctx);
        return ctx.scene.leave();
      }

      if (callbackData !== 'confirm_create') {
        return;
      }

      await ctx.answerCbQuery('Создаю допсоглашение...');
      await ctx.deleteMessage();

      // Получаем ID пользователя
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply(commonMessages.serverError);
        return ctx.scene.leave();
      }

      // Формируем данные для создания
      const addendumData = {
        contractId: ctx.session.addendumData!.contractId!,
        userId,
        addendumType: ctx.session.addendumData!.addendumType!,
        newValue: ctx.session.addendumData!.newValue!,
        effectiveDate: ctx.session.addendumData!.effectiveDate!,
      };

      // Создаем допсоглашение через сервис
      const result = await ContractService.createAddendum(addendumData);

      if (!result.success) {
        await ctx.reply(`${addendumMessages.error}\n${result.error}`);
        clearSessionData(ctx);
        return ctx.scene.leave();
      }

      // Успешное создание
      await ctx.reply(
        addendumMessages.success(result.data!.id!),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📥 Скачать допсоглашение', `download_addendum_${result.data!.id}`)],
          ]),
        }
      );

      clearSessionData(ctx);
      return ctx.scene.leave();
    } catch (error) {
      console.error('[createAddendumScene Шаг 5] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      clearSessionData(ctx);
      return ctx.scene.leave();
    }
  }
);

// =========================================
// MIDDLEWARE ДЛЯ СЦЕНЫ
// =========================================

/**
 * Обработка команды отмены
 */
createAddendumScene.command('cancel', async (ctx) => {
  await ctx.reply(addendumMessages.cancelled);
  clearSessionData(ctx);
  return ctx.scene.leave();
});

/**
 * Обработка неизвестных сообщений
 */
createAddendumScene.on('message', async (ctx) => {
  await ctx.reply(
    `${commonMessages.invalidCommand}\n\nИспользуйте /cancel для отмены.`
  );
});

// Экспорт сцены
export default createAddendumScene;
