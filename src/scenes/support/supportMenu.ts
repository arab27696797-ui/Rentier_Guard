import { Scenes } from 'telegraf';
import { getSupportMenuKeyboard } from '../../content/messages';
export const supportMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('support-menu');
supportMenuScene.enter(async (ctx) => {
  await ctx.reply('🆘 <b>Поддержка</b>', {
    parse_mode: 'HTML',
    reply_markup: getSupportMenuKeyboard(),
  });
});
