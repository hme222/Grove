import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4195);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:4195/'); await p.waitForTimeout(1500); await p.mouse.click(215, 300); await p.waitForTimeout(1500);
await p.screenshot({ path: '.cache/landing-gap.png', clip: { x: 150, y: 200, width: 280, height: 170 } });
await b.close(); server.close();
