/**
 * Сцена запроса к эксперту
 * RentierGuard Bot
 * 
 * Поток:
 * Шаг 0: Проверка freeConsultationUsed → если использовано → сообщение о платности
 * Шаг 1: Выбор типа эксперта (inline keyboard)
 * Шаг 2: Ввод описания вопроса
 * Шаг 3: Уточнение деталей (опционально — можно пропустить)
 * Шаг 4: Подтверждение и отправка
 */

import { Composer, Markup, Scenes } from 'telegraf';
import {
  ExpertType,
  ExpertWizardContext,
  ExpertWizardSession,
  RequestPriority,
} from '../types';
import {
  descriptionSchema,
  detailsSchema,
  validateWithErrors,
} from '../validators';
import { ExpertService } from '../services/expert.service';
import { NotificationService } from '../services/notification.service';
import {
  getExpertWelcomeMessage,
  getExpertTypeSelectionMessage,
  getDescriptionRequestMessage,
  getDetailsRequestMessage,
  getConfirmationMessage,
  getRequestSentMessage,
  getFreeLimitExceededMessage,
  getErrorMessage,
  getExpertTypeLabel,
} from '../templates/messages';

// Инициализация сервисов
const expertService = new ExpertService();
const notificationService = new NotificationService();

/**
 * Название сцены
 */
export const EXPERT_REQUEST_SCENE = 'expert_request_scene';

/**
 * Клавиатура выбора типа эксперта
 */
const expertTypeKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('⚖️ Юрист', JSON.stringify({ action: 'select_expert_type', type: ExpertType.LAWYER })),
  ],
  [
    Markup.button.callback('💼 Налоговый консультант', JSON.stringify({ action: 'select_expert_type', type: ExpertType.TAX })),
  ],
  [
    Markup.button.callback('📊 Бухгалтер', JSON.stringify({ action: 'select_expert_type', type: ExpertType.ACCOUNTANT })),
  ],
  [
    Markup.button.callback('❌ Отменить', JSON.stringify({ action: 'cancel' })),
  ],
]);

/**
 * Клавиатура для шага деталей (с кнопкой пропустить)
 */
const detailsKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('⏭️ Пропустить', JSON.stringify({ action: 'skip', step: 'details' })),
  ],
  [
    Markup.button.callback('◀️ Назад', JSON.stringify({ action: 'back' })),
  ],
]);

/**
 * Клавиатура подтверждения
 */
const confirmationKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Подтвердить и отправить', JSON.stringify({ action: 'confirm' })),
  ],
  [
    Markup.button.callback('◀️ Назад', JSON.stringify({ action: 'back' })),
  ],
  [
    Markup.button.callback('❌ Отменить', JSON.stringify({ action: 'cancel' })),
  ],
]);

/**
 * Инициализация состояния визарда
 */
function initWizardState(): ExpertWizardSession {
  return {
    step: 0,
    priority: RequestPriority.MEDIUM,
    isFree: true,
  };
}

/**
 * Шаг 0: Проверка доступности бесплатной консультации
 * Если использована — информируем о платности
 */
const step0CheckFreeConsultation = async (ctx: ExpertWizardContext) => {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(getErrorMessage('Не удалось определить пользователя'));
      return ctx.scene.leave();
    }

    // Инициализируем состояние
    ctx.wizard.state = initWizardState();

    // Проверяем, есть ли бесплатная консультация
    const hasFree = await expertService.hasFreeConsultation(userId);

    if (!hasFree) {
      // Бесплатная консультация уже использована
      await ctx.reply(
        getFreeLimitExceededMessage(),
        Markup.inlineKeyboard([
          [Markup.button.url('💳 Перейти к оплате', 'https://rentierguard.ru/payment')],
          [Markup.button.callback('🔙 В главное меню', 'main_menu')],
        ])
      );
      return ctx.scene.leave();
    }

    // Бесплатная консультация доступна — переходим к выбору типа эксперта
    await ctx.reply(getExpertWelcomeMessage());
    await ctx.reply(getExpertTypeSelectionMessage(), expertTypeKeyboard);

    return ctx.wizard.next();
  } catch (error) {
    console.error('[ExpertScene] Ошибка на шаге 0:', error);
    await ctx.reply(getErrorMessage('Произошла ошибка при проверке доступности консультации'));
    return ctx.scene.leave();
  }
};

/**
 * Шаг 1: Выбор типа эксперта
 * Обрабатываем callback от inline keyboard
 */
const step1SelectExpertType = new Composer<ExpertWizardContext>();

step1SelectExpertType.action(/select_expert_type/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    // Парсим callback данные
    const callbackData = ctx.match.input;
    const match = callbackData.match(/"type":"(\w+)"/);
    
    if (!match) {
      await ctx.reply('❌ Не удалось определить тип эксперта. Попробуйте ещё раз.');
      return;
    }

    const expertType = match[1] as ExpertType;

    // Проверяем валидность типа
    if (!Object.values(ExpertType).includes(expertType)) {
      await ctx.reply('❌ Неверный тип эксперта. Пожалуйста, выберите из списка.');
      return;
    }

    // Сохраняем выбор
    ctx.wizard.state.expertType = expertType;

    // Удаляем предыдущую клавиатуру
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(`✅ Выбран: ${getExpertTypeLabel(expertType)}`);

    // Переходим к следующему шагу
    await ctx.reply(getDescriptionRequestMessage(expertType));

    return ctx.wizard.next();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при выборе типа эксперта:', error);
    await ctx.reply(getErrorMessage());
  }
});

step1SelectExpertType.action('cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageReplyMarkup(undefined);
  await ctx.reply('❌ Запрос отменён. Вы можете вернуться в любое время.');
  return ctx.scene.leave();
});

/**
 * Шаг 2: Ввод описания вопроса
 */
const step2Description = new Composer<ExpertWizardContext>();

step2Description.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;

    // Валидация описания
    const validation = validateWithErrors(descriptionSchema, text);

    if (!validation.success) {
      await ctx.reply(validation.errors.join('\n'));
      return;
    }

    // Сохраняем описание
    ctx.wizard.state.description = validation.data;

    // Переходим к следующему шагу
    await ctx.reply(getDetailsRequestMessage(), detailsKeyboard);

    return ctx.wizard.next();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при вводе описания:', error);
    await ctx.reply(getErrorMessage());
  }
});

step2Description.action('cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageReplyMarkup(undefined);
  await ctx.reply('❌ Запрос отменён.');
  return ctx.scene.leave();
});

/**
 * Шаг 3: Уточнение деталей (опционально)
 */
const step3Details = new Composer<ExpertWizardContext>();

// Обработка пропуска шага
step3Details.action('skip', async (ctx) => {
  try {
    await ctx.answerCbQuery('Пропущено');
    await ctx.editMessageReplyMarkup(undefined);

    // Детали не заполнены
    ctx.wizard.state.details = undefined;

    // Показываем подтверждение
    await showConfirmation(ctx);

    return ctx.wizard.next();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при пропуске деталей:', error);
    await ctx.reply(getErrorMessage());
  }
});

// Обработка кнопки назад
step3Details.action('back', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(getDescriptionRequestMessage(ctx.wizard.state.expertType!));
    return ctx.wizard.back();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при возврате:', error);
    await ctx.reply(getErrorMessage());
  }
});

// Обработка ввода деталей
step3Details.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;

    // Валидация деталей
    const validation = validateWithErrors(detailsSchema, text);

    if (!validation.success) {
      await ctx.reply(validation.errors.join('\n'));
      return;
    }

    // Сохраняем детали
    ctx.wizard.state.details = validation.data;

    // Показываем подтверждение
    await showConfirmation(ctx);

    return ctx.wizard.next();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при вводе деталей:', error);
    await ctx.reply(getErrorMessage());
  }
});

/**
 * Показать сообщение с подтверждением
 */
async function showConfirmation(ctx: ExpertWizardContext): Promise<void> {
  const state = ctx.wizard.state;

  await ctx.reply(
    getConfirmationMessage({
      expertType: state.expertType!,
      description: state.description!,
      details: state.details,
      isFree: state.isFree,
    }),
    confirmationKeyboard
  );
}

/**
 * Шаг 4: Подтверждение и отправка
 */
const step4Confirmation = new Composer<ExpertWizardContext>();

// Подтверждение и отправка
step4Confirmation.action('confirm', async (ctx) => {
  try {
    await ctx.answerCbQuery('Отправляем...');
    await ctx.editMessageReplyMarkup(undefined);

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(getErrorMessage('Не удалось определить пользователя'));
      return ctx.scene.leave();
    }

    const state = ctx.wizard.state;

    // Создаём запрос
    const result = await expertService.createExpertRequest({
      userId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      expertType: state.expertType!,
      description: state.description!,
      details: state.details,
      priority: state.priority,
      isFree: state.isFree ?? true,
    });

    if (!result.success || !result.request) {
      await ctx.reply(getErrorMessage(result.error || 'Не удалось создать запрос'));
      return ctx.scene.leave();
    }

    // Отмечаем бесплатную консультацию как использованную
    if (state.isFree) {
      await expertService.markConsultationUsed(userId);
    }

    // Отправляем уведомление в канал
    await notificationService.notifyExpertsChannel(result.request);

    // Отправляем подтверждение пользователю
    await ctx.reply(getRequestSentMessage(result.request.id, state.isFree ?? true));

    return ctx.scene.leave();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при отправке запроса:', error);
    await ctx.reply(getErrorMessage('Произошла ошибка при отправке запроса. Пожалуйста, попробуйте позже.'));
    return ctx.scene.leave();
  }
});

// Возврат к деталям
step4Confirmation.action('back', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(getDetailsRequestMessage(), detailsKeyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.error('[ExpertScene] Ошибка при возврате:', error);
    await ctx.reply(getErrorMessage());
  }
});

// Отмена
step4Confirmation.action('cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageReplyMarkup(undefined);
  await ctx.reply('❌ Запрос отменён. Ваши данные не сохранены.');
  return ctx.scene.leave();
});

/**
 * Создание сцены запроса к эксперту
 */
export const expertRequestScene = new Scenes.WizardScene<ExpertWizardContext>(
  EXPERT_REQUEST_SCENE,
  step0CheckFreeConsultation,
  step1SelectExpertType,
  step2Description,
  step3Details,
  step4Confirmation
);

/**
 * Middleware для обработки выхода из сцены
 */
expertRequestScene.leave(async (ctx) => {
  // Очистка состояния при выходе из сцены
  if (ctx.session) {
    delete ctx.session.expertWizard;
  }
  console.log(`[ExpertScene] Пользователь ${ctx.from?.id} вышел из сцены`);
});

/**
 * Обработка ошибок в сцене
 */
expertRequestScene.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('[ExpertScene] Необработанная ошибка:', error);
    await ctx.reply(getErrorMessage('Произошла непредвиденная ошибка'));
    return ctx.scene.leave();
  }
});

export default expertRequestScene;
