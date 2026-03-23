/**
 * =========================================
 * Модуль Договоров - Главный экспорт
 * RentierGuard Telegram Bot
 * =========================================
 * 
 * Этот файл является точкой входа для модуля договоров.
 * Экспортирует все компоненты модуля для использования в боте.
 */

// =========================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// =========================================

export {
  // Enums
  ContractType,
  ContractStatus,
  AddendumType,
  InventoryItemCondition,
  
  // Interfaces
  ContractData,
  ActData,
  AddendumData,
  InventoryItemData,
  ContractWizardContext,
  ValidationResult,
  ServiceResult,
  
  // Type aliases
  ContractSummary,
  CreateContractInput,
  CreateActInput,
  CreateAddendumInput,
} from './types';

// =========================================
// ВАЛИДАТОРЫ (ZOD СХЕМЫ)
// =========================================

export {
  // Основные схемы
  contractSchema,
  actSchema,
  inventoryItemSchema,
  addendumSchema,
  
  // Вспомогательные схемы
  contractTypeSchema,
  addressSchema,
  fullNameSchema,
  passportSchema,
  phoneSchema,
  dateInputSchema,
  endDateSchema,
  amountSchema,
  booleanChoiceSchema,
  
  // Типы схем
  ContractSchemaType,
  ActSchemaType,
  InventoryItemSchemaType,
  AddendumSchemaType,
} from './validators';

// =========================================
// СЦЕНЫ (WIZARD SCENES)
// =========================================

export { createContractScene } from './scenes/createContract.scene';
export { createActScene } from './scenes/createAct.scene';
export { createAddendumScene } from './scenes/createAddendum.scene';

// Экспорт по умолчанию для удобного импорта
export { default as createContractSceneDefault } from './scenes/createContract.scene';
export { default as createActSceneDefault } from './scenes/createAct.scene';
export { default as createAddendumSceneDefault } from './scenes/createAddendum.scene';

// =========================================
// СЕРВИСЫ (БИЗНЕС-ЛОГИКА)
// =========================================

export { ContractService, contractService } from './services/contract.service';

// =========================================
// ШАБЛОНЫ СООБЩЕНИЙ
// =========================================

export {
  // Сообщения для сцен
  contractMessages,
  actMessages,
  addendumMessages,
  
  // Сервисные сообщения
  serviceMessages,
  
  // Сообщения списка
  listMessages,
  
  // Общие сообщения
  commonMessages,
} from './templates/messages';

// =========================================
// МАССИВ ВСЕХ СЦЕН ДЛЯ РЕГИСТРАЦИИ
// =========================================

import { createContractScene } from './scenes/createContract.scene';
import { createActScene } from './scenes/createAct.scene';
import { createAddendumScene } from './scenes/createAddendum.scene';

/**
 * Массив всех сцен модуля договоров для регистрации в Stage
 */
export const contractScenes = [
  createContractScene,
  createActScene,
  createAddendumScene,
];

// =========================================
// КОНФИГУРАЦИЯ КОМАНД МОДУЛЯ
// =========================================

/**
 * Конфигурация команд модуля договоров
 * Используется для регистрации команд в боте
 */
export const contractCommands = [
  {
    command: 'create_contract',
    description: 'Создать новый договор аренды',
    sceneId: 'create_contract',
  },
  {
    command: 'create_act',
    description: 'Создать акт приема-передачи',
    sceneId: 'create_act',
  },
  {
    command: 'create_addendum',
    description: 'Создать дополнительное соглашение',
    sceneId: 'create_addendum',
  },
  {
    command: 'my_contracts',
    description: 'Мои договоры',
  },
];

// =========================================
// ИНФОРМАЦИЯ О МОДУЛЕ
// =========================================

export const moduleInfo = {
  name: 'contract',
  version: '1.0.0',
  description: 'Модуль для работы с договорами аренды',
  scenes: [
    { id: 'create_contract', name: 'Создание договора', steps: 10 },
    { id: 'create_act', name: 'Создание акта', steps: 4 },
    { id: 'create_addendum', name: 'Создание допсоглашения', steps: 5 },
  ],
};
