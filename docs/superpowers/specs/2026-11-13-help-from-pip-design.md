# Help from Pip: Help my plant on every tab

Status: written for Hillary's approval, updated 2026-11-13 after her second round of answers. Nothing here is built. Mockups: `.superpowers/brainstorm/1397-1794580961/content/help-pip-options.html` (option C, chosen).

## Intent

Help my plant is hard to find. Today it is reachable only from a card low on the Today tab. The new design makes help reachable from every tab, and lets Pip offer it when a plant is overdue, so a new owner who is worried does not have to know where to look. Hillary's words: Pip should "signal like pip saying, hey do you need help? coming out from the side", and help should be available from all tabs. Chosen: option C, shown to everyone.

This supports the MVP rule: early care confidence, understandable next actions, safe recovery from mistakes.

## Goals

1. A quiet **Help** button in the header of every screen that uses `PageHeader`. It opens the help sheet over the current screen.
2. **Pip peeks in from the right edge** when a plant is overdue, with a short bubble and a way to say "Not now".
3. One **help sheet** (bottom sheet) holding the existing symptom triage, with the pet/child safety line first.
4. **Pip is the app's guide for everyone, not a nook feature.** The room (the nook) is an optional extra. Pip is on by default and can be turned off in Profile.
5. Controls are discoverable without a tutorial (see Controls).

## Non-goals

- No diagnosis. Pip never says what is wrong with a plant. The bubble states a schedule fact and offers the quick checks.
- No new care advice. The sheet reuses `SYMPTOMS`, `SOIL_CHECK` and the safety content in `grove-frontend/src/lib/plantHelp.js` as they are.
- The `/help-my-plant` page stays, along with the existing links to it, and the "Something look off?" card on Today.

## Anti-goals (a failure even if it works)

- Pip covering a primary button, the tab bar, or a form field.
- Pip nagging: the same plant twice in a day, or again after "Not now".
- Pip appearing during onboarding, a lesson, a celebration card, or while a dialog or the keyboard is open.
- Any control that only works by swiping.

## Behavior

### The Help button
- Lives in `PageHeader` (`components/PageHeader.js`), before the bell. Label "Help". Accessible name "Help with a plant". Minimum touch target.
- Hidden on screens that pass `hideBell` and on the Help my plant page itself.
- Opens the help sheet. It does not navigate, so the user keeps their place.

### The help sheet
- Bottom sheet over the current screen. Title "What are you seeing?", Pip beside it.
- First row: "A pet or child ate a plant. Get help now." Opens the existing safety steps and contacts.
- For people in the `photo_check` experiment arm, the sheet also offers the photo check (`components/PhotoCheck`), above the chips, same as the page does today. Everyone else sees the plain chips. (Hillary's decision.)
- Then the symptom chips. Choosing one shows the same causes and quick checks as the page does today, inside the sheet. A "Open the full page" link goes to `/help-my-plant`.
- Focus moves into the sheet on open and returns to the Help button (or Pip) on close. Escape closes it.

### Pip peeking in
- Trigger (my call): a plant from `careAPI.getDueToday()` whose `next_water_due` is at least 1 day in the past. That endpoint already returns the plant, and `status_reason` already holds hedged copy ("The soil may be dry."). The bubble copy is short and factual, for example "Monty is 3 days overdue. Want a quick check?". The mockup's "3 days" was a sample.
- Frequency: at most once per day per plant. At most one bubble per screen visit. "Not now" silences that plant for the rest of the day.
- Where: right edge, above the tab bar. Pip is drawn from the existing sprite (`nook/PipPanel.jsx`, `usePipForm`). People without the nook get the seed form.
- Timing: the bubble shows about 8 seconds, then collapses to just Pip's head. Tapping either one opens the sheet.
- Suppressed during: onboarding, lessons (`/lessons/:id`), add-plant and other forms, the photo viewer, celebration cards, any open dialog, and while a text field has focus.

### Controls
- Tap Pip or the bubble: open the sheet.
- "Not now" button on the bubble: hide for that plant until tomorrow.
- Swipe Pip toward the right edge: same as "Not now". A shortcut only. Keyboard and screen-reader users have the button, and Escape dismisses when Pip has focus.
- Only Pip's own touch area (at least 44px) catches touches. The rest of his layer has `pointer-events: none`, so scrolling and the app's other swipes (toasts, photo viewer, photo guide cards, nook, swap page) are unaffected.

### Teaching the controls without a tutorial
- First appearance only: the bubble has two buttons, "Help me check" and "Not now", and a small line, "Swipe me aside any time." Later appearances show the bubble and "Not now" only.
- One nudge toward the edge on first appearance. With reduced motion there is no nudge.
- A small chevron on Pip's edge so he reads as movable.
- Profile gets two switches next to Tooltips (see Pip on and off below). After "Not now" three times, Pip asks once, "Want me to stop popping in?", with Yes and No buttons. Yes turns off only the peeks, not Pip everywhere.

## Pip on and off, and the room

Today Pip depends on the nook in four places, all keyed on `user.nook_enabled` or `nook_offered_at`: the Pip host beside lessons (`LessonPage.jsx`), the Today "From Pip" note (`CarePage.js`, `PipNoteCard`), the Pip tab on care screens (`CareTabs.js`), and the nook offer. The plan separates the two ideas:

- **Pip** (new switch, on by default for everyone): the guide who shows up around the app. Off means no Pip anywhere: no peeks, no lesson host, no Pip note. The Help button and sheet still work, with a plain leaf mark where Pip would be.
- **Pip peeks in when a plant is overdue** (new sub-switch, on by default): only the peeks. The three-dismissals offer turns this one off.
- **The room** (existing `nook_enabled`, unchanged): the optional pixel room. Turning it off no longer removes Pip.
- Pip's form: the room's growth state when the nook is on, otherwise the seed form (`usePipForm` already falls back to seed).
- Backend: two user fields, `pip_enabled` and `pip_peeks_enabled`, both default true, following `tooltips_enabled` in `server.py`. Existing users get Pip on, including those who never opted into the room.
- Builder check: what `PipNoteCard` shows depends on the room today. Decide whether non-room users get a cut-down note or keep the daily trivia card there.

## Pip across the rest of the app (second piece, needs Hillary's list)

"Pip integrated throughout the whole app" is bigger than help. This plan covers the first piece only: help, the peek, the switch, and decoupling from the room. The second piece is a list of places where Pip speaks or reacts. My starting guesses, for Hillary to cut or add to:

- Lesson hosting for everyone (today: nook users only).
- Short Pip lines in empty states (no plants yet, nothing due).
- The existing celebrations (first plant, lesson done, first care), with Pip present on the card.
- A one-line reaction after logging care.

Rules for every one: respects the Pip switch, never covers a main action, never gives plant-care claims without a recorded source, reduced motion means still. Each place becomes its own small change, so none of them is built until the list is agreed.

## Accessibility (part of done)

- The bubble never takes focus. It is announced once through a polite live region.
- Reduced motion: no slide, no nudge, Pip is simply there.
- Large text: the bubble wraps, and Pip moves up so he never overlaps a main button or the tab bar.
- Contrast: bubble text meets 4.5:1. Check the chips and the urgent row too.
- The 8 second collapse only removes a non-essential offer. The Help button stays, so nothing is lost.
- Error states: if due-today fails to load, Pip simply does not appear. The Help button still works.

## Constraints and where things go

- Tokens only: no hand-typed sizes or inline numeric styles (`npm run check:tokens`).
- Pip peek and the sheet are one shared component mounted once in the app layout in `App.js`, so every tab gets them.
- Dismissals are stored on the device (per plant, per day). The on/off switch needs a user field, like `tooltips_enabled` (`server.py` user update model and defaults). Backend change, so it needs the backend deploy in `docs/deploy-backend.md`.
- The demo (`walkthrough/`) needs a mock overdue plant so the peek can be seen.

## Decisions made

By Hillary: option C; Pip for everyone; Pip can be swiped away; teach the controls without extra hassle; the photo check goes in the sheet too; Pip integrated through the whole app with the room optional; Pip can be turned off.

My calls, to check while reading:
- Trigger is "at least 1 day overdue for watering", once a day per plant.
- Bubble shows about 8 seconds, then only Pip's head.
- Dismissals are on-device, not on the server.
- Three "Not now" taps lead to the one-time stop offer.
- The Today card "Something look off?" stays.
- Two switches (Pip, and Pip peeks) rather than one, so "stop popping in" does not also remove Pip from lessons.
- Existing users get Pip on by default, including those who never turned on the room.

## Left to the builder

Bubble wording variants, exact motion timing, the chevron's look, and the live-region wording, within the rules above.

## Questions for Hillary

1. Is "at least 1 day overdue" the right trigger, or should Pip wait longer?
2. Which other places should Pip appear? My starting list is above. This decides the second piece.

## Tests expected

Pip shows without the nook, and is gone everywhere when the Pip switch is off; the room switch no longer affects Pip; the photo check shows in the sheet only for that experiment arm; Help button on every header, hidden on the help page; sheet focus in and out; safety row first; once-a-day and "Not now" behavior; suppression on the listed screens; reduced-motion; the "Pip nudges" switch and the three-dismissals offer; due-today failure shows nothing.

## Not verified

How the photo check behaves inside a sheet, how toasts sit relative to Pip's position, and what `PipNoteCard` shows without the room. All need a look while building.
