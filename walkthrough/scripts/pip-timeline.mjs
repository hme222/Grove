import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4200);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4200/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await $('onboarding-continue').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) { await $('question-skip').click(); }
for (let t = 0; t < 8; t++) {
  const seen = await p.evaluate(() => [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter((id) => /onboarding-|plan|pip-|building|lesson-player/.test(id)).slice(0, 8));
  console.log(t, JSON.stringify(seen), await p.evaluate(() => location.pathname));
  await p.waitForTimeout(600);
}
await b.close(); server.close();
