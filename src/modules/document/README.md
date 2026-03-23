# Модуль генерации документов RentierGuard

Модуль для генерации юридических документов аренды в форматах DOCX и PDF.

## 📁 Структура модуля

```
src/modules/document/
├── types.ts                      # Типы и интерфейсы
├── index.ts                      # Главный экспорт
├── services/
│   ├── docxGenerator.service.ts  # Генерация DOCX
│   ├── pdfGenerator.service.ts   # Генерация PDF
│   └── template.service.ts       # Работа с шаблонами
├── scenes/
│   └── exportYear.scene.ts       # Сцена экспорта за год
└── templates/
    └── messages.ts               # Сообщения бота

assets/templates/
├── contract_residential.docx.md  # Описание шаблона договора
├── act_transfer.docx.md          # Описание шаблона акта
└── addendum.docx.md              # Описание шаблона допсоглашения
```

## 📦 Установка зависимостей

```bash
npm install docx-templates puppeteer
```

## 🚀 Быстрый старт

### Генерация договора аренды

```typescript
import { DocumentFactory, DocumentType, ExportFormat } from './modules/document';

const data = {
  documentType: DocumentType.RESIDENTIAL_CONTRACT,
  landlord: {
    fullName: 'Иванов Иван Иванович',
    passportSeries: '4515',
    passportNumber: '123456',
    passportIssuedBy: 'ОВД района Арбат г. Москвы',
    passportIssueDate: '15.03.2015',
    passportDepartmentCode: '770-064',
    registrationAddress: 'г. Москва, ул. Ленина, д. 1',
    phone: '+7 (999) 123-45-67',
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
  },
  property: {
    address: 'г. Москва, ул. Арбат, д. 5, кв. 10',
    cadastralNumber: '77:01:0001234:5678',
    propertyType: 'квартира',
    totalArea: 45.5,
    roomsCount: 2,
    floor: 5,
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

// Генерация DOCX
const docxDocument = await DocumentFactory.generate(data, ExportFormat.DOCX);

// Генерация PDF
const pdfDocument = await DocumentFactory.generate(data, ExportFormat.PDF);

// Отправка в Telegram
await ctx.replyWithDocument({
  source: docxDocument.buffer,
  filename: docxDocument.filename,
});
```

### Использование сервисов напрямую

```typescript
import { docxGenerator, pdfGenerator, templateService } from './modules/document';

// Генерация DOCX
const templatePath = templateService.getTemplatePath(DocumentType.RESIDENTIAL_CONTRACT);
const document = await docxGenerator.generateContract(data, templatePath);

// Генерация PDF
const pdfDocument = await pdfGenerator.generateContractPDF(data);

// Валидация данных
const validation = templateService.validateTemplateData(data);
if (!validation.valid) {
  console.log(templateService.formatValidationErrors(validation));
}
```

## 📋 Поддерживаемые документы

| Тип | DOCX | PDF | Описание |
|-----|------|-----|----------|
| Договор аренды жилого | ✅ | ✅ | Стандартный договор квартиры/дома |
| Договор аренды коммерческого | ✅ | ✅ | Офис, магазин, склад |
| Акт приема-передачи | ✅ | ✅ | Передача объекта арендатору |
| Акт возврата | ✅ | ✅ | Возврат объекта арендодателю |
| Дополнительное соглашение | ✅ | ✅ | Изменение условий договора |
| Претензия | ✅ | ✅ | Требования к арендатору |
| Квитанция | ✅ | ✅ | Подтверждение оплаты |

## 📝 Переменные шаблонов

### Договор аренды

```
{{contractNumber}} - Номер договора
{{contractDate}} - Дата договора
{{landlordName}} - ФИО арендодателя
{{landlordPassport}} - Паспорт арендодателя
{{tenantName}} - ФИО арендатора
{{tenantPassport}} - Паспорт арендатора
{{propertyAddress}} - Адрес объекта
{{propertyCadastral}} - Кадастровый номер
{{startDate}} - Дата начала
{{endDate}} - Дата окончания
{{monthlyRent}} - Аренда (число)
{{monthlyRentWords}} - Аренда прописью
{{deposit}} - Залог (число)
{{depositWords}} - Залог прописью
{{currentDate}} - Текущая дата
```

### Акт приема-передачи

```
{{contractNumber}} - Номер договора
{{contractDate}} - Дата договора
{{propertyAddress}} - Адрес объекта
{{inventoryTable}} - Таблица инвентаря
{{landlordName}} - ФИО арендодателя
{{tenantName}} - ФИО арендатора
{{currentDate}} - Текущая дата
{{transferDate}} - Дата передачи
```

### Дополнительное соглашение

```
{{contractNumber}} - Номер договора
{{contractDate}} - Дата договора
{{changeType}} - Тип изменения
{{oldValue}} - Старое значение
{{newValue}} - Новое значение
{{changeReason}} - Причина изменения
{{currentDate}} - Текущая дата
```

## 🔧 Настройка шаблонов

1. Создайте DOCX файл в Microsoft Word или LibreOffice Writer
2. Разместите переменные в формате `{{variableName}}`
3. Сохраните файл в `assets/templates/`
4. Используйте `templateService.getTemplateVariables()` для проверки переменных

## 🌐 Работа с русским языком

Модуль полностью поддерживает русский язык:
- UTF-8 кодировка во всех документах
- Корректное отображение в PDF через puppeteer
- Числа прописью (суммы, даты)
- Склонения (рубль/рубля/рублей)

## 📤 Отправка в Telegram

```typescript
// Отправка DOCX
await ctx.replyWithDocument({
  source: document.buffer,
  filename: document.filename,
}, {
  caption: 'Ваш договор готов!'
});

// Отправка как файл
await bot.telegram.sendDocument(chatId, {
  source: document.buffer,
  filename: document.filename,
});
```

## ⚠️ Обработка ошибок

```typescript
try {
  const document = await DocumentFactory.generate(data, ExportFormat.DOCX);
} catch (error) {
  if (error.message.includes('валидации')) {
    // Ошибка валидации данных
    await ctx.reply('Проверьте введенные данные: ' + error.message);
  } else if (error.message.includes('шаблон')) {
    // Ошибка шаблона
    await ctx.reply('Шаблон не найден. Обратитесь к администратору.');
  } else {
    // Прочие ошибки
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
}
```

## 📊 Экспорт за год

```typescript
import { exportYearScene } from './modules/document';

// Регистрация сцены
const stage = new Scenes.Stage([exportYearScene]);
bot.use(stage.middleware());

// Команда
bot.command('export_year', (ctx) => ctx.scene.enter('export_year'));
```

## 🧪 Тестирование

```typescript
// Пример данных для тестирования
import { templateService } from './modules/document';

const exampleData = templateService.getExampleData(DocumentType.RESIDENTIAL_CONTRACT);
console.log(exampleData);
```

## 📚 Дополнительная информация

- [docx-templates документация](https://github.com/guigrpa/docx-templates)
- [Puppeteer документация](https://pptr.dev/)
- [Telegraf документация](https://telegraf.js.org/)
