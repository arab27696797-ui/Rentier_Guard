/**
 * =========================================
 * Модуль Договоров - Сцена создания акта приема-передачи
 * RentierGuard Telegram Bot
 * =========================================
 * 
 * WizardScene для создания акта приема-передачи:
 * 1. Выбор договора из списка
 * 2. Выбор типа акта (прием/передача)
 * 3. Добавление пунктов инвентаризации
 * 4. Подтверждение списка
 * 5. Добавление показаний счетчиков (опционально)
 * 6. Генерация акта
 */

import { Scenes, Markup } from 'telegraf';
import { ContractWizardContext } from '../types';
import { InventoryItemCondition, InventoryItemData } from '../types';
import { inventoryItemSchema } from '../validators';
import { actMessages, commonMessages } from '../templates/messages';
import { ContractService } from '../services/contract.service';

// =========================================
// КОНСТАНТЫ
// =========================================

const SCENE_ID = 'create_act';

// =========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =========================================

/**
 * Очистка данных сессии
 */
const clearSessionData = (ctx: ContractWizardContext): void => {
  delete ctx.session.actData;
  delete ctx.session.tempInventoryItems;
  delete ctx.session.userContracts;
};

/**
 * Парсинг инвентарного пункта из строки
 * Формат: Название | Количество | Состояние
 */
const parseInventoryItem = (input: string): Partial<InventoryItemData> | null => {
  const parts = input.split('|').map(p => p.trim());
  
  if (parts.length < 2) return null;
  
  const name = parts[0];
  const quantity = parseInt(parts[1], 10);
  const conditionStr = parts[2] || 'good';
  
  // Маппинг русских названий состояний
  const conditionMap: Record<string, InventoryItemCondition> = {
    'новое': InventoryItemCondition.NEW,
    'новый': InventoryItemCondition.NEW,
    'хорошее': InventoryItemCondition.GOOD,
    'хороший': InventoryItemCondition.GOOD,
    'удовлетворительное': InventoryItemCondition.SATISFACTORY,
    'удовлетворительный': InventoryItemCondition.SATISFACTORY,
    'плохое': InventoryItemCondition.POOR,
    'плохой': InventoryItemCondition.POOR,
  };
  
  const condition = conditionMap[conditionStr.toLowerCase()] || InventoryItemCondition.GOOD;
  
  return { name, quantity, condition };
};

/**
 * Получение или инициализация временного списка инвентаря
 */
const getInventoryList = (ctx: ContractWizardContext): InventoryItemData[] => {
  if (!ctx.session.tempInventoryItems) {
    ctx.session.tempInventoryItems = [];
  }
  return ctx.session.tempInventoryItems;
};

// =========================================
// WIZARD SCENE - СОЗДАНИЕ АКТА
// =========================================

export const createActScene = new Scenes.WizardScene<ContractWizardContext>(
  SCENE_ID,
  
  // =========================================
  // ШАГ 0: Приветствие и загрузка договоров
  // =========================================
  async (ctx) => {
    try {
      // Очистка предыдущих данных
      clearSessionData(ctx);
      
      // Инициализация данных акта
      ctx.session.actData = {};
      ctx.session.tempInventoryItems = [];
      
      const userId = ctx.from?.id.toString();
      if (!userId) {
        await ctx.reply(commonMessages.serverError);
        return ctx.scene.leave();
      }

      // Загружаем договоры пользователя
      const contractsResult = await ContractService.getUserContracts(userId);

      if (!contractsResult.success || !contractsResult.data?.length) {
        await ctx.reply(actMessages.noContracts, { parse_mode: 'HTML' });
        return ctx.scene.leave();
      }

      // Сохраняем список договоров в сессии
      ctx.session.userContracts = contractsResult.data.map(c => ({
        id: c.id,
        address: c.address,
      }));

      // Формируем кнопки с договорами
      const contractButtons = contractsResult.data.map((contract, index) => [
        Markup.button.callback(
          `${index + 1}. ${contract.address.substring(0, 40)}${contract.address.length > 40 ? '...' : ''}`,
          `contract_${contract.id}`
        ),
      ]);

      await ctx.reply(
        actMessages.welcome,
        { parse_mode: 'HTML' }
      );

      await ctx.reply(
        actMessages.step1_selectContract,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(contractButtons),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createActScene Шаг 0] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 1: Выбор договора
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('contract_')) {
        await ctx.answerCbQuery('Выберите договор из списка');
        return;
      }

      const contractId = callbackData.replace('contract_', '');
      
      // Проверяем, что договор есть в списке
      const contract = ctx.session.userContracts?.find(c => c.id === contractId);
      if (!contract) {
        await ctx.answerCbQuery('Договор не найден');
        return;
      }

      // Сохраняем ID договора
      ctx.session.actData!.contractId = contractId;
      await ctx.answerCbQuery('Договор выбран');
      await ctx.deleteMessage();

      // Переход к выбору типа акта
      await ctx.reply(
        actMessages.step2_actType,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(actMessages.actTypeButtons.acceptance, 'act_type_acceptance')],
            [Markup.button.callback(actMessages.actTypeButtons.transfer, 'act_type_transfer')],
          ]),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createActScene Шаг 1] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 2: Выбор типа акта
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;
      
      if (!callbackData.startsWith('act_type_')) {
        await ctx.answerCbQuery('Выберите тип акта');
        return;
      }

      const actType = callbackData === 'act_type_acceptance' ? 'acceptance' : 'transfer';
      
      // Сохраняем тип акта
      ctx.session.actData!.actType = actType as 'acceptance' | 'transfer';
      ctx.session.actData!.actDate = new Date();
      
      await ctx.answerCbQuery(actType === 'acceptance' ? 'Акт приема' : 'Акт передачи');
      await ctx.deleteMessage();

      // Переход к добавлению инвентаря
      await ctx.reply(actMessages.step3_inventory, { parse_mode: 'HTML' });
      
      // Показываем текущий (пустой) список
      await ctx.reply(
        actMessages.currentInventoryList([]),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(actMessages.inventoryButtons.finish, 'inventory_finish')],
          ]),
        }
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[createActScene Шаг 2] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  },

  // =========================================
  // ШАГ 3: Добавление инвентарных пунктов
  // =========================================
  async (ctx) => {
    try {
      // Обработка callback-кнопок
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const callbackData = ctx.callbackQuery.data;

        if (callbackData === 'inventory_finish') {
          const inventoryList = getInventoryList(ctx);
          
          if (inventoryList.length === 0) {
            await ctx.answerCbQuery('Добавьте хотя бы один пункт');
            return;
          }

          await ctx.answerCbQuery('Завершаем...');
          await ctx.deleteMessage();

          // Переход к подтверждению
          await ctx.reply(
            actMessages.step4_confirm(inventoryList.length),
            {
              parse_mode: 'HTML',
              ...Markup.inlineKeyboard([
                [Markup.button.callback(actMessages.meterButtons.withMeters, 'add_meters')],
                [Markup.button.callback(actMessages.meterButtons.withoutMeters, 'skip_meters')],
              ]),
            }
          );

          return ctx.wizard.next();
        }

        if (callbackData === 'inventory_remove_last') {
          const inventoryList = getInventoryList(ctx);
          if (inventoryList.length > 0) {
            inventoryList.pop();
            await ctx.answerCbQuery('Последний пункт удален');
          } else {
            await ctx.answerCbQuery('Список пуст');
          }
          return;
        }

        return;
      }

      // Обработка текстового ввода
      if (!ctx.message || !('text' in ctx.message)) {
        return;
      }

      const input = ctx.message.text.trim();

      // Проверка на команду завершения
      if (input.toLowerCase() === 'готово') {
        const inventoryList = getInventoryList(ctx);
        
        if (inventoryList.length === 0) {
          await ctx.reply('❌ Добавьте хотя бы один пункт перед завершением');
          return;
        }

        // Переход к подтверждению
        await ctx.reply(
          actMessages.step4_confirm(inventoryList.length),
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback(actMessages.meterButtons.withMeters, 'add_meters')],
              [Markup.button.callback(actMessages.meterButtons.withoutMeters, 'skip_meters')],
            ]),
          }
        );

        return ctx.wizard.next();
      }

      // Парсинг инвентарного пункта
      const parsedItem = parseInventoryItem(input);
      
      if (!parsedItem) {
        await ctx.reply(actMessages.invalidInventoryFormat);
        return;
      }

      // Валидация через Zod
      const validation = inventoryItemSchema.safeParse(parsedItem);
      
      if (!validation.success) {
        await ctx.reply(validation.error.errors[0].message);
        return;
      }

      // Добавляем в список
      const inventoryList = getInventoryList(ctx);
      inventoryList.push(validation.data);

      await ctx.reply(actMessages.itemAdded);

      // Показываем обновленный список
      await ctx.reply(
        actMessages.currentInventoryList(inventoryList),
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(actMessages.inventoryButtons.finish, 'inventory_finish')],
            [Markup.button.callback(actMessages.inventoryButtons.removeLast, 'inventory_remove_last')],
          ]),
        }
      );
    } catch (error) {
      console.error('[createActScene Шаг 3] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
    }
  },

  // =========================================
  // ШАГ 4: Показания счетчиков (опционально)
  // =========================================
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        return;
      }

      const callbackData = ctx.callbackQuery.data;

      if (callbackData === 'skip_meters') {
        await ctx.answerCbQuery('Пропускаем счетчики');
        await ctx.deleteMessage();
        
        // Переходим к созданию акта
        return createActAndFinish(ctx);
      }

      if (callbackData === 'add_meters') {
        await ctx.answerCbQuery('Добавляем счетчики');
        await ctx.deleteMessage();
        
        await ctx.reply(actMessages.enterMeters, { parse_mode: 'HTML' });
        
        // Устанавливаем флаг ожидания счетчиков
        ctx.wizard.state.waitingForMeters = true;
        return;
      }

      // Если ожидаем ввод счетчиков
      if (ctx.wizard.state.waitingForMeters) {
        if (!ctx.message || !('text' in ctx.message)) {
          return;
        }

        const meterInput = ctx.message.text.trim();
        
        // Простой парсинг показаний
        const meterReadings: { electricity?: number; water?: number; gas?: number } = {};
        
        const elecMatch = meterInput.match(/[Ээ]лектричество[:\s]*(\d+)/);
        if (elecMatch) meterReadings.electricity = parseInt(elecMatch[1], 10);
        
        const waterMatch = meterInput.match(/[Вв]ода[:\s]*(\d+)/);
        if (waterMatch) meterReadings.water = parseInt(waterMatch[1], 10);
        
        const gasMatch = meterInput.match(/[Гг]аз[:\s]*(\d+)/);
        if (gasMatch) meterReadings.gas = parseInt(gasMatch[1], 10);

        ctx.session.actData!.meterReadings = meterReadings;
        delete ctx.wizard.state.waitingForMeters;

        // Переходим к созданию акта
        return createActAndFinish(ctx);
      }
    } catch (error) {
      console.error('[createActScene Шаг 4] Ошибка:', error);
      await ctx.reply(commonMessages.serverError);
      return ctx.scene.leave();
    }
  }
);

// =========================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ СОЗДАНИЯ АКТА
// =========================================

async function createActAndFinish(ctx: ContractWizardContext): Promise<void> {
  try {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      await ctx.reply(commonMessages.serverError);
      clearSessionData(ctx);
      ctx.scene.leave();
      return;
    }

    // Формируем данные для создания
    const actData = {
      contractId: ctx.session.actData!.contractId!,
      userId,
      actType: ctx.session.actData!.actType!,
      actDate: ctx.session.actData!.actDate!,
      inventoryItems: ctx.session.tempInventoryItems || [],
      meterReadings: ctx.session.actData!.meterReadings,
    };

    // Создаем акт через сервис
    const result = await ContractService.createAct(actData);

    if (!result.success) {
      await ctx.reply(`${actMessages.error}\n${result.error}`);
      clearSessionData(ctx);
      ctx.scene.leave();
      return;
    }

    // Успешное создание
    await ctx.reply(
      actMessages.success(result.data!.id!),
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📥 Скачать акт', `download_act_${result.data!.id}`)],
        ]),
      }
    );

    clearSessionData(ctx);
    ctx.scene.leave();
  } catch (error) {
    console.error('[createActScene createActAndFinish] Ошибка:', error);
    await ctx.reply(commonMessages.serverError);
    clearSessionData(ctx);
    ctx.scene.leave();
  }
}

// =========================================
// MIDDLEWARE ДЛЯ СЦЕНЫ
// =========================================

/**
 * Обработка команды отмены
 */
createActScene.command('cancel', async (ctx) => {
  await ctx.reply(actMessages.cancelled);
  clearSessionData(ctx);
  return ctx.scene.leave();
});

/**
 * Обработка текстовых сообщений на шаге 4 (счетчики)
 */
createActScene.on('message', async (ctx, next) => {
  // Если мы на шаге 4 и ожидаем счетчики
  if (ctx.wizard.cursor === 3 && ctx.wizard.state.waitingForMeters) {
    if (!ctx.message || !('text' in ctx.message)) {
      return;
    }

    const meterInput = ctx.message.text.trim();
    
    // Парсинг показаний
    const meterReadings: { electricity?: number; water?: number; gas?: number } = {};
    
    const elecMatch = meterInput.match(/[Ээ]лектричество[:\s]*(\d+)/i);
    if (elecMatch) meterReadings.electricity = parseInt(elecMatch[1], 10);
    
    const waterMatch = meterInput.match(/[Вв]ода[:\s]*(\d+)/i);
    if (waterMatch) meterReadings.water = parseInt(waterMatch[1], 10);
    
    const gasMatch = meterInput.match(/[Гг]аз[:\s]*(\d+)/i);
    if (gasMatch) meterReadings.gas = parseInt(gasMatch[1], 10);

    ctx.session.actData!.meterReadings = meterReadings;
    delete ctx.wizard.state.waitingForMeters;

    // Создаем акт
    return createActAndFinish(ctx);
  }

  return next();
});

// Экспорт сцены
export default createActScene;
