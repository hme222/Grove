// Measures real rendered text size, contrast and tap-target size on each demo screen (phone viewport).
// Run: SERVE_DIR=../demo/site node scripts/a11y-audit.mjs <outfile.json>
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './serve.mjs';

const outFile = process.argv[2] || '.cache/a11y.json';
const server = await startServer(4176);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const $ = (id) => page.getByTestId(id);
const results = {};

function scan() {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) base = over(c, base); return base; };
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0 && r.bottom > 0 && r.top < innerHeight; };
  const hist = {}; const samples = []; const text = []; const small = []; const lowContrast = []; const tiny = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; const t = n.textContent.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || seen.has(el) || !vis(el)) continue; seen.add(el);
    if (el.closest('[data-demo-ui], canvas, script, style')) continue;
    const s = getComputedStyle(el); const px = parseFloat(s.fontSize); const wt = parseInt(s.fontWeight);
    const fg = parse(s.color); const bg = bgOf(el); const f = over({ ...fg, a: fg.a * (+s.opacity) }, bg);
    const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = px >= 24 || (px >= 18.66 && wt >= 700);
    const rec = { t: t.slice(0, 42), px: +px.toFixed(1), ratio: +ratio.toFixed(2), tid: el.closest('[data-testid]')?.getAttribute('data-testid') || '' };
    if (px < 12) tiny.push(rec); else if (px < 14) small.push(rec);
    if (ratio < (large ? 3 : 4.5)) lowContrast.push(rec);
    text.push(px); hist[px] = (hist[px] || 0) + t.length; if (px <= 14.5 && samples.length < 6) samples.push(t.slice(0, 30));
  }
  const targets = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role=button], [role=tab], [role=link]')) {
    if (!vis(el) || el.closest('[data-demo-ui]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) targets.push({ el: (el.getAttribute('aria-label') || el.innerText || el.getAttribute('data-testid') || el.tagName).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
  }
  const unnamed = [];
  for (const el of document.querySelectorAll('button, a[href], input, [role=button]')) {
    if (!vis(el)) continue;
    const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.labels?.[0]?.innerText || el.getAttribute('placeholder') || '').trim();
    if (!name) unnamed.push(el.getAttribute('data-testid') || el.tagName);
  }
  const imgs = [...document.querySelectorAll('img')].filter((i) => vis(i) && !i.hasAttribute('alt')).map((i) => i.src.slice(-30));
  return { tiny, small, lowContrast, targets, unnamed, imgsNoAlt: imgs, h1: document.querySelectorAll('h1').length, main: !!document.querySelector('main,[role=main]'), lang: document.documentElement.lang, hist, samples, minPx: Math.min(...text), n: text.length };
}

let i = 0;
const step = async (label, fn) => {
  try { await fn(); } catch (e) { console.log('step failed', label, e.message.split('\n')[0]); }
  await page.waitForTimeout(600);
  results[`${String(++i).padStart(2, '0')}-${label}`] = await page.evaluate(scan);
};

await page.goto('http://localhost:4176/'); await page.waitForTimeout(1500);
await step('welcome', async () => {});
await step('intro-1', async () => { await page.mouse.click(195, 300); await $('onboarding-continue').click(); });
await step('intro-2', async () => { await $('onboarding-continue').click(); });
await step('intro-3', async () => { await $('onboarding-continue').click(); });
await step('account', async () => { await $('onboarding-continue').click(); });
await step('hemisphere', async () => { await $('signup-email').fill('maya@example.com'); await $('signup-password').fill('growgrove1'); await $('signup-submit').click(); });
await step('quiz-intro', async () => { await $('hemisphere-north').click(); });
await step('q1', async () => { await $('quiz-intro-start').click(); });
await step('q2', async () => { await page.locator('[data-testid^="option-q1"]').first().click(); await $('question-next').click(); });
await step('q3', async () => { await $('question-skip').click(); });
await step('q4', async () => { await $('question-skip').click(); });
await step('plan', async () => { await $('question-skip').click(); await page.waitForTimeout(1500); });
await step('lesson-1', async () => { await $('plan-start').click(); });
for (let k = 2; k <= 5; k++) await step(`lesson-${k}`, async () => { await $('lesson-next').click(); });
await step('add-chooser', async () => { await $('soil-step-add-plant').click(); });
await step('add-search', async () => { await $('add-option-manual').click(); });
await step('add-form', async () => { await $('species-search-input').fill('spider'); await page.waitForTimeout(800); await $('species-option').first().click(); });
await step('add-photo', async () => { await page.getByRole('button', { name: /add a photo/i }).click(); });
await step('today', async () => { await $('photo-skip').click(); await page.waitForTimeout(6000); await page.getByRole('link', { name: 'Today' }).click(); });
await step('soil-log', async () => { await $('next-lesson-start').scrollIntoViewIfNeeded(); await $('next-lesson-start').click(); await page.waitForTimeout(800); });
await step('soil-result', async () => { await $('soil-outcome-dry').click(); await $('soil-decision-water').click(); });
await step('celebration', async () => { await $('soil-step-submit').click(); await page.waitForTimeout(700); await $('soil-step-continue').click(); await page.waitForTimeout(1000); });
await step('pip-offer', async () => { await $('first-care-celebration-cta').click(); await page.waitForTimeout(1200); });
await step('today-pip', async () => { await $('nook-offer-yes').click(); await page.waitForTimeout(900); await page.getByRole('link', { name: 'Today' }).click(); await page.waitForTimeout(1000); });
await step('nook', async () => { await $('pip-note-thumb').click(); await page.waitForTimeout(1200); });
await step('plants', async () => { await page.getByRole('link', { name: 'Plants' }).click(); await page.waitForTimeout(1000); });
await step('plant-detail', async () => { await page.getByTestId('collection-grid-plant-tile').first().click(); await page.waitForTimeout(1200); });
await step('learn', async () => { await page.getByRole('link', { name: 'Learn' }).click(); await page.waitForTimeout(1000); });
await step('guide-species', async () => { await page.getByText('Monstera', { exact: false }).first().click(); await page.waitForTimeout(1200); });
await step('profile', async () => { await page.getByRole('link', { name: 'Today' }).click(); await $('header-profile-button').click(); await page.waitForTimeout(1000); });

fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(results, null, 1));
await browser.close(); server.close();
console.log('done', Object.keys(results).length, 'screens');
