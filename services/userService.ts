/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис пользователей
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Управление пользователями: регистрация, поиск, обновление данных.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isSelfEmployed: boolean;
  inn: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис пользователей
// ═══════════════════════════════════════════════════════════════════════════════

export class UserService {
  constructor(private pool: Pool) {}

  /**
   * Найти пользователя по Telegram ID или создать нового
   */
  async findOrCreate(data: CreateUserData): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      // Проверяем существование пользователя
      const existingQuery = `
        SELECT * FROM users 
        WHERE telegram_id = $1
      `;
      const existingResult = await client.query(existingQuery, [data.telegramId]);
      
      if (existingResult.rows.length > 0) {
        // Обновляем данные пользователя
        const updateQuery = `
          UPDATE users 
          SET username = $1, first_name = $2, last_name = $3, updated_at = NOW()
          WHERE telegram_id = $4
          RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [
          data.username,
          data.firstName,
          data.lastName,
          data.telegramId,
        ]);
        
        return this.mapUserFromDb(updateResult.rows[0]);
      }
      
      // Создаем нового пользователя
      const insertQuery = `
        INSERT INTO users (telegram_id, username, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, 'user', true)
        RETURNING *
      `;
      const insertResult = await client.query(insertQuery, [
        data.telegramId,
        data.username,
        data.firstName,
        data.lastName,
      ]);
      
      return this.mapUserFromDb(insertResult.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getById(id: number): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить пользователя по Telegram ID
   */
  async getByTelegramId(telegramId: number): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE telegram_id = $1';
      const result = await client.query(query, [telegramId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить всех самозанятых пользователей
   */
  async getSelfEmployedUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE is_self_employed = true AND is_active = true';
      const result = await client.query(query);
      
      return result.rows.map(row => this.mapUserFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Получить всех активных пользователей
   */
  async getActiveUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE is_active = true';
      const result = await client.query(query);
      
      return result.rows.map(row => this.mapUserFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Обновить данные пользователя
   */
  async update(id: number, data: Partial<User>): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.username !== undefined) {
        fields.push(`username = $${paramIndex++}`);
        values.push(data.username);
      }
      if (data.firstName !== undefined) {
        fields.push(`first_name = $${paramIndex++}`);
        values.push(data.firstName);
      }
      if (data.lastName !== undefined) {
        fields.push(`last_name = $${paramIndex++}`);
        values.push(data.lastName);
      }
      if (data.isSelfEmployed !== undefined) {
        fields.push(`is_self_employed = $${paramIndex++}`);
        values.push(data.isSelfEmployed);
      }
      if (data.inn !== undefined) {
        fields.push(`inn = $${paramIndex++}`);
        values.push(data.inn);
      }
      if (data.phone !== undefined) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      
      if (fields.length === 0) {
        return this.getById(id);
      }
      
      fields.push(`updated_at = NOW()`);
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Маппинг данных из БД в интерфейс User
   */
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isSelfEmployed: row.is_self_employed,
      inn: row.inn,
      phone: row.phone,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default UserService;
