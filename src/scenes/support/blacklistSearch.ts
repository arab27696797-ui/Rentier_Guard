import { Scenes } from 'telegraf';
export const blacklistSearchScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'blacklist-search',
  async (ctx) => {
    await ctx.reply('🔍 <b>Поиск в черном списке</b>\n\nВведите ФИО или телефон:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('Поиск завершен.');
    return ctx.scene.leave();
  }
);
