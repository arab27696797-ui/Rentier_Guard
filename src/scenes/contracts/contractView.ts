/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Просмотр договора
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const contractViewScene = new Scenes.BaseScene<Scenes.WizardContext>('contract-view');

contractViewScene.enter(async (ctx) => {
  await ctx.reply('📄 <b>Просмотр договора</b>\n\nВыберите договор из списка:', { parse_mode: 'HTML' });
});
