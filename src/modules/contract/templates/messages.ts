/**
 * =========================================
 * Модуль Договоров - Шаблоны сообщений
 * RentierGuard Telegram Bot
 * =========================================
 */

import { ContractData, ActData, AddendumData, InventoryItemData } from '../types';

// =========================================
// ЭМОДЗИ
// =========================================

const EMOJI = {
  contract: '📄',
  house: '🏠',
  building: '🏢',
  person: '👤',
  passport: '🆔',
  phone: '📱',
  calendar: '📅',
  money: '💰',
  deposit: '💎',
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  success: '🎉',
  error: '🚫',
  info: 'ℹ️',
  edit: '✏️',
  back: '◀️',
  next: '▶️',
  save: '💾',
  delete: '🗑️',
  list: '📋',
  add: '➕',
  finish: '🏁',
  act: '📋',
  addendum: '📝',
  inventory: '📦',
  meter: '⚡',
  water: '💧',
  gas: '🔥',
};

// =========================================
// СЦЕНА СОЗДАНИЯ ДОГОВОРА
// =========================================

export const contractMessages = {
  /** Приветствие в сцене */
  welcome: `${EMOJI.contract} <b>Создание договора аренды</b>\n\nЯ помогу вам создать юридически грамотный договор аренды. Ответьте на несколько вопросов.`,

  /** Шаг 1: Выбор типа */
  step1_type: `${EMOJI.house} <b>Шаг 1 из 10</b>\n\nВыберите тип арендуемого помещения:`,

  typeButtons: {
    residential: `${EMOJI.house} Жилое помещение`,
    commercial: `${EMOJI.building} Коммерческое помещение`,
  },

  /** Шаг 2: Адрес */
  step2_address: `${EMOJI.house} <b>Шаг 2 из 10</b>\n\nВведите полный адрес объекта аренды:\n<i>Например: г. Москва, ул. Ленина, д. 10, кв. 25</i>`,

  /** Шаг 3: ФИО арендатора */
  step3_tenantName: `${EMOJI.person} <b>Шаг 3 из 10</b>\n\nВведите ФИО арендатора (полностью):\n<i>Например: Иванов Иван Иванович</i>`,

  /** Шаг 4: Паспорт */
  step4_passport: `${EMOJI.passport} <b>Шаг 4 из 10</b>\n\nВведите паспортные данные арендатора:\n<i>Формат: 1234 567890</i>`,

  /** Шаг 5: Телефон */
  step5_phone: `${EMOJI.phone} <b>Шаг 5 из 10</b>\n\nВведите контактный телефон арендатора:\n<i>Формат: +7XXXXXXXXXX</i>`,

  /** Шаг 6: Срок аренды */
  step6_dates: `${EMOJI.calendar} <b>Шаг 6 из 10</b>\n\nВведите срок аренды в формате <b>С ДД.ММ.ГГГГ ПО ДД.ММ.ГГГГ</b>:\n<i>Например: С 01.01.2025 ПО 31.12.2025</i>`,

  /** Шаг 7: Арендная плата */
  step7_rent: `${EMOJI.money} <b>Шаг 7 из 10</b>\n\nВведите ежемесячную арендную плату (в рублях):\n<i>Например: 50000</i>`,

  /** Шаг 8: Залог */
  step8_deposit: `${EMOJI.deposit} <b>Шаг 8 из 10</b>\n\nВведите сумму залога (депозита) в рублях:\n<i>Обычно равен 1-2 месяцам аренды. Введите 0, если залог не требуется.</i>`,

  /** Шаг 9: Росреестр */
  step9_rosreestr: `${EMOJI.info} <b>Шаг 9 из 10</b>\n\nТребуется ли регистрация договора в Росреестре?\n<i>Обязательна для договоров сроком более 1 года</i>`,

  rosreestrButtons: {
    yes: `${EMOJI.check} Да, требуется`,
    no: `${EMOJI.cross} Нет, не требуется`,
  },

  /** Шаг 10: Подтверждение */
  step10_confirm: (data: Partial<ContractData>): string => {
    const typeText = data.contractType === 'residential' ? 'Жилое помещение' : 'Коммерческое помещение';
    const rosreestrText = data.needsRosreestrRegistration ? 'Да' : 'Нет';
    
    return `${EMOJI.check} <b>Шаг 10 из 10 - Проверьте данные:</b>\n\n` +
      `<b>Тип:</b> ${typeText}\n` +
      `<b>Адрес:</b> ${data.propertyAddress}\n` +
      `<b>Арендатор:</b> ${data.tenantFullName}\n` +
      `<b>Паспорт:</b> ${data.tenantPassport}\n` +
      `<b>Телефон:</b> ${data.tenantPhone}\n` +
      `<b>Срок:</b> ${data.startDate?.toLocaleDateString('ru-RU')} - ${data.endDate?.toLocaleDateString('ru-RU')}\n` +
      `<b>Аренда:</b> ${data.monthlyRent?.toLocaleString('ru-RU')} ₽/мес\n` +
      `<b>Залог:</b> ${data.depositAmount?.toLocaleString('ru-RU')} ₽\n` +
      `<b>Росреестр:</b> ${rosreestrText}\n\n` +
      `Всё верно?`;
  },

  confirmButtons: {
    confirm: `${EMOJI.check} Да, создать договор`,
    cancel: `${EMOJI.cross} Отменить`,
    edit: `${EMOJI.edit} Изменить`,
  },

  /** Успешное создание */
  success: (contractId: string): string => 
    `${EMOJI.success} <b>Договор успешно создан!</b>\n\n` +
    `ID договора: <code>${contractId}</code>\n\n` +
    `Вы можете скачать готовый документ или создать акт приема-передачи.`,

  /** Отмена */
  cancelled: `${EMOJI.cross} Создание договора отменено.`,

  /** Ошибка */
  error: `${EMOJI.error} Произошла ошибка при создании договора. Попробуйте позже.`,
};

// =========================================
// СЦЕНА СОЗДАНИЯ АКТА
// =========================================

export const actMessages = {
  /** Приветствие */
  welcome: `${EMOJI.act} <b>Создание акта приема-передачи</b>\n\nВыберите договор, для которого нужно создать акт:`,

  /** Нет договоров */
  noContracts: `${EMOJI.warning} У вас пока нет созданных договоров.\n\nСначала создайте договор через /create_contract`,

  /** Шаг 1: Выбор договора */
  step1_selectContract: `${EMOJI.contract} <b>Шаг 1 из 4</b>\n\nВыберите договор из списка:`,

  /** Шаг 2: Тип акта */
  step2_actType: `${EMOJI.act} <b>Шаг 2 из 4</b>\n\nВыберите тип акта:`,

  actTypeButtons: {
    acceptance: `${EMOJI.check} Акт приема (въезд)`,
    transfer: `${EMOJI.cross} Акт передачи (выезд)`,
  },

  /** Шаг 3: Добавление инвентаря */
  step3_inventory: `${EMOJI.inventory} <b>Шаг 3 из 4</b>\n\nДобавьте пункты инвентаризации:\n\n<i>Формат: Название | Количество | Состояние</i>\n<i>Например: Холодильник | 1 | Хорошее</i>\n\nСостояния: Новое, Хорошее, Удовлетворительное, Плохое\n\nОтправьте "готово" когда закончите`,

  /** Показ текущего списка */
  currentInventoryList: (items: InventoryItemData[]): string => {
    if (items.length === 0) {
      return `${EMOJI.info} Список инвентаризации пуст. Добавьте первый пункт.`;
    }
    
    const list = items.map((item, index) => 
      `${index + 1}. ${item.name} - ${item.quantity} шт. (${item.condition})`
    ).join('\n');
    
    return `${EMOJI.list} <b>Текущий список:</b>\n\n${list}\n\n` +
      `Всего пунктов: ${items.length}`;
  },

  inventoryButtons: {
    addMore: `${EMOJI.add} Добавить ещё`,
    finish: `${EMOJI.finish} Завершить список`,
    removeLast: `${EMOJI.delete} Удалить последний`,
  },

  /** Шаг 4: Подтверждение */
  step4_confirm: (itemCount: number): string => 
    `${EMOJI.check} <b>Шаг 4 из 4</b>\n\n` +
    `В списке ${itemCount} пункт(ов) инвентаризации.\n\n` +
    `Хотите добавить показания счетчиков?`,

  meterButtons: {
    withMeters: `${EMOJI.meter} Да, добавить счетчики`,
    withoutMeters: `${EMOJI.finish} Нет, завершить`,
  },

  /** Ввод показаний */
  enterMeters: `${EMOJI.meter} Введите показания счетчиков:\n<i>Формат: Электричество: XXX, Вода: XXX, Газ: XXX</i>\n<i>(можно указать только нужные)</i>`,

  /** Успешное создание */
  success: (actId: string): string => 
    `${EMOJI.success} <b>Акт успешно создан!</b>\n\n` +
    `ID акта: <code>${actId}</code>\n\n` +
    `Документ готов к скачиванию.`,

  /** Отмена */
  cancelled: `${EMOJI.cross} Создание акта отменено.`,

  /** Ошибка */
  error: `${EMOJI.error} Произошла ошибка при создании акта.`,

  /** Неверный формат инвентаря */
  invalidInventoryFormat: `${EMOJI.warning} Неверный формат. Используйте:\n<i>Название | Количество | Состояние</i>`,

  /** Успешное добавление */
  itemAdded: `${EMOJI.check} Пункт добавлен!`,
};

// =========================================
// СЦЕНА СОЗДАНИЯ ДОПСОГЛАШЕНИЯ
// =========================================

export const addendumMessages = {
  /** Приветствие */
  welcome: `${EMOJI.addendum} <b>Создание дополнительного соглашения</b>\n\nВыберите договор для внесения изменений:`,

  /** Нет договоров */
  noContracts: `${EMOJI.warning} У вас пока нет активных договоров.`,

  /** Шаг 1: Выбор договора */
  step1_selectContract: `${EMOJI.contract} <b>Шаг 1 из 4</b>\n\nВыберите договор:`,

  /** Шаг 2: Тип изменения */
  step2_type: `${EMOJI.edit} <b>Шаг 2 из 4</b>\n\nВыберите тип изменения:`,

  typeButtons: {
    price_change: `${EMOJI.money} Изменение арендной платы`,
    term_change: `${EMOJI.calendar} Изменение срока`,
    other: `${EMOJI.edit} Другое`,
  },

  /** Шаг 3: Ввод новых данных */
  step3_newValue: (type: string): string => {
    const prompts: Record<string, string> = {
      price_change: 'Введите новую сумму арендной платы (в рублях):',
      term_change: 'Введите новый срок окончания (ДД.ММ.ГГГГ):',
      other: 'Опишите изменения подробно:',
    };
    return `${EMOJI.edit} <b>Шаг 3 из 4</b>\n\n${prompts[type] || prompts.other}`;
  },

  /** Шаг 4: Дата вступления */
  step4_effectiveDate: `${EMOJI.calendar} <b>Шаг 4 из 4</b>\n\nВведите дату вступления изменений в силу:\n<i>Формат: ДД.ММ.ГГГГ</i>`,

  /** Подтверждение */
  confirm: (data: { type: string; newValue: string; effectiveDate: Date }): string => {
    const typeLabels: Record<string, string> = {
      price_change: 'Изменение арендной платы',
      term_change: 'Изменение срока',
      other: 'Другое изменение',
    };
    
    return `${EMOJI.check} <b>Подтвердите данные:</b>\n\n` +
      `<b>Тип:</b> ${typeLabels[data.type] || data.type}\n` +
      `<b>Новое значение:</b> ${data.newValue}\n` +
      `<b>Вступает в силу:</b> ${data.effectiveDate.toLocaleDateString('ru-RU')}\n\n` +
      `Создать допсоглашение?`;
  },

  confirmButtons: {
    confirm: `${EMOJI.check} Создать`,
    cancel: `${EMOJI.cross} Отмена`,
  },

  /** Успешное создание */
  success: (addendumId: string): string => 
    `${EMOJI.success} <b>Дополнительное соглашение создано!</b>\n\n` +
    `ID: <code>${addendumId}</code>`,

  /** Отмена */
  cancelled: `${EMOJI.cross} Создание отменено.`,

  /** Ошибка */
  error: `${EMOJI.error} Произошла ошибка.`,
};

// =========================================
// СООБЩЕНИЯ СЕРВИСА
// =========================================

export const serviceMessages = {
  /** Договор не найден */
  contractNotFound: `${EMOJI.warning} Договор не найден.`,

  /** Нет доступа */
  accessDenied: `${EMOJI.error} У вас нет доступа к этому договору.`,

  /** Успешное удаление */
  deleted: `${EMOJI.check} Договор удален.`,

  /** Успешное обновление статуса */
  statusUpdated: (status: string): string => `${EMOJI.check} Статус изменен на: ${status}`,

  /** Ошибка БД */
  dbError: `${EMOJI.error} Ошибка базы данных. Попробуйте позже.`,
};

// =========================================
// СПИСОК ДОГОВОРОВ
// =========================================

export const listMessages = {
  /** Заголовок списка */
  header: `${EMOJI.list} <b>Ваши договоры:</b>\n\n`,

  /** Элемент списка */
  item: (index: number, address: string, status: string, rent: number): string => 
    `${index}. <b>${address}</b>\n   Статус: ${status} | ${rent.toLocaleString('ru-RU')} ₽/мес\n`,

  /** Пустой список */
  empty: `${EMOJI.info} У вас пока нет договоров.\n\nСоздайте первый договор командой /create_contract`,

  /** Кнопки */
  buttons: {
    view: `${EMOJI.contract} Просмотр`,
    edit: `${EMOJI.edit} Изменить`,
    delete: `${EMOJI.delete} Удалить`,
    createAct: `${EMOJI.act} Акт`,
    createAddendum: `${EMOJI.addendum} Допсоглашение`,
  },
};

// =========================================
// ОБЩИЕ СООБЩЕНИЯ
// =========================================

export const commonMessages = {
  /** Неверная команда */
  invalidCommand: `${EMOJI.warning} Неизвестная команда. Используйте кнопки или /cancel для отмены.`,

  /** Отмена сцены */
  sceneCancelled: `${EMOJI.cross} Операция отменена.`,

  /** Неверный ввод */
  invalidInput: `${EMOJI.warning} Неверный ввод. Попробуйте ещё раз.`,

  /** Сессия истекла */
  sessionExpired: `${EMOJI.warning} Сессия истекла. Начните заново.`,

  /** Ошибка сервера */
  serverError: `${EMOJI.error} Произошла ошибка. Попробуйте позже.`,
};
