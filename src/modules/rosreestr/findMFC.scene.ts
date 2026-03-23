/**
 * Сцена поиска ближайшего МФЦ
 * RentierGuard Bot
 * 
 * WizardScene с 2 шагами:
 * 1. Запрос города или геолокации
 * 2. Генерация ссылки на Яндекс.Карты
 */

import { Composer, Markup, Scenes } from 'telegraf';
import { RosreestrContext } from '../types';
import {
  MFC_SEARCH_WELCOME_MESSAGE,
  formatMFCLink,
  ERROR_MESSAGE,
  CANCEL_MESSAGE,
} from '../templates/messages';

// Имя сцены
export const FIND_MFC_SCENE = 'find_mfc';

/**
 * Клавиатура для запроса геолокации
 */
const locationKeyboard = Markup.keyboard([
  [Markup.button.locationRequest('📍 Отправить геолокацию')],
  ['❌ Отмена'],
])
  .oneTime()
  .resize();

/**
 * Клавиатура для отмены
 */
const cancelKeyboard = Markup.keyboard([['❌ Отмена']])
  .oneTime()
  .resize();

/**
 * Шаг 1: Запрос города или геолокации
 */
const step1 = async (ctx: RosreestrContext) => {
  try {
    await ctx.reply(MFC_SEARCH_WELCOME_MESSAGE, {
      parse_mode: 'HTML',
      ...locationKeyboard,
    });
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in step1 (findMFC):', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
};

/**
 * Шаг 2: Обработка ввода города или геолокации
 */
const step2 = new Composer<RosreestrContext>();

// Обработка геолокации
step2.on('location', async (ctx) => {
  try {
    const location = ctx.message.location;

    if (!location) {
      await ctx.reply(
        '❌ Не удалось получить геолокацию. Попробуйте ввести город вручную.',
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return;
    }

    // Сохраняем координаты
    ctx.session.mfcSearch = {
      coordinates: {
        lat: location.latitude,
        lng: location.longitude,
      },
    };

    // Генерируем ссылку
    const linkMessage = formatMFCLink('вашего местоположения', {
      lat: location.latitude,
      lng: location.longitude,
    });

    await ctx.reply(linkMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      ...Markup.inlineKeyboard([
        [Markup.button.url('🗺 Открыть Яндекс.Карты', `https://yandex.ru/maps/?ll=${location.longitude}%2C${location.latitude}&z=14&text=${encodeURIComponent('МФЦ мои документы')}`)],
        [Markup.button.callback('🔍 Искать в другом городе', 'search_another_city')],
        [Markup.button.callback('🔙 В меню', 'back_to_menu')],
      ]),
    });

    // Убираем клавиатуру
    await ctx.reply('✅ Готово!', Markup.removeKeyboard());

    return ctx.scene.leave();
  } catch (error) {
    console.error('Error processing location:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
});

// Обработка текстового ввода (название города)
step2.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();

    // Проверка на отмену
    if (text.toLowerCase() === '❌ отмена' || text.toLowerCase() === '/cancel') {
      await ctx.reply(CANCEL_MESSAGE, {
        parse_mode: 'HTML',
        ...Markup.removeKeyboard(),
      });
      return ctx.scene.leave();
    }

    // Проверка на минимальную длину
    if (text.length < 2) {
      await ctx.reply(
        '⚠️ Название города слишком короткое. Пожалуйста, введите полное название.',
        { parse_mode: 'HTML', ...cancelKeyboard }
      );
      return;
    }

    // Сохраняем город
    ctx.session.mfcSearch = { city: text };

    // Генерируем ссылку
    const linkMessage = formatMFCLink(text);

    // Формируем URL для кнопки
    const searchQuery = encodeURIComponent('МФЦ мои документы');
    const encodedCity = encodeURIComponent(text);
    const yandexUrl = `https://yandex.ru/maps/?text=${searchQuery}+${encodedCity}`;

    await ctx.reply(linkMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      ...Markup.inlineKeyboard([
        [Markup.button.url('🗺 Открыть Яндекс.Карты', yandexUrl)],
        [Markup.button.callback('🔍 Искать в другом городе', 'search_another_city')],
        [Markup.button.callback('🔙 В меню', 'back_to_menu')],
      ]),
    });

    // Убираем клавиатуру
    await ctx.reply('✅ Готово!', Markup.removeKeyboard());

    return ctx.scene.leave();
  } catch (error) {
    console.error('Error processing city name:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
});

// Поиск в другом городе
step2.action('search_another_city', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔍 Новый поиск');
    // Очищаем данные поиска
    delete ctx.session.mfcSearch;
    // Возвращаемся к шагу 1
    return ctx.wizard.selectStep(0);
  } catch (error) {
    console.error('Error in search_another_city:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
});

// Возврат в меню
step2.action('back_to_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔙 В меню');
    await ctx.reply('Для возврата в меню нажмите /start', Markup.removeKeyboard());
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in back_to_menu:', error);
    return ctx.scene.leave();
  }
});

/**
 * Создание сцены поиска МФЦ
 */
export const findMFCScene = new Scenes.WizardScene<RosreestrContext>(
  FIND_MFC_SCENE,
  step1,
  step2
);

// Middleware для входа в сцену
findMFCScene.enter(async (ctx) => {
  console.log(`User ${ctx.from?.id} entered find_mfc scene`);
});

// Middleware для выхода из сцены
findMFCScene.leave(async (ctx) => {
  console.log(`User ${ctx.from?.id} left find_mfc scene`);
  // Очищаем данные поиска
  delete ctx.session.mfcSearch;
});

export default findMFCScene;
