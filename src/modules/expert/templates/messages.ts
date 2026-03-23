/**
 * Шаблоны сообщений модуля экспертов
 * RentierGuard Bot
 * 
 * Сообщения:
 * - Приветствие в модуле экспертов
 * - Выбор типа эксперта
 * - Запрос описания
 * - Подтверждение
 * - Уведомление об отправке
 * - Сообщение о лимите консультаций
 */

import { ExpertType } from '../types';

/**
 * Приветственное сообщение при входе в модуль экспертов
 */
export function getExpertWelcomeMessage(): string {
  return `
👋 <b>Добро пожаловать в модуль экспертов RentierGuard!</b>

Здесь вы можете получить консультацию от профессионалов:
• ⚖️ <b>Юриста</b> — правовые вопросы, договоры, споры
• 💼 <b>Налогового консультанта</b> — налоги, вычеты, оптимизация
• 📊 <b>Бухгалтера</b> — учёт, отчётность, документооборот

<i>У вас есть 1 бесплатная консультация в год!</i>
  `.trim();
}

/**
 * Сообщение для выбора типа эксперта
 */
export function getExpertTypeSelectionMessage(): string {
  return `
<b>Выберите тип эксперта:</b>

⚖️ <b>Юрист</b>
Поможет с договорами аренды, защитой прав собственника, разрешением споров с жильцами

💼 <b>Налоговый консультант</b>
Проконсультирует по налогам на аренду, вычетам, оптимизации налогообложения

📊 <b>Бухгалтер</b>
Поможет с ведением учёта, отчётностью, документооборотом
  `.trim();
}

/**
 * Сообщение с запросом описания вопроса
 * @param expertType - тип выбранного эксперта
 */
export function getDescriptionRequestMessage(expertType?: ExpertType): string {
  const expertLabel = expertType ? getExpertTypeLabel(expertType) : 'эксперта';
  
  return `
✏️ <b>Опишите ваш вопрос</b>

Пожалуйста, подробно опишите ситуацию, с которой вам нужна помощь ${expertLabel.toLowerCase()}.

<b>Что включить в описание:</b>
• Суть проблемы или вопроса
• Контекст и историю
• Что вы уже пробовали
• Какой результат хотите получить

<i>Минимум 20 символов, максимум 2000</i>
  `.trim();
}

/**
 * Сообщение с запросом дополнительных деталей
 */
export function getDetailsRequestMessage(): string {
  return `
📋 <b>Дополнительные детали</b> (необязательно)

Если есть важная информация, которая может помочь эксперту — добавьте её сейчас.

Например:
• Даты, суммы, адреса
• Номера договоров
• Релевантные документы

<i>Или нажмите "Пропустить"</i>
  `.trim();
}

/**
 * Сообщение с подтверждением данных
 */
export function getConfirmationMessage(params: {
  expertType: ExpertType;
  description: string;
  details?: string;
  isFree: boolean;
}): string {
  const { expertType, description, details, isFree } = params;
  
  const freeBadge = isFree ? '🎁 <b>Бесплатная консультация</b>' : '💰 <b>Платная консультация</b>';
  
  let message = `
📋 <b>Проверьте данные запроса:</b>

${freeBadge}

<b>Тип эксперта:</b> ${getExpertTypeLabel(expertType)} ${getExpertTypeEmoji(expertType)}

<b>Вопрос:</b>
<blockquote>${escapeHtml(description)}</blockquote>
  `.trim();

  if (details) {
    message += `\n\n<b>Дополнительные детали:</b>\n<blockquote>${escapeHtml(details)}</blockquote>`;
  } else {
    message += '\n\n<i>Дополнительные детали: не указаны</i>';
  }

  message += '\n\n<b>Всё верно?</b> Нажмите "Подтвердить и отправить"';

  return message;
}

/**
 * Сообщение об успешной отправке запроса
 * @param requestId - ID созданного запроса
 * @param isFree - бесплатная ли консультация
 */
export function getRequestSentMessage(requestId: string, isFree: boolean): string {
  const freeText = isFree 
    ? '🎁 <b>Бесплатная консультация использована</b>' 
    : '💰 <b>Платная консультация</b>';

  return `
✅ <b>Запрос успешно отправлен!</b>

${freeText}

<b>ID вашего запроса:</b> <code>${requestId}</code>

Что дальше:
1️⃣ Эксперт получил уведомление
2️⃣ В среднем ответ приходит в течение 24 часов
3️⃣ Вы получите уведомление о статусе

<i>Сохраните ID запроса — он понадобится для отслеживания</i>

Нажмите /myrequests чтобы посмотреть ваши запросы.
  `.trim();
}

/**
 * Сообщение о превышении лимита бесплатных консультаций
 */
export function getFreeLimitExceededMessage(): string {
  return `
⚠️ <b>Лимит бесплатных консультаций исчерпан</b>

Вы уже использовали бесплатную консультацию в этом году.

<b>Доступные варианты:</b>

💳 <b>Оплатить консультацию</b>
• Юрист — от 3 000 ₽
• Налоговый консультант — от 2 500 ₽
• Бухгалтер — от 2 000 ₽

📅 <b>Или подождите до следующего года</b>
Бесплатная консультация обновится 1 января.

<i>Оплата производится через защищённый шлюз</i>
  `.trim();
}

/**
 * Сообщение об ошибке
 * @param customMessage - кастомное сообщение об ошибке
 */
export function getErrorMessage(customMessage?: string): string {
  const defaultMessage = 'Произошла ошибка. Пожалуйста, попробуйте позже или обратитесь в поддержку.';
  
  return `
❌ <b>Ошибка</b>

${escapeHtml(customMessage || defaultMessage)}

Если проблема повторяется, напишите нам: @RentierGuardSupport
  `.trim();
}

/**
 * Сообщение со списком запросов пользователя
 */
export function getUserRequestsListMessage(requests: Array<{
  id: string;
  expertType: ExpertType;
  status: string;
  createdAt: Date;
  isFree: boolean;
}>): string {
  if (requests.length === 0) {
    return `
📭 <b>У вас пока нет запросов к экспертам</b>

Нажмите /expert чтобы создать первый запрос.
    `.trim();
  }

  let message = `📋 <b>Ваши запросы к экспертам (${requests.length}):</b>\n\n`;

  requests.forEach((req, index) => {
    const freeBadge = req.isFree ? '🎁' : '💰';
    const emoji = getExpertTypeEmoji(req.expertType);
    const date = req.createdAt.toLocaleDateString('ru-RU');
    
    message += `${index + 1}. ${freeBadge} ${emoji} <b>${getExpertTypeLabel(req.expertType)}</b>\n`;
    message += `   📅 ${date} | 🆔 <code>${req.id.slice(0, 8)}...</code>\n`;
    message += `   Статус: ${req.status}\n\n`;
  });

  message += '\n<i>Нажмите на ID запроса для подробной информации</i>';

  return message;
}

/**
 * Сообщение с деталями запроса
 */
export function getRequestDetailsMessage(params: {
  id: string;
  expertType: ExpertType;
  description: string;
  details?: string;
  status: string;
  createdAt: Date;
  isFree: boolean;
  expertComment?: string;
}): string {
  const { id, expertType, description, details, status, createdAt, isFree, expertComment } = params;
  
  const freeBadge = isFree ? '🎁 Бесплатная' : '💰 Платная';

  let message = `
📋 <b>Детали запроса</b>

<b>ID:</b> <code>${id}</code>
<b>Тип:</b> ${getExpertTypeEmoji(expertType)} ${getExpertTypeLabel(expertType)}
<b>Статус:</b> ${status}
<b>Тариф:</b> ${freeBadge}
<b>Создан:</b> ${createdAt.toLocaleString('ru-RU')}

<b>Вопрос:</b>
<blockquote>${escapeHtml(description)}</blockquote>
  `.trim();

  if (details) {
    message += `\n\n<b>Дополнительные детали:</b>\n<blockquote>${escapeHtml(details)}</blockquote>`;
  }

  if (expertComment) {
    message += `\n\n<b>💬 Комментарий эксперта:</b>\n<blockquote>${escapeHtml(expertComment)}</blockquote>`;
  }

  return message;
}

/**
 * Получить эмодзи для типа эксперта
 */
export function getExpertTypeEmoji(type: ExpertType): string {
  const emojis: Record<ExpertType, string> = {
    [ExpertType.LAWYER]: '⚖️',
    [ExpertType.TAX]: '💼',
    [ExpertType.ACCOUNTANT]: '📊',
  };
  return emojis[type] || '👤';
}

/**
 * Получить читаемое название типа эксперта
 */
export function getExpertTypeLabel(type: ExpertType): string {
  const labels: Record<ExpertType, string> = {
    [ExpertType.LAWYER]: 'Юрист',
    [ExpertType.TAX]: 'Налоговый консультант',
    [ExpertType.ACCOUNTANT]: 'Бухгалтер',
  };
  return labels[type] || type;
}

/**
 * Сообщение о статусе запроса
 */
export function getStatusInfoMessage(status: string): string {
  const statusDescriptions: Record<string, string> = {
    pending: '⏳ <b>Ожидает обработки</b>\n\nВаш запрос получен и скоро будет назначен эксперту.',
    in_progress: '🔄 <b>В работе</b>\n\nЭксперт изучает ваш вопрос и подготавливает ответ.',
    waiting_info: '❓ <b>Ожидает информации</b>\n\nЭксперт запросил дополнительные данные. Проверьте сообщения.',
    completed: '✅ <b>Завершён</b>\n\nВаш запрос обработан. Ответ отправлен вам.',
    cancelled: '❌ <b>Отменён</b>\n\nЗапрос был отменён.',
  };

  return statusDescriptions[status] || '❓ Статус неизвестен';
}

/**
 * Сообщение для админ-панели со списком запросов
 */
export function getAdminRequestsListMessage(requests: Array<{
  id: string;
  expertType: ExpertType;
  status: string;
  priority: string;
  userId: number;
  username?: string;
  createdAt: Date;
}>): string {
  if (requests.length === 0) {
    return '📭 <b>Нет активных запросов</b>';
  }

  let message = `📋 <b>Активные запросы (${requests.length}):</b>\n\n`;

  requests.forEach((req, index) => {
    const emoji = getExpertTypeEmoji(req.expertType);
    const user = req.username ? `@${req.username}` : `ID:${req.userId}`;
    
    message += `${index + 1}. ${emoji} <code>${req.id.slice(0, 8)}</code>\n`;
    message += `   👤 ${user} | 📅 ${req.createdAt.toLocaleDateString('ru-RU')}\n`;
    message += `   Приоритет: ${req.priority} | Статус: ${req.status}\n\n`;
  });

  return message;
}

/**
 * Вспомогательная функция для экранирования HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default {
  getExpertWelcomeMessage,
  getExpertTypeSelectionMessage,
  getDescriptionRequestMessage,
  getDetailsRequestMessage,
  getConfirmationMessage,
  getRequestSentMessage,
  getFreeLimitExceededMessage,
  getErrorMessage,
  getUserRequestsListMessage,
  getRequestDetailsMessage,
  getExpertTypeEmoji,
  getExpertTypeLabel,
  getStatusInfoMessage,
  getAdminRequestsListMessage,
};
