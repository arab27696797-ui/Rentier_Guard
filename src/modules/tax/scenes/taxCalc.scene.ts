/**
 * Сцена расчета налогов /tax_calc
 * Интерактивный калькулятор для сравнения налоговых режимов
 */

import { Scenes, Markup } from 'telegraf';
import { z } from 'zod';
import type { BotContext } from '../../../types/index';
import {
  TAX_WELCOME_MESSAGES,
  TAX_PROMPTS,
  TAX_RESULTS,
  TAX_ERROR_MESSAGES,
  TAX_KEYBOARD_LABELS,
  calculateTaxes,
} from '../templates/messages';

// ============================================================================
// Типы для сессии сцены
// ============================================================================

interface TaxCalcSessionData {
  income?: number;
  propertyCount?: number;
  status?: 'individual' | 'self_employed' | 'ip';
  city?: string;
}

// Расширяем тип сессии
interface TaxCalcContext extends BotContext {
  scene: Scenes.SceneContextScene<TaxCalcContext> & {
    session: TaxCalcSessionData;
  };
}

// ============================================================================
// Zod схемы валидации
// ============================================================================

const IncomeSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, '').replace(/,/g, '.'))
  .refine((val) => !isNaN(Number(val)), {
    message: 'Введите корректное число',
  })
  .transform((val) => Number(val))
  .refine((val) => val > 0, {
    message: 'Доход должен быть больше 0',
  })
  .refine((val) => val <= 1_000_000_000, {
    message: 'Сумма слишком большая',
  });

const PropertyCountSchema = z
  .string()
  .transform((val) => Number(val.trim()))
  .refine((val) => !isNaN(val) && Number.isInteger(val), {
    message: 'Введите целое число',
  })
  .refine((val) => val >= 1 && val <= 100, {
    message: 'Количество объектов от 1 до 100',
  });

// ============================================================================
// Клавиатуры
// ============================================================================

/** Клавиатура выбора статуса */
const statusKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.STATUS.INDIVIDUAL,
      'status:individual'
    ),
  ],
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.STATUS.SELF_EMPLOYED,
      'status:self_employed'
    ),
  ],
  [Markup.button.callback(TAX_KEYBOARD_LABELS.STATUS.IP, 'status:ip')],
]);

/** Клавиатура выбора города */
const cityKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.MOSCOW, 'city:Москва'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.SPB, 'city:Санкт-Петербург'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.NOVOSIBIRSK, 'city:Новосибирск'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.YEKATERINBURG, 'city:Екатеринбург'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.KAZAN, 'city:Казань'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.NIZHNY_NOVGOROD, 'city:Нижний Новгород'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.CHELYABINSK, 'city:Челябинск'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.SAMARA, 'city:Самара'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.OMSK, 'city:Омск'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.ROSTOV, 'city:Ростов-на-Дону'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.UFA, 'city:Уфа'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.KRASNODAR, 'city:Краснодар'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.VORONEZH, 'city:Воронеж'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.PERM, 'city:Пермь'),
  ],
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.CITIES.VOLGOGRAD, 'city:Волгоград'),
    Markup.button.callback('📍 Другой город', 'city:other'),
  ],
]);

/** Клавиатура завершения */
const finishKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔄 Новый расчет', 'restart'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

// ============================================================================
// Сцена расчета налогов
// ============================================================================

export const taxCalcScene = new Scenes.WizardScene<TaxCalcContext>(
  'tax_calc',
  
  // ========== ШАГ 1: Приветствие и запрос дохода ==========
  async (ctx) => {
    try {
      // Инициализируем сессию
      ctx.scene.session = {};
      
      await ctx.replyWithMarkdownV2(
        TAX_WELCOME_MESSAGES.CALCULATOR_WELCOME,
        Markup.removeKeyboard()
      );
      
      // Небольшая задержка для лучшего UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await ctx.replyWithMarkdownV2(TAX_PROMPTS.ANNUAL_INCOME);
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 1:', error);
      await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'TAX001'));
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Валидация дохода и запрос количества объектов ==========
  async (ctx) => {
    try {
      // Проверяем, что сообщение содержит текст
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.INVALID_INCOME);
        return;
      }

      const input = ctx.message.text;
      
      // Валидация через Zod
      const validationResult = IncomeSchema.safeParse(input);
      
      if (!validationResult.success) {
        await ctx.replyWithMarkdownV2(
          `${TAX_ERROR_MESSAGES.INVALID_INCOME}\n\n_Ошибка: ${validationResult.error.errors[0].message}_`
        );
        return; // Остаемся на текущем шаге
      }

      const income = validationResult.data;
      ctx.scene.session.income = income;

      await ctx.replyWithMarkdownV2(
        `✅ *Доход записан:* ${income.toLocaleString('ru-RU')} ₽`
      );
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await ctx.replyWithMarkdownV2(TAX_PROMPTS.PROPERTY_COUNT);
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 2:', error);
      await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'TAX002'));
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Валидация объектов и выбор статуса ==========
  async (ctx) => {
    try {
      if (!ctx.message || !('text' in ctx.message)) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.INVALID_PROPERTY_COUNT);
        return;
      }

      const input = ctx.message.text;
      
      // Валидация через Zod
      const validationResult = PropertyCountSchema.safeParse(input);
      
      if (!validationResult.success) {
        await ctx.replyWithMarkdownV2(
          `${TAX_ERROR_MESSAGES.INVALID_PROPERTY_COUNT}\n\n_Ошибка: ${validationResult.error.errors[0].message}_`
        );
        return;
      }

      const propertyCount = validationResult.data;
      ctx.scene.session.propertyCount = propertyCount;

      await ctx.replyWithMarkdownV2(
        `✅ *Объектов:* ${propertyCount}`,
        { reply_markup: { remove_keyboard: true } }
      );
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await ctx.replyWithMarkdownV2(TAX_PROMPTS.TAX_STATUS, statusKeyboard);
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 3:', error);
      await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'TAX003'));
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 4: Обработка выбора статуса и выбор города ==========
  async (ctx) => {
    try {
      // Проверяем callback query
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.STATUS_NOT_SELECTED);
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      // Проверяем формат callback
      if (!callbackData.startsWith('status:')) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.STATUS_NOT_SELECTED);
        return;
      }

      const status = callbackData.replace('status:', '') as 'individual' | 'self_employed' | 'ip';
      ctx.scene.session.status = status;

      // Подтверждаем выбор
      const statusLabels: Record<string, string> = {
        individual: 'Физическое лицо',
        self_employed: 'Самозанятый',
        ip: 'Индивидуальный предприниматель',
      };

      await ctx.answerCbQuery(`Выбрано: ${statusLabels[status]}`);
      await ctx.editMessageText(
        `✅ *Статус:* ${statusLabels[status]}`,
        { parse_mode: 'MarkdownV2' }
      );

      await new Promise(resolve => setTimeout(resolve, 300));
      await ctx.replyWithMarkdownV2(TAX_PROMPTS.REGION_SELECT, cityKeyboard);
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 4:', error);
      await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'TAX004'));
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 5: Обработка выбора города и вывод результата ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.REGION_NOT_SELECTED);
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('city:')) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.REGION_NOT_SELECTED);
        return;
      }

      let city = callbackData.replace('city:', '');
      
      // Обработка "Другой город"
      if (city === 'other') {
        city = 'Москва'; // По умолчанию для упрощения MVP
        await ctx.answerCbQuery('Используем Москву как базовый вариант');
      } else {
        await ctx.answerCbQuery(`Выбран: ${city}`);
      }

      ctx.scene.session.city = city;

      await ctx.editMessageText(
        `✅ *Город:* ${city}`,
        { parse_mode: 'MarkdownV2' }
      );

      // Получаем данные из сессии
      const { income, propertyCount } = ctx.scene.session;
      
      if (!income || !propertyCount) {
        await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.SESSION_ERROR);
        return ctx.scene.leave();
      }

      // Рассчитываем налоги
      const taxes = calculateTaxes(income, city);

      // Формируем результат
      const resultMessage = TAX_RESULTS.formatComparisonTable({
        income,
        propertyCount,
        ndflTax: taxes.ndfl,
        selfEmployedTax: taxes.selfEmployed,
        patentTax: taxes.patent,
        city,
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      await ctx.replyWithMarkdownV2(resultMessage, finishKeyboard);

      return ctx.scene.leave();
    } catch (error) {
      console.error('Ошибка на шаге 5:', error);
      await ctx.replyWithMarkdownV2(TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'TAX005'));
      return ctx.scene.leave();
    }
  }
);

// ============================================================================
// Обработчики действий
// ============================================================================

// Обработчик перезапуска расчета
taxCalcScene.action('restart', async (ctx) => {
  await ctx.answerCbQuery('Начинаем новый расчет');
  await ctx.scene.reenter();
});

// Обработчик возврата в главное меню
taxCalcScene.action('main_menu', async (ctx) => {
  await ctx.answerCbQuery('Возвращаемся в главное меню');
  await ctx.scene.leave();
  await ctx.replyWithMarkdownV2(
    '🏠 *Главное меню*\n\nВыберите действие:',
    Markup.keyboard([
      ['📊 Рассчитать налоги', '💼 Стать самозанятым'],
      ['📋 Отчетность', '⚙️ Настройки'],
    ]).resize()
  );
});

// Обработчик отмены
taxCalcScene.command('cancel', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '❌ *Расчет отменен*\n\nДля нового расчета нажмите /tax_calc'
  );
  return ctx.scene.leave();
});

// Обработчик неизвестных сообщений
taxCalcScene.on('message', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '⚠️ *Пожалуйста, следуйте инструкциям*\n\nДля отмены нажмите /cancel'
  );
});

export default taxCalcScene;
