// Drives demo/site with NO request mocking: proves the in-browser backend carries the whole flow.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { startServer } from './serve.mjs';


const mode = process.argv[2] || 'mobile';
const out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const server = await startServer(4175);
const browser = await chromium.launch();
const viewport = mode === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 };
const ctx = await browser.newContext({ viewport, deviceScaleFactor: mode === 'mobile' ? 2 : 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const warnings = []; const errors = []; const external = [];
page.on('console', (m) => { const t = m.text(); if (t.includes('[demo]')) warnings.push(t); else if (m.type() === 'error') errors.push(t.slice(0, 140)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 140)));
page.on('request', (r) => { const u = r.url(); if (!u.startsWith('http://localhost:4175') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
const root = mode === 'mobile' ? page : page.frameLocator('iframe').first();
const $ = (id) => root.getByTestId(id);
let n = 0; const fails = [];
const step = async (label, fn) => { try { await fn(); console.log('ok  ', label); } catch (e) { console.log('FAIL', label); fails.push(label + ': ' + e.message.split('\n')[0]); } await page.waitForTimeout(450); await page.screenshot({ timeout: 15000, path: `${out}/${String(++n).padStart(2, '0')}-${label}.png` }); };

await page.goto('http://localhost:4175/', { timeout: 30000 });
await page.waitForTimeout(1200);
await step('welcome', async () => { await page.mouse.click(195, 300); await $('onboarding-continue').click({ timeout: 15000 }); });
for (let i = 1; i <= 3; i++) await step(`intro-${i}`, async () => { await $('onboarding-continue').click({ timeout: 4000 }); });
await step('account', async () => { await $('signup-email').fill('maya@example.com'); await $('signup-password').fill('growgrove1'); await $('signup-submit').click(); });
await step('hemisphere', async () => { await $('hemisphere-north').click({ timeout: 4000 }); });
await step('quiz-start', async () => { await $('quiz-intro-start').click({ timeout: 4000 }); });
await step('q1', async () => { await root.locator('[data-testid^="option-q1"]').first().click(); await $('question-next').click(); });
for (const q of ['q2', 'q3', 'q4']) await step(`${q}-skip`, async () => { await $('question-skip').click({ timeout: 4000 }); });
await step('plan', async () => { await page.waitForTimeout(1200); await $('plan-start').click({ timeout: 5000 }); });
for (let i = 1; i <= 4; i++) await step(`card-${i}`, async () => { await $('lesson-next').click({ timeout: 4000 }); });
await step('add-plant', async () => { await $('soil-step-add-plant').click({ timeout: 4000 }); });
await step('manual', async () => { await $('add-option-manual').click({ timeout: 4000 }); });
await step('search', async () => { await $('species-search-input').fill('spider'); await page.waitForTimeout(800); await $('species-option').first().click({ timeout: 4000 }); });
await step('photo', async () => { await root.getByRole('button', { name: /add a photo/i }).click({ timeout: 4000 }); await $('photo-skip').click({ timeout: 4000 }); await page.waitForTimeout(1000); });
await step('today', async () => { await page.waitForTimeout(5000); await root.getByRole('link', { name: 'Today' }).click({ timeout: 4000 }); await page.waitForTimeout(800); });
await step('resume', async () => { await $('next-lesson-start').scrollIntoViewIfNeeded(); await $('next-lesson-start').click({ timeout: 4000 }); await page.waitForTimeout(800); });
await step('log', async () => { await $('soil-outcome-dry').click(); await $('soil-decision-water').click(); await $('soil-step-submit').click(); await page.waitForTimeout(700); await $('soil-step-continue').click(); await page.waitForTimeout(1000); });
await step('celebrate', async () => { await $('first-care-celebration-cta').click({ timeout: 4000 }); await page.waitForTimeout(1200); });
await step('offer', async () => { await $('nook-offer-yes').click({ timeout: 4000 }); await page.waitForTimeout(900); });
await step('today-pip', async () => { await root.getByRole('link', { name: 'Today' }).click({ timeout: 4000 }); await page.waitForTimeout(1000); await $('pip-note-thumb').click({ timeout: 4000 }); await page.waitForTimeout(1200); });
// Wander: places a curious reviewer would tap.
for (const [name, link] of [['plants', 'Plants'], ['learn', 'Learn']]) await step(`wander-${name}`, async () => { await root.getByRole('link', { name: link }).click({ timeout: 4000 }); await page.waitForTimeout(1000); });
await step('wander-plant-detail', async () => { await root.getByRole('link', { name: 'Plants' }).click(); await root.getByTestId('collection-grid-plant-tile').first().click({ timeout: 4000 }); await page.waitForTimeout(1200); });
await step('wander-guide-species', async () => { await root.getByRole('link', { name: 'Learn' }).click(); await page.waitForTimeout(800); await root.getByText('Monstera', { exact: false }).first().click({ timeout: 4000 }); await page.waitForTimeout(1200); });
await step('wander-progress', async () => { await root.getByTestId('species-back-button').click({ timeout: 4000 }).catch(() => {}); await root.getByRole('link', { name: 'Today' }).click(); await root.getByTestId('care-growth-tab').click({ timeout: 4000 }); await page.waitForTimeout(1000); });
await step('wander-profile', async () => { await root.getByTestId('header-profile-button').click({ timeout: 4000 }); await page.waitForTimeout(1000); });
await step('wander-bell', async () => { await root.getByTestId('notification-bell').click({ timeout: 4000 }); await page.waitForTimeout(1000); });
// Restart control brings back the welcome screen.
await step('restart', async () => { if (mode === 'mobile') await page.reload(); else await page.locator('[data-demo-ui] button').click({ timeout: 4000 }); await page.waitForTimeout(1500); await $('onboarding-continue').waitFor({ timeout: 6000 }); });

console.log(`MODE ${mode}\nFAILED STEPS:`, fails.length ? fails : 'none');
console.log('NOT-IN-DEMO requests:', [...new Set(warnings)]);
console.log('console errors:', [...new Set(errors)]);
console.log('external requests:', [...new Set(external)]);
await browser.close(); server.close();
