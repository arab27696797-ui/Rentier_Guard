import { Scenes } from 'telegraf';
export const propertyListScene = new Scenes.BaseScene<Scenes.WizardContext>('property-list');
propertyListScene.enter(async (ctx) => {
  await ctx.reply('🏠 <b>Мои объекты</b>', { parse_mode: 'HTML' });
});
