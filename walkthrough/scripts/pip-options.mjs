// Visual mockups of the Pip placement options, drawn over the real Today screen with the real Pip sprite. Throwaway.
import { chromium } from 'playwright';
import fs from 'node:fs';
const bundle = fs.readFileSync('.cache/mock/pip-bundle.js', 'utf8');
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(8000);
const $ = (id) => p.getByTestId(id);
await p.goto('http://localhost:4174/'); await p.waitForTimeout(1500);
await p.mouse.click(195, 300);
for (let i = 0; i < 4; i++) { await $('onboarding-continue').click(); await p.waitForTimeout(400); }
await $('signup-submit').click(); await $('hemisphere-north').click(); await $('quiz-intro-start').click();
for (let i = 0; i < 4; i++) await $('question-skip').click();
await p.waitForTimeout(1500); await $('plan-start').click();
for (let i = 0; i < 4; i++) await $('lesson-next').click();
await $('soil-step-add-plant').click(); await $('add-option-manual').click();
await $('species-search-input').fill('spider'); await p.waitForTimeout(800); await $('species-option').first().click();
await p.getByRole('button', { name: /add a photo/i }).click(); await $('photo-skip').click();
await p.waitForTimeout(6000); await p.getByRole('link', { name: 'Today' }).click(); await p.waitForTimeout(800);
await $('next-lesson-start').scrollIntoViewIfNeeded(); await $('next-lesson-start').click(); await p.waitForTimeout(800);
await $('soil-outcome-dry').click(); await $('soil-decision-water').click(); await $('soil-step-submit').click(); await p.waitForTimeout(700);
await $('soil-step-continue').click(); await p.waitForTimeout(1000); await $('first-care-celebration-cta').click(); await p.waitForTimeout(1500);
await $('nook-offer-yes').click(); await p.waitForTimeout(1000);
await p.getByRole('link', { name: 'Today' }).click(); await p.waitForTimeout(1200);
await p.evaluate(() => window.scrollTo(0, 0));
await p.addScriptTag({ content: bundle });

const shot = async (name) => { await p.waitForTimeout(300); await p.screenshot({ path: `.cache/mock/${name}.png` }); };
await shot('0-today-now');

// A: fourth bottom tab "Pip", with Pip leaning over the tab's top edge.
await p.evaluate(() => {
  const nav = document.querySelector('[data-testid=bottom-nav]'); const grid = nav.querySelector('.grid');
  grid.className = grid.className.replace('grid-cols-3', 'grid-cols-4');
  const tab = grid.lastElementChild.cloneNode(true); tab.dataset.mock = '1';
  tab.removeAttribute('aria-current'); tab.className = tab.className.replace('text-grove-cream', 'text-grove-sage');
  tab.querySelectorAll('span[aria-hidden]').forEach((s) => s.remove());
  const icon = tab.querySelector('svg'); const box = document.createElement('div'); box.style.cssText = 'height:20px;width:20px;position:relative';
  icon.replaceWith(box); tab.querySelector('span').textContent = 'Pip';
  const c = window.__pipCanvas(3); c.style.cssText += ';position:absolute;left:50%;transform:translateX(-50%);bottom:-2px'; box.appendChild(c);
  grid.appendChild(tab);
});
await shot('A-tab-with-peek');
await p.evaluate(() => { const g = document.querySelector('[data-testid=bottom-nav] .grid'); g.querySelector('[data-mock]').remove(); g.className = g.className.replace('grid-cols-4', 'grid-cols-3'); });

// C: Pip button in the header, and a large Pip card above the fold.
await p.evaluate(() => {
  const bell = document.querySelector('[data-testid=notification-bell]'); const btn = bell.cloneNode(false); btn.dataset.mock = '1';
  btn.innerHTML = ''; btn.style.position = 'relative'; btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.justifyContent = 'center';
  btn.appendChild(window.__pipCanvas(2)); bell.parentElement.insertBefore(btn, bell);
  const search = [...document.querySelectorAll('button,a,input')].find((e) => /Search plants/.test((e.textContent || '') + (e.placeholder || ''))); const anchor = search;
  const card = document.createElement('div'); card.dataset.mock = '1';
  card.style.cssText = 'margin:12px 16px;border:1px solid #3C4D26;border-radius:16px;background:#2E3A1E;padding:14px;display:flex;gap:14px;align-items:center';
  const room = document.createElement('div'); room.style.cssText = 'width:120px;height:84px;border-radius:10px;background:#E9DFCB;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;flex:none';
  room.appendChild(window.__pipCanvas(5));
  const txt = document.createElement('div'); txt.innerHTML = '<div style="font:600 13px Alegreya Sans;color:#A9C5A0">From Pip</div><div style="font:500 16px Alegreya Sans;color:#F4F1E6;margin:2px 0 8px">Pip is here when you want a quiet moment.</div><div style="display:inline-block;background:#92B44B;color:#0B0F08;border-radius:999px;padding:8px 14px;font:600 15px Alegreya Sans">Visit Pip</div>';
  card.append(room, txt); anchor.parentElement.insertBefore(card, anchor.nextSibling);
});
await shot('C-header-plus-card');
await p.evaluate(() => document.querySelectorAll('[data-mock]').forEach((e) => e.remove()));

// D: Pip sitting on the middle of the bar (the naive version).
await p.evaluate(() => {
  const nav = document.querySelector('[data-testid=bottom-nav]'); const c = window.__pipCanvas(5); c.dataset.mock = '1';
  c.style.cssText += ';position:absolute;left:50%;transform:translateX(-50%);top:-34px;pointer-events:none'; nav.appendChild(c);
});
await shot('D-peek-on-bar');
await p.evaluate(() => document.querySelectorAll('[data-mock]').forEach((e) => e.remove()));

// E: a Pip tab in Today's top strip, beside Progress.
await p.evaluate(() => {
  const prog = document.querySelector('[data-testid=care-growth-tab]'); const tab = prog.cloneNode(true); tab.dataset.mock = '1';
  tab.removeAttribute('aria-current'); tab.removeAttribute('data-testid');
  tab.innerHTML = ''; tab.style.cssText += ';display:inline-flex;align-items:center;gap:6px';
  const cv = window.__pipCanvas(2); tab.append(cv, document.createTextNode('Pip')); prog.parentElement.appendChild(tab);
  const strip = prog.parentElement; strip.querySelectorAll('[class*=border-b-2], [aria-current]').forEach(() => {});
});
await shot('E-top-strip-tab');
await b.close();
