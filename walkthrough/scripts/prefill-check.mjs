import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const r = p.frameLocator('iframe').first();
await p.goto('http://localhost:4174/'); await p.waitForTimeout(1500);
await p.mouse.click(640, 300);
for (let i = 0; i < 4; i++) { await r.getByTestId('onboarding-continue').click(); await p.waitForTimeout(500); }
console.log('email:', await r.getByTestId('signup-email').inputValue(), '| password length:', (await r.getByTestId('signup-password').inputValue()).length);
await r.getByTestId('signup-submit').click(); await p.waitForTimeout(1200);
console.log('after submit, hemisphere shown:', await r.getByTestId('hemisphere-north').isVisible());
await b.close();
