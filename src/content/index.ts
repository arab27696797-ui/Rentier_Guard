/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Контент
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Экспорт всего контента бота.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

export {
  BotCommand,
  CommandCategory,
  UserRole,
  COMMANDS,
  getCommandsByCategory,
  getCommandsForRole,
  getCommand,
  isCommandAvailable,
  getCommandsByCategories,
  getCommandHelp,
  getDetailedCommandHelp,
} from './commands';

export {
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
} from './messages';
