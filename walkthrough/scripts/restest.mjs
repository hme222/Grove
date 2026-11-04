import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './serve.mjs';
import { createMock, FROZEN_NOW } from './mock.mjs';
const dir = new URL('../.cache/restest/', import.meta.url).pathname;
const server = await startServer();
const browser = await chromium.launch();

// A: Playwright recordVideo with an explicit size
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, recordVideo: { dir: dir + 'A', size: { width: 1170, height: 2532 } } });
  await createMock().install(ctx);
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(4000);
  await ctx.close();
}
// B: CDP screencast frames
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await createMock().install(ctx);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  fs.mkdirSync(dir + 'B', { recursive: true });
  let n = 0; const stamps = [];
  cdp.on('Page.screencastFrame', async (f) => {
    stamps.push(f.metadata.timestamp);
    if (n < 3) fs.writeFileSync(`${dir}B/f${n}.jpg`, Buffer.from(f.data, 'base64'));
    n++;
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
  });
  await page.goto('http://localhost:4173/');
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: 1170, maxHeight: 2532, everyNthFrame: 1 });
  await page.waitForTimeout(4000);
  await cdp.send('Page.stopScreencast');
  console.log('B frames in ~4s:', n, 'avg fps ~', (n / (stamps[stamps.length - 1] - stamps[0])).toFixed(1));
  await ctx.close();
}
await browser.close(); server.close();
