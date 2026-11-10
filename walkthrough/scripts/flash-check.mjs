// Records what is on screen, frame by frame, from first load through sign-up, to catch any flash of
// other content (a loading screen, the app behind the flow, another page) before or between the first-run screens.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4184);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(40000);
await p.addInitScript(() => {
  window.__seen = []; let last = '';
  const t0 = performance.now();
  const tick = () => {
    const flow = document.querySelector('[data-testid=onboarding-flow]');
    const intro = document.querySelector('[data-testid=launch-intro]') ? 'intro' : '';
    const outside = [...document.body.querySelectorAll('#root > *')].filter((e) => e !== flow && !e.hasAttribute('data-demo-ui')).map((e) => (e.innerText || '').trim().slice(0, 40)).filter(Boolean).join(' | ');
    const screen = flow ? (flow.querySelector('[data-testid]:not([data-testid=onboarding-flow]):not([data-testid=onboarding-finish-error])')?.getAttribute('data-testid') || 'flow') : 'no-flow';
    const key = `${intro}|${screen}|${outside}`;
    if (key !== last) { window.__seen.push([Math.round(performance.now() - t0), intro || '-', screen, outside || '-']); last = key; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await p.goto('http://localhost:4184/');
await p.waitForSelector('[data-testid=onboarding-continue]', { timeout: 40000 }).catch(() => {});
await p.mouse.click(200, 300);
await p.getByTestId('onboarding-continue').click();
await p.getByTestId('signup-submit').click();
await p.getByTestId('steps-list').waitFor();
await p.getByTestId('onboarding-continue').click(); await p.getByTestId('onboarding-continue').click(); await p.getByTestId('onboarding-continue').click();
await p.getByTestId('hemisphere-north').click(); await p.getByTestId('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await p.getByTestId('question-skip').click();
await p.getByTestId('plan-start').waitFor(); await p.evaluate(() => { window.__seen.push(['--', 'plan shown', '', '']); });
await p.getByTestId('plan-start').click(); await p.waitForTimeout(1500);
console.log('t(ms)  intro  screen  [text outside the flow]');
for (const r of await p.evaluate(() => window.__seen)) console.log(r.join('  '));
await b.close(); server.close();
