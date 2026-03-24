/**
 * Re-export logger for backward compatibility.
 * Файлы в src/core/services/ и src/core/utils/ импортируют '../logger'
 */

export { logger, createModuleLogger, createUserLogger } from './utils/logger';
export type { Logger } from './utils/logger';
