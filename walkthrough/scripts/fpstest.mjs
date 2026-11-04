import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import { createMock } from './mock.mjs';
const server = await startServer();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await createMock().install(ctx);
const page = await ctx.newPage();
await page.goto('http://localhost:4173/');
await page.waitForTimeout(1500);
for (const [type, quality] of [['jpeg', 92], ['png', undefined]]) {
  const t0 = Date.now(); let n = 0; let bytes = 0;
  while (Date.now() - t0 < 3000) { const b = await page.screenshot({ type, quality }); bytes += b.length; n++; }
  console.log(type, 'fps:', (n / 3).toFixed(1), 'avg KB:', Math.round(bytes / n / 1024));
}
await browser.close(); server.close();
