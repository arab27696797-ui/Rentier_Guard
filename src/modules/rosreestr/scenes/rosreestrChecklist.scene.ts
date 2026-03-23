/**
 * Сцена чек-листа документов для Росреестра
 * RentierGuard Bot
 * 
 * WizardScene с 4 шагами:
 * 1. Проверка срока договора (> 1 года?)
 * 2. Показ чек-листа с inline keyboard
 * 3. Обработка отметок (callback_data)
 * 4. Завершение при полной готовности
 */

import { Composer, Markup, Scenes } from 'telegraf';
import { RosreestrContext, RosreestrChecklist } from '../types';
import { RosreestrService } from '../services/rosreestr.service';
import {
  CHECKLIST_WELCOME_MESSAGE,
  NO_REGISTRATION_REQUIRED_MESSAGE,
  REGISTRATION_REQUIRED_MESSAGE,
  formatDocumentsList,
  formatCompletionMessage,
  ERROR_MESSAGE,
  INVALID_INPUT_MESSAGE,
  CANCEL_MESSAGE,
} from '../templates/messages';

// Имя сцены
export const ROSREESTR_CHECKLIST_SCENE = 'rosreestr_checklist';

/**
 * Клавиатура для ответа да/нет (шаг 1)
 */
const yesNoKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Да, более 1 года', 'duration_yes'),
    Markup.button.callback('❌ Нет, менее 1 года', 'duration_no'),
  ],
]);

/**
 * Клавиатура для управления чек-листом
 */
function createChecklistKeyboard(checklist: RosreestrChecklist) {
  const buttons = checklist.items.map((item) => {
    const status = item.checked ? '✅' : '⬜';
    return [Markup.button.callback(`${status} ${item.emoji} ${item.name}`, `toggle_${item.id}`)];
  });

  // Добавляем кнопки управления
  buttons.push([
    Markup.button.callback('🔄 Сбросить все', 'reset_checklist'),
    Markup.button.callback('✨ Готово!', 'complete_checklist'),
  ]);

  buttons.push([Markup.button.callback('❌ Отмена', 'cancel_checklist')]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Шаг 1: Проверка срока договора
 */
const step1 = async (ctx: RosreestrContext) => {
  try {
    await ctx.reply(CHECKLIST_WELCOME_MESSAGE, {
      parse_mode: 'HTML',
      ...yesNoKeyboard,
    });
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in step1:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
};

/**
 * Шаг 2: Обработка ответа о сроке и показ чек-листа
 */
const step2 = new Composer<RosreestrContext>();

// Обработка callback "Да" (срок > 1 года)
step2.action('duration_yes', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    // Сохраняем информацию о сроке
    ctx.session.sceneData = { ...ctx.session.sceneData, contractDuration: 13 }; // > 12 месяцев

    // Показываем сообщение о необходимости регистрации
    await ctx.reply(REGISTRATION_REQUIRED_MESSAGE, { parse_mode: 'HTML' });

    // Создаем чек-лист
    const checklist = RosreestrService.createChecklist(ctx.from!.id, {
      durationMonths: 13,
      propertyType: 'residential',
      isLandlordLegalEntity: false,
      isTenantLegalEntity: false,
    });

    ctx.session.checklist = checklist;

    // Показываем чек-лист
    await ctx.reply(formatDocumentsList(checklist.items), {
      parse_mode: 'HTML',
      ...createChecklistKeyboard(checklist),
    });

    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in duration_yes:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
});

// Обработка callback "Нет" (срок < 1 года)
step2.action('duration_no', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    // Сохраняем информацию о сроке
    ctx.session.sceneData = { ...ctx.session.sceneData, contractDuration: 6 }; // < 12 месяцев

    // Показываем сообщение о ненужности регистрации
    await ctx.reply(NO_REGISTRATION_REQUIRED_MESSAGE, { parse_mode: 'HTML' });

    // Завершаем сцену
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in duration_no:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
});

// Обработка текстового ввода (если пользователь написал вместо нажатия кнопки)
step2.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.toLowerCase();

    if (text.includes('да') || text.includes('более') || text.includes('>')) {
      // Эмулируем нажатие "Да"
      await ctx.reply(REGISTRATION_REQUIRED_MESSAGE, { parse_mode: 'HTML' });

      const checklist = RosreestrService.createChecklist(ctx.from!.id, {
        durationMonths: 13,
        propertyType: 'residential',
        isLandlordLegalEntity: false,
        isTenantLegalEntity: false,
      });

      ctx.session.checklist = checklist;

      await ctx.reply(formatDocumentsList(checklist.items), {
        parse_mode: 'HTML',
        ...createChecklistKeyboard(checklist),
      });

      return ctx.wizard.next();
    } else if (text.includes('нет') || text.includes('менее') || text.includes('<')) {
      // Эмулируем нажатие "Нет"
      await ctx.reply(NO_REGISTRATION_REQUIRED_MESSAGE, { parse_mode: 'HTML' });
      return ctx.scene.leave();
    } else {
      await ctx.reply(INVALID_INPUT_MESSAGE, { parse_mode: 'HTML' });
    }
  } catch (error) {
    console.error('Error in step2 text handler:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
  }
});

/**
 * Шаг 3: Обработка отметок в чек-листе
 */
const step3 = new Composer<RosreestrContext>();

// Обработка переключения пункта чек-листа
step3.action(/^toggle_(.+)$/, async (ctx) => {
  try {
    const itemId = ctx.match[1];
    const checklist = ctx.session.checklist;

    if (!checklist) {
      await ctx.answerCbQuery('❌ Чек-лист не найден');
      return ctx.scene.leave();
    }

    // Переключаем пункт
    const updatedChecklist = RosreestrService.toggleChecklistItem(checklist, itemId);
    ctx.session.checklist = updatedChecklist;

    // Обновляем сообщение с чек-листом
    await ctx.answerCbQuery('✅ Обновлено');

    try {
      await ctx.editMessageText(formatDocumentsList(updatedChecklist.items), {
        parse_mode: 'HTML',
        ...createChecklistKeyboard(updatedChecklist),
      });
    } catch (editError) {
      // Если сообщение не изменилось, игнорируем ошибку
      console.log('Message not modified');
    }

    // Проверяем, все ли отмечено
    if (updatedChecklist.isComplete) {
      await ctx.reply(formatCompletionMessage(updatedChecklist.items), {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏢 Найти МФЦ', 'find_mfc')],
          [Markup.button.callback('🔙 В меню', 'back_to_menu')],
        ]),
      });
    }
  } catch (error) {
    console.error('Error in toggle action:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Сброс чек-листа
step3.action('reset_checklist', async (ctx) => {
  try {
    const checklist = ctx.session.checklist;

    if (!checklist) {
      await ctx.answerCbQuery('❌ Чек-лист не найден');
      return;
    }

    const resetChecklist = RosreestrService.resetChecklist(checklist);
    ctx.session.checklist = resetChecklist;

    await ctx.answerCbQuery('🔄 Чек-лист сброшен');

    await ctx.editMessageText(formatDocumentsList(resetChecklist.items), {
      parse_mode: 'HTML',
      ...createChecklistKeyboard(resetChecklist),
    });
  } catch (error) {
    console.error('Error in reset_checklist:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Завершение чек-листа
step3.action('complete_checklist', async (ctx) => {
  try {
    const checklist = ctx.session.checklist;

    if (!checklist) {
      await ctx.answerCbQuery('❌ Чек-лист не найден');
      return ctx.scene.leave();
    }

    if (!checklist.isComplete) {
      const unchecked = RosreestrService.getUncheckedItems(checklist);
      await ctx.answerCbQuery(`❌ Осталось: ${unchecked.length} пунктов`);

      // Показываем напоминание
      const uncheckedNames = unchecked.map((i) => `${i.emoji} ${i.name}`).join('\n');
      await ctx.reply(
        `⚠️ <b>Еще не все готово!</b>\n\nОсталось подготовить:\n${uncheckedNames}`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    await ctx.answerCbQuery('🎉 Поздравляем!');

    await ctx.reply(formatCompletionMessage(checklist.items), {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏢 Найти МФЦ', 'find_mfc')],
        [Markup.button.callback('🔙 В меню', 'back_to_menu')],
      ]),
    });

    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in complete_checklist:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Отмена
step3.action('cancel_checklist', async (ctx) => {
  try {
    await ctx.answerCbQuery('❌ Отменено');
    await ctx.reply(CANCEL_MESSAGE, { parse_mode: 'HTML' });
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in cancel_checklist:', error);
    return ctx.scene.leave();
  }
});

// Переход к поиску МФЦ
step3.action('find_mfc', async (ctx) => {
  try {
    await ctx.answerCbQuery('🏢 Ищем МФЦ...');
    await ctx.scene.enter('find_mfc');
  } catch (error) {
    console.error('Error in find_mfc action:', error);
    await ctx.reply(ERROR_MESSAGE, { parse_mode: 'HTML' });
  }
});

// Возврат в меню
step3.action('back_to_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery('🔙 В меню');
    await ctx.reply('Для возврата в меню нажмите /start');
    return ctx.scene.leave();
  } catch (error) {
    console.error('Error in back_to_menu:', error);
    return ctx.scene.leave();
  }
});

/**
 * Создание сцены чек-листа
 */
export const rosreestrChecklistScene = new Scenes.WizardScene<RosreestrContext>(
  ROSREESTR_CHECKLIST_SCENE,
  step1,
  step2,
  step3
);

// Middleware для входа в сцену
rosreestrChecklistScene.enter(async (ctx) => {
  console.log(`User ${ctx.from?.id} entered rosreestr_checklist scene`);
});

// Middleware для выхода из сцены
rosreestrChecklistScene.leave(async (ctx) => {
  console.log(`User ${ctx.from?.id} left rosreestr_checklist scene`);
  // Очищаем временные данные сцены
  delete ctx.session.sceneData;
});

export default rosreestrChecklistScene;
