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
const firstLine = (e) => String((e && e.message) || e).split('\n')[0];
// Runs one check (or group of checks). A throw (missing element, timeout) is recorded as FAIL and the run goes on.
// With a page, it also saves fail-<name>.png so the state at the throw can be seen.
let currentPage = null; // set by pass(), so every step can screenshot on a throw
const step = async (name, fn, page = currentPage) => {
  try { return await fn(); } catch (e) {
    let extra = '';
    if (page) {
      const file = `fail-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
      if (await page.screenshot({ path: path.join(SHOTS, file) }).then(() => true, () => false)) extra = ` (screenshot ${file})`;
      // Recover so one failure does not cascade: close any open dialog and let the sheet's history entry settle.
      for (let i = 0; i < 2 && (await page.locator('[role="dialog"]').count().catch(() => 0)); i++) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.locator('[role="dialog"]').first().waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
      }
      await page.waitForFunction(() => !(history.state && history.state.groveSheet), null, { timeout: 2000 }).catch(() => {});
    }
    check(false, name, `threw: ${firstLine(e)}${extra}`);
    return undefined;
  }
};

let patchMode = 'pass'; // 'pass' | 'fail' | 'delay'
const DELAY_MS = 1500;
const USERS_ME = /^http:\/\/mock\.local\/api\/users\/me\/?(\?.*)?$/;
let server;
let browser;

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
  // Forced save failure / slow save for PATCH /users/me (query string or trailing slash tolerated). Registered last,
  // so it is matched first.
  await ctx.route(USERS_ME, async (route) => {
    const req = route.request();
    if (req.method() !== 'PATCH' || patchMode === 'pass') return route.fallback();
    if (patchMode === 'delay') { await new Promise((r) => setTimeout(r, DELAY_MS)); return route.fallback(); }
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
  await page.getByTestId('bottom-nav').waitFor().catch(() => {});
  // The one-time "Meet Pip" card covers the page for a new account; agree to it so Pip stays on.
  const agree = page.getByTestId('pip-intro-agree');
  if (await agree.waitFor({ timeout: 6000 }).then(() => true, () => false)) {
    await agree.click();
    await agree.waitFor({ state: 'detached' }).catch(() => {});
  }
  return { ctx, page, unmocked, errors };
}

// Each pass gets its own context; a throw that escapes every step is a FAIL, and the context is always closed.
async function pass(name, opts, fn) {
  let s;
  try {
    s = await newSession(opts);
    currentPage = s.page;
    await fn(s);
  } catch (e) {
    check(false, `${name}: pass aborted`, `threw: ${firstLine(e)}`);
  } finally {
    if (s) {
      note(`${name} page errors`, s.errors.length ? s.errors.join(' | ') : 'none');
      note(`${name} blocked/unmocked requests`, s.unmocked.length ? [...new Set(s.unmocked)].join(' | ') : 'none');
      await s.ctx.close().catch(() => {});
      currentPage = null;
    }
  }
}

const nav = async (page, to) => {
  await page.evaluate((t) => { history.pushState({}, '', t); window.dispatchEvent(new PopStateEvent('popstate')); }, to);
  await page.waitForTimeout(1200); // route data loads; harmless fixed settle
};
const big = (page, on) => page.evaluate((v) => { document.documentElement.style.fontSize = v ? '32px' : ''; }, on);
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? (a.getAttribute('data-testid') || `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ''}`) : 'null';
});
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(SHOTS, name), ...opts });
// Wait until no animation is running in the sheet, then two frames so ResizeObserver/fade measure has run.
const settled = (page, sheet) => page.waitForFunction((s) => {
  const el = document.querySelector(`[data-testid="${s}"]`);
  if (!el) return false;
  return el.getAnimations({ subtree: true }).every((a) => a.playState !== 'running');
}, sheet).then(() => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))));
const openSheet = async (page, tile, sheet, how = 'click') => {
  if (how === 'click') await page.getByTestId(tile).click(); else await page.keyboard.press('Enter');
  await page.getByTestId(sheet).waitFor({ state: 'visible' });
  await settled(page, sheet);
};
// After a close the sheet pops its own history entry a tick later (history.back() is async). Wait for that, so a
// following pushState navigation is not undone by the late back().
const historySettled = (page) => page.waitForFunction(() => !(history.state && history.state.groveSheet), null, { timeout: 3000 });
const closeSheet = async (page, sheet, how = 'escape') => {
  if (how === 'escape') await page.keyboard.press('Escape'); else await page.getByTestId(`${sheet}-close`).click();
  await page.getByTestId(sheet).waitFor({ state: 'detached' });
  await historySettled(page);
};
const inView = (r) => r && r.y >= 0 && r.x >= 0 && r.y + r.height <= VIEW.height && r.x + r.width <= VIEW.width;
const tileSel = ALL_TILES.map((t) => `[data-testid="${t}"]`).join(',');

try {
  server = await startServer(PORT);
  browser = await chromium.launch();

  // ---------- Pass 1: default text, motion allowed ----------
  await pass('pass 1', { reducedMotion: 'no-preference' }, async ({ page }) => {
    await nav(page, '/profile');
    await step('default: Profile hub renders', async () => {
      await page.getByTestId('profile-tiles').waitFor();
      check(true, 'default: Profile hub renders', `url ${page.url()}`);
    });
    await shot(page, 'hub-default.png', { fullPage: true });
    await step('default: hub column count', async () => {
      const cols = await page.$$eval(tileSel, (els) => [...new Set(els.map((e) => e.offsetLeft))].length);
      note('default: hub column count', `${cols} distinct tile offsetLeft values (two columns expected at default text)`);
    });
    for (const { tile, sheet } of SHEET_TILES) {
      await step(`default: open/close ${sheet}`, async () => {
        await openSheet(page, tile, sheet);
        await shot(page, `${sheet}-default.png`);
        await closeSheet(page, sheet);
      });
    }
    await nav(page, '/care/growth');
    await shot(page, 'care-growth-default.png', { fullPage: true });
    await nav(page, '/care/today');
    const line = page.getByTestId('care-checkins-line');
    note('default: care-checkins-line on /care/today', (await line.count()) ? `"${await line.textContent()}"` : 'not shown (no check-ins in mock data)');
    await shot(page, 'care-today-default.png', { fullPage: true });
  });

  // ---------- Pass 2: 200% text, reduced motion ----------
  await pass('pass 2', { reducedMotion: 'reduce' }, async ({ page }) => {
    await nav(page, '/profile');
    await big(page, true);
    await page.waitForFunction(() => getComputedStyle(document.documentElement).fontSize === '32px');
    await shot(page, 'hub-200.png', { fullPage: true });

    await step('200%: hub is one column (every tile offsetLeft equal)', async () => {
      const lefts = await page.$$eval(tileSel, (els) => els.map((e) => e.offsetLeft));
      check(lefts.length === 6 && new Set(lefts).size === 1, '200%: hub is one column (every tile offsetLeft equal)', `offsetLeft ${JSON.stringify(lefts)}`);
    });
    await step('200%: no element inside a tile has scrollWidth > clientWidth', async () => {
      const found = await page.$$eval(tileSel, (tiles) => tiles.length);
      const overflow = await page.$$eval(tileSel, (tiles) => tiles.flatMap((t) =>
        [t, ...t.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth && el.clientWidth > 0)
          .map((el) => `${t.dataset.testid} > ${el.dataset.testid || el.tagName.toLowerCase()} (${el.scrollWidth}>${el.clientWidth})`)));
      check(found === 6 && overflow.length === 0, '200%: no element inside a tile has scrollWidth > clientWidth',
        overflow.length ? overflow.join('; ') : `checked ${found} tiles and descendants`);
    });

    const overflowing = [];
    for (const { tile, sheet } of SHEET_TILES) {
      await step(`200%: ${sheet} checks`, async () => {
        await openSheet(page, tile, sheet);
        const body = page.getByTestId(`${sheet}-body`);
        const fade = page.getByTestId(`${sheet}-fade`);
        const dims = await body.evaluate((b) => ({ sh: b.scrollHeight, ch: b.clientHeight, st: b.scrollTop }));
        const scrolls = dims.sh - dims.ch > 1;
        if (scrolls) overflowing.push(`${sheet} ${dims.sh}>${dims.ch}`);
        const fadeOpacity = await fade.evaluate((e) => Number(getComputedStyle(e).opacity)).catch(() => 0);
        const fadeOnOpen = (await fade.isVisible().catch(() => false)) && fadeOpacity > 0;
        await shot(page, `${sheet}-200-top.png`);
        if (scrolls) check(fadeOnOpen, `200%: ${sheet} fade visible on open without scrolling`, `scrollHeight ${dims.sh} clientHeight ${dims.ch} scrollTop ${dims.st}; fade visible+opacity ${fadeOpacity}`);
        else check(!fadeOnOpen, `200%: ${sheet} fits, so no fade`, `scrollHeight ${dims.sh} clientHeight ${dims.ch} fade ${fadeOnOpen}`);
        await body.evaluate((b) => { b.scrollTop = b.scrollHeight; });
        await page.waitForFunction((s) => { const b = document.querySelector(`[data-testid="${s}-body"]`); return b && b.scrollHeight - b.scrollTop - b.clientHeight <= 1; }, sheet);
        const titleBox = await page.getByTestId(`${sheet}-title`).boundingBox();
        const closeBox = await page.getByTestId(`${sheet}-close`).boundingBox();
        check(inView(titleBox) && inView(closeBox), `200%: ${sheet} title and close stay in the viewport after scrolling the body to the bottom`,
          `title ${JSON.stringify(titleBox)} close ${JSON.stringify(closeBox)}`);
        if (scrolls) {
          // Hidden or detached both count as gone.
          const gone = await fade.waitFor({ state: 'hidden', timeout: 2000 }).then(() => true, () => false);
          check(gone, `200%: ${sheet} fade gone after scrolling to the bottom`, `fade hidden/detached ${gone}, elements ${await fade.count()}`);
        }
        await shot(page, `${sheet}-200-bottom.png`);
        await closeSheet(page, sheet);
      });
    }
    check(overflowing.length > 0, '200%: at least one sheet actually overflows (so the scroll checks are real)', overflowing.join('; ') || 'none overflowed');
  });

  // ---------- Pass 3: keyboard only, back gesture, focus on save, forced save failure ----------
  await pass('pass 3', { reducedMotion: 'reduce' }, async ({ page }) => {
    const tabTo = async (testId, max = 80) => {
      for (let i = 0; i < max; i++) {
        await page.keyboard.press('Tab');
        if ((await active(page)) === testId) return i + 1;
      }
      return 0;
    };
    const resetFocus = () => page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    await nav(page, '/profile');

    for (const { tile, sheet } of SHEET_TILES) {
      await step(`keyboard: ${sheet}`, async () => {
        await resetFocus();
        const presses = await tabTo(tile);
        check(presses > 0, `keyboard: Tab reaches ${tile}`, `${presses} Tab presses`);
        if (!presses) return;
        await openSheet(page, tile, sheet, 'enter');
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
        await closeSheet(page, sheet);
        const back = await page.waitForFunction((t) => document.activeElement && document.activeElement.getAttribute('data-testid') === t, tile, { timeout: 2000 })
          .then(() => tile, () => active(page));
        check(back === tile, `keyboard: Escape closes ${sheet} and focus returns to ${tile}`, `activeElement ${back}`);
      });
    }
    for (const [tile, to] of [['profile-tile-lessons', '/lessons'], ['profile-tile-notifications', '/settings/notifications']]) {
      await step(`keyboard: Tab to ${tile} and Enter goes to ${to}`, async () => {
        await resetFocus();
        const presses = await tabTo(tile);
        if (presses) await page.keyboard.press('Enter');
        const arrived = await page.waitForURL((u) => u.pathname === to, { timeout: 3000 }).then(() => true, () => false);
        check(presses > 0 && arrived, `keyboard: Tab to ${tile} and Enter goes to ${to}`, `${presses} Tabs, url ${new URL(page.url()).pathname}`);
        await nav(page, '/profile');
      });
    }

    // Extra 1: back gesture, and no stray entry after a normal close. Arrive at /profile from /care/today.
    await step('back gesture', async () => {
      await nav(page, '/care/today');
      await nav(page, '/profile');
      const h0 = await page.evaluate(() => history.length);
      await openSheet(page, 'profile-tile-home', 'home-sheet');
      const h1 = await page.evaluate(() => ({ len: history.length, state: history.state && history.state.groveSheet }));
      await page.goBack();
      const goneBack = await page.getByTestId('home-sheet').waitFor({ state: 'detached', timeout: 3000 }).then(() => true, () => false);
      const focusBack = await page.waitForFunction(() => document.activeElement && document.activeElement.getAttribute('data-testid') === 'profile-tile-home', null, { timeout: 2000 })
        .then(() => 'profile-tile-home', () => active(page));
      const urlBack = new URL(page.url()).pathname;
      check(goneBack && urlBack === '/profile' && focusBack === 'profile-tile-home', 'back gesture: goBack closes the sheet, stays on /profile, focus on the tile',
        `history.length before ${h0}, open ${h1.len} (state ${h1.state}); after back: sheet gone ${goneBack}, url ${urlBack}, focus ${focusBack}`);
      const h2 = await page.evaluate(() => history.length);
      await openSheet(page, 'profile-tile-home', 'home-sheet');
      await page.keyboard.press('Escape');
      await page.getByTestId('home-sheet').waitFor({ state: 'detached' });
      await historySettled(page).catch(() => {}); // the check below reports it if the entry stays
      const h3 = await page.evaluate(() => ({ len: history.length, state: history.state && history.state.groveSheet, path: location.pathname }));
      check(h3.len === h2 && !h3.state && h3.path === '/profile', 'back gesture: Escape close leaves history.length unchanged and no sheet entry on top',
        `history.length before open ${h2}, after Escape ${h3.len}, top state groveSheet ${h3.state || 'none'}, path ${h3.path}`);
      await page.goBack();
      await page.waitForURL((u) => u.pathname !== '/profile', { timeout: 3000 }).catch(() => {});
      const leftTo = new URL(page.url()).pathname;
      check(leftTo === '/care/today', 'back gesture: one more back after the Escape close leaves /profile (no stray entry)', `landed on ${leftTo}`);
      await nav(page, '/profile');
    });

    // Extra 3: focus after a keyboard toggle that saves. 'delay' slows the PATCH so the busy window can be observed.
    for (const mode of ['pass', 'delay']) {
      const label = mode === 'delay' ? `${DELAY_MS / 1000} s save` : 'instant save';
      await step(`focus on save (${label})`, async () => {
        patchMode = mode;
        try {
          await resetFocus();
          await tabTo('profile-tile-care-style');
          await openSheet(page, 'profile-tile-care-style', 'care-style-sheet', 'enter');
          const toggle = page.getByTestId('profile-prefer-manual-toggle');
          const n = await tabTo('profile-prefer-manual-toggle', 20);
          check(n > 0, `focus on save (${label}): Tab reached profile-prefer-manual-toggle before Space`, `${n} Tabs, active ${await active(page)}`);
          if (!n) { await closeSheet(page, 'care-style-sheet'); return; }
          const before = await toggle.getAttribute('aria-checked');
          await page.evaluate(() => { document.querySelector('[data-testid="profile-prefer-manual-toggle"]').__probe = 1; });
          const reqP = page.waitForRequest((r) => r.method() === 'PATCH' && USERS_ME.test(r.url()), { timeout: 3000 });
          const resP = page.waitForResponse((r) => r.request().method() === 'PATCH' && USERS_ME.test(r.url()), { timeout: DELAY_MS + 5000 });
          let responded = false;
          resP.then(() => { responded = true; }, () => {});
          await page.keyboard.press('Space');
          const req = await reqP;
          const t0 = Date.now();
          await page.waitForTimeout(150); // sample the busy window on purpose
          const during = await active(page);
          const disabledDuring = await toggle.isDisabled();
          const pendingDuring = !responded;
          if (mode === 'delay') {
            check(disabledDuring && pendingDuring, `focus on save (${label}): save really was slow (control disabled, request pending at ~150 ms)`,
              `disabled ${disabledDuring}, response pending ${pendingDuring}, request ${req.method()} ${new URL(req.url()).pathname}`);
          }
          await resP;
          const took = Date.now() - t0;
          await page.waitForFunction(() => { const b = document.querySelector('[data-testid="profile-prefer-manual-toggle"]'); return b && !b.disabled; });
          if (mode === 'delay') check(took >= DELAY_MS - 300, `focus on save (${label}): response arrived after the delay`, `~${took + 150} ms after the request`);
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          const after = await active(page);
          const checkedAfter = await toggle.getAttribute('aria-checked');
          const sameNode = await page.evaluate(() => document.querySelector('[data-testid="profile-prefer-manual-toggle"]').__probe === 1);
          check(after === 'profile-prefer-manual-toggle', `focus on save (${label}): focus stays on the switch after Space`,
            `${n} Tabs to switch; aria-checked ${before} -> ${checkedAfter}; 150 ms after Space: active ${during}, disabled ${disabledDuring}; after save: active ${after}; same DOM node (not remounted) ${sameNode}`);
          // Focus may be on <body> now, so close with the button rather than relying on Escape reaching the dialog.
          await closeSheet(page, 'care-style-sheet', 'button');
        } finally {
          patchMode = 'pass';
          if (await page.getByTestId('care-style-sheet').count()) await closeSheet(page, 'care-style-sheet').catch(() => {});
        }
      });
    }

    // Extra 4: forced save failure, on the sheet and on Today.
    await step('save failure', async () => {
      patchMode = 'fail';
      try {
        await openSheet(page, 'profile-tile-care-style', 'care-style-sheet');
        await page.getByTestId('care-text-detailed').click();
        await page.getByTestId('care-text-error').waitFor().catch(() => {});
        await page.getByTestId('profile-prefer-manual-toggle').click();
        await page.getByTestId('manual-entry-error').waitFor().catch(() => {});
        const sheetErr = await page.getByTestId('care-text-error').textContent({ timeout: 1000 }).catch(() => null);
        const manualErr = await page.getByTestId('manual-entry-error').textContent({ timeout: 1000 }).catch(() => null);
        check(!!sheetErr && !!manualErr, 'save failure: sheet shows inline errors', `care-text-error "${sheetErr}", manual-entry-error "${manualErr}"`);
        const errColor = await page.getByTestId('care-text-error').evaluate((e) => getComputedStyle(e).color, null, { timeout: 1000 }).catch(() => 'n/a');
        const sheetBg = await page.getByTestId('care-style-sheet').evaluate((e) => getComputedStyle(e).backgroundColor, null, { timeout: 1000 }).catch(() => 'n/a');
        note('save failure: sheet error colors', `text ${errColor} on sheet background ${sheetBg}`);
        await shot(page, 'error-care-style-sheet.png');
        await closeSheet(page, 'care-style-sheet', 'button');
        await nav(page, '/care/today');
        await page.getByTestId('care-text-toggle').scrollIntoViewIfNeeded();
        await page.getByTestId('care-text-detailed').click();
        const todayErr = page.getByTestId('care-text-error');
        await todayErr.waitFor().catch(() => {});
        const todayText = await todayErr.textContent({ timeout: 1000 }).catch(() => null);
        check(!!todayText, 'save failure: /care/today shows the error under the Care tips toggle', `"${todayText}"`);
        const todayColor = await todayErr.evaluate((e) => getComputedStyle(e).color, null, { timeout: 1000 }).catch(() => 'n/a');
        note('save failure: Today error color', todayColor);
        const box = await page.getByTestId('care-text-toggle').boundingBox({ timeout: 1000 }).catch(() => null);
        const eb = await todayErr.boundingBox({ timeout: 1000 }).catch(() => null);
        if (box && eb) {
          const y = Math.max(0, box.y - 16);
          await shot(page, 'error-care-today.png', { clip: { x: 0, y, width: VIEW.width, height: Math.min(VIEW.height - y, eb.y + eb.height + 16 - y) } });
        } else await shot(page, 'error-care-today.png');
        await shot(page, 'error-care-today-full.png');
      } finally {
        patchMode = 'pass';
      }
    });
  });
} catch (e) {
  check(false, 'run aborted', `threw: ${firstLine(e)}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.close();
  const fails = results.filter((r) => r.ok === false).length;
  const oks = results.filter((r) => r.ok === true).length;
  console.log(`\n${oks} ok, ${fails} FAIL. Screenshots in ${path.relative(process.cwd(), SHOTS)}/`);
  process.exitCode = fails ? 1 : 0;
}
