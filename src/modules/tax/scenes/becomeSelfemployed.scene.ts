/**
 * Сцена регистрации самозанятости /become_selfemployed
 * Проверка условий и пошаговая инструкция по регистрации
 */

import { Scenes, Markup } from 'telegraf';
import { z } from 'zod';
import type { BotContext } from '@types/index';
import {
  TAX_WELCOME_MESSAGES,
  TAX_PROMPTS,
  TAX_RESULTS,
  TAX_ERROR_MESSAGES,
  TAX_KEYBOARD_LABELS,
  TAX_LINKS,
} from '../templates/messages';

// ============================================================================
// Типы для сессии сцены
// ============================================================================

interface SelfEmployedSessionData {
  incomeEligible?: boolean;
  employeesEligible?: boolean;
  registrationMethod?: 'app' | 'gosuslugi' | 'fns';
}

interface SelfEmployedContext extends BotContext {
  scene: Scenes.SceneContextScene<SelfEmployedContext> & {
    session: SelfEmployedSessionData;
  };
}

// ============================================================================
// Zod схемы валидации
// ============================================================================

const YesNoSchema = z.enum(['yes', 'no']);

// ============================================================================
// Клавиатуры
// ============================================================================

/** Клавиатура Да/Нет */
const yesNoKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(TAX_KEYBOARD_LABELS.YES_NO.YES, 'answer:yes'),
    Markup.button.callback(TAX_KEYBOARD_LABELS.YES_NO.NO, 'answer:no'),
  ],
]);

/** Клавиатура способов регистрации */
const registrationMethodKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REGISTRATION_METHOD.APP,
      'method:app'
    ),
  ],
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REGISTRATION_METHOD.GOSUSLUGI,
      'method:gosuslugi'
    ),
  ],
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REGISTRATION_METHOD.FNS,
      'method:fns'
    ),
  ],
]);

/** Клавиатура завершения */
const finishKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🧾 Как выставлять чеки', 'show_receipts')],
  [
    Markup.button.callback('🔄 Начать заново', 'restart'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

/** Клавиатура после завершения */
const finalKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔄 Новая регистрация', 'restart'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

// ============================================================================
// Сцена регистрации самозанятости
// ============================================================================

export const becomeSelfEmployedScene = new Scenes.WizardScene<SelfEmployedContext>(
  'become_selfemployed',
  
  // ========== ШАГ 1: Приветствие и проверка дохода ==========
  async (ctx) => {
    try {
      // Инициализируем сессию
      ctx.scene.session = {};
      
      await ctx.replyWithMarkdownV2(
        TAX_WELCOME_MESSAGES.SELFEMPLOYED_WELCOME,
        Markup.removeKeyboard()
      );
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      await ctx.replyWithMarkdownV2(
        TAX_PROMPTS.SELFEMPLOYED_CHECK_INCOME,
        yesNoKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 1:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'SE001')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Обработка ответа о доходе и проверка работников ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, выберите вариант кнопками выше*'
        );
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('answer:')) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, используйте кнопки для ответа*'
        );
        return;
      }

      const answer = callbackData.replace('answer:', '');
      const validationResult = YesNoSchema.safeParse(answer);
      
      if (!validationResult.success) {
        await ctx.replyWithMarkdownV2('❌ *Некорректный ответ*');
        return;
      }

      const isIncomeEligible = answer === 'yes';
      ctx.scene.session.incomeEligible = isIncomeEligible;

      await ctx.answerCbQuery(isIncomeEligible ? '✅ Отлично!' : '❌ Проверим дальше');
      
      if (!isIncomeEligible) {
        // Доход слишком высокий - показываем объяснение
        await ctx.editMessageText(
          `❌ *Доход превышает 2.4 млн руб/год*\n\n` +
          `К сожалению, с таким доходом самозанятость недоступна.`,
          { parse_mode: 'MarkdownV2' }
        );
        
        await new Promise(resolve => setTimeout(resolve, 400));
        await ctx.replyWithMarkdownV2(TAX_RESULTS.SELFEMPLOYED_NOT_ELIGIBLE);
        
        return ctx.scene.leave();
      }

      // Доход подходит, проверяем работников
      await ctx.editMessageText(
        `✅ *Доход в пределах нормы*\n\nПродолжаем проверку...`,
        { parse_mode: 'MarkdownV2' }
      );
      
      await new Promise(resolve => setTimeout(resolve, 400));
      await ctx.replyWithMarkdownV2(
        TAX_PROMPTS.SELFEMPLOYED_CHECK_EMPLOYEES,
        yesNoKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 2:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'SE002')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Обработка ответа о работниках и выбор способа регистрации ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, выберите вариант кнопками выше*'
        );
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('answer:')) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, используйте кнопки для ответа*'
        );
        return;
      }

      const answer = callbackData.replace('answer:', '');
      const isEmployeesEligible = answer === 'yes';
      ctx.scene.session.employeesEligible = isEmployeesEligible;

      await ctx.answerCbQuery(isEmployeesEligible ? '✅ Отлично!' : '❌ Проверим');

      if (!isEmployeesEligible) {
        // Есть наемные работники
        await ctx.editMessageText(
          `❌ *Есть наемные работники*\n\n` +
          `Наличие работников (кроме помощников по дому) исключает самозанятость.`,
          { parse_mode: 'MarkdownV2' }
        );
        
        await new Promise(resolve => setTimeout(resolve, 400));
        await ctx.replyWithMarkdownV2(TAX_RESULTS.SELFEMPLOYED_NOT_ELIGIBLE);
        
        return ctx.scene.leave();
      }

      // Все условия выполнены!
      await ctx.editMessageText(
        `✅ *Все условия выполнены!*\n\n` +
        `Вы можете стать самозанятым.`,
        { parse_mode: 'MarkdownV2' }
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await ctx.replyWithMarkdownV2(
        '🎉 *Поздравляем!*\n\n' +
        'Вы подходите для самозанятости:\n' +
        '✅ Доход менее 2.4 млн/год\n' +
        '✅ Нет наемных работников\n\n' +
        'Давайте выберем способ регистрации:',
        registrationMethodKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 3:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'SE003')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 4: Отправка ссылок на выбранный способ ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, выберите способ регистрации*'
        );
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('method:')) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, используйте кнопки для выбора*'
        );
        return;
      }

      const method = callbackData.replace('method:', '') as 'app' | 'gosuslugi' | 'fns';
      ctx.scene.session.registrationMethod = method;

      await ctx.answerCbQuery('Отправляем инструкцию...');

      // Формируем сообщение в зависимости от способа
      let message = '';
      
      switch (method) {
        case 'app':
          message = `📱 *Регистрация через приложение*\n\n` +
            `*Шаги:*\n` +
            `1️⃣ Скачайте приложение "Мой налог":\n` +
            `   • iOS: [App Store](${TAX_LINKS.REGISTRATION.APP.ios})\n` +
            `   • Android: [Google Play](${TAX_LINKS.REGISTRATION.APP.android})\n\n` +
            `2️⃣ Откройте приложение и нажмите "Стать самозанятым"\n` +
            `3️⃣ Подтвердите личность через Госуслуги или в офисе ФНС\n` +
            `4️⃣ Получите уведомление о регистрации\n\n` +
            `⏱ *Время регистрации:* 5-15 минут`;
          break;
          
        case 'gosuslugi':
          message = `🌐 *Регистрация через Госуслуги*\n\n` +
            `*Шаги:*\n` +
            `1️⃣ Перейдите на [портал Госуслуг](${TAX_LINKS.REGISTRATION.GOSUSLUGI.url})\n` +
            `2️⃣ Войдите с подтвержденной учетной записью\n` +
            `3️⃣ Найдите услугу "Регистрация в качестве плательщика НПД"\n` +
            `4️⃣ Заполните заявление и подпишите ЭП\n` +
            `5️⃣ Получите уведомление в личном кабинете\n\n` +
            `⏱ *Время регистрации:* 1-2 дня`;
          break;
          
        case 'fns':
          message = `🏛 *Регистрация через личный кабинет ФНС*\n\n` +
            `*Шаги:*\n` +
            `1️⃣ Перейдите в [ЛК ФНС](${TAX_LINKS.REGISTRATION.FNS.url})\n` +
            `2️⃣ Авторизуйтесь через Госуслуги\n` +
            `3️⃣ Выберите "Регистрация самозанятого"\n` +
            `4️⃣ Заполните и отправьте форму\n` +
            `5️⃣ Получите уведомление на email\n\n` +
            `⏱ *Время регистрации:* 1-3 дня`;
          break;
      }

      await ctx.editMessageText(message, { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true 
      });
      
      await new Promise(resolve => setTimeout(resolve, 600));
      await ctx.replyWithMarkdownV2(
        `✅ *Регистрация выполнена?*\n\n` +
        `После получения уведомления вы можете начинать работу!`,
        finishKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 4:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'SE004')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 5: Инструкция по чекам и завершение ==========
  async (ctx) => {
    try {
      // Этот шаг обрабатывает callback'и от клавиатуры
      // Основная логика в action handlers
      
      // Если пользователь просто дошел до сюда - показываем финальное сообщение
      await ctx.replyWithMarkdownV2(
        TAX_RESULTS.SELFEMPLOYED_SUCCESS,
        finalKeyboard
      );
      
      return ctx.scene.leave();
    } catch (error) {
      console.error('Ошибка на шаге 5:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'SE005')
      );
      return ctx.scene.leave();
    }
  }
);

// ============================================================================
// Обработчики действий
// ============================================================================

// Показать инструкцию по чекам
becomeSelfEmployedScene.action('show_receipts', async (ctx) => {
  try {
    await ctx.answerCbQuery('Показываем инструкцию');
    await ctx.replyWithMarkdownV2(TAX_RESULTS.RECEIPT_INSTRUCTION);
    await ctx.replyWithMarkdownV2(
      TAX_RESULTS.SELFEMPLOYED_SUCCESS,
      finalKeyboard
    );
  } catch (error) {
    console.error('Ошибка показа инструкции:', error);
  }
});

// Перезапуск сцены
becomeSelfEmployedScene.action('restart', async (ctx) => {
  await ctx.answerCbQuery('Начинаем заново');
  await ctx.scene.reenter();
});

// В главное меню
becomeSelfEmployedScene.action('main_menu', async (ctx) => {
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

// Команда отмены
becomeSelfEmployedScene.command('cancel', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '❌ *Регистрация отменена*\n\nДля повтора нажмите /become_selfemployed'
  );
  return ctx.scene.leave();
});

// Обработчик неизвестных сообщений
becomeSelfEmployedScene.on('message', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '⚠️ *Пожалуйста, используйте кнопки для ответа*\n\nДля отмены нажмите /cancel'
  );
});

export default becomeSelfEmployedScene;
