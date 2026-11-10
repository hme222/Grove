// Does the landing page fit each phone size without scrolling? Screenshots once the build is done.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4181);
const b = await chromium.launch();
for (const [w, h] of [[430, 932], [390, 844], [393, 852], [375, 812], [360, 740], [375, 667]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:4181/'); await p.waitForSelector('[data-testid=launch-intro], [data-testid=onboarding-continue]'); if (await p.locator('[data-testid=launch-intro]').count()) await p.mouse.click(w / 2, 200); await p.waitForSelector('[data-testid=onboarding-continue]'); await p.waitForTimeout(600);
  const m = await p.evaluate(() => { const g = document.querySelector('.gw'); const c = document.querySelector('[data-testid=onboarding-continue]').getBoundingClientRect(); return g ? { scroll: g.scrollHeight > g.clientHeight + 1, over: g.scrollHeight - g.clientHeight, ctaBottom: Math.round(c.bottom), pinned: g.classList.contains('gw-pinned') } : { compact: true }; });
  console.log(`${w}x${h}`, JSON.stringify(m));
  if (w === 390) await p.screenshot({ path: `.cache/landing-${w}x${h}.png` });
  await p.close();
}
await b.close(); server.close();
