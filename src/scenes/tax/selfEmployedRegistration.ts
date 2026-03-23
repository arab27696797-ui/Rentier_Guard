/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RentierGuard Bot - Сцена: Регистрация самозанятого
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Scenes } from 'telegraf';

export const selfEmployedRegistrationScene = new Scenes.BaseScene<Scenes.WizardContext>('selfemployed-registration');

selfEmployedRegistrationScene.enter(async (ctx) => {
  await ctx.reply(
    '📝 <b>Как стать самозанятым</b>\n\n' +
    '1. Скачайте приложение "Мой налог"\n' +
    '2. Пройдите регистрацию\n' +
    '3. Начните принимать оплату',
    { parse_mode: 'HTML' }
  );
  await ctx.scene.leave();
});
