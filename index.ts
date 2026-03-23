/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Регистрация сцен
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Модуль для регистрации всех WizardScene и BaseScene бота.
 * Сцены используются для пошаговых диалогов с пользователем.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Scenes, Composer } from 'telegraf';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен налогов
// ═══════════════════════════════════════════════════════════════════════════════

import { taxCalculatorScene } from './tax/taxCalculator';
import { selfEmployedRegistrationScene } from './tax/selfEmployedRegistration';
import { taxMenuScene } from './tax/taxMenu';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен договоров
// ═══════════════════════════════════════════════════════════════════════════════

import { contractCreateScene } from './contracts/contractCreate';
import { contractMenuScene } from './contracts/contractMenu';
import { contractViewScene } from './contracts/contractView';
import { actCreateScene } from './contracts/actCreate';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен объектов недвижимости
// ═══════════════════════════════════════════════════════════════════════════════

import { propertyAddScene } from './properties/propertyAdd';
import { propertyListScene } from './properties/propertyList';
import { propertyMenuScene } from './properties/propertyMenu';
import { propertyEditScene } from './properties/propertyEdit';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен платежей
// ═══════════════════════════════════════════════════════════════════════════════

import { paymentAddScene } from './payments/paymentAdd';
import { paymentScheduleScene } from './payments/paymentSchedule';
import { paymentMenuScene } from './payments/paymentMenu';
import { paymentHistoryScene } from './payments/paymentHistory';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен инструментов
// ═══════════════════════════════════════════════════════════════════════════════

import { rosreestrChecklistScene } from './tools/rosreestrChecklist';
import { mfcFinderScene } from './tools/mfcFinder';
import { toolsMenuScene } from './tools/toolsMenu';
import { yearExportScene } from './tools/yearExport';

// ═══════════════════════════════════════════════════════════════════════════════
// Импорт сцен поддержки
// ═══════════════════════════════════════════════════════════════════════════════

import { problemSolverScene } from './support/problemSolver';
import { blacklistMenuScene } from './support/blacklistMenu';
import { blacklistAddScene } from './support/blacklistAdd';
import { blacklistSearchScene } from './support/blacklistSearch';
import { expertConsultationScene } from './support/expertConsultation';
import { supportMenuScene } from './support/supportMenu';

// ═══════════════════════════════════════════════════════════════════════════════
// Создание Stage
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stage - контейнер для всех сцен бота.
 * Используется для управления переходами между сценами.
 */
export const stage = new Scenes.Stage<Scenes.WizardContext>(
  [],
  {
    // Время жизни сессии сцены (30 минут)
    ttl: 1800,
    // Автоматический выход из сцены по умолчанию
    default: 'passthrough',
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Регистрация всех сцен
// ═══════════════════════════════════════════════════════════════════════════════

export function registerScenes(stageInstance: typeof stage): void {
  
  // ═════════════════════════════════════════════════════════════════════════════
  // Налоговые сцены
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(taxCalculatorScene);
  stageInstance.register(selfEmployedRegistrationScene);
  stageInstance.register(taxMenuScene);
  
  console.log('✅ Налоговые сцены зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Сцены договоров
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(contractCreateScene);
  stageInstance.register(contractMenuScene);
  stageInstance.register(contractViewScene);
  stageInstance.register(actCreateScene);
  
  console.log('✅ Сцены договоров зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Сцены объектов недвижимости
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(propertyAddScene);
  stageInstance.register(propertyListScene);
  stageInstance.register(propertyMenuScene);
  stageInstance.register(propertyEditScene);
  
  console.log('✅ Сцены объектов недвижимости зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Сцены платежей
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(paymentAddScene);
  stageInstance.register(paymentScheduleScene);
  stageInstance.register(paymentMenuScene);
  stageInstance.register(paymentHistoryScene);
  
  console.log('✅ Сцены платежей зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Сцены инструментов
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(rosreestrChecklistScene);
  stageInstance.register(mfcFinderScene);
  stageInstance.register(toolsMenuScene);
  stageInstance.register(yearExportScene);
  
  console.log('✅ Сцены инструментов зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Сцены поддержки
  // ═════════════════════════════════════════════════════════════════════════════
  
  stageInstance.register(problemSolverScene);
  stageInstance.register(blacklistMenuScene);
  stageInstance.register(blacklistAddScene);
  stageInstance.register(blacklistSearchScene);
  stageInstance.register(expertConsultationScene);
  stageInstance.register(supportMenuScene);
  
  console.log('✅ Сцены поддержки зарегистрированы');

  // ═════════════════════════════════════════════════════════════════════════════
  // Middleware для stage
  // ═════════════════════════════════════════════════════════════════════════════
  
  // Middleware, вызываемый при входе в любую сцену
  stageInstance.use(async (ctx, next) => {
    try {
      // Логирование входа в сцену
      const sceneName = ctx.scene?.current?.id || 'unknown';
      console.log(`🎬 Пользователь ${ctx.from?.id} вошел в сцену: ${sceneName}`);
      
      // Сохраняем время входа в сцену
      if (ctx.session) {
        ctx.session.sceneEnteredAt = new Date().toISOString();
      }
      
      return next();
    } catch (error) {
      console.error('❌ Ошибка в middleware stage:', error);
      return next();
    }
  });

  // Middleware, вызываемый при выходе из любой сцены
  stageInstance.leave(async (ctx, next) => {
    try {
      // Логирование выхода из сцены
      console.log(`🚪 Пользователь ${ctx.from?.id} вышел из сцены`);
      
      // Очищаем временные данные сцены
      if (ctx.session) {
        ctx.session.sceneEnteredAt = undefined;
        ctx.session.sceneData = undefined;
      }
      
      return next();
    } catch (error) {
      console.error('❌ Ошибка при выходе из сцены:', error);
      return next();
    }
  });

  console.log('✅ Все сцены успешно зарегистрированы');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Вспомогательные функции для работы со сценами
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Проверяет, находится ли пользователь в сцене
 */
export function isInScene(ctx: Scenes.WizardContext): boolean {
  return !!ctx.scene?.current;
}

/**
 * Получает название текущей сцены
 */
export function getCurrentScene(ctx: Scenes.WizardContext): string | null {
  return ctx.scene?.current?.id || null;
}

/**
 * Безопасный выход из сцены с обработкой ошибок
 */
export async function safeLeaveScene(ctx: Scenes.WizardContext): Promise<void> {
  try {
    if (isInScene(ctx)) {
      await ctx.scene.leave();
    }
  } catch (error) {
    console.error('❌ Ошибка при выходе из сцены:', error);
  }
}

/**
 * Очистка данных сцены
 */
export function clearSceneData(ctx: Scenes.WizardContext): void {
  if (ctx.session) {
    ctx.session.sceneData = undefined;
    ctx.session.wizard = undefined;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт всех сцен для использования в других модулях
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Налоговые сцены
  taxCalculatorScene,
  selfEmployedRegistrationScene,
  taxMenuScene,
  
  // Сцены договоров
  contractCreateScene,
  contractMenuScene,
  contractViewScene,
  actCreateScene,
  
  // Сцены объектов
  propertyAddScene,
  propertyListScene,
  propertyMenuScene,
  propertyEditScene,
  
  // Сцены платежей
  paymentAddScene,
  paymentScheduleScene,
  paymentMenuScene,
  paymentHistoryScene,
  
  // Сцены инструментов
  rosreestrChecklistScene,
  mfcFinderScene,
  toolsMenuScene,
  yearExportScene,
  
  // Сцены поддержки
  problemSolverScene,
  blacklistMenuScene,
  blacklistAddScene,
  blacklistSearchScene,
  expertConsultationScene,
  supportMenuScene,
};

export default registerScenes;
