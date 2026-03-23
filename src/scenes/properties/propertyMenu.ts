import { Scenes } from 'telegraf';
import { getPropertiesMenuKeyboard } from '../../content/messages';
export const propertyMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('property-menu');
propertyMenuScene.enter(async (ctx) => {
  await ctx.reply('🏠 <b>Объекты недвижимости</b>', {
    parse_mode: 'HTML',
    reply_markup: getPropertiesMenuKeyboard(),
  });
});
