import { Scenes } from 'telegraf';
export const blacklistAddScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'blacklist-add',
  async (ctx) => {
    await ctx.reply('⚫ <b>Добавление в черный список</b>\n\nВведите ФИО:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Запись добавлена!');
    return ctx.scene.leave();
  }
);
