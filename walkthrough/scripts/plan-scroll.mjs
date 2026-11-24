import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4193);
const b = await chromium.launch();
for (const [w, h] of [[1280, 720], [1420, 682], [1920, 1080]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.setDefaultTimeout(10000);
  const $ = (id) => p.getByTestId(id);
  await p.goto('http://localhost:4193/'); await p.waitForTimeout(8000);
  await $('onboarding-continue').click(); await p.waitForTimeout(800); await $('signup-submit').click(); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) await $('onboarding-continue').click();
  await $('hemisphere-north').click(); await $('quiz-intro-skip').click(); await p.waitForTimeout(1500);
  console.log(w, h, await p.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('*')) { const o = getComputedStyle(e).overflowY; if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1) out.push([e.tagName, e.getAttribute('data-testid') || e.className.toString().slice(0, 40), e.scrollHeight, e.clientHeight]); }
    return { doc: [document.documentElement.scrollHeight, innerHeight], scrollers: out };
  }));
}
await b.close(); server.close();
