import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4198);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const $ = (id) => p.getByTestId(id);
const nav = async (path) => { await p.evaluate((to) => { history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); }, path); await p.waitForTimeout(1200); };
await p.goto('http://localhost:4198/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await $('onboarding-continue').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
await $('quiz-intro-skip').click(); await p.waitForTimeout(1500);
await p.evaluate(async () => { await fetch('http://mock.local/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ common_name: 'Monstera', nickname: 'Monty' }) }); });
await p.waitForTimeout(62000);
// Large text: 200% of the root size, the way a reader's text setting scales it.
await p.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
await nav('/plants'); await p.waitForTimeout(800);
await p.screenshot({ path: '.cache/pip-large-bubble.png' });
const box = await $('pip-bubble').boundingBox().catch(() => null);
const nav2 = await $('bottom-nav').boundingBox().catch(() => null);
console.log('bubble', JSON.stringify(box), 'nav', JSON.stringify(nav2), 'viewport 390x844');
// Reduced motion: the nudge class must have no animation.
const anim = await p.evaluate(() => { const e = document.querySelector('[data-testid="pip-head"]'); return e ? getComputedStyle(e).animationName : 'no head'; });
console.log('head animation under reduced motion:', anim);
await p.evaluate(() => { document.documentElement.style.fontSize = ''; });
// Keyboard: Tab to the header Help button, Enter opens the sheet with focus inside, Escape closes and returns focus.
await nav('/care/today');
await p.evaluate(() => document.querySelector('[data-testid="header-help-button"]').focus());
await p.keyboard.press('Enter'); await p.waitForTimeout(600);
console.log('focus in sheet:', await p.evaluate(() => !!document.activeElement.closest('[data-testid="help-sheet"]')), '| on title:', await p.evaluate(() => document.activeElement.textContent));
await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
console.log('tab stays in sheet:', await p.evaluate(() => !!document.activeElement.closest('[data-testid="help-sheet"]')));
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
console.log('sheet closed:', (await $('help-sheet').count()) === 0, '| focus back on Help button:', await p.evaluate(() => document.activeElement.getAttribute('data-testid')));
// Pip by keyboard: focus the head, Escape hides it for the day.
const headCount = await $('pip-head').count();
if (headCount) { await p.evaluate(() => document.querySelector('[data-testid="pip-head"]').focus()); await p.keyboard.press('Escape'); await p.waitForTimeout(400); console.log('Pip hidden after Escape:', (await $('pip-peek').count()) === 0); } else console.log('no Pip head on Today to test Escape');
await b.close(); server.close();
