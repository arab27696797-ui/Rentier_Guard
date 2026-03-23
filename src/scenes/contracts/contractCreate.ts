/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Создание договора
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const contractCreateScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'contract-create',
  async (ctx) => {
    await ctx.reply('📄 <b>Создание договора аренды</b>\n\nВыберите объект:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Договор создан!');
    return ctx.scene.leave();
  }
);
