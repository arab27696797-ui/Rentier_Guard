/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Создание акта
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const actCreateScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'act-create',
  async (ctx) => {
    await ctx.reply('📋 <b>Создание акта приема-передачи</b>\n\nВыберите договор:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Акт создан!');
    return ctx.scene.leave();
  }
);
