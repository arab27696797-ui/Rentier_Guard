/**
 * @fileoverview Шаблоны сообщений для модуля платежей
 * @module modules/payment/templates/messages
 */

import { PaymentTypeLabels, PaymentStatusLabels } from '../types';

// ============================================
// ADD PAYMENT SCENE MESSAGES
// ============================================

const addPayment = {
  noContracts: `📭 <b>У вас пока нет договоров аренды</b>

Для создания платежа необходимо сначала добавить договор.

Перейдите в раздел "Договоры" и создайте новый договор.`,

  step1Contract: `💰 <b>Добавление платежа</b>

<b>Шаг 1/6:</b> Выберите договор, по которому создаётся платёж:

Выберите из списка ниже:`,

  step2Type: `📋 <b>Шаг 2/6:</b> Выберите тип платежа

• <b>Аренда</b> — ежемесячная арендная плата
• <b>Залог</b> — страховой депозит
• <b>Коммунальные услуги</b> — оплата ЖКХ
• <b>Штраф/неустойка</b> — пени за просрочку
• <b>Другое</b> — прочие платежи`,

  step3Amount: `💵 <b>Шаг 3/6:</b> Введите сумму платежа

Укажите сумму в рублях (только число):

Примеры:
• 25000
• 15000.50`,

  step4Date: `📅 <b>Шаг 4/6:</b> Введите дату платежа

Укажите дату в формате ДД.ММ.ГГГГ:

Примеры:
• 15.03.2024
• 01.12.2024`,

  step5Status: `📊 <b>Шаг 5/6:</b> Выберите статус платежа

• <b>Запланирован</b> — платёж ожидается в будущем
• <b>Оплачен</b> — платёж уже получен`,

  step6Description: `📝 <b>Шаг 6/6:</b> Добавьте описание (опционально)

Вы можете добавить примечание к платежу:
• Номер квитанции
• Способ оплаты
• Другие детали

Или нажмите "Пропустить"`,

  summary: (
    tenantName: string,
    propertyAddress: string,
    type: string,
    amount: number,
    date: Date,
    status: string,
    description?: string
  ) => {
    const formatDate = (d: Date) => {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    };

    const formatAmount = (a: number) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(a);
    };

    let message = `✅ <b>Проверьте данные платежа:</b>\n\n`;
    message += `👤 <b>Арендатор:</b> ${tenantName}\n`;
    message += `🏠 <b>Объект:</b> ${propertyAddress}\n`;
    message += `📋 <b>Тип:</b> ${type}\n`;
    message += `💰 <b>Сумма:</b> ${formatAmount(amount)}\n`;
    message += `📅 <b>Дата:</b> ${formatDate(date)}\n`;
    message += `📊 <b>Статус:</b> ${status}\n`;
    
    if (description) {
      message += `📝 <b>Описание:</b> ${description}\n`;
    }

    message += `\nВсё верно?`;

    return message;
  },

  success: (amount: number, date: Date) => {
    const formatAmount = (a: number) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(a);
    };

    const formatDate = (d: Date) => {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    };

    return `✅ <b>Платёж успешно добавлен!</b>\n\n💰 ${formatAmount(amount)} — ${formatDate(date)}\n\nТеперь вы можете:\n• Посмотреть график платежей\n• Добавить ещё один платёж`;
  },

  cancelled: '❌ Добавление платежа отменено.',
};

// ============================================
// PAYMENT SCHEDULE SCENE MESSAGES
// ============================================

const schedule = {
  title: `📅 <b>График платежей</b>\n\nПредстоящие платежи на ближайшие 90 дней:`,

  empty: `📭 <b>Нет предстоящих платежей</b>

У вас нет запланированных платежей на ближайшие 90 дней.

Добавьте платёж, чтобы отслеживать поступления.`,

  emptyFiltered: `📭 <b>Платежи не найдены</b>

По выбранному фильтру платежей не найдено.

Попробуйте изменить фильтр или добавьте новый платёж.`,

  detail: (
    type: string,
    amount: number,
    date: Date,
    status: string,
    tenantName: string,
    propertyAddress: string,
    description: string | null,
    paidAt: Date | null
  ) => {
    const formatDate = (d: Date | null) => {
      if (!d) return '—';
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    };

    const formatAmount = (a: number) => {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(a);
    };

    let message = `💰 <b>Детали платежа</b>\n\n`;
    message += `📋 <b>Тип:</b> ${type}\n`;
    message += `💵 <b>Сумма:</b> ${formatAmount(amount)}\n`;
    message += `📅 <b>Дата платежа:</b> ${formatDate(date)}\n`;
    message += `📊 <b>Статус:</b> ${status}\n`;
    message += `👤 <b>Арендатор:</b> ${tenantName}\n`;
    message += `🏠 <b>Объект:</b> ${propertyAddress}\n`;
    
    if (description) {
      message += `📝 <b>Описание:</b> ${description}\n`;
    }

    if (paidAt) {
      message += `\n✅ <b>Оплачен:</b> ${formatDate(paidAt)}`;
    }

    return message;
  },

  deleteConfirm: (amount: string, date: Date) => {
    const formatDate = (d: Date) => {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    };

    return `⚠️ <b>Подтвердите удаление</b>\n\nВы действительно хотите удалить платёж?\n💰 ${amount} — ${formatDate(date)}\n\n❗️ Это действие нельзя отменить.`;
  },

  deleteSuccess: '✅ Платёж успешно удалён.',

  markedAsPaid: '✅ Платёж отмечен как оплаченный!',
};

// ============================================
// REMINDER MESSAGES
// ============================================

const reminders = {
  threeDays: (amount: string, date: string, property: string, tenant: string) => 
    `⏰ <b>Напоминание о платеже</b>\n\n` +
    `Через <b>3 дня</b> ожидается платёж:\n\n` +
    `💰 <b>Сумма:</b> ${amount}\n` +
    `📅 <b>Дата:</b> ${date}\n` +
    `🏠 <b>Объект:</b> ${property}\n` +
    `👤 <b>Арендатор:</b> ${tenant}`,

  oneDay: (amount: string, date: string, property: string, tenant: string) => 
    `⚡ <b>Напоминание о платеже</b>\n\n` +
    `<b>Завтра</b> ожидается платёж:\n\n` +
    `💰 <b>Сумма:</b> ${amount}\n` +
    `📅 <b>Дата:</b> ${date}\n` +
    `🏠 <b>Объект:</b> ${property}\n` +
    `👤 <b>Арендатор:</b> ${tenant}`,

  today: (amount: string, date: string, property: string, tenant: string) => 
    `🔔 <b>Напоминание о платеже</b>\n\n` +
    `<b>Сегодня</b> ожидается платёж:\n\n` +
    `💰 <b>Сумма:</b> ${amount}\n` +
    `📅 <b>Дата:</b> ${date}\n` +
    `🏠 <b>Объект:</b> ${property}\n` +
    `👤 <b>Арендатор:</b> ${tenant}\n\n` +
    `Не забудьте проверить поступление средств!`,

  overdue: (amount: string, date: string, property: string, tenant: string) => 
    `❌ <b>Просроченный платёж!</b>\n\n` +
    `Платёж не получен:\n\n` +
    `💰 <b>Сумма:</b> ${amount}\n` +
    `📅 <b>Дата:</b> ${date}\n` +
    `🏠 <b>Объект:</b> ${property}\n` +
    `👤 <b>Арендатор:</b> ${tenant}\n\n` +
    `Рекомендуем связаться с арендатором.`,
};

// ============================================
// EXPORT MESSAGES
// ============================================

const exportMessages = {
  preparing: '📊 <b>Подготовка экспорта...</b>\n\nПожалуйста, подождите.',
  
  success: (year: number, count: number) => 
    `✅ <b>Экспорт завершён!</b>\n\n` +
    `📅 Год: ${year}\n` +
    `📋 Количество платежей: ${count}\n\n` +
    `Файл готов к скачиванию.`,
  
  empty: (year: number) => 
    `📭 <b>Нет данных для экспорта</b>\n\n` +
    `За ${year} год не найдено ни одного платежа.`,
  
  error: '❌ <b>Ошибка при экспорте</b>\n\nПопробуйте позже или обратитесь в поддержку.',
};

// ============================================
// ERROR MESSAGES
// ============================================

const errors = {
  general: '❌ Произошла ошибка. Попробуйте позже или обратитесь в поддержку.',
  unauthorized: '❌ Для выполнения этого действия необходимо авторизоваться.',
  invalidInput: '❌ Неверный ввод. Пожалуйста, попробуйте ещё раз.',
  paymentNotFound: '❌ Платёж не найден или у вас нет к нему доступа.',
  contractNotFound: '❌ Договор не найден.',
  invalidAmount: '❌ Неверная сумма. Введите число.',
  invalidDate: '❌ Неверная дата. Используйте формат ДД.ММ.ГГГГ',
  futureDateRequired: '❌ Дата должна быть в будущем для запланированных платежей.',
};

// ============================================
// EXPORT
// ============================================

export const messages = {
  addPayment,
  schedule,
  reminders,
  export: exportMessages,
  errors,
};
