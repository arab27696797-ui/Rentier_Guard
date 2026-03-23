/**
 * Сервис уведомлений для модуля экспертов
 * RentierGuard Bot
 * 
 * Функции:
 * - notifyExpertsChannel — отправка в канал/группу
 * - notifyUserStatusChange — уведомление пользователя
 */

import axios from 'axios';
import { Telegraf } from 'telegraf';
import {
  ExpertRequestData,
  ExpertRequestStatus,
  ExpertType,
  RequestPriority,
  NotificationChannelConfig,
} from '../types';

/**
 * Конфигурация для отправки уведомлений
 */
interface NotificationConfig {
  /** Токен бота для отправки уведомлений */
  botToken: string;
  /** ID канала/группы экспертов */
  expertsChannelId: string;
  /** ID топика (для супергрупп) */
  messageThreadId?: number;
  /** URL вебхука (альтернативный способ) */
  webhookUrl?: string;
}

/**
 * Сервис уведомлений
 */
export class NotificationService {
  private config: NotificationConfig;
  private bot: Telegraf | null = null;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      botToken: process.env.EXPERTS_BOT_TOKEN || process.env.BOT_TOKEN || '',
      expertsChannelId: process.env.EXPERTS_CHANNEL_ID || '',
      messageThreadId: process.env.EXPERTS_THREAD_ID
        ? parseInt(process.env.EXPERTS_THREAD_ID, 10)
        : undefined,
      webhookUrl: process.env.EXPERTS_WEBHOOK_URL,
      ...config,
    };

    // Инициализируем бота если есть токен
    if (this.config.botToken) {
      this.bot = new Telegraf(this.config.botToken);
    }
  }

  /**
   * Отправить уведомление в канал экспертов о новом запросе
   * @param request - данные запроса
   * @returns успешность отправки
   */
  async notifyExpertsChannel(request: ExpertRequestData): Promise<boolean> {
    try {
      const message = this.formatNewRequestMessage(request);

      // Пробуем отправить через бота
      if (this.bot && this.config.expertsChannelId) {
        await this.sendViaBot(this.config.expertsChannelId, message);
        console.log(`[NotificationService] Уведомление отправлено в канал для запроса ${request.id}`);
        return true;
      }

      // Если нет бота, пробуем через вебхук
      if (this.config.webhookUrl) {
        await this.sendViaWebhook({
          type: 'new_request',
          request,
          message,
        });
        return true;
      }

      console.warn('[NotificationService] Не настроен способ отправки уведомлений');
      return false;
    } catch (error) {
      console.error('[NotificationService] Ошибка при отправке в канал:', error);
      return false;
    }
  }

  /**
   * Уведомить пользователя об изменении статуса запроса
   * @param userId - ID пользователя
   * @param requestId - ID запроса
   * @param status - новый статус
   * @param comment - комментарий эксперта
   * @returns успешность отправки
   */
  async notifyUserStatusChange(
    userId: number,
    requestId: string,
    status: ExpertRequestStatus,
    comment?: string
  ): Promise<boolean> {
    try {
      const message = this.formatStatusChangeMessage(requestId, status, comment);

      if (this.bot) {
        await this.bot.telegram.sendMessage(userId, message, {
          parse_mode: 'HTML',
        });
        console.log(`[NotificationService] Пользователь ${userId} уведомлён об изменении статуса`);
        return true;
      }

      console.warn('[NotificationService] Бот не инициализирован');
      return false;
    } catch (error) {
      console.error('[NotificationService] Ошибка при уведомлении пользователя:', error);
      return false;
    }
  }

  /**
   * Отправить уведомление о срочном запросе
   * @param request - данные запроса
   * @returns успешность отправки
   */
  async notifyUrgentRequest(request: ExpertRequestData): Promise<boolean> {
    try {
      if (request.priority !== RequestPriority.URGENT && request.priority !== RequestPriority.HIGH) {
        return true; // Не срочный запрос
      }

      const message = this.formatUrgentMessage(request);

      if (this.bot && this.config.expertsChannelId) {
        // Для срочных запросов делаем упоминание админов
        const mentionText = '@admin @moderator';
        await this.bot.telegram.sendMessage(
          this.config.expertsChannelId,
          `${mentionText}\n\n${message}`,
          {
            parse_mode: 'HTML',
            message_thread_id: this.config.messageThreadId,
          }
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Ошибка при отправке срочного уведомления:', error);
      return false;
    }
  }

  /**
   * Отправить напоминание эксперту о запросе
   * @param expertId - ID эксперта
   * @param request - данные запроса
   * @returns успешность отправки
   */
  async remindExpert(
    expertId: number,
    request: ExpertRequestData
  ): Promise<boolean> {
    try {
      const message = `
⏰ <b>Напоминание о запросе</b>

У вас есть активный запрос, требующий внимания:

<b>ID:</b> <code>${request.id}</code>
<b>Тип:</b> ${this.getExpertTypeLabel(request.expertType)}
<b>Статус:</b> ${this.getStatusLabel(request.status)}
<b>Создан:</b> ${request.createdAt.toLocaleDateString('ru-RU')}

Пожалуйста, проверьте и обновите статус.
      `.trim();

      if (this.bot) {
        await this.bot.telegram.sendMessage(expertId, message, {
          parse_mode: 'HTML',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] Ошибка при отправке напоминания:', error);
      return false;
    }
  }

  /**
   * Отправить сообщение через бота
   */
  private async sendViaBot(chatId: string, text: string): Promise<void> {
    if (!this.bot) {
      throw new Error('Бот не инициализирован');
    }

    await this.bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      message_thread_id: this.config.messageThreadId,
    });
  }

  /**
   * Отправить через вебхук
   */
  private async sendViaWebhook(payload: Record<string, unknown>): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Webhook URL не настроен');
    }

    await axios.post(this.config.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Форматировать сообщение о новом запросе
   */
  private formatNewRequestMessage(request: ExpertRequestData): string {
    const priorityEmoji = this.getPriorityEmoji(request.priority);
    const typeEmoji = this.getExpertTypeEmoji(request.expertType);
    const freeBadge = request.isFree ? '🎁 <b>БЕСПЛАТНАЯ</b>' : '💰 <b>ПЛАТНАЯ</b>';

    let message = `
🆕 <b>Новый запрос к эксперту</b>

${freeBadge}

<b>Тип:</b> ${typeEmoji} ${this.getExpertTypeLabel(request.expertType)}
<b>Приоритет:</b> ${priorityEmoji} ${this.getPriorityLabel(request.priority)}
<b>Пользователь:</b> ${this.formatUserLink(request)}
<b>Вопрос:</b>
<blockquote>${this.escapeHtml(request.description)}</blockquote>
    `.trim();

    if (request.details) {
      message += `\n\n<b>Дополнительные детали:</b>\n<blockquote>${this.escapeHtml(request.details)}</blockquote>`;
    }

    message += `\n\n<b>ID:</b> <code>${request.id}</code>`;
    message += `\n<b>Дата:</b> ${request.createdAt.toLocaleString('ru-RU')}`;

    // Добавляем кнопки действий
    message += '\n\n<b>Действия:</b>';
    message += `\n🔘 Взять в работу: /take_${request.id}`;
    message += `\n🔘 Запросить инфо: /ask_${request.id}`;
    message += `\n🔘 Завершить: /complete_${request.id}`;

    return message;
  }

  /**
   * Форматировать сообщение об изменении статуса
   */
  private formatStatusChangeMessage(
    requestId: string,
    status: ExpertRequestStatus,
    comment?: string
  ): string {
    const statusEmoji = this.getStatusEmoji(status);
    const statusLabel = this.getStatusLabel(status);

    let message = `
${statusEmoji} <b>Обновление статуса запроса</b>

<b>ID запроса:</b> <code>${requestId}</code>
<b>Новый статус:</b> ${statusLabel}
    `.trim();

    if (comment) {
      message += `\n\n<b>Комментарий эксперта:</b>\n<blockquote>${this.escapeHtml(comment)}</blockquote>`;
    }

    if (status === ExpertRequestStatus.IN_PROGRESS) {
      message += '\n\n✅ Эксперт взял ваш запрос в работу. Ожидайте ответа.';
    } else if (status === ExpertRequestStatus.COMPLETED) {
      message += '\n\n🎉 Ваш запрос завершён! Спасибо за обращение.';
    } else if (status === ExpertRequestStatus.WAITING_INFO) {
      message += '\n\n⏳ Эксперт ожидает дополнительной информации. Пожалуйста, предоставьте запрошенные данные.';
    }

    return message;
  }

  /**
   * Форматировать срочное сообщение
   */
  private formatUrgentMessage(request: ExpertRequestData): string {
    return `
🚨 <b>СРОЧНЫЙ ЗАПРОС</b> 🚨

<b>Тип:</b> ${this.getExpertTypeLabel(request.expertType)}
<b>Приоритет:</b> ${this.getPriorityLabel(request.priority)}
<b>Пользователь:</b> ${this.formatUserLink(request)}

<b>Вопрос:</b>
<blockquote>${this.escapeHtml(request.description.substring(0, 200))}${request.description.length > 200 ? '...' : ''}</blockquote>

<b>ID:</b> <code>${request.id}</code>
<b>Требуется немедленное внимание!</b>
    `.trim();
  }

  /**
   * Форматировать ссылку на пользователя
   */
  private formatUserLink(request: ExpertRequestData): string {
    const name = request.firstName || request.username || `ID: ${request.userId}`;
    
    if (request.username) {
      return `<a href="tg://user?id=${request.userId}">@${this.escapeHtml(request.username)}</a>`;
    }
    
    return `<a href="tg://user?id=${request.userId}">${this.escapeHtml(name)}</a>`;
  }

  /**
   * Получить эмодзи для типа эксперта
   */
  private getExpertTypeEmoji(type: ExpertType): string {
    const emojis: Record<ExpertType, string> = {
      [ExpertType.LAWYER]: '⚖️',
      [ExpertType.TAX]: '💼',
      [ExpertType.ACCOUNTANT]: '📊',
    };
    return emojis[type] || '👤';
  }

  /**
   * Получить эмодзи для приоритета
   */
  private getPriorityEmoji(priority: RequestPriority): string {
    const emojis: Record<RequestPriority, string> = {
      [RequestPriority.LOW]: '⚪',
      [RequestPriority.MEDIUM]: '🔵',
      [RequestPriority.HIGH]: '🟠',
      [RequestPriority.URGENT]: '🔴',
    };
    return emojis[priority] || '⚪';
  }

  /**
   * Получить эмодзи для статуса
   */
  private getStatusEmoji(status: ExpertRequestStatus): string {
    const emojis: Record<ExpertRequestStatus, string> = {
      [ExpertRequestStatus.PENDING]: '⏳',
      [ExpertRequestStatus.IN_PROGRESS]: '🔄',
      [ExpertRequestStatus.WAITING_INFO]: '❓',
      [ExpertRequestStatus.COMPLETED]: '✅',
      [ExpertRequestStatus.CANCELLED]: '❌',
    };
    return emojis[status] || '❓';
  }

  /**
   * Получить метку для типа эксперта
   */
  private getExpertTypeLabel(type: ExpertType): string {
    const labels: Record<ExpertType, string> = {
      [ExpertType.LAWYER]: 'Юрист',
      [ExpertType.TAX]: 'Налоговый консультант',
      [ExpertType.ACCOUNTANT]: 'Бухгалтер',
    };
    return labels[type] || type;
  }

  /**
   * Получить метку для приоритета
   */
  private getPriorityLabel(priority: RequestPriority): string {
    const labels: Record<RequestPriority, string> = {
      [RequestPriority.LOW]: 'Низкий',
      [RequestPriority.MEDIUM]: 'Средний',
      [RequestPriority.HIGH]: 'Высокий',
      [RequestPriority.URGENT]: 'Срочный',
    };
    return labels[priority] || priority;
  }

  /**
   * Получить метку для статуса
   */
  private getStatusLabel(status: ExpertRequestStatus): string {
    const labels: Record<ExpertRequestStatus, string> = {
      [ExpertRequestStatus.PENDING]: 'Ожидает обработки',
      [ExpertRequestStatus.IN_PROGRESS]: 'В работе',
      [ExpertRequestStatus.WAITING_INFO]: 'Ожидает информации',
      [ExpertRequestStatus.COMPLETED]: 'Завершён',
      [ExpertRequestStatus.CANCELLED]: 'Отменён',
    };
    return labels[status] || status;
  }

  /**
   * Экранировать HTML символы
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Обновить конфигурацию сервиса
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };

    // Переинициализируем бота если изменился токен
    if (config.botToken) {
      this.bot = new Telegraf(config.botToken);
    }
  }

  /**
   * Получить текущую конфигурацию
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }
}

export default NotificationService;
