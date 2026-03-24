/**
 * User Service
 * Сервис для управления пользователями бота
 */

import type { Prisma, User } from '@prisma/client';
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
  const telegramId = telegramData.id.toString();

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (user) {
      const updateData: Prisma.UserUpdateInput = {};

      if (user.firstName !== telegramData.first_name
