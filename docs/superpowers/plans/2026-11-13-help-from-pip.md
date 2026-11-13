# Help from Pip (piece one) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Help my plant reachable from every tab (header Help button and a help sheet), Pip peeking in when a plant is overdue, and Pip separated from the optional room, with Pip switches in Profile.

**Architecture:** A `HelpSheetProvider` context owns one Radix-dialog bottom sheet that both the header Help button and Pip open. A `PipPeek` layer mounts once in `ProtectedShell` (the tab-bar screens only, so lessons, onboarding and species pages never get it). Preferences live on the user as two booleans read through one hook. Overdue picking and per-day dismissals are pure functions over `localStorage`.

**Tech Stack:** React 19 (craco), Radix Dialog, Tailwind with generated tokens, FastAPI, Jest (react-dom `act`, no Testing Library), pytest.

**Spec:** `docs/superpowers/specs/2026-11-13-help-from-pip-design.md`

## Global Constraints

- American English in all copy and comments.
- Tokens only: no hand-typed sizes or inline numeric styles (`npm run check:tokens`, 48 exceptions must not grow).
- Never edit `styles/tokens.generated.css` or the Tailwind theme.
- Jest cannot load `react-router-dom` v7 or the `@/` alias: tests mock `react-router-dom` with `{ virtual: true }`.
- Pip never diagnoses and never states plant-care claims. The bubble states a schedule fact: `{name} is {n} days overdue. Want a quick check?`
- Trigger: `next_water_due` at least 1 day in the past. At most once per day per plant. At most one bubble per screen visit. Bubble shows about 8 seconds, then collapses to Pip's head.
- Defaults: `pip_enabled` and `pip_peeks_enabled` are on when undefined (read as `!== false`). No migration.
- Large text, reduced motion, focus management and error states are part of done. The bubble never takes focus.
- Ask before deploying. Backend change needs `docs/deploy-backend.md` steps.

## Review Focus

1. `getDueToday` fails or returns nothing: Pip does not appear, Help button still works (Task 5).
2. `localStorage` throws (private mode): dismissals fall back to memory, no crash (Task 2).
3. Two plants overdue: one bubble, the most overdue; the other waits for another visit (Task 2, Task 5).
4. A plant with no nickname or common name: the bubble says "Your plant" (Task 2).
5. A dialog or text field has focus, or the first-run gate is held: Pip stays hidden (Task 5).

## File Structure

- Create `grove-backend/tests/test_pip_prefs.py`; modify `grove-backend/server.py` (UserUpdate).
- Create `grove-frontend/src/lib/pipPrefs.js` (+ test): `usePipPrefs`.
- Create `grove-frontend/src/lib/pipNudges.js` (+ test): pure overdue and dismissal logic.
- Create `grove-frontend/src/components/help/SymptomHelp.jsx`: the symptom, causes and safety content extracted from `pages/HelpMyPlantPage.js`.
- Create `grove-frontend/src/components/help/HelpSheet.jsx` (+ test): provider, hook, sheet.
- Modify `components/PageHeader.js`: Help button.
- Create `grove-frontend/src/components/help/PipPeek.jsx` (+ test).
- Modify `App.js`: provider and `<PipPeek />` in `ProtectedShell`.
- Modify `pages/LessonPage.jsx`, `components/CareTabs.js`, `pages/CarePage.js`, `components/PipNoteCard.jsx`: Pip no longer needs the room.
- Create `components/PipSettings.jsx` (+ test); modify `pages/ProfilePage.js`.
- Modify `walkthrough/scripts/mock-core.mjs`: an overdue plant and the prefs.

---

### Task 1: Backend preference fields

**Files:** Modify `grove-backend/server.py` (`UserUpdate`, next to `tooltips_enabled`); Test `grove-backend/tests/test_pip_prefs.py`.

**Interfaces:** Produces: `PATCH /users/me` accepts `pip_enabled: Optional[bool]` and `pip_peeks_enabled: Optional[bool]`; `False` is stored (the handler drops only `None`).

- [ ] **Step 1:** Write `test_pip_prefs_can_be_turned_off_and_on` and `test_pip_prefs_are_not_set_by_default`, following the client and auth fixtures of an existing `update_me` test (find one with `grep -l "users/me" grove-backend/tests`). Assert a PATCH of `{"pip_enabled": false, "pip_peeks_enabled": false}` is returned by the next GET `/auth/me`, and that a new user has neither key set.
- [ ] **Step 2:** Run `cd grove-backend && python3 -m pytest tests/test_pip_prefs.py -q`. Expected: FAIL (fields ignored).
- [ ] **Step 3:** Add the two `Optional[bool] = None` fields to `UserUpdate` with a one-line comment.
- [ ] **Step 4:** Rerun. Expected: PASS. Then `python3 -m pytest -q`: only the known `test_earning_logic` failure.
- [ ] **Step 5:** Commit `Pip preferences on the user`.

### Task 2: Preferences hook and nudge logic

**Files:** Create `lib/pipPrefs.js`, `lib/pipNudges.js` and their `.test.js` files.

**Interfaces:**
- Produces `usePipPrefs(): { pipOn: boolean, peeksOn: boolean, save(patch: { pip_enabled?: boolean, pip_peeks_enabled?: boolean }): Promise<void> }`. `pipOn = user.pip_enabled !== false`; `peeksOn = pipOn && user.pip_peeks_enabled !== false`. `save` calls `userAPI.updateMe(patch)` then `updateUser(res.data)` (from `useAuth`).
- Produces `overdueDays(plant, now: Date): number` (whole days past `next_water_due`, 0 if none or invalid).
- Produces `pickPeek(plants: object[], now: Date, store = defaultStore): { plantId: string, name: string, days: number } | null`: the most overdue plant with `overdueDays >= 1` that was not dismissed today; name is `nickname || common_name || 'Your plant'`.
- Produces `dismissToday(plantId, now, store)`, `dismissCount(store): number` (lifetime), `bumpDismissCount(store)`, `hasSeenFirstPeek(store)` / `markFirstPeekSeen(store)`, `askedToStop(store)` / `markAskedToStop(store)`. `store` is `{ get(key), set(key, value) }`; the default wraps `localStorage` and falls back to memory when it throws.

- [ ] **Step 1:** Write tests: `usePipPrefs` defaults on with a bare user, `peeksOn` is false when `pipOn` is false, `save` sends the patch and updates the user (mock `userAPI`); `pickPeek` returns the most overdue of two, skips 0 days, skips a plant dismissed today but not yesterday, falls back to "Your plant", returns null for `[]`; the store falls back to memory when `localStorage.setItem` throws.
- [ ] **Step 2:** Run `CI=true npx craco test --watchAll=false src/lib/pipPrefs.test.js src/lib/pipNudges.test.js`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement both modules. Day key is the local date `YYYY-MM-DD`.
- [ ] **Step 4:** Rerun. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 3: Extract the symptom help, add the sheet

**Files:** Create `components/help/SymptomHelp.jsx`, `components/help/HelpSheet.jsx`, `HelpSheet.test.js`; Modify `pages/HelpMyPlantPage.js`.

**Interfaces:**
- Produces `<SymptomHelp />`: everything under the page header today (the `help_diagnosis` arm fetch, `PhotoCheck` for `arm === 'photo_check'`, symptoms, causes, safety). Behavior unchanged. `HelpMyPlantPage` becomes `PageHeader` plus `<SymptomHelp />`.
- Produces `<HelpSheetProvider>` and `useHelpSheet(): { open(): void } | null` (null outside a provider). The sheet is a Radix Dialog bottom sheet (pattern: `components/FirstPlantCelebration.jsx`), title "What are you seeing?", Pip beside the title (`PipPanel`, scale 2) when `pipOn`, otherwise a `Leaf` icon. First row is "A pet or child ate a plant. Get help now." (opens the existing safety steps), then `<SymptomHelp />`, then a link "Open the full page" that closes the sheet and navigates to `/help-my-plant`. Focus goes to the title on open and returns to the opener on close. Escape closes.

- [ ] **Step 1:** Write `HelpSheet.test.js`: closed by default; `open()` shows "What are you seeing?" and the safety row first; the photo check shows for arm `photo_check` and not for `control` (mock `experimentAPI.helpDiagnosisArm`); Escape closes; with Pip off the leaf shows instead of Pip; "Open the full page" navigates. Existing `HelpMyPlantPage` tests must still pass.
- [ ] **Step 2:** Run the new test. Expected: FAIL.
- [ ] **Step 3:** Extract and build as above.
- [ ] **Step 4:** Run `src/components/help src/pages` tests. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 4: Help button in every header

**Files:** Modify `components/PageHeader.js`; Test: extend an existing `PageHeader` test or create `PageHeader.test.js`.

**Interfaces:** Consumes `useHelpSheet()`. Renders a `HeaderAction`-style button, label "Help", `aria-label="Help with a plant"`, `data-testid="header-help-button"`, before the bell. Not rendered when `useHelpSheet()` is null, when `hideBell` is set, or when `pathname === '/help-my-plant'`.

- [ ] **Step 1:** Write tests for the three hidden cases and the shown case (click calls `open`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Keep the header's wrapping so large text does not push it off screen.
- [ ] **Step 4:** Run the header and page tests. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 5: Pip peeks in

**Files:** Create `components/help/PipPeek.jsx`, `PipPeek.test.js`; Modify `App.js`.

**Interfaces:**
- Consumes `usePipPrefs`, `pickPeek`, `dismissToday`, `bumpDismissCount`, `dismissCount`, `hasSeenFirstPeek`, `markFirstPeekSeen`, `askedToStop`, `markAskedToStop`, `careAPI.getDueToday`, `useHelpSheet`, `isFirstRunBlocking` (`lib/firstRunGate`), `usePipForm(!!user.nook_enabled)`.
- `<PipPeek />` renders nothing unless `peeksOn`, the user is signed in, due-today returned a pick, the first-run gate is not held, no `[role="dialog"]` is open, and no `input, textarea, select` has focus. Re-checks on route change. Mounted inside `HelpSheetProvider` in `ProtectedShell` in `App.js`.
- Layout: a fixed layer above the tab bar with `pointer-events-none`; only Pip and the bubble have `pointer-events-auto` and a 44px minimum target. Bubble copy `{name} is {days} day(s) overdue. Want a quick check?`, buttons "Help me check" (opens the sheet) and "Not now". First peek only adds the line "Swipe me aside any time." and one nudge animation (none under `prefers-reduced-motion`). After about 8 seconds the bubble collapses to Pip's head; tapping the head reopens the sheet. A polite `role="status"` region announces the bubble once.
- "Not now", or a swipe of more than a small threshold toward the right edge on Pip, calls `dismissToday` and `bumpDismissCount` and hides Pip. Escape does the same when Pip or the bubble has focus. On the third lifetime dismissal, if not yet asked, the bubble instead asks "Want me to stop popping in?" with Yes (`save({ pip_peeks_enabled: false })`) and No.

- [ ] **Step 1:** Write `PipPeek.test.js` with these tests: `shows nothing when peeks are off`, `shows nothing when due-today fails`, `names the most overdue plant and offers help`, `Not now hides it and it does not return after a route change the same day`, `swipe toward the edge dismisses`, `first peek shows the swipe line and later peeks do not`, `stays hidden while a dialog is open`, `stays hidden while a field has focus`, `stays hidden while the first-run gate is held`, `third dismissal asks to stop and Yes turns peeks off`, `the bubble never takes focus`. Mock `careAPI`, `react-router-dom`, `AuthContext`, and the sheet context.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement with token classes only. Find the tab-bar offset token in `tailwind.config.js` (the nav uses `min-h-nav`); if no `bottom-nav` utility exists, wrap in a container that reserves the nav height with that token instead of a number.
- [ ] **Step 4:** Run the tests and `npm run check:tokens`. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 6: Pip no longer needs the room

**Files:** Modify `pages/LessonPage.jsx` (host), `components/CareTabs.js` (Pip tab), `pages/CarePage.js` and `components/PipNoteCard.jsx` (Today note); update their tests.

**Interfaces:** Consumes `usePipPrefs().pipOn`. Where these read `user.nook_enabled` only to decide whether Pip appears, use `pipOn` instead. Anything that needs the room itself (`ClosingStep`, the nook page, room data) keeps `nook_enabled`. `usePipForm(!!user.nook_enabled)` stays, so non-room users get the seed form.
- Builder check: `PipNoteCard` reads room state today. For people without the room, keep the daily trivia card there unless the note works without the room; record the choice in the test name.

- [ ] **Step 1:** Update or add tests: lesson host shows Pip with the room off and Pip on; nothing shows with Pip off; Pip tab follows `pipOn` (and `nook_offered_at` rule is preserved); Today shows the right card in each combination.
- [ ] **Step 2:** Run the affected tests. Expected: FAIL.
- [ ] **Step 3:** Make the changes.
- [ ] **Step 4:** Run `CI=true npx craco test --watchAll=false`. Expected: all pass.
- [ ] **Step 5:** Commit.

### Task 7: Profile switches

**Files:** Create `components/PipSettings.jsx`, `PipSettings.test.js`; Modify `pages/ProfilePage.js` (render above `<NookSettings />`).

**Interfaces:** Consumes `usePipPrefs`, `SwitchRow`. Two switches: "Pip" (help text: shows Pip around the app; off removes him everywhere, the Help button stays) and "Pip peeks in when a plant is overdue" (disabled and shown off while Pip is off). A failed save shows "Couldn’t save that. Try again." and leaves the switch where it was.

- [ ] **Step 1:** Write tests: both on by default; turning Pip off sends `pip_enabled: false` and disables the second switch; turning peeks off sends only `pip_peeks_enabled: false`; a rejected save shows the error.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement and mount.
- [ ] **Step 4:** Run the tests, `npx eslint --max-warnings 0 src`, `npm run check:tokens`, then the full suite. Expected: PASS.
- [ ] **Step 5:** Commit.

### Task 8: Demo, then look at it

**Files:** Modify `walkthrough/scripts/mock-core.mjs`.

- [ ] **Step 1:** Make the due-today mock return one plant three days overdue, and `PATCH /users/me` keep the two prefs.
- [ ] **Step 2:** Rebuild the app and demo (commands in the project notes), then screenshot at phone width: Pip peeking with the bubble, the sheet open, Profile switches, a large-text pass.
- [ ] **Step 3:** Fix what the screenshots show. Do not deploy: report to Hillary and ask.

## Self-review

- Spec coverage: Help button (Task 4), sheet with safety row and photo check (Task 3), peek with trigger, limits, suppression, controls, first-time teaching, three-dismissals offer (Tasks 2, 5), Pip for everyone and room optional (Task 6), switches and backend fields (Tasks 1, 7), demo (Task 8). The second piece ("Pip across the rest of the app") is out of scope by design.
- Names are consistent: `usePipPrefs`, `pickPeek`, `dismissToday`, `useHelpSheet`, `HelpSheetProvider`.
- Open builder checks are marked in Tasks 5 and 6.
