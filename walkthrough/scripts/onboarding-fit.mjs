// Walks the whole first-run flow at several phone sizes and reports which screens need scrolling.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
const server = await startServer(4182);
const b = await chromium.launch();
const sizes = process.argv[2] ? [process.argv[2].split('x').map(Number)] : [[430, 932], [393, 852], [390, 844], [375, 812], [360, 740], [375, 667]];
const rows = {};
for (const [w, h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.setDefaultTimeout(40000);
  const $ = (id) => p.getByTestId(id);
  const measure = async (label) => {
    await p.waitForTimeout(450);
    const over = await p.evaluate(() => {
      const gw = document.querySelector('.gw'); if (gw) return gw.scrollHeight - gw.clientHeight;
      const f = document.querySelector('[data-testid=onboarding-flow]'); return f ? f.scrollHeight - f.clientHeight : null;
    });
    (rows[label] = rows[label] || {})[`${w}x${h}`] = over;
  };
  await p.goto('http://localhost:4182/');
  await p.waitForSelector('[data-testid=launch-intro], [data-testid=onboarding-continue]', { timeout: 40000 });
  if (await p.locator('[data-testid=launch-intro]').count()) await p.mouse.click(w / 2, 200);
  await p.waitForSelector('[data-testid=onboarding-continue]'); await p.mouse.click(w / 2, 200);
  await measure('1 welcome');
  await $('onboarding-continue').click(); await $('signup-submit').waitFor(); await measure('2 account');
  await $('signup-submit').click(); await $('steps-list').waitFor(); await measure('3 steps');
  await $('onboarding-continue').click(); await p.waitForTimeout(300); await measure('4 slide 1');
  await $('onboarding-continue').click(); await p.waitForTimeout(300); await measure('5 slide 2');
  await $('onboarding-continue').click(); await $('hemisphere-north').waitFor(); await measure('6 hemisphere');
  await $('hemisphere-north').click(); await $('quiz-intro-start').waitFor(); await measure('7 quiz intro');
  await $('quiz-intro-start').click(); await $('question-skip').waitFor(); await measure('8 question 1');
  for (const n of [2, 3, 4]) { await $('question-skip').click(); await p.waitForTimeout(250); await measure(`${7 + n} question ${n}`); }
  await $('question-skip').click(); await $('plan-start').waitFor(); await p.waitForTimeout(800); await measure('12 plan');
  await p.close();
}
await b.close(); server.close();
const cols = Object.keys(Object.values(rows)[0]);
console.log('overflow in px (0 = fits, no scrolling)');
console.log('screen'.padEnd(16) + cols.map((c) => c.padStart(9)).join(''));
for (const [k, v] of Object.entries(rows)) console.log(k.padEnd(16) + cols.map((c) => String(v[c] ?? '-').padStart(9)).join(''));
