# Модуль работы с проблемами (Problem Module)

## RentierGuard Bot

Модуль предоставляет функционал для работы с проблемными ситуациями с арендаторами, включая генерацию претензий, управление чёрным списком и инструкции по судебным действиям.

## 📁 Структура модуля

```
src/modules/problem/
├── types.ts                    # TypeScript интерфейсы и типы
├── validators.ts               # Zod схемы валидации
├── index.ts                    # Экспорт модулей
├── scenes/
│   ├── problemWizard.scene.ts  # Сцена мастера проблем (/problem)
│   └── badTenant.scene.ts      # Сцена чёрного списка (/bad_tenant)
├── services/
│   ├── problem.service.ts      # Бизнес-логика
│   └── claimGenerator.service.ts # Генератор претензий
├── templates/
│   └── messages.ts             # Шаблоны сообщений
└── content/
    └── problemScenarios.ts     # Сценарии решения проблем
```

## 🚀 Использование

### Регистрация сцен в боте

```typescript
import { Telegraf, Scenes, session } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import {
  problemScenesArray,
  initializeProblemModule,
} from './modules/problem';

const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN);
const prisma = new PrismaClient();

// Инициализация модуля
initializeProblemModule(prisma);

// Регистрация сцен
const stage = new Scenes.Stage(problemScenesArray);
bot.use(session());
bot.use(stage.middleware());

// Команды
bot.command('problem', (ctx) => ctx.scene.enter('problem-wizard'));
bot.command('bad_tenant', (ctx) => ctx.scene.enter('bad-tenant'));
```

### Генерация претензии

```typescript
import { generateClaimText, ProblemType } from './modules/problem';

const result = generateClaimText(
  {
    type: ProblemType.NON_PAYMENT,
    debtAmount: 50000,
    delayDays: 15,
    tenantName: 'Иванов Иван Иванович',
    contractDate: '01.01.2024',
  },
  ProblemType.NON_PAYMENT
);

if (result.success) {
  console.log(result.claim?.content);
}
```

### Работа с чёрным списком

```typescript
import {
  addToBadTenant,
  getUserBadTenants,
  deleteBadTenant,
  BadTenantReason,
} from './modules/problem';

// Добавление записи
const result = await addToBadTenant({
  userId: '123456789',
  fullName: 'Иванов Иван Иванович',
  reason: BadTenantReason.NON_PAYMENT,
  description: 'Не платил аренду 3 месяца',
  debtAmount: 150000,
});

// Получение списка
const tenants = await getUserBadTenants('123456789');

// Удаление записи
await deleteBadTenant('tenant-id', '123456789');
```

## 📋 Типы проблем

| Тип | Описание | Данные |
|-----|----------|--------|
| `NON_PAYMENT` | Неуплата аренды | Сумма долга, срок просрочки |
| `PROPERTY_DAMAGE` | Повреждение имущества | Описание, стоимость ремонта |
| `EVICTION_WITHOUT_PAY` | Выезд без оплаты | Сумма долга, дата выезда |
| `OTHER` | Другие проблемы | Описание ситуации |

## 🎭 Сцены

### `/problem` - Мастер решения проблем

1. **Шаг 1**: Выбор типа проблемы (inline keyboard)
2. **Шаг 2**: Сбор данных в зависимости от типа
3. **Шаг 3**: Подтверждение данных
4. **Шаг 4**: Генерация претензии
5. **Шаг 5**: Инструкции по дальнейшим действиям

### `/bad_tenant` - Чёрный список

- Просмотр списка проблемных арендаторов
- Добавление новой записи (7-шаговый wizard)
- Удаление записей
- Просмотр деталей

## ✅ Валидация

Все входные данные валидируются с помощью Zod:

- Суммы должны быть положительными числами
- Даты в формате `DD.MM.YYYY`
- Паспортные данные: `1234 567890`
- Телефон: `+79001234567`
- ФИО минимум 3 символа

## 📝 Генерация претензий

Поддерживаемые типы претензий:

1. **Претензия о неуплате** - с расчётом неустойки и процентов
2. **Претензия о повреждении** - с описанием ущерба
3. **Претензия после выезда** - для взыскания долга
4. **Уведомление о расторжении** - для расторжения договора

## 🗄 База данных

### Модель BadTenant (Prisma)

```prisma
model BadTenant {
  id              String   @id @default(uuid())
  userId          String
  fullName        String
  passportData    String?
  phoneNumber     String?
  reason          String
  description     String
  contractDate    String?
  contractEndDate String?
  debtAmount      Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 🔒 Безопасность

- Проверка прав доступа при удалении записей
- Валидация всех входных данных
- Защита от SQL-инъекций через Prisma
- Пользователь видит только свои записи

## 📚 Зависимости

```json
{
  "telegraf": "^4.x",
  "@prisma/client": "^5.x",
  "zod": "^3.x"
}
```

## 🧪 Тестирование

```bash
# Установка зависимостей
npm install

# Генерация Prisma клиента
npx prisma generate

# Запуск миграций
npx prisma migrate dev
```

## 📄 Лицензия

MIT
