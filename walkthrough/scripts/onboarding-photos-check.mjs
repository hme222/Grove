// Which onboarding screens show their photo at a given window size? On desktop the demo runs the app in an iframe
// (the phone preview), so this drives that frame when there is one.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const [w, h] = (process.argv[2] || '1280x720').split('x').map(Number);
const server = await startServer(4197);
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); page.setDefaultTimeout(10000);
await page.goto('http://localhost:4197/'); await page.waitForTimeout(1800);
const hasFrame = (await page.locator('iframe').count()) > 0;
const f = hasFrame ? page.frameLocator('iframe').first() : page;
const frame = hasFrame ? page.frames().find((x) => x !== page.mainFrame()) : page;
const $ = (id) => f.getByTestId(id);
await frame.evaluate(() => window.innerWidth).then((iw) => console.log(`${w}x${h} window; app viewport:`, iw, 'x', 0));
const shot = async (name) => {
  await page.waitForTimeout(700);
  const info = await frame.evaluate(() => [...document.querySelectorAll('[data-photo]')].map((e) => { const r = e.getBoundingClientRect(); return `${e.getAttribute('data-photo').split('/').pop()}:${getComputedStyle(e).display === 'none' ? 'HIDDEN' : Math.round(r.width) + 'x' + Math.round(r.height)}`; }));
  const vp = await frame.evaluate(() => `${innerWidth}x${innerHeight}`);
  console.log(`  [${vp}]`, name, info.length ? info.join(' ') : '(no photo element)');
  await page.screenshot({ path: `.cache/obp-${w}x${h}-${name}.png` });
};
await page.mouse.click(w / 2, h / 2);
await shot('welcome');
await f.getByRole('button', { name: /sign up/i }).click(); await shot('account');
await $('signup-submit').click(); await shot('steps');
await $('onboarding-continue').click(); await shot('intro-1');
await $('onboarding-continue').click(); await shot('intro-2');
await $('onboarding-continue').click(); await shot('zone');
await $('hemisphere-north').click(); await shot('quiz-intro');
await b.close(); server.close();
