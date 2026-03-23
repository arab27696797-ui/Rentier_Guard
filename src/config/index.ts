/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Конфигурация
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Централизованная конфигурация приложения.
 * Загружает переменные окружения и предоставляет типизированный доступ.
 * 
 * @author RentierGuard Team
 * @version 1.0.0
 */

import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════════
// Конфигурация бота
// ═══════════════════════════════════════════════════════════════════════════════

export const config = {
  // Настройки бота
  bot: {
    token: process.env.BOT_TOKEN || '',
    username: process.env.BOT_USERNAME || 'RentierGuardBot',
    webhookDomain: process.env.WEBHOOK_DOMAIN || '',
    webhookPort: parseInt(process.env.WEBHOOK_PORT || '8443'),
  },
  
  // Настройки базы данных
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'rentierguard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    usePostgresSessions: process.env.USE_PG_SESSIONS === 'true',
  },
  
  // Настройки приложения
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  
  // Настройки администраторов
  admin: {
    ids: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean),
  },
  
  // Настройки API
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.rentierguard.ru',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  },
  
  // Настройки налогов
  tax: {
    // Ставка НПД для доходов от физлиц (4%)
    npdRateIndividual: 0.04,
    // Ставка НПД для доходов от юрлиц (6%)
    npdRateLegal: 0.06,
    // Лимит дохода для самозанятых (2.4 млн руб в год)
    incomeLimit: 2400000,
  },
  
  // Настройки уведомлений
  notifications: {
    // Время напоминания о налогах (часы:минуты)
    taxReminderTime: '09:00',
    // Время напоминания о платежах
    paymentReminderTime: '09:00',
    // Время проверки сроков договоров
    contractCheckTime: '10:00',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Валидация конфигурации
// ═══════════════════════════════════════════════════════════════════════════════

export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.bot.token) {
    errors.push('BOT_TOKEN не указан');
  }
  
  if (!config.database.password) {
    errors.push('DB_PASSWORD не указан');
  }
  
  if (errors.length > 0) {
    throw new Error(`Ошибка конфигурации:\n${errors.join('\n')}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Проверка окружения
// ═══════════════════════════════════════════════════════════════════════════════

export const isDevelopment = config.app.env === 'development';
export const isProduction = config.app.env === 'production';
export const isTest = config.app.env === 'test';

// ═══════════════════════════════════════════════════════════════════════════════
// Экспорт
// ═══════════════════════════════════════════════════════════════════════════════

export default config;
