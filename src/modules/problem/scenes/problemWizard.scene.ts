/**
 * Сцена мастера решения проблем
 * RentierGuard Bot
 */

import { Composer, Markup, Scenes } from 'telegraf';
import {
  ProblemType,
  ProblemTypeLabels,
  ProblemContext,
  NonPaymentData,
  DamageData,
  EvictionData,
  ProblemData,
} from '../types';
import {
  wizardStepMessages,
  courtInstructionsMessage,
  peacefulResolutionMessage,
  inlineKeyboardLabels,
  getProblemTypeMessage,
} from '../templates/messages';
import { getProblemScenario, generateClaimText, generateTerminationLetter } from '../services/problem.service';
import { validateDebtAmount, validateDays } from '../validators';

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка контекста сессии
 */
function ensureSession(ctx: ProblemContext): void {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.problemData) {
    ctx.session.problemData = {};
  }
}

/**
 * Очистка данных сессии
 */
function clearSession(ctx: ProblemContext): void {
  ctx.session.problemData = undefined;
  ctx.session.selectedProblemType = undefined;
  ctx.session.generatedClaim = undefined;
}

// ============================================
// INLINE KEYBOARDS
// ============================================

/**
 * Клавиатура выбора типа проблемы
 */
const problemTypeKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback(ProblemTypeLabels[ProblemType.NON_PAYMENT], `problem_type:${ProblemType.NON_PAYMENT}`),
  ],
  [
    Markup.button.callback(ProblemTypeLabels[ProblemType.PROPERTY_DAMAGE], `problem_type:${ProblemType.PROPERTY_DAMAGE}`),
  ],
  [
    Markup.button.callback(ProblemTypeLabels[ProblemType.EVICTION_WITHOUT_PAY], `problem_type:${ProblemType.EVICTION_WITHOUT_PAY}`),
  ],
  [
    Markup.button.callback(ProblemTypeLabels[ProblemType.OTHER], `problem_type:${ProblemType.OTHER}`),
  ],
  [
    Markup.button.callback('❌ Отмена', 'problem:cancel'),
  ],
]);

/**
 * Клавиатура подтверждения данных
 */
const confirmDataKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Всё верно', 'problem:confirm_data'),
    Markup.button.callback('✏️ Изменить', 'problem:edit_data'),
  ],
  [
    Markup.button.callback('❌ Отмена', 'problem:cancel'),
  ],
]);

/**
 * Клавиатура действий с претензией
 */
const claimActionsKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('📋 Копировать текст', 'problem:copy_claim'),
  ],
  [
    Markup.button.callback('🤝 Мирное урегулирование', 'problem:peaceful'),
    Markup.button.callback('⚖️ Подготовка к суду', 'problem:court'),
  ],
  [
    Markup.button.callback('🚫 В чёрный список', 'problem:to_bad_tenant'),
    Markup.button.callback('🏠 Главное меню', 'problem:main_menu'),
  ],
]);

/**
 * Клавиатура инструкций
 */
const instructionsKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('📄 Сгенерировать уведомление', 'problem:termination_notice'),
  ],
  [
    Markup.button.callback('🔄 Новая проблема', 'problem:new'),
    Markup.button.callback('🏠 Главное меню', 'problem:main_menu'),
  ],
]);

// ============================================
// ШАГ 1: ВЫБОР ТИПА ПРОБЛЕМЫ
// ============================================

const step1 = new Composer<ProblemContext>();

// Обработка команды входа в сцену
step1.command('problem', async (ctx) => {
  ensureSession(ctx);
  clearSession(ctx);
  
  await ctx.reply(
    wizardStepMessages.step1.prompt,
    {
      parse_mode: 'HTML',
      ...problemTypeKeyboard,
    }
  );
  
  return ctx.wizard.next();
});

// Обработка callback выбора типа
step1.action(/problem_type:(.+)/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const problemType = ctx.match[1] as ProblemType;
    
    ensureSession(ctx);
    ctx.session.selectedProblemType = problemType;
    ctx.session.problemData = { type: problemType };
    
    // Переходим к следующему шагу
    const step2Message = wizardStepMessages.step2[problemType];
    
    await ctx.editMessageText(
      step2Message.prompt,
      { parse_mode: 'HTML' }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in step1 action:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте начать заново с команды /problem');
    return ctx.scene.leave();
  }
});

// Отмена
step1.action('problem:cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageText('❌ Операция отменена');
  clearSession(ctx);
  return ctx.scene.leave();
});

// ============================================
// ШАГ 2: СБОР ДАННЫХ
// ============================================

const step2 = new Composer<ProblemContext>();

// Обработка текстового ввода данных
step2.on('text', async (ctx) => {
  try {
    ensureSession(ctx);
    
    const problemType = ctx.session.selectedProblemType;
    const text = ctx.message.text.trim();
    
    if (!problemType) {
      await ctx.reply('❌ Ошибка: тип проблемы не выбран. Начните заново с /problem');
      return ctx.scene.leave();
    }
    
    // Парсим данные в зависимости от типа проблемы
    let parsedData: Partial<NonPaymentData | DamageData | EvictionData | ProblemData> = {
      type: problemType,
    };
    
    let validationError: string | null = null;
    
    switch (problemType) {
      case ProblemType.NON_PAYMENT: {
        // Парсим сумму и дни
        const lines = text.split('\n');
        let debtAmount: number | null = null;
        let delayDays: number | null = null;
        
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('сумма') || lowerLine.includes('долг')) {
            const amountMatch = line.match(/[\d\s]+/);
            if (amountMatch) {
              const validation = validateDebtAmount(amountMatch[0]);
              if (validation.success) {
                debtAmount = validation.value;
              }
            }
          }
          if (lowerLine.includes('дней') || lowerLine.includes('просрочка')) {
            const daysMatch = line.match(/\d+/);
            if (daysMatch) {
              const validation = validateDays(daysMatch[0]);
              if (validation.success) {
                delayDays = validation.value;
              }
            }
          }
        }
        
        // Если не нашли в формате ключ: значение, пробуем просто числа
        if (debtAmount === null) {
          const amountMatch = text.match(/^(\d[\d\s]*)/);
          if (amountMatch) {
            const validation = validateDebtAmount(amountMatch[1]);
            if (validation.success) {
              debtAmount = validation.value;
            }
          }
        }
        
        if (debtAmount === null) {
          validationError = '❌ Не удалось распознать сумму долга. Укажите число, например: 50000';
        } else {
          parsedData = {
            ...parsedData,
            debtAmount,
            delayDays: delayDays || 1,
          } as NonPaymentData;
        }
        break;
      }
      
      case ProblemType.PROPERTY_DAMAGE: {
        // Парсим описание и стоимость
        const lines = text.split('\n');
        let damageDescription = '';
        let repairCost: number | null = null;
        
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('повреждения') || lowerLine.includes('описание')) {
            damageDescription = line.split(':')[1]?.trim() || line;
          }
          if (lowerLine.includes('ремонт') || lowerLine.includes('стоимость')) {
            const costMatch = line.match(/[\d\s]+/);
            if (costMatch) {
              const validation = validateDebtAmount(costMatch[0]);
              if (validation.success) {
                repairCost = validation.value;
              }
            }
          }
        }
        
        // Если не нашли в формате ключ: значение
        if (!damageDescription) {
          // Первые строки - описание, последняя с числом - стоимость
          const lastLine = lines[lines.length - 1];
          const costMatch = lastLine.match(/^(\d[\d\s]*)$/);
          if (costMatch) {
            const validation = validateDebtAmount(costMatch[1]);
            if (validation.success) {
              repairCost = validation.value;
              damageDescription = lines.slice(0, -1).join('\n');
            }
          }
          if (!repairCost) {
            damageDescription = text;
          }
        }
        
        if (damageDescription.length < 10) {
          validationError = '❌ Описание повреждений слишком короткое. Опишите подробнее.';
        } else if (repairCost === null) {
          validationError = '❌ Укажите стоимость ремонта числом в конце сообщения.';
        } else {
          parsedData = {
            ...parsedData,
            damageDescription,
            repairCost,
            photosAvailable: false,
            inventoryListAvailable: false,
          } as DamageData;
        }
        break;
      }
      
      case ProblemType.EVICTION_WITHOUT_PAY: {
        // Парсим долг, дату выезда, ключи
        const lines = text.split('\n');
        let debtAmount: number | null = null;
        let evictionDate = '';
        let keysReturned = false;
        
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('долг') || lowerLine.includes('сумма')) {
            const amountMatch = line.match(/[\d\s]+/);
            if (amountMatch) {
              const validation = validateDebtAmount(amountMatch[0]);
              if (validation.success) {
                debtAmount = validation.value;
              }
            }
          }
          if (lowerLine.includes('дата')) {
            const dateMatch = line.match(/(\d{2}[.\/]\d{2}[.\/]\d{4})/);
            if (dateMatch) {
              evictionDate = dateMatch[1].replace(/\//g, '.');
            }
          }
          if (lowerLine.includes('ключи')) {
            keysReturned = lowerLine.includes('да') || lowerLine.includes('верну');
          }
        }
        
        if (debtAmount === null) {
          validationError = '❌ Не удалось распознать сумму долга.';
        } else if (!evictionDate) {
          validationError = '❌ Укажите дату выезда в формате ДД.ММ.ГГГГ';
        } else {
          parsedData = {
            ...parsedData,
            debtAmount,
            evictionDate,
            keysReturned,
          } as EvictionData;
        }
        break;
      }
      
      case ProblemType.OTHER: {
        if (text.length < 10) {
          validationError = '❌ Описание слишком короткое. Расскажите подробнее о проблеме.';
        } else {
          parsedData = {
            ...parsedData,
            description: text,
          } as ProblemData;
        }
        break;
      }
    }
    
    if (validationError) {
      await ctx.reply(validationError);
      return; // Остаёмся на том же шаге
    }
    
    // Сохраняем данные
    ctx.session.problemData = { ...ctx.session.problemData, ...parsedData };
    
    // Формируем сводку для подтверждения
    const summary = formatDataSummary(ctx.session.problemData as ProblemDetails);
    
    await ctx.reply(
      wizardStepMessages.step3.prompt(summary),
      {
        parse_mode: 'HTML',
        ...confirmDataKeyboard,
      }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in step2:', error);
    await ctx.reply('❌ Произошла ошибка при обработке данных. Попробуйте ещё раз.');
  }
});

// ============================================
// ШАГ 3: ПОДТВЕРЖДЕНИЕ ДАННЫХ
// ============================================

const step3 = new Composer<ProblemContext>();

// Подтверждение данных
step3.action('problem:confirm_data', async (ctx) => {
  try {
    await ctx.answerCbQuery('Генерирую претензию...');
    
    ensureSession(ctx);
    
    const problemType = ctx.session.selectedProblemType;
    const problemData = ctx.session.problemData as ProblemDetails;
    
    if (!problemType || !problemData) {
      await ctx.editMessageText('❌ Ошибка: данные не найдены. Начните заново с /problem');
      return ctx.scene.leave();
    }
    
    // Генерируем претензию
    const result = generateClaimText(problemData, problemType);
    
    if (!result.success || !result.claim) {
      await ctx.editMessageText(
        `❌ Не удалось сгенерировать претензию: ${result.error || 'Неизвестная ошибка'}`
      );
      return ctx.scene.leave();
    }
    
    // Сохраняем сгенерированную претензию
    ctx.session.generatedClaim = result.claim;
    
    // Отправляем претензию
    await ctx.editMessageText(
      `<b>✅ Претензия сгенерирована!</b>\n\n<pre>${result.claim.content}</pre>`,
      {
        parse_mode: 'HTML',
        ...claimActionsKeyboard,
      }
    );
    
    return ctx.wizard.next();
  } catch (error) {
    console.error('Error in step3 confirm:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    return ctx.scene.leave();
  }
});

// Редактирование данных
step3.action('problem:edit_data', async (ctx) => {
  await ctx.answerCbQuery();
  
  ensureSession(ctx);
  const problemType = ctx.session.selectedProblemType;
  
  if (!problemType) {
    await ctx.editMessageText('❌ Ошибка. Начните заново с /problem');
    return ctx.scene.leave();
  }
  
  const step2Message = wizardStepMessages.step2[problemType];
  
  await ctx.editMessageText(
    `✏️ <b>Изменение данных</b>\n\n${step2Message.prompt}`,
    { parse_mode: 'HTML' }
  );
  
  // Возвращаемся на шаг 2
  return ctx.wizard.back();
});

// Отмена
step3.action('problem:cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageText('❌ Операция отменена');
  clearSession(ctx);
  return ctx.scene.leave();
});

// ============================================
// ШАГ 4: ДЕЙСТВИЯ С ПРЕТЕНЗИЕЙ
// ============================================

const step4 = new Composer<ProblemContext>();

// Копировать текст
step4.action('problem:copy_claim', async (ctx) => {
  await ctx.answerCbQuery('Текст скопирован!');
  
  ensureSession(ctx);
  const claim = ctx.session.generatedClaim;
  
  if (claim) {
    await ctx.reply(
      '📋 <b>Текст претензии для копирования:</b>\n\n' +
      '<code>' + claim.content + '</code>\n\n' +
      '<i>Нажмите на текст выше, чтобы скопировать его</i>',
      { parse_mode: 'HTML' }
    );
  }
});

// Мирное урегулирование
step4.action('problem:peaceful', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.editMessageText(
    peacefulResolutionMessage,
    {
      parse_mode: 'HTML',
      ...instructionsKeyboard,
    }
  );
  
  return ctx.wizard.next();
});

// Подготовка к суду
step4.action('problem:court', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.editMessageText(
    courtInstructionsMessage,
    {
      parse_mode: 'HTML',
      ...instructionsKeyboard,
    }
  );
  
  return ctx.wizard.next();
});

// Добавить в чёрный список
step4.action('problem:to_bad_tenant', async (ctx) => {
  await ctx.answerCbQuery('Переходим к добавлению...');
  
  ensureSession(ctx);
  clearSession(ctx);
  
  // Переходим в сцену чёрного списка
  await ctx.reply('🚫 Переходим к добавлению в чёрный список...');
  return ctx.scene.enter('bad-tenant-wizard');
});

// Главное меню
step4.action('problem:main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  clearSession(ctx);
  await ctx.editMessageText('🏠 Возвращаемся в главное меню...');
  return ctx.scene.leave();
});

// ============================================
// ШАГ 5: ИНСТРУКЦИИ
// ============================================

const step5 = new Composer<ProblemContext>();

// Генерация уведомления о расторжении
step5.action('problem:termination_notice', async (ctx) => {
  try {
    await ctx.answerCbQuery('Генерирую уведомление...');
    
    ensureSession(ctx);
    
    const problemData = ctx.session.problemData;
    const problemType = ctx.session.selectedProblemType;
    
    if (!problemData || !problemType) {
      await ctx.reply('❌ Данные не найдены. Начните заново с /problem');
      return ctx.scene.leave();
    }
    
    // Формируем причину расторжения
    const reason = getTerminationReason(problemType, problemData);
    
    const result = generateTerminationLetter(problemData, reason);
    
    if (!result.success || !result.claim) {
      await ctx.reply(`❌ Ошибка генерации: ${result.error}`);
      return;
    }
    
    await ctx.reply(
      `<b>📄 Уведомление о расторжении договора</b>\n\n<pre>${result.claim.content}</pre>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📋 Копировать', 'problem:copy_termination')],
          [Markup.button.callback('🏠 Главное меню', 'problem:main_menu')],
        ]),
      }
    );
  } catch (error) {
    console.error('Error generating termination notice:', error);
    await ctx.reply('❌ Ошибка при генерации уведомления');
  }
});

// Копировать уведомление
step5.action('problem:copy_termination', async (ctx) => {
  await ctx.answerCbQuery();
  // Логика копирования аналогична копированию претензии
});

// Новая проблема
step5.action('problem:new', async (ctx) => {
  await ctx.answerCbQuery();
  clearSession(ctx);
  await ctx.editMessageText('🔄 Начинаем заново...');
  return ctx.scene.reenter();
});

// Главное меню
step5.action('problem:main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  clearSession(ctx);
  await ctx.editMessageText('🏠 Возвращаемся в главное меню...');
  return ctx.scene.leave();
});

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Форматировать сводку данных для подтверждения
 */
function formatDataSummary(data: ProblemDetails): string {
  const lines: string[] = [];
  
  lines.push(`<b>Тип проблемы:</b> ${getProblemTypeMessage(data.type)}`);
  
  switch (data.type) {
    case ProblemType.NON_PAYMENT: {
      const d = data as NonPaymentData;
      lines.push(`<b>Сумма долга:</b> ${d.debtAmount?.toLocaleString('ru-RU')} ₽`);
      lines.push(`<b>Срок просрочки:</b> ${d.delayDays} дней`);
      break;
    }
    case ProblemType.PROPERTY_DAMAGE: {
      const d = data as DamageData;
      lines.push(`<b>Описание:</b> ${d.damageDescription.slice(0, 100)}${d.damageDescription.length > 100 ? '...' : ''}`);
      lines.push(`<b>Стоимость ремонта:</b> ${d.repairCost?.toLocaleString('ru-RU')} ₽`);
      break;
    }
    case ProblemType.EVICTION_WITHOUT_PAY: {
      const d = data as EvictionData;
      lines.push(`<b>Сумма долга:</b> ${d.debtAmount?.toLocaleString('ru-RU')} ₽`);
      lines.push(`<b>Дата выезда:</b> ${d.evictionDate}`);
      lines.push(`<b>Ключи возвращены:</b> ${d.keysReturned ? 'Да' : 'Нет'}`);
      break;
    }
    case ProblemType.OTHER: {
      const d = data as ProblemData;
      lines.push(`<b>Описание:</b> ${(d as any).description?.slice(0, 100)}${(d as any).description?.length > 100 ? '...' : ''}`);
      break;
    }
  }
  
  return lines.join('\n');
}

/**
 * Получить причину расторжения в зависимости от типа проблемы
 */
function getTerminationReason(type: ProblemType, data: ProblemDetails): string {
  switch (type) {
    case ProblemType.NON_PAYMENT: {
      const d = data as NonPaymentData;
      return `Неуплата арендной платы в течение ${d.delayDays} дней. ` +
        `Задолженность составляет ${d.debtAmount?.toLocaleString('ru-RU')} рублей. ` +
        'Данное обстоятельство является существенным нарушением договора аренды.';
    }
    case ProblemType.PROPERTY_DAMAGE: {
      const d = data as DamageData;
      return `Причинение ущерба арендуемому имуществу. ` +
        `Стоимость повреждений составляет ${d.repairCost?.toLocaleString('ru-RU')} рублей. ` +
        'Арендатор не возместил причинённый ущерб.';
    }
    case ProblemType.EVICTION_WITHOUT_PAY: {
      const d = data as EvictionData;
      return `Самовольный выезд из арендуемого помещения с задолженностью ` +
        `в размере ${d.debtAmount?.toLocaleString('ru-RU')} рублей. ` +
        'Арендатор не исполнил обязательства по оплате.';
    }
    default:
      return 'Существенное нарушение условий договора аренды.';
  }
}

// ============================================
// СОЗДАНИЕ СЦЕНЫ
// ============================================

export const problemWizardScene = new Scenes.WizardScene<ProblemContext>(
  'problem-wizard',
  step1,
  step2,
  step3,
  step4,
  step5
);

// Middleware для входа в сцену
problemWizardScene.enter(async (ctx) => {
  ensureSession(ctx);
  clearSession(ctx);
  
  await ctx.reply(
    wizardStepMessages.step1.prompt,
    {
      parse_mode: 'HTML',
      ...problemTypeKeyboard,
    }
  );
});

// Обработка выхода из сцены
problemWizardScene.leave(async (ctx) => {
  // Данные очищаются при выходе
});

// Обработка ошибок сцены
problemWizardScene.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error in problem wizard:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте начать заново с команды /problem');
    clearSession(ctx);
    return ctx.scene.leave();
  }
});

export default problemWizardScene;
