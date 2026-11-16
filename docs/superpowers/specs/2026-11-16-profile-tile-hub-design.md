# Profile: a tile hub with settings in sheets

Status: open questions answered 2026-11-16; About copy and personality wording approved. Nothing here is built. Mockups: `.superpowers/brainstorm/21044-1794785376/content/profile-options-v2.html` (option D, chosen), `.../sheet-design.html` (the sheet rules), and `.superpowers/brainstorm/9976-1794844245/content/location-options.html` (option C, chosen, for location).

## Intent

A tester wrote on 2026-11-12: "the user settings page seems to have a lot of placeholders in it still. I wanted to view tutorials there and they couldn't be found." Today Profile is one scroll of about 4,200px and 14 cards. Settings sit among stats and lessons, and the tutorials are about 2,300px down the page.

Hillary's direction: Profile holds **tutorials and settings only**. Stats and Plant personality move to Care (Today and Progress) **in this same change**, so nothing disappears in between. Features that `docs/product/scope-v1.md` marks as "later" (dormant) are hidden.

The new Profile is a hub of six tiles that fits on one screen. Tapping a tile opens a sheet over the hub, or for Lessons and Notifications, the page that already exists.

This supports the MVP rule: understandable next actions (everything is findable from one screen) and safe recovery (switches save at once and can be flipped back; location has Undo).

## The hub

```
Profile                          [Help]
┌──────────────┐ ┌──────────────┐
│ 📖 Lessons    │ │ ↻ Tutorials   │
│ 2 of 6 done   │ │ Replay the…   │
├──────────────┤ ├──────────────┤
│ 🌱 Care style │ │ 🏠 Your home  │
│ Simple tips…  │ │ No pets · N.  │
├──────────────┤ ├──────────────┤
│ 🪴 Pip        │ │ 🔔 Notific…   │
│ On · peeks on │ │ Reminders on  │
└──────────────┘ └──────────────┘
Help and tutorial               ›
About FloraGrove                ›
Sign out
```

- Each tile shows its current state in one line, read from the user's saved settings (not sample text).
- Tiles are buttons with a visible label; the icon is decorative (`aria-hidden`).
- At large text the grid drops to one column. Nothing is cut off with an ellipsis; the state line wraps.
- Admin-only rows (Replay first-run, Admin) and the Florist Pro row keep their current conditions and sit below Sign out.

## What each tile opens

| Tile | Opens | Holds |
|---|---|---|
| Lessons | the existing `/lessons` page | unchanged |
| Tutorials | sheet | Replay a section tutorial (the list from `TutorialsAndTipsControls`), Show tooltips switch |
| Care style | sheet | Care tips: Simple / Detailed (`CareTextToggle`, same saved setting as the Care page), Show a daily plant tip on Today, Skip AI identification |
| Your home | sheet | Pets at home, Hemisphere. Location (see below) only when `features.ZIP_ZONE_ENABLED` is on |
| Pip | sheet | Show Pip, Peek in when a plant is overdue (`PipSettings`), Pip's nook (`NookSettings`) |
| Notifications | the existing `/settings/notifications` page | unchanged |

Help and tutorial keeps going to `/help`. About FloraGrove opens a short sheet with new mission text (see "About copy").

The Notifications page (`/settings/notifications`) gets a **Recent notifications** link at the top, going to `/notifications`. That is where the old Profile button lived.

## Sheet rules

Built on the same Radix Dialog base as `components/help/HelpSheet.jsx`, which already traps focus, closes on Escape, locks page scroll and returns focus.

1. **Height follows content.** Short sheets sit low (Pip is under half the screen). Tall ones stop just below the top. When the content is taller than the screen (for example at 200% text), the sheet fills it.
2. **Pinned title and ✕.** Only the middle scrolls. A soft fade at the bottom shows there's more.
3. **Everything saves by itself.** Switches and choice chips save the moment they change, as they do today. There are no Save buttons in any sheet.
4. **Closing:** ✕, Escape, tapping the dimmed hub, and the phone's back gesture all close the sheet. Swiping down works only on the handle, so it never fights scrolling. Swipe is never the only way.
5. **Focus** moves to the sheet's title when it opens and back to the tile that opened it on close. The tile's state line updates to show the change.
6. **Reduced motion:** the sheet fades instead of sliding.
7. **Pip's peek** stays hidden while a sheet is open (it already hides for open dialogs).
8. **Errors:** if a save fails, the control goes back to its old value and a message under it says it didn't save, with a Try again link. A toast alone is not enough.

## Location (option C)

Scope v1 lists zip and hardiness zone as dormant, so Location is built but shows only when `REACT_APP_ZIP_ZONE=on`, the same flag onboarding uses. With the flag off, Your home holds Pets at home and Hemisphere, and the tile's state line doesn't mention location.

When the flag is on, inside the Your home sheet, under Hemisphere:

- The **Country** and **ZIP code** fields are always showing. There's no "Add" tap and no separate step.
- The label follows the country: **"ZIP code"** for United States, **"Postcode"** for United Kingdom. The placeholders stay as they are (`e.g. 10001`, `e.g. SW1A 1AA`).
- **Saves by itself.** When the user stops typing (or leaves the field) and the code is found, it saves through the existing location update. The server derives the zone, and a line shows "✓ Saved · USDA zone 7b" with **Undo**. Undo puts back the previous country, code and zone.
- **Not found:** a message under the field says the code wasn't found and nothing was saved. The previous location stays.
- **While looking up:** "Looking up…" under the field, announced politely to screen readers.
- **Enter it instead** (type your own zone) stays. It opens a single zone field in place that follows the same rules: it saves when the field is left, shows the saved line and Undo, and shows an error if it's empty.

## Removed from Profile

These leave the page; their code stays.

- **Moving in this change:** stats and Plant personality (see "Stats and personality on Care").
- **Hidden per scope v1 ("later"):** tier card and the tier line under the name, Verification status, Featured badges, Bouquets, Challenges.
- **Recent notifications** button, now a link on the Notifications page.

## Stats and personality on Care

**Stats.** Plants and Care logs are already tiles on Care › Progress (`CareGrowthPage.js`), so they need no move. "Check-ins this week" is the only stat that exists only on Profile. It goes in two places:

- **Care › Progress:** a fourth tile, "Check-ins this week · 1 of 3", next to Plants, Care logs and Hours. At large text the tiles wrap to two columns.
- **Care › Today:** one short line, "Check-ins this week: 1 of 3", under the due list. It is plain text, not a card, so it doesn't compete with the due list (Today is core in scope v1).

Both read `stats.check_ins.this_week` and `weekly_goal` from the existing stats call.

**Plant personality.** This change replaces the AI version with a simple rule-based one. The AI version needed the Anthropic key, and its backend prompt fed every user a made-up 75% watering consistency (`grove-backend/server.py:1872`). The new version:

- Works out the personality on the page from numbers the stats call already returns. No AI, no Generate button, no backend change. It updates as the numbers change.
- Lives on Care › Progress as a card under the tiles.
- Takes the first rule that matches:

| Rule (from `/stats`) | Title | Line (approved 2026-11-16) |
|---|---|---|
| `total_plants` is 0 | none | "Add a plant and we'll start figuring out your plant personality." |
| `total_care_logs` is 0 | The Fresh Start | "New plants, new chapter. You're in the getting-to-know-you phase, and that's the fun part." |
| `propagation_count` ≥ 1 | The Propagator | "You look at a stem and see a whole new plant. Patient, curious, a little bit mad scientist." |
| `total_plants` ≥ 10 | The Jungle Keeper | "Ten or more plants. That's not a plant, that's a household. Bet you know every one's quirks." |
| `plants_needing_water` is 0 and `total_care_logs` ≥ 5 | The Steady Hand | "You show up when your plants need you, right on time. Routine might be your love language." |
| `check_ins.this_week` ≥ `weekly_goal` | The Regular | "Check-in goal met. You'd rather spot something early than fix it late." |
| `plants_needing_water` > half of `total_plants` | The Big-Picture Gardener | "You think in big moves, not tiny chores. Today handles the details: who to visit first, one plant at a time." |
| anything else | The Growing Gardener | "Still finding your rhythm and noticing as you go. That's how plant people are made." |

- The app sees what people log, not what they do: someone who cares for their plants but never logs looks like someone who forgets. So the lines make generous, playful guesses about the person, never claims about plant health and never a hint of neglect. The Big-Picture line points to Today, in line with the safe-recovery rule.
- The thresholds (5 logs, 10 plants) are guesses, not findings. Untested with the audience: in research sessions, check whether new owners read the card as fun or as being graded, especially Fresh Start and Big-Picture.
- The rules live in one pure function (`lib/plantPersonality.js`) with a unit test per row.
- `POST /users/me/generate-personality` and the saved `personality_title` and `personality_body` fields are left in place but no longer used. Removing them is a separate cleanup.

## About copy (approved 2026-11-16)

The current mission text (`constants/brand.js`) says "plant enthusiasts", which is the wrong audience for v1. Draft:

> FloraGrove is for people who want to become confident with taking care of plants. It shows what each plant needs today and why, and helps you put things right when something goes wrong.

This uses only what v1 does (Today, Help my plant). `GROVE_BRAND.mission` is also shown on the Help page (`HelpPage.js`), so the new text appears there too.

## Done means

- Hub and every sheet checked at default text and at 200%, with reduced motion on, keyboard only, and with a screen reader label pass.
- Focus order, focus return and error states covered by tests, in the style of `HelpSheet.test.js` and `PageHeader.help.test.js`.
- Existing tests for these settings (`profile-*` test ids) are moved, not dropped.
- The personality rules have a unit test per row, and Progress and Today have tests for the check-ins line.
- Onboarding's zip step (`ZoneSteps.js`, flag on only) says "ZIP code" in its label and intro, matching the sheet.
- `npm test` and `npm run build` pass.

## Decisions (2026-11-16)

1. **Stats and personality** move in this change, not a follow-up. Check-ins go on both Progress and Today. Personality becomes rule-based, without AI.
2. **Recent notifications** is a link at the top of the Notifications page.
3. **About copy** changes in this work, with the text Hillary approved above.
4. **Onboarding** uses "ZIP code" too.
5. **Location** follows scope v1: built, behind `REACT_APP_ZIP_ZONE`.
