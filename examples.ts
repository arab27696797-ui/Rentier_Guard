// =============================================================================
// RentierGuard - Prisma Client Examples
// Примеры использования Prisma Client для разработки Telegram-бота
// =============================================================================

import { PrismaClient, UserStatus, ContractStatus, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// ПРИМЕР 1: Работа с пользователями
// =============================================================================

/**
 * Создание нового пользователя из Telegram
 */
async function createUserFromTelegram(
  telegramId: bigint,
  firstName: string,
  username?: string,
  lastName?: string
) {
  return await prisma.user.upsert({
    where: { telegramId },
    update: {
      username,
      firstName,
      lastName,
      status: UserStatus.ACTIVE,
    },
    create: {
      telegramId,
      username,
      firstName,
      lastName: lastName || '',
      status: UserStatus.ACTIVE,
    },
  })
}

/**
 * Получение пользователя с его объектами недвижимости
 */
async function getUserWithProperties(telegramId: bigint) {
  return await prisma.user.findUnique({
    where: { telegramId },
    include: {
      properties: {
        include: {
          contracts: {
            where: {
              status: { in: [ContractStatus.ACTIVE, ContractStatus.DRAFT] },
            },
          },
        },
      },
    },
  })
}

// =============================================================================
// ПРИМЕР 2: Работа с договорами аренды
// =============================================================================

/**
 * Создание нового договора аренды
 */
async function createContract(
  propertyId: number,
  tenantData: {
    name: string
    phone: string
    passport: string
  },
  rentData: {
    monthlyRent: number
    deposit: number
    startDate: Date
    endDate: Date
  }
) {
  return await prisma.contract.create({
    data: {
      propertyId,
      tenantName: tenantData.name,
      tenantPhone: tenantData.phone,
      tenantPassport: tenantData.passport,
      type: 'RESIDENTIAL',
      status: ContractStatus.DRAFT,
      monthlyRent: rentData.monthlyRent,
      deposit: rentData.deposit,
      startDate: rentData.startDate,
      endDate: rentData.endDate,
    },
  })
}

/**
 * Получение активных договоров с просроченными платежами
 */
async function getContractsWithOverduePayments() {
  return await prisma.contract.findMany({
    where: {
      status: ContractStatus.ACTIVE,
      payments: {
        some: {
          status: PaymentStatus.OVERDUE,
        },
      },
    },
    include: {
      property: {
        include: {
          user: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.OVERDUE,
        },
      },
    },
  })
}

// =============================================================================
// ПРИМЕР 3: Работа с платежами
// =============================================================================

/**
 * Создание запланированного платежа
 */
async function createScheduledPayment(
  contractId: number,
  amount: number,
  dueDate: Date,
  type: 'RENT' | 'DEPOSIT' | 'UTILITY' | 'PENALTY' = 'RENT',
  description?: string
) {
  return await prisma.payment.create({
    data: {
      contractId,
      amount,
      dueDate,
      type,
      description,
      status: PaymentStatus.PENDING,
    },
  })
}

/**
 * Отметка платежа как оплаченного
 */
async function markPaymentAsPaid(paymentId: number) {
  return await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.PAID,
      paidDate: new Date(),
    },
  })
}

/**
 * Получение платежей по договору
 */
async function getContractPayments(contractId: number) {
  return await prisma.payment.findMany({
    where: { contractId },
    orderBy: { dueDate: 'desc' },
  })
}

/**
 * Проверка просроченных платежей и обновление статуса
 */
async function checkOverduePayments() {
  const today = new Date()
  
  const overduePayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
      dueDate: { lt: today },
    },
  })

  for (const payment of overduePayments) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.OVERDUE },
    })
  }

  return overduePayments.length
}

// =============================================================================
// ПРИМЕР 4: Работа с чёрным списком
// =============================================================================

/**
 * Добавление арендатора в чёрный список
 */
async function addToBadTenantList(
  userId: number,
  data: {
    fullName: string
    passportData?: string
    reason: string
    evidenceDescription?: string
    contractDate?: Date
  }
) {
  return await prisma.badTenant.create({
    data: {
      userId,
      fullName: data.fullName,
      passportData: data.passportData,
      reason: data.reason,
      evidenceDescription: data.evidenceDescription,
      contractDate: data.contractDate,
    },
  })
}

/**
 * Поиск в чёрном списке по имени
 */
async function searchBadTenants(query: string) {
  return await prisma.badTenant.findMany({
    where: {
      fullName: {
        contains: query,
        mode: 'insensitive',
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

// =============================================================================
// ПРИМЕР 5: Работа с запросами к экспертам
// =============================================================================

/**
 * Создание запроса к эксперту
 */
async function createExpertRequest(
  userId: number,
  type: 'LAWYER' | 'TAX' | 'ACCOUNTANT',
  description: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  // Проверка на бесплатную консультацию
  const useFreeConsultation = !user?.freeConsultationUsed

  const request = await prisma.expertRequest.create({
    data: {
      userId,
      type,
      description,
      priority,
      status: 'NEW',
    },
  })

  // Если используется бесплатная консультация, отмечаем это
  if (useFreeConsultation) {
    await prisma.user.update({
      where: { id: userId },
      data: { freeConsultationUsed: true },
    })
  }

  return request
}

/**
 * Получение активных запросов к экспертам
 */
async function getActiveExpertRequests() {
  return await prisma.expertRequest.findMany({
    where: {
      status: { in: ['NEW', 'IN_PROGRESS'] },
    },
    include: {
      user: {
        select: {
          telegramId: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  })
}

// =============================================================================
// ПРИМЕР 6: Статистика и отчёты
// =============================================================================

/**
 * Получение финансовой статистики пользователя
 */
async function getUserFinancialStats(userId: number, year: number) {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)

  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        property: {
          userId,
        },
      },
      paidDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
      status: PaymentStatus.PAID,
    },
    include: {
      contract: {
        include: {
          property: true,
        },
      },
    },
  })

  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const rentIncome = payments
    .filter((p) => p.type === 'RENT')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    totalIncome,
    rentIncome,
    depositIncome: payments
      .filter((p) => p.type === 'DEPOSIT')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    totalPayments: payments.length,
  }
}

/**
 * Получение объектов с истекающими договорами
 */
async function getExpiringContracts(daysThreshold: number = 30) {
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

  return await prisma.contract.findMany({
    where: {
      status: ContractStatus.ACTIVE,
      endDate: {
        lte: thresholdDate,
        gte: new Date(),
      },
    },
    include: {
      property: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { endDate: 'asc' },
  })
}

// =============================================================================
// Экспорт функций для использования
// =============================================================================

export {
  // Пользователи
  createUserFromTelegram,
  getUserWithProperties,
  
  // Договоры
  createContract,
  getContractsWithOverduePayments,
  
  // Платежи
  createScheduledPayment,
  markPaymentAsPaid,
  getContractPayments,
  checkOverduePayments,
  
  // Чёрный список
  addToBadTenantList,
  searchBadTenants,
  
  // Эксперты
  createExpertRequest,
  getActiveExpertRequests,
  
  // Статистика
  getUserFinancialStats,
  getExpiringContracts,
}
