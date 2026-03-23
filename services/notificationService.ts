/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис уведомлений
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Управление уведомлениями пользователей.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: number;
  userId: number;
  type: 'tax_reminder' | 'payment_reminder' | 'contract_expiry' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  readAt: Date | null;
}

export interface CreateNotificationData {
  userId: number;
  type: Notification['type'];
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис уведомлений
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationService {
  constructor(private pool: Pool) {}

  /**
   * Создать уведомление
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
        VALUES ($1, $2, $3, $4, $5, false)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        data.userId,
        data.type,
        data.title,
        data.message,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]);
      
      return this.mapNotificationFromDb(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Получить уведомления пользователя
   */
  async getByUserId(userId: number, limit: number = 50): Promise<Notification[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [userId, limit]);
      
      return result.rows.map(row => this.mapNotificationFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Получить непрочитанные уведомления
   */
  async getUnread(userId: number): Promise<Notification[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      
      return result.rows.map(row => this.mapNotificationFromDb(row));
    } finally {
      client.release();
    }
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = $1
      `;
      
      const result = await client.query(query, [notificationId]);
      
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Отметить все уведомления пользователя как прочитанные
   */
  async markAllAsRead(userId: number): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND is_read = false
      `;
      
      const result = await client.query(query, [userId]);
      
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Удалить старые уведомления
   */
  async deleteOlderThan(days: number): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `;
      
      const result = await client.query(query);
      
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: number): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `;
      
      const result = await client.query(query, [userId]);
      
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  /**
   * Маппинг данных из БД
   */
  private mapNotificationFromDb(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      readAt: row.read_at,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default NotificationService;
