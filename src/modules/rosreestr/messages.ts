/**
 * Шаблоны сообщений модуля Росреестра
 * RentierGuard Bot
 */

import { ChecklistItem, MFCInfo } from '../types';
import { REGISTRATION_GUIDE, PAYMENT_DETAILS } from '../content/checklistData';

/**
 * Приветствие в сцене чек-листа
 */
export const CHECKLIST_WELCOME_MESSAGE = `
🏛 <b>Росреестр — Чек-лист документов</b>

Добро пожаловать! Я помогу подготовить все необходимые документы для регистрации договора аренды.

<b>❓ Сначала ответьте на вопрос:</b>
Срок вашего договора аренды <b>более 1 года</b>?

<i>💡 Согласно ст. 651 ГК РФ, договоры на срок более 1 года подлежат обязательной регистрации в Росреестре.</i>
`;

/**
 * Сообщение о ненужности регистрации
 */
export const NO_REGISTRATION_REQUIRED_MESSAGE = `
✅ <b>Регистрация НЕ требуется!</b>

При сроке договора <b>до 1 года</b> регистрация в Росреестре не обязательна.

<b>📌 Что это значит:</b>
• Договор вступает в силу с момента подписания
• Регистрация не требуется
• Меньше бюрократии и затрат

<b>⚠️ Важно:</b>
Если в договоре есть опция продления, которая может привести к общему сроку более 1 года — регистрация потребуется!

<i>Хотите узнать больше о регистрации на будущее? Нажмите /rosreestr_checklist</i>
`;

/**
 * Сообщение о необходимости регистрации
 */
export const REGISTRATION_REQUIRED_MESSAGE = `
⚠️ <b>Регистрация ОБЯЗАТЕЛЬНА!</b>

При сроке договора <b>более 1 года</b> регистрация в Росреестре обязательна.

<b>📌 Почему это важно:</b>
• Без регистрации договор считается незаключенным
• Арендатор не защищен от продажи объекта
• Невозможно прописаться по адресу аренды
• Проблемы при регистрации ИП/компании

<i>Давайте подготовим все документы! 📋</i>
`;

/**
 * Формирование списка документов с emoji
 */
export function formatDocumentsList(items: ChecklistItem[]): string {
  const header = `📋 <b>ЧЕК-ЛИСТ ДОКУМЕНТОВ</b>\n<i>Отмечайте пункты по мере готовности</i>\n\n`;
  
  const itemsList = items.map((item) => {
    const checkbox = item.checked ? '✅' : '⬜';
    const copies = item.copies ? ` (${item.copies} экз.)` : '';
    return `${checkbox} ${item.emoji} <b>${item.name}</b>${copies}\n<i>${item.description}</i>\n`;
  }).join('\n');

  const progress = items.filter(i => i.checked).length;
  const total = items.length;
  const progressBar = generateProgressBar(progress, total);
  
  const footer = `\n📊 <b>Прогресс:</b> ${progress}/${total}\n${progressBar}`;

  return header + itemsList + footer;
}

/**
 * Генерация прогресс-бара
 */
function generateProgressBar(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const filledBlocks = Math.round((current / total) * 10);
  const emptyBlocks = 10 - filledBlocks;
  
  const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  return `[${bar}] ${percentage}%`;
}

/**
 * Инструкция по подаче документов
 */
export const SUBMISSION_GUIDE_MESSAGE = `
📨 <b>КАК ПОДАТЬ ДОКУМЕНТЫ</b>

<b>Способ 1: Через МФЦ (рекомендуется)</b>
• Запись на mos.ru или Госуслугах
• Прием в удобное время
• Консультация специалиста
• Получение результата в том же МФЦ

<b>Способ 2: Напрямую в Росреестр</b>
• Приемные дни: Пн-Пт 9:00-18:00
• Предварительная запись обязательна
• Адрес: зависит от региона

<b>Способ 3: Через нотариуса</b>
• Нотариус подает документы электронно
• Дороже, но быстрее
• Не нужно стоять в очередях

${REGISTRATION_GUIDE.timeline}
${REGISTRATION_GUIDE.cost}
`;

/**
 * Сообщение о завершении чек-листа
 */
export function formatCompletionMessage(items: ChecklistItem[]): string {
  return `
🎉 <b>ПОЗДРАВЛЯЕМ!</b>

Все документы готовы! (${items.length}/${items.length})

<b>📋 Следующие шаги:</b>
1️⃣ Соберите все оригиналы документов
2️⃣ Оплатите госпошлину: <b>${PAYMENT_DETAILS.individual.amount}₽</b>
3️⃣ Запишитесь в ближайший МФЦ
4️⃣ Подайте документы и получите расписку

<b>⚠️ Важные напоминания:</b>
• Обе стороны должны присутствовать лично
• Возьмите с собой паспорта
• Сохраните квитанцию об оплате

<i>Удачи с регистрацией! 🍀</i>
`;
}

/**
 * Сообщение для поиска МФЦ
 */
export const MFC_SEARCH_WELCOME_MESSAGE = `
🏢 <b>Поиск ближайшего МФЦ</b>

Я помогу найти удобный центр «Мои документы» для подачи документов в Росреестр.

<b>📍 Как найти МФЦ:</b>
• Отправьте свою геолокацию
• Или напишите название города

<i>МФЦ работает с Пн-Пт 8:00-20:00, Сб 10:00-16:00</i>
`;

/**
 * Форматирование ссылки на МФЦ
 */
export function formatMFCLink(city: string, coordinates?: { lat: number; lng: number }): string {
  const encodedCity = encodeURIComponent(city);
  const searchQuery = encodeURIComponent('МФЦ мои документы');
  
  let yandexUrl: string;
  
  if (coordinates) {
    yandexUrl = `https://yandex.ru/maps/?ll=${coordinates.lng}%2C${coordinates.lat}&z=14&text=${searchQuery}`;
  } else {
    yandexUrl = `https://yandex.ru/maps/?text=${searchQuery}+${encodedCity}`;
  }

  return `
🗺 <b>МФЦ в городе ${city}</b>

<a href="${yandexUrl}">🔍 Открыть поиск на Яндекс.Картах</a>

<b>📋 Что взять с собой:</b>
• Паспорт
• Все документы по чек-листу
• Квитанцию об оплате
• Ручку (на всякий случай)

<b>💡 Совет:</b>
Запишитесь заранее через Госуслуги — так вы сэкономите время!
`;
}

/**
 * Сообщение об ошибке
 */
export const ERROR_MESSAGE = `
❌ <b>Произошла ошибка</b>

Попробуйте еще раз или обратитесь в поддержку.

<i>Для возврата в меню нажмите /start</i>
`;

/**
 * Сообщение о недопустимом вводе
 */
export const INVALID_INPUT_MESSAGE = `
⚠️ <b>Некорректный ввод</b>

Пожалуйста, используйте кнопки для ответа или следуйте инструкциям.

<i>Для отмены операции нажмите /cancel</i>
`;

/**
 * Сообщение об отмене операции
 */
export const CANCEL_MESSAGE = `
❌ Операция отменена.

Для возврата в меню нажмите /start
`;

/**
 * Помощь по модулю Росреестра
 */
export const ROSREESTR_HELP_MESSAGE = `
🏛 <b>Модуль Росреестра — Справка</b>

<b>Доступные команды:</b>
/rosreestr_checklist — Чек-лист документов для регистрации
/find_mfc — Найти ближайший МФЦ

<b>Когда нужна регистрация:</b>
• Договор аренды на срок более 1 года
• Передача прав по договору третьим лицам

<b>Стоимость регистрации:</b>
• Физические лица: 2000₽
• Юридические лица: 22000₽

<b>Сроки:</b>
• До 3 рабочих дней

<i>По вопросам: @rentierguard_support</i>
`;
