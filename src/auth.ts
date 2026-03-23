/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Middleware авторизации
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Проверяет авторизацию пользователя и его права доступа.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Context, MiddlewareFn } from 'telegraf';
import { Scenes } from 'telegraf';

// Роли пользователей
export type UserRole = 'user' | 'premium' | 'expert' | 'admin';

// Расширенный контекст с информацией о пользователе
interface AuthContext extends Scenes.WizardContext {
  userRole?: UserRole;
  isAuthenticated?: boolean;
}

// Команды, не требующие авторизации
const PUBLIC_COMMANDS = [
  'start',
  'help',
  'about',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware авторизации
// ═══════════════════════════════════════════════════════════════════════════════

export const authMiddleware: MiddlewareFn<AuthContext> = async (ctx, next) => {
  try {
    // Получаем команду из сообщения
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const command = messageText.split(' ')[0].replace('/', '').split('@')[0];
    
    // Проверяем, является ли команда публичной
    const isPublicCommand = PUBLIC_COMMANDS.includes(command);
    
    // Если команда публичная, пропускаем проверку
    if (isPublicCommand) {
      return next();
    }
    
    // Проверяем наличие сессии
    if (!ctx.session) {
      await ctx.reply(
        '⚠️ Сессия не инициализирована. Пожалуйста, перезапустите бота командой /start'
      );
      return;
    }
    
    // Проверяем авторизацию
    if (!ctx.session.userId && !isPublicCommand) {
      await ctx.reply(
        '🔐 Для использования этой функции необходимо авторизоваться.\n\n' +
        'Пожалуйста, нажмите /start для начала работы.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Начать работу', callback_data: 'start_auth' }],
            ],
          },
        }
      );
      return;
    }
    
    // Устанавливаем флаг авторизации
    ctx.isAuthenticated = true;
    ctx.userRole = ctx.session.role as UserRole || 'user';
    
    return next();
  } catch (error) {
    console.error('❌ Ошибка в authMiddleware:', error);
    await ctx.reply('❌ Произошла ошибка авторизации. Пожалуйста, попробуйте позже.');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware проверки роли
// ═══════════════════════════════════════════════════════════════════════════════

export function requireRole(...allowedRoles: UserRole[]) {
  return async (ctx: AuthContext, next: () => Promise<void>) => {
    try {
      const userRole = ctx.userRole || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        await ctx.reply(
          '⛔ У вас недостаточно прав для использования этой функции.\n\n' +
          `Требуемая роль: ${allowedRoles.join(' или ')}\n` +
          `Ваша роль: ${userRole}`
        );
        return;
      }
      
      return next();
    } catch (error) {
      console.error('❌ Ошибка в requireRole middleware:', error);
      await ctx.reply('❌ Произошла ошибка проверки прав.');
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware проверки администратора
// ═══════════════════════════════════════════════════════════════════════════════

export const adminMiddleware: MiddlewareFn<AuthContext> = async (ctx, next) => {
  try {
    const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
    const userId = ctx.from?.id;
    
    if (!userId || !adminIds.includes(userId)) {
      await ctx.reply('⛔ Эта команда доступна только администраторам.');
      return;
    }
    
    return next();
  } catch (error) {
    console.error('❌ Ошибка в adminMiddleware:', error);
    await ctx.reply('❌ Произошла ошибка проверки прав администратора.');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default authMiddleware;
