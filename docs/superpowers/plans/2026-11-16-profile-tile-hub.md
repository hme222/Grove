# Profile Tile Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 14-card Profile scroll with a six-tile hub whose settings open in sheets. In the same change, move stats and a rule-based Plant personality to Care.

**Architecture:** A shared `SettingsSheet` (Radix Dialog, same base as `components/help/HelpSheet.jsx`) holds each tile's settings. Each sheet's body is its own component under `components/profile/`, built from the controls that live in `ProfilePage.js` today. `ProfilePage.js` becomes the hub. Stats and personality are pure functions in `lib/` and render on Care › Progress and Care › Today.

**Tech Stack:** React (craco), Tailwind with generated tokens, `@radix-ui/react-dialog`, `tailwindcss-animate`, Jest with `react-dom/client` + `act` (the style of `HelpSheet.test.js`).

**Spec:** `docs/superpowers/specs/2026-11-16-profile-tile-hub-design.md`

## Global Constraints

- American English in all copy and comments.
- Never edit generated token CSS or the Tailwind theme; use existing tokens (`z-sheet`, `bg-scrim`, `max-h-sheet`, `max-w-dialog`, `h-touch`, `rounded-t-card`, etc.).
- No Save buttons in any sheet. Every control saves the moment it changes.
- If a save fails, the control goes back to its old value and a message under it says it didn't save, with a **Try again** link. A toast alone is not enough. Exception: the daily plant tip switch keeps today's behavior, where it saves on the device first (`writeTriviaFlag`) and the server copy catches up, so it never shows as failed.
- Motion runs only under `motion-safe:`. With reduced motion, sheets fade instead of sliding.
- Location UI renders only when `features.ZIP_ZONE_ENABLED` is true.
- Existing `profile-*` test ids are kept on the moved controls, so the existing tests move with them.
- About text, exactly: "FloraGrove is for people who want to become confident with taking care of plants. It shows what each plant needs today and why, and helps you put things right when something goes wrong."
- Personality titles and lines are copied verbatim from the spec table. They live in one exported constant (`PERSONALITY_COPY`) so they can be changed in one place.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Stats call fails on Today:** the check-ins line is simply absent, and Today still renders the due list. Pinned in Task 3.
2. **Sheet content taller than the screen at 200% text:** the title and ✕ stay visible and only the body scrolls. Pinned in Task 4 (structure test) and checked by eye in Task 11.
3. **A tile's state line after a save fails:** it shows the reverted value, not the attempted one. Pinned in Task 6.
4. **The opener is gone when the sheet closes** (for example, the hub re-rendered): focus falls back to the page heading and doesn't throw. Pinned in Task 4.
5. **Location lookup answers out of order:** a slow lookup for an old code must not save over a newer one. Pinned in Task 8.

---

### Task 1: Plant personality and check-ins rules

**Files:**
- Create: `grove-frontend/src/lib/plantPersonality.js`
- Test: `grove-frontend/src/lib/plantPersonality.test.js`

**Interfaces:**
- Produces: `PERSONALITY_COPY` (object keyed by id: `none`, `freshStart`, `propagator`, `jungleKeeper`, `steadyHand`, `regular`, `bigPicture`, `growing`; each `{ title: string|null, line: string }`), `plantPersonality(stats) -> { id, title, line }`, `checkInsLabel(stats) -> string|null` (returns `"1 of 3"`, or `null` when `stats?.check_ins` is missing).

- [ ] **Step 1: Write the failing tests.** One test per spec row, in order. Each builds a stats object that matches only that row and the rows below it, and asserts `id`, `title` and `line`. Also test rule order: `{ total_plants: 12, propagation_count: 1, total_care_logs: 3 }` gives `propagator`. Treat `null` or `{}` stats as `none`. For `checkInsLabel`, test that `{ check_ins: { this_week: 1, weekly_goal: 3 } }` gives `'1 of 3'`, that a missing `weekly_goal` falls back to 3 (as Profile does today), and that `{}` gives `null`.
- [ ] **Step 2: Run** `cd grove-frontend && CI=true npx craco test src/lib/plantPersonality.test.js`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement.** Use first-match over the rules in the spec's order. Missing numbers count as 0. "More than half" means `plants_needing_water * 2 > total_plants`.
- [ ] **Step 4: Run the tests again.** Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "Plant personality from the user's own numbers, no AI"`

### Task 2: Care › Progress gets check-ins and personality

**Files:**
- Modify: `grove-frontend/src/pages/CareGrowthPage.js:45-66`
- Create: `grove-frontend/src/components/PersonalityCard.jsx`
- Test: `grove-frontend/src/pages/CareGrowthPage.test.js` (new; mock `statsAPI` and `CareTabs` the way `CarePage.test.js` does)

**Interfaces:**
- Consumes: `plantPersonality`, `checkInsLabel` from Task 1.
- Produces: `<PersonalityCard stats={stats} />` (`data-testid="personality-card"`, heading "Plant personality", title in `font-plant`; for `none`, the line only).

- [ ] **Step 1: Write the failing tests.**
  - `growth-basic-tiles` has 4 tiles, and the fourth reads "Check-ins this week" and "1 of 3".
  - `personality-card` shows "The Steady Hand" for `{ total_plants: 3, plants_needing_water: 0, total_care_logs: 6 }`.
  - With `total_plants: 0`, the card shows `PERSONALITY_COPY.none.line` ("Add a plant and we'll start figuring out your plant personality.") and has no title.
  - There is no button in the card. It has no Generate button.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Add the tile with the `CalendarCheck` icon (lucide, `aria-hidden`). Change the grid to `grid-cols-2 sm:grid-cols-4` so four tiles fit and wrap at large text. Render `PersonalityCard` under the tiles, before `growth-thriving-card`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 3: Care › Today check-ins line

**Files:**
- Modify: `grove-frontend/src/pages/CarePage.js` (fetch in the effect at `:146`; line placed after `WorkingTowardSection` at `:455`)
- Test: `grove-frontend/src/pages/CarePage.test.js` (add `statsAPI` to the existing `../lib/api` mock)

**Interfaces:**
- Consumes: `checkInsLabel` from Task 1, `statsAPI.getStats()`.

- [ ] **Step 1: Write the failing tests.**
  - `care-checkins-line` reads "Check-ins this week: 1 of 3".
  - When `getStats` rejects, `care-checkins-line` is absent and `care-card` items still render (Review Focus 1).
  - The line is a `<p>`, not a card or button.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Make a separate, non-blocking `statsAPI.getStats()` call. A failure is swallowed and the line is hidden. Do not add it to `fetchDue`'s loading state. Style: `font-ui text-sm text-grove-sage`.
- [ ] **Step 4: Run** the `CarePage.test.js` suite. Expected: PASS, including the existing tests.
- [ ] **Step 5: Commit.**

### Task 4: SettingsSheet base

**Files:**
- Create: `grove-frontend/src/components/profile/SettingsSheet.jsx`
- Test: `grove-frontend/src/components/profile/SettingsSheet.test.js`

**Interfaces:**
- Produces: `<SettingsSheet open onClose title testId opener fallbackFocus children />`.
  - `opener` is a ref to the element that opened the sheet.
  - `fallbackFocus` is a ref used when the opener is gone (Review Focus 4).
  - The title has `data-testid={`${testId}-title`}`, and the ✕ is `${testId}-close` with `aria-label={`Close ${title}`}`.

- [ ] **Step 1: Write the failing tests** (HelpSheet.test.js style):
  - When open, focus is on the title.
  - Escape calls `onClose`, and focus returns to the opener.
  - Clicking the overlay calls `onClose`.
  - If the opener was removed from the DOM, focus goes to `fallbackFocus` without throwing.
  - Structure: the title and ✕ sit outside the element with `data-testid={`${testId}-body`}`. Only that body has `overflow-y-auto`.
  - The content has `motion-safe:slide-in-from-bottom` and `motion-reduce:fade-in` classes.
  - A drag handle (`${testId}-handle`, `aria-hidden`) closes the sheet when it's dragged down more than 80px (simulate with pointer events).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Use the Radix structure and focus handling from `HelpSheet.jsx:48-62`.
  - Layout: a flex column with `max-h-sheet`. The header (handle, title, ✕) is `shrink-0`, and the body is `min-h-0 flex-1 overflow-y-auto`. A bottom fade sits over the body: a `pointer-events-none` gradient from `transparent` to `grove-canopy`, shown only when the body can still scroll down. It's tracked with a scroll listener.
  - Height follows content, so there is no fixed height. Back gesture: when open, push a history state, close on `popstate`, and pop it on a non-back close.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 5: Inline save errors

**Files:**
- Create: `grove-frontend/src/components/profile/useInstantSave.js`, `grove-frontend/src/components/profile/SaveError.jsx`
- Test: `grove-frontend/src/components/profile/useInstantSave.test.js`

**Interfaces:**
- Produces:
  - `useInstantSave() -> { run(apply, persist, revert), busy, error, retry }`. `apply()` runs first (the optimistic update), `persist()` is async, and `revert()` runs if `persist` throws.
  - `error` is `'Couldn’t save that.'` or `''`.
  - `retry()` reruns the last `apply` and `persist` pair.
  - `<SaveError error onRetry testId />` renders `role="alert"` text plus a link-style button reading "Try again". It renders nothing when `error` is empty.

- [ ] **Step 1: Write the failing tests.**
  - On success, `apply` is called and `revert` isn't.
  - On failure, `revert` is called and `error` is set.
  - `retry` succeeds and clears `error`.
  - A second `run` while `busy` is ignored.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Use a `useRef` busy guard, as `PipSettings.jsx:11` does.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 6: Tutorials and Care style sheet bodies

**Files:**
- Create: `grove-frontend/src/components/profile/TutorialsSheetBody.jsx` (moved from `TutorialsAndTipsControls`, `ProfilePage.js:414-513`, without `ProfileLessons`)
- Create: `grove-frontend/src/components/profile/CareStyleSheetBody.jsx`
- Create: `grove-frontend/src/lib/careTextMode.js`: move `careTextMode` and the save logic from `CarePage.js:104-120` into `useCareTextDetail() -> { mode, setMode, busy, error, retry }`, built on Task 5's `useInstantSave`. `CarePage` uses it too, so both places save the same setting.
- Test: `grove-frontend/src/components/profile/CareStyleSheetBody.test.js`, `grove-frontend/src/components/profile/TutorialsSheetBody.test.js`

**Interfaces:**
- Consumes: `useInstantSave`, `SaveError` (Task 5).
- Produces: `<TutorialsSheetBody />`, `<CareStyleSheetBody />`, `useCareTextDetail()`.

- [ ] **Step 1: Write the failing tests.**
  - CareStyle has `care-text-simple` / `care-text-detailed`, `profile-daily-trivia-toggle` and `profile-prefer-manual-toggle`.
  - When the manual-entry save rejects, the switch is unchecked again and `SaveError` shows "Try again" (Review Focus 3: `user.prefer_manual_plant_entry` is back to its old value).
  - Tutorials has `profile-tooltips-toggle` and one `profile-replay-<id>` per `TUTORIAL_COPY` key.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Manual-entry and tooltips: switch to `useInstantSave` with an optimistic `updateUser` and a revert. Drop the success toasts, since the tile's state line confirms the change.
  - Replay buttons: keep the toast; it's an action, not a setting.
  - Trivia: keep its local-first behavior (see Global Constraints).
- [ ] **Step 4: Run** these tests and `CarePage.test.js`. Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 7: Your home sheet body (pets and hemisphere)

**Files:**
- Create: `grove-frontend/src/components/profile/HomeSheetBody.jsx` (pets from `ProfilePage.js:297-321`, hemisphere from `saveHemisphere` and the `profile-hemisphere` group in `HardinessZoneControls`)
- Test: `grove-frontend/src/components/profile/HomeSheetBody.test.js`

**Interfaces:**
- Consumes: `useInstantSave`, `SaveError`, `features.ZIP_ZONE_ENABLED`.
- Produces: `<HomeSheetBody />`. Renders `<LocationFields />` (Task 8) only when the flag is on.

- [ ] **Step 1: Write the failing tests.**
  - The pets chips (`profile-pets-yes`/`-no`) and hemisphere chips (`profile-hemisphere-north`/`-south`) set `aria-pressed`.
  - When the pets save fails, the old value is restored and the inline error shows (with no toast).
  - With the flag off (default in tests), there is no `location-fields`.
  - With the flag on (mock `../../lib/features`), `location-fields` is present.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 8: Location fields (option C, flag only) and the onboarding label

**Files:**
- Create: `grove-frontend/src/components/profile/LocationFields.jsx` (replaces `HardinessZoneControls`, `ProfilePage.js:516-764`)
- Modify: `grove-frontend/src/components/onboarding/ZoneSteps.js:72,78`. "Your zip code helps…" becomes "Your ZIP code helps…", and "Zip code" becomes "ZIP code". Also change `SEASON_NOTE` at `:24` to "US ZIP codes only for now…".
- Test: `grove-frontend/src/components/profile/LocationFields.test.js`

**Interfaces:**
- Consumes: `zoneAPI.lookup(country, code)`, `userAPI.updateMe({ location_country, location_postcode })`, `refreshUser`.
- Produces: `<LocationFields />` with `data-testid="location-fields"`.

- [ ] **Step 1: Write the failing tests** (fake timers):
  - The label reads "ZIP code" when the country is US and "Postcode" when it's GB. The placeholders are `e.g. 10001` / `e.g. SW1A 1AA`.
  - Typing a found code and waiting 600ms (or blurring) calls `updateMe` once. Then `location-saved` reads "✓ Saved · USDA zone 7b" and has an Undo button.
  - Undo calls `updateMe` with the previous country, code and zone.
  - A not-found lookup shows "We couldn’t find that code. Nothing was saved." and doesn't call `updateMe`.
  - While a lookup is pending, `role="status"` (polite) reads "Looking up…".
  - Out of order (Review Focus 5): type code A, then B. A's lookup resolves after B's. Only B is saved.
  - "Enter it instead" opens `profile-zone-manual`. Leaving it empty shows "Enter a zone, like 7b." Leaving it filled saves `hardiness_zone` and shows Undo.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Debounce for 600ms. Track the latest request with a counter ref and ignore older answers. Read the zone from the server's response, not the lookup. Update any existing onboarding test that asserts "Zip code" so it asserts "ZIP code".
- [ ] **Step 4: Run** these tests and the onboarding tests. Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 9: Pip and About sheet bodies, About text

**Files:**
- Modify: `grove-frontend/src/components/PipSettings.jsx`, `grove-frontend/src/components/NookSettings.jsx`. Add a `bare` prop that drops the outer card (border and padding) and the heading, so they sit inside a sheet. Default behavior is unchanged.
- Create: `grove-frontend/src/components/profile/PipSheetBody.jsx` (`<PipSettings bare /><NookSettings bare />`)
- Create: `grove-frontend/src/components/profile/AboutSheetBody.jsx` (`GROVE_BRAND.mission` text)
- Modify: `grove-frontend/src/constants/brand.js:5`, setting `mission` to the exact About text from Global Constraints. Help page picks it up automatically.
- Test: extend `PipSettings.test.js` and `NookSettings.test.js` with a `bare` case.

- [ ] **Step 1: Write the failing tests.**
  - With `bare`, there's no `profile-pip` card class, and the switches are still present.
  - With `bare`, the Nook error still shows on failure.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Pip and Nook keep their own inline errors. They already match the spec's error rule, except for the Try again link, so add `SaveError` with retry here.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit.**

### Task 10: The hub and the Notifications link

**Files:**
- Rewrite: `grove-frontend/src/pages/ProfilePage.js` as the hub. Delete the moved helper components from it. Remove `VerificationStatusCard`, `ProfileFeaturedBadges` and the pact reader from this file only if nothing else imports them (`grep` first). Otherwise leave them where they are.
- Create: `grove-frontend/src/components/profile/tileStates.js`
- Modify: `grove-frontend/src/pages/NotificationPreferencesPage.js:45`. Add a "Recent notifications" row as the first child: `data-testid="notifications-recent-link"`, which navigates to `/notifications`, styled like the old Profile row (outline button, Bell icon, ChevronRight).
- Test: `grove-frontend/src/components/profile/tileStates.test.js`, `grove-frontend/src/pages/ProfilePage.test.js` (new), and `NotificationPreferencesPage.test.js` (add the link test).

**Interfaces:**
- Consumes: everything in Tasks 4–9, `LESSON_META`, `usePipPrefs`, `notificationAPI.getPreferences`.
- Produces: `tileStates(user, { pipOn, peeksPref, notifPrefs, zipZone }) -> { lessons, tutorials, careStyle, home, pip, notifications }` (strings):
  - lessons: `"2 of 6 done"`. Count `tutorials_seen` entries `lesson:<id>` for ids in `LESSON_META`.
  - tutorials: `"Tooltips on"` / `"Tooltips off"`.
  - careStyle: `"Simple tips"` or `"Detailed tips"`, plus `" · Daily tip on"` when `showDailyTrivia(user)`.
  - home: the pets part (`"Pets at home"` / `"No pets"` / `"Pets not set"`), then `" · "`, then the hemisphere part (`"Northern"` / `"Southern"` / `"Hemisphere not set"`). Add `" · Zone 7b"` only when `zipZone` is on and `user.hardiness_zone` is set.
  - pip: `"Off"`, `"On · peeks in"` or `"On · no peeks"`.
  - notifications: `"Daily care check on"` / `"Daily care check off"` from `push_care_due`. Use `"Reminders and quiet hours"` while loading or if the fetch failed.

- [ ] **Step 1: Write the failing tests.**
  - `tileStates`: one assertion per branch above.
  - ProfilePage:
    - Exactly six `profile-tile-*` buttons (`lessons`, `tutorials`, `care-style`, `home`, `pip`, `notifications`), each with a visible label and its state line. Icons are `aria-hidden`.
    - Clicking `profile-tile-care-style` opens `care-style-sheet` with title "Care style". After pressing Escape, focus is back on the tile.
    - Clicking Lessons navigates to `/lessons`, and Notifications to `/settings/notifications`.
    - None of these are present: `profile-stats-card`, `generate-personality-button`, `profile-badges`, `profile-bouquets-link`, `profile-challenges-link`, `profile-verification`, `profile-inbox-button`, nor the text "tier".
    - `profile-help-button` goes to `/help`, and `profile-about-tile` opens `about-sheet` showing the new mission text.
    - Admin rows (`profile-replay-onboarding-button`, `profile-admin-button`) render only for `is_admin`, below `profile-logout-button`. `profile-florist-button` renders only for the pro tiers.
    - When a sheet save fails, the tile's state line shows the reverted value once the sheet closes (Review Focus 3).
    - The hub no longer calls `statsAPI.getStats` or `badgeAPI`.
    - While a sheet is open, `PipPeek` doesn't render (spec rule 7). Render the hub with an overdue plant, as `PipPeek.test.js` does, open a sheet, and assert there's no peek. If `useOtherThingOpen` doesn't detect the sheet, make the sheet visible to it there.
  - NotificationPreferencesPage: `notifications-recent-link` navigates to `/notifications`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the hub.**
  - Use `PageHeader title="Profile"`, which already carries Help.
  - Grid: `grid gap-3 grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]`. This is two columns at default text and one at 200%, because the minimum is in rem. Note it in a comment: this is a layout rule, not a token value.
  - Tiles: `min-h-touch`, label in `font-plant`, state line `font-ui text-xs text-grove-sage`, no `truncate`, and wrapping allowed.
  - Below the grid: Help and tutorial row, About FloraGrove row, then Sign out, then Florist Pro and Admin, with their conditions as they are today.
  - Each tile keeps its own ref, which becomes the sheet's `opener`. The page `h1` from `PageHeader` is `fallbackFocus`.
  - The hub loads nothing except `notificationAPI.getPreferences()`, which is non-blocking and only used for the state line. The `loading` and `loadError` page states go away, because nothing on the hub blocks.
- [ ] **Step 4: Run the whole suite** with `cd grove-frontend && CI=true npm test`. Expected: PASS. Find any test that referenced a removed `profile-*` id. If the control moved, point the test at its new home. If the control is hidden per scope, delete only that assertion and say so in the commit message.
- [ ] **Step 5: Commit.**

### Task 11: Verification pass

**Files:**
- Create: `walkthrough/scripts/profile-hub-check.mjs` (follow `walkthrough/scripts/pip-a11y.mjs`: Playwright against the local dev server)

- [ ] **Step 1: Write the script.**
  - Screenshot the hub and each sheet at a 390×844 viewport, at default text and at 200% (`document.documentElement.style.fontSize = '32px'`), with `reducedMotion: 'reduce'` for the second pass.
  - Assert three things at 200%:
    - The hub has one column, with every tile's `offsetLeft` equal.
    - No element inside a tile has `scrollWidth > clientWidth`.
    - Each sheet's title and ✕ stay in the viewport after the body is scrolled to the bottom.
  - Keyboard-only pass: Tab to each tile, press Enter, Tab through the sheet (focus stays inside), press Escape, and check that `document.activeElement` is the tile.
  - Save the screenshots to `walkthrough/shots/profile-hub/`.
- [ ] **Step 2: Run** `node walkthrough/scripts/profile-hub-check.mjs` against `npm start`. Expected: every assertion prints `ok`, and the screenshots exist.
- [ ] **Step 3: Run** `cd grove-frontend && npm run build`. Expected: compiled successfully.
- [ ] **Step 4: Look at every screenshot yourself.** Note anything cut off, overlapping, or below the 3:1 border contrast. Fix it in the owning task's file before committing.
- [ ] **Step 5: Commit** the script (not the screenshots, unless the repo already tracks `walkthrough/shots`).
