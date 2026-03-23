/**
 * @fileoverview Экспорт модуля платежей
 * @module modules/payment
 */

// ============================================
// TYPES
// ============================================

export {
  Payment,
  PaymentWithDetails,
  CreatePaymentInput,
  UpdatePaymentInput,
  PaymentExportData,
  PaymentWizardContext,
  PaymentReminder,
  PaymentType,
  PaymentStatus,
  ReminderType,
  PaymentTypeLabels,
  PaymentStatusLabels,
  PaymentStatusEmojis,
  PaymentStatusColors,
  ReminderTypeLabels,
  CSVHeaders,
} from './types';

// ============================================
// VALIDATORS
// ============================================

export {
  contractIdSchema,
  paymentTypeSchema,
  amountSchema,
  paymentDateSchema,
  paymentStatusSchema,
  descriptionSchema,
  paymentIdSchema,
  createPaymentSchema,
  updatePaymentSchema,
  exportPeriodSchema,
  CreatePaymentSchema,
  UpdatePaymentSchema,
  ExportPeriodSchema,
} from './validators';

// ============================================
// SCENES
// ============================================

export {
  addPaymentScene,
  ADD_PAYMENT_SCENE,
} from './scenes/addPayment.scene';

export {
  paymentScheduleScene,
  PAYMENT_SCHEDULE_SCENE,
} from './scenes/paymentSchedule.scene';

// ============================================
// SERVICES
// ============================================

export { paymentService } from './services/payment.service';
export { reminderService } from './services/reminder.service';

// ============================================
// TEMPLATES
// ============================================

export { messages as paymentMessages } from './templates/messages';

// ============================================
// SCENE LIST (для регистрации в боте)
// ============================================

import { addPaymentScene } from './scenes/addPayment.scene';
import { paymentScheduleScene } from './scenes/paymentSchedule.scene';

export const paymentScenes = [
  addPaymentScene,
  paymentScheduleScene,
];

// ============================================
// INITIALIZATION
// ============================================

import { Telegraf } from 'telegraf';
import { reminderService } from './services/reminder.service';

/**
 * Инициализирует модуль платежей
 * @param bot - Экземпляр Telegraf бота
 */
export function initializePaymentModule(bot: Telegraf): void {
  // Инициализируем сервис напоминаний
  reminderService.initialize(bot);
  
  logger.info('Payment module initialized');
}

/**
 * Останавливает модуль платежей
 */
export function stopPaymentModule(): void {
  reminderService.stop();
  
  logger.info('Payment module stopped');
}

import { logger } from '../../utils/logger';
