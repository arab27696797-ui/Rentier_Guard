/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис договоров
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Управление договорами аренды.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface Contract {
  id: number;
  userId: number;
  propertyId: number;
  tenantId: number;
  number: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  depositAmount: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  documentUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpiringContract {
  id: number;
  userId: number;
  number: string;
  endDate: string;
  propertyAddress: string;
  tenantName: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис договоров
// ═══════════════════════════════════════════════════════════════════════════════

export class ContractService {
  constructor(private pool: Pool) {}

  /**
   * Получить договоры, истекающие в ближайшие дни
   */
  async getExpiringContracts(days: number): Promise<ExpiringContract[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          c.id,
          c.user_id,
          c.number,
          c.end_date,
          prop.address as property_address,
          t.full_name as tenant_name
        FROM contracts c
        JOIN properties prop ON c.property_id = prop.id
        JOIN tenants t ON c.tenant_id = t.id
        WHERE c.status IN ('active', 'draft')
          AND c.end_date <= CURRENT_DATE + INTERVAL '${days} days'
        ORDER BY c.end_date ASC
      `;
      
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        number: row.number,
        endDate: row.end_date,
        propertyAddress: row.property_address,
        tenantName: row.tenant_name,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Получить договор по ID
   */
  async getById(id: number): Promise<Contract | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM contracts WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapContractFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить договоры пользователя
   */
  async getByUserId(userId: number): Promise<Contract[]> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC';
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => this.mapContractFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Создать договор
   */
  async create(data: Partial<Contract>): Promise<Contract> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO contracts (user_id, property_id, tenant_id, number, start_date, end_date, rent_amount, deposit_amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        data.userId,
        data.propertyId,
        data.tenantId,
        data.number,
        data.startDate,
        data.endDate,
        data.rentAmount,
        data.depositAmount,
        data.status || 'draft',
      ]);
      
      return this.mapContractFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Обновить договор
   */
  async update(id: number, data: Partial<Contract>): Promise<Contract | null> {
    const client = await this.pool.connect();
    
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.documentUrl !== undefined) {
        fields.push(`document_url = $${paramIndex++}`);
        values.push(data.documentUrl);
      }
      if (data.endDate !== undefined) {
        fields.push(`end_date = $${paramIndex++}`);
        values.push(data.endDate);
      }
      
      if (fields.length === 0) {
        return this.getById(id);
      }
      
      fields.push(`updated_at = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE contracts 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapContractFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Маппинг данных из БД
   */
  private mapContractFromDb(row: any): Contract {
    return {
      id: row.id,
      userId: row.user_id,
      propertyId: row.property_id,
      tenantId: row.tenant_id,
      number: row.number,
      startDate: row.start_date,
      endDate: row.end_date,
      rentAmount: row.rent_amount,
      depositAmount: row.deposit_amount,
      status: row.status,
      documentUrl: row.document_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default ContractService;
