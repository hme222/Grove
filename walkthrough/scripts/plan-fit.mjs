import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4194);
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [390, 756], [375, 667], [430, 932]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  const $ = (id) => p.getByTestId(id);
  await p.goto('http://localhost:4194/'); await p.waitForTimeout(1500); await p.mouse.click(w / 2, 300);
  await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) await $('onboarding-continue').click();
  await $('hemisphere-north').click(); await $('quiz-intro-skip').click(); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const e = document.querySelector('[data-testid="onboarding-flow"]'); return { scrollH: e.scrollHeight, clientH: e.clientHeight }; });
  console.log(w, h, r);
  if (w === 390 && h === 844) await p.screenshot({ path: '.cache/plan-844.png' });
  await ctx.close();
}
await b.close(); server.close();
