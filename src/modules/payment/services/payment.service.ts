/**
 * @fileoverview Сервис для работы с платежами
 * @module modules/payment/services/payment.service
 * 
 * Бизнес-логика:
 * - createPayment(data) - создание платежа
 * - getUpcomingPayments(userId, days) - получение предстоящих платежей
 * - markAsPaid(paymentId) - отметка платежа как оплаченного
 * - getPaymentsByContract(contractId) - получение платежей по договору
 * - exportPaymentsToCSV(userId, year) - экспорт в CSV
 */

import { PrismaClient, Payment as PrismaPayment, Prisma } from '@prisma/client';
import { 
  Payment, 
  PaymentWithDetails, 
  CreatePaymentInput, 
  UpdatePaymentInput,
  PaymentType,
  PaymentStatus,
  PaymentExportData,
  CSVHeaders 
} from '../types';
import { 
  createPaymentSchema, 
  updatePaymentSchema, 
  paymentIdSchema,
  exportPeriodSchema 
} from '../validators';
import { logger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

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
function mapPrismaToDomain(prismaPayment: PrismaPayment): Payment {
  return {
    id: prismaPayment.id,
    userId: prismaPayment.userId,
    contractId: prismaPayment.contractId,
    type: prismaPayment.type as PaymentType,
    amount: prismaPayment.amount,
    date: prismaPayment.date,
    status: prismaPayment.status as PaymentStatus,
    description: prismaPayment.description,
    paidAt: prismaPayment.paidAt,
    createdAt: prismaPayment.createdAt,
    updatedAt: prismaPayment.updatedAt,
  };
}

/**
 * Преобразует модель Prisma с include в PaymentWithDetails
 */
function mapPrismaToDomainWithDetails(
  prismaPayment: PrismaPayment & {
    contract: {
      id: string;
      tenantName: string;
      property: {
        id: string;
        address: string;
      };
    };
  }
): PaymentWithDetails {
  return {
    ...mapPrismaToDomain(prismaPayment),
    contract: prismaPayment.contract,
  };
}

// ============================================
// SERVICE
// ============================================

class PaymentService {

  /**
   * Создает новый платёж
   * @param data - Данные для создания платежа
   * @returns Созданный платёж
   */
  async createPayment(data: CreatePaymentInput): Promise<Payment> {
    try {
      // Валидация входных данных
      const validatedData = createPaymentSchema.parse(data);

      // Проверяем существование договора и принадлежность пользователю
      const contract = await prisma.contract.findUnique({
        where: { id: validatedData.contractId },
        select: { userId: true },
      });

      if (!contract) {
        throw new Error('❌ Договор не найден');
      }

      if (contract.userId !== validatedData.userId) {
        throw new Error('❌ У вас нет доступа к этому договору');
      }

      // Создаем платёж
      const prismaPayment = await prisma.payment.create({
        data: {
          userId: validatedData.userId,
          contractId: validatedData.contractId,
          type: validatedData.type,
          amount: validatedData.amount,
          date: validatedData.date,
          status: validatedData.status,
          description: validatedData.description || null,
          paidAt: validatedData.status === PaymentStatus.PAID ? new Date() : null,
        },
      });

      logger.info(`Payment created: ${prismaPayment.id} for user ${validatedData.userId}`);

      return mapPrismaToDomain(prismaPayment);
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Получает платёж по ID с деталями договора и объекта
   * @param id - ID платежа
   * @returns Платёж с деталями или null
   */
  async getPaymentById(id: string): Promise<PaymentWithDetails | null> {
    try {
      paymentIdSchema.parse(id);

      const prismaPayment = await prisma.payment.findUnique({
        where: { id },
        include: {
          contract: {
            select: {
              id: true,
              tenantName: true,
              property: {
                select: {
                  id: true,
                  address: true,
                },
              },
            },
          },
        },
      });

      if (!prismaPayment) {
        return null;
      }

      return mapPrismaToDomainWithDetails(prismaPayment);
    } catch (error) {
      logger.error(`Error fetching payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Получает предстоящие платежи пользователя
   * @param userId - ID пользователя
   * @param days - Количество дней вперёд
   * @returns Массив платежей с деталями
   */
  async getUpcomingPayments(userId: number, days: number = 30): Promise<PaymentWithDetails[]> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const prismaPayments = await prisma.payment.findMany({
        where: {
          userId,
          date: {
            lte: endDate,
          },
          status: {
            in: [PaymentStatus.PLANNED, PaymentStatus.OVERDUE],
          },
        },
        include: {
          contract: {
            select: {
              id: true,
              tenantName: true,
              property: {
                select: {
                  id: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      return prismaPayments.map(mapPrismaToDomainWithDetails);
    } catch (error) {
      logger.error(`Error fetching upcoming payments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает недавно оплаченные платежи
   * @param userId - ID пользователя
   * @param days - Количество дней назад
   * @returns Массив платежей с деталями
   */
  async getRecentPaidPayments(userId: number, days: number = 30): Promise<PaymentWithDetails[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const prismaPayments = await prisma.payment.findMany({
        where: {
          userId,
          status: PaymentStatus.PAID,
          paidAt: {
            gte: startDate,
          },
        },
        include: {
          contract: {
            select: {
              id: true,
              tenantName: true,
              property: {
                select: {
                  id: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: {
          paidAt: 'desc',
        },
      });

      return prismaPayments.map(mapPrismaToDomainWithDetails);
    } catch (error) {
      logger.error(`Error fetching recent paid payments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает платежи по договору
   * @param contractId - ID договора
   * @returns Массив платежей
   */
  async getPaymentsByContract(contractId: string): Promise<Payment[]> {
    try {
      const prismaPayments = await prisma.payment.findMany({
        where: { contractId },
        orderBy: {
          date: 'desc',
        },
      });

      return prismaPayments.map(mapPrismaToDomain);
    } catch (error) {
      logger.error(`Error fetching payments for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Отмечает платёж как оплаченный
   * @param paymentId - ID платежа
   * @returns Обновленный платёж
   */
  async markAsPaid(paymentId: string): Promise<Payment> {
    try {
      paymentIdSchema.parse(paymentId);

      const prismaPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      logger.info(`Payment marked as paid: ${paymentId}`);

      return mapPrismaToDomain(prismaPayment);
    } catch (error) {
      logger.error(`Error marking payment ${paymentId} as paid:`, error);
      throw error;
    }
  }

  /**
   * Обновляет платёж
   * @param id - ID платежа
   * @param data - Данные для обновления
   * @returns Обновленный платёж
   */
  async updatePayment(id: string, data: UpdatePaymentInput): Promise<Payment> {
    try {
      paymentIdSchema.parse(id);
      const validatedData = updatePaymentSchema.parse(data);

      const prismaPayment = await prisma.payment.update({
        where: { id },
        data: {
          ...(validatedData.type && { type: validatedData.type }),
          ...(validatedData.amount && { amount: validatedData.amount }),
          ...(validatedData.date && { date: validatedData.date }),
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.paidAt !== undefined && { paidAt: validatedData.paidAt }),
        },
      });

      logger.info(`Payment updated: ${id}`);

      return mapPrismaToDomain(prismaPayment);
    } catch (error) {
      logger.error(`Error updating payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Удаляет платёж
   * @param id - ID платежа
   */
  async deletePayment(id: string): Promise<void> {
    try {
      paymentIdSchema.parse(id);

      await prisma.payment.delete({
        where: { id },
      });

      logger.info(`Payment deleted: ${id}`);
    } catch (error) {
      logger.error(`Error deleting payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Проверяет просроченные платежи и обновляет их статус
   * @returns Количество обновленных платежей
   */
  async checkOverduePayments(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PLANNED,
          date: {
            lt: today,
          },
        },
        data: {
          status: PaymentStatus.OVERDUE,
        },
      });

      if (result.count > 0) {
        logger.info(`Marked ${result.count} payments as overdue`);
      }

      return result.count;
    } catch (error) {
      logger.error('Error checking overdue payments:', error);
      throw error;
    }
  }

  /**
   * Получает платежи за период
   * @param userId - ID пользователя
   * @param startDate - Начало периода
   * @param endDate - Конец периода
   * @returns Массив платежей с деталями
   */
  async getPaymentsByPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentWithDetails[]> {
    try {
      const prismaPayments = await prisma.payment.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          contract: {
            select: {
              id: true,
              tenantName: true,
              property: {
                select: {
                  id: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      return prismaPayments.map(mapPrismaToDomainWithDetails);
    } catch (error) {
      logger.error(`Error fetching payments by period for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Экспортирует платежи в CSV
   * @param userId - ID пользователя
   * @param year - Год для экспорта
   * @returns Путь к созданному файлу
   */
  async exportPaymentsToCSV(userId: number, year: number): Promise<string> {
    try {
      exportPeriodSchema.parse({ year });

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const payments = await this.getPaymentsByPeriod(userId, startDate, endDate);

      // Формируем данные для CSV
      const csvData: PaymentExportData[] = payments.map((payment) => ({
        id: payment.id,
        date: new Intl.DateTimeFormat('ru-RU').format(payment.date),
        type: payment.type,
        amount: payment.amount,
        status: payment.status,
        propertyAddress: payment.contract.property.address,
        tenantName: payment.contract.tenantName,
        description: payment.description,
      }));

      // Создаем CSV контент
      const csvContent = this.generateCSV(csvData);

      // Сохраняем файл
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileName = `payments_${userId}_${year}.csv`;
      const filePath = path.join(exportDir, fileName);

      fs.writeFileSync(filePath, csvContent, 'utf-8');

      logger.info(`Payments exported to CSV: ${filePath}`);

      return filePath;
    } catch (error) {
      logger.error(`Error exporting payments to CSV for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Генерирует CSV строку из данных
   * @param data - Данные для экспорта
   * @returns CSV строка
   */
  private generateCSV(data: PaymentExportData[]): string {
    if (data.length === 0) {
      return CSVHeaders.join(';') + '\n';
    }

    const rows: string[] = [];

    // BOM для корректного отображения в Excel
    rows.push('\uFEFF' + CSVHeaders.join(';'));

    // Данные
    data.forEach((payment) => {
      const row = [
        payment.date,
        payment.type,
        payment.amount.toString(),
        payment.status,
        `"${payment.propertyAddress.replace(/"/g, '""')}"`,
        `"${payment.tenantName.replace(/"/g, '""')}"`,
        payment.description ? `"${payment.description.replace(/"/g, '""')}"` : '',
      ];
      rows.push(row.join(';'));
    });

    // Итоговая строка
    const totalAmount = data.reduce((sum, p) => sum + p.amount, 0);
    rows.push('');
    rows.push(`ИТОГО;;;${totalAmount};;;;`);

    return rows.join('\n');
  }

  /**
   * Получает статистику платежей за период
   * @param userId - ID пользователя
   * @param startDate - Начало периода
   * @param endDate - Конец периода
   * @returns Статистика платежей
   */
  async getPaymentStatistics(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPlanned: number;
    totalPaid: number;
    totalOverdue: number;
    countPlanned: number;
    countPaid: number;
    countOverdue: number;
  }> {
    try {
      const payments = await prisma.payment.groupBy({
        by: ['status'],
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      const result = {
        totalPlanned: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countPlanned: 0,
        countPaid: 0,
        countOverdue: 0,
      };

      payments.forEach((group) => {
        const amount = group._sum.amount || 0;
        const count = group._count.id;

        switch (group.status) {
          case PaymentStatus.PLANNED:
            result.totalPlanned = amount;
            result.countPlanned = count;
            break;
          case PaymentStatus.PAID:
            result.totalPaid = amount;
            result.countPaid = count;
            break;
          case PaymentStatus.OVERDUE:
            result.totalOverdue = amount;
            result.countOverdue = count;
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error(`Error getting payment statistics for user ${userId}:`, error);
      throw error;
    }
  }
}

// ============================================
// EXPORT
// ============================================

export const paymentService = new PaymentService();
