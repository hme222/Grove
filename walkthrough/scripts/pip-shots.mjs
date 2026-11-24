import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4197);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const $ = (id) => p.getByTestId(id);
const nav = async (path) => { await p.evaluate((to) => { history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }, path); await p.waitForTimeout(1200); };
await p.goto('http://localhost:4197/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await $('onboarding-continue').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
await $('quiz-intro-skip').click(); await p.waitForTimeout(1500);
const made = await p.evaluate(async () => {
  try { const r = await fetch('http://mock.local/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ common_name: 'Monstera', nickname: 'Monty' }) }); return r.status; } catch (e) { return 'fetch failed ' + e.message; }
});
console.log('plant created:', made);
await p.waitForTimeout(62000); await nav('/plants'); await p.waitForTimeout(800);
await p.screenshot({ path: '.cache/pip-bubble.png' });
if (await $('pip-help').count()) { await $('pip-help').click(); await p.waitForTimeout(900); await p.screenshot({ path: '.cache/pip-sheet.png' }); await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
await nav('/care/today'); await p.waitForTimeout(1000);
console.log('pip layer:', await $('pip-peek').count(), 'header help:', await $('header-help-button').count());
await p.screenshot({ path: '.cache/pip-today.png' });
await nav('/profile'); await $('profile-pip').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await p.screenshot({ path: '.cache/pip-profile.png' });
await b.close(); server.close();
