/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Калькулятор налогов
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const taxCalculatorScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'tax-calculator',
  async (ctx) => {
    await ctx.reply('🧮 <b>Калькулятор налогов НПД</b>\n\nВведите сумму дохода:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Налог рассчитан!');
    return ctx.scene.leave();
  }
);
