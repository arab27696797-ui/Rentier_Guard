import { Scenes } from 'telegraf';
export const expertConsultationScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'expert-consultation',
  async (ctx) => {
    await ctx.reply('👨‍⚖️ <b>Консультация эксперта</b>\n\nОпишите ваш вопрос:', { parse_mode: 'HTML' });
    return ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.reply('✅ Вопрос отправлен эксперту!');
    return ctx.scene.leave();
  }
);
