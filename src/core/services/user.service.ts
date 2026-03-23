/**
 * User Service
 * Сервис для управления пользователями бота
 */

import { User, Prisma } from '@prisma/client';
import { prisma } from './prisma.service';
import { logger } from '../utils/logger';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export async function findOrCreateUser(
  telegramData: TelegramUserData
): Promise<User> {
  try {
    const telegramId = telegramData.id.toString();

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (user) {
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

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { telegramId },
          data: updateData,
        });
        logger.info({ telegramId }, 'User data updated');
      }

      return user;
    }

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

    logger.info({ telegramId, username: telegramData.username }, 'New user created');

    return user;
  } catch (error) {
    logger.error({ telegramId: telegramData.id, error }, 'Error in findOrCreateUser');
    throw error;
  }
}

export async function getUserByTelegramId(
  telegramId: string | number
): Promise<User | null> {
  const id = telegramId.toString();
  return prisma.user.findUnique({ where: { telegramId: id } });
}

export async function getActiveUsers(): Promise<User[]> {
  return prisma.user.findMany({
    where: { isBanned: false },
    orderBy: { createdAt: 'desc' },
  });
}
