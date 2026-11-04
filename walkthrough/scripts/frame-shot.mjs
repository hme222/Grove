import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const s = { close() {} };
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:4174/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
await p.screenshot({ path: '.cache/frame-top.png', clip: { x: 440, y: 40, width: 400, height: 140 } });
await p.screenshot({ path: '.cache/frame-bottom.png', clip: { x: 440, y: 820, width: 400, height: 160 } });
await b.close(); s.close();
