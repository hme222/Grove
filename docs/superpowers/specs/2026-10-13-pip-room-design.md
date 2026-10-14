# Pip room: gamified pixel room and guide

Date: 2026-10-13
Revised: 2026-10-14 (v2)
Status: Draft for review. Not approved for planning.

## Revision notes (v2)

A senior UX review raised eight problems. This version fixes three:

1. **Cadence.** Growth and streaks now follow each plant's care rhythm, not a
   daily clock.
2. **Honest sprites.** A real plant's sprite shows the plant's condition. Room
   progress is separate.
3. **Pip's jobs.** Pip is now the guide character only. Plants are plants.

Five findings are deferred until after user testing (Study 002). They are
listed in section 10.

Reading the codebase also surfaced existing systems that overlap with this
spec. Section 9 covers them.

## 1. Purpose and scope

Grove needs a mascot and a care loop that make early plant care feel
confident and calm for **new plant owners** (the confirmed MVP audience, see
`docs/product/confirmed-context.md`).

This spec covers:

- **Pip**: an 8-bit guide character and Grove's mascot.
- **The room**: a small pixel room that shows the user's progress and
  unlocks decor.
- **Plant sprites**: pixel versions of the user's real plants.
- **The game engine**: the rules that turn real care events into room
  progress.

It does not cover plant identification, diagnosis, reminders, or community
features.

### Success criteria

Primary metric for the first 90 days: **share of trial users who add a first
real plant.**

Guardrails, which count as failures if broken:

- No progress is ever removed from a user.
- No copy shames or guilt-trips a user.
- The reward system never pays a user to overwater.
- A plant sprite never shows a condition the user's records and Grove's health
  check do not support.

### Stated by the founder

- Gamified 8-bit plant with a small room.
- Mascot with a refined Pinterest/IG look.
- Care drives growth, and growth earns decor (layered loop).
- Decor is fixed first. Chosen decor opens after 30 days in the app.
- Pip is a trial that shows the experience before a user adds a real plant.
  Growth and decor carry over to the real plant.
- Success metric: first real plant added.
- One hero plant, other plants on a shelf.
- Web first, in `grove-frontend` (React) with Storybook.
- Decor is free in v1. Monetization is decided later.

### Assumptions (change these if wrong)

- "30 days in app" means 30 **calendar days since signup**.
- The muted, refined palette is a taste decision. Research found no data on
  palette trends.
- No retention targets are set, because there is no baseline data yet.

## 2. Research basis and limits

- Finch's design is the closest model: no penalties for missed days, a pet and
  room as the reward surface, and no red failure marks. Evidence is design
  write-ups, not company data. Reviewers note a cost: no consequences can
  reduce accountability for some users. A critique flags too many
  customization options at the start as overwhelming.
- Duolingo's streak freeze is a common mechanic, but no source reviewed
  measures its effect on retention. Rest tokens are justified as design
  judgment, not as a proven lift.
- Streak anxiety is described by practitioner commentary. No controlled
  studies were found.
- Plant-care apps lean on per-plant schedules, and sources agree new owners
  often overwater. Better apps ask users to confirm soil moisture instead of
  watering on a fixed calendar.
- Pixel art revival claims come from vendor blogs and are not verified.

## 3. Game engine

The engine is a pure module with no UI. Input is a list of care events, each
plant's schedule and condition, and the current date. Output is the room state
and each plant's sprite condition.

### Events

Each event has a type, a timestamp, and a `plantId`.

| Event | Meaning |
|---|---|
| `soil_checked` | User confirmed soil moisture (dry or damp). |
| `watered` | User watered the plant. |
| `light_checked` | User confirmed the plant's light spot. |
| `leaves_wiped` | User cleaned the leaves. |

`plantId` is `practice` (the trial plant) or a real plant id.

### Care windows

A **care window** is the period around a real plant's due date. It opens 1 day
before the due date and closes 2 days after. The due date comes from the
plant's existing schedule (see section 9).

- An action inside its window earns growth.
- An action outside the window is logged but earns no growth. The user sees a
  neutral note, for example "Logged. Soil changes slowly, so we'll ask again
  around Thursday." Nothing is taken away.

### Growth

Growth belongs to the **user's room**, not to a plant. This is what lets
progress carry over from the practice plant to a real plant.

| Action | Growth | Frequency limit |
|---|---|---|
| `soil_checked` in window | +15 | Once per plant per cycle |
| `watered` in window, when the check was dry or the plant is due | +10 | Once per plant per cycle |
| `light_checked` | +10 | Once per plant per 14 days |
| `leaves_wiped` | +5 | Once per plant per 14 days |
| On-time bonus (check done in window, plus watering if due) | +10 | Once per plant per cycle |

- Cycle growth is multiplied by `min(2, cycleDays / 7)`, so plants on long
  cycles (snake plants, succulents) do not stall the room.
- Room growth is capped at **30 per day**, which stops farming across many
  plants.
- Watering damp soil, or watering twice in a cycle, earns nothing. The reward
  is for the check, not for the watering.
- Growth is calculated from the event log on every read. It is never a stored
  counter.

### Room levels and unlocks

| Level | Name | Growth needed | Unlocks |
|---|---|---|---|
| 1 | Bare | 0 | Window, table, sill, floor |
| 2 | Settling in | 30 | Shelf |
| 3 | Lived in | 80 | Rug and lamp |
| 4 | In bloom | 180 | Hanging pothos, botanical print, Pip's bloom form |

Unlocks are never removed.

**Pacing target** for one plant on a 7-day cycle with full on-time care
(about 50 growth per cycle):

- Level 2 near the end of week 1.
- Level 3 near the end of week 2.
- Level 4 near the end of week 4, just before the catalog opens at day 30.

Thresholds are starting values to tune once there is real data. They exist to
spread the fixed unlocks across the first month, with no long dead stretch.

### Streak and rest tokens

- The **on-time streak** counts consecutive care windows met across the user's
  plants. It is shown as "N on-time check-ins", never as days.
- A user starts with 2 rest tokens. A missed window uses a token and keeps the
  streak. With no tokens, the streak resets to 0. Room growth and level never
  go down.
- One token is earned back for every 4 windows met, up to a maximum of 3.
- Rest tokens are hidden from the interface until the first time one is needed.

### Plant condition (sprite state)

For each real plant the engine outputs a condition:

| Condition | Meaning |
|---|---|
| `fine` | Nothing due, and the health check shows no concern. |
| `due-soon` | The care window is open. |
| `needs-attention` | Overdue past the window, or the user flagged "looks off", or the health check shows a low factor. |

Condition comes from the schedule, the user's logs, and Grove's existing
plant health breakdown. It never comes from room growth or from how often the
user taps. The user can set "looks off" on any plant, which overrides to
`needs-attention`.

### Catalog gate

The choose-your-own decor catalog opens when **both** are true:

1. 30 calendar days have passed since signup.
2. The user has added at least one real plant.

## 4. Pip and the practice plant

**Pip is the guide, and only the guide.** Pip is the mascot.

- Pip lives on the windowsill from the first screen and stays there.
- Pip grows with the room level through four forms: seed, sprout, leafy, and
  the founder's bloom flower at level 4. The copy says "Pip grows with you."
  This is the user's progress, not a claim about any plant.
- Pip never droops and never reflects plant health. Pip's face reacts to
  actions and level-ups only: calm, pleased, celebrating.
- Pip speaks the care tips and keeps the warm, plain voice.

**The practice plant is a separate object.**

- A generic starter plant sits on the table, labeled **practice plant**.
- Trial care is simulated. Tapping care actions on it gives room growth and
  never touches a real plant's record.
- The trial has no streak, no rest tokens, and no `needs-attention` state. The
  practice plant counts as "due" once per day after a dry soil check, so the
  trial can teach the check-then-water order.
- Trial growth is capped at **80 (level 3)**. Level 4 stays as faint outlines.
  This cap is under review (section 10).

**When the user adds a real plant:**

- The real plant replaces the practice plant on the table.
- Pip stays on the sill.
- Room growth and unlocked decor carry over, and the cap is removed.
- The on-time streak, rest tokens, and plant conditions turn on.

## 5. Room and slots

- Fixed 128 x 80 logical pixel layout, drawn on canvas and scaled by whole
  numbers only.
- Named slots: `table` (hero plant), `sill` (Pip), `shelf`, `rug`, `lamp`,
  `wall-art`, `hanging`, `window`.
- Each slot is `locked` (faint outline), `unlocked` (fixed item), or `open`
  (after the catalog gate, with about 3 variants per slot).
- Items use an interface (`id`, `slot`, `draw` or `image`) so any item can
  later switch from a drawn sprite to a PNG without changing the engine or
  renderer.
- The user chooses the hero plant for the table. Other real plants appear as
  small pots on the shelf.
- Real plants use sprite templates by species group: pothos, monstera,
  succulent, snake plant, generic. Each template has **three condition
  states** (`fine`, `due-soon`, `needs-attention`) and no growth stages. Real
  plants never get faces and never bloom on screen.
- Template count is fixed for v1.

### Accessibility

- Canvas is not readable by assistive technology, so the same state is shown
  as text: level, on-time check-ins, plant conditions, and unlocked items.
- Pip's idle bob stops when `prefers-reduced-motion` is set.
- Meaning never relies on color alone. Condition changes leaf position and
  adds a text label as well as color.
- Each plant sprite states its source in text: "Based on your log and Grove's
  health check."

## 6. Visual language

- Palette: sage (`#A9C5A0`, `#6E9A74`, `#44684F`), cream (`#F3EAD9`),
  terracotta (`#C98B6B`, `#A56A4E`), blush (`#E8B4B0`), ink (`#3B3A36`).
  Final values should map to Grove design tokens when they exist.
- Pip's bloom form uses the founder's pixel flower: pink petals, amber center,
  green stem and leaves, with the saturation lowered to match the palette.
- Sprites are drawn on a 16 x 16 grid. The room is 128 x 80.
- Pip's face shows reaction through eyes and mouth only.

## 7. Ethics guardrails

- Nothing a user earned is ever removed.
- No red failure marks, no streak-loss warnings, no guilt copy. Pip's voice is
  warm and plain.
- Decor is free in v1. If monetization is added later, it needs its own review,
  and pricing must never be tied to a streak or a pressure moment.
- The practice plant is always labeled as practice.
- A plant sprite always cites what it is based on, and the user can override
  it.
- Any notification is optional and capped by user settings. Notification
  policy is specified separately.

## 8. Testing and Storybook

Engine tests, using fixed fake dates:

- Growth from each event, including zero growth for out-of-window actions,
  damp-soil watering, and a second watering in a cycle.
- The cycle multiplier for short and long cycles.
- The 30-per-day room cap with several plants.
- Level thresholds, unlock order, and the pacing target for a 7-day cycle.
- On-time streak, rest token use, token earn-back, and reset with no tokens.
- Plant condition from schedule, health factors, and the "looks off" override.
- Trial cap at 80 and removal on adding a real plant.
- Carry-over of growth and unlocks from the practice plant to a real plant.
- Catalog gate with each condition missing, then both met.

Storybook stories:

- Pip in each of four forms and each reaction.
- Plant templates in each of three conditions.
- Room states for levels 1 to 4.
- Locked, unlocked, and catalog-open slots.
- Trial room and post-hand-off room.

## 9. Existing Grove systems this overlaps

Reading `grove-backend` and `grove-frontend` found systems that already do
part of this. They must be reconciled before any plan is written.

| Existing | Where | Conflict or reuse |
|---|---|---|
| Per-plant `next_water_due` | `grove-frontend/src/pages/CarePage.js` | **Reuse** as the source of each plant's due date. Verify a cycle length is also available. |
| Daily streak (`last_log_date`, current and longest) | `update_streak` in `grove-backend/server.py` | **Conflict.** It counts daily logs. The on-time streak here counts care windows. Decide whether to replace, rename, or run both. |
| Daily missions, including `water_streak` ("Water at least 1 plant today") | `grove-backend/missions.py` | **Conflict.** This mission rewards daily watering, which is the overwatering pattern this spec avoids. It needs review whether or not this spec ships. |
| XP awarded by missions | `grove-backend/missions.py` | **Reconcile.** Room growth should either read from the existing XP or stay clearly separate. |
| Badges with streak families (7, 14, 30, 60 days) | `grove-backend/server.py`, `BadgesPage.js` | **Reconcile** with the on-time streak. |
| Explainable 6-factor plant health breakdown | `grove-backend/server.py` | **Reuse** as the health input for plant condition. |
| Existing pages: `CozyRoomPlannerVariations`, `CareGrowthPage` | `grove-frontend/src/pages` | **Review.** These may overlap with the room or growth view. |
| Study 001 framing: "calm, non-gamified" and rooms and badges are out of scope | `docs/research/studies/trusted-first-care-action.md` | **Tension.** This spec adds game mechanics. Study 002 tests whether they help or hurt. |

## 10. Deferred review findings

To be resolved after Study 002:

- **Soil check is a self-report.** It can be tapped without touching the soil
  and gives no feedback.
- **Trial withholding.** Capping the trial at level 3 and showing locked
  outlines may feel like a paywall without money, and it conflicts with the
  no-guilt guardrail.
- **The logging action is not designed.** The spec designs the reward, not
  how a user logs a check. Reminders and notifications are also out of scope.
- **No share surface.** There is no share card, export, or crop, so the
  Pinterest/IG hook is untested.
- **First-week load.** The first screen shows level, check-ins, and several
  actions. This may overwhelm new owners.

## 11. Open questions

- Retention and engagement targets beyond the primary metric. There is no
  baseline yet.
- Whether 5 species templates is the right v1 set.
- Whether the cycle length is already stored per plant.
- How the engine behaves for users who add several real plants on the same
  day.
- Whether a home-screen widget, like Finch's, comes after web.
- Who owns the decision on the existing daily streak and missions.
