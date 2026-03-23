/**
 * Сервис работы с проблемами
 * RentierGuard Bot
 */

import { PrismaClient } from '@prisma/client';
import {
  ProblemType,
  ProblemScenario,
  BadTenantData,
  BadTenantOperationResult,
  ClaimGenerationResult,
  GeneratedClaim,
  ClaimTemplateType,
  NonPaymentData,
  DamageData,
  EvictionData,
  ProblemDetails,
} from '../types';
import { getScenarioByType } from '../content/problemScenarios';
import { generateClaim, formatClaimForTelegram } from './claimGenerator.service';
import { validateBadTenantData, validateProblemData } from '../validators';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Prisma клиент будет передан извне или создан здесь
let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient): void {
  prisma = client;
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client not initialized. Call setPrismaClient first.');
  }
  return prisma;
}

// ============================================
// РАБОТА СО СЦЕНАРИЯМИ
// ============================================

/**
 * Получить сценарий решения проблемы по типу
 */
export function getProblemScenario(type: ProblemType): ProblemScenario {
  return getScenarioByType(type);
}

/**
 * Получить список всех типов проблем с описаниями
 */
export function getProblemTypesList(): { type: ProblemType; label: string; description: string }[] {
  return [
    {
      type: ProblemType.NON_PAYMENT,
      label: 'Не платит аренду 💰',
      description: 'Арендатор задерживает или не платит аренду',
    },
    {
      type: ProblemType.PROPERTY_DAMAGE,
      label: 'Портит имущество 🔨',
      description: 'Обнаружены повреждения квартиры или мебели',
    },
    {
      type: ProblemType.EVICTION_WITHOUT_PAY,
      label: 'Выезд без оплаты 🚪',
      description: 'Арендатор съехал, оставив долг',
    },
    {
      type: ProblemType.OTHER,
      label: 'Другое ❓',
      description: 'Другие проблемы (шум, нарушение правил и т.д.)',
    },
  ];
}

// ============================================
// ГЕНЕРАЦИЯ ПРЕТЕНЗИЙ
// ============================================

/**
 * Сгенерировать текст претензии
 */
export function generateClaimText(
  data: ProblemDetails,
  type: ProblemType
): ClaimGenerationResult {
  try {
    // Определяем тип претензии
    let claimType: ClaimTemplateType;
    
    switch (type) {
      case ProblemType.NON_PAYMENT:
        claimType = ClaimTemplateType.NON_PAYMENT;
        break;
      case ProblemType.PROPERTY_DAMAGE:
        claimType = ClaimTemplateType.DAMAGE;
        break;
      case ProblemType.EVICTION_WITHOUT_PAY:
        claimType = ClaimTemplateType.EVICTION;
        break;
      default:
        claimType = ClaimTemplateType.TERMINATION;
    }

    // Генерируем претензию
    const result = generateClaim(claimType, data);
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка генерации претензии',
    };
  }
}

/**
 * Сгенерировать уведомление о расторжении
 */
export function generateTerminationLetter(
  data: ProblemDetails,
  reason: string
): ClaimGenerationResult {
  try {
    const claimData = {
      ...data,
      reason,
    };
    
    return generateClaim(ClaimTemplateType.TERMINATION, claimData);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка генерации уведомления',
    };
  }
}

/**
 * Форматировать претензию для отправки в Telegram
 */
export function formatClaimForMessage(claim: GeneratedClaim): string {
  return formatClaimForTelegram(claim);
}

// ============================================
// ЧЁРНЫЙ СПИСОК - ДОБАВЛЕНИЕ
// ============================================

/**
 * Добавить арендатора в чёрный список
 */
export async function addToBadTenant(
  data: Omit<BadTenantData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BadTenantOperationResult> {
  try {
    // Валидация данных
    const validation = validateBadTenantData(data);
    if (!validation.success) {
      return {
        success: false,
        message: 'Ошибка валидации данных',
        error: validation.errors?.join(', '),
      };
    }

    // Проверяем, есть ли уже такая запись
    const existingTenant = await prisma.badTenant.findFirst({
      where: {
        userId: data.userId,
        fullName: {
          equals: data.fullName,
          mode: 'insensitive',
        },
      },
    });

    if (existingTenant) {
      return {
        success: false,
        message: 'Арендатор с таким ФИО уже есть в вашем списке',
        error: 'DUPLICATE_ENTRY',
      };
    }

    // Создаём запись
    const tenant = await prisma.badTenant.create({
      data: {
        userId: data.userId,
        fullName: data.fullName,
        passportData: data.passportData || null,
        phoneNumber: data.phoneNumber || null,
        reason: data.reason,
        description: data.description,
        contractDate: data.contractDate || null,
        contractEndDate: data.contractEndDate || null,
        debtAmount: data.debtAmount || null,
      },
    });

    return {
      success: true,
      message: 'Арендатор успешно добавлен в чёрный список',
      data: {
        id: tenant.id,
        userId: tenant.userId,
        fullName: tenant.fullName,
        passportData: tenant.passportData || undefined,
        phoneNumber: tenant.phoneNumber || undefined,
        reason: tenant.reason as BadTenantData['reason'],
        description: tenant.description,
        contractDate: tenant.contractDate || undefined,
        contractEndDate: tenant.contractEndDate || undefined,
        debtAmount: tenant.debtAmount || undefined,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error adding to bad tenant list:', error);
    return {
      success: false,
      message: 'Ошибка при добавлении в чёрный список',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// ЧЁРНЫЙ СПИСОК - ПОЛУЧЕНИЕ
// ============================================

/**
 * Получить список проблемных арендаторов пользователя
 */
export async function getUserBadTenants(
  userId: string
): Promise<BadTenantOperationResult> {
  try {
    const tenants = await prisma.badTenant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const mappedTenants: BadTenantData[] = tenants.map(tenant => ({
      id: tenant.id,
      userId: tenant.userId,
      fullName: tenant.fullName,
      passportData: tenant.passportData || undefined,
      phoneNumber: tenant.phoneNumber || undefined,
      reason: tenant.reason as BadTenantData['reason'],
      description: tenant.description,
      contractDate: tenant.contractDate || undefined,
      contractEndDate: tenant.contractEndDate || undefined,
      debtAmount: tenant.debtAmount || undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));

    return {
      success: true,
      message: `Найдено записей: ${tenants.length}`,
      data: mappedTenants,
    };
  } catch (error) {
    console.error('Error getting bad tenants:', error);
    return {
      success: false,
      message: 'Ошибка при получении списка',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Получить одну запись из чёрного списка
 */
export async function getBadTenantById(
  id: string,
  userId: string
): Promise<BadTenantOperationResult> {
  try {
    const tenant = await prisma.badTenant.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!tenant) {
      return {
        success: false,
        message: 'Запись не найдена',
        error: 'NOT_FOUND',
      };
    }

    return {
      success: true,
      message: 'Запись найдена',
      data: {
        id: tenant.id,
        userId: tenant.userId,
        fullName: tenant.fullName,
        passportData: tenant.passportData || undefined,
        phoneNumber: tenant.phoneNumber || undefined,
        reason: tenant.reason as BadTenantData['reason'],
        description: tenant.description,
        contractDate: tenant.contractDate || undefined,
        contractEndDate: tenant.contractEndDate || undefined,
        debtAmount: tenant.debtAmount || undefined,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error getting bad tenant:', error);
    return {
      success: false,
      message: 'Ошибка при получении записи',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// ЧЁРНЫЙ СПИСОК - УДАЛЕНИЕ
// ============================================

/**
 * Удалить запись из чёрного списка
 */
export async function deleteBadTenant(
  id: string,
  userId: string
): Promise<BadTenantOperationResult> {
  try {
    // Проверяем существование записи
    const existingTenant = await prisma.badTenant.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingTenant) {
      return {
        success: false,
        message: 'Запись не найдена или у вас нет прав на её удаление',
        error: 'NOT_FOUND_OR_UNAUTHORIZED',
      };
    }

    // Удаляем запись
    await prisma.badTenant.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Запись успешно удалена из чёрного списка',
      data: {
        id: existingTenant.id,
        userId: existingTenant.userId,
        fullName: existingTenant.fullName,
        reason: existingTenant.reason as BadTenantData['reason'],
        description: existingTenant.description,
        createdAt: existingTenant.createdAt,
      },
    };
  } catch (error) {
    console.error('Error deleting bad tenant:', error);
    return {
      success: false,
      message: 'Ошибка при удалении записи',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// ЧЁРНЫЙ СПИСОК - ПОИСК
// ============================================

/**
 * Поиск в чёрном списке по ФИО
 */
export async function searchBadTenants(
  userId: string,
  query: string
): Promise<BadTenantOperationResult> {
  try {
    const tenants = await prisma.badTenant.findMany({
      where: {
        userId,
        fullName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedTenants: BadTenantData[] = tenants.map(tenant => ({
      id: tenant.id,
      userId: tenant.userId,
      fullName: tenant.fullName,
      passportData: tenant.passportData || undefined,
      phoneNumber: tenant.phoneNumber || undefined,
      reason: tenant.reason as BadTenantData['reason'],
      description: tenant.description,
      contractDate: tenant.contractDate || undefined,
      contractEndDate: tenant.contractEndDate || undefined,
      debtAmount: tenant.debtAmount || undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));

    return {
      success: true,
      message: `Найдено записей: ${tenants.length}`,
      data: mappedTenants,
    };
  } catch (error) {
    console.error('Error searching bad tenants:', error);
    return {
      success: false,
      message: 'Ошибка при поиске',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// СТАТИСТИКА
// ============================================

/**
 * Получить статистику по проблемам пользователя
 */
export async function getUserProblemStats(
  userId: string
): Promise<{
  success: boolean;
  stats?: {
    totalBadTenants: number;
    byReason: Record<string, number>;
    totalDebtAmount: number;
  };
  error?: string;
}> {
  try {
    const tenants = await prisma.badTenant.findMany({
      where: { userId },
    });

    const byReason: Record<string, number> = {};
    let totalDebtAmount = 0;

    tenants.forEach(tenant => {
      byReason[tenant.reason] = (byReason[tenant.reason] || 0) + 1;
      if (tenant.debtAmount) {
        totalDebtAmount += tenant.debtAmount;
      }
    });

    return {
      success: true,
      stats: {
        totalBadTenants: tenants.length,
        byReason,
        totalDebtAmount,
      },
    };
  } catch (error) {
    console.error('Error getting problem stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// ВАЛИДАЦИЯ ДАННЫХ
// ============================================

/**
 * Валидировать данные проблемы
 */
export function validateProblemInput(data: unknown): {
  success: boolean;
  errors?: string[];
} {
  const result = validateProblemData(data);
  return {
    success: result.success,
    errors: result.errors,
  };
}

/**
 * Валидировать данные чёрного списка
 */
export function validateBadTenantInput(data: unknown): {
  success: boolean;
  errors?: string[];
} {
  const result = validateBadTenantData(data);
  return {
    success: result.success,
    errors: result.errors,
  };
}
