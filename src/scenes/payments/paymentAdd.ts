import { Scenes } from 'telegraf';
export const paymentAddScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'payment-add',
  async (ctx) => {
    await ctx.reply('💳 <b>Добавление платежа</b>\n\nВведите сумму:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Платеж добавлен!');
    return ctx.scene.leave();
  }
);
