/**
 * Middleware для аутентификации и авторизации пользователей
 * Проверяет наличие пользователя в системе и его права доступа
 */

import type { MiddlewareFn } from 'telegraf';
import type { BotContext, UserInfo } from '@types/index';
import { createModuleLogger } from '@core/utils/logger';
import { ErrorCode, AppError } from '@types/index';

// ============================================================================
// Логгер модуля
// ============================================================================

const logger = createModuleLogger('AuthMiddleware');

// ============================================================================
// Интерфейсы
// ============================================================================

/**
 * Результат проверки аутентификации
 */
interface AuthResult {
  isAuthenticated: boolean;
  user?: UserInfo;
  error?: string;
}

/**
 * Опции middleware аутентификации
 */
interface AuthMiddlewareOptions {
  /** Требовать регистрацию пользователя */
  requireRegistration?: boolean;
  /** Разрешенные роли */
  allowedRoles?: string[];
  /** Сообщение при отказе в доступе */
  accessDeniedMessage?: string;
}

// ============================================================================
// Сервис аутентификации (интерфейс)
 */

/**
 * Интерфейс сервиса аутентификации
 */
export interface IAuthService {
  /** Проверяет существование пользователя по Telegram ID */
  findUserByTelegramId(telegramId: number): Promise<UserInfo | null>;
  /** Регистрирует нового пользователя */
  registerUser(telegramId: number, userData: Record<string, unknown>): Promise<UserInfo>;
  /** Проверяет активность пользователя */
  isUserActive(userId: string): Promise<boolean>;
}

// ============================================================================
// Middleware аутентификации
// ============================================================================

/**
 * Создает middleware для проверки аутентификации
 * @param authService - Сервис аутентификации
 * @param options - Опции middleware
 * @returns Middleware функция
 */
export function createAuthMiddleware(
  authService: IAuthService,
  options: AuthMiddlewareOptions = {}
): MiddlewareFn<BotContext> {
  const {
    requireRegistration = true,
    allowedRoles = [],
    accessDeniedMessage = '⛔ У вас нет доступа к этой функции.',
  } = options;

  return async (ctx, next) => {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      logger.warn('Запрос без telegramId');
      await ctx.reply('❌ Не удалось определить пользователя.');
      return;
    }

    try {
      // Проверяем пользователя в базе
      const user = await authService.findUserByTelegramId(telegramId);

      // Если требуется регистрация и пользователь не найден
      if (requireRegistration && !user) {
        logger.info({ telegramId }, 'Незарегистрированный пользователь');
        await ctx.reply(
          '👋 Добро пожаловать в RentierGuard!\n\n' +
          'Для начала работы необходимо зарегистрироваться.\n' +
          'Используйте команду /start'
        );
        return;
      }

      // Если пользователь найден, проверяем роль
      if (user) {
        // Проверка активности
        const isActive = await authService.isUserActive(user.id);
        if (!isActive) {
          logger.warn({ telegramId, userId: user.id }, 'Неактивный пользователь');
          await ctx.reply('🔒 Ваш аккаунт деактивирован. Обратитесь к администратору.');
          return;
        }

        // Проверка роли
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          logger.warn(
            { telegramId, userId: user.id, role: user.role, allowedRoles },
            'Доступ запрещен: неподходящая роль'
          );
          await ctx.reply(accessDeniedMessage);
          return;
        }

        // Сохраняем данные пользователя в сессию
        ctx.session.userId = user.id;
        ctx.session.role = user.role;

        logger.debug(
          { telegramId, userId: user.id, role: user.role },
          'Пользователь аутентифицирован'
        );
      }

      await next();
    } catch (error) {
      logger.error({ error, telegramId }, 'Ошибка аутентификации');
      await ctx.reply('❌ Произошла ошибка при проверке доступа. Попробуйте позже.');
    }
  };
}

// ============================================================================
// Простая проверка userId
// ============================================================================

/**
 * Middleware для базовой проверки наличия userId в сессии
 * Используется после основного auth middleware
 */
export const requireUserId: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.session.userId) {
    logger.warn('Отсутствует userId в сессии');
    await ctx.reply(
      '⚠️ Сессия истекла или вы не авторизованы.\n' +
      'Пожалуйста, используйте команду /start'
    );
    return;
  }
  await next();
};

// ============================================================================
// Проверка ролей
// ============================================================================

/**
 * Создает middleware для проверки конкретных ролей
 * @param roles - Разрешенные роли
 * @param customMessage - Кастомное сообщение об ошибке
 */
export function requireRoles(
  roles: string[],
  customMessage?: string
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const userRole = ctx.session.role;

    if (!userRole) {
      logger.warn('Отсутствует роль в сессии');
      await ctx.reply('⚠️ Не удалось определить вашу роль.');
      return;
    }

    if (!roles.includes(userRole)) {
      logger.warn(
        { userRole, requiredRoles: roles },
        'Недостаточно прав доступа'
      );
      await ctx.reply(
        customMessage ||
        `⛔ Эта функция доступна только для: ${roles.join(', ')}`
      );
      return;
    }

    await next();
  };
}

// ============================================================================
// Предустановленные проверки ролей
// ============================================================================

/** Middleware только для владельцев */
export const requireOwner = requireRoles(['OWNER'], 
  '⛔ Эта функция доступна только владельцам объектов.'
);

/** Middleware для владельцев и менеджеров */
export const requireOwnerOrManager = requireRoles(
  ['OWNER', 'MANAGER'],
  '⛔ Эта функция доступна владельцам и управляющим.'
);

/** Middleware для экспертов */
export const requireExpert = requireRoles(
  ['EXPERT'],
  '⛔ Эта функция доступна только экспертам.'
);

// ============================================================================
// Middleware обновления активности
// ============================================================================

/**
 * Middleware для обновления времени последней активности
 */
export const updateActivity: MiddlewareFn<BotContext> = async (ctx, next) => {
  ctx.session.lastActivity = new Date();
  await next();
};

// ============================================================================
// Фабрика middleware
// ============================================================================

/**
 * Создает композитный middleware с проверкой аутентификации и ролей
 * @param authService - Сервис аутентификации
 * @param options - Опции
 */
export function createProtectedMiddleware(
  authService: IAuthService,
  options: AuthMiddlewareOptions = {}
): MiddlewareFn<BotContext> {
  const authMiddleware = createAuthMiddleware(authService, options);

  return async (ctx, next) => {
    // Создаем цепочку middleware
    const runMiddleware = async (): Promise<void> => {
      await authMiddleware(ctx, async () => {
        await requireUserId(ctx, async () => {
          await next();
        });
      });
    };

    await runMiddleware();
  };
}
