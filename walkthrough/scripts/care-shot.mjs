// Screenshots the Today page with a few plants (mock API only). Run: node scripts/care-shot.mjs <outdir> [textPercent]
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import { createMock } from './mock.mjs';
const out = process.argv[2]; const pct = Number(process.argv[3] || 100);
const server = await startServer(4203);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.fallback() : r.abort()));
await createMock({ log: () => {} }).install(ctx);
if (pct !== 100) await ctx.addInitScript((p) => { const a = () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}% !important}`; document.head.appendChild(s); }; document.head ? a() : document.addEventListener('DOMContentLoaded', a); }, pct);
const page = await ctx.newPage();
await page.goto('http://localhost:4203/login');
await page.evaluate(async () => {
  const post = (p, method, body) => fetch(`http://mock.local/api${p}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
  const reg = await post('/auth/register', 'POST', { email: 'maya@example.com', password: 'x', username: 'maya' });
  await post('/users/me', 'PATCH', { onboarding_complete: true, primary_track: 'rebirth', nook_offered_at: '2026-11-03T10:00:00-05:00', hemisphere: 'north', has_pets: true });
  for (const [c, n] of [['Monstera', 'Monty'], ['Pothos', 'Penny'], ['Snake Plant', 'Sammy']]) await post('/plants', 'POST', { common_name: c, nickname: n });
  localStorage.setItem('grove_access_token', reg.access_token);
  localStorage.setItem('grove_refresh_token', reg.refresh_token);
});
await page.goto('http://localhost:4203/care/today');
const agree = page.getByTestId('pip-intro-agree');
if (await agree.waitFor({ timeout: 6000 }).then(() => true, () => false)) { await agree.click(); await agree.waitFor({ state: 'detached' }).catch(() => {}); }
await page.getByTestId('care-card').first().waitFor();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/care-${pct}.png` });
await page.screenshot({ path: `${out}/care-${pct}-full.png`, fullPage: true });
await b.close(); process.exit(0);
