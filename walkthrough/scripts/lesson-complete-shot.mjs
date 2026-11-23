import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4193);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4193/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await $('onboarding-continue').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(4000);
await p.evaluate(() => { history.pushState({}, '', '/lessons/plant-parent-reset'); dispatchEvent(new PopStateEvent('popstate')); });
await p.waitForTimeout(1200); console.log('in lesson');
for (let i = 0; i < 8; i++) { if (await $('lesson-quiz').count()) break; await $('lesson-next').click().catch(async () => { await p.screenshot({ path: '.cache/dbg3.png' }); throw new Error('stuck at ' + i); }); await p.waitForTimeout(350); }
console.log('at quiz'); await p.screenshot({ path: '.cache/lesson-quiz.png' });
while (await $('lesson-quiz').count()) {
  const opts = p.locator('[data-testid^="lesson-quiz-option-"]');
  const n = await opts.count();
  for (let i = 0; i < n; i++) { await opts.nth(i).click(); await p.waitForTimeout(150); if (await $('lesson-quiz-next').isEnabled().catch(() => false)) break; }
  await $('lesson-quiz-next').click(); await p.waitForTimeout(300);
}
await p.screenshot({ path: '.cache/lesson-last-card.png' });
console.log('at mark done'); await $('mark-done-done').click(); await p.waitForTimeout(700);
await p.screenshot({ path: '.cache/lesson-complete.png' });
await b.close(); server.close();
