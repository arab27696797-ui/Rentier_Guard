import { Scenes } from 'telegraf';
import { getToolsMenuKeyboard } from '../../content/messages';
export const toolsMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('tools-menu');
toolsMenuScene.enter(async (ctx) => {
  await ctx.reply('🛠️ <b>Инструменты</b>', {
    parse_mode: 'HTML',
    reply_markup: getToolsMenuKeyboard(),
  });
});
