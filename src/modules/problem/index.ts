/**
 * Модуль работы с проблемами (чёрный список)
 * RentierGuard Bot
 * 
 * Этот модуль предоставляет функционал для:
 * - Решения проблем с арендаторами через мастер-диалог
 * - Управления чёрным списком проблемных арендаторов
 * - Генерации претензий и уведомлений
 * - Получения инструкций по судебным действиям
 */

// ============================================
// ТИПЫ
// ============================================

export {
  // Enums
  ProblemType,
  BadTenantReason,
  ClaimTemplateType,
  
  // Labels
  ProblemTypeLabels,
  BadTenantReasonLabels,
} from './types';

export type {
  // Проблемы
  ProblemType as ProblemTypeEnum,
  ProblemScenario,
  ProblemScenarioStep,
  ProblemData,
  NonPaymentData,
  DamageData,
  EvictionData,
  ProblemDetails,
  
  // Чёрный список
  BadTenantData,
  BadTenantReason as BadTenantReasonEnum,
  
  // Претензии
  ClaimTemplate,
  GeneratedClaim,
  ClaimGenerationResult,
  
  // Операции
  BadTenantOperationResult,
  
  // Контекст
  ProblemWizardSession,
  ProblemContext,
} from './types';

// ============================================
// ВАЛИДАТОРЫ
// ============================================

export {
  // Схемы
  nonPaymentSchema,
  damageSchema,
  evictionSchema,
  otherProblemSchema,
  problemDataSchema,
  problemScenarioSchema,
  badTenantSchema,
  badTenantUpdateSchema,
  badTenantDeleteSchema,
  
  // Типы
  type NonPaymentInput,
  type DamageInput,
  type EvictionInput,
  type OtherProblemInput,
  type ProblemDataInput,
  type ProblemScenarioInput,
  type BadTenantInput,
  type BadTenantUpdateInput,
  type BadTenantDeleteInput,
  
  // Функции валидации
  validateProblemData,
  validateBadTenantData,
  validateDebtAmount,
  validateDays,
  validateFullName,
} from './validators';

// ============================================
// СЦЕНЫ
// ============================================

export {
  problemWizardScene,
  default as problemWizard,
} from './scenes/problemWizard.scene';

export {
  badTenantScene,
  badTenantWizardScene,
  default as badTenantScenes,
} from './scenes/badTenant.scene';

// ============================================
// СЕРВИСЫ
// ============================================

export {
  // Инициализация
  setPrismaClient,
  getPrismaClient,
  
  // Сценарии
  getProblemScenario,
  getProblemTypesList,
  
  // Претензии
  generateClaimText,
  generateTerminationLetter,
  formatClaimForMessage,
  
  // Чёрный список
  addToBadTenant,
  getUserBadTenants,
  getBadTenantById,
  deleteBadTenant,
  searchBadTenants,
  
  // Статистика
  getUserProblemStats,
  
  // Валидация
  validateProblemInput,
  validateBadTenantInput,
} from './services/problem.service';

export {
  // Генераторы претензий
  generateNonPaymentClaim,
  generateDamageClaim,
  generateEvictionClaim,
  generateTerminationNotice,
  
  // Основная функция
  generateClaim,
  
  // Форматирование
  formatClaimForTelegram,
  formatClaimForPrint,
} from './services/claimGenerator.service';

// ============================================
// ШАБЛОНЫ СООБЩЕНИЙ
// ============================================

export {
  // Меню
  problemMenuMessage,
  problemTypeSelectionMessage,
  
  // Wizard
  wizardStepMessages,
  
  // Чёрный список
  badTenantMenuMessage,
  badTenantAddPrompts,
  badTenantListMessage,
  badTenantDeleteMessages,
  
  // Инструкции
  courtInstructionsMessage,
  peacefulResolutionMessage,
  
  // Ошибки и успех
  errorMessages,
  successMessages,
  
  // Кнопки
  inlineKeyboardLabels,
  
  // Вспомогательные функции
  getProblemTypeMessage,
  getProblemTypeEmoji,
} from './templates/messages';

// ============================================
// СЦЕНАРИИ ПРОБЛЕМ
// ============================================

export {
  // Сценарии
  nonPaymentScenario,
  damageScenario,
  evictionScenario,
  otherProblemScenario,
  problemScenarios,
  
  // Функции
  getScenarioByType,
  getAllScenarios,
} from './content/problemScenarios';

// ============================================
// РЕГИСТРАЦИЯ СЦЕН В БОТЕ
// ============================================

import { Scenes } from 'telegraf';
import { problemWizardScene } from './scenes/problemWizard.scene';
import { badTenantScene, badTenantWizardScene } from './scenes/badTenant.scene';

/**
 * Массив всех сцен модуля проблем
 */
export const problemScenesArray = [
  problemWizardScene,
  badTenantScene,
  badTenantWizardScene,
];

/**
 * Сцена этапа модуля проблем
 */
export const problemStage = new Scenes.Stage<ProblemContext>(problemScenesArray);

// ============================================
// КОМАНДЫ МОДУЛЯ
// ============================================

/**
 * Описание команд модуля для регистрации в боте
 */
export const problemCommands = [
  {
    command: 'problem',
    description: '🔴 Мастер решения проблем с арендаторами',
  },
  {
    command: 'bad_tenant',
    description: '🚫 Управление чёрным списком арендаторов',
  },
];

// ============================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// ============================================

import { PrismaClient } from '@prisma/client';
import { setPrismaClient } from './services/problem.service';

/**
 * Инициализировать модуль проблем
 * @param prisma - экземпляр PrismaClient
 */
export function initializeProblemModule(prisma: PrismaClient): void {
  setPrismaClient(prisma);
  console.log('✅ Problem module initialized');
}

// ============================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================

export default {
  // Сцены
  scenes: problemScenesArray,
  stage: problemStage,
  
  // Команды
  commands: problemCommands,
  
  // Инициализация
  initialize: initializeProblemModule,
};
