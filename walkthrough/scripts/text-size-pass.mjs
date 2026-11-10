// Walks the demo at a given text size (percent of normal) and, on each screen, runs axe and measures layout problems:
// sideways overflow, clipped text, and whether the main button can be reached and is not covered.
// Run: SERVE_DIR=../demo/site node scripts/text-size-pass.mjs 200   (writes .cache/textpass-<pct>.json and screenshots)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './serve.mjs';

const pct = Number(process.argv[2] || 100);
const port = 4190 + Math.floor(pct / 25);
const server = await startServer(port);
const axePath = new URL('../../grove-frontend/node_modules/axe-core/axe.min.js', import.meta.url).pathname;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await ctx.addInitScript((p) => {
  const apply = () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}% !important}`; (document.head || document.documentElement).appendChild(s); };
  if (document.head) apply(); else document.addEventListener('DOMContentLoaded', apply);
}, pct);
const page = await ctx.newPage(); page.setDefaultTimeout(6000);
const $ = (id) => page.getByTestId(id);
const results = {}; let n = 0;
fs.mkdirSync(`.cache/textpass-${pct}`, { recursive: true });

function layout() {
  const out = { overflowX: document.documentElement.scrollWidth - innerWidth, clipped: [], cta: null };
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue;
    if (el.closest('[data-demo-ui], svg, canvas') || r.width <= 2 || r.height <= 2 || el.tagName === 'INPUT' || /sr-only/.test(el.className) || el.closest('.sr-only')) continue;
    const clipsX = ['hidden', 'clip'].includes(s.overflowX); const clipsY = ['hidden', 'clip'].includes(s.overflowY);
    const hasText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (hasText && ((clipsX && el.scrollWidth > el.clientWidth + 2) || (clipsY && el.scrollHeight > el.clientHeight + 2)) && !el.closest('[data-testid="share-cards"]')) {
      out.clipped.push((el.innerText || '').trim().slice(0, 40));
    }
  }
  out.scrollers = [...document.querySelectorAll('body *')].filter((e) => ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 2).map((e) => `${e.tagName}${e.getAttribute('data-testid') ? '#' + e.getAttribute('data-testid') : ''} ${e.scrollHeight}/${e.clientHeight}`).slice(0, 4);
  out.docScroll = document.scrollingElement.scrollHeight - innerHeight;
  const pv = document.querySelector('[data-testid="share-preview"]');
  if (pv) { const i = pv.querySelector('img').getBoundingClientRect(); const c = pv.getBoundingClientRect(); out.preview = { box: [Math.round(c.width), Math.round(c.height)], img: [Math.round(i.width), Math.round(i.height)] }; }
  const btn = document.querySelector('[data-testid="onboarding-continue"], [data-testid="signup-submit"], [data-testid="quiz-intro-start"], [data-testid="plan-start"], [data-testid="lesson-next"], [data-testid="share-save"]');
  if (btn) {
    btn.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = btn.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    out.cta = { id: btn.getAttribute('data-testid'), reachable: r.bottom > 0 && r.top < innerHeight, covered: !!hit && !btn.contains(hit) && !hit.contains(btn), h: Math.round(r.height) };
  }
  return out;
}

const step = async (label, fn) => {
  try { await fn(); } catch (e) { console.log(pct + '%', 'step failed', label, e.message.split('\n')[0]); }
  await page.waitForTimeout(700);
  const key = `${String(++n).padStart(2, '0')}-${label}`;
  await page.addScriptTag({ path: axePath }).catch(() => {});
  const axe = await page.evaluate(async () => {
    if (!window.axe) return null;
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: (v.nodes[0]?.html || '').slice(0, 110) }));
  }).catch(() => null);
  results[key] = { ...(await page.evaluate(layout)), axe };
  await page.screenshot({ path: `.cache/textpass-${pct}/${key}.png`, fullPage: /lesson/.test(label) });
};

await page.goto(`http://localhost:${port}/`); await page.waitForTimeout(1500);
await step('welcome', async () => { await page.mouse.click(195, 300); });
await step('account', async () => { await $('onboarding-continue').click(); });
await step('steps', async () => { await $('signup-email').fill('maya@example.com'); await $('signup-password').fill('growgrove1'); await $('signup-confirm').fill('growgrove1').catch(() => {}); await $('signup-submit').click(); });
await step('intro-1', async () => { await $('onboarding-continue').click(); });
await step('intro-2', async () => { await $('onboarding-continue').click(); });
await step('zone', async () => { await $('onboarding-continue').click(); });
await step('quiz-intro', async () => { await $('hemisphere-north').click(); });
await step('q1', async () => { await $('quiz-intro-start').click(); });
await step('q2', async () => { await $('question-skip').click(); });
await step('q3', async () => { await $('question-skip').click(); });
await step('q4', async () => { await $('question-skip').click(); });
await step('plan', async () => { await $('question-skip').click(); await page.waitForTimeout(1500); });
await step('lesson-1', async () => { await $('plan-start').click(); });
for (let k = 2; k <= 5; k++) await step(`lesson-${k}`, async () => { await $('lesson-next').click(); });
// Give the demo a plant with care and a new leaf, then look at the plant page and the Share sheet.
await step('today', async () => {
  await page.evaluate(async () => {
    const post = async (path, body) => (await fetch('http://mock.local/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    const plant = await post('/plants', { nickname: 'Monty', common_name: 'Monstera', latin_name: 'Monstera deliciosa', watering_frequency_days: 7 });
    await post(`/plants/${plant.id}/care-logs`, { actions: ['water'], notes: '' });
    await post(`/plants/${plant.id}/care-logs`, { actions: ['new_leaf'], notes: '' });
    window.__pid = plant.id;
  });
  await page.keyboard.press('Escape').catch(() => {});
});
await step('plant-detail', async () => { await page.evaluate(() => { window.history.pushState({}, '', `/plants/${window.__pid}`); window.dispatchEvent(new PopStateEvent('popstate')); }); await page.waitForTimeout(900); });
await step('log-care', async () => { await $('plant-log-care-button').click(); });
await step('share-sheet', async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(400); await $('plant-share-button').click(); await $('share-save').waitFor(); });
await step('share-sticker', async () => { await $('share-cards').getByRole('button', { name: /sticker/i }).click(); });
fs.writeFileSync(`.cache/textpass-${pct}.json`, JSON.stringify(results, null, 1));
await browser.close(); server.close();
const bad = Object.entries(results).filter(([, r]) => r.overflowX > 1 || r.clipped.length || (r.cta && (!r.cta.reachable || r.cta.covered)) || (r.axe || []).length);
console.log(pct + '%', Object.keys(results).length, 'screens;', bad.length, 'with findings');
for (const [k, r] of bad) console.log(' ', k, JSON.stringify({ overflowX: r.overflowX || undefined, clipped: r.clipped.length ? r.clipped.slice(0, 3) : undefined, cta: r.cta && (!r.cta.reachable || r.cta.covered) ? r.cta : undefined, axe: (r.axe || []).map((v) => `${v.id}(${v.n})`) }));
