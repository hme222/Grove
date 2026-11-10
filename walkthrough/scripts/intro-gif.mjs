// Records the real launch intro from the demo build as a GIF, stepping the CSS animations frame by frame so it is
// exact however slow the machine is.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import fs from 'node:fs';
const server = await startServer(4185);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(40000);
// Hold the intro on screen: its 3.4s hand-off timer is swallowed here (recording only), then the animations are stepped by hand.
await p.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (fn, d, ...a) => (d === 3400 ? 0 : st(fn, d, ...a)); });
await p.goto('http://localhost:4185/');
await p.waitForSelector('[data-testid=launch-intro]', { timeout: 40000 });
fs.mkdirSync('.cache/ig', { recursive: true });
let n = 0;
for (let t = 0; t <= 3400; t += 50) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
  await p.screenshot({ path: `.cache/ig/f${String(n++).padStart(3, '0')}.png` });
}
await b.close(); server.close();
