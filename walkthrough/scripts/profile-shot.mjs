import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4199);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })).newPage();
p.setDefaultTimeout(15000);
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4199/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await $('onboarding-continue').click(); await p.waitForTimeout(1500);
await p.getByRole('button', { name: 'Skip intro' }).click(); await p.waitForTimeout(800);
await $('quiz-intro-skip').click(); await p.waitForTimeout(2500);
if (await $('pip-intro-agree').count()) { await $('pip-intro-agree').click(); await p.waitForTimeout(800); }
await p.evaluate(() => { history.pushState({}, '', '/profile'); dispatchEvent(new PopStateEvent('popstate')); }); await p.waitForTimeout(2500);
const secs = await p.$$eval('h2,h3', hs => hs.filter(h => h.offsetParent).map(h => `${h.tagName} ${Math.round(h.getBoundingClientRect().top + scrollY)} ${h.textContent.trim().slice(0,50)}`));
console.log(secs.join('\n')); console.log('height', await p.evaluate(() => document.scrollingElement.scrollHeight));
for (const [i, y] of [[0, 0], [1, 1000]]) await p.screenshot({ path: `.cache/profile-top${i}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: 1000 } });
await b.close(); server.close();
