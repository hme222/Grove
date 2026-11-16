// Verification pass for the Profile tile hub (task 11). Real Chromium, production build, mock API only.
//
//   cd grove-frontend && REACT_APP_BACKEND_URL=http://mock.local BUILD_PATH=../walkthrough/app-build npx craco build
//   cd ../walkthrough && node scripts/profile-hub-check.mjs
//
// Serves walkthrough/app-build and answers http://mock.local with scripts/mock.mjs (Playwright routes). Every other
// non-localhost request is aborted, so nothing reaches a real backend or outside service. The session is seeded
// through the mock (register, then mark onboarding done) instead of clicking through the first-run flow.
// A save failure is forced by one extra route in this file (PATCH /users/me answers 500 while `patchMode` is 'fail'),
// so mock-core.mjs is unchanged. Prints one line per assertion: "ok ..." or "FAIL ...". Screenshots go to
// walkthrough/shots/profile-hub/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';
import { createMock } from './mock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(here, '../shots/profile-hub');
fs.mkdirSync(SHOTS, { recursive: true });
const PORT = 4201;
const ORIGIN = `http://localhost:${PORT}`;
const VIEW = { width: 390, height: 844 };
const SHEET_TILES = [
  { tile: 'profile-tile-tutorials', sheet: 'tutorials-sheet' },
  { tile: 'profile-tile-care-style', sheet: 'care-style-sheet' },
  { tile: 'profile-tile-home', sheet: 'home-sheet' },
  { tile: 'profile-tile-pip', sheet: 'pip-sheet' },
  { tile: 'profile-about-tile', sheet: 'about-sheet' },
];
const ALL_TILES = ['lessons', 'tutorials', 'care-style', 'home', 'pip', 'notifications'].map((t) => `profile-tile-${t}`);

const results = [];
const check = (ok, name, evidence = '') => {
  results.push({ ok: !!ok, name, evidence });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${evidence ? ` -- ${evidence}` : ''}`);
};
const note = (name, evidence) => { results.push({ ok: null, name, evidence }); console.log(`info ${name} -- ${evidence}`); };

const server = await startServer(PORT);
const browser = await chromium.launch();
let patchMode = 'pass'; // 'pass' | 'fail' | 'delay'

async function newSession({ reducedMotion }) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, hasTouch: false, reducedMotion });
  const unmocked = [];
  // Registered first, so it only sees what no later route claims: block anything that is not the local build.
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === 'localhost') return route.fallback();
    unmocked.push(`${route.request().method()} ${u.href}`);
    return route.abort();
  });
  const mock = createMock({ log: (l) => { if (l.startsWith('UNMOCKED')) unmocked.push(l); } });
  await mock.install(ctx);
  // Forced save failure / slow save for PATCH /users/me. Registered last, so it is matched first.
  await ctx.route('http://mock.local/api/users/me', async (route) => {
    const req = route.request();
    if (req.method() !== 'PATCH' || patchMode === 'pass') return route.fallback();
    if (patchMode === 'delay') { await new Promise((r) => setTimeout(r, 1500)); return route.fallback(); }
    return route.fulfill({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"detail":"forced failure"}' });
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${ORIGIN}/login`);
  await page.evaluate(async () => {
    const post = (p, method, body) => fetch(`http://mock.local/api${p}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
    const reg = await post('/auth/register', 'POST', { email: 'maya@example.com', password: 'x', username: 'maya' });
    await post('/users/me', 'PATCH', { onboarding_complete: true, primary_track: 'rebirth', nook_offered_at: '2026-11-03T10:00:00-05:00', hemisphere: 'north' });
    await post('/plants', 'POST', { common_name: 'Monstera', nickname: 'Monty' });
    localStorage.setItem('grove_access_token', reg.access_token);
    localStorage.setItem('grove_refresh_token', reg.refresh_token);
  });
  await page.goto(`${ORIGIN}/care/today`);
  await page.waitForTimeout(2500);
  // The one-time "Meet Pip" card covers the page for a new account; agree to it so Pip stays on.
  const agree = page.getByTestId('pip-intro-agree');
  if (await agree.waitFor({ timeout: 5000 }).then(() => true, () => false)) { await agree.click(); await page.waitForTimeout(800); }
  return { ctx, page, unmocked, errors };
}

const nav = async (page, to) => {
  await page.evaluate((t) => { history.pushState({}, '', t); window.dispatchEvent(new PopStateEvent('popstate')); }, to);
  await page.waitForTimeout(1200);
};
const big = (page, on) => page.evaluate((v) => { document.documentElement.style.fontSize = v ? '32px' : ''; }, on);
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? (a.getAttribute('data-testid') || `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ''}`) : 'null';
});
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(SHOTS, name), ...opts });
const openSheet = async (page, tile, sheet) => {
  await page.getByTestId(tile).click();
  await page.getByTestId(sheet).waitFor();
  await page.waitForTimeout(700); // past the open animation, and the fade measure
};
const closeSheet = async (page, sheet) => {
  await page.keyboard.press('Escape');
  await page.getByTestId(sheet).waitFor({ state: 'detached' });
  await page.waitForTimeout(300);
};
const inView = (r) => r && r.y >= 0 && r.x >= 0 && r.y + r.height <= VIEW.height && r.x + r.width <= VIEW.width;

// ---------- Pass 1: default text, motion allowed ----------
{
  const { ctx, page, unmocked, errors } = await newSession({ reducedMotion: 'no-preference' });
  await nav(page, '/profile');
  check(await page.getByTestId('profile-tiles').count() === 1, 'default: Profile hub renders', `url ${page.url()}`);
  await shot(page, 'hub-default.png', { fullPage: true });
  const cols = await page.$$eval(ALL_TILES.map((t) => `[data-testid="${t}"]`).join(','), (els) => [...new Set(els.map((e) => e.offsetLeft))].length);
  note('default: hub column count', `${cols} distinct tile offsetLeft values (two columns expected at default text)`);
  for (const { tile, sheet } of SHEET_TILES) {
    await openSheet(page, tile, sheet);
    await shot(page, `${sheet}-default.png`);
    await closeSheet(page, sheet);
  }
  // Check-ins surfaces built in the same plan.
  await nav(page, '/care/growth');
  await shot(page, 'care-growth-default.png', { fullPage: true });
  await nav(page, '/care/today');
  const line = page.getByTestId('care-checkins-line');
  note('default: care-checkins-line on /care/today', (await line.count()) ? `"${await line.textContent()}"` : 'not shown (no check-ins in mock data)');
  await shot(page, 'care-today-default.png', { fullPage: true });
  note('pass 1 page errors', errors.length ? errors.join(' | ') : 'none');
  note('pass 1 blocked/unmocked requests', unmocked.length ? [...new Set(unmocked)].join(' | ') : 'none');
  await ctx.close();
}

// ---------- Pass 2: 200% text, reduced motion ----------
{
  const { ctx, page, unmocked, errors } = await newSession({ reducedMotion: 'reduce' });
  await nav(page, '/profile');
  await big(page, true);
  await page.waitForTimeout(500);
  await shot(page, 'hub-200.png', { fullPage: true });

  const lefts = await page.$$eval(ALL_TILES.map((t) => `[data-testid="${t}"]`).join(','), (els) => els.map((e) => e.offsetLeft));
  check(lefts.length === 6 && new Set(lefts).size === 1, '200%: hub is one column (every tile offsetLeft equal)', `offsetLeft ${JSON.stringify(lefts)}`);

  const overflow = await page.$$eval(ALL_TILES.map((t) => `[data-testid="${t}"]`).join(','), (tiles) => tiles.flatMap((t) =>
    [t, ...t.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth && el.clientWidth > 0)
      .map((el) => `${t.dataset.testid} > ${el.dataset.testid || el.tagName.toLowerCase()} (${el.scrollWidth}>${el.clientWidth})`)));
  check(overflow.length === 0, '200%: no element inside a tile has scrollWidth > clientWidth', overflow.length ? overflow.join('; ') : 'checked all 6 tiles and descendants');

  for (const { tile, sheet } of SHEET_TILES) {
    await openSheet(page, tile, sheet);
    const body = page.getByTestId(`${sheet}-body`);
    const dims = await body.evaluate((b) => ({ sh: b.scrollHeight, ch: b.clientHeight, st: b.scrollTop }));
    const fadeOnOpen = await page.getByTestId(`${sheet}-fade`).isVisible().catch(() => false);
    const scrolls = dims.sh - dims.ch > 1;
    await shot(page, `${sheet}-200-top.png`);
    if (scrolls) check(fadeOnOpen, `200%: ${sheet} fade visible on open without scrolling`, `scrollHeight ${dims.sh} clientHeight ${dims.ch} scrollTop ${dims.st}`);
    else check(!fadeOnOpen, `200%: ${sheet} fits, so no fade`, `scrollHeight ${dims.sh} clientHeight ${dims.ch} fade ${fadeOnOpen}`);
    await body.evaluate((b) => { b.scrollTop = b.scrollHeight; });
    await page.waitForTimeout(400);
    const titleBox = await page.getByTestId(`${sheet}-title`).boundingBox();
    const closeBox = await page.getByTestId(`${sheet}-close`).boundingBox();
    check(inView(titleBox) && inView(closeBox), `200%: ${sheet} title and close stay in the viewport after scrolling the body to the bottom`,
      `title ${JSON.stringify(titleBox)} close ${JSON.stringify(closeBox)}`);
    const fadeAfter = await page.getByTestId(`${sheet}-fade`).count();
    if (scrolls) check(fadeAfter === 0, `200%: ${sheet} fade gone after scrolling to the bottom`, `fade elements ${fadeAfter}`);
    await shot(page, `${sheet}-200-bottom.png`);
    await closeSheet(page, sheet);
  }
  note('pass 2 page errors', errors.length ? errors.join(' | ') : 'none');
  note('pass 2 blocked/unmocked requests', unmocked.length ? [...new Set(unmocked)].join(' | ') : 'none');
  await ctx.close();
}

// ---------- Pass 3: keyboard only, back gesture, focus on save, forced save failure ----------
{
  const { ctx, page, unmocked, errors } = await newSession({ reducedMotion: 'reduce' });
  const tabTo = async (testId, max = 80) => {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      if ((await active(page)) === testId) return i + 1;
    }
    return 0;
  };
  await nav(page, '/profile');

  for (const { tile, sheet } of SHEET_TILES) {
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    const presses = await tabTo(tile);
    check(presses > 0, `keyboard: Tab reaches ${tile}`, `${presses} Tab presses`);
    if (!presses) continue;
    await page.keyboard.press('Enter');
    await page.getByTestId(sheet).waitFor();
    await page.waitForTimeout(400);
    const first = await active(page);
    const stops = [];
    let escaped = false;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate((s) => !!document.activeElement && !!document.activeElement.closest(`[data-testid="${s}"]`), sheet);
      stops.push(await active(page));
      if (!inside) escaped = true;
    }
    check(!escaped, `keyboard: focus stays inside ${sheet} over 25 Tabs`, `opened on ${first}; stops ${[...new Set(stops)].join(', ')}`);
    await page.keyboard.press('Escape');
    await page.getByTestId(sheet).waitFor({ state: 'detached' });
    await page.waitForTimeout(200);
    const back = await active(page);
    check(back === tile, `keyboard: Escape closes ${sheet} and focus returns to ${tile}`, `activeElement ${back}`);
  }
  for (const [tile, to] of [['profile-tile-lessons', '/lessons'], ['profile-tile-notifications', '/settings/notifications']]) {
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    const presses = await tabTo(tile);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    check(presses > 0 && new URL(page.url()).pathname === to, `keyboard: Tab to ${tile} and Enter goes to ${to}`, `${presses} Tabs, url ${new URL(page.url()).pathname}`);
    await nav(page, '/profile');
  }

  // Extra 1: back gesture, and no stray entry after a normal close. Arrive at /profile from /care/today.
  await nav(page, '/care/today');
  await nav(page, '/profile');
  const h0 = await page.evaluate(() => history.length);
  await openSheet(page, 'profile-tile-home', 'home-sheet');
  const h1 = await page.evaluate(() => ({ len: history.length, state: history.state && history.state.groveSheet }));
  await page.goBack();
  await page.waitForTimeout(600);
  const goneBack = (await page.getByTestId('home-sheet').count()) === 0;
  const urlBack = new URL(page.url()).pathname;
  const focusBack = await active(page);
  check(goneBack && urlBack === '/profile' && focusBack === 'profile-tile-home', 'back gesture: goBack closes the sheet, stays on /profile, focus on the tile',
    `history.length before ${h0}, open ${h1.len} (state ${h1.state}); after back: sheet gone ${goneBack}, url ${urlBack}, focus ${focusBack}`);
  const h2 = await page.evaluate(() => history.length);
  await openSheet(page, 'profile-tile-home', 'home-sheet');
  await closeSheet(page, 'home-sheet');
  await page.waitForTimeout(300);
  const h3 = await page.evaluate(() => ({ len: history.length, state: history.state && history.state.groveSheet, path: location.pathname }));
  check(h3.len === h2 && !h3.state && h3.path === '/profile', 'back gesture: Escape close leaves history.length unchanged and no sheet entry on top',
    `history.length before open ${h2}, after Escape ${h3.len}, top state groveSheet ${h3.state || 'none'}, path ${h3.path}`);
  await page.goBack();
  await page.waitForTimeout(800);
  const leftTo = new URL(page.url()).pathname;
  check(leftTo === '/care/today', 'back gesture: one more back after the Escape close leaves /profile (no stray entry)', `landed on ${leftTo}`);
  await nav(page, '/profile');

  // Extra 3: focus after a keyboard toggle that saves. Slow the save so the busy window can be observed.
  for (const mode of ['pass', 'delay']) {
    patchMode = mode;
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    await tabTo('profile-tile-care-style');
    await page.keyboard.press('Enter');
    await page.getByTestId('care-style-sheet').waitFor();
    await page.waitForTimeout(400);
    const n = await tabTo('profile-prefer-manual-toggle', 20);
    const before = await page.getByTestId('profile-prefer-manual-toggle').getAttribute('aria-checked');
    await page.evaluate(() => { document.querySelector('[data-testid="profile-prefer-manual-toggle"]').__probe = 1; });
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    const during = await active(page);
    const disabledDuring = await page.getByTestId('profile-prefer-manual-toggle').isDisabled();
    await page.waitForTimeout(mode === 'delay' ? 2000 : 600);
    const after = await active(page);
    const checkedAfter = await page.getByTestId('profile-prefer-manual-toggle').getAttribute('aria-checked');
    const sameNode = await page.evaluate(() => document.querySelector('[data-testid="profile-prefer-manual-toggle"]').__probe === 1);
    const ok = after === 'profile-prefer-manual-toggle';
    check(ok, `focus on save (${mode === 'delay' ? '1.5 s save' : 'instant save'}): focus stays on the switch after Space`,
      `${n} Tabs to switch; aria-checked ${before} -> ${checkedAfter}; 150 ms after Space: active ${during}, disabled ${disabledDuring}; after save: active ${after}; same DOM node (not remounted) ${sameNode}`);
    await page.keyboard.press('Escape');
    await page.getByTestId('care-style-sheet').waitFor({ state: 'detached' }).catch(() => {});
    await page.waitForTimeout(300);
    if (await page.getByTestId('care-style-sheet').count()) { await page.getByTestId('care-style-sheet-close').click(); await page.waitForTimeout(300); }
  }
  patchMode = 'pass';

  // Extra 4: forced save failure, on the sheet and on Today.
  patchMode = 'fail';
  await openSheet(page, 'profile-tile-care-style', 'care-style-sheet');
  await page.getByTestId('care-text-detailed').click();
  await page.waitForTimeout(600);
  await page.getByTestId('profile-prefer-manual-toggle').click();
  await page.waitForTimeout(600);
  const sheetErr = await page.getByTestId('care-text-error').textContent().catch(() => null);
  const manualErr = await page.getByTestId('manual-entry-error').textContent().catch(() => null);
  check(!!sheetErr && !!manualErr, 'save failure: sheet shows inline errors', `care-text-error "${sheetErr}", manual-entry-error "${manualErr}"`);
  const errColor = await page.getByTestId('care-text-error').evaluate((e) => getComputedStyle(e).color).catch(() => 'n/a');
  const sheetBg = await page.getByTestId('care-style-sheet').evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => 'n/a');
  note('save failure: sheet error colors', `text ${errColor} on sheet background ${sheetBg}`);
  await shot(page, 'error-care-style-sheet.png');
  await page.getByTestId('care-style-sheet-close').click();
  await page.waitForTimeout(400);
  await nav(page, '/care/today');
  await page.getByTestId('care-text-toggle').scrollIntoViewIfNeeded();
  await page.getByTestId('care-text-detailed').click();
  await page.waitForTimeout(600);
  const todayErr = page.getByTestId('care-text-error');
  const todayText = await todayErr.textContent().catch(() => null);
  check(!!todayText, 'save failure: /care/today shows the error under the Care tips toggle', `"${todayText}"`);
  const todayColor = await todayErr.evaluate((e) => getComputedStyle(e).color).catch(() => 'n/a');
  note('save failure: Today error color', todayColor);
  const box = await page.getByTestId('care-text-toggle').boundingBox();
  const eb = await todayErr.boundingBox().catch(() => null);
  if (box && eb) {
    const y = Math.max(0, box.y - 16);
    await shot(page, 'error-care-today.png', { clip: { x: 0, y, width: VIEW.width, height: Math.min(VIEW.height - y, eb.y + eb.height + 16 - y) } });
  } else await shot(page, 'error-care-today.png');
  await shot(page, 'error-care-today-full.png');
  patchMode = 'pass';

  note('pass 3 page errors', errors.length ? errors.join(' | ') : 'none');
  note('pass 3 blocked/unmocked requests', unmocked.length ? [...new Set(unmocked)].join(' | ') : 'none');
  await ctx.close();
}

await browser.close();
server.close();
const fails = results.filter((r) => r.ok === false).length;
const oks = results.filter((r) => r.ok === true).length;
console.log(`\n${oks} ok, ${fails} FAIL. Screenshots in ${path.relative(process.cwd(), SHOTS)}/`);
process.exitCode = fails ? 1 : 0;
