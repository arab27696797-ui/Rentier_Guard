/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис платежей
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Управление платежами по договорам аренды.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface Payment {
  id: number;
  userId: number;
  contractId: number;
  propertyId: number;
  tenantId: number;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description: string | null;
  createdAt: Date;
}

export interface UpcomingPayment {
  id: number;
  userId: number;
  amount: number;
  dueDate: string;
  propertyAddress: string;
  tenantName: string;
  tenantId: number;
}

export interface MonthlyStats {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  activeContracts: number;
  newContracts: number;
  expiredContracts: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис платежей
// ═══════════════════════════════════════════════════════════════════════════════

export class PaymentService {
  constructor(private pool: Pool) {}

  /**
   * Получить предстоящие платежи
   */
  async getUpcomingPayments(days: number): Promise<UpcomingPayment[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          p.id,
          p.user_id,
          p.amount,
          p.due_date,
          prop.address as property_address,
          t.full_name as tenant_name,
          t.id as tenant_id
        FROM payments p
        JOIN contracts c ON p.contract_id = c.id
        JOIN properties prop ON p.property_id = prop.id
        JOIN tenants t ON p.tenant_id = t.id
        WHERE p.status = 'pending'
          AND p.due_date <= CURRENT_DATE + INTERVAL '${days} days'
          AND p.due_date >= CURRENT_DATE
        ORDER BY p.due_date ASC
      `;
      
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        dueDate: row.due_date,
        propertyAddress: row.property_address,
        tenantName: row.tenant_name,
        tenantId: row.tenant_id,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Получить статистику за месяц
   */
  async getMonthlyStats(userId: number, month: number, year: number): Promise<MonthlyStats> {
    const client = await this.pool.connect();
    
    try {
      // Получаем сумму полученных платежей
      const receivedQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE user_id = $1
          AND status = 'paid'
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND EXTRACT(YEAR FROM paid_date) = $3
      `;
      const receivedResult = await client.query(receivedQuery, [userId, month, year]);
      
      // Получаем сумму ожидаемых платежей
      const pendingQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE user_id = $1
          AND status = 'pending'
          AND EXTRACT(MONTH FROM due_date) = $2
          AND EXTRACT(YEAR FROM due_date) = $3
      `;
      const pendingResult = await client.query(pendingQuery, [userId, month, year]);
      
      // Получаем сумму просроченных платежей
      const overdueQuery = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE user_id = $1
          AND status = 'overdue'
          AND EXTRACT(MONTH FROM due_date) = $2
          AND EXTRACT(YEAR FROM due_date) = $3
      `;
      const overdueResult = await client.query(overdueQuery, [userId, month, year]);
      
      // Получаем количество активных договоров
      const activeContractsQuery = `
        SELECT COUNT(*) as count
        FROM contracts
        WHERE user_id = $1
          AND status = 'active'
      `;
      const activeContractsResult = await client.query(activeContractsQuery, [userId]);
      
      // Получаем количество новых договоров
      const newContractsQuery = `
        SELECT COUNT(*) as count
        FROM contracts
        WHERE user_id = $1
          AND EXTRACT(MONTH FROM created_at) = $2
          AND EXTRACT(YEAR FROM created_at) = $3
      `;
      const newContractsResult = await client.query(newContractsQuery, [userId, month, year]);
      
      // Получаем количество истекших договоров
      const expiredContractsQuery = `
        SELECT COUNT(*) as count
        FROM contracts
        WHERE user_id = $1
          AND status = 'expired'
          AND EXTRACT(MONTH FROM end_date) = $2
          AND EXTRACT(YEAR FROM end_date) = $3
      `;
      const expiredContractsResult = await client.query(expiredContractsQuery, [userId, month, year]);
      
      return {
        totalReceived: parseFloat(receivedResult.rows[0].total),
        totalPending: parseFloat(pendingResult.rows[0].total),
        totalOverdue: parseFloat(overdueResult.rows[0].total),
        activeContracts: parseInt(activeContractsResult.rows[0].count),
        newContracts: parseInt(newContractsResult.rows[0].count),
        expiredContracts: parseInt(expiredContractsResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Создать платеж
   */
  async create(data: Partial<Payment>): Promise<Payment> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO payments (user_id, contract_id, property_id, tenant_id, amount, due_date, status, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        data.userId,
        data.contractId,
        data.propertyId,
        data.tenantId,
        data.amount,
        data.dueDate,
        data.status || 'pending',
        data.description,
      ]);
      
      return this.mapPaymentFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Маппинг данных из БД
   */
  private mapPaymentFromDb(row: any): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      contractId: row.contract_id,
      propertyId: row.property_id,
      tenantId: row.tenant_id,
      amount: row.amount,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default PaymentService;
