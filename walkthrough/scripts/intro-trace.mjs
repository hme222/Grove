import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4180);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:4180/');
await p.waitForSelector('.li-mark', { state: 'attached' });
const trace = await p.evaluate(() => new Promise((res) => {
  const el = document.querySelector('.li-mark'); const out = []; const t0 = performance.now();
  const tick = () => {
    const t = performance.now() - t0; const y = Math.round(el.getBoundingClientRect().top);
    const nm = document.querySelector('.li-name'); out.push([Math.round(t), y, nm ? +(+getComputedStyle(nm).opacity).toFixed(2) : null]);
    if (t < 3300) requestAnimationFrame(tick); else res(out);
  }; tick();
}));
const rest = trace[trace.length - 1];
console.log('samples every ~150ms (ms, mark top px, name opacity):');
console.log(trace.filter((_, i) => i % 9 === 0).map((r) => r.join(',')).join('  '));
const tops = trace.map((r) => r[1]).filter((y) => y !== undefined);
let bounces = 0; for (let i = 2; i < trace.length; i++) { const a = trace[i-2][1], m = trace[i-1][1], c = trace[i][1]; if (m < a && m < c && m < 0) bounces++; }
console.log('intro still present at end:', await p.locator('[data-testid=launch-intro]').count(), '| welcome present:', await p.locator('[data-testid=onboarding-welcome]').count());
await b.close(); server.close();
