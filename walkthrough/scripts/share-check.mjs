// Opens the demo, adds a plant with care and a new leaf, opens Share, screenshots the sheet and checks the exported PNGs.
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import fs from 'node:fs';
const server = await startServer(4181);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4181/'); await p.waitForTimeout(1500); await p.mouse.click(195, 300);
await $('onboarding-continue').click(); await $('signup-submit').click();
for (let i = 0; i < 3; i++) await $('onboarding-continue').click();
await $('hemisphere-north').click(); await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(1500); await $('plan-start').click(); await p.waitForTimeout(2500);
const day = (n) => new Date(Date.now() - n * 86400000).toISOString();
const id = await p.evaluate(async () => {
  const post = async (path, body) => (await fetch('http://mock.local/api' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  const plant = await post('/plants', { nickname: 'Monty', common_name: 'Monstera', latin_name: 'Monstera deliciosa', watering_frequency_days: 7 });
  await post(`/plants/${plant.id}/care-logs`, { actions: ['water'], notes: '' });
  await post(`/plants/${plant.id}/care-logs`, { actions: ['new_leaf'], notes: '' });
  return plant.id;
});
await p.evaluate((pid) => { window.history.pushState({}, '', `/plants/${pid}`); window.dispatchEvent(new PopStateEvent('popstate')); }, id);
// A real picture, chosen by the reviewer, stays in the tab only.
await $('plant-detail-hero').waitFor();
await p.locator('input[type=file]').first().setInputFiles('../grove-frontend/public/photos/soil-card-2.jpg');
await p.waitForTimeout(1200);
const heroSrc = await $('plant-detail-hero').locator('img').first().getAttribute('src');
console.log('hero shows picked photo:', /^blob:/.test(heroSrc || ''), '| photo note:', await p.locator('[data-demo-photo-note]').count());
// Sharing from the journal's new-leaf milestone opens on the new-leaf card.
await p.getByRole('button', { name: /Share: First new leaf/ }).click();
await $('share-save').waitFor(); await p.waitForTimeout(600);
console.log('milestone opens on:', await $('share-preview').locator('img').getAttribute('alt'));
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
await $('plant-share-button').click();
await $('share-save').waitFor();
await p.waitForTimeout(800);
await p.screenshot({ path: '.cache/share-sheet.png' });
const kinds = await $('share-cards').locator('button').count();
console.log('cards offered:', kinds);
const out = {};
for (let i = 0; i < kinds; i++) {
  await $('share-cards').locator('button').nth(i).click();
  await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), $('share-save').click()]);
  const file = `.cache/share-${i}-${dl.suggestedFilename()}`; await dl.saveAs(file); out[i] = file;
  if (i === 1) await p.screenshot({ path: '.cache/share-sheet-sticker.png' });
}
await $('share-cards').locator('button').nth(kinds - 1).click(); await p.waitForTimeout(500);
await p.screenshot({ path: '.cache/share-sheet-card.png' });
// Leaving the demo forgets the picture: a reload restarts with no plant and no photo.
await p.reload(); await p.waitForTimeout(1500);
console.log('after reload, picked photo still reachable:', await p.evaluate(async () => { try { const r = await fetch('http://demo.local/photo/1'); return r.ok; } catch { return false; } }));
console.log(out, 'page errors:', errs);
await b.close(); server.close();
