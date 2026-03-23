import { Scenes } from 'telegraf';
export const yearExportScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'year-export',
  async (ctx) => {
    await ctx.reply('📊 <b>Экспорт за год</b>\n\nВведите год:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('📥 Отчет формируется...');
    return ctx.scene.leave();
  }
);
