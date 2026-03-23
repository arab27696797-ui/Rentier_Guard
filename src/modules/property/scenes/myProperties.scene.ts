/**
 * @fileoverview Сцена управления списком объектов недвижимости
 * @module modules/property/scenes/myProperties.scene
 * 
 * Функционал:
 * - Показать список объектов с кнопками (просмотр/редактировать/удалить)
 * - При выборе — детальная информация
 */

import { Scenes, Markup } from 'telegraf';
import { PropertyWizardContext, Property, PropertyTypeLabels, TaxRegimeLabels } from '../types';
import { propertyService } from '../services/property.service';
import { messages } from '../templates/messages';
import { logger } from '../../../utils/logger';

// Имя сцены
export const MY_PROPERTIES_SCENE = 'my_properties';

// ============================================
// CONSTANTS
// ============================================

const ITEMS_PER_PAGE = 5;

// ============================================
// KEYBOARD BUILDERS
// ============================================

/**
 * Создает клавиатуру списка объектов
 */
function buildPropertyListKeyboard(properties: Property[], page: number = 0): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: ReturnType<typeof Markup.button.callback>[][] = [];
  
  properties.forEach((property) => {
    buttons.push([
      Markup.button.callback(
        `🏠 ${property.address.substring(0, 30)}${property.address.length > 30 ? '...' : ''}`,
        `view:${property.id}`
      ),
    ]);
  });

  // Кнопки пагинации
  const paginationButtons: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 0) {
    paginationButtons.push(Markup.button.callback('◀️ Назад', `page:${page - 1}`));
  }
  paginationButtons.push(Markup.button.callback('➕ Добавить', 'action:add_property'));
  if (properties.length === ITEMS_PER_PAGE) {
    paginationButtons.push(Markup.button.callback('Вперед ▶️', `page:${page + 1}`));
  }
  
  if (paginationButtons.length > 0) {
    buttons.push(paginationButtons);
  }

  buttons.push([Markup.button.callback('🔙 В главное меню', 'action:main_menu')]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * Создает клавиатуру детального просмотра объекта
 */
function buildPropertyDetailKeyboard(propertyId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Редактировать', `edit:${propertyId}`)],
    [Markup.button.callback('🗑️ Удалить', `delete:${propertyId}`)],
    [Markup.button.callback('📋 К списку объектов', 'action:list')],
  ]);
}

/**
 * Создает клавиатуру редактирования объекта
 */
function buildEditKeyboard(propertyId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Адрес', `edit_field:${propertyId}:address`)],
    [Markup.button.callback('✏️ Кадастровый номер', `edit_field:${propertyId}:cadastral`)],
    [Markup.button.callback('✏️ Тип объекта', `edit_field:${propertyId}:type`)],
    [Markup.button.callback('✏️ Налоговый режим', `edit_field:${propertyId}:tax`)],
    [Markup.button.callback('🔙 Назад', `view:${propertyId}`)],
  ]);
}

/**
 * Создает клавиатуру подтверждения удаления
 */
function buildDeleteConfirmKeyboard(propertyId: string): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Да, удалить', `confirm_delete:${propertyId}`)],
    [Markup.button.callback('❌ Нет, отменить', `view:${propertyId}`)],
  ]);
}

// ============================================
// SCENE
// ============================================

export const myPropertiesScene = new Scenes.WizardScene<PropertyWizardContext>(
  MY_PROPERTIES_SCENE,

  // ========== ШАГ 1: Показ списка объектов ==========
  async (ctx) => {
    try {
      const userId = ctx.from!.id;
      const page = ctx.session.propertyPage || 0;

      const properties = await propertyService.getUserProperties(userId, page, ITEMS_PER_PAGE);

      if (properties.length === 0) {
        if (page > 0) {
          // Если на странице нет объектов, возвращаемся на первую
          ctx.session.propertyPage = 0;
          const firstPageProperties = await propertyService.getUserProperties(userId, 0, ITEMS_PER_PAGE);
          
          if (firstPageProperties.length === 0) {
            await ctx.reply(
              messages.myProperties.empty,
              Markup.inlineKeyboard([
                [Markup.button.callback('➕ Добавить объект', 'action:add_property')],
                [Markup.button.callback('🔙 В главное меню', 'action:main_menu')],
              ])
            );
            return;
          }
          
          await ctx.reply(
            messages.myProperties.list(firstPageProperties.length),
            buildPropertyListKeyboard(firstPageProperties, 0)
          );
          return;
        }

        await ctx.reply(
          messages.myProperties.empty,
          Markup.inlineKeyboard([
            [Markup.button.callback('➕ Добавить объект', 'action:add_property')],
            [Markup.button.callback('🔙 В главное меню', 'action:main_menu')],
          ])
        );
        return;
      }

      await ctx.reply(
        messages.myProperties.list(properties.length),
        buildPropertyListKeyboard(properties, page)
      );
    } catch (error) {
      logger.error('Error in myProperties scene step 1:', error);
      await ctx.reply(messages.errors.general);
    }
  }
);

// ============================================
// ACTION HANDLERS
// ============================================

// Просмотр деталей объекта
myPropertiesScene.action(/^view:(.+)$/, async (ctx) => {
  try {
    const propertyId = ctx.match[1];
    const property = await propertyService.getPropertyById(propertyId);

    if (!property) {
      await ctx.answerCbQuery('❌ Объект не найден');
      return;
    }

    // Проверяем, что объект принадлежит текущему пользователю
    if (property.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ У вас нет доступа к этому объекту');
      return;
    }

    const message = messages.myProperties.detail(
      property.address,
      property.cadastralNumber,
      PropertyTypeLabels[property.type],
      TaxRegimeLabels[property.taxRegime],
      property.createdAt
    );

    await ctx.editMessageText(message, buildPropertyDetailKeyboard(propertyId));
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error viewing property:', error);
    await ctx.answerCbQuery('❌ Ошибка при загрузке объекта');
  }
});

// Пагинация
myPropertiesScene.action(/^page:(\d+)$/, async (ctx) => {
  try {
    const page = parseInt(ctx.match[1], 10);
    ctx.session.propertyPage = page;

    const userId = ctx.from!.id;
    const properties = await propertyService.getUserProperties(userId, page, ITEMS_PER_PAGE);

    await ctx.editMessageText(
      messages.myProperties.list(properties.length),
      buildPropertyListKeyboard(properties, page)
    );
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error in pagination:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Переход к редактированию
myPropertiesScene.action(/^edit:(.+)$/, async (ctx) => {
  try {
    const propertyId = ctx.match[1];
    const property = await propertyService.getPropertyById(propertyId);

    if (!property || property.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Объект не найден');
      return;
    }

    await ctx.editMessageText(
      messages.myProperties.selectFieldToEdit,
      buildEditKeyboard(propertyId)
    );
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error entering edit mode:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Редактирование конкретного поля
myPropertiesScene.action(/^edit_field:(.+):(.+)$/, async (ctx) => {
  try {
    const propertyId = ctx.match[1];
    const field = ctx.match[2];

    const property = await propertyService.getPropertyById(propertyId);

    if (!property || property.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Объект не найден');
      return;
    }

    ctx.session.selectedPropertyId = propertyId;

    // Сохраняем поле для редактирования в сессии
    ctx.session.editField = field;

    let promptMessage = '';
    switch (field) {
      case 'address':
        promptMessage = messages.myProperties.editPrompts.address;
        break;
      case 'cadastral':
        promptMessage = messages.myProperties.editPrompts.cadastral;
        break;
      case 'type':
        promptMessage = messages.myProperties.editPrompts.type;
        break;
      case 'tax':
        promptMessage = messages.myProperties.editPrompts.tax;
        break;
      default:
        await ctx.answerCbQuery('❌ Неизвестное поле');
        return;
    }

    await ctx.reply(promptMessage);
    await ctx.answerCbQuery();

    // Переходим к обработке ввода
    ctx.wizard.selectStep(1);
  } catch (error) {
    logger.error('Error starting field edit:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Обработка ввода при редактировании
myPropertiesScene.on('text', async (ctx) => {
  try {
    const field = ctx.session.editField;
    const propertyId = ctx.session.selectedPropertyId;

    if (!field || !propertyId) {
      await ctx.reply(messages.errors.invalidInput);
      return ctx.scene.reenter();
    }

    const text = ctx.message.text;
    let updateData: { address?: string; cadastralNumber?: string | null } = {};

    // Валидация и обновление в зависимости от поля
    switch (field) {
      case 'address': {
        const { addressSchema } = await import('../validators');
        const result = addressSchema.safeParse(text);
        if (!result.success) {
          await ctx.reply(result.error.errors[0].message);
          return;
        }
        updateData = { address: result.data };
        break;
      }
      case 'cadastral': {
        const { cadastralNumberSchema } = await import('../validators');
        const result = cadastralNumberSchema.safeParse(text);
        if (!result.success) {
          await ctx.reply(result.error.errors[0].message);
          return;
        }
        updateData = { cadastralNumber: result.data };
        break;
      }
      default:
        await ctx.reply(messages.errors.invalidInput);
        return ctx.scene.reenter();
    }

    // Обновляем объект
    await propertyService.updateProperty(propertyId, updateData);

    await ctx.reply(messages.myProperties.updateSuccess);

    // Очищаем сессию
    delete ctx.session.editField;
    delete ctx.session.selectedPropertyId;

    // Возвращаемся к списку
    return ctx.scene.reenter();
  } catch (error) {
    logger.error('Error updating property field:', error);
    await ctx.reply(messages.errors.general);
    delete ctx.session.editField;
    delete ctx.session.selectedPropertyId;
    return ctx.scene.reenter();
  }
});

// Подтверждение удаления
myPropertiesScene.action(/^delete:(.+)$/, async (ctx) => {
  try {
    const propertyId = ctx.match[1];
    const property = await propertyService.getPropertyById(propertyId);

    if (!property || property.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Объект не найден');
      return;
    }

    await ctx.editMessageText(
      messages.myProperties.deleteConfirm(property.address),
      buildDeleteConfirmKeyboard(propertyId)
    );
    await ctx.answerCbQuery();
  } catch (error) {
    logger.error('Error showing delete confirmation:', error);
    await ctx.answerCbQuery('❌ Ошибка');
  }
});

// Подтвержденное удаление
myPropertiesScene.action(/^confirm_delete:(.+)$/, async (ctx) => {
  try {
    const propertyId = ctx.match[1];
    const property = await propertyService.getPropertyById(propertyId);

    if (!property || property.userId !== ctx.from!.id) {
      await ctx.answerCbQuery('❌ Объект не найден');
      return;
    }

    await propertyService.deleteProperty(propertyId);

    await ctx.editMessageText(messages.myProperties.deleteSuccess);
    await ctx.answerCbQuery('✅ Объект удалён');

    // Возвращаемся к списку через небольшую задержку
    setTimeout(() => ctx.scene.reenter(), 1500);
  } catch (error) {
    logger.error('Error deleting property:', error);
    await ctx.answerCbQuery('❌ Ошибка при удалении');
  }
});

// Возврат к списку
myPropertiesScene.action('action:list', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.reenter();
});

// ============================================
// MIDDLEWARE
// ============================================

// Проверка авторизации
myPropertiesScene.enter(async (ctx, next) => {
  if (!ctx.from) {
    await ctx.reply(messages.errors.unauthorized);
    return ctx.scene.leave();
  }
  // Сбрасываем страницу при входе
  ctx.session.propertyPage = 0;
  await next();
});

// Очистка сессии при выходе
myPropertiesScene.leave(async (ctx, next) => {
  delete ctx.session.propertyPage;
  delete ctx.session.selectedPropertyId;
  delete ctx.session.editField;
  await next();
});
