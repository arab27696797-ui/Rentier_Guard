import { Scenes } from 'telegraf';
export const problemSolverScene = new Scenes.BaseScene<Scenes.WizardContext>('problem-solver');
problemSolverScene.enter(async (ctx) => {
  await ctx.reply(
    '🔧 <b>Решение проблем</b>\n\n' +
    'Выберите проблему:\n' +
    '• Неплательщик\n' +
    '• Порча имущества\n' +
    '• Нарушение договора',
    { parse_mode: 'HTML' }
  );
});
