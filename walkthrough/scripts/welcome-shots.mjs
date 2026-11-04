import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:4174/', { waitUntil: 'domcontentloaded' });
const t0 = Date.now();
for (const t of [4000, 4900, 5600, 8300, 8900, 9700, 11500]) {
  await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await p.screenshot({ path: `.cache/welcome-${t}.png` });
}
await b.close();
