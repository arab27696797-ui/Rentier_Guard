/**
 * ============================================
 * RentierGuard - Сцена экспорта данных за год
 * Команда /export_year
 * ============================================
 */

import { Scenes, Markup } from 'telegraf';
import { MyContext } from '../../../types/context';
import { ExportFormat, YearExportData } from '../types';
import { documentMessages } from '../templates/messages';

/**
 * Состояния сцены экспорта
 */
enum ExportStep {
  YEAR_INPUT = 0,
  FORMAT_SELECTION = 1,
  GENERATION = 2,
}

/**
 * Интерфейс состояния сцены
 */
interface ExportSceneState {
  step: ExportStep;
  year?: number;
  format?: ExportFormat;
  includeContracts?: boolean;
  includePayments?: boolean;
  includeExpenses?: boolean;
}

/**
 * Сцена экспорта данных за год
 * Шаг 1: Ввод года
 * Шаг 2: Выбор формата (CSV/PDF)
 * Шаг 3: Генерация и отправка файла
 */
export const exportYearScene = new Scenes.WizardScene<MyContext>(
  'export_year',
  
  // ========== ШАГ 1: Ввод года ==========
  async (ctx) => {
    try {
      // Инициализация состояния
      ctx.wizard.state = {
        step: ExportStep.YEAR_INPUT,
      } as ExportSceneState;

      // Получаем текущий год
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // Отправляем приветственное сообщение с кнопками быстрого выбора
      await ctx.reply(
        documentMessages.exportYear.welcome,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(String(currentYear), `year_${currentYear}`),
            Markup.button.callback(String(previousYear), `year_${previousYear}`),
          ],
          [Markup.button.callback('❌ Отмена', 'cancel_export')],
        ])
      );

      await ctx.reply(documentMessages.exportYear.enterYear);
      
      return ctx.wizard.next();
    } catch (error) {
      console.error('[ExportYearScene] Ошибка на шаге 1:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 2: Выбор формата ==========
  async (ctx) => {
    try {
      const state = ctx.wizard.state as ExportSceneState;
      
      // Обработка текстового ввода года
      if (ctx.message && 'text' in ctx.message) {
        const yearText = ctx.message.text.trim();
        
        // Проверка на отмену
        if (yearText.toLowerCase() === 'отмена' || yearText.toLowerCase() === 'cancel') {
          await ctx.reply(documentMessages.exportYear.cancelled);
          return ctx.scene.leave();
        }

        // Парсинг года
        const year = parseInt(yearText, 10);
        const currentYear = new Date().getFullYear();
        
        if (isNaN(year) || year < 2000 || year > currentYear + 1) {
          await ctx.reply(
            documentMessages.exportYear.invalidYear,
            Markup.inlineKeyboard([
              [Markup.button.callback(String(currentYear), `year_${currentYear}`)],
              [Markup.button.callback(String(currentYear - 1), `year_${currentYear - 1}`)],
            ])
          );
          return; // Остаемся на текущем шаге
        }

        state.year = year;
      }

      // Проверка, что год установлен
      if (!state.year) {
        await ctx.reply(documentMessages.exportYear.enterYear);
        return;
      }

      state.step = ExportStep.FORMAT_SELECTION;

      // Предлагаем выбрать формат
      await ctx.reply(
        documentMessages.exportYear.selectFormat(state.year),
        Markup.inlineKeyboard([
          [
            Markup.button.callback('📊 CSV (Excel)', 'format_csv'),
            Markup.button.callback('📄 PDF', 'format_pdf'),
          ],
          [Markup.button.callback('◀️ Назад', 'back_to_year')],
          [Markup.button.callback('❌ Отмена', 'cancel_export')],
        ])
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[ExportYearScene] Ошибка на шаге 2:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 3: Выбор данных для экспорта ==========
  async (ctx) => {
    try {
      const state = ctx.wizard.state as ExportSceneState;

      // Инициализация флагов включения данных
      state.includeContracts = true;
      state.includePayments = true;
      state.includeExpenses = true;

      state.step = ExportStep.GENERATION;

      // Предлагаем выбрать данные для включения
      await ctx.reply(
        documentMessages.exportYear.selectData,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Договоры', 'toggle_contracts'),
            Markup.button.callback('✅ Платежи', 'toggle_payments'),
          ],
          [Markup.button.callback('✅ Расходы', 'toggle_expenses')],
          [Markup.button.callback('▶️ Продолжить', 'proceed_export')],
          [Markup.button.callback('◀️ Назад', 'back_to_format')],
          [Markup.button.callback('❌ Отмена', 'cancel_export')],
        ])
      );

      return ctx.wizard.next();
    } catch (error) {
      console.error('[ExportYearScene] Ошибка на шаге 3:', error);
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      return ctx.scene.leave();
    }
  },

  // ========== ШАГ 4: Генерация и отправка ==========
  async (ctx) => {
    try {
      const state = ctx.wizard.state as ExportSceneState;

      // Проверка, что все необходимые данные есть
      if (!state.year || !state.format) {
        await ctx.reply('❌ Ошибка: не все данные выбраны. Начните заново.');
        return ctx.scene.leave();
      }

      // Отправляем сообщение о начале генерации
      const processingMessage = await ctx.reply(
        documentMessages.exportYear.generating(state.year, state.format)
      );

      // Формируем данные для экспорта
      const exportData: YearExportData = {
        year: state.year,
        format: state.format,
        userId: ctx.from?.id || 0,
        includeContracts: state.includeContracts,
        includePayments: state.includePayments,
        includeExpenses: state.includeExpenses,
      };

      try {
        // Генерация файла (заглушка - здесь должен быть вызов сервиса)
        const generatedFile = await generateExportFile(exportData, ctx);

        // Удаляем сообщение о генерации
        await ctx.deleteMessage(processingMessage.message_id).catch(() => {});

        // Отправляем файл
        await ctx.replyWithDocument(
          { source: generatedFile.buffer, filename: generatedFile.filename },
          { caption: documentMessages.exportYear.success(state.year) }
        );

        // Логирование
        console.log(`[ExportYearScene] Экспорт выполнен: user=${exportData.userId}, year=${exportData.year}, format=${exportData.format}`);

      } catch (genError) {
        // Удаляем сообщение о генерации
        await ctx.deleteMessage(processingMessage.message_id).catch(() => {});
        
        console.error('[ExportYearScene] Ошибка генерации:', genError);
        await ctx.reply(
          documentMessages.exportYear.error(
            genError instanceof Error ? genError.message : 'Неизвестная ошибка'
          )
        );
      }

      return ctx.scene.leave();
    } catch (error) {
      console.error('[ExportYearScene] Ошибка на шаге 4:', error);
      await ctx.reply('❌ Произошла ошибка при генерации файла.');
      return ctx.scene.leave();
    }
  }
);

// ========== ОБРАБОТЧИКИ INLINE КНОПОК ==========

/**
 * Обработчик выбора года через кнопку
 */
exportYearScene.action(/year_(\d{4})/, async (ctx) => {
  try {
    const year = parseInt(ctx.match[1], 10);
    const state = ctx.wizard.state as ExportSceneState;
    state.year = year;

    await ctx.answerCbQuery(`Выбран год: ${year}`);
    await ctx.deleteMessage();

    // Переходим к выбору формата
    state.step = ExportStep.FORMAT_SELECTION;
    
    await ctx.reply(
      documentMessages.exportYear.selectFormat(year),
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 CSV (Excel)', 'format_csv'),
          Markup.button.callback('📄 PDF', 'format_pdf'),
        ],
        [Markup.button.callback('◀️ Назад', 'back_to_year')],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );

    // Переходим на следующий шаг
    ctx.wizard.selectStep(2);
  } catch (error) {
    console.error('[ExportYearScene] Ошибка выбора года:', error);
    await ctx.answerCbQuery('Ошибка выбора года');
  }
});

/**
 * Обработчик выбора формата CSV
 */
exportYearScene.action('format_csv', async (ctx) => {
  try {
    const state = ctx.wizard.state as ExportSceneState;
    state.format = ExportFormat.CSV;

    await ctx.answerCbQuery('Выбран формат CSV');
    await ctx.deleteMessage();

    // Переходим к выбору данных
    await ctx.reply(
      documentMessages.exportYear.selectData,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Договоры', 'toggle_contracts'),
          Markup.button.callback('✅ Платежи', 'toggle_payments'),
        ],
        [Markup.button.callback('✅ Расходы', 'toggle_expenses')],
        [Markup.button.callback('▶️ Продолжить', 'proceed_export')],
        [Markup.button.callback('◀️ Назад', 'back_to_format')],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );

    ctx.wizard.selectStep(3);
  } catch (error) {
    console.error('[ExportYearScene] Ошибка выбора формата:', error);
    await ctx.answerCbQuery('Ошибка выбора формата');
  }
});

/**
 * Обработчик выбора формата PDF
 */
exportYearScene.action('format_pdf', async (ctx) => {
  try {
    const state = ctx.wizard.state as ExportSceneState;
    state.format = ExportFormat.PDF;

    await ctx.answerCbQuery('Выбран формат PDF');
    await ctx.deleteMessage();

    // Переходим к выбору данных
    await ctx.reply(
      documentMessages.exportYear.selectData,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Договоры', 'toggle_contracts'),
          Markup.button.callback('✅ Платежи', 'toggle_payments'),
        ],
        [Markup.button.callback('✅ Расходы', 'toggle_expenses')],
        [Markup.button.callback('▶️ Продолжить', 'proceed_export')],
        [Markup.button.callback('◀️ Назад', 'back_to_format')],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );

    ctx.wizard.selectStep(3);
  } catch (error) {
    console.error('[ExportYearScene] Ошибка выбора формата:', error);
    await ctx.answerCbQuery('Ошибка выбора формата');
  }
});

/**
 * Обработчики переключения данных
 */
exportYearScene.action('toggle_contracts', async (ctx) => {
  const state = ctx.wizard.state as ExportSceneState;
  state.includeContracts = !state.includeContracts;
  await updateDataSelectionMessage(ctx, state);
  await ctx.answerCbQuery(state.includeContracts ? 'Договоры включены' : 'Договоры исключены');
});

exportYearScene.action('toggle_payments', async (ctx) => {
  const state = ctx.wizard.state as ExportSceneState;
  state.includePayments = !state.includePayments;
  await updateDataSelectionMessage(ctx, state);
  await ctx.answerCbQuery(state.includePayments ? 'Платежи включены' : 'Платежи исключены');
});

exportYearScene.action('toggle_expenses', async (ctx) => {
  const state = ctx.wizard.state as ExportSceneState;
  state.includeExpenses = !state.includeExpenses;
  await updateDataSelectionMessage(ctx, state);
  await ctx.answerCbQuery(state.includeExpenses ? 'Расходы включены' : 'Расходы исключены');
});

/**
 * Обновление сообщения с выбором данных
 */
async function updateDataSelectionMessage(ctx: MyContext, state: ExportSceneState): Promise<void> {
  try {
    await ctx.editMessageText(
      documentMessages.exportYear.selectData,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `${state.includeContracts ? '✅' : '⬜'} Договоры`,
            'toggle_contracts'
          ),
          Markup.button.callback(
            `${state.includePayments ? '✅' : '⬜'} Платежи`,
            'toggle_payments'
          ),
        ],
        [
          Markup.button.callback(
            `${state.includeExpenses ? '✅' : '⬜'} Расходы`,
            'toggle_expenses'
          ),
        ],
        [Markup.button.callback('▶️ Продолжить', 'proceed_export')],
        [Markup.button.callback('◀️ Назад', 'back_to_format')],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );
  } catch (error) {
    // Игнорируем ошибки редактирования сообщения
  }
}

/**
 * Обработчик продолжения (начало генерации)
 */
exportYearScene.action('proceed_export', async (ctx) => {
  try {
    const state = ctx.wizard.state as ExportSceneState;

    // Проверка, что хотя бы один тип данных выбран
    if (!state.includeContracts && !state.includePayments && !state.includeExpenses) {
      await ctx.answerCbQuery('❌ Выберите хотя бы один тип данных');
      return;
    }

    await ctx.answerCbQuery('Начинаю генерацию...');
    await ctx.deleteMessage();

    // Переходим к генерации
    ctx.wizard.selectStep(4);
    
    // Вызываем обработчик шага 4 вручную
    const handler = exportYearScene.middleware();
    // Это вызовет следующий шаг
  } catch (error) {
    console.error('[ExportYearScene] Ошибка при продолжении:', error);
    await ctx.answerCbQuery('Ошибка');
  }
});

/**
 * Обработчик возврата к выбору года
 */
exportYearScene.action('back_to_year', async (ctx) => {
  try {
    await ctx.answerCbQuery('Возврат к выбору года');
    await ctx.deleteMessage();

    const currentYear = new Date().getFullYear();
    
    await ctx.reply(
      documentMessages.exportYear.enterYear,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(String(currentYear), `year_${currentYear}`),
          Markup.button.callback(String(currentYear - 1), `year_${currentYear - 1}`),
        ],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );

    ctx.wizard.selectStep(1);
  } catch (error) {
    console.error('[ExportYearScene] Ошибка возврата:', error);
  }
});

/**
 * Обработчик возврата к выбору формата
 */
exportYearScene.action('back_to_format', async (ctx) => {
  try {
    const state = ctx.wizard.state as ExportSceneState;
    
    await ctx.answerCbQuery('Возврат к выбору формата');
    await ctx.deleteMessage();

    await ctx.reply(
      documentMessages.exportYear.selectFormat(state.year || new Date().getFullYear()),
      Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 CSV (Excel)', 'format_csv'),
          Markup.button.callback('📄 PDF', 'format_pdf'),
        ],
        [Markup.button.callback('◀️ Назад', 'back_to_year')],
        [Markup.button.callback('❌ Отмена', 'cancel_export')],
      ])
    );

    ctx.wizard.selectStep(2);
  } catch (error) {
    console.error('[ExportYearScene] Ошибка возврата:', error);
  }
});

/**
 * Обработчик отмены
 */
exportYearScene.action('cancel_export', async (ctx) => {
  try {
    await ctx.answerCbQuery('Экспорт отменен');
    await ctx.deleteMessage().catch(() => {});
    await ctx.reply(documentMessages.exportYear.cancelled);
    return ctx.scene.leave();
  } catch (error) {
    console.error('[ExportYearScene] Ошибка отмены:', error);
    return ctx.scene.leave();
  }
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

/**
 * Генерация файла экспорта
 * @param data - Данные для экспорта
 * @param ctx - Контекст Telegram
 * @returns Сгенерированный файл
 */
async function generateExportFile(
  data: YearExportData,
  ctx: MyContext
): Promise<{ buffer: Buffer; filename: string }> {
  // Заглушка - здесь должен быть вызов реального сервиса
  // В реальном приложении здесь будет обращение к базе данных
  // и генерация файла через соответствующий сервис

  console.log(`[ExportYearScene] Генерация экспорта:`, {
    year: data.year,
    format: data.format,
    includeContracts: data.includeContracts,
    includePayments: data.includePayments,
    includeExpenses: data.includeExpenses,
  });

  // Имитация задержки генерации
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (data.format === ExportFormat.CSV) {
    // Генерация CSV
    const csvContent = generateCSVContent(data);
    return {
      buffer: Buffer.from(csvContent, 'utf-8'),
      filename: `export_${data.year}.csv`,
    };
  } else {
    // Генерация PDF
    const pdfContent = await generatePDFContent(data, ctx);
    return {
      buffer: pdfContent,
      filename: `export_${data.year}.pdf`,
    };
  }
}

/**
 * Генерация CSV контента
 */
function generateCSVContent(data: YearExportData): string {
  const lines: string[] = [];
  
  // BOM для корректной кодировки в Excel
  lines.push('\uFEFF');
  
  lines.push(`Экспорт данных за ${data.year} год`);
  lines.push(`Сгенерирован: ${new Date().toLocaleString('ru-RU')}`);
  lines.push('');

  if (data.includeContracts) {
    lines.push('ДОГОВОРЫ');
    lines.push('ID,Номер,Дата начала,Дата окончания,Арендатор,Адрес,Сумма,Статус');
    lines.push('1,123,01.01.2024,01.01.2025,Иванов И.И.,ул. Ленина 1,50000,Активен');
    lines.push('2,124,01.02.2024,01.02.2025,Петров П.П.,ул. Арбат 5,60000,Активен');
    lines.push('');
  }

  if (data.includePayments) {
    lines.push('ПЛАТЕЖИ');
    lines.push('ID,Дата,Договор,Тип,Сумма,Статус');
    lines.push('1,05.01.2024,123,Аренда,50000,Оплачен');
    lines.push('2,05.02.2024,123,Аренда,50000,Оплачен');
    lines.push('3,05.01.2024,124,Аренда,60000,Оплачен');
    lines.push('');
  }

  if (data.includeExpenses) {
    lines.push('РАСХОДЫ');
    lines.push('ID,Дата,Категория,Описание,Сумма');
    lines.push('1,10.01.2024,Ремонт,Замена смесителя,3500');
    lines.push('2,15.02.2024,Коммунальные,Электричество,2500');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Генерация PDF контента
 */
async function generatePDFContent(data: YearExportData, ctx: MyContext): Promise<Buffer> {
  // Заглушка - в реальном приложении здесь будет вызов pdfGenerator
  // Импорт здесь для избежания циклических зависимостей
  const { pdfGenerator } = await import('../services/pdfGenerator.service');

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Экспорт за ${data.year}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Экспорт данных за ${data.year} год</h1>
  <p>Сгенерирован: ${new Date().toLocaleString('ru-RU')}</p>
  
  ${data.includeContracts ? `
  <h2>Договоры</h2>
  <table>
    <tr><th>№</th><th>Дата</th><th>Арендатор</th><th>Адрес</th><th>Сумма</th></tr>
    <tr><td>123</td><td>01.01.2024</td><td>Иванов И.И.</td><td>ул. Ленина 1</td><td>50000</td></tr>
  </table>
  ` : ''}
  
  ${data.includePayments ? `
  <h2>Платежи</h2>
  <table>
    <tr><th>Дата</th><th>Договор</th><th>Тип</th><th>Сумма</th></tr>
    <tr><td>05.01.2024</td><td>123</td><td>Аренда</td><td>50000</td></tr>
  </table>
  ` : ''}
  
  ${data.includeExpenses ? `
  <h2>Расходы</h2>
  <table>
    <tr><th>Дата</th><th>Категория</th><th>Описание</th><th>Сумма</th></tr>
    <tr><td>10.01.2024</td><td>Ремонт</td><td>Смеситель</td><td>3500</td></tr>
  </table>
  ` : ''}
</body>
</html>`;

  const result = await pdfGenerator.generateFromHTML(html, {
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  });

  return result.buffer;
}

// Обработчик входа в сцену
exportYearScene.enter(async (ctx) => {
  console.log(`[ExportYearScene] Пользователь ${ctx.from?.id} вошел в сцену`);
});

// Обработчик выхода из сцены
exportYearScene.leave(async (ctx) => {
  console.log(`[ExportYearScene] Пользователь ${ctx.from?.id} вышел из сцены`);
});
