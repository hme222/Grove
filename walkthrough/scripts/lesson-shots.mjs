import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
p.setDefaultTimeout(8000); const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4174/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300);
for (let i = 0; i < 4; i++) { await $('onboarding-continue').click(); await p.waitForTimeout(400); }
await $('signup-submit').click(); await $('hemisphere-north').click(); await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(1500); await $('plan-start').click(); await p.waitForTimeout(800);
for (let i = 1; i <= 4; i++) { await p.screenshot({ path: `.cache/lesson-card-${i}.png` }); await $('lesson-next').click(); await p.waitForTimeout(500); }
await p.screenshot({ path: '.cache/lesson-card-5.png' });
await p.goto('http://localhost:4174/'); await b.close();
