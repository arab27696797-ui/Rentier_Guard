/**
 * Commands definitions for RentierGuard Bot
 * Описание всех команд бота
 */

export const COMMANDS = {
  '🏠 Основные': {
    'start': 'Запуск бота, регистрация',
    'menu': 'Главное меню',
    'help': 'Справка по командам',
    'about': 'О боте',
  },
  '💰 Налоги': {
    'tax_calc': 'Калькулятор налогов (сравнение режимов)',
    'become_selfemployed': 'Как стать самозанятым (инструкция)',
    'tax_report': 'Отчетность и сроки уплаты',
  },
  '📄 Договоры': {
    'create_contract': 'Создать договор аренды',
    'create_act': 'Акт приема-передачи',
    'create_addendum': 'Дополнительное соглашение',
  },
  '🏢 Объекты': {
    'add_property': 'Добавить объект недвижимости',
    'my_properties': 'Мои объекты',
  },
  '💳 Платежи': {
    'add_payment': 'Добавить платеж',
    'payment_schedule': 'График платежей',
  },
  '🏛 Росреестр': {
    'rosreestr_checklist': 'Чек-лист для регистрации',
    'find_mfc': 'Найти ближайший МФЦ',
  },
  '⚠️ Проблемы': {
    'problem': 'Решение проблем с арендаторами',
    'bad_tenant': 'Черный список арендаторов',
  },
  '👨‍💼 Эксперты': {
    'expert': 'Консультация эксперта (1 бесплатно/год)',
  },
  '📊 Экспорт': {
    'export_year': 'Экспорт данных за год (CSV/PDF)',
  },
} as const;

// Command list for Telegram BotFather
export const BOTFATHER_COMMANDS = `
start - Запуск бота, регистрация
menu - Главное меню
tax_calc - Калькулятор налогов
become_selfemployed - Стать самозанятым
create_contract - Создать договор аренды
create_act - Акт приема-передачи
add_property - Добавить объект
my_properties - Мои объекты
add_payment - Добавить платеж
payment_schedule - График платежей
rosreestr_checklist - Чек-лист Росреестра
find_mfc - Найти МФЦ
problem - Решение проблем
bad_tenant - Черный список
expert - Консультация эксперта
export_year - Экспорт за год
help - Справка
about - О боте
`;
