// =============================================================================
// RentierGuard - Seed Data
// Тестовые данные для разработки и тестирования
// =============================================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаю заполнение базы данных тестовыми данными...')

  // Очистка существующих данных (в правильном порядке из-за foreign keys)
  console.log('🧹 Очистка существующих данных...')
  await prisma.inventoryItem.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.contract.deleteMany({})
  await prisma.property.deleteMany({})
  await prisma.expertRequest.deleteMany({})
  await prisma.badTenant.deleteMany({})
  await prisma.documentTemplate.deleteMany({})
  await prisma.user.deleteMany({})

  // ===========================================================================
  // 1. Создание пользователей
  // ===========================================================================
  console.log('👤 Создание пользователей...')

  const user1 = await prisma.user.create({
    data: {
      telegramId: 123456789n,
      username: 'ivan_rentier',
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+7 (999) 123-45-67',
      email: 'ivan.petrov@example.com',
      status: 'ACTIVE',
      freeConsultationUsed: false,
    },
  })
  console.log(`✅ Создан пользователь: ${user1.firstName} ${user1.lastName} (ID: ${user1.id})`)

  const user2 = await prisma.user.create({
    data: {
      telegramId: 987654321n,
      username: 'maria_landlord',
      firstName: 'Мария',
      lastName: 'Сидорова',
      phone: '+7 (999) 987-65-43',
      email: 'maria.sidorova@example.com',
      status: 'ACTIVE',
      freeConsultationUsed: true,
    },
  })
  console.log(`✅ Создан пользователь: ${user2.firstName} ${user2.lastName} (ID: ${user2.id})`)

  // ===========================================================================
  // 2. Создание объектов недвижимости
  // ===========================================================================
  console.log('🏠 Создание объектов недвижимости...')

  const property1 = await prisma.property.create({
    data: {
      userId: user1.id,
      address: 'г. Москва, ул. Ленина, д. 10, кв. 25',
      cadastralNumber: '77:01:0001234:15',
      taxMode: 'NDFL',
      propertyType: 'RESIDENTIAL',
    },
  })
  console.log(`✅ Создан объект: ${property1.address} (ID: ${property1.id})`)

  const property2 = await prisma.property.create({
    data: {
      userId: user1.id,
      address: 'г. Москва, пр. Мира, д. 50, офис 305',
      cadastralNumber: '77:02:0005678:42',
      taxMode: 'IP',
      propertyType: 'COMMERCIAL',
    },
  })
  console.log(`✅ Создан объект: ${property2.address} (ID: ${property2.id})`)

  const property3 = await prisma.property.create({
    data: {
      userId: user2.id,
      address: 'г. Санкт-Петербург, Невский пр., д. 100, кв. 15',
      taxMode: 'SELFEMPLOYED',
      propertyType: 'RESIDENTIAL',
    },
  })
  console.log(`✅ Создан объект: ${property3.address} (ID: ${property3.id})`)

  // ===========================================================================
  // 3. Создание договоров аренды
  // ===========================================================================
  console.log('📄 Создание договоров аренды...')

  const today = new Date()
  const oneYearLater = new Date(today)
  oneYearLater.setFullYear(today.getFullYear() + 1)

  const contract1 = await prisma.contract.create({
    data: {
      propertyId: property1.id,
      tenantName: 'Алексей Сергеевич Смирнов',
      tenantPhone: '+7 (916) 111-22-33',
      tenantPassport: '4515 123456',
      type: 'RESIDENTIAL',
      status: 'ACTIVE',
      startDate: today,
      endDate: oneYearLater,
      monthlyRent: 75000.00,
      deposit: 75000.00,
      registeredInRosreestr: false,
      documentPath: '/documents/contracts/contract_001.pdf',
    },
  })
  console.log(`✅ Создан договор с арендатором: ${contract1.tenantName} (ID: ${contract1.id})`)

  const contract2 = await prisma.contract.create({
    data: {
      propertyId: property2.id,
      tenantName: 'ООО "Бизнес Партнёр"',
      tenantPhone: '+7 (495) 444-55-66',
      tenantPassport: 'ОГРН 1234567890123',
      type: 'COMMERCIAL',
      status: 'ACTIVE',
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()),
      monthlyRent: 150000.00,
      deposit: 300000.00,
      registeredInRosreestr: true,
      documentPath: '/documents/contracts/contract_002.pdf',
    },
  })
  console.log(`✅ Создан договор с арендатором: ${contract2.tenantName} (ID: ${contract2.id})`)

  // ===========================================================================
  // 4. Создание платежей
  // ===========================================================================
  console.log('💰 Создание платежей...')

  // Платежи по первому договору
  const payment1 = await prisma.payment.create({
    data: {
      contractId: contract1.id,
      amount: 75000.00,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      paidDate: new Date(today.getFullYear(), today.getMonth(), 3),
      status: 'PAID',
      type: 'RENT',
      description: 'Арендная плата за текущий месяц',
    },
  })
  console.log(`✅ Создан платёж: ${payment1.amount} ₽ (ID: ${payment1.id})`)

  const payment2 = await prisma.payment.create({
    data: {
      contractId: contract1.id,
      amount: 75000.00,
      dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 5),
      status: 'PENDING',
      type: 'RENT',
      description: 'Арендная плата за следующий месяц',
    },
  })
  console.log(`✅ Создан платёж: ${payment2.amount} ₽ (ID: ${payment2.id})`)

  const payment3 = await prisma.payment.create({
    data: {
      contractId: contract1.id,
      amount: 75000.00,
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, 5),
      paidDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
      status: 'PAID',
      type: 'RENT',
      description: 'Арендная плата с опозданием',
    },
  })
  console.log(`✅ Создан платёж: ${payment3.amount} ₽ (ID: ${payment3.id})`)

  // Платежи по второму договору
  const payment4 = await prisma.payment.create({
    data: {
      contractId: contract2.id,
      amount: 150000.00,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 1),
      status: 'PAID',
      type: 'RENT',
      description: 'Аренда коммерческого помещения',
    },
  })
  console.log(`✅ Создан платёж: ${payment4.amount} ₽ (ID: ${payment4.id})`)

  const payment5 = await prisma.payment.create({
    data: {
      contractId: contract2.id,
      amount: 300000.00,
      dueDate: today,
      status: 'PAID',
      type: 'DEPOSIT',
      description: 'Залог за коммерческое помещение',
    },
  })
  console.log(`✅ Создан платёж (залог): ${payment5.amount} ₽ (ID: ${payment5.id})`)

  // ===========================================================================
  // 5. Создание шаблонов документов
  // ===========================================================================
  console.log('📋 Создание шаблонов документов...')

  const template1 = await prisma.documentTemplate.create({
    data: {
      name: 'Договор аренды жилого помещения',
      filePath: '/templates/residential_contract.docx',
      type: 'CONTRACT',
      variables: JSON.stringify([
        'landlord_name',
        'landlord_passport',
        'tenant_name',
        'tenant_passport',
        'address',
        'monthly_rent',
        'deposit',
        'start_date',
        'end_date',
      ]),
      description: 'Стандартный договор аренды жилого помещения',
    },
  })
  console.log(`✅ Создан шаблон: ${template1.name} (ID: ${template1.id})`)

  const template2 = await prisma.documentTemplate.create({
    data: {
      name: 'Договор аренды коммерческого помещения',
      filePath: '/templates/commercial_contract.docx',
      type: 'CONTRACT',
      variables: JSON.stringify([
        'landlord_name',
        'landlord_inn',
        'tenant_company',
        'tenant_ogrn',
        'address',
        'area',
        'monthly_rent',
        'deposit',
        'start_date',
        'end_date',
      ]),
      description: 'Договор аренды нежилого помещения для юрлиц',
    },
  })
  console.log(`✅ Создан шаблон: ${template2.name} (ID: ${template2.id})`)

  const template3 = await prisma.documentTemplate.create({
    data: {
      name: 'Акт приёма-передачи',
      filePath: '/templates/acceptance_act.docx',
      type: 'ACT',
      variables: JSON.stringify([
        'landlord_name',
        'tenant_name',
        'address',
        'transfer_date',
        'inventory_items',
      ]),
      description: 'Акт приёма-передачи помещения с инвентаризацией',
    },
  })
  console.log(`✅ Создан шаблон: ${template3.name} (ID: ${template3.id})`)

  const template4 = await prisma.documentTemplate.create({
    data: {
      name: 'Претензия о задолженности',
      filePath: '/templates/debt_claim.docx',
      type: 'CLAIM',
      variables: JSON.stringify([
        'landlord_name',
        'tenant_name',
        'contract_number',
        'debt_amount',
        'penalty_amount',
        'due_date',
        'claim_date',
      ]),
      description: 'Претензия о взыскании задолженности по аренде',
    },
  })
  console.log(`✅ Создан шаблон: ${template4.name} (ID: ${template4.id})`)

  // ===========================================================================
  // 6. Создание запросов к экспертам
  // ===========================================================================
  console.log('🎓 Создание запросов к экспертам...')

  const expertRequest1 = await prisma.expertRequest.create({
    data: {
      userId: user1.id,
      type: 'LAWYER',
      description: 'Арендатор не платит уже 2 месяца. Как правильно составить претензию и можно ли выселить без суда?',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
  })
  console.log(`✅ Создан запрос к юристу (ID: ${expertRequest1.id})`)

  const expertRequest2 = await prisma.expertRequest.create({
    data: {
      userId: user2.id,
      type: 'TAX',
      description: 'Планирую перейти на патентную систему. Сколько будет стоить патент для сдачи 2 квартир в СПб?',
      status: 'NEW',
      priority: 'MEDIUM',
    },
  })
  console.log(`✅ Создан запрос к налоговому консультанту (ID: ${expertRequest2.id})`)

  const expertRequest3 = await prisma.expertRequest.create({
    data: {
      userId: user1.id,
      type: 'ACCOUNTANT',
      description: 'Нужна консультация по заполнению декларации 3-НДФЛ за прошлый год',
      status: 'CLOSED',
      priority: 'LOW',
      closedAt: new Date(),
    },
  })
  console.log(`✅ Создан закрытый запрос к бухгалтеру (ID: ${expertRequest3.id})`)

  // ===========================================================================
  // 7. Создание записей в чёрном списке
  // ===========================================================================
  console.log('⚠️ Создание записей в чёрном списке...')

  const badTenant1 = await prisma.badTenant.create({
    data: {
      userId: user1.id,
      fullName: 'Николай Васильевич Козлов',
      passportData: 'a1b2c3d4e5f6', // Хешированное значение
      reason: 'Не платил аренду 4 месяца, пришлось выселять через суд. Повредил дверь и сантехнику.',
      evidenceDescription: 'Судебное решение, фото повреждений, переписка',
      contractDate: new Date('2023-01-15'),
    },
  })
  console.log(`✅ Создана запись в чёрном списке: ${badTenant1.fullName} (ID: ${badTenant1.id})`)

  const badTenant2 = await prisma.badTenant.create({
    data: {
      userId: user2.id,
      fullName: 'Ольга Петровна Новикова',
      reason: 'Съехала ночью, не предупредив. Оставила долг за коммунальные услуги.',
      evidenceDescription: 'Договор, квитанции за коммуналку',
      contractDate: new Date('2023-06-01'),
    },
  })
  console.log(`✅ Создана запись в чёрном списке: ${badTenant2.fullName} (ID: ${badTenant2.id})`)

  // ===========================================================================
  // 8. Создание инвентаризации
  // ===========================================================================
  console.log('📦 Создание инвентаризации...')

  const inventory1 = await prisma.inventoryItem.create({
    data: {
      contractId: contract1.id,
      name: 'Холодильник LG',
      quantity: 1,
      condition: 'EXCELLENT',
      description: 'Двухкамерный, серебристый, 2022 г.в.',
    },
  })
  console.log(`✅ Создан пункт инвентаризации: ${inventory1.name} (ID: ${inventory1.id})`)

  const inventory2 = await prisma.inventoryItem.create({
    data: {
      contractId: contract1.id,
      name: 'Стиральная машина Samsung',
      quantity: 1,
      condition: 'GOOD',
      description: 'Фронтальная загрузка, 6 кг',
    },
  })
  console.log(`✅ Создан пункт инвентаризации: ${inventory2.name} (ID: ${inventory2.id})`)

  const inventory3 = await prisma.inventoryItem.create({
    data: {
      contractId: contract1.id,
      name: 'Кухонный гарнитур',
      quantity: 1,
      condition: 'FAIR',
      description: 'Столешница с небольшими царапинами',
    },
  })
  console.log(`✅ Создан пункт инвентаризации: ${inventory3.name} (ID: ${inventory3.id})`)

  const inventory4 = await prisma.inventoryItem.create({
    data: {
      contractId: contract2.id,
      name: 'Офисный стол',
      quantity: 4,
      condition: 'GOOD',
      description: 'Письменные столы 160x80 см',
    },
  })
  console.log(`✅ Создан пункт инвентаризации: ${inventory4.name} x${inventory4.quantity} (ID: ${inventory4.id})`)

  const inventory5 = await prisma.inventoryItem.create({
    data: {
      contractId: contract2.id,
      name: 'Офисное кресло',
      quantity: 4,
      condition: 'EXCELLENT',
      description: 'Эргономичные кресла с подлокотниками',
    },
  })
  console.log(`✅ Создан пункт инвентаризации: ${inventory5.name} x${inventory5.quantity} (ID: ${inventory5.id})`)

  // ===========================================================================
  // Итоги
  // ===========================================================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ База данных успешно заполнена тестовыми данными!')
  console.log('='.repeat(60))
  console.log(`👤 Пользователей: 2`)
  console.log(`🏠 Объектов недвижимости: 3`)
  console.log(`📄 Договоров аренды: 2`)
  console.log(`💰 Платежей: 5`)
  console.log(`📋 Шаблонов документов: 4`)
  console.log(`🎓 Запросов к экспертам: 3`)
  console.log(`⚠️ Записей в чёрном списке: 2`)
  console.log(`📦 Пунктов инвентаризации: 5`)
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
