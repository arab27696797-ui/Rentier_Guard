/**
 * =========================================
 * Модуль Договоров - Сервис
 * RentierGuard Telegram Bot
 * =========================================
 * 
 * Бизнес-логика для работы с договорами аренды.
 * Использует Prisma для работы с базой данных.
 */

import { PrismaClient } from '@prisma/client';
import {
  ContractData,
  ContractStatus,
  ContractType,
  ContractSummary,
  CreateContractInput,
  ServiceResult,
  ActData,
  CreateActInput,
  AddendumData,
  CreateAddendumInput,
  InventoryItemData,
} from '../types';
import { contractSchema, actSchema, addendumSchema } from '../validators';

// Инициализация Prisma клиента
const prisma = new PrismaClient();

/**
 * =========================================
 * СЕРВИС ДОГОВОРОВ
 * =========================================
 */

export class ContractService {
  
  /**
   * =========================================
   * CRUD ОПЕРАЦИИ С ДОГОВОРАМИ
   * =========================================
   */

  /**
   * Создание нового договора аренды
   * @param data - Данные для создания договора
   * @returns Результат операции с созданным договором
   */
  static async createContract(data: CreateContractInput): Promise<ServiceResult<ContractData>> {
    try {
      // Валидация данных через Zod
      const validationResult = contractSchema.safeParse(data);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message);
        return {
          success: false,
          error: `Ошибка валидации: ${errors.join(', ')}`,
        };
      }

      // Создание записи в БД через Prisma
      const contract = await prisma.contract.create({
        data: {
          landlordId: data.landlordId,
          contractType: data.contractType,
          propertyAddress: data.propertyAddress,
          tenantFullName: data.tenantFullName,
          tenantPassport: data.tenantPassport,
          tenantPhone: data.tenantPhone,
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyRent: data.monthlyRent,
          depositAmount: data.depositAmount,
          needsRosreestrRegistration: data.needsRosreestrRegistration,
          additionalTerms: data.additionalTerms,
          status: data.status || ContractStatus.DRAFT,
        },
      });

      return {
        success: true,
        data: this.mapPrismaContractToContractData(contract),
      };
    } catch (error) {
      console.error('[ContractService.createContract] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось создать договор. Попробуйте позже.',
      };
    }
  }

  /**
   * Получение списка договоров пользователя
   * @param userId - ID пользователя (арендодателя)
   * @returns Список договоров пользователя
   */
  static async getUserContracts(userId: string): Promise<ServiceResult<ContractSummary[]>> {
    try {
      const contracts = await prisma.contract.findMany({
        where: {
          landlordId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          propertyAddress: true,
          tenantFullName: true,
          status: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
        },
      });

      const summaries: ContractSummary[] = contracts.map(contract => ({
        id: contract.id,
        address: contract.propertyAddress,
        tenantName: contract.tenantFullName,
        status: contract.status as ContractStatus,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
      }));

      return {
        success: true,
        data: summaries,
      };
    } catch (error) {
      console.error('[ContractService.getUserContracts] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось получить список договоров.',
      };
    }
  }

  /**
   * Получение договора по ID
   * @param id - ID договора
   * @returns Договор или null
   */
  static async getContractById(id: string): Promise<ServiceResult<ContractData>> {
    try {
      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          acts: true,
          addendums: true,
        },
      });

      if (!contract) {
        return {
          success: false,
          error: 'Договор не найден.',
        };
      }

      return {
        success: true,
        data: this.mapPrismaContractToContractData(contract),
      };
    } catch (error) {
      console.error('[ContractService.getContractById] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось получить договор.',
      };
    }
  }

  /**
   * Получение договора с проверкой владельца
   * @param contractId - ID договора
   * @param userId - ID пользователя
   * @returns Договор или ошибка доступа
   */
  static async getContractWithAccessCheck(
    contractId: string,
    userId: string
  ): Promise<ServiceResult<ContractData>> {
    try {
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          landlordId: userId,
        },
      });

      if (!contract) {
        return {
          success: false,
          error: 'Договор не найден или у вас нет доступа.',
        };
      }

      return {
        success: true,
        data: this.mapPrismaContractToContractData(contract),
      };
    } catch (error) {
      console.error('[ContractService.getContractWithAccessCheck] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось получить договор.',
      };
    }
  }

  /**
   * Обновление статуса договора
   * @param id - ID договора
   * @param status - Новый статус
   * @returns Результат операции
   */
  static async updateContractStatus(
    id: string,
    status: ContractStatus
  ): Promise<ServiceResult<ContractData>> {
    try {
      const contract = await prisma.contract.update({
        where: { id },
        data: { status },
      });

      return {
        success: true,
        data: this.mapPrismaContractToContractData(contract),
      };
    } catch (error) {
      console.error('[ContractService.updateContractStatus] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось обновить статус договора.',
      };
    }
  }

  /**
   * Удаление договора
   * @param id - ID договора
   * @returns Результат операции
   */
  static async deleteContract(id: string): Promise<ServiceResult<void>> {
    try {
      // Сначала удаляем связанные записи
      await prisma.$transaction([
        prisma.inventoryItem.deleteMany({
          where: { act: { contractId: id } },
        }),
        prisma.act.deleteMany({
          where: { contractId: id },
        }),
        prisma.addendum.deleteMany({
          where: { contractId: id },
        }),
        prisma.contract.delete({
          where: { id },
        }),
      ]);

      return {
        success: true,
      };
    } catch (error) {
      console.error('[ContractService.deleteContract] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось удалить договор.',
      };
    }
  }

  /**
   * =========================================
   * РАБОТА С АКТАМИ ПРИЕМА-ПЕРЕДАЧИ
   * =========================================
   */

  /**
   * Создание акта приема-передачи
   * @param data - Данные для создания акта
   * @returns Результат операции
   */
  static async createAct(data: CreateActInput): Promise<ServiceResult<ActData>> {
    try {
      // Валидация данных
      const validationResult = actSchema.safeParse(data);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message);
        return {
          success: false,
          error: `Ошибка валидации: ${errors.join(', ')}`,
        };
      }

      // Создание акта с инвентарными пунктами
      const act = await prisma.act.create({
        data: {
          contractId: data.contractId,
          userId: data.userId,
          actType: data.actType,
          actDate: data.actDate,
          meterReadings: data.meterReadings,
          notes: data.notes,
          inventoryItems: {
            create: data.inventoryItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              condition: item.condition,
              description: item.description,
            })),
          },
        },
        include: {
          inventoryItems: true,
        },
      });

      return {
        success: true,
        data: this.mapPrismaActToActData(act),
      };
    } catch (error) {
      console.error('[ContractService.createAct] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось создать акт.',
      };
    }
  }

  /**
   * Получение актов по договору
   * @param contractId - ID договора
   * @returns Список актов
   */
  static async getActsByContract(contractId: string): Promise<ServiceResult<ActData[]>> {
    try {
      const acts = await prisma.act.findMany({
        where: { contractId },
        include: {
          inventoryItems: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: acts.map(act => this.mapPrismaActToActData(act)),
      };
    } catch (error) {
      console.error('[ContractService.getActsByContract] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось получить акты.',
      };
    }
  }

  /**
   * =========================================
   * РАБОТА С ДОПОЛНИТЕЛЬНЫМИ СОГЛАШЕНИЯМИ
   * =========================================
   */

  /**
   * Создание дополнительного соглашения
   * @param data - Данные для создания допсоглашения
   * @returns Результат операции
   */
  static async createAddendum(
    data: CreateAddendumInput
  ): Promise<ServiceResult<AddendumData>> {
    try {
      // Валидация данных
      const validationResult = addendumSchema.safeParse(data);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message);
        return {
          success: false,
          error: `Ошибка валидации: ${errors.join(', ')}`,
        };
      }

      const addendum = await prisma.addendum.create({
        data: {
          contractId: data.contractId,
          userId: data.userId,
          addendumType: data.addendumType,
          newValue: data.newValue,
          oldValue: data.oldValue,
          effectiveDate: data.effectiveDate,
          reason: data.reason,
        },
      });

      return {
        success: true,
        data: this.mapPrismaAddendumToAddendumData(addendum),
      };
    } catch (error) {
      console.error('[ContractService.createAddendum] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось создать дополнительное соглашение.',
      };
    }
  }

  /**
   * Получение допсоглашений по договору
   * @param contractId - ID договора
   * @returns Список допсоглашений
   */
  static async getAddendumsByContract(
    contractId: string
  ): Promise<ServiceResult<AddendumData[]>> {
    try {
      const addendums = await prisma.addendum.findMany({
        where: { contractId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: addendums.map(a => this.mapPrismaAddendumToAddendumData(a)),
      };
    } catch (error) {
      console.error('[ContractService.getAddendumsByContract] Ошибка:', error);
      return {
        success: false,
        error: 'Не удалось получить дополнительные соглашения.',
      };
    }
  }

  /**
   * =========================================
   * ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
   * =========================================
   */

  /**
   * Маппинг Prisma Contract в ContractData
   */
  private static mapPrismaContractToContractData(prismaContract: any): ContractData {
    return {
      id: prismaContract.id,
      landlordId: prismaContract.landlordId,
      contractType: prismaContract.contractType as ContractType,
      propertyAddress: prismaContract.propertyAddress,
      tenantFullName: prismaContract.tenantFullName,
      tenantPassport: prismaContract.tenantPassport,
      tenantPhone: prismaContract.tenantPhone,
      startDate: prismaContract.startDate,
      endDate: prismaContract.endDate,
      monthlyRent: prismaContract.monthlyRent,
      depositAmount: prismaContract.depositAmount,
      needsRosreestrRegistration: prismaContract.needsRosreestrRegistration,
      additionalTerms: prismaContract.additionalTerms || undefined,
      status: prismaContract.status as ContractStatus,
      createdAt: prismaContract.createdAt,
      updatedAt: prismaContract.updatedAt,
    };
  }

  /**
   * Маппинг Prisma Act в ActData
   */
  private static mapPrismaActToActData(prismaAct: any): ActData {
    return {
      id: prismaAct.id,
      contractId: prismaAct.contractId,
      userId: prismaAct.userId,
      actType: prismaAct.actType as 'acceptance' | 'transfer',
      actDate: prismaAct.actDate,
      inventoryItems: prismaAct.inventoryItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        condition: item.condition,
        description: item.description || undefined,
      })),
      meterReadings: prismaAct.meterReadings || undefined,
      notes: prismaAct.notes || undefined,
      createdAt: prismaAct.createdAt,
    };
  }

  /**
   * Маппинг Prisma Addendum в AddendumData
   */
  private static mapPrismaAddendumToAddendumData(prismaAddendum: any): AddendumData {
    return {
      id: prismaAddendum.id,
      contractId: prismaAddendum.contractId,
      userId: prismaAddendum.userId,
      addendumType: prismaAddendum.addendumType,
      newValue: prismaAddendum.newValue,
      oldValue: prismaAddendum.oldValue || undefined,
      effectiveDate: prismaAddendum.effectiveDate,
      reason: prismaAddendum.reason || undefined,
      createdAt: prismaAddendum.createdAt,
    };
  }
}

// Экспорт singleton экземпляра
export const contractService = new ContractService();
