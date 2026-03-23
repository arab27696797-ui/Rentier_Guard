/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Добавление объекта
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const propertyAddScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'property-add',
  async (ctx) => {
    await ctx.reply('🏠 <b>Добавление объекта</b>\n\nВведите адрес:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Объект добавлен!');
    return ctx.scene.leave();
  }
);
