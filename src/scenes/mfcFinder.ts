import { Scenes } from 'telegraf';
export const mfcFinderScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'mfc-finder',
  async (ctx) => {
    await ctx.reply('🏛️ <b>Поиск МФЦ</b>\n\nОтправьте свою геолокацию:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('Ближайший МФЦ найден!');
    return ctx.scene.leave();
  }
);
