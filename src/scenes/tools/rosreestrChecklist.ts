import { Scenes } from 'telegraf';
export const rosreestrChecklistScene = new Scenes.BaseScene<Scenes.WizardContext>('rosreestr-checklist');
rosreestrChecklistScene.enter(async (ctx) => {
  await ctx.reply(
    '✅ <b>Чек-лист документов для Росреестра</b>\n\n' +
    '• Паспорт\n' +
    '• Договор купли-продажи\n' +
    '• Квитанция об оплате',
    { parse_mode: 'HTML' }
  );
  await ctx.scene.leave();
});
