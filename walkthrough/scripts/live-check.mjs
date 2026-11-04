import { chromium } from 'playwright';
const url = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const ext = []; const errs = [];
p.on('request', (r) => { const u = r.url(); if (!u.startsWith(url) && !u.startsWith('data:') && !u.startsWith('blob:')) ext.push(u); });
p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
p.setDefaultTimeout(10000);
const $ = (id) => p.getByTestId(id);
await p.goto(url); await p.waitForTimeout(1500); await p.mouse.click(195, 300);
for (let i = 0; i < 4; i++) { await $('onboarding-continue').click(); await p.waitForTimeout(400); }
console.log('prefilled email:', await $('signup-email').inputValue());
await $('signup-submit').click(); await $('hemisphere-north').click(); await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(1500); console.log('plan screen:', await $('plan-start').isVisible());
console.log('external requests:', [...new Set(ext)], 'page errors:', errs);
await b.close();
