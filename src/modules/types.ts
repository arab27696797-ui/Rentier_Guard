/**
 * @fileoverview Типы и интерфейсы для модуля платежей
 * @module modules/payment/types
 */

import { Context } from 'telegraf';
import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes';

// ============================================
// ENUMS
// ============================================

/** Тип платежа */
export enum PaymentType {
  RENT = 'RENT',           // Аренда
  DEPOSIT = 'DEPOSIT',     // Залог
  UTILITIES = 'UTILITIES', // Коммунальные услуги
  FINE = 'FINE',           // Штраф/неустойка
  OTHER = 'OTHER',         // Другое
}

/** Статус платежа */
export enum PaymentStatus {
  PLANNED = 'PLANNED',     // Запланирован
  PAID = 'PAID',           // Оплачен
  OVERDUE = 'OVERDUE',     // Просрочен
  CANCELLED = 'CANCELLED', // Отменён
}

/** Тип напоминания */
export enum ReminderType {
  THREE_DAYS = 'THREE_DAYS',  // За 3 дня
  ONE_DAY = 'ONE_DAY',        // За 1 день
  TODAY = 'TODAY',            // В день платежа
}

// ============================================
// INTERFACES
// ============================================

/** Платёж */
export interface Payment {
  id: string;
  userId: number;
  contractId: string;
  type: PaymentType;
  amount: number;
  date: Date;
  status: PaymentStatus;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Расширенный платёж с информацией о договоре и объекте */
export interface PaymentWithDetails extends Payment {
  contract: {
    id: string;
    tenantName: string;
    property: {
      id: string;
      address: string;
    };
  };
}

/** Данные для создания платежа */
export interface CreatePaymentInput {
  userId: number;
  contractId: string;
  type: PaymentType;
  amount: number;
  date: Date;
  status: PaymentStatus;
  description?: string;
}

/** Данные для обновления платежа */
export interface UpdatePaymentInput {
  type?: PaymentType;
  amount?: number;
  date?: Date;
  status?: PaymentStatus;
  description?: string | null;
  paidAt?: Date | null;
}

/** Данные для экспорта платежей */
export interface PaymentExportData {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  propertyAddress: string;
  tenantName: string;
  description: string | null;
}

/** Расширенный контекст для сцен платежей */
export interface PaymentWizardContext extends WizardContext {
  session: WizardSessionData & {
    paymentData?: {
      contractId?: string;
      type?: PaymentType;
      amount?: number;
      date?: Date;
      status?: PaymentStatus;
      description?: string;
    };
    selectedPaymentId?: string;
    userContracts?: Array<{
      id: string;
      tenantName: string;
      propertyAddress: string;
    }>;
  };
}

/** Напоминание о платеже */
export interface PaymentReminder {
  paymentId: string;
  userId: number;
  type: ReminderType;
  payment: PaymentWithDetails;
}

// ============================================
// CONSTANTS
// ============================================

/** Лейблы для типов платежей */
export const PaymentTypeLabels: Record<PaymentType, string> = {
  [PaymentType.RENT]: '💰 Аренда',
  [PaymentType.DEPOSIT]: '🔐 Залог',
  [PaymentType.UTILITIES]: '💡 Коммунальные услуги',
  [PaymentType.FINE]: '⚠️ Штраф/неустойка',
  [PaymentType.OTHER]: '📋 Другое',
};

/** Лейблы для статусов платежей */
export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PLANNED]: '📅 Запланирован',
  [PaymentStatus.PAID]: '✅ Оплачен',
  [PaymentStatus.OVERDUE]: '❌ Просрочен',
  [PaymentStatus.CANCELLED]: '🚫 Отменён',
};

/** Эмодзи для статусов платежей */
export const PaymentStatusEmojis: Record<PaymentStatus, string> = {
  [PaymentStatus.PLANNED]: '📅',
  [PaymentStatus.PAID]: '✅',
  [PaymentStatus.OVERDUE]: '❌',
  [PaymentStatus.CANCELLED]: '🚫',
};

/** Цвета для статусов (для CSV/Excel) */
export const PaymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.PLANNED]: 'YELLOW',
  [PaymentStatus.PAID]: 'GREEN',
  [PaymentStatus.OVERDUE]: 'RED',
  [PaymentStatus.CANCELLED]: 'GRAY',
};

/** Лейблы для напоминаний */
export const ReminderTypeLabels: Record<ReminderType, string> = {
  [ReminderType.THREE_DAYS]: '⏰ Через 3 дня',
  [ReminderType.ONE_DAY]: '⏰ Завтра',
  [ReminderType.TODAY]: '🔔 Сегодня',
};

/** Заголовки CSV для экспорта */
export const CSVHeaders = [
  'Дата',
  'Тип',
  'Сумма',
  'Статус',
  'Адрес объекта',
  'Арендатор',
  'Описание',
];
