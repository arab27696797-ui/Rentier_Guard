/**
 * ============================================
 * RentierGuard - Сервис генерации PDF документов
 * Использует библиотеку puppeteer
 * ============================================
 */

import puppeteer from 'puppeteer';
import { Buffer } from 'buffer';
import {
  DocumentGenerationData,
  GeneratedDocument,
  PDFGenerationOptions,
  DocumentType,
} from '../types';

/**
 * Сервис генерации PDF документов
 */
export class PDFGeneratorService {
  private browser: puppeteer.Browser | null = null;

  /**
   * Инициализирует браузер puppeteer
   */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Закрывает браузер
   */
  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Генерирует PDF из HTML
   * @param html - HTML содержимое
   * @param options - Опции генерации
   * @returns Buffer с PDF документом
   */
  public async generateFromHTML(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<GeneratedDocument> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Установка HTML содержимого
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000,
      });

      // Ожидание загрузки шрифтов
      await page.evaluateHandle('document.fonts.ready');

      // Генерация PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        margin: {
          top: options.margin?.top || '20mm',
          right: options.margin?.right || '15mm',
          bottom: options.margin?.bottom || '20mm',
          left: options.margin?.left || '15mm',
        },
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        preferCSSPageSize: true,
      });

      await page.close();

      return {
        buffer: pdfBuffer,
        filename: `document_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        extension: 'pdf',
      };
    } catch (error) {
      throw this.handleError('Ошибка генерации PDF из HTML', error);
    }
  }

  /**
   * Генерирует договор аренды в PDF
   * @param data - Данные для генерации
   * @returns Buffer с PDF документом
   */
  public async generateContractPDF(
    data: DocumentGenerationData
  ): Promise<GeneratedDocument> {
    try {
      const html = this.buildContractHTML(data);
      const result = await this.generateFromHTML(html, {
        format: 'A4',
        margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
      });

      result.filename = this.generateFilename('dogovor_arendy', data);
      return result;
    } catch (error) {
      throw this.handleError('Ошибка генерации договора в PDF', error);
    }
  }

  /**
   * Генерирует акт приема-передачи в PDF
   * @param data - Данные для генерации
   * @param isReturn - Флаг акта возврата
   * @returns Buffer с PDF документом
   */
  public async generateActPDF(
    data: DocumentGenerationData,
    isReturn: boolean = false
  ): Promise<GeneratedDocument> {
    try {
      const html = this.buildActHTML(data, isReturn);
      const result = await this.generateFromHTML(html, {
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });

      const prefix = isReturn ? 'akt_vozvrata' : 'akt_priema_peredachi';
      result.filename = this.generateFilename(prefix, data);
      return result;
    } catch (error) {
      throw this.handleError('Ошибка генерации акта в PDF', error);
    }
  }

  /**
   * Генерирует квитанцию в PDF
   * @param data - Данные для генерации
   * @returns Buffer с PDF документом
   */
  public async generateReceiptPDF(
    data: DocumentGenerationData
  ): Promise<GeneratedDocument> {
    try {
      const html = this.buildReceiptHTML(data);
      const result = await this.generateFromHTML(html, {
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });

      result.filename = this.generateFilename('kvitanciya', data);
      return result;
    } catch (error) {
      throw this.handleError('Ошибка генерации квитанции в PDF', error);
    }
  }

  /**
   * Генерирует претензию в PDF
   * @param data - Данные для генерации
   * @returns Buffer с PDF документом
   */
  public async generateClaimPDF(
    data: DocumentGenerationData
  ): Promise<GeneratedDocument> {
    try {
      const html = this.buildClaimHTML(data);
      const result = await this.generateFromHTML(html, {
        format: 'A4',
        margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
      });

      result.filename = this.generateFilename('pretenziya', data);
      return result;
    } catch (error) {
      throw this.handleError('Ошибка генерации претензии в PDF', error);
    }
  }

  /**
   * Строит HTML для договора аренды
   */
  private buildContractHTML(data: DocumentGenerationData): string {
    const { landlord, tenant, property, terms } = data;
    const currentDate = new Date();

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Договор аренды</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 100%;
    }
    .title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    .subtitle {
      text-align: center;
      font-size: 12pt;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-weight: bold;
      text-align: center;
      margin: 20px 0 10px 0;
    }
    .parties {
      margin-bottom: 20px;
    }
    .party {
      margin-bottom: 15px;
      text-align: justify;
    }
    .terms {
      margin: 15px 0;
    }
    .signature-block {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 30px;
      padding-top: 5px;
      font-size: 10pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="title">Договор аренды ${property.propertyType}</div>
  <div class="subtitle">
    № ${data.contractNumber || 'б/н'} от ${data.contractDate || this.formatDate(currentDate)}
  </div>

  <div class="parties">
    <div class="party">
      <strong>Арендодатель:</strong> ${landlord.fullName}, 
      паспорт серия ${landlord.passportSeries} № ${landlord.passportNumber}, 
      выдан ${landlord.passportIssuedBy}, 
      дата выдачи ${landlord.passportIssueDate}, 
      код подразделения ${landlord.passportDepartmentCode},
      зарегистрирован по адресу: ${landlord.registrationAddress},
      телефон: ${landlord.phone}
      ${landlord.email ? `, email: ${landlord.email}` : ''}
    </div>

    <div class="party">
      <strong>Арендатор:</strong> ${tenant.fullName}, 
      паспорт серия ${tenant.passportSeries} № ${tenant.passportNumber}, 
      выдан ${tenant.passportIssuedBy}, 
      дата выдачи ${tenant.passportIssueDate}, 
      код подразделения ${tenant.passportDepartmentCode},
      зарегистрирован по адресу: ${tenant.registrationAddress},
      телефон: ${tenant.phone}
      ${tenant.email ? `, email: ${tenant.email}` : ''}
    </div>
  </div>

  <div class="section">
    совместно именуемые "Стороны", заключили настоящий Договор о нижеследующем:
  </div>

  <div class="section-title">1. ПРЕДМЕТ ДОГОВОРА</div>
  <div class="section">
    1.1. Арендодатель предоставляет Арендатору во временное владение и пользование 
    ${property.propertyType} (далее - "Помещение"), расположенное по адресу: 
    <strong>${property.address}</strong>
    ${property.cadastralNumber ? `, кадастровый номер: ${property.cadastralNumber}` : ''}.
  </div>
  <div class="section">
    1.2. Общая площадь Помещения составляет <strong>${property.totalArea} кв.м.</strong>
    ${property.livingArea ? `, жилая площадь: ${property.livingArea} кв.м.` : ''}
    ${property.roomsCount ? `, количество комнат: ${property.roomsCount}` : ''}.
  </div>

  <div class="section-title">2. СРОК ДЕЙСТВИЯ ДОГОВОРА</div>
  <div class="section">
    2.1. Настоящий Договор заключен сроком на <strong>${this.calculateMonths(terms.startDate, terms.endDate)}</strong> 
    и вступает в силу с <strong>${terms.startDate}</strong> по <strong>${terms.endDate}</strong>.
  </div>
  <div class="section">
    2.2. По истечении срока действия Договора Арендатор обязан освободить и передать 
    Арендодателю Помещение в состоянии, соответствующем условиям настоящего Договора.
  </div>

  <div class="section-title">3. АРЕНДНАЯ ПЛАТА И ПОРЯДОК РАСЧЕТОВ</div>
  <div class="section">
    3.1. Арендная плата составляет <strong>${this.formatCurrency(terms.monthlyRent)}</strong> 
    (${this.numberToWords(terms.monthlyRent)}) в месяц.
  </div>
  <div class="section">
    3.2. Арендная плата вносится <strong>${terms.paymentDay}-го числа</strong> каждого месяца 
    способом: <strong>${terms.paymentMethod}</strong>.
  </div>
  <div class="section">
    3.3. В качестве обеспечения исполнения обязательств Арендатор вносит залог 
    в размере <strong>${this.formatCurrency(terms.deposit)}</strong> (${this.numberToWords(terms.deposit)}).
  </div>
  <div class="section">
    3.4. Коммунальные услуги ${terms.utilitiesIncluded ? 'включены' : 'не включены'} в арендную плату.
    ${terms.utilitiesAmount && !terms.utilitiesIncluded ? `Оплачиваются отдельно в размере ${this.formatCurrency(terms.utilitiesAmount)}.` : ''}
  </div>

  <div class="section-title">4. ПРАВА И ОБЯЗАННОСТИ СТОРОН</div>
  <div class="section">
    4.1. Арендатор обязуется:
    <ul>
      <li>Своевременно вносить арендную плату;</li>
      <li>Содержать Помещение в чистоте и надлежащем состоянии;</li>
      <li>Не производить перепланировку без согласия Арендодателя;</li>
      <li>Не сдавать Помещение в субаренду;</li>
      ${terms.petsAllowed ? '<li>Содержать домашних животных с соблюдением санитарных норм;</li>' : '<li>Не содержать домашних животных;</li>'}
    </ul>
  </div>

  ${terms.additionalTerms ? `
  <div class="section-title">5. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</div>
  <div class="section">${terms.additionalTerms}</div>
  ` : ''}

  <div class="section-title">6. ПОДПИСИ СТОРОН</div>
  <div class="signature-block">
    <div class="signature">
      <strong>Арендодатель:</strong>
      <div class="signature-line">${landlord.fullName} / _________________</div>
    </div>
    <div class="signature">
      <strong>Арендатор:</strong>
      <div class="signature-line">${tenant.fullName} / _________________</div>
    </div>
  </div>

  <div class="section" style="margin-top: 30px; font-size: 10pt;">
    Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу.
  </div>
</body>
</html>`;
  }

  /**
   * Строит HTML для акта приема-передачи
   */
  private buildActHTML(data: DocumentGenerationData, isReturn: boolean = false): string {
    const { landlord, tenant, property } = data;
    const currentDate = new Date();
    const actType = isReturn ? 'возврата' : 'приема-передачи';

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Акт ${actType}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 15px;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f0f0f0;
    }
    .signature-block {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      width: 45%;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 30px;
      padding-top: 5px;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <div class="title">Акт ${actType} ${property.propertyType}</div>

  <div class="section">
    Настоящий акт составлен "${currentDate.getDate()}" ${this.getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()} г.
    между:
  </div>

  <div class="section">
    <strong>Арендодателем:</strong> ${landlord.fullName}, 
    паспорт: ${landlord.passportSeries} ${landlord.passportNumber}
  </div>

  <div class="section">
    <strong>и Арендатором:</strong> ${tenant.fullName}, 
    паспорт: ${tenant.passportSeries} ${tenant.passportNumber}
  </div>

  <div class="section">
    к Договору аренды № ${data.contractNumber || 'б/н'} 
    от ${data.contractDate || '___'} г.
  </div>

  <div class="section">
    Мы, нижеподписавшиеся, составили настоящий акт о том, что ${isReturn ? 'возвращено' : 'передано'} 
    ${property.propertyType}, расположенное по адресу: <strong>${property.address}</strong>
    ${property.cadastralNumber ? `, кадастровый номер: ${property.cadastralNumber}` : ''}.
  </div>

  ${data.inventory && data.inventory.length > 0 ? `
  <div class="section">
    <strong>Перечень имущества и его состояние:</strong>
  </div>
  <table>
    <thead>
      <tr>
        <th>№</th>
        <th>Наименование</th>
        <th>Кол-во</th>
        <th>Состояние</th>
        <th>Примечание</th>
      </tr>
    </thead>
    <tbody>
      ${data.inventory.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.condition}</td>
          <td>${item.description || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<div class="section">Имущество отсутствует.</div>'}

  <div class="section">
    ${isReturn 
      ? 'Помещение возвращено в состоянии, соответствующем условиям договора. Залог подлежит возврату.'
      : 'Помещение и имущество получены в надлежащем состоянии. Залог получен.'
    }
  </div>

  <div class="section">
    Стороны претензий друг к другу не имеют.
  </div>

  <div class="signature-block">
    <div class="signature">
      <strong>Арендодатель:</strong>
      <div class="signature-line">${landlord.fullName} / _________________</div>
    </div>
    <div class="signature">
      <strong>Арендатор:</strong>
      <div class="signature-line">${tenant.fullName} / _________________</div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Строит HTML для квитанции
   */
  private buildReceiptHTML(data: DocumentGenerationData): string {
    const { landlord, tenant, terms } = data;
    const currentDate = new Date();

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Квитанция об оплате</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border: 2px solid #000;
    }
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 20px;
      border-bottom: 1px solid #000;
      padding-bottom: 10px;
    }
    .receipt-number {
      text-align: right;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    .field {
      margin-bottom: 10px;
    }
    .field-label {
      font-weight: bold;
    }
    .amount {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      border: 1px solid #000;
    }
    .signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 150px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="title">КВИТАНЦИЯ ОБ ОПЛАТЕ</div>
  <div class="receipt-number">№ ${Date.now()} от ${this.formatDate(currentDate)}</div>

  <div class="field">
    <span class="field-label">Получатель:</span> ${landlord.fullName}
  </div>

  <div class="field">
    <span class="field-label">Плательщик:</span> ${tenant.fullName}
  </div>

  <div class="field">
    <span class="field-label">Назначение платежа:</span> 
    Арендная плата за ${this.getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()} г.
  </div>

  <div class="amount">
    Сумма: ${this.formatCurrency(terms.monthlyRent)}
    <br>
    <small>(${this.numberToWords(terms.monthlyRent)})</small>
  </div>

  <div class="signatures">
    <div class="signature">
      <div class="signature-line"></div>
      <small>Подпись получателя</small>
    </div>
    <div class="signature">
      <div class="signature-line"></div>
      <small>Подпись плательщика</small>
    </div>
  </div>

  <div style="margin-top: 20px; font-size: 10pt; text-align: center;">
    Квитанция действительна при наличии подписи получателя
  </div>
</body>
</html>`;
  }

  /**
   * Строит HTML для претензии
   */
  private buildClaimHTML(data: DocumentGenerationData): string {
    const { landlord, tenant, claimData, property } = data;
    const currentDate = new Date();

    if (!claimData) {
      throw new Error('Отсутствуют данные для претензии');
    }

    // Расчет даты дедлайна
    const deadlineDate = new Date(currentDate);
    deadlineDate.setDate(deadlineDate.getDate() + claimData.deadlineDays);

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Претензия</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      text-align: right;
      margin-bottom: 30px;
    }
    .title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 30px 0;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 15px;
      text-align: justify;
    }
    .demands {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #000;
      background-color: #f9f9f9;
    }
    .demands-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .signature {
      margin-top: 50px;
    }
    .signature-line {
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <strong>Адресат:</strong> ${tenant.fullName}<br>
    Адрес: ${tenant.registrationAddress}<br>
    Телефон: ${tenant.phone}
  </div>

  <div class="header" style="margin-top: 20px;">
    <strong>От:</strong> ${landlord.fullName}<br>
    Адрес: ${landlord.registrationAddress}<br>
    Телефон: ${landlord.phone}
  </div>

  <div class="title">ПРЕТЕНЗИЯ</div>

  <div class="section">
    Настоящим сообщаю, что в соответствии с Договором аренды 
    № ${data.contractNumber || 'б/н'} от ${data.contractDate || '___'} г., 
    заключенным в отношении ${property.propertyType}, расположенного по адресу: 
    ${property.address}, допущено нарушение условий договора.
  </div>

  <div class="section">
    <strong>Вид нарушения:</strong> ${claimData.violationType}
  </div>

  <div class="section">
    <strong>Описание нарушения:</strong><br>
    ${claimData.violationDescription}
  </div>

  <div class="demands">
    <div class="demands-title">ТРЕБОВАНИЯ:</div>
    <div class="section">
      1. Устранить вышеуказанное нарушение в течение 
      <strong>${claimData.deadlineDays} (${this.numberToWordsSmall(claimData.deadlineDays)}) календарных дней</strong> 
      с момента получения настоящей претензии (до ${this.formatDate(deadlineDate)}).
    </div>
    ${claimData.claimAmount ? `
    <div class="section">
      2. Выплатить неустойку в размере 
      <strong>${this.formatCurrency(claimData.claimAmount)}</strong>.
    </div>
    ` : ''}
  </div>

  <div class="section">
    В случае неисполнения настоящих требований в установленный срок, 
    я буду вынужден обратиться в суд с исковым заявлением о взыскании 
    причиненных убытков и неустойки в соответствии с законодательством РФ.
  </div>

  <div class="section">
    Прошу сообщить о результатах рассмотрения претензии в письменной форме.
  </div>

  <div class="signature">
    <div>Дата: ${this.formatDate(currentDate)}</div>
    <div class="signature-line">
      Подпись: _________________ / ${landlord.fullName}
    </div>
  </div>

  <div style="margin-top: 30px; font-size: 10pt;">
    <strong>Приложения:</strong>
    <ol>
      <li>Копия договора аренды</li>
      <li>Документы, подтверждающие нарушение</li>
    </ol>
  </div>
</body>
</html>`;
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Генерирует имя файла
   */
  private generateFilename(prefix: string, data: DocumentGenerationData): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const contractNum = data.contractNumber ? `_№${data.contractNumber}` : '';
    
    return `${prefix}${contractNum}_${dateStr}.pdf`;
  }

  /**
   * Форматирует дату
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Возвращает название месяца
   */
  private getMonthName(monthIndex: number): string {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    return months[monthIndex];
  }

  /**
   * Форматирует валюту
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  }

  /**
   * Вычисляет количество месяцев между датами
   */
  private calculateMonths(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return `${months} месяцев`;
  }

  /**
   * Число прописью (упрощенная версия для небольших чисел)
   */
  private numberToWordsSmall(num: number): string {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать'];
    
    if (num < 10) return units[num];
    if (num < 15) return teens[num - 10];
    return String(num);
  }

  /**
   * Число прописью (полная версия)
   */
  private numberToWords(num: number): string {
    // Упрощенная реализация
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 
                  'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    
    if (num === 0) return 'ноль рублей';
    
    const rubles = Math.floor(num);
    let result = '';
    
    const t = Math.floor(rubles / 10);
    const u = rubles % 10;
    
    if (t > 1) result += tens[t] + ' ';
    if (u > 0) result += units[u] + ' ';
    
    result += 'рублей';
    return result.trim();
  }

  /**
   * Обработка ошибок
   */
  private handleError(message: string, error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PDFGenerator] ${message}:`, errorMessage);
    return new Error(`${message}: ${errorMessage}`);
  }
}

// Экспорт singleton экземпляра
export const pdfGenerator = new PDFGeneratorService();
