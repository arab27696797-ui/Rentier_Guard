import { Scenes } from 'telegraf';
export const paymentScheduleScene = new Scenes.BaseScene<Scenes.WizardContext>('payment-schedule');
paymentScheduleScene.enter(async (ctx) => {
  await ctx.reply('📅 <b>График платежей</b>', { parse_mode: 'HTML' });
});
