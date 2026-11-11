// Records the launch intro's hand-over: frames from just before the name starts to glide until the welcome screen is live,
// plus where the intro's name ends up versus the welcome screen's own wordmark.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import fs from 'node:fs';
const [w, h] = (process.argv[2] || '390x844').split('x').map(Number);
const server = await startServer(4194);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
const dir = `.cache/glide-${w}x${h}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now();
await p.goto('http://localhost:4194/', { waitUntil: 'commit' });
await p.waitForSelector('[data-testid=launch-intro]');
const start = Date.now();
const log = [];
let i = 0;
while (Date.now() - start < 5200) {
  const t = Date.now() - start;
  if (t > 2600) {
    await p.screenshot({ path: `${dir}/f${String(i).padStart(3, '0')}.png` });
    const r = await p.evaluate(() => {
      const rect = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
      return { intro: !!document.querySelector('[data-testid=launch-intro]'), name: rect(document.querySelector('.li-name')), target: rect(document.querySelector('[data-welcome-wordmark]')) };
    });
    log.push({ i, t, ...r }); i += 1;
  } else await p.waitForTimeout(100);
}
const last = log[log.length - 1];
const lastWithIntro = [...log].reverse().find((x) => x.intro && x.name);
console.log('frames:', log.length, '| intro gone by frame', log.find((x) => !x.intro)?.i);
console.log('name just before hand-over:', JSON.stringify(lastWithIntro && lastWithIntro.name), 'target wordmark:', JSON.stringify(lastWithIntro && lastWithIntro.target));
console.log('final welcome wordmark:', JSON.stringify(last.target));
await b.close(); server.close();
