/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Меню налогов
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';
import { getTaxMenuKeyboard } from '../../content/messages';

export const taxMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('tax-menu');

taxMenuScene.enter(async (ctx) => {
  await ctx.reply('💰 <b>Налоги и финансы</b>', {
    parse_mode: 'HTML',
    reply_markup: getTaxMenuKeyboard(),
  });
});
