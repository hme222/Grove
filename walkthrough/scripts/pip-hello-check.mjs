import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4199);
const b = await chromium.launch();
process.on('unhandledRejection', () => {});
const mk = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); p.setDefaultTimeout(15000); return p; };
const $ = (p, id) => p.getByTestId(id);
const big = (p) => p.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
const overflow = (p) => p.evaluate(() => ({ docW: document.documentElement.scrollWidth, winW: innerWidth }));
const enter = async (p) => {
  await p.goto('http://localhost:4199/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
  await $(p, 'onboarding-continue').click(); await p.waitForTimeout(800); await $(p, 'signup-submit').click(); await p.waitForTimeout(1500);
};
// Hello screen in onboarding, normal and 200% text.
{
  const p = await mk(); await enter(p);
  for (let i = 0; i < 3; i++) { await $(p, 'onboarding-continue').click(); await p.waitForTimeout(900); }
  await $(p, 'hemisphere-north').click(); await $(p, 'quiz-intro-start').click();
  for (let i = 0; i < 4; i++) { await $(p, 'question-skip').click(); await p.waitForTimeout(700); }
  await $(p, 'pip-step-agree').waitFor({ timeout: 20000 }); await p.waitForTimeout(800);
  await p.screenshot({ path: '.cache/check-hello.png' });
  await big(p); await p.waitForTimeout(600);
  console.log('hello large overflow', await overflow(p));
  await p.screenshot({ path: '.cache/check-hello-large.png', fullPage: true });
  await $(p, 'pip-step-agree').scrollIntoViewIfNeeded();
  await p.screenshot({ path: '.cache/check-hello-large-buttons.png' });
}
// In-app card, normal and 200% text.
{
  const p = await mk(); await enter(p);
  await $(p, 'onboarding-continue').click(); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
  await $(p, 'quiz-intro-skip').click(); await p.waitForTimeout(2500);
  console.log('card shown:', await $(p, 'pip-intro').count());
  await p.screenshot({ path: '.cache/check-card.png' });
  await big(p); await p.waitForTimeout(600);
  console.log('card large overflow', await overflow(p));
  await p.screenshot({ path: '.cache/check-card-large.png', fullPage: true });
  await $(p, 'pip-intro-agree').scrollIntoViewIfNeeded();
  await p.screenshot({ path: '.cache/check-card-large-buttons.png' });
}
await b.close(); server.close();
