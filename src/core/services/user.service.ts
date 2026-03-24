import type { Prisma, User } from '@prisma/client';
import { prisma } from './prisma.service';
import { logger } from '../logger';

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
  const telegramId = String(telegramData.id);

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (user) {
      const updateData: Prisma.UserUpdateInput = {};
      let hasChanges = false;

      if (user.firstName !== telegramData.first_name) {
        updateData.firstName = telegramData.first_name;
        hasChanges = true;
      }

      if ((user.lastName ?? null) !== (telegramData.last_name ?? null)) {
        updateData.lastName = telegramData.last_name ?? null;
        hasChanges = true;
      }

      if ((user.username ?? null) !== (telegramData.username ?? null)) {
        updateData.username = telegramData.username ?? null;
        hasChanges = true;
      }

      if ((user.languageCode ?? null) !== (telegramData.language_code ?? null)) {
        updateData.languageCode = telegramData.language_code ?? null;
        hasChanges = true;
      }

      if ((user.isPremium ?? false) !== Boolean(telegramData.is_premium)) {
        updateData.isPremium = Boolean(telegramData.is_premium);
        hasChanges = true;
      }

      if (hasChanges) {
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
        lastName: telegramData.last_name ?? null,
        username: telegramData.username ?? null,
        languageCode: telegramData.language_code ?? null,
        isPremium: Boolean(telegramData.is_premium),
        isBanned: false,
        notificationEnabled: true,
      },
    });

    logger.info(
      { telegramId, username: telegramData.username ?? null },
      'New user created'
    );

    return user;
  } catch (error) {
    logger.error(
      { telegramId, error },
      'Error in findOrCreateUser'
    );
    throw error;
  }
}

export async function getUserByTelegramId(
  telegramId: string | number
): Promise<User | null> {
  const id = String(telegramId);

  return prisma.user.findUnique({
    where: { telegramId: id },
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getActiveUsers(): Promise<User[]> {
  return prisma.user.findMany({
    where: { isBanned: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUserNotificationSettings(
  userId: string,
  enabled: boolean
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      notificationEnabled: enabled,
    },
  });

  logger.info({ userId, enabled }, 'User notification settings updated');

  return user;
}

export async function banUser(userId: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
    },
  });

  logger.warn({ userId }, 'User banned');

  return user;
}

export async function unbanUser(userId: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: false,
    },
  });

  logger.info({ userId }, 'User unbanned');

  return user;
}
