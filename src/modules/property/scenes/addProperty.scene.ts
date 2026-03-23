/**
 * @fileoverview Сцена добавления объекта недвижимости
 * @module modules/property/scenes/addProperty.scene
 * 
 * Шаги сцены:
 * 1. Ввод адреса объекта
 * 2. Ввод кадастрового номера (опционально)
 * 3. Выбор типа объекта (жилое/коммерческое)
 * 4. Выбор налогового режима
 * 5. Подтверждение и сохранение
 */

import { Scenes, Markup } from 'telegraf';
import { PropertyWizardContext, PropertyType, TaxRegime } from '../types';
import { addressSchema, cadastralNumberSchema, propertyTypeSchema, taxRegimeSchema } from '../validators';
import { PropertyTypeLabels, TaxRegimeLabels, TaxRegimeDescriptions } from '../types';
import { propertyService } from '../services/property.service';
import { messages } from '../templates/messages';
import { logger } from '../../../utils/logger';

// Имя сцены
export const ADD_PROPERTY_SCENE = 'add_property';

// ============================================
// KEYBOARD BUILDERS
// ============================================

/** Клавиатура для выбора типа объекта */
const propertyTypeKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(PropertyTypeLabels[PropertyType.RESIDENTIAL], `type:${PropertyType.RESIDENTIAL}`),
  ],
  [
    Markup.button.callback(PropertyTypeLabels[PropertyType.COMMERCIAL], `type:${PropertyType.COMMERCIAL}`),
  ],
]);

/** Клавиатура для выбора налогового режима */
const taxRegimeKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(TaxRegimeLabels[TaxRegime.NDFL], `tax:${TaxRegime.NDFL}`)],
  [Markup.button.callback(TaxRegimeLabels[TaxRegime.SELF_EMPLOYED], `tax:${TaxRegime.SELF_EMPLOYED}`)],
  [Markup.button.callback(TaxRegimeLabels[TaxRegime.PATENT], `tax:${TaxRegime.PATENT}`)],
  [Markup.button.callback(TaxRegimeLabels[TaxRegime.IP], `tax:${TaxRegime.IP}`)],
]);

/** Клавиатура подтверждения */
const confirmKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('✅ Сохранить', 'confirm:save')],
  [Markup.button.callback('✏️ Изменить адрес', 'edit:address')],
  [Markup.button.callback('✏️ Изменить кадастровый номер', 'edit:cadastral')],
  [Markup.button.callback('✏️ Изменить тип', 'edit:type')],
  [Markup.button.callback('✏️ Изменить налоговый режим', 'edit:tax')],
  [Markup.button.callback('❌ Отменить', 'confirm:cancel')],
]);

/** Клавиатура пропуска кадастрового номера */
const skipCadastralKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⏭️ Пропустить', 'skip:cadastral')],
  [Markup.button.callback('❌ Отменить', 'confirm:cancel')],
]);

// ============================================
// SCENE
// ============================================

export const addPropertyScene = new Scenes.WizardScene<PropertyWizardContext>(
  ADD_PROPERTY_SCENE,
  
  // ========== ШАГ 1: Ввод адреса ==========
  async (ctx) => {
    try {
      await ctx.reply(
        messages.addProperty.step1Address,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Отменить', 'confirm:cancel')]])
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addProperty scene step 1:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Ввод кадастрового номера ==========
  async (ctx) => {
    try {
      // Проверяем, не была ли нажата кнопка отмены
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        if (data === 'confirm:cancel') {
          await ctx.answerCbQuery();
          await ctx.reply(messages.addProperty.cancelled);
          return ctx.scene.leave();
        }
      }

      // Валидация адреса
      const message = ctx.message;
      if (!message || !('text' in message)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const addressResult = addressSchema.safeParse(message.text);
      if (!addressResult.success) {
        await ctx.reply(addressResult.error.errors[0].message);
        return;
      }

      // Сохраняем адрес в сессии
      ctx.session.propertyData = {
        ...ctx.session.propertyData,
        address: addressResult.data,
      };

      await ctx.reply(
        messages.addProperty.step2Cadastral,
        skipCadastralKeyboard
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addProperty scene step 2:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Выбор типа объекта ==========
  async (ctx) => {
    try {
      // Обработка callback
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        await ctx.answerCbQuery();

        if (data === 'skip:cadastral') {
          ctx.session.propertyData = {
            ...ctx.session.propertyData,
            cadastralNumber: undefined,
          };
        } else if (data === 'confirm:cancel') {
          await ctx.reply(messages.addProperty.cancelled);
          return ctx.scene.leave();
        } else {
          return;
        }
      } else if (ctx.message && 'text' in ctx.message) {
        // Валидация кадастрового номера
        const cadastralResult = cadastralNumberSchema.safeParse(ctx.message.text);
        if (!cadastralResult.success) {
          await ctx.reply(cadastralResult.error.errors[0].message);
          return;
        }

        ctx.session.propertyData = {
          ...ctx.session.propertyData,
          cadastralNumber: cadastralResult.data || undefined,
        };
      }

      await ctx.reply(
        messages.addProperty.step3Type,
        propertyTypeKeyboard
      );
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addProperty scene step 3:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 4: Выбор налогового режима ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'confirm:cancel') {
        await ctx.reply(messages.addProperty.cancelled);
        return ctx.scene.leave();
      }

      if (!data.startsWith('type:')) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const type = data.replace('type:', '') as PropertyType;
      const typeResult = propertyTypeSchema.safeParse(type);

      if (!typeResult.success) {
        await ctx.reply(typeResult.error.errors[0].message);
        return;
      }

      ctx.session.propertyData = {
        ...ctx.session.propertyData,
        type: typeResult.data,
      };

      // Отправляем описания налоговых режимов
      let taxInfoMessage = messages.addProperty.step4TaxRegime + '\n\n';
      Object.entries(TaxRegimeDescriptions).forEach(([regime, description]) => {
        taxInfoMessage += `${TaxRegimeLabels[regime as TaxRegime]}\n${description}\n\n`;
      });

      await ctx.reply(taxInfoMessage, taxRegimeKeyboard);
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addProperty scene step 4:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 5: Подтверждение и сохранение ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      if (data === 'confirm:cancel') {
        await ctx.reply(messages.addProperty.cancelled);
        return ctx.scene.leave();
      }

      if (!data.startsWith('tax:')) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const taxRegime = data.replace('tax:', '') as TaxRegime;
      const taxResult = taxRegimeSchema.safeParse(taxRegime);

      if (!taxResult.success) {
        await ctx.reply(taxResult.error.errors[0].message);
        return;
      }

      ctx.session.propertyData = {
        ...ctx.session.propertyData,
        taxRegime: taxResult.data,
      };

      // Формируем сводку
      const { address, cadastralNumber, type, taxRegime: finalTaxRegime } = ctx.session.propertyData;
      const summary = messages.addProperty.summary(
        address!,
        cadastralNumber || 'Не указан',
        PropertyTypeLabels[type!],
        TaxRegimeLabels[finalTaxRegime!]
      );

      await ctx.reply(summary, confirmKeyboard);
      return ctx.wizard.next();
    } catch (error) {
      logger.error('Error in addProperty scene step 5:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 6: Обработка подтверждения ==========
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.reply(messages.errors.invalidInput);
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCbQuery();

      // Обработка редактирования
      if (data.startsWith('edit:')) {
        const field = data.replace('edit:', '');
        switch (field) {
          case 'address':
            await ctx.reply(messages.addProperty.step1Address);
            return ctx.wizard.selectStep(1);
          case 'cadastral':
            await ctx.reply(messages.addProperty.step2Cadastral, skipCadastralKeyboard);
            return ctx.wizard.selectStep(2);
          case 'type':
            await ctx.reply(messages.addProperty.step3Type, propertyTypeKeyboard);
            return ctx.wizard.selectStep(3);
          case 'tax':
            let taxInfoMessage = messages.addProperty.step4TaxRegime + '\n\n';
            Object.entries(TaxRegimeDescriptions).forEach(([regime, description]) => {
              taxInfoMessage += `${TaxRegimeLabels[regime as TaxRegime]}\n${description}\n\n`;
            });
            await ctx.reply(taxInfoMessage, taxRegimeKeyboard);
            return ctx.wizard.selectStep(4);
          default:
            await ctx.reply(messages.errors.invalidInput);
            return;
        }
      }

      // Обработка подтверждения или отмены
      if (data === 'confirm:cancel') {
        await ctx.reply(messages.addProperty.cancelled);
        return ctx.scene.leave();
      }

      if (data === 'confirm:save') {
        const { address, cadastralNumber, type, taxRegime } = ctx.session.propertyData;

        // Сохраняем объект
        const property = await propertyService.createProperty({
          userId: ctx.from!.id,
          address: address!,
          cadastralNumber,
          type: type!,
          taxRegime: taxRegime!,
        });

        await ctx.reply(
          messages.addProperty.success(property.address),
          Markup.inlineKeyboard([
            [Markup.button.callback('📋 Мои объекты', 'view:properties')],
            [Markup.button.callback('➕ Добавить ещё', 'action:add_property')],
          ])
        );

        // Очищаем сессию
        delete ctx.session.propertyData;
        return ctx.scene.leave();
      }

      await ctx.reply(messages.errors.invalidInput);
    } catch (error) {
      logger.error('Error in addProperty scene step 6:', error);
      await ctx.reply(messages.errors.general);
      return ctx.scene.leave();
    }
  }
);

// ============================================
// MIDDLEWARE
// ============================================

// Проверка авторизации при входе в сцену
addPropertyScene.enter(async (ctx, next) => {
  if (!ctx.from) {
    await ctx.reply(messages.errors.unauthorized);
    return ctx.scene.leave();
  }
  await next();
});

// Очистка сессии при выходе
addPropertyScene.leave(async (ctx, next) => {
  delete ctx.session.propertyData;
  await next();
});
