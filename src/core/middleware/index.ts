/**
 * Middleware модуль RentierGuard
 * Экспорт всех middleware
 */

export {
  createAuthMiddleware,
  requireUserId,
  requireRoles,
  requireOwner,
  requireOwnerOrManager,
  requireExpert,
  updateActivity,
  createProtectedMiddleware,
  type IAuthService,
  type AuthMiddlewareOptions,
} from './auth.middleware';

export {
  createErrorMiddleware,
  errorMiddleware,
  devErrorMiddleware,
  withErrorHandling,
  safeExecute,
  isValidationError,
  isAuthError,
  type ErrorMiddlewareOptions,
} from './error.middleware';
