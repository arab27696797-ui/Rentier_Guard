/**
 * Сцена отчетности /tax_report
 * Показывает сроки и требования для разных налоговых режимов
 */

import { Scenes, Markup } from 'telegraf';
import type { BotContext } from '@types/index';
import {
  TAX_WELCOME_MESSAGES,
  TAX_PROMPTS,
  TAX_REPORT_MESSAGES,
  TAX_ERROR_MESSAGES,
  TAX_KEYBOARD_LABELS,
} from '../templates/messages';
import { TaxRegime } from '../types';

// ============================================================================
// Типы для сессии сцены
// ============================================================================

interface TaxReportSessionData {
  selectedRegime?: TaxRegime;
  reminderSet?: boolean;
}

interface TaxReportContext extends BotContext {
  scene: Scenes.SceneContextScene<TaxReportContext> & {
    session: TaxReportSessionData;
  };
}

// ============================================================================
// Клавиатуры
// ============================================================================

/** Клавиатура выбора типа отчета */
const reportTypeKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REPORT_TYPE.NPD,
      'regime:NPD'
    ),
  ],
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REPORT_TYPE.PATENT,
      'regime:PATENT'
    ),
  ],
  [
    Markup.button.callback(
      TAX_KEYBOARD_LABELS.REPORT_TYPE.NDFL,
      'regime:NDFL'
    ),
  ],
]);

/** Клавиатура напоминаний */
const reminderKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔔 Включить напоминания', 'enable_reminders'),
  ],
  [
    Markup.button.callback('🔄 Другой режим', 'another_regime'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

/** Клавиатура после включения напоминаний */
const afterReminderKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔄 Другой режим', 'another_regime'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

/** Клавиатура завершения */
const finishKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('🔄 Новый запрос', 'restart'),
    Markup.button.callback('🏠 Главное меню', 'main_menu'),
  ],
]);

// ============================================================================
// Сцена отчетности
// ============================================================================

export const taxReportScene = new Scenes.WizardScene<TaxReportContext>(
  'tax_report',
  
  // ========== ШАГ 1: Приветствие и выбор типа отчета ==========
  async (ctx) => {
    try {
      // Инициализируем сессию
      ctx.scene.session = {};
      
      await ctx.replyWithMarkdownV2(
        TAX_WELCOME_MESSAGES.REPORT_WELCOME,
        Markup.removeKeyboard()
      );
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      await ctx.replyWithMarkdownV2(
        TAX_PROMPTS.REPORT_TYPE,
        reportTypeKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 1:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'REP001')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Показ информации о выбранном режиме ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, выберите тип отчета кнопками выше*'
        );
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('regime:')) {
        await ctx.replyWithMarkdownV2(
          '❌ *Пожалуйста, используйте кнопки для выбора*'
        );
        return;
      }

      const regime = callbackData.replace('regime:', '') as TaxRegime;
      ctx.scene.session.selectedRegime = regime;

      // Отправляем информацию о выбранном режиме
      let reportMessage = '';
      
      switch (regime) {
        case TaxRegime.NPD:
          reportMessage = TAX_REPORT_MESSAGES.NPD_REPORT;
          await ctx.answerCbQuery('НПД - нет отчетности!');
          break;
          
        case TaxRegime.PATENT:
          reportMessage = TAX_REPORT_MESSAGES.PATENT_REPORT;
          await ctx.answerCbQuery('Патент - упрощенная отчетность');
          break;
          
        case TaxRegime.NDFL:
          reportMessage = TAX_REPORT_MESSAGES.NDFL_REPORT;
          await ctx.answerCbQuery('НДФЛ - требуется декларация');
          break;
          
        default:
          reportMessage = '❌ *Неизвестный тип отчета*';
      }

      await ctx.editMessageText(reportMessage, { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true 
      });

      // Показываем ближайшие сроки
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const upcomingDeadlines = getUpcomingDeadlines(regime);
      await ctx.replyWithMarkdownV2(upcomingDeadlines);
      
      // Предлагаем включить напоминания
      await new Promise(resolve => setTimeout(resolve, 400));
      await ctx.replyWithMarkdownV2(
        '🔔 *Хотите получать напоминания о сроках?*',
        reminderKeyboard
      );
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('Ошибка на шаге 2:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'REP002')
      );
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Обработка выбора напоминаний ==========
  async (ctx) => {
    try {
      // Этот шаг обрабатывает callback'и от клавиатуры
      // Основная логика в action handlers
      
      // Если пользователь дошел сюда без действия - завершаем
      await ctx.replyWithMarkdownV2(
        '✅ *Готово!*\n\n' +
        'Используйте /tax_report для просмотра других режимов.',
        finishKeyboard
      );
      
      return ctx.scene.leave();
    } catch (error) {
      console.error('Ошибка на шаге 3:', error);
      await ctx.replyWithMarkdownV2(
        TAX_ERROR_MESSAGES.GENERAL_ERROR.replace('{errorCode}', 'REP003')
      );
      return ctx.scene.leave();
    }
  }
);

// ============================================================================
// Вспомогательные функции
// ============================================================================

/**
 * Получить информацию о ближайших сроках
 */
function getUpcomingDeadlines(regime: TaxRegime): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  let message = '📅 *Ближайшие сроки:*\n\n';
  
  switch (regime) {
    case TaxRegime.NPD:
      // НПД: 25-е число каждого месяца
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      message += `📌 *Уплата налога:* 25 ${getMonthName(nextMonth)} ${nextYear}\n`;
      message += `   (ежемесячно до 25 числа)\n\n`;
      message += `💡 *Совет:* Установите приложение "Мой налог" для автоматических уведомлений.`;
      break;
      
    case TaxRegime.PATENT:
      // Патент: зависит от срока действия
      message += `📌 *Патент до 6 месяцев:*\n`;
      message += `   Полная сумма до окончания срока\n\n`;
      message += `📌 *Патент 6-12 месяцев:*\n`;
      message += `   • 1/3 суммы в первые 90 дней\n`;
      message += `   • 2/3 суммы до окончания срока\n\n`;
      message += `⚠️ *Важно:* Патент нужно приобрести ДО начала деятельности!`;
      break;
      
    case TaxRegime.NDFL:
      // НДФЛ: 30 апреля декларация, 15 июля уплата
      const declarationYear = currentYear;
      const paymentYear = currentYear;
      
      // Если уже прошел апрель, показываем следующий год
      const isAfterApril = now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() > 30);
      
      if (isAfterApril) {
        message += `📌 *Декларация 3-НДФЛ:* 30 апреля ${declarationYear + 1}\n`;
        message += `   (за ${declarationYear} год)\n\n`;
        message += `📌 *Уплата налога:* 15 июля ${paymentYear + 1}\n\n`;
      } else {
        message += `📌 *Декларация 3-НДФЛ:* 30 апреля ${declarationYear}\n`;
        message += `   (за ${declarationYear - 1} год)\n\n`;
        message += `📌 *Уплата налога:* 15 июля ${paymentYear}\n\n`;
      }
      
      message += `⚠️ *Штраф за просрочку:* 20% от суммы налога + пени`;
      break;
      
    default:
      message += 'Информация о сроках недоступна.';
  }
  
  return message;
}

/**
 * Получить название месяца
 */
function getMonthName(month: number): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  return months[month - 1] || '';
}

// ============================================================================
// Обработчики действий
// ============================================================================

// Включить напоминания
taxReportScene.action('enable_reminders', async (ctx) => {
  try {
    await ctx.answerCbQuery('Напоминания включены!');
    ctx.scene.session.reminderSet = true;
    
    const regime = ctx.scene.session.selectedRegime;
    const regimeNames: Record<string, string> = {
      [TaxRegime.NPD]: 'НПД (Самозанятый)',
      [TaxRegime.PATENT]: 'Патент',
      [TaxRegime.NDFL]: 'НДФЛ',
    };
    
    await ctx.editMessageText(
      `✅ *Напоминания включены!*\n\n` +
      `Вы будете получать уведомления о сроках для режима "${regimeNames[regime || ''] || 'налоги'}".`,
      { parse_mode: 'MarkdownV2' }
    );
    
    await new Promise(resolve => setTimeout(resolve, 400));
    await ctx.replyWithMarkdownV2(
      '🔔 *Напоминания активированы*\n\n' +
      'Бот будет присылать уведомления:\n' +
      '• За 3 дня до срока уплаты\n' +
      '• В день уплаты\n\n' +
      'Отключить можно в настройках /settings',
      afterReminderKeyboard
    );
  } catch (error) {
    console.error('Ошибка включения напоминаний:', error);
  }
});

// Выбрать другой режим
taxReportScene.action('another_regime', async (ctx) => {
  await ctx.answerCbQuery('Выбираем другой режим');
  ctx.scene.session.selectedRegime = undefined;
  ctx.wizard.selectStep(0);
  await ctx.scene.reenter();
});

// Перезапуск сцены
taxReportScene.action('restart', async (ctx) => {
  await ctx.answerCbQuery('Начинаем заново');
  ctx.scene.session = {};
  ctx.wizard.selectStep(0);
  await ctx.scene.reenter();
});

// В главное меню
taxReportScene.action('main_menu', async (ctx) => {
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
taxReportScene.command('cancel', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '❌ *Просмотр отчетности отменен*\n\nДля повтора нажмите /tax_report'
  );
  return ctx.scene.leave();
});

// Обработчик неизвестных сообщений
taxReportScene.on('message', async (ctx) => {
  await ctx.replyWithMarkdownV2(
    '⚠️ *Пожалуйста, используйте кнопки для навигации*\n\nДля отмены нажмите /cancel'
  );
});

export default taxReportScene;
