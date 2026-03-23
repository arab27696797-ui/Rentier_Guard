/**
 * @fileoverview Сервис для работы с объектами недвижимости
 * @module modules/property/services/property.service
 * 
 * Бизнес-логика:
 * - createProperty(data) - создание объекта
 * - getUserProperties(userId) - получение списка объектов пользователя
 * - getPropertyById(id) - получение объекта по ID
 * - updateProperty(id, data) - обновление объекта
 * - deleteProperty(id) - удаление объекта
 */

import { PrismaClient, Property as PrismaProperty } from '@prisma/client';
import { Property, CreatePropertyInput, UpdatePropertyInput, PropertyType, TaxRegime } from '../types';
import { createPropertySchema, updatePropertySchema, propertyIdSchema } from '../validators';
import { logger } from '../../../utils/logger';

// ============================================
// PRISMA CLIENT
// ============================================

const prisma = new PrismaClient();

// ============================================
// MAPPER
// ============================================

/**
 * Преобразует модель Prisma в доменную модель
 */
function mapPrismaToDomain(prismaProperty: PrismaProperty): Property {
  return {
    id: prismaProperty.id,
    userId: prismaProperty.userId,
    address: prismaProperty.address,
    cadastralNumber: prismaProperty.cadastralNumber,
    type: prismaProperty.type as PropertyType,
    taxRegime: prismaProperty.taxRegime as TaxRegime,
    createdAt: prismaProperty.createdAt,
    updatedAt: prismaProperty.updatedAt,
  };
}

// ============================================
// SERVICE
// ============================================

class PropertyService {
  
  /**
   * Создает новый объект недвижимости
   * @param data - Данные для создания объекта
   * @returns Созданный объект
   * @throws Error при невалидных данных или ошибке БД
   */
  async createProperty(data: CreatePropertyInput): Promise<Property> {
    try {
      // Валидация входных данных
      const validatedData = createPropertySchema.parse(data);

      // Создаем объект в БД
      const prismaProperty = await prisma.property.create({
        data: {
          userId: validatedData.userId,
          address: validatedData.address,
          cadastralNumber: validatedData.cadastralNumber || null,
          type: validatedData.type,
          taxRegime: validatedData.taxRegime,
        },
      });

      logger.info(`Property created: ${prismaProperty.id} for user ${validatedData.userId}`);

      return mapPrismaToDomain(prismaProperty);
    } catch (error) {
      logger.error('Error creating property:', error);
      throw error;
    }
  }

  /**
   * Получает список объектов пользователя с пагинацией
   * @param userId - ID пользователя
   * @param page - Номер страницы (начиная с 0)
   * @param limit - Количество объектов на странице
   * @returns Массив объектов недвижимости
   */
  async getUserProperties(
    userId: number,
    page: number = 0,
    limit: number = 10
  ): Promise<Property[]> {
    try {
      const prismaProperties = await prisma.property.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: page * limit,
        take: limit,
      });

      return prismaProperties.map(mapPrismaToDomain);
    } catch (error) {
      logger.error(`Error fetching properties for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает все объекты пользователя (без пагинации)
   * @param userId - ID пользователя
   * @returns Массив объектов недвижимости
   */
  async getAllUserProperties(userId: number): Promise<Property[]> {
    try {
      const prismaProperties = await prisma.property.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return prismaProperties.map(mapPrismaToDomain);
    } catch (error) {
      logger.error(`Error fetching all properties for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает объект недвижимости по ID
   * @param id - ID объекта
   * @returns Объект недвижимости или null
   */
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      // Валидация ID
      propertyIdSchema.parse(id);

      const prismaProperty = await prisma.property.findUnique({
        where: { id },
      });

      if (!prismaProperty) {
        return null;
      }

      return mapPrismaToDomain(prismaProperty);
    } catch (error) {
      logger.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Получает количество объектов пользователя
   * @param userId - ID пользователя
   * @returns Количество объектов
   */
  async getUserPropertiesCount(userId: number): Promise<number> {
    try {
      const count = await prisma.property.count({
        where: { userId },
      });

      return count;
    } catch (error) {
      logger.error(`Error counting properties for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Обновляет объект недвижимости
   * @param id - ID объекта
   * @param data - Данные для обновления
   * @returns Обновленный объект
   * @throws Error при невалидных данных или если объект не найден
   */
  async updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
    try {
      // Валидация ID
      propertyIdSchema.parse(id);

      // Валидация данных
      const validatedData = updatePropertySchema.parse(data);

      // Проверяем существование объекта
      const existingProperty = await prisma.property.findUnique({
        where: { id },
      });

      if (!existingProperty) {
        throw new Error('❌ Объект не найден');
      }

      // Обновляем объект
      const prismaProperty = await prisma.property.update({
        where: { id },
        data: {
          ...(validatedData.address && { address: validatedData.address }),
          ...(validatedData.cadastralNumber !== undefined && { 
            cadastralNumber: validatedData.cadastralNumber 
          }),
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.taxRegime && { taxRegime: validatedData.taxRegime }),
        },
      });

      logger.info(`Property updated: ${id}`);

      return mapPrismaToDomain(prismaProperty);
    } catch (error) {
      logger.error(`Error updating property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Удаляет объект недвижимости
   * @param id - ID объекта
   * @throws Error если объект не найден или есть связанные договоры
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      // Валидация ID
      propertyIdSchema.parse(id);

      // Проверяем существование объекта
      const existingProperty = await prisma.property.findUnique({
        where: { id },
        include: {
          contracts: true,
        },
      });

      if (!existingProperty) {
        throw new Error('❌ Объект не найден');
      }

      // Проверяем наличие связанных договоров
      if (existingProperty.contracts.length > 0) {
        throw new Error(
          `❌ Нельзя удалить объект: существует ${existingProperty.contracts.length} договор(ов). ` +
          'Сначала удалите или перенесите договоры.'
        );
      }

      // Удаляем объект
      await prisma.property.delete({
        where: { id },
      });

      logger.info(`Property deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting property ${id}:`, error);
      throw error;
    }
  }

  /**
   * Проверяет, принадлежит ли объект указанному пользователю
   * @param propertyId - ID объекта
   * @param userId - ID пользователя
   * @returns true если объект принадлежит пользователю
   */
  async isPropertyOwner(propertyId: string, userId: number): Promise<boolean> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { userId: true },
      });

      return property?.userId === userId;
    } catch (error) {
      logger.error(`Error checking property ownership:`, error);
      throw error;
    }
  }

  /**
   * Поиск объектов по адресу
   * @param userId - ID пользователя
   * @param query - Поисковый запрос
   * @returns Массив найденных объектов
   */
  async searchProperties(userId: number, query: string): Promise<Property[]> {
    try {
      const prismaProperties = await prisma.property.findMany({
        where: {
          userId,
          address: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return prismaProperties.map(mapPrismaToDomain);
    } catch (error) {
      logger.error(`Error searching properties:`, error);
      throw error;
    }
  }
}

// ============================================
// EXPORT
// ============================================

export const propertyService = new PropertyService();
