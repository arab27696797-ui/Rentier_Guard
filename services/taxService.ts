/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сервис налогов
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Работа с налогами для самозанятых арендодателей.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import { Pool } from 'pg';

// ═══════════════════════════════════════════════════════════════════════════════
// Интерфейсы
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaxInfo {
  userId: number;
  inn: string;
  isSelfEmployed: boolean;
  paymentDeadline: string;
  taxRate: number;
}

export interface UnpaidTax {
  amount: number;
  month: number;
  year: number;
}

export interface MonthlyTaxStats {
  taxAmount: number;
  paidAmount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Сервис налогов
// ═══════════════════════════════════════════════════════════════════════════════

export class TaxService {
  // Ставка НПД для доходов от физлиц (4%)
  private readonly NPD_RATE_INDIVIDUAL = 0.04;
  // Ставка НПД для доходов от юрлиц (6%)
  private readonly NPD_RATE_LEGAL = 0.06;

  constructor(private pool: Pool) {}

  /**
   * Получить налоговую информацию пользователя
   */
  async getTaxInfo(userId: number): Promise<TaxInfo | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT u.id as user_id, u.inn, u.is_self_employed, t.tax_rate
        FROM users u
        LEFT JOIN tax_settings t ON u.id = t.user_id
        WHERE u.id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Рассчитываем срок оплаты (25-е число следующего месяца)
      const now = new Date();
      const paymentDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 25);
      
      return {
        userId: row.user_id,
        inn: row.inn,
        isSelfEmployed: row.is_self_employed,
        paymentDeadline: paymentDeadline.toISOString().split('T')[0],
        taxRate: row.tax_rate || this.NPD_RATE_INDIVIDUAL,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Получить неоплаченный налог за месяц
   */
  async getUnpaidTaxForMonth(userId: number, month: number, year: number): Promise<UnpaidTax | null> {
    const client = await this.pool.connect();
    
    try {
      // Получаем сумму доходов за месяц
      const incomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM payments
        WHERE user_id = $1
          AND status = 'paid'
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND EXTRACT(YEAR FROM paid_date) = $3
      `;
      
      const incomeResult = await client.query(incomeQuery, [userId, month, year]);
      const totalIncome = parseFloat(incomeResult.rows[0].total_income);
      
      if (totalIncome === 0) {
        return null;
      }
      
      // Получаем ставку налога пользователя
      const taxRateQuery = 'SELECT tax_rate FROM tax_settings WHERE user_id = $1';
      const taxRateResult = await client.query(taxRateQuery, [userId]);
      const taxRate = taxRateResult.rows[0]?.tax_rate || this.NPD_RATE_INDIVIDUAL;
      
      // Рассчитываем налог
      const taxAmount = Math.round(totalIncome * taxRate);
      
      // Проверяем, был ли уже оплачен налог
      const paidQuery = `
        SELECT COALESCE(SUM(amount), 0) as paid_amount
        FROM tax_payments
        WHERE user_id = $1
          AND month = $2
          AND year = $3
          AND status = 'paid'
      `;
      
      const paidResult = await client.query(paidQuery, [userId, month, year]);
      const paidAmount = parseFloat(paidResult.rows[0].paid_amount);
      
      const unpaidAmount = taxAmount - paidAmount;
      
      if (unpaidAmount <= 0) {
        return null;
      }
      
      return {
        amount: unpaidAmount,
        month,
        year,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Получить налоговую статистику за месяц
   */
  async getMonthlyTaxStats(userId: number, month: number, year: number): Promise<MonthlyTaxStats> {
    const client = await this.pool.connect();
    
    try {
      // Получаем сумму доходов за месяц
      const incomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM payments
        WHERE user_id = $1
          AND status = 'paid'
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND EXTRACT(YEAR FROM paid_date) = $3
      `;
      
      const incomeResult = await client.query(incomeQuery, [userId, month, year]);
      const totalIncome = parseFloat(incomeResult.rows[0].total_income);
      
      // Получаем ставку налога
      const taxRateQuery = 'SELECT tax_rate FROM tax_settings WHERE user_id = $1';
      const taxRateResult = await client.query(taxRateQuery, [userId]);
      const taxRate = taxRateResult.rows[0]?.tax_rate || this.NPD_RATE_INDIVIDUAL;
      
      // Рассчитываем налог
      const taxAmount = Math.round(totalIncome * taxRate);
      
      // Получаем оплаченную сумму
      const paidQuery = `
        SELECT COALESCE(SUM(amount), 0) as paid_amount
        FROM tax_payments
        WHERE user_id = $1
          AND month = $2
          AND year = $3
          AND status = 'paid'
      `;
      
      const paidResult = await client.query(paidQuery, [userId, month, year]);
      const paidAmount = parseFloat(paidResult.rows[0].paid_amount);
      
      return {
        taxAmount,
        paidAmount,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Рассчитать налог НПД
   */
  calculateTax(income: number, isLegalEntity: boolean = false): number {
    const rate = isLegalEntity ? this.NPD_RATE_LEGAL : this.NPD_RATE_INDIVIDUAL;
    return Math.round(income * rate);
  }

  /**
   * Получить информацию о налоговых вычетах
   */
  getTaxDeductionInfo(): { maxDeduction: number; usedDeduction: number } {
    // Максимальный налоговый вычет для самозанятых (10 000 руб)
    return {
      maxDeduction: 10000,
      usedDeduction: 0, // TODO: получать из БД
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default TaxService;
