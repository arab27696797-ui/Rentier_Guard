/**
 * ============================================
 * RentierGuard - Примеры использования модуля документов
 * ============================================
 */

import {
  DocumentFactory,
  DocumentType,
  ExportFormat,
  docxGenerator,
  pdfGenerator,
  templateService,
  documentMessages,
  DocumentGenerationData,
} from './index';

/**
 * Пример 1: Генерация договора аренды через фабрику
 */
export async function example1_GenerateContractViaFactory() {
  const data: DocumentGenerationData = {
    documentType: DocumentType.RESIDENTIAL_CONTRACT,
    contractNumber: '123',
    contractDate: '01.01.2024',
    landlord: {
      fullName: 'Иванов Иван Иванович',
      passportSeries: '4515',
      passportNumber: '123456',
      passportIssuedBy: 'ОВД района Арбат г. Москвы',
      passportIssueDate: '15.03.2015',
      passportDepartmentCode: '770-064',
      registrationAddress: 'г. Москва, ул. Ленина, д. 1, кв. 10',
      phone: '+7 (999) 123-45-67',
      email: 'landlord@example.com',
    },
    tenant: {
      fullName: 'Петров Петр Петрович',
      passportSeries: '4515',
      passportNumber: '654321',
      passportIssuedBy: 'ОВД Центрального района г. СПб',
      passportIssueDate: '20.05.2018',
      passportDepartmentCode: '780-024',
      registrationAddress: 'г. Санкт-Петербург, ул. Пушкина, д. 10',
      phone: '+7 (999) 987-65-43',
      email: 'tenant@example.com',
    },
    property: {
      address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
      cadastralNumber: '77:01:0001234:5678',
      propertyType: 'квартира',
      totalArea: 45.5,
      livingArea: 30.0,
      roomsCount: 2,
      floor: 5,
      totalFloors: 9,
      description: 'С мебелью и бытовой техникой',
    },
    terms: {
      startDate: '01.02.2024',
      endDate: '01.02.2025',
      monthlyRent: 50000,
      deposit: 50000,
      paymentDay: 5,
      paymentMethod: 'банковский перевод',
      utilitiesIncluded: false,
      utilitiesAmount: 5000,
      maxOccupants: 3,
      petsAllowed: false,
      additionalTerms: 'Курение в помещении запрещено',
    },
  };

  try {
    // Валидация данных
    const validation = templateService.validateTemplateData(data);
    if (!validation.valid) {
      console.log('Ошибки валидации:', templateService.formatValidationErrors(validation));
      return;
    }

    // Генерация DOCX
    const docxDoc = await DocumentFactory.generateContract(data, ExportFormat.DOCX);
    console.log('DOCX сгенерирован:', docxDoc.filename, `(${docxDoc.size} байт)`);

    // Генерация PDF
    const pdfDoc = await DocumentFactory.generateContract(data, ExportFormat.PDF);
    console.log('PDF сгенерирован:', pdfDoc.filename, `(${pdfDoc.size} байт)`);

    return { docx: docxDoc, pdf: pdfDoc };
  } catch (error) {
    console.error('Ошибка генерации:', error);
  }
}

/**
 * Пример 2: Генерация акта приема-передачи с инвентарем
 */
export async function example2_GenerateActWithInventory() {
  const data: DocumentGenerationData = {
    documentType: DocumentType.ACT_TRANSFER,
    contractNumber: '123',
    contractDate: '01.01.2024',
    landlord: {
      fullName: 'Иванов Иван Иванович',
      passportSeries: '4515',
      passportNumber: '123456',
      passportIssuedBy: 'ОВД района Арбат',
      passportIssueDate: '15.03.2015',
      passportDepartmentCode: '770-064',
      registrationAddress: 'г. Москва, ул. Ленина, д. 1',
      phone: '+7 (999) 123-45-67',
    },
    tenant: {
      fullName: 'Петров Петр Петрович',
      passportSeries: '4515',
      passportNumber: '654321',
      passportIssuedBy: 'ОВД Центрального района',
      passportIssueDate: '20.05.2018',
      passportDepartmentCode: '780-024',
      registrationAddress: 'г. СПб, ул. Пушкина, д. 10',
      phone: '+7 (999) 987-65-43',
    },
    property: {
      address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
      propertyType: 'квартира',
      totalArea: 45.5,
    },
    terms: {
      startDate: '01.02.2024',
      endDate: '01.02.2025',
      monthlyRent: 50000,
      deposit: 50000,
      paymentDay: 5,
      paymentMethod: 'банковский перевод',
      utilitiesIncluded: false,
    },
    inventory: [
      { name: 'Холодильник Samsung', quantity: 1, condition: 'новое', description: '2023 г.в.' },
      { name: 'Стиральная машина LG', quantity: 1, condition: 'хорошее', description: 'Работает исправно' },
      { name: 'Микроволновая печь', quantity: 1, condition: 'новое', description: '-' },
      { name: 'Телевизор Sony', quantity: 1, condition: 'хорошее', description: '42 дюйма' },
      { name: 'Диван', quantity: 1, condition: 'удовлетворительное', description: 'Есть потертости' },
    ],
  };

  try {
    const templatePath = templateService.getTemplatePath(DocumentType.ACT_TRANSFER);
    const act = await docxGenerator.generateAct(data, templatePath);
    console.log('Акт сгенерирован:', act.filename, `(${act.size} байт)`);
    return act;
  } catch (error) {
    console.error('Ошибка генерации акта:', error);
  }
}

/**
 * Пример 3: Генерация дополнительного соглашения
 */
export async function example3_GenerateAddendum() {
  const data: DocumentGenerationData = {
    documentType: DocumentType.ADDENDUM,
    contractNumber: '123',
    contractDate: '01.01.2024',
    landlord: {
      fullName: 'Иванов Иван Иванович',
      passportSeries: '4515',
      passportNumber: '123456',
      passportIssuedBy: 'ОВД района Арбат',
      passportIssueDate: '15.03.2015',
      passportDepartmentCode: '770-064',
      registrationAddress: 'г. Москва, ул. Ленина, д. 1',
      phone: '+7 (999) 123-45-67',
    },
    tenant: {
      fullName: 'Петров Петр Петрович',
      passportSeries: '4515',
      passportNumber: '654321',
      passportIssuedBy: 'ОВД Центрального района',
      passportIssueDate: '20.05.2018',
      passportDepartmentCode: '780-024',
      registrationAddress: 'г. СПб, ул. Пушкина, д. 10',
      phone: '+7 (999) 987-65-43',
    },
    property: {
      address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
      propertyType: 'квартира',
      totalArea: 45.5,
    },
    terms: {
      startDate: '01.02.2024',
      endDate: '01.02.2025',
      monthlyRent: 50000,
      deposit: 50000,
      paymentDay: 5,
      paymentMethod: 'банковский перевод',
      utilitiesIncluded: false,
    },
    addendumData: {
      changeType: 'изменение арендной платы',
      oldValue: '50 000 (пятьдесят тысяч) рублей',
      newValue: '55 000 (пятьдесят пять тысяч) рублей',
      reason: 'индексация согласно уровню инфляции',
    },
  };

  try {
    const templatePath = templateService.getTemplatePath(DocumentType.ADDENDUM);
    const addendum = await docxGenerator.generateAddendum(data, templatePath);
    console.log('Допсоглашение сгенерировано:', addendum.filename, `(${addendum.size} байт)`);
    return addendum;
  } catch (error) {
    console.error('Ошибка генерации допсоглашения:', error);
  }
}

/**
 * Пример 4: Генерация претензии
 */
export async function example4_GenerateClaim() {
  const data: DocumentGenerationData = {
    documentType: DocumentType.CLAIM,
    contractNumber: '123',
    contractDate: '01.01.2024',
    landlord: {
      fullName: 'Иванов Иван Иванович',
      passportSeries: '4515',
      passportNumber: '123456',
      passportIssuedBy: 'ОВД района Арбат',
      passportIssueDate: '15.03.2015',
      passportDepartmentCode: '770-064',
      registrationAddress: 'г. Москва, ул. Ленина, д. 1',
      phone: '+7 (999) 123-45-67',
    },
    tenant: {
      fullName: 'Петров Петр Петрович',
      passportSeries: '4515',
      passportNumber: '654321',
      passportIssuedBy: 'ОВД Центрального района',
      passportIssueDate: '20.05.2018',
      passportDepartmentCode: '780-024',
      registrationAddress: 'г. СПб, ул. Пушкина, д. 10',
      phone: '+7 (999) 987-65-43',
    },
    property: {
      address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
      propertyType: 'квартира',
      totalArea: 45.5,
    },
    terms: {
      startDate: '01.02.2024',
      endDate: '01.02.2025',
      monthlyRent: 50000,
      deposit: 50000,
      paymentDay: 5,
      paymentMethod: 'банковский перевод',
      utilitiesIncluded: false,
    },
    claimData: {
      violationType: 'просрочка оплаты аренды',
      violationDescription: 'Арендная плата за январь 2024 года в размере 50 000 рублей не оплачена в установленный срок (5-е число месяца). На текущую дату задолженность составляет 15 дней.',
      deadlineDays: 10,
      claimAmount: 5000,
    },
  };

  try {
    // Генерация PDF (для претензии лучше PDF)
    const claim = await pdfGenerator.generateClaimPDF(data);
    console.log('Претензия сгенерирована:', claim.filename, `(${claim.size} байт)`);
    return claim;
  } catch (error) {
    console.error('Ошибка генерации претензии:', error);
  }
}

/**
 * Пример 5: Генерация квитанции
 */
export async function example5_GenerateReceipt() {
  const data: DocumentGenerationData = {
    documentType: DocumentType.RECEIPT,
    landlord: {
      fullName: 'Иванов Иван Иванович',
      passportSeries: '4515',
      passportNumber: '123456',
      passportIssuedBy: 'ОВД района Арбат',
      passportIssueDate: '15.03.2015',
      passportDepartmentCode: '770-064',
      registrationAddress: 'г. Москва, ул. Ленина, д. 1',
      phone: '+7 (999) 123-45-67',
    },
    tenant: {
      fullName: 'Петров Петр Петрович',
      passportSeries: '4515',
      passportNumber: '654321',
      passportIssuedBy: 'ОВД Центрального района',
      passportIssueDate: '20.05.2018',
      passportDepartmentCode: '780-024',
      registrationAddress: 'г. СПб, ул. Пушкина, д. 10',
      phone: '+7 (999) 987-65-43',
    },
    property: {
      address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
      propertyType: 'квартира',
      totalArea: 45.5,
    },
    terms: {
      startDate: '01.02.2024',
      endDate: '01.02.2025',
      monthlyRent: 50000,
      deposit: 50000,
      paymentDay: 5,
      paymentMethod: 'банковский перевод',
      utilitiesIncluded: false,
    },
  };

  try {
    const receipt = await pdfGenerator.generateReceiptPDF(data);
    console.log('Квитанция сгенерирована:', receipt.filename, `(${receipt.size} байт)`);
    return receipt;
  } catch (error) {
    console.error('Ошибка генерации квитанции:', error);
  }
}

/**
 * Пример 6: Работа с шаблонами
 */
export function example6_TemplateOperations() {
  // Получить список всех шаблонов
  const templates = templateService.getAllTemplates();
  console.log('Доступные шаблоны:');
  templates.forEach(t => {
    console.log(`- ${t.name} (${t.type}): ${t.description}`);
  });

  // Получить переменные для шаблона
  const variables = templateService.getTemplateVariables(DocumentType.RESIDENTIAL_CONTRACT);
  console.log('\nПеременные договора:');
  variables.forEach(v => {
    console.log(`- ${v.name} (${v.required ? 'обязательное' : 'опциональное'}): ${v.description}`);
  });

  // Получить пример данных
  const example = templateService.getExampleData(DocumentType.RESIDENTIAL_CONTRACT);
  console.log('\nПример данных:', JSON.stringify(example, null, 2));

  // Проверить существование шаблона
  templateService.templateExists(DocumentType.RESIDENTIAL_CONTRACT).then(exists => {
    console.log('\nШаблон договора существует:', exists);
  });
}

/**
 * Пример 7: Отправка документа в Telegram
 */
export async function example7_SendToTelegram(ctx: any, document: { buffer: Buffer; filename: string }) {
  try {
    await ctx.replyWithDocument(
      { source: document.buffer, filename: document.filename },
      { caption: '✅ Ваш документ готов!' }
    );
    console.log('Документ отправлен');
  } catch (error) {
    console.error('Ошибка отправки:', error);
  }
}

/**
 * Пример 8: Генерация HTML и конвертация в PDF
 */
export async function example8_HTMLToPDF() {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчет</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Отчет по аренде</h1>
  <p>Период: январь 2024</p>
  <table>
    <tr><th>Объект</th><th>Арендатор</th><th>Сумма</th></tr>
    <tr><td>ул. Ленина 1</td><td>Иванов</td><td>50 000</td></tr>
    <tr><td>ул. Арбат 5</td><td>Петров</td><td>60 000</td></tr>
  </table>
</body>
</html>
  `;

  try {
    const pdf = await pdfGenerator.generateFromHTML(html, {
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    console.log('PDF из HTML сгенерирован:', pdf.filename, `(${pdf.size} байт)`);
    return pdf;
  } catch (error) {
    console.error('Ошибка генерации:', error);
  }
}

/**
 * Запуск всех примеров
 */
export async function runAllExamples() {
  console.log('=== Пример 1: Генерация договора ===');
  await example1_GenerateContractViaFactory();

  console.log('\n=== Пример 2: Генерация акта ===');
  await example2_GenerateActWithInventory();

  console.log('\n=== Пример 3: Генерация допсоглашения ===');
  await example3_GenerateAddendum();

  console.log('\n=== Пример 4: Генерация претензии ===');
  await example4_GenerateClaim();

  console.log('\n=== Пример 5: Генерация квитанции ===');
  await example5_GenerateReceipt();

  console.log('\n=== Пример 6: Работа с шаблонами ===');
  example6_TemplateOperations();

  console.log('\n=== Пример 8: HTML to PDF ===');
  await example8_HTMLToPDF();

  // Закрываем браузер puppeteer
  await pdfGenerator.closeBrowser();
}

// Если файл запущен напрямую
if (require.main === module) {
  runAllExamples().then(() => {
    console.log('\n✅ Все примеры выполнены');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
}
