import { Scenes } from 'telegraf';
export const paymentHistoryScene = new Scenes.BaseScene<Scenes.WizardContext>('payment-history');
paymentHistoryScene.enter(async (ctx) => {
  await ctx.reply('📈 <b>История платежей</b>', { parse_mode: 'HTML' });
});
