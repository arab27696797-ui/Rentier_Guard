import { Scenes } from 'telegraf';
export const propertyEditScene = new Scenes.WizardScene<Scenes.WizardContext>(
  'property-edit',
  async (ctx) => {
    await ctx.reply('✏️ Редактирование объекта', { parse_mode: 'HTML' });
    return ctx.scene.leave();
  }
);
