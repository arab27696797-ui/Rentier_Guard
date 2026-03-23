/**
 * Keyboard Utilities
 * Утилиты для создания клавиатур Telegram
 */

import { InlineKeyboardButton, KeyboardButton } from 'telegraf/types';

/**
 * Тип для inline клавиатуры
 */
export type InlineKeyboard = InlineKeyboardButton[][];

/**
 * Тип для reply клавиатуры
 */
export type ReplyKeyboard = KeyboardButton[][];

/**
 * Создать главное меню бота (inline клавиатура)
 * @returns InlineKeyboard - клавиатура главного меню
 */
export function createMainMenu(): InlineKeyboard {
  return [
    [
      { text: '🏠 Мои объекты', callback_data: 'menu:properties' },
      { text: '👥 Мои арендаторы', callback_data: 'menu:tenants' },
    ],
    [
      { text: '📋 Договоры аренды', callback_data: 'menu:contracts' },
      { text: '💰 Платежи', callback_data: 'menu:payments' },
    ],
    [
      { text: '📊 Отчеты', callback_data: 'menu:reports' },
      { text: '🔔 Уведомления', callback_data: 'menu:notifications' },
    ],
    [
      { text: '⚙️ Настройки', callback_data: 'menu:settings' },
      { text: '❓ Помощь', callback_data: 'menu:help' },
    ],
  ];
}

/**
 * Создать кнопку "Назад"
 * @param callbackData - callback data для кнопки
 * @param text - текст кнопки (по умолчанию "◀️ Назад")
 * @returns InlineKeyboard - клавиатура с кнопкой назад
 */
export function createBackButton(
  callbackData: string = 'menu:back',
  text: string = '◀️ Назад'
): InlineKeyboard {
  return [[{ text, callback_data: callbackData }]];
}

/**
 * Создать кнопки подтверждения (Да/Нет)
 * @param confirmCallback - callback для кнопки "Да"
 * @param cancelCallback - callback для кнопки "Нет"
 * @returns InlineKeyboard - клавиатура с кнопками подтверждения
 */
export function createConfirmButtons(
  confirmCallback: string = 'action:confirm',
  cancelCallback: string = 'action:cancel'
): InlineKeyboard {
  return [
    [
      { text: '✅ Да', callback_data: confirmCallback },
      { text: '❌ Нет', callback_data: cancelCallback },
    ],
  ];
}

/**
 * Создать кнопки пагинации
 * @param current - текущая страница
 * @param total - всего страниц
 * @param prefix - префикс для callback_data
 * @returns InlineKeyboard - клавиатура с кнопками пагинации
 */
export function createPaginationButtons(
  current: number = 1,
  total: number = 1,
  prefix: string = 'page'
): InlineKeyboard {
  const buttons: InlineKeyboardButton[] = [];

  // Кнопка "Первая страница"
  if (current > 2) {
    buttons.push({
      text: '⏮️',
      callback_data: `${prefix}:first`,
    });
  }

  // Кнопка "Предыдущая страница"
  if (current > 1) {
    buttons.push({
      text: '◀️',
      callback_data: `${prefix}:${current - 1}`,
    });
  }

  // Текущая страница
  buttons.push({
    text: `${current}/${total}`,
    callback_data: `${prefix}:current`,
  });

  // Кнопка "Следующая страница"
  if (current < total) {
    buttons.push({
      text: '▶️',
      callback_data: `${prefix}:${current + 1}`,
    });
  }

  // Кнопка "Последняя страница"
  if (current < total - 1) {
    buttons.push({
      text: '⏭️',
      callback_data: `${prefix}:last`,
    });
  }

  return [buttons];
}

/**
 * Создать клавиатуру для управления объектом недвижимости
 * @param propertyId - ID объекта
 * @returns InlineKeyboard - клавиатура управления объектом
 */
export function createPropertyMenu(propertyId: string): InlineKeyboard {
  return [
    [
      { text: '✏️ Редактировать', callback_data: `property:edit:${propertyId}` },
      { text: '📋 Договоры', callback_data: `property:contracts:${propertyId}` },
    ],
    [
      { text: '💰 Платежи', callback_data: `property:payments:${propertyId}` },
      { text: '📊 Отчет', callback_data: `property:report:${propertyId}` },
    ],
    [
      { text: '🗑️ Удалить', callback_data: `property:delete:${propertyId}` },
    ],
    [{ text: '◀️ Назад к объектам', callback_data: 'menu:properties' }],
  ];
}

/**
 * Создать клавиатуру для управления арендатором
 * @param tenantId - ID арендатора
 * @returns InlineKeyboard - клавиатура управления арендатором
 */
export function createTenantMenu(tenantId: string): InlineKeyboard {
  return [
    [
      { text: '✏️ Редактировать', callback_data: `tenant:edit:${tenantId}` },
      { text: '📋 Договоры', callback_data: `tenant:contracts:${tenantId}` },
    ],
    [
      { text: '📞 Позвонить', callback_data: `tenant:call:${tenantId}` },
      { text: '💬 Написать', callback_data: `tenant:message:${tenantId}` },
    ],
    [
      { text: '🗑️ Удалить', callback_data: `tenant:delete:${tenantId}` },
    ],
    [{ text: '◀️ Назад к арендаторам', callback_data: 'menu:tenants' }],
  ];
}

/**
 * Создать клавиатуру для управления договором
 * @param contractId - ID договора
 * @returns InlineKeyboard - клавиатура управления договором
 */
export function createContractMenu(contractId: string): InlineKeyboard {
  return [
    [
      { text: '✏️ Редактировать', callback_data: `contract:edit:${contractId}` },
      { text: '💰 Платежи', callback_data: `contract:payments:${contractId}` },
    ],
    [
      { text: '📄 Документ', callback_data: `contract:document:${contractId}` },
      { text: '✍️ Продлить', callback_data: `contract:extend:${contractId}` },
    ],
    [
      { text: '🛑 Расторгнуть', callback_data: `contract:terminate:${contractId}` },
    ],
    [{ text: '◀️ Назад к договорам', callback_data: 'menu:contracts' }],
  ];
}

/**
 * Создать клавиатуру для настроек
 * @returns InlineKeyboard - клавиатура настроек
 */
export function createSettingsMenu(): InlineKeyboard {
  return [
    [
      { text: '🔔 Уведомления', callback_data: 'settings:notifications' },
      { text: '🌐 Язык', callback_data: 'settings:language' },
    ],
    [
      { text: '💱 Валюта', callback_data: 'settings:currency' },
      { text: '👤 Профиль', callback_data: 'settings:profile' },
    ],
    [
      { text: '📤 Экспорт данных', callback_data: 'settings:export' },
      { text: '📥 Импорт данных', callback_data: 'settings:import' },
    ],
    [{ text: '◀️ Назад в меню', callback_data: 'menu:main' }],
  ];
}

/**
 * Создать клавиатуру для выбора периода отчета
 * @returns InlineKeyboard - клавиатура выбора периода
 */
export function createReportPeriodMenu(): InlineKeyboard {
  return [
    [
      { text: 'Текущий месяц', callback_data: 'report:period:current_month' },
      { text: 'Прошлый месяц', callback_data: 'report:period:last_month' },
    ],
    [
      { text: 'Текущий квартал', callback_data: 'report:period:current_quarter' },
      { text: 'Прошлый квартал', callback_data: 'report:period:last_quarter' },
    ],
    [
      { text: 'Текущий год', callback_data: 'report:period:current_year' },
      { text: 'Прошлый год', callback_data: 'report:period:last_year' },
    ],
    [
      { text: '📅 Свой период', callback_data: 'report:period:custom' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:reports' }],
  ];
}

/**
 * Создать клавиатуру для добавления нового элемента
 * @param type - тип элемента (property, tenant, contract)
 * @returns InlineKeyboard - клавиатура добавления
 */
export function createAddNewMenu(
  type: 'property' | 'tenant' | 'contract'
): InlineKeyboard {
  const callbacks: Record<typeof type, string> = {
    property: 'property:add',
    tenant: 'tenant:add',
    contract: 'contract:add',
  };

  const labels: Record<typeof type, string> = {
    property: '🏠 объект',
    tenant: '👤 арендатора',
    contract: '📋 договор',
  };

  return [
    [{ text: `➕ Добавить ${labels[type]}`, callback_data: callbacks[type] }],
  ];
}

/**
 * Создать клавиатуру с кнопкой отмены
 * @param callbackData - callback для кнопки отмены
 * @returns InlineKeyboard - клавиатура с кнопкой отмены
 */
export function createCancelButton(
  callbackData: string = 'action:cancel'
): InlineKeyboard {
  return [[{ text: '❌ Отмена', callback_data: callbackData }]];
}

/**
 * Создать клавиатуру для подтверждения удаления
 * @param itemId - ID удаляемого элемента
 * @param itemType - тип элемента
 * @returns InlineKeyboard - клавиатура подтверждения удаления
 */
export function createDeleteConfirmButtons(
  itemId: string,
  itemType: 'property' | 'tenant' | 'contract'
): InlineKeyboard {
  return [
    [
      {
        text: '🗑️ Да, удалить',
        callback_data: `${itemType}:delete:confirm:${itemId}`,
      },
      {
        text: '◀️ Отмена',
        callback_data: `${itemType}:view:${itemId}`,
      },
    ],
  ];
}

/**
 * Создать reply клавиатуру с кнопкой "Отправить контакт"
 * @returns ReplyKeyboard - reply клавиатура
 */
export function createContactRequestKeyboard(): ReplyKeyboard {
  return [
    [
      {
        text: '📱 Отправить контакт',
        request_contact: true,
      },
    ],
    [
      {
        text: '❌ Отмена',
      },
    ],
  ];
}

/**
 * Создать reply клавиатуру с кнопкой "Отправить локацию"
 * @returns ReplyKeyboard - reply клавиатура
 */
export function createLocationRequestKeyboard(): ReplyKeyboard {
  return [
    [
      {
        text: '📍 Отправить локацию',
        request_location: true,
      },
    ],
    [
      {
        text: '❌ Отмена',
      },
    ],
  ];
}

/**
 * Создать клавиатуру для выбора типа уведомлений
 * @returns InlineKeyboard - клавиатура настроек уведомлений
 */
export function createNotificationSettingsMenu(): InlineKeyboard {
  return [
    [
      { text: '✅ Платежи', callback_data: 'notify:payments:toggle' },
      { text: '✅ Договоры', callback_data: 'notify:contracts:toggle' },
    ],
    [
      { text: '✅ Налоги', callback_data: 'notify:taxes:toggle' },
      { text: '✅ Новости', callback_data: 'notify:news:toggle' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:settings' }],
  ];
}

/**
 * Создать клавиатуру для выбора типа налога
 * @returns InlineKeyboard - клавиатура выбора типа налога
 */
export function createTaxTypeMenu(): InlineKeyboard {
  return [
    [
      { text: 'НДФЛ', callback_data: 'tax:type:ndfl' },
      { text: 'УСН', callback_data: 'tax:type:usn' },
    ],
    [
      { text: 'НДС', callback_data: 'tax:type:nds' },
      { text: 'Налог на имущество', callback_data: 'tax:type:property' },
    ],
    [
      { text: 'Земельный налог', callback_data: 'tax:type:land' },
      { text: 'Транспортный налог', callback_data: 'tax:type:transport' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:main' }],
  ];
}

/**
 * Создать клавиатуру для выбора типа отчета
 * @returns InlineKeyboard - клавиатура выбора типа отчета
 */
export function createReportTypeMenu(): InlineKeyboard {
  return [
    [
      { text: '📊 Финансовый', callback_data: 'report:type:financial' },
      { text: '🏠 По объектам', callback_data: 'report:type:properties' },
    ],
    [
      { text: '👥 По арендаторам', callback_data: 'report:type:tenants' },
      { text: '💰 По платежам', callback_data: 'report:type:payments' },
    ],
    [
      { text: '📈 Доходность', callback_data: 'report:type:profitability' },
      { text: '📉 Задолженность', callback_data: 'report:type:debts' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:reports' }],
  ];
}

/**
 * Создать клавиатуру для экспорта данных
 * @returns InlineKeyboard - клавиатура экспорта
 */
export function createExportMenu(): InlineKeyboard {
  return [
    [
      { text: '📄 PDF', callback_data: 'export:pdf' },
      { text: '📊 Excel', callback_data: 'export:excel' },
    ],
    [
      { text: '📝 CSV', callback_data: 'export:csv' },
      { text: '📋 JSON', callback_data: 'export:json' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:settings' }],
  ];
}

/**
 * Создать клавиатуру для выбора валюты
 * @returns InlineKeyboard - клавиатура выбора валюты
 */
export function createCurrencyMenu(): InlineKeyboard {
  return [
    [
      { text: '🇷🇺 RUB (₽)', callback_data: 'currency:rub' },
      { text: '🇺🇸 USD ($)', callback_data: 'currency:usd' },
    ],
    [
      { text: '🇪🇺 EUR (€)', callback_data: 'currency:eur' },
      { text: '🇬🇧 GBP (£)', callback_data: 'currency:gbp' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:settings' }],
  ];
}

/**
 * Создать клавиатуру для выбора языка
 * @returns InlineKeyboard - клавиатура выбора языка
 */
export function createLanguageMenu(): InlineKeyboard {
  return [
    [
      { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
      { text: '🇬🇧 English', callback_data: 'lang:en' },
    ],
    [{ text: '◀️ Назад', callback_data: 'menu:settings' }],
  ];
}

/**
 * Создать клавиатуру для управления платежом
 * @param paymentId - ID платежа
 * @returns InlineKeyboard - клавиатура управления платежом
 */
export function createPaymentMenu(paymentId: string): InlineKeyboard {
  return [
    [
      { text: '✅ Отметить оплаченным', callback_data: `payment:paid:${paymentId}` },
      { text: '📨 Напомнить', callback_data: `payment:remind:${paymentId}` },
    ],
    [
      { text: '✏️ Редактировать', callback_data: `payment:edit:${paymentId}` },
      { text: '🗑️ Удалить', callback_data: `payment:delete:${paymentId}` },
    ],
    [{ text: '◀️ Назад к платежам', callback_data: 'menu:payments' }],
  ];
}

/**
 * Создать клавиатуру для фильтрации списка
 * @param filters - массив фильтров
 * @returns InlineKeyboard - клавиатура фильтров
 */
export function createFilterMenu(
  filters: Array<{ label: string; callback: string }>
): InlineKeyboard {
  const rows: InlineKeyboard = [];

  // Группируем по 2 кнопки в ряд
  for (let i = 0; i < filters.length; i += 2) {
    const row: InlineKeyboardButton[] = [
      { text: filters[i].label, callback_data: filters[i].callback },
    ];

    if (filters[i + 1]) {
      row.push({
        text: filters[i + 1].label,
        callback_data: filters[i + 1].callback,
      });
    }

    rows.push(row);
  }

  rows.push([{ text: '◀️ Назад', callback_data: 'menu:back' }]);

  return rows;
}

/**
 * Создать клавиатуру для выбора месяца
 * @returns InlineKeyboard - клавиатура выбора месяца
 */
export function createMonthSelector(): InlineKeyboard {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель',
    'Май', 'Июнь', 'Июль', 'Август',
    'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  const rows: InlineKeyboard = [];

  for (let i = 0; i < 12; i += 3) {
    rows.push([
      { text: months[i], callback_data: `month:${i + 1}` },
      { text: months[i + 1], callback_data: `month:${i + 2}` },
      { text: months[i + 2], callback_data: `month:${i + 3}` },
    ]);
  }

  rows.push([{ text: '◀️ Назад', callback_data: 'menu:back' }]);

  return rows;
}

/**
 * Создать клавиатуру для выбора года
 * @param startYear - начальный год
 * @param endYear - конечный год
 * @returns InlineKeyboard - клавиатура выбора года
 */
export function createYearSelector(
  startYear: number = new Date().getFullYear() - 5,
  endYear: number = new Date().getFullYear() + 1
): InlineKeyboard {
  const rows: InlineKeyboard = [];
  const buttons: InlineKeyboardButton[] = [];

  for (let year = startYear; year <= endYear; year++) {
    buttons.push({
      text: year.toString(),
      callback_data: `year:${year}`,
    });
  }

  // Группируем по 4 кнопки в ряд
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(buttons.slice(i, i + 4));
  }

  rows.push([{ text: '◀️ Назад', callback_data: 'menu:back' }]);

  return rows;
}
