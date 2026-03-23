/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис объектов недвижимости
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Управление объектами недвижимости арендодателя.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface Property {
  id: number;
  userId: number;
  address: string;
  city: string;
  propertyType: 'apartment' | 'house' | 'room' | 'office' | 'other';
  rooms: number | null;
  area: number | null;
  floor: number | null;
  totalFloors: number | null;
  cadastralNumber: string | null;
  description: string | null;
  photos: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyData {
  userId: number;
  address: string;
  city: string;
  propertyType: Property['propertyType'];
  rooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  cadastralNumber?: string;
  description?: string;
  photos?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис объектов недвижимости
// ═══════════════════════════════════════════════════════════════════════════════

export class PropertyService {
  constructor(private pool: Pool) {}

  /**
   * Создать объект недвижимости
   */
  async create(data: CreatePropertyData): Promise<Property> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO properties (
          user_id, address, city, property_type, rooms, area, floor, total_floors,
          cadastral_number, description, photos
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        data.userId,
        data.address,
        data.city,
        data.propertyType,
        data.rooms || null,
        data.area || null,
        data.floor || null,
        data.totalFloors || null,
        data.cadastralNumber || null,
        data.description || null,
        data.photos ? JSON.stringify(data.photos) : null,
      ]);
      
      return this.mapPropertyFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить объект по ID
   */
  async getById(id: number): Promise<Property | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM properties WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapPropertyFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить объекты пользователя
   */
  async getByUserId(userId: number): Promise<Property[]> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC';
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => this.mapPropertyFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Обновить объект
   */
  async update(id: number, data: Partial<Property>): Promise<Property | null> {
    const client = await this.pool.connect();
    
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.address !== undefined) {
        fields.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }
      if (data.city !== undefined) {
        fields.push(`city = $${paramIndex++}`);
        values.push(data.city);
      }
      if (data.propertyType !== undefined) {
        fields.push(`property_type = $${paramIndex++}`);
        values.push(data.propertyType);
      }
      if (data.rooms !== undefined) {
        fields.push(`rooms = $${paramIndex++}`);
        values.push(data.rooms);
      }
      if (data.area !== undefined) {
        fields.push(`area = $${paramIndex++}`);
        values.push(data.area);
      }
      if (data.floor !== undefined) {
        fields.push(`floor = $${paramIndex++}`);
        values.push(data.floor);
      }
      if (data.totalFloors !== undefined) {
        fields.push(`total_floors = $${paramIndex++}`);
        values.push(data.totalFloors);
      }
      if (data.cadastralNumber !== undefined) {
        fields.push(`cadastral_number = $${paramIndex++}`);
        values.push(data.cadastralNumber);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.photos !== undefined) {
        fields.push(`photos = $${paramIndex++}`);
        values.push(data.photos ? JSON.stringify(data.photos) : null);
      }
      
      if (fields.length === 0) {
        return this.getById(id);
      }
      
      fields.push(`updated_at = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE properties 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapPropertyFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Удалить объект
   */
  async delete(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = 'DELETE FROM properties WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Получить статистику по объектам пользователя
   */
  async getStats(userId: number): Promise<{
    totalProperties: number;
    totalRented: number;
    totalVacant: number;
    totalArea: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_properties,
          COALESCE(SUM(area), 0) as total_area
        FROM properties
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      return {
        totalProperties: parseInt(result.rows[0].total_properties),
        totalRented: 0, // TODO: получать из таблицы contracts
        totalVacant: 0, // TODO: рассчитывать
        totalArea: parseFloat(result.rows[0].total_area),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Маппинг данных из БД
   */
  private mapPropertyFromDb(row: any): Property {
    return {
      id: row.id,
      userId: row.user_id,
      address: row.address,
      city: row.city,
      propertyType: row.property_type,
      rooms: row.rooms,
      area: row.area,
      floor: row.floor,
      totalFloors: row.total_floors,
      cadastralNumber: row.cadastral_number,
      description: row.description,
      photos: row.photos ? JSON.parse(row.photos) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default PropertyService;
