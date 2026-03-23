/**
 * User Service
 * Сервис для управления пользователями бота
 */

import { User, Prisma } from '@prisma/client';
import { prisma } from './prisma.service';
import { logger } from '../logger';

/**
 * Интерфейс данных пользователя из Telegram
 */
export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

/**
 * Интерфейс для обновления данных пользователя
 */
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  email?: string;
  languageCode?: string;
  notificationEnabled?: boolean;
}

/**
 * Найти пользователя по Telegram ID или создать нового
 * @param telegramData - данные пользователя из Telegram
 * @returns Promise<User> - найденный или созданный пользователь
 */
export async function findOrCreateUser(
  telegramData: TelegramUserData
): Promise<User> {
  try {
    const telegramId = telegramData.id.toString();

    // Пытаемся найти существующего пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (user) {
      // Обновляем данные пользователя если они изменились
      const updateData: Prisma.UserUpdateInput = {};

      if (user.firstName !== telegramData.first_name) {
        updateData.firstName = telegramData.first_name;
      }
      if (user.lastName !== (telegramData.last_name || null)) {
        updateData.lastName = telegramData.last_name || null;
      }
      if (user.username !== (telegramData.username || null)) {
        updateData.username = telegramData.username || null;
      }
      if (user.languageCode !== (telegramData.language_code || null)) {
        updateData.languageCode = telegramData.language_code || null;
      }

      // Если есть изменения - обновляем
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { telegramId },
          data: updateData,
        });
        logger.info('Данные пользователя обновлены', { telegramId });
      }

      return user;
    }

    // Создаем нового пользователя
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name || null,
        username: telegramData.username || null,
        languageCode: telegramData.language_code || null,
        isPremium: telegramData.is_premium || false,
        isBanned: false,
        notificationEnabled: true,
      },
    });

    logger.info('Создан новый пользователь', {
      telegramId,
      username: telegramData.username,
    });

    return user;
  } catch (error) {
    logger.error('Ошибка при поиске/создании пользователя', {
      telegramId: telegramData.id,
      error,
    });
    throw error;
  }
}

/**
 * Обновить данные пользователя
 * @param userId - ID пользователя в базе
 * @param data - данные для обновления
 * @returns Promise<User> - обновленный пользователь
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<User> {
  try {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.languageCode !== undefined) {
      updateData.languageCode = data.languageCode;
    }
    if (data.notificationEnabled !== undefined) {
      updateData.notificationEnabled = data.notificationEnabled;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    logger.info('Пользователь обновлен', { userId });
    return user;
  } catch (error) {
    logger.error('Ошибка при обновлении пользователя', { userId, error });
    throw error;
  }
}

/**
 * Получить пользователя по Telegram ID
 * @param telegramId - ID пользователя в Telegram
 * @returns Promise<User | null> - пользователь или null
 */
export async function getUserByTelegramId(
  telegramId: string | number
): Promise<User | null> {
  try {
    const id = telegramId.toString();
    const user = await prisma.user.findUnique({
      where: { telegramId: id },
    });
    return user;
  } catch (error) {
    logger.error('Ошибка при получении пользователя', { telegramId, error });
    throw error;
  }
}

/**
 * Заблокировать пользователя
 * @param userId - ID пользователя в базе
 * @returns Promise<User> - заблокированный пользователь
 */
export async function banUser(userId: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
      },
    });

    logger.warn('Пользователь заблокирован', {
      userId,
      telegramId: user.telegramId,
    });

    return user;
  } catch (error) {
    logger.error('Ошибка при блокировке пользователя', { userId, error });
    throw error;
  }
}

/**
 * Разблокировать пользователя
 * @param userId - ID пользователя в базе
 * @returns Promise<User> - разблокированный пользователь
 */
export async function unbanUser(userId: string): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
      },
    });

    logger.info('Пользователь разблокирован', {
      userId,
      telegramId: user.telegramId,
    });

    return user;
  } catch (error) {
    logger.error('Ошибка при разблокировке пользователя', { userId, error });
    throw error;
  }
}

/**
 * Получить список всех активных пользователей
 * @returns Promise<User[]> - список пользователей
 */
export async function getActiveUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isBanned: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users;
  } catch (error) {
    logger.error('Ошибка при получении списка пользователей', { error });
    throw error;
  }
}

/**
 * Проверить, заблокирован ли пользователь
 * @param telegramId - ID пользователя в Telegram
 * @returns Promise<boolean> - true если заблокирован
 */
export async function isUserBanned(telegramId: string | number): Promise<boolean> {
  try {
    const user = await getUserByTelegramId(telegramId);
    return user?.isBanned ?? false;
  } catch (error) {
    logger.error('Ошибка при проверке статуса блокировки', { telegramId, error });
    return false;
  }
}
