import { Scenes } from 'telegraf';
import { getPaymentsMenuKeyboard } from '../../content/messages';
export const paymentMenuScene = new Scenes.BaseScene<Scenes.WizardContext>('payment-menu');
paymentMenuScene.enter(async (ctx) => {
  await ctx.reply('💳 <b>Платежи</b>', {
    parse_mode: 'HTML',
    reply_markup: getPaymentsMenuKeyboard(),
  });
});
