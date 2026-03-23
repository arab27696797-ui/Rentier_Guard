# 🏠 RentierGuard

> **Интеллектуальный Telegram-бот для управления арендной недвижимостью**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RentierGuard** — это комплексное решение для арендодателей, которое автоматизирует рутинные задачи: отслеживание платежей, управление договорами, напоминания арендаторам и аналитика доходов.

---

## 📋 Содержание

- [Возможности](#-возможности)
- [Стек технологий](#-стек-технологий)
- [Команды бота](#-команды-бота)
- [Схема базы данных](#-схема-базы-данных)
- [Архитектура](#-архитектура)
- [Установка и запуск](#-установка-и-запуск)
- [Деплой на Railway](#-деплой-на-railway)
- [Переменные окружения](#-переменные-окружения)
- [Разработка](#-разработка)
- [Лицензия](#-лицензия)

---

## ✨ Возможности

### 🏢 Управление объектами недвижимости
| Модуль | Описание |
|--------|----------|
| `properties` | Добавление, редактирование и удаление объектов недвижимости |
| `property-details` | Хранение полной информации: адрес, площадь, количество комнат |
| `property-status` | Отслеживание статуса: свободно / сдано / на ремонте |

### 👥 Управление арендаторами
| Модуль | Описание |
|--------|----------|
| `tenants` | База данных арендаторов с контактами |
| `tenant-history` | История проживания арендаторов |
| `tenant-verification` | Проверка документов и кредитной истории |

### 📄 Договоры аренды
| Модуль | Описание |
|--------|----------|
| `contracts` | Создание и хранение договоров аренды |
| `contract-templates` | Шаблоны договоров для разных типов недвижимости |
| `auto-renewal` | Автоматическое продление договоров |
| `contract-expiry` | Уведомления об истечении срока договора |

### 💰 Финансовый учёт
| Модуль | Описание |
|--------|----------|
| `payments` | Отслеживание арендных платежей |
| `payment-reminders` | Автоматические напоминания арендаторам |
| `debt-tracking` | Учёт задолженностей и пени |
| `income-analytics` | Аналитика доходов и расходов |
| `tax-calculation` | Расчёт налогов (НДФЛ, патент, самозанятость) |

### 📊 Отчётность
| Модуль | Описание |
|--------|----------|
| `reports` | Генерация финансовых отчётов |
| `export-pdf` | Экспорт отчётов в PDF |
| `export-excel` | Экспорт данных в Excel |
| `charts` | Визуализация данных (графики доходов) |

### 🔧 Сервисные функции
| Модуль | Описание |
|--------|----------|
| `notifications` | Система уведомлений (Telegram, Email) |
| `reminders` | Настраиваемые напоминания |
| `calendar` | Интеграция с Google Calendar |
| `document-storage` | Хранение документов в облаке |

---

## 🛠 Стек технологий

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| [Node.js](https://nodejs.org/) | 18+ | Серверная платформа |
| [TypeScript](https://www.typescriptlang.org/) | 5.0+ | Типизация |
| [Telegraf](https://telegraf.js.org/) | 4.x | Telegram Bot Framework |
| [Express.js](https://expressjs.com/) | 4.x | REST API |

### Database
| Технология | Версия | Назначение |
|------------|--------|------------|
| [PostgreSQL](https://www.postgresql.org/) | 14+ | Основная база данных |
| [Prisma ORM](https://www.prisma.io/) | 5.x | ORM и миграции |
| [Redis](https://redis.io/) | 7.x | Кэширование и сессии |

### Инфраструктура
| Технология | Назначение |
|------------|------------|
| [Docker](https://www.docker.com/) | Контейнеризация |
| [Railway](https://railway.app/) | Облачный хостинг |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

### Утилиты
| Технология | Назначение |
|------------|------------|
| [date-fns](https://date-fns.org/) | Работа с датами |
| [winston](https://github.com/winstonjs/winston) | Логирование |
| [zod](https://zod.dev/) | Валидация данных |
| [puppeteer](https://pptr.dev/) | Генерация PDF |

---

## 🤖 Команды бота

### Основные команды

| Команда | Описание | Доступ |
|---------|----------|--------|
| `/start` | Запуск бота, приветственное сообщение | Все |
| `/help` | Справка по командам | Все |
| `/menu` | Главное меню | Авторизованные |
| `/profile` | Профиль пользователя | Авторизованные |
| `/settings` | Настройки бота | Авторизованные |

### Управление объектами

| Команда | Описание | Пример |
|---------|----------|--------|
| `/properties` | Список всех объектов | `/properties` |
| `/addproperty` | Добавить новый объект | `/addproperty` |
| `/property [id]` | Информация об объекте | `/property 123` |
| `/editproperty [id]` | Редактировать объект | `/editproperty 123` |
| `/deleteproperty [id]` | Удалить объект | `/deleteproperty 123` |

### Управление арендаторами

| Команда | Описание | Пример |
|---------|----------|--------|
| `/tenants` | Список арендаторов | `/tenants` |
| `/addtenant` | Добавить арендатора | `/addtenant` |
| `/tenant [id]` | Информация об арендаторе | `/tenant 456` |
| `/edittenant [id]` | Редактировать арендатора | `/edittenant 456` |

### Договоры и платежи

| Команда | Описание | Пример |
|---------|----------|--------|
| `/contracts` | Список договоров | `/contracts` |
| `/addcontract` | Создать договор | `/addcontract` |
| `/payments` | История платежей | `/payments` |
| `/addpayment` | Записать платёж | `/addpayment` |
| `/debts` | Список задолженностей | `/debts` |

### Отчёты и аналитика

| Команда | Описание | Пример |
|---------|----------|--------|
| `/report` | Финансовый отчёт | `/report 2024-01` |
| `/analytics` | Аналитика доходов | `/analytics` |
| `/export` | Экспорт данных | `/export pdf` |

### Административные команды

| Команда | Описание | Доступ |
|---------|----------|--------|
| `/admin` | Панель администратора | Админы |
| `/stats` | Статистика бота | Админы |
| `/broadcast` | Массовая рассылка | Админы |
| `/backup` | Создать бэкап БД | Админы |

---

## 🗄 Схема базы данных

### ER-диаграмма

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │   properties    │     │    tenants      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ telegram_id     │     │ user_id (FK)    │◄────│ user_id (FK)    │
│ username        │     │ address         │     │ first_name      │
│ first_name      │     │ city            │     │ last_name       │
│ last_name       │     │ area_sqm        │     │ phone           │
│ phone           │     │ rooms           │     │ email           │
│ email           │     │ floor           │     │ passport_data   │
│ role            │     │ status          │     │ created_at      │
│ created_at      │     │ created_at      │     │ updated_at      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────▼────────┐       ┌────────▼────────┐
           │    contracts    │       │    payments     │
           ├─────────────────┤       ├─────────────────┤
           │ id (PK)         │       │ id (PK)         │
           │ property_id(FK) │       │ contract_id(FK) │
           │ tenant_id (FK)  │◄──────│ amount          │
           │ start_date      │       │ payment_date    │
           │ end_date        │       │ payment_type    │
           │ monthly_rent    │       │ status          │
           │ deposit         │       │ created_at      │
           │ status          │       └─────────────────┘
           │ created_at      │
           └─────────────────┘
```

### Описание таблиц

#### `users` — Пользователи бота
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `UUID` | Первичный ключ |
| `telegram_id` | `BIGINT` | ID пользователя в Telegram |
| `username` | `VARCHAR(255)` | Username в Telegram |
| `first_name` | `VARCHAR(255)` | Имя |
| `last_name` | `VARCHAR(255)` | Фамилия |
| `phone` | `VARCHAR(20)` | Номер телефона |
| `email` | `VARCHAR(255)` | Email |
| `role` | `ENUM` | Роль: `user`, `admin` |
| `created_at` | `TIMESTAMP` | Дата создания |
| `updated_at` | `TIMESTAMP` | Дата обновления |

#### `properties` — Объекты недвижимости
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `UUID` | Первичный ключ |
| `user_id` | `UUID` | Владелец (FK → users) |
| `address` | `VARCHAR(500)` | Полный адрес |
| `city` | `VARCHAR(100)` | Город |
| `area_sqm` | `DECIMAL(10,2)` | Площадь в м² |
| `rooms` | `INTEGER` | Количество комнат |
| `floor` | `INTEGER` | Этаж |
| `status` | `ENUM` | Статус: `free`, `rented`, `repair` |
| `created_at` | `TIMESTAMP` | Дата создания |

#### `tenants` — Арендаторы
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `UUID` | Первичный ключ |
| `user_id` | `UUID` | Владелец (FK → users) |
| `first_name` | `VARCHAR(255)` | Имя |
| `last_name` | `VARCHAR(255)` | Фамилия |
| `phone` | `VARCHAR(20)` | Телефон |
| `email` | `VARCHAR(255)` | Email |
| `passport_data` | `VARCHAR(500)` | Паспортные данные (зашифровано) |
| `created_at` | `TIMESTAMP` | Дата создания |

#### `contracts` — Договоры аренды
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `UUID` | Первичный ключ |
| `property_id` | `UUID` | Объект (FK → properties) |
| `tenant_id` | `UUID` | Арендатор (FK → tenants) |
| `start_date` | `DATE` | Дата начала |
| `end_date` | `DATE` | Дата окончания |
| `monthly_rent` | `DECIMAL(12,2)` | Ежемесячная аренда |
| `deposit` | `DECIMAL(12,2)` | Залог |
| `status` | `ENUM` | Статус: `active`, `expired`, `terminated` |
| `created_at` | `TIMESTAMP` | Дата создания |

#### `payments` — Платежи
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `UUID` | Первичный ключ |
| `contract_id` | `UUID` | Договор (FK → contracts) |
| `amount` | `DECIMAL(12,2)` | Сумма платежа |
| `payment_date` | `DATE` | Дата платежа |
| `payment_type` | `ENUM` | Тип: `rent`, `deposit`, `utility` |
| `status` | `ENUM` | Статус: `pending`, `paid`, `overdue` |
| `created_at` | `TIMESTAMP` | Дата создания |

---

## 🏗 Архитектура

### Структура проекта

```
rentierguard/
├── 📁 src/
│   ├── 📁 bot/                    # Telegram бот
│   │   ├── 📁 commands/           # Обработчики команд
│   │   │   ├── start.ts
│   │   │   ├── properties.ts
│   │   │   ├── tenants.ts
│   │   │   ├── contracts.ts
│   │   │   ├── payments.ts
│   │   │   └── reports.ts
│   │   ├── 📁 middlewares/        # Middleware
│   │   │   ├── auth.ts
│   │   │   ├── logging.ts
│   │   │   └── rateLimit.ts
│   │   ├── 📁 scenes/             # Wizard сцены
│   │   │   ├── addProperty.ts
│   │   │   ├── addTenant.ts
│   │   │   └── addContract.ts
│   │   ├── 📁 keyboards/          # Клавиатуры
│   │   │   ├── mainMenu.ts
│   │   │   └── inlineKeyboards.ts
│   │   └── index.ts               # Точка входа бота
│   │
│   ├── 📁 api/                    # REST API
│   │   ├── 📁 routes/
│   │   ├── 📁 controllers/
│   │   ├── 📁 middlewares/
│   │   └── index.ts
│   │
│   ├── 📁 services/               # Бизнес-логика
│   │   ├── propertyService.ts
│   │   ├── tenantService.ts
│   │   ├── contractService.ts
│   │   ├── paymentService.ts
│   │   ├── reportService.ts
│   │   └── notificationService.ts
│   │
│   ├── 📁 database/               # Работа с БД
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── connection.ts
│   │
│   ├── 📁 models/                 # TypeScript интерфейсы
│   │   ├── user.ts
│   │   ├── property.ts
│   │   ├── tenant.ts
│   │   └── contract.ts
│   │
│   ├── 📁 utils/                  # Утилиты
│   │   ├── logger.ts
│   │   ├── dateHelpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   │
│   ├── 📁 config/                 # Конфигурация
│   │   ├── index.ts
│   │   └── database.ts
│   │
│   └── index.ts                   # Главная точка входа
│
├── 📁 prisma/                     # Prisma схема
│   ├── schema.prisma
│   └── migrations/
│
├── 📁 tests/                      # Тесты
│   ├── unit/
│   └── integration/
│
├── 📁 docs/                       # Документация
│   ├── api.md
│   └── deployment.md
│
├── 📄 .env.example                # Пример переменных окружения
├── 📄 .env                        # Переменные окружения (не в git)
├── 📄 .gitignore
├── 📄 .eslintrc.js
├── 📄 .prettierrc
├── 📄 tsconfig.json
├── 📄 package.json
├── 📄 Dockerfile
├── 📄 docker-compose.yml
└── 📄 README.md                   # Этот файл
```

### Схема взаимодействия

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────►│    Bot      │────►│  Middleware │
│   Server    │◄────│   Handler   │◄────│  (auth/log) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ Service │  │ Service │  │ Service │
        │Property │  │  Tenant │  │ Payment │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Prisma    │
                   │     ORM     │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  PostgreSQL │
                   │   Database  │
                   └─────────────┘
```

---

## 🚀 Установка и запуск

### Предварительные требования

- [Node.js](https://nodejs.org/) 18+ 
- [PostgreSQL](https://www.postgresql.org/) 14+
- [npm](https://www.npmjs.com/) или [yarn](https://yarnpkg.com/)

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/yourusername/rentierguard.git
cd rentierguard
```

### Шаг 2: Установка зависимостей

```bash
npm install
# или
yarn install
```

### Шаг 3: Настройка переменных окружения

```bash
cp .env.example .env
# Отредактируйте .env файл
nano .env
```

### Шаг 4: Настройка базы данных

```bash
# Создайте базу данных в PostgreSQL
createdb rentierguard

# Выполните миграции
npx prisma migrate dev

# Сгенерируйте клиент Prisma
npx prisma generate
```

### Шаг 5: Запуск в режиме разработки

```bash
npm run dev
```

Бот будет запущен и готов к работе! 🎉

### Шаг 6: Сборка для production

```bash
npm run build
npm start
```

---

## 🚂 Деплой на Railway

[Railway](https://railway.app/) — это облачная платформа для деплоя приложений с бесплатным тарифом.

### Шаг 1: Подготовка

1. Зарегистрируйтесь на [Railway](https://railway.app/)
2. Установите [Railway CLI](https://docs.railway.app/develop/cli):
   ```bash
   npm install -g @railway/cli
   ```
3. Авторизуйтесь:
   ```bash
   railway login
   ```

### Шаг 2: Создание проекта

```bash
# Инициализируйте проект
railway init

# Выберите имя проекта или создайте новый
```

### Шаг 3: Добавление базы данных

```bash
# Добавьте PostgreSQL
railway add --database postgres

# Получите переменные окружения БД
railway variables
```

### Шаг 4: Настройка переменных окружения

```bash
# Установите переменные
railway variables set BOT_TOKEN="your_bot_token"
railway variables set NODE_ENV="production"
# ... остальные переменные
```

Или через веб-интерфейс Railway:
1. Откройте проект в [Railway Dashboard](https://railway.app/dashboard)
2. Перейдите в раздел **Variables**
3. Добавьте переменные

### Шаг 5: Деплой

```bash
# Деплой из текущей директории
railway up

# Или настройте авто-деплой из GitHub
# Railway Dashboard → Settings → GitHub Repo
```

### Шаг 6: Настройка вебхуков (опционально)

Для production рекомендуется использовать вебхуки вместо polling:

```bash
# Установите webhook URL
railway variables set WEBHOOK_URL="https://your-app.railway.app/webhook"
```

### Мониторинг

- Логи: `railway logs`
- Метрики: [Railway Dashboard](https://railway.app/dashboard)

---

## 🔐 Переменные окружения

### Обязательные

| Переменная | Описание | Пример |
|------------|----------|--------|
| `BOT_TOKEN` | Токен Telegram бота от [@BotFather](https://t.me/BotFather) | `123456789:ABCdef...` |
| `DATABASE_URL` | URL подключения к PostgreSQL | `postgresql://user:pass@host:5432/db` |

### Опциональные

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `NODE_ENV` | Режим работы | `development` |
| `PORT` | Порт для API | `3000` |
| `WEBHOOK_URL` | URL для вебхуков | — |
| `REDIS_URL` | URL подключения к Redis | — |
| `LOG_LEVEL` | Уровень логирования | `info` |

### Настройки уведомлений

| Переменная | Описание | Пример |
|------------|----------|--------|
| `NOTIFICATION_CHANNEL` | Канал для уведомлений | `@rentierguard_logs` |
| `ADMIN_TELEGRAM_ID` | ID администратора | `123456789` |

### Пример `.env` файла

```env
# Bot Configuration
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rentierguard

# Server
PORT=3000
WEBHOOK_URL=

# Redis (опционально)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug

# Admin
ADMIN_TELEGRAM_ID=123456789
NOTIFICATION_CHANNEL=@rentierguard_logs
```

---

## 💻 Разработка

### Доступные скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки с hot-reload |
| `npm run build` | Компиляция TypeScript |
| `npm start` | Запуск production-версии |
| `npm run lint` | Проверка ESLint |
| `npm run lint:fix` | Автоисправление ESLint |
| `npm run format` | Форматирование Prettier |
| `npm test` | Запуск тестов |
| `npm run test:watch` | Тесты в режиме watch |
| `npm run db:migrate` | Выполнить миграции |
| `npm run db:generate` | Сгенерировать Prisma клиент |
| `npm run db:studio` | Открыть Prisma Studio |
| `npm run db:seed` | Заполнить БД тестовыми данными |

### Работа с миграциями

```bash
# Создать новую миграцию
npx prisma migrate dev --name add_new_field

# Применить миграции
npx prisma migrate deploy

# Откатить последнюю миграцию
npx prisma migrate resolve --rolled-back
```

### Работа с Prisma Studio

```bash
# Открыть визуальный редактор БД
npx prisma studio
```

### Структура коммитов

Мы используем [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: добавлена новая функция
fix: исправлена ошибка в расчёте платежей
docs: обновлена документация
refactor: рефакторинг сервиса платежей
test: добавлены тесты для арендаторов
```

---

## 📄 Лицензия

Этот проект распространяется под лицензией **MIT**.

```
MIT License

Copyright (c) 2024 RentierGuard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

- 📧 Email: support@rentierguard.ru
- 💬 Telegram: [@RentierGuardSupport](https://t.me/RentierGuardSupport)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/rentierguard/issues)

---

## 🙏 Благодарности

- [Telegraf](https://telegraf.js.org/) — отличный фреймворк для Telegram ботов
- [Prisma](https://www.prisma.io/) — современный ORM
- [Railway](https://railway.app/) — удобный хостинг

---

<p align="center">
  Сделано с ❤️ для арендодателей России
</p>

<p align="center">
  <a href="https://t.me/RentierGuardBot">🤖 Открыть бота в Telegram</a>
</p>
