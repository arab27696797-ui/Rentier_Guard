import { Scenes } from 'telegraf';
export const blacklistMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('blacklist-menu');
blacklistMenuScene.enter(async (ctx) => {
  await ctx.reply(
    '⚫ <b>Черный список арендаторов</b>\n\n' +
    '• Проверить арендатора\n' +
    '• Добавить в список',
    { parse_mode: 'HTML' }
  );
});
