import { webkit, chromium } from 'playwright';
import fs from 'node:fs';
for (const [name, engine] of [['webkit', webkit], ['chromium', chromium]]) {
  const b = await engine.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.goto('http://localhost:4174/', { waitUntil: 'load' });
  const t0 = Date.now();
  for (const t of [4200, 5200, 6200, 7200, 9000]) {
    await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await p.screenshot({ path: `.cache/wk-${name}-${t}.png` });
  }
  await b.close();
}
