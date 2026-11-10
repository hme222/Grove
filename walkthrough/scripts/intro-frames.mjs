// Captures the launch intro at set times and joins them into one strip.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4179);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const times = [150, 600, 900, 1150, 1350, 1600, 2000, 2500, 3200];
await p.goto('http://localhost:4179/', { waitUntil: 'commit' });
const t0 = Date.now();
for (const t of times) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `.cache/intro-${t}.png` }); }
await b.close(); server.close();
