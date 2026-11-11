// Reach the "How to take a great plant photo" cards, tap the mini tiles, and report which card ends up showing.
import { chromium, webkit } from 'playwright';
import { startServer } from './serve.mjs';
const engine = process.argv[2] === 'webkit' ? webkit : chromium;
const [VW, VH] = (process.argv[3] || '390x844').split('x').map(Number);
const server = await startServer(4196);
const b = await engine.launch();
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4196/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300);
await $('onboarding-continue').click(); await $('signup-submit').click();
for (let i = 0; i < 3; i++) await $('onboarding-continue').click();
await $('hemisphere-north').click(); await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(1500); await $('plan-start').click();
for (let i = 0; i < 4; i++) await $('lesson-next').click();
await $('soil-step-add-plant').click(); await $('add-option-manual').click();
await $('species-search-input').fill('spider'); await p.waitForTimeout(800); await $('species-option').first().click();
await p.getByRole('button', { name: /add a photo/i }).click();
await $('photo-guide-cards').waitFor();
const state = () => p.evaluate(() => {
  const strip = document.querySelector('[data-testid="photo-guide-pagination"]');
  const cur = [...strip.querySelectorAll('button[aria-current]')].map((x) => x.getAttribute('aria-label'));
  const sc = document.querySelector('[data-testid="photo-guide-cards"] > div');
  const centre = sc.scrollLeft + sc.clientWidth / 2;
  const showing = [...sc.children].map((c, i) => [i, Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre)]).sort((a, c) => a[1] - c[1])[0][0];
  return { highlighted: cur[0]?.replace(/Show card (\d) of.*/, '$1'), cardInView: showing + 1, scrollLeft: Math.round(sc.scrollLeft), cardW: Math.round(sc.children[0].offsetWidth), scrollerW: sc.clientWidth };
});
console.log(engine === webkit ? 'WEBKIT' : 'CHROMIUM', 'start', JSON.stringify(await state()));
for (const n of [4, 6, 2, 5]) {
  await p.locator(`[data-testid="photo-guide-pagination"] button[aria-label^="Show card ${n} of"]`).tap();
  await p.waitForTimeout(1200);
  const s = await state();
  console.log(`tap tile ${n} ->`, JSON.stringify(s), s.highlighted == n && s.cardInView == n ? 'OK' : 'WRONG');
}
await b.close(); server.close();
