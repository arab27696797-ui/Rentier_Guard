/**
 * Сервис для работы с запросами к экспертам
 * RentierGuard Bot
 * 
 * Бизнес-логика:
 * - createExpertRequest — создание запроса
 * - hasFreeConsultation — проверка бесплатной консультации
 * - markConsultationUsed — отметить использованной
 * - getUserRequests — история запросов
 * - updateRequestStatus — обновление статуса
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  ExpertRequestData,
  ExpertRequestStatus,
  CreateRequestResult,
  FreeConsultationInfo,
  RequestFilter,
  UserRequestStats,
  ExpertType,
} from '../types';
import {
  expertRequestSchema,
  validateWithErrors,
} from '../validators';

/**
 * Сервис для работы с экспертными запросами
 */
export class ExpertService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Создать новый запрос к эксперту
   * @param data - данные запроса
   * @returns результат создания
   */
  async createExpertRequest(
    data: unknown
  ): Promise<CreateRequestResult> {
    try {
      // Валидация входных данных
      const validation = validateWithErrors(expertRequestSchema, data);

      if (!validation.success) {
        return {
          success: false,
          error: validation.errors.join('\n'),
        };
      }

      const input = validation.data;

      // Генерируем уникальный ID
      const requestId = uuidv4();

      // Создаём запись в БД
      const dbRequest = await this.prisma.expertRequest.create({
        data: {
          id: requestId,
          userId: input.userId,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          expertType: input.expertType,
          description: input.description,
          details: input.details,
          status: ExpertRequestStatus.PENDING,
          priority: input.priority,
          isFree: input.isFree,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Преобразуем в интерфейс
      const request: ExpertRequestData = {
        id: dbRequest.id,
        userId: dbRequest.userId,
        username: dbRequest.username || undefined,
        firstName: dbRequest.firstName || undefined,
        lastName: dbRequest.lastName || undefined,
        expertType: dbRequest.expertType as ExpertType,
        description: dbRequest.description,
        details: dbRequest.details || undefined,
        status: dbRequest.status as ExpertRequestStatus,
        priority: dbRequest.priority as import('../types').RequestPriority,
        isFree: dbRequest.isFree,
        createdAt: dbRequest.createdAt,
        updatedAt: dbRequest.updatedAt,
        completedAt: dbRequest.completedAt || undefined,
        assignedExpertId: dbRequest.assignedExpertId || undefined,
        expertComment: dbRequest.expertComment || undefined,
      };

      console.log(`[ExpertService] Создан запрос ${requestId} для пользователя ${input.userId}`);

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error('[ExpertService] Ошибка при создании запроса:', error);
      return {
        success: false,
        error: 'Не удалось создать запрос. Пожалуйста, попробуйте позже.',
      };
    }
  }

  /**
   * Проверить, доступна ли бесплатная консультация пользователю
   * @param userId - ID пользователя
   * @returns true если доступна
   */
  async hasFreeConsultation(userId: number): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      // Ищем использованную бесплатную консультацию в текущем году
      const usedConsultation = await this.prisma.expertRequest.findFirst({
        where: {
          userId,
          isFree: true,
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
      });

      return !usedConsultation;
    } catch (error) {
      console.error('[ExpertService] Ошибка при проверке бесплатной консультации:', error);
      // В случае ошибки считаем, что консультация недоступна
      return false;
    }
  }

  /**
   * Получить информацию о бесплатной консультации
   * @param userId - ID пользователя
   * @returns информация о консультации
   */
  async getFreeConsultationInfo(userId: number): Promise<FreeConsultationInfo> {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const usedConsultation = await this.prisma.expertRequest.findFirst({
        where: {
          userId,
          isFree: true,
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (usedConsultation) {
        return {
          used: true,
          usedAt: usedConsultation.createdAt,
          year: currentYear,
        };
      }

      return {
        used: false,
      };
    } catch (error) {
      console.error('[ExpertService] Ошибка при получении информации о консультации:', error);
      return {
        used: true, // В случае ошибки считаем, что использована
      };
    }
  }

  /**
   * Отметить бесплатную консультацию как использованную
   * @param userId - ID пользователя
   */
  async markConsultationUsed(userId: number): Promise<void> {
    try {
      // На самом деле метка ставится при создании запроса с isFree=true
      // Этот метод может использоваться для дополнительной логики
      console.log(`[ExpertService] Бесплатная консультация пользователя ${userId} использована`);
    } catch (error) {
      console.error('[ExpertService] Ошибка при отметке консультации:', error);
    }
  }

  /**
   * Получить список запросов пользователя
   * @param userId - ID пользователя
   * @param filter - фильтр запросов
   * @returns список запросов
   */
  async getUserRequests(
    userId: number,
    filter?: RequestFilter
  ): Promise<ExpertRequestData[]> {
    try {
      const where: Record<string, unknown> = { userId };

      if (filter?.status) {
        where.status = filter.status;
      }

      if (filter?.expertType) {
        where.expertType = filter.expertType;
      }

      if (filter?.fromDate || filter?.toDate) {
        where.createdAt = {};
        if (filter.fromDate) {
          (where.createdAt as Record<string, Date>).gte = filter.fromDate;
        }
        if (filter.toDate) {
          (where.createdAt as Record<string, Date>).lte = filter.toDate;
        }
      }

      if (filter?.isFree !== undefined) {
        where.isFree = filter.isFree;
      }

      const requests = await this.prisma.expertRequest.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return requests.map((req) => this.mapDbRequestToInterface(req));
    } catch (error) {
      console.error('[ExpertService] Ошибка при получении запросов пользователя:', error);
      return [];
    }
  }

  /**
   * Получить запрос по ID
   * @param requestId - ID запроса
   * @returns запрос или null
   */
  async getRequestById(requestId: string): Promise<ExpertRequestData | null> {
    try {
      const request = await this.prisma.expertRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return null;
      }

      return this.mapDbRequestToInterface(request);
    } catch (error) {
      console.error('[ExpertService] Ошибка при получении запроса:', error);
      return null;
    }
  }

  /**
   * Обновить статус запроса
   * @param requestId - ID запроса
   * @param status - новый статус
   * @param options - дополнительные опции
   * @returns обновлённый запрос или null
   */
  async updateRequestStatus(
    requestId: string,
    status: ExpertRequestStatus,
    options?: {
      comment?: string;
      assignedExpertId?: number;
    }
  ): Promise<ExpertRequestData | null> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (options?.comment) {
        updateData.expertComment = options.comment;
      }

      if (options?.assignedExpertId) {
        updateData.assignedExpertId = options.assignedExpertId;
      }

      if (status === ExpertRequestStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updated = await this.prisma.expertRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      console.log(`[ExpertService] Запрос ${requestId} обновлён: ${status}`);

      return this.mapDbRequestToInterface(updated);
    } catch (error) {
      console.error('[ExpertService] Ошибка при обновлении статуса:', error);
      return null;
    }
  }

  /**
   * Получить статистику запросов пользователя
   * @param userId - ID пользователя
   * @returns статистика
   */
  async getUserRequestStats(userId: number): Promise<UserRequestStats> {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const [
        total,
        active,
        completed,
        freeUsed,
      ] = await Promise.all([
        // Всего запросов
        this.prisma.expertRequest.count({
          where: { userId },
        }),
        // Активных (не завершённых и не отменённых)
        this.prisma.expertRequest.count({
          where: {
            userId,
            status: {
              in: [ExpertRequestStatus.PENDING, ExpertRequestStatus.IN_PROGRESS, ExpertRequestStatus.WAITING_INFO],
            },
          },
        }),
        // Завершённых
        this.prisma.expertRequest.count({
          where: {
            userId,
            status: ExpertRequestStatus.COMPLETED,
          },
        }),
        // Бесплатных использовано в этом году
        this.prisma.expertRequest.count({
          where: {
            userId,
            isFree: true,
            createdAt: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
        }),
      ]);

      return {
        total,
        active,
        completed,
        freeUsed,
        freeAvailable: freeUsed === 0 ? 1 : 0,
      };
    } catch (error) {
      console.error('[ExpertService] Ошибка при получении статистики:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        freeUsed: 0,
        freeAvailable: 0,
      };
    }
  }

  /**
   * Получить все активные запросы (для админ-панели)
   * @param limit - лимит записей
   * @param offset - смещение
   * @returns список запросов
   */
  async getActiveRequests(
    limit: number = 50,
    offset: number = 0
  ): Promise<ExpertRequestData[]> {
    try {
      const requests = await this.prisma.expertRequest.findMany({
        where: {
          status: {
            in: [ExpertRequestStatus.PENDING, ExpertRequestStatus.IN_PROGRESS],
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: limit,
        skip: offset,
      });

      return requests.map((req) => this.mapDbRequestToInterface(req));
    } catch (error) {
      console.error('[ExpertService] Ошибка при получении активных запросов:', error);
      return [];
    }
  }

  /**
   * Отменить запрос
   * @param requestId - ID запроса
   * @param userId - ID пользователя (для проверки прав)
   * @returns успешность операции
   */
  async cancelRequest(
    requestId: string,
    userId: number
  ): Promise<boolean> {
    try {
      const request = await this.prisma.expertRequest.findFirst({
        where: {
          id: requestId,
          userId,
        },
      });

      if (!request) {
        return false;
      }

      // Можно отменить только незавершённые запросы
      if (
        request.status === ExpertRequestStatus.COMPLETED ||
        request.status === ExpertRequestStatus.CANCELLED
      ) {
        return false;
      }

      await this.prisma.expertRequest.update({
        where: { id: requestId },
        data: {
          status: ExpertRequestStatus.CANCELLED,
          updatedAt: new Date(),
        },
      });

      console.log(`[ExpertService] Запрос ${requestId} отменён пользователем ${userId}`);

      return true;
    } catch (error) {
      console.error('[ExpertService] Ошибка при отмене запроса:', error);
      return false;
    }
  }

  /**
   * Преобразовать DB модель в интерфейс
   */
  private mapDbRequestToInterface(dbRequest: {
    id: string;
    userId: number;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    expertType: string;
    description: string;
    details: string | null;
    status: string;
    priority: string;
    isFree: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    assignedExpertId: number | null;
    expertComment: string | null;
  }): ExpertRequestData {
    return {
      id: dbRequest.id,
      userId: dbRequest.userId,
      username: dbRequest.username || undefined,
      firstName: dbRequest.firstName || undefined,
      lastName: dbRequest.lastName || undefined,
      expertType: dbRequest.expertType as ExpertType,
      description: dbRequest.description,
      details: dbRequest.details || undefined,
      status: dbRequest.status as ExpertRequestStatus,
      priority: dbRequest.priority as import('../types').RequestPriority,
      isFree: dbRequest.isFree,
      createdAt: dbRequest.createdAt,
      updatedAt: dbRequest.updatedAt,
      completedAt: dbRequest.completedAt || undefined,
      assignedExpertId: dbRequest.assignedExpertId || undefined,
      expertComment: dbRequest.expertComment || undefined,
    };
  }
}

export default ExpertService;
