import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4194);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const $ = (id) => p.getByTestId(id);
const measure = async (name) => {
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const img = document.querySelector('[data-testid="hero-image"]');
    const btn = document.querySelector('[data-testid="onboarding-continue"]');
    const root = document.querySelector('[data-testid="onboarding-flow"]') || document.body;
    const ps = [...document.querySelectorAll('p')].filter((e) => e.offsetParent && e.textContent.trim().length > 15).map((e) => e.getBoundingClientRect());
    const above = btn ? ps.filter((r) => r.bottom <= btn.getBoundingClientRect().top + 1).sort((a, c) => c.bottom - a.bottom)[0] : null;
    const R = (e) => e && (({ top, bottom, height }) => ({ top: Math.round(top), bottom: Math.round(bottom), h: Math.round(height) }))(e.getBoundingClientRect ? e.getBoundingClientRect() : e);
    return { photo: R(img), btn: R(btn), lastTextBottom: above && Math.round(above.bottom), gapTextToBtn: above && btn ? Math.round(btn.getBoundingClientRect().top - above.bottom) : null };
  });
  console.log(name, JSON.stringify(r));
  await p.screenshot({ path: `.cache/m-${name}.png` });
};
await p.goto('http://localhost:4194/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300); await p.waitForTimeout(12000);
await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
await measure('steps');
await $('onboarding-continue').click(); await measure('slide1');
await $('onboarding-continue').click(); await measure('slide2');
await p.getByRole('button', { name: 'Skip intro' }).click(); await measure('quizintro');
await b.close(); server.close();
