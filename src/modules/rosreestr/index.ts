/**
 * Модуль Росреестра для Telegram-бота RentierGuard
 * 
 * Экспортирует сцены, сервисы и типы для работы с регистрацией
 * договоров аренды в Росреестре.
 */

// ==================== ТИПЫ ====================
export {
  // Интерфейсы
  ChecklistItem,
  RosreestrChecklist,
  MFCInfo,
  ContractData,
  RosreestrContext,
  RegistrationCheckResult,
  RegistrationGuide,
} from './types';

// ==================== СЦЕНЫ ====================
export {
  rosreestrChecklistScene,
  ROSREESTR_CHECKLIST_SCENE,
} from './scenes/rosreestrChecklist.scene';

export {
  findMFCScene,
  FIND_MFC_SCENE,
} from './scenes/findMFC.scene';

// ==================== СЕРВИСЫ ====================
export { RosreestrService } from './services/rosreestr.service';

// ==================== ШАБЛОНЫ СООБЩЕНИЙ ====================
export {
  CHECKLIST_WELCOME_MESSAGE,
  NO_REGISTRATION_REQUIRED_MESSAGE,
  REGISTRATION_REQUIRED_MESSAGE,
  formatDocumentsList,
  formatCompletionMessage,
  MFC_SEARCH_WELCOME_MESSAGE,
  formatMFCLink,
  ERROR_MESSAGE,
  INVALID_INPUT_MESSAGE,
  CANCEL_MESSAGE,
  ROSREESTR_HELP_MESSAGE,
} from './templates/messages';

// ==================== ДАННЫЕ ====================
export {
  BASE_CHECKLIST_ITEMS,
  LEGAL_ENTITY_DOCUMENTS,
  DOCUMENT_REQUIREMENTS,
  TEMPLATE_LINKS,
  PAYMENT_DETAILS,
  REGISTRATION_GUIDE,
  USEFUL_LINKS,
  LEGAL_INFO,
} from './content/checklistData';

// ==================== РЕЭКСПОРТ ДЛЯ УДОБСТВА ====================

/**
 * Массив всех сцен модуля Росреестра
 * Используется при регистрации сцен в боте
 * 
 * @example
 * import { rosreestrScenes } from './modules/rosreestr';
 * 
 * const stage = new Stage([...rosreestrScenes, ...otherScenes]);
 * bot.use(stage.middleware());
 */
export { default as rosreestrChecklistSceneExport } from './scenes/rosreestrChecklist.scene';
export { default as findMFCSceneExport } from './scenes/findMFC.scene';

/**
 * Полный список сцен модуля
 */
export const rosreestrScenes = [
  require('./scenes/rosreestrChecklist.scene').default,
  require('./scenes/findMFC.scene').default,
];

/**
 * Названия сцен для использования в коде
 */
export const SceneNames = {
  ROSREESTR_CHECKLIST: 'rosreestr_checklist',
  FIND_MFC: 'find_mfc',
} as const;

/**
 * Команды модуля Росреестра
 */
export const RosreestrCommands = {
  /** Чек-лист документов для регистрации */
  CHECKLIST: '/rosreestr_checklist',
  /** Поиск ближайшего МФЦ */
  FIND_MFC: '/find_mfc',
  /** Справка по модулю */
  HELP: '/rosreestr_help',
} as const;

/**
 * Описание модуля для документации
 */
export const ModuleInfo = {
  name: 'Росреестр',
  description: 'Модуль для подготовки документов и регистрации договоров аренды в Росреестре',
  version: '1.0.0',
  author: 'RentierGuard Team',
  commands: [
    {
      command: '/rosreestr_checklist',
      description: 'Чек-лист документов для регистрации договора аренды',
    },
    {
      command: '/find_mfc',
      description: 'Найти ближайший МФЦ для подачи документов',
    },
  ],
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

/**
 * Инициализирует модуль Росреестра
 * Регистрирует команды и обработчики
 * 
 * @param bot - Экземпляр Telegraf бота
 */
export function initializeRosreestrModule(bot: any): void {
  // Регистрация команд
  bot.command('rosreestr_checklist', (ctx: RosreestrContext) => {
    return ctx.scene.enter(SceneNames.ROSREESTR_CHECKLIST);
  });

  bot.command('find_mfc', (ctx: RosreestrContext) => {
    return ctx.scene.enter(SceneNames.FIND_MFC);
  });

  bot.command('rosreestr_help', (ctx: RosreestrContext) => {
    const { ROSREESTR_HELP_MESSAGE } = require('./templates/messages');
    return ctx.reply(ROSREESTR_HELP_MESSAGE, { parse_mode: 'HTML' });
  });

  console.log('✅ Модуль Росреестра инициализирован');
}

export default {
  scenes: rosreestrScenes,
  commands: RosreestrCommands,
  info: ModuleInfo,
  initialize: initializeRosreestrModule,
};
