/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Меню договоров
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';
import { getContractsMenuKeyboard } from '../../content/messages';

export const contractMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('contract-menu');

contractMenuScene.enter(async (ctx) => {
  await ctx.reply('📄 <b>Договоры аренды</b>', {
    parse_mode: 'HTML',
    reply_markup: getContractsMenuKeyboard(),
  });
});
