/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сообщения и клавиатуры
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Модуль содержит все текстовые сообщения и клавиатуры бота.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { InlineKeyboardMarkup } from 'telegraf/types';

// ═══════════════════════════════════════════════════════════════════════════════
// Приветственные сообщения
// ═══════════════════════════════════════════════════════════════════════════════

export function getWelcomeMessage(firstName: string): string {
  return `
👋 <b>Привет, ${firstName}!</b>

Добро пожаловать в <b>RentierGuard</b> — ваш персональный помощник арендодателя! 🏠

<b>Что я умею:</b>
✅ Создавать договоры аренды и акты приема-передачи
✅ Вести учет объектов недвижимости
✅ Контролировать платежи и напоминать о них
✅ Рассчитывать налоги для самозанятых
✅ Проверять арендаторов по черному списку
✅ Помогать в решении проблем
✅ Формировать отчеты для бухгалтерии

<b>Начните с главного меню:</b> /menu
<b>Или получите справку:</b> /help

<i>Я всегда на связи, чтобы сделать вашу жизнь арендодателя проще! 🎯</i>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Главное меню
// ═══════════════════════════════════════════════════════════════════════════════

export function getMainMenuKeyboard(userRole: string = 'user'): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      // Финансы и налоги
      [
        { text: '💰 Налоги', callback_data: 'menu_taxes' },
        { text: '📄 Договоры', callback_data: 'menu_contracts' },
      ],
      // Объекты и платежи
      [
        { text: '🏠 Объекты', callback_data: 'menu_properties' },
        { text: '💳 Платежи', callback_data: 'menu_payments' },
      ],
      // Инструменты и поддержка
      [
        { text: '🛠️ Инструменты', callback_data: 'menu_tools' },
        { text: '🆘 Поддержка', callback_data: 'menu_support' },
      ],
      // Дополнительные функции
      [
        { text: '📊 Экспорт отчета', callback_data: 'export_report' },
        { text: '❓ Помощь', callback_data: 'show_help' },
      ],
    ],
  };
  
  // Добавляем админские кнопки для администраторов
  if (userRole === 'admin') {
    keyboard.inline_keyboard.push([
      { text: '⚙️ Админ-панель', callback_data: 'admin_panel' },
    ]);
  }
  
  return keyboard;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню налогов
// ═══════════════════════════════════════════════════════════════════════════════

export function getTaxMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🧮 Калькулятор налогов', callback_data: 'tax_calculator' }],
      [{ text: '📝 Стать самозанятым', callback_data: 'become_selfemployed' }],
      [{ text: '📊 Мои налоги', callback_data: 'my_taxes' }],
      [{ text: '💳 Оплатить налог', url: 'https://npd.nalog.ru' }],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню договоров
// ═══════════════════════════════════════════════════════════════════════════════

export function getContractsMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '➕ Новый договор', callback_data: 'contract_create' },
        { text: '📋 Мои договоры', callback_data: 'contract_list' },
      ],
      [
        { text: '📄 Создать акт', callback_data: 'act_create' },
        { text: '📑 Шаблоны', callback_data: 'contract_templates' },
      ],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню объектов
// ═══════════════════════════════════════════════════════════════════════════════

export function getPropertiesMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '➕ Добавить объект', callback_data: 'property_add' },
        { text: '🏠 Мои объекты', callback_data: 'property_list' },
      ],
      [
        { text: '📊 Статистика', callback_data: 'property_stats' },
        { text: '🗺️ На карте', callback_data: 'property_map' },
      ],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню платежей
// ═══════════════════════════════════════════════════════════════════════════════

export function getPaymentsMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '➕ Добавить платеж', callback_data: 'payment_add' },
        { text: '📅 График платежей', callback_data: 'payment_schedule' },
      ],
      [
        { text: '📈 История', callback_data: 'payment_history' },
        { text: '⚠️ Просроченные', callback_data: 'payment_overdue' },
      ],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню инструментов
// ═══════════════════════════════════════════════════════════════════════════════

export function getToolsMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '✅ Чек-лист Росреестра', callback_data: 'rosreestr_checklist' }],
      [{ text: '🏛️ Найти МФЦ', callback_data: 'find_mfc' }],
      [{ text: '📊 Калькулятор доходности', callback_data: 'profit_calculator' }],
      [{ text: '📥 Экспорт за год', callback_data: 'export_year' }],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Меню поддержки
// ═══════════════════════════════════════════════════════════════════════════════

export function getSupportMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🔧 Решение проблем', callback_data: 'problem_solver' }],
      [{ text: '⚫ Черный список', callback_data: 'blacklist' }],
      [{ text: '👨‍⚖️ Консультация эксперта', callback_data: 'expert_consult' }],
      [{ text: '💬 Написать в поддержку', callback_data: 'contact_support' }],
      [{ text: '⬅️ Назад в меню', callback_data: 'menu_main' }],
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сообщения для уведомлений
// ═══════════════════════════════════════════════════════════════════════════════

interface TaxReminderParams {
  amount: number;
  month: number;
  year: number;
  dueDate: string;
  isUrgent: boolean;
}

export function getTaxReminderMessage(params: TaxReminderParams): string {
  const { amount, month, year, dueDate, isUrgent } = params;
  
  const urgencyEmoji = isUrgent ? '⏰' : '📅';
  const urgencyText = isUrgent ? '<b>СРОЧНО!</b> Осталось менее недели!' : '';
  
  return `
${urgencyEmoji} <b>Налоговое напоминание</b>

💰 <b>Сумма к оплате:</b> ${amount.toLocaleString('ru-RU')} ₽
📅 <b>Период:</b> ${month}.${year}
⏳ <b>Срок оплаты:</b> ${dueDate}

${urgencyText}

<i>Не забудьте оплатить налог НПД вовремя, чтобы избежать штрафов!</i>

💳 <a href="https://npd.nalog.ru">Оплатить на npd.nalog.ru</a>
  `;
}

interface PaymentReminderParams {
  amount: number;
  propertyAddress: string;
  tenantName: string;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export function getPaymentReminderMessage(params: PaymentReminderParams): string {
  const { amount, propertyAddress, tenantName, dueDate, daysUntilDue, isOverdue } = params;
  
  if (isOverdue) {
    return `
⚠️ <b>Просроченный платеж!</b>

💰 <b>Сумма:</b> ${amount.toLocaleString('ru-RU')} ₽
🏠 <b>Объект:</b> ${propertyAddress}
👤 <b>Арендатор:</b> ${tenantName}
📅 <b>Был к оплате:</b> ${dueDate}
⏰ <b>Просрочка:</b> ${Math.abs(daysUntilDue)} дней

<i>Необходимо связаться с арендатором и уточнить причину задержки.</i>
    `;
  }
  
  return `
💳 <b>Напоминание о платеже</b>

💰 <b>Сумма:</b> ${amount.toLocaleString('ru-RU')} ₽
🏠 <b>Объект:</b> ${propertyAddress}
👤 <b>Арендатор:</b> ${tenantName}
📅 <b>К оплате:</b> ${dueDate}
⏰ <b>Осталось:</b> ${daysUntilDue} дней
  `;
}

interface ContractExpiryParams {
  contractNumber: string;
  propertyAddress: string;
  tenantName: string;
  endDate: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export function getContractExpiryMessage(params: ContractExpiryParams): string {
  const { contractNumber, propertyAddress, tenantName, endDate, daysUntilExpiry, isExpired } = params;
  
  if (isExpired) {
    return `
🚨 <b>Договор истек!</b>

📄 <b>Номер:</b> ${contractNumber}
🏠 <b>Объект:</b> ${propertyAddress}
👤 <b>Арендатор:</b> ${tenantName}
📅 <b>Дата окончания:</b> ${endDate}
⏰ <b>Истек:</b> ${Math.abs(daysUntilExpiry)} дней назад

<i>Необходимо принять решение: продлить договор или расторгнуть.</i>
    `;
  }
  
  return `
📄 <b>Договор скоро истекает</b>

📄 <b>Номер:</b> ${contractNumber}
🏠 <b>Объект:</b> ${propertyAddress}
👤 <b>Арендатор:</b> ${tenantName}
📅 <b>Дата окончания:</b> ${endDate}
⏰ <b>Осталось:</b> ${daysUntilExpiry} дней

<i>Рекомендуем заранее обсудить с арендатором дальнейшие планы.</i>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сообщения ошибок
// ═══════════════════════════════════════════════════════════════════════════════

export function getErrorMessage(errorType: string): string {
  const messages: Record<string, string> = {
    NOT_FOUND: '❌ Запрашиваемые данные не найдены.',
    VALIDATION: '❌ Проверьте введенные данные и попробуйте снова.',
    DATABASE: '❌ Ошибка базы данных. Пожалуйста, попробуйте позже.',
    UNAUTHORIZED: '🔐 Требуется авторизация. Используйте /start',
    FORBIDDEN: '⛔ У вас нет доступа к этой функции.',
    UNKNOWN: '❌ Произошла ошибка. Пожалуйста, попробуйте позже.',
  };
  
  return messages[errorType] || messages.UNKNOWN;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сообщения успеха
// ═══════════════════════════════════════════════════════════════════════════════

export function getSuccessMessage(action: string): string {
  const messages: Record<string, string> = {
    CONTRACT_CREATED: '✅ Договор успешно создан!',
    ACT_CREATED: '✅ Акт приема-передачи успешно создан!',
    PROPERTY_ADDED: '✅ Объект недвижимости добавлен!',
    PAYMENT_ADDED: '✅ Платеж успешно записан!',
    TAX_CALCULATED: '✅ Налог рассчитан!',
    SETTINGS_SAVED: '✅ Настройки сохранены!',
    EXPORT_READY: '✅ Отчет готов к скачиванию!',
  };
  
  return messages[action] || '✅ Операция выполнена успешно!';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  getWelcomeMessage,
  getMainMenuKeyboard,
  getTaxMenuKeyboard,
  getContractsMenuKeyboard,
  getPropertiesMenuKeyboard,
  getPaymentsMenuKeyboard,
  getToolsMenuKeyboard,
  getSupportMenuKeyboard,
  getTaxReminderMessage,
  getPaymentReminderMessage,
  getContractExpiryMessage,
  getErrorMessage,
  getSuccessMessage,
};
