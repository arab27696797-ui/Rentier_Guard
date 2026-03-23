/**
 * =========================================
 * Модуль Договоров - Сцена создания договора
 * RentierGuard Telegram Bot
 * =========================================
 * 
 * WizardScene с 10 шагами для создания договора аренды:
 * 1. Выбор типа (жилье/коммерция)
 * 2. Ввод адреса объекта
 * 3. Ввод ФИО арендатора
 * 4. Ввод паспортных данных
 * 5. Ввод телефона
 * 6. Ввод срока аренды
 * 7. Ввод арендной платы
 * 8. Ввод залога
 * 9. Регистрация в Росреестре
 * 10. Подтверждение и генерация
 */

import { Scenes, Markup } from 'telegraf';
import { ContractWizardContext } from '../types';
import { ContractType, ContractStatus } from '../types';
import {
  contractTypeSchema,
  addressSchema,
  fullNameSchema,
  passportSchema,
  phoneSchema,
  dateInputSchema,
  endDateSchema,
  amountSchema,
  booleanChoiceSchema,
} from '../validators';
import { contractMessages, commonMessages } from '../templates/messages';
import { ContractService } from '../services/contract.service';

// =========================================
// КОНСТАНТЫ
// =========================================

const SCENE_ID = 'create_contract';

// =========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =========================================

/**
 * Парсинг даты из строки ДД.ММ.ГГГГ
 */
const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Парсинг срока аренды (формат: "С ДД.ММ.ГГГГ ПО ДД.ММ.ГГГГ")
 */
const parseRentPeriod = (input: string): { startDate: Date; endDate: Date } | null => {
  const regex = /[Сс]\s*(\d{2}\.\d{2}\.\d{4})\s*[Пп][Оо]\s*(\d{2}\.\d{2}\.\d{4})/;
  const match = input.match(regex);
  
  if (!match) return null;
  
  return {
    startDate: parseDate(match[1]),
    endDate: parseDate(match[2]),
  };
};

/**
 * Очистка данных сессии
 */
const clearSessionData = (ctx: ContractWizardContext): void => {
  delete ctx.session.contractData;
};

// =========================================
// WIZARD SCENE - СОЗДАНИЕ ДОГОВОРА
// =========================================

export const createContractScene = new Scenes.WizardScene<ContractWizardContext>(
  SCENE_ID,
  
  // =========================================
  // ШАГ 0: Приветствие и выбор типа
  // =========================================
  async (ctx) => {
    try {
      // Инициализация данных сессии
      ctx.session.contractData = {};
      
      await ctx.reply(
        contractMessages.welcome,
        { parse_mode: 'HTML' }
      );
      
      await ctx.reply(
        contractMessages.step1_type,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                contractMessages.typeButtons.residential,
                'type_residential'
              ),
            ],
            [
              Markup.button.callback(
                contractMessages.typeButtons.commercial,
                'type_commercial'
              ),
            ],
          ]),
        }
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 0] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 1: Обработка выбора типа
  // =========================================
  async (ctx) => {
    try {
      // Ожидаем callback от inline keyboard
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(contractMessages.step1_type, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(contractMessages.typeButtons.residential, 'type_residential')],
            [Markup.button.callback(contractMessages.typeButtons.commercial, 'type_commercial')],
          ]),
        });
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      const typeValue = callbackData === 'type_residential' 
        ? ContractType.RESIDENTIAL 
        : ContractType.COMMERCIAL;

      // Валидация типа
      const validation = contractTypeSchema.safeParse(typeValue);
      if (!validation.success) {
        await ctx.answerCbQuery(validation.error.errors[0].message);
        return;
      }

      // Сохраняем тип
      ctx.session.contractData!.contractType = typeValue;
      await ctx.answerCbQuery('Тип выбран');
      await ctx.deleteMessage();

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step2_address, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 1] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 2: Ввод адреса
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step2_address, { parse_mode: 'HTML' });
        return;
      }

      const address = ctx.message.text.trim();

      // Валидация адреса
      const validation = addressSchema.safeParse(address);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(contractMessages.step2_address, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем адрес
      ctx.session.contractData!.propertyAddress = address;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step3_tenantName, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 2] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 3: Ввод ФИО арендатора
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step3_tenantName, { parse_mode: 'HTML' });
        return;
      }

      const fullName = ctx.message.text.trim();

      // Валидация ФИО
      const validation = fullNameSchema.safeParse(fullName);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(contractMessages.step3_tenantName, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем ФИО
      ctx.session.contractData!.tenantFullName = fullName;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step4_passport, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 3] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 4: Ввод паспортных данных
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step4_passport, { parse_mode: 'HTML' });
        return;
      }

      const passport = ctx.message.text.trim();

      // Валидация паспорта
      const validation = passportSchema.safeParse(passport);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(contractMessages.step4_passport, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем паспорт
      ctx.session.contractData!.tenantPassport = passport;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step5_phone, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 4] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 5: Ввод телефона
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step5_phone, { parse_mode: 'HTML' });
        return;
      }

      const phone = ctx.message.text.trim();

      // Валидация телефона
      const validation = phoneSchema.safeParse(phone);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(contractMessages.step5_phone, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем телефон
      ctx.session.contractData!.tenantPhone = phone;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step6_dates, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 5] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 6: Ввод срока аренды
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step6_dates, { parse_mode: 'HTML' });
        return;
      }

      const periodInput = ctx.message.text.trim();
      const period = parseRentPeriod(periodInput);

      if (!period) {
        await ctx.reply('❌ Неверный формат. Используйте: С ДД.ММ.ГГГГ ПО ДД.ММ.ГГГГ');
        await ctx.reply(contractMessages.step6_dates, { parse_mode: 'HTML' });
        return;
      }

      // Валидация дат
      const startValidation = dateInputSchema.safeParse(
        periodInput.match(/[Сс]\s*(\d{2}\.\d{2}\.\d{4})/)?.[1]
      );
      
      if (!startValidation.success) {
        await ctx.reply(startValidation.error.errors[0].message);
        await ctx.reply(contractMessages.step6_dates, { parse_mode: 'HTML' });
        return;
      }

      const endDateStr = periodInput.match(/[Пп][Оо]\s*(\d{2}\.\d{2}\.\d{4})/)?.[1] || '';
      const endValidation = endDateSchema(
        periodInput.match(/[Сс]\s*(\d{2}\.\d{2}\.\d{4})/)?.[1] || ''
      ).safeParse(endDateStr);

      if (!endValidation.success) {
        await ctx.reply(endValidation.error.errors[0].message);
        await ctx.reply(contractMessages.step6_dates, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем даты
      ctx.session.contractData!.startDate = period.startDate;
      ctx.session.contractData!.endDate = period.endDate;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step7_rent, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 6] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 7: Ввод арендной платы
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step7_rent, { parse_mode: 'HTML' });
        return;
      }

      const rentInput = ctx.message.text.trim();

      // Валидация суммы
      const validation = amountSchema.safeParse(rentInput);
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        await ctx.reply(contractMessages.step7_rent, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем арендную плату
      ctx.session.contractData!.monthlyRent = validation.data as number;

      // Переход к следующему шагу
      await ctx.reply(contractMessages.step8_deposit, { parse_mode: 'HTML' });
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 7] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 8: Ввод залога
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply(contractMessages.step8_deposit, { parse_mode: 'HTML' });
        return;
      }

      const depositInput = ctx.message.text.trim();

      // Валидация суммы (0 допустимо)
      const amount = parseFloat(depositInput.replace(/\s/g, '').replace(',', '.'));
      
      if (isNaN(amount) || amount < 0) {
        await ctx.reply('❌ Залог должен быть неотрицательным числом');
        await ctx.reply(contractMessages.step8_deposit, { parse_mode: 'HTML' });
        return;
      }

      if (amount > 1000000000) {
        await ctx.reply('❌ Сумма залога слишком большая');
        await ctx.reply(contractMessages.step8_deposit, { parse_mode: 'HTML' });
        return;
      }

      // Сохраняем залог
      ctx.session.contractData!.depositAmount = amount;

      // Переход к следующему шагу
      await ctx.reply(
        contractMessages.step9_rosreestr,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(contractMessages.rosreestrButtons.yes, 'rosreestr_yes')],
            [Markup.button.callback(contractMessages.rosreestrButtons.no, 'rosreestr_no')],
          ]),
        }
      );
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 8] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 9: Регистрация в Росреестре
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(contractMessages.step9_rosreestr, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(contractMessages.rosreestrButtons.yes, 'rosreestr_yes')],
            [Markup.button.callback(contractMessages.rosreestrButtons.no, 'rosreestr_no')],
          ]),
        });
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      const needsRegistration = callbackData === 'rosreestr_yes';

      // Сохраняем выбор
      ctx.session.contractData!.needsRosreestrRegistration = needsRegistration;
      await ctx.answerCbQuery(needsRegistration ? 'Требуется регистрация' : 'Без регистрации');
      await ctx.deleteMessage();

      // Формируем сводку для подтверждения
      const summaryMessage = contractMessages.step10_confirm(ctx.session.contractData!);
      
      await ctx.reply(
        summaryMessage,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(contractMessages.confirmButtons.confirm, 'confirm_create')],
            [Markup.button.callback(contractMessages.confirmButtons.cancel, 'confirm_cancel')],
          ]),
        }
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('[createContractScene Шаг 9] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 10: Подтверждение и создание
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
        await ctx.reply(contractMessages.cancelled);
        clearSessionData(ctx);
        return ctx.scene.leave();
      }

      if (callbackData !== 'confirm_create') {
        return;
      }

      await ctx.answerCbQuery('Создаю договор...');
      await ctx.deleteMessage();

      // Получаем ID пользователя
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply(commonMessages.serverError);
        return ctx.scene.leave();
      }

      // Формируем данные для создания
      const contractData = {
        ...ctx.session.contractData!,
        landlordId: userId,
        status: ContractStatus.ACTIVE,
      } as CreateContractInput;

      // Создаем договор через сервис
      const result = await ContractService.createContract(contractData);

      if (!result.success) {
        await ctx.reply(`${contractMessages.error}\n${result.error}`);
        clearSessionData(ctx);
        return ctx.scene.leave();
      }

      // Успешное создание
      await ctx.reply(
        contractMessages.success(result.data!.id!),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📥 Скачать договор', `download_contract_${result.data!.id}`)],
            [Markup.button.callback('📋 Создать акт', 'create_act')],
          ]),
        }
      );

      clearSessionData(ctx);
      return ctx.scene.leave();
    } catch (error) {
      console.error('[createContractScene Шаг 10] Ошибка:', error);
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
createContractScene.command('cancel', async (ctx) => {
  await ctx.reply(contractMessages.cancelled);
  clearSessionData(ctx);
  return ctx.scene.leave();
});

/**
 * Обработка неизвестных сообщений
 */
createContractScene.on('message', async (ctx) => {
  // Если сообщение не текстовое или не ожидается на текущем шаге
  await ctx.reply(
    `${commonMessages.invalidCommand}\n\nИспользуйте /cancel для отмены создания договора.`
  );
});

// Экспорт сцены
export default createContractScene;
