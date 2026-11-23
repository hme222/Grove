import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4199);
const b = await chromium.launch();
const mk = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); p.setDefaultTimeout(15000); return p; };
const $ = (p, id) => p.getByTestId(id);
const nav = async (p, path) => { await p.evaluate((to) => { history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }, path); await p.waitForTimeout(1200); };
const start = async (p) => {
  await p.goto('http://localhost:4199/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
  await $(p, 'onboarding-continue').click(); await p.waitForTimeout(800); await $(p, 'signup-submit').click(); await p.waitForTimeout(1500);
  await $(p, 'onboarding-continue').click(); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
};

// A: a new person meets Pip in onboarding, after the questions and before the plan.
{
  const p = await mk();
  await p.goto('http://localhost:4199/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
  await $(p, 'onboarding-continue').click(); await p.waitForTimeout(800); await $(p, 'signup-submit').click(); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) await $(p, 'onboarding-continue').click();
  await $(p, 'hemisphere-north').click();
  await $(p, 'quiz-intro-start').click();
  for (let i = 0; i < 4; i++) await $(p, 'question-skip').click();
  await $(p, 'pip-step-agree').waitFor({ timeout: 20000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: '.cache/pip-onboarding.png' });
  await $(p, 'pip-step-agree').click(); await p.waitForTimeout(1200);
  console.log('plan after hello:', await $(p, 'onboarding-plan').count());
}
// B: someone already in the app gets the card, then Pip stands on the tab bar.
{
  const p = await mk(); await start(p);
  await $(p, 'quiz-intro-skip').click(); await p.waitForTimeout(2500);
  console.log('card shown:', await $(p, 'pip-intro').count());
  await p.screenshot({ path: '.cache/pip-card.png' });
  await $(p, 'pip-intro-agree').click(); await p.waitForTimeout(800);
  await p.evaluate(async () => { await fetch('http://mock.local/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ common_name: 'Monstera', nickname: 'Monty' }) }); });
  await p.waitForTimeout(62000);
  await nav(p, '/plants'); await p.waitForTimeout(900);
  await p.screenshot({ path: '.cache/pip-stand-bubble.png' });
  await nav(p, '/care/today'); await p.waitForTimeout(800);
  await p.screenshot({ path: '.cache/pip-stand-rest.png' });
}
await b.close(); server.close();
