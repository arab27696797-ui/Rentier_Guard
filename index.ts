/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Регистрация команд
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Модуль для регистрации всех команд бота.
 * Каждая команда обрабатывается через соответствующую сцену или напрямую.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Telegraf, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Pool } from 'pg';

// Импорт сервисов
import { UserService } from '../services/userService';
import { PropertyService } from '../services/propertyService';
import { PaymentService } from '../services/paymentService';
import { ContractService } from '../services/contractService';

// Импорт контента
import { 
  getMainMenuKeyboard, 
  getTaxMenuKeyboard,
  getContractsMenuKeyboard,
  getPropertiesMenuKeyboard,
  getPaymentsMenuKeyboard,
  getToolsMenuKeyboard,
  getSupportMenuKeyboard,
} from '../content/messages';
import { COMMANDS, getCommandHelp } from '../content/commands';

// ═══════════════════════════════════════════════════════════════════════════════
// Регистрация всех команд
// ═══════════════════════════════════════════════════════════════════════════════

export function registerCommands(bot: Telegraf<Scenes.WizardContext>): void {
  
  // ═════════════════════════════════════════════════════════════════════════════
  // Финансовые команды
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /tax_calc - Калькулятор налогов
   * Запускает сцену расчета налогов для самозанятых
   */
  bot.command('tax_calc', async (ctx) => {
    try {
      await ctx.scene.enter('tax-calculator');
    } catch (error) {
      console.error('❌ Ошибка в команде /tax_calc:', error);
      await ctx.reply('❌ Не удалось запустить калькулятор налогов');
    }
  });

  /**
   * /become_selfemployed - Стать самозанятым
   * Информация и помощь в регистрации как самозанятый
   */
  bot.command('become_selfemployed', async (ctx) => {
    try {
      await ctx.scene.enter('selfemployed-registration');
    } catch (error) {
      console.error('❌ Ошибка в команде /become_selfemployed:', error);
      await ctx.reply('❌ Не удалось загрузить информацию о самозанятости');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Команды договоров
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /create_contract - Создать договор аренды
   * Запускает wizard-сцену создания договора
   */
  bot.command('create_contract', async (ctx) => {
    try {
      await ctx.scene.enter('contract-create');
    } catch (error) {
      console.error('❌ Ошибка в команде /create_contract:', error);
      await ctx.reply('❌ Не удалось запустить создание договора');
    }
  });

  /**
   * /create_act - Создать акт приема-передачи
   * Запускает wizard-сцену создания акта
   */
  bot.command('create_act', async (ctx) => {
    try {
      await ctx.scene.enter('act-create');
    } catch (error) {
      console.error('❌ Ошибка в команде /create_act:', error);
      await ctx.reply('❌ Не удалось запустить создание акта');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Команды объектов недвижимости
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /add_property - Добавить объект недвижимости
   * Запускает wizard-сцену добавления объекта
   */
  bot.command('add_property', async (ctx) => {
    try {
      await ctx.scene.enter('property-add');
    } catch (error) {
      console.error('❌ Ошибка в команде /add_property:', error);
      await ctx.reply('❌ Не удалось запустить добавление объекта');
    }
  });

  /**
   * /my_properties - Мои объекты
   * Показывает список всех объектов пользователя
   */
  bot.command('my_properties', async (ctx) => {
    try {
      await ctx.scene.enter('property-list');
    } catch (error) {
      console.error('❌ Ошибка в команде /my_properties:', error);
      await ctx.reply('❌ Не удалось загрузить список объектов');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Команды платежей
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /payment_schedule - График платежей
   * Показывает график предстоящих платежей
   */
  bot.command('payment_schedule', async (ctx) => {
    try {
      await ctx.scene.enter('payment-schedule');
    } catch (error) {
      console.error('❌ Ошибка в команде /payment_schedule:', error);
      await ctx.reply('❌ Не удалось загрузить график платежей');
    }
  });

  /**
   * /add_payment - Добавить платеж
   * Запускает wizard-сцену добавления платежа
   */
  bot.command('add_payment', async (ctx) => {
    try {
      await ctx.scene.enter('payment-add');
    } catch (error) {
      console.error('❌ Ошибка в команде /add_payment:', error);
      await ctx.reply('❌ Не удалось запустить добавление платежа');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Сервисные команды
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /rosreestr_checklist - Чек-лист Росреестра
   * Проверка документов для регистрации
   */
  bot.command('rosreestr_checklist', async (ctx) => {
    try {
      await ctx.scene.enter('rosreestr-checklist');
    } catch (error) {
      console.error('❌ Ошибка в команде /rosreestr_checklist:', error);
      await ctx.reply('❌ Не удалось загрузить чек-лист');
    }
  });

  /**
   * /find_mfc - Найти МФЦ
   * Поиск ближайших МФЦ
   */
  bot.command('find_mfc', async (ctx) => {
    try {
      await ctx.scene.enter('mfc-finder');
    } catch (error) {
      console.error('❌ Ошибка в команде /find_mfc:', error);
      await ctx.reply('❌ Не удалось запустить поиск МФЦ');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Команды поддержки
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /problem - Решение проблем
   * Помощь в решении типовых проблем арендодателей
   */
  bot.command('problem', async (ctx) => {
    try {
      await ctx.scene.enter('problem-solver');
    } catch (error) {
      console.error('❌ Ошибка в команде /problem:', error);
      await ctx.reply('❌ Не удалось загрузить решение проблем');
    }
  });

  /**
   * /bad_tenant - Черный список арендаторов
   * Проверка и добавление в черный список
   */
  bot.command('bad_tenant', async (ctx) => {
    try {
      await ctx.scene.enter('blacklist-menu');
    } catch (error) {
      console.error('❌ Ошибка в команде /bad_tenant:', error);
      await ctx.reply('❌ Не удалось загрузить черный список');
    }
  });

  /**
   * /expert - Консультация эксперта
   * Связь с юристом или консультантом
   */
  bot.command('expert', async (ctx) => {
    try {
      await ctx.scene.enter('expert-consultation');
    } catch (error) {
      console.error('❌ Ошибка в команде /expert:', error);
      await ctx.reply('❌ Не удалось запустить консультацию');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Отчеты и экспорт
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /export_year - Экспорт данных за год
   * Формирование отчета за год
   */
  bot.command('export_year', async (ctx) => {
    try {
      await ctx.scene.enter('year-export');
    } catch (error) {
      console.error('❌ Ошибка в команде /export_year:', error);
      await ctx.reply('❌ Не удалось запустить экспорт');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Информационные команды
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /help - Помощь
   * Показывает список всех команд с описанием
   */
  bot.command('help', async (ctx) => {
    try {
      const helpMessage = getCommandHelp();
      
      await ctx.reply(helpMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Главное меню', callback_data: 'menu_main' }],
            [{ text: '💬 Связаться с поддержкой', callback_data: 'support_contact' }],
          ],
        },
      });
    } catch (error) {
      console.error('❌ Ошибка в команде /help:', error);
      await ctx.reply('❌ Не удалось загрузить справку');
    }
  });

  /**
   * /about - О боте
   * Информация о боте и разработчиках
   */
  bot.command('about', async (ctx) => {
    try {
      const aboutMessage = `
🏠 <b>RentierGuard</b> — ваш персональный помощник арендодателя

<b>Версия:</b> 1.0.0
<b>Разработчик:</b> RentierGuard Team

<b>Возможности бота:</b>
✅ Создание договоров аренды и актов
✅ Учет объектов недвижимости
✅ Контроль платежей и напоминания
✅ Калькулятор налогов для самозанятых
✅ Черный список арендаторов
✅ Юридическая поддержка
✅ Экспорт отчетов

<b>Поддержка:</b> @rentierguard_support
<b>Сайт:</b> https://rentierguard.ru

© 2024 RentierGuard. Все права защищены.
      `;
      
      await ctx.reply(aboutMessage, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Главное меню', callback_data: 'menu_main' }],
            [{ text: '⭐ Оставить отзыв', callback_data: 'leave_review' }],
          ],
        },
      });
    } catch (error) {
      console.error('❌ Ошибка в команде /about:', error);
      await ctx.reply('❌ Не удалось загрузить информацию');
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // Скрытые/служебные команды
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * /cancel - Отмена текущей операции
   * Выходит из текущей сцены
   */
  bot.command('cancel', async (ctx) => {
    try {
      await ctx.scene.leave();
      await ctx.reply(
        '❌ Операция отменена.',
        {
          reply_markup: getMainMenuKeyboard('user'),
        }
      );
    } catch (error) {
      console.error('❌ Ошибка в команде /cancel:', error);
      await ctx.reply('❌ Не удалось отменить операцию');
    }
  });

  /**
   * /status - Статус бота (для администраторов)
   */
  bot.command('status', async (ctx) => {
    try {
      // Проверка прав администратора
      const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
      
      if (!ctx.from || !adminIds.includes(ctx.from.id)) {
        await ctx.reply('⛔ У вас нет доступа к этой команде');
        return;
      }

      const statusMessage = `
📊 <b>Статус системы RentierGuard</b>

🟢 <b>Бот:</b> Работает
🟢 <b>Сессии:</b> Активны
🟢 <b>Планировщики:</b> Запущены

<b>Версия:</b> 1.0.0
<b>Режим:</b> ${process.env.NODE_ENV || 'development'}
<b>Время запуска:</b> ${new Date().toLocaleString('ru-RU')}
      `;
      
      await ctx.reply(statusMessage, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('❌ Ошибка в команде /status:', error);
      await ctx.reply('❌ Не удалось получить статус');
    }
  });

  console.log('✅ Все команды зарегистрированы');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт для использования в других модулях
// ═══════════════════════════════════════════════════════════════════════════════

export default registerCommands;
