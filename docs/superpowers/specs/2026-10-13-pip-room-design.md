# Pip room: gamified pixel room and guide

Date: 2026-10-13
Revised: 2026-10-14 (v3)
Status: Draft for review. Not approved for planning.

## Revision notes

**v3 (2026-10-14)** follows the synthetic test (Study 002) and new founder
direction:

- Pip is a **week-1 tutorial guide**, then moves to the shelf.
- A user who owns no plant continues with a **virtual plant on a real
  schedule**. It earns full reward and is always labeled virtual.
- The practice plant and the level-3 trial cap are removed.
- Care windows scale with cycle length, and late logs earn partial credit.
- Plants with no schedule get a labeled starter schedule.
- Early checks get coaching from Pip, not silence.

**v2 (2026-10-14)** fixed three review findings: care cadence, honest plant
sprites, and Pip's roles.

Findings still open are in section 10. Overlaps with existing Grove systems
are in section 9.

## 1. Purpose and scope

Grove needs a mascot and a care loop that make early plant care feel
confident and calm for **new plant owners** (the confirmed MVP audience, see
`docs/product/confirmed-context.md`).

This spec covers:

- **Pip**: an 8-bit guide character and Grove's mascot.
- **The room**: a small pixel room that shows the user's progress and
  unlocks decor.
- **Plant sprites**: pixel versions of real and virtual plants.
- **The game engine**: the rules that turn care events into room progress.

It does not cover plant identification, diagnosis, reminders, or community
features.

### Success criteria

Primary metric for the first 90 days: **share of new users who add a first
real plant.**

Funnel steps to track alongside it: tutorial completed, virtual plant started,
virtual plant to real plant, and on-time check-ins in weeks 1 to 4.

Guardrails, which count as failures if broken:

- No progress is ever removed from a user.
- No copy shames or guilt-trips a user.
- The reward system never pays a user to overwater.
- A plant sprite never shows a condition the user's records, or a clearly
  labeled simulation, do not support.
- A virtual plant is never presented as a real one.

### Stated by the founder

- Gamified 8-bit plant with a small room.
- Mascot with a refined Pinterest/IG look.
- Care drives growth, and growth earns decor (layered loop).
- Decor is fixed first. Chosen decor opens after 30 days in the app.
- In the first week, Pip is only a tutorial. Then Pip goes on the shelf.
- A user who owns no plant continues with a virtual plant that follows a real
  schedule.
- A virtual plant earns the full reward, including level 4 and the catalog.
- Success metric: first real plant added.
- One hero plant, other plants on the shelf.
- Pip sits on the sill first and moves to the shelf at level 2.
- Web first, in `grove-frontend` (React) with Storybook.
- Decor is free in v1. Monetization is decided later.
- Growth and decor carry over when a real plant is added.

### Assumptions (change these if wrong)

- "30 days in app" means 30 **calendar days since signup**.
- "Within a week" means the tutorial ends when it is completed or at day 7,
  whichever comes first.
- The muted, refined palette is a taste decision. Research found no data on
  palette trends.
- No retention targets are set, because there is no baseline data yet.
- Virtual plants widen the audience beyond current owners. Study 001 excludes
  non-owners, so this needs a founder decision (section 11).

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
- Study 002 is synthetic. Its findings are predictions, not user evidence.

## 3. Game engine

The engine is a pure module with no UI. Input is a list of care events, each
plant's schedule and condition, and the current date. Output is the room state
and each plant's sprite condition.

### Plants

Every plant is `real` or `virtual`.

- A **real plant** has a due date from its schedule (section 9). If it has no
  schedule, the engine uses a **starter schedule** from its species and labels
  it "starter schedule." The user can edit it.
- A **virtual plant** is a species the user picks from the sprite templates.
  Its schedule comes from the species default, and its soil follows a
  moisture model on the **real clock**: it dries over real days at the species
  rate and resets when watered. Nothing about it is random.

### Events

Each event has a type, a timestamp, and a `plantId`.

| Event | Meaning |
|---|---|
| `soil_checked` | Real plant: the user confirmed soil moisture. Virtual plant: the user peeked, and the app revealed the simulated moisture. |
| `watered` | The user watered the plant. |
| `light_checked` | The user confirmed the plant's light spot. |
| `leaves_wiped` | The user cleaned the leaves. |

A peek on a virtual plant reveals the simulated state, so it cannot be tapped
without effect. That removes the self-report problem for virtual plants.

### Care windows

A **care window** is the period around a plant's due date.

- It opens 1 day before the due date.
- It closes at `max(2, ceil(0.2 × cycleDays))` days after the due date, so long
  cycles get wider windows.
- An action inside the window is **on time** and earns full growth.
- An action after the window closes but before the next window opens is
  **late**. It earns half growth, rounded down, and no streak credit.
- An action before the window opens is **early**. It earns no growth. Pip
  replies with coaching, for example "Dry 2 cm down? Not yet. I'll nudge you
  Thursday." Nothing is taken away.

### Growth

Growth belongs to the **user's room**, not to a plant. This is what lets
progress carry from a virtual plant to a real one.

| Action | Growth (on time) | Frequency limit |
|---|---|---|
| `soil_checked` | +15 | Once per plant per cycle |
| `watered`, when the check was dry or the plant is due | +10 | Once per plant per cycle |
| `light_checked` | +10 | Once per plant per 14 days |
| `leaves_wiped` | +5 | Once per plant per 14 days |
| On-time bonus (check on time, plus watering if due) | +10 | Once per plant per cycle |
| Tutorial completed | +15 | Once per user |

- Cycle growth is multiplied by `min(2, cycleDays / 7)`, so plants on long
  cycles do not stall the room.
- Room growth is capped at **30 per day**.
- Watering damp soil, or watering twice in a cycle, earns nothing. The reward
  is for the check, not for the watering.
- Growth is calculated from the event log on every read. It is never a stored
  counter.
- Real and virtual plants earn the same growth.

### Room levels and unlocks

| Level | Name | Growth needed | Unlocks |
|---|---|---|---|
| 1 | Bare | 0 | Window, table, sill, floor |
| 2 | Settling in | 30 | Shelf. Pip moves onto it. |
| 3 | Lived in | 80 | Rug and lamp |
| 4 | In bloom | 180 | Hanging pothos, botanical print, Pip's bloom form |

Unlocks are never removed.

**Pacing target** for one plant on a 7-day cycle with full on-time care
(about 50 growth per cycle, plus 15 for the tutorial):

- Level 2 near the end of week 1.
- Level 3 near the end of week 2.
- Level 4 near the end of week 4, just before the catalog opens at day 30.

Thresholds are starting values to tune with real data.

### Streak and rest tokens

- The **on-time streak** counts consecutive care windows met across the user's
  plants. It is shown as "N on-time check-ins," never as days.
- A user starts with 2 rest tokens. A missed window uses a token and keeps the
  streak. With no tokens, the streak resets to 0. Room growth and level never
  go down.
- One token is earned back for every 4 windows met, up to a maximum of 3.
- Rest tokens are hidden until the first time one is used. At that moment one
  line explains what happened.

### Plant condition (sprite state)

| Condition | Meaning |
|---|---|
| `fine` | Nothing due, and no concern in the health check. |
| `due-soon` | The care window is open. |
| `needs-attention` | Overdue past the window, or the user flagged "looks off," or the health check shows a low factor. |

For a real plant, condition comes from the schedule, the user's logs, and
Grove's existing plant health breakdown. For a virtual plant, it comes from
the moisture model and is always shown with the word "virtual." It never
comes from room growth or from how often the user taps. The user can set
"looks off" on any real plant, which overrides to `needs-attention`.

### Catalog gate

The choose-your-own decor catalog opens at **30 calendar days since signup**.
It does not require a real plant, because virtual plants earn full reward.

## 4. Pip: week-1 tutorial, then the shelf

**Pip is the guide. Pip is not a plant.**

- Pip is on the windowsill from the first screen.
- **Tutorial (week 1).** Pip walks the user through their first real actions:
  - Choose a plant: add a real one, or pick a virtual one.
  - Peek at or check the soil.
  - Water when dry, or learn to wait when damp.
  - Name the light spot.
- The tutorial ends when the user finishes the steps or at day 7, whichever is
  first. Finishing earns the one-time +15 growth. Reaching day 7 without
  finishing ends the guided prompts but keeps the steps available.
- **After the tutorial.** Pip stops prompting. Pip speaks only to coach an
  early check, to celebrate a level-up, or on request.
- Pip stays on the sill until the shelf unlocks at level 2, then moves onto
  the shelf and stays there.
- Pip grows with the room level through four forms: seed, sprout, leafy, and
  the founder's bloom flower at level 4. The copy says "Pip grows with you."
  This shows the user's progress, not a claim about any plant.
- Pip never droops and never reflects plant health. Pip's face reacts to
  actions and level-ups only: calm, pleased, celebrating.

**Virtual plant to real plant.** A user can add a real plant at any time.

- The real plant becomes the hero on the table.
- The virtual plant moves to the shelf as a labeled keepsake. The user can
  retire it.
- Room growth, unlocked decor, and the on-time streak all carry over.
- Reminders for a virtual plant are **off by default** and opt-in.

## 5. Room and slots

- Fixed 128 x 80 logical pixel layout, drawn on canvas and scaled by whole
  numbers only.
- Named slots: `table` (hero plant), `sill` (Pip at first), `shelf`, `rug`,
  `lamp`, `wall-art`, `hanging`, `window`.
- Each slot is `locked` (faint outline), `unlocked` (fixed item), or `open`
  (after the catalog gate, with about 3 variants per slot).
- Items use an interface (`id`, `slot`, `draw` or `image`) so any item can
  later switch from a drawn sprite to a PNG without changing the engine or
  renderer.
- The user chooses the hero plant for the table. Other plants, including a
  retired virtual one, appear as small pots on the shelf.
- Plants use sprite templates by species group: pothos, monstera, succulent,
  snake plant, generic. Each template has **three condition states** and no
  growth stages. Plants never get faces and never bloom on screen.
- Template count is fixed for v1. A virtual plant uses the same templates.
- On a 343px phone, whole-number scaling gives 2x (256px). A face drawn at that
  size is about 32px, too small to carry mood alone.

### Accessibility

- Canvas is not readable by assistive technology, so the same state is shown
  as text: level, on-time check-ins, plant conditions, unlocked items, and the
  **next unlock** ("Shelf unlocks at 12 more growth").
- Condition is always a text label, never the face alone.
- Pip's idle bob stops when `prefers-reduced-motion` is set.
- Meaning never relies on color alone. Condition changes leaf position and
  adds a text label as well as color.
- Each real plant sprite states its source in plain language: "From your
  records and Grove's plant check."

## 6. Visual language

- Palette: sage (`#A9C5A0`, `#6E9A74`, `#44684F`), cream (`#F3EAD9`),
  terracotta (`#C98B6B`, `#A56A4E`), blush (`#E8B4B0`), ink (`#3B3A36`).
  Final values should map to Grove design tokens when they exist.
- Pip's bloom form uses the founder's pixel flower: pink petals, amber center,
  green stem and leaves, with the saturation lowered to match the palette.
- Sprites are drawn on a 16 x 16 grid. The room is 128 x 80.
- Pip's face shows reaction through eyes and mouth only.
- A virtual plant carries a small "virtual" tag on its pot.

## 7. Ethics guardrails

- Nothing a user earned is ever removed.
- No red failure marks, no streak-loss warnings, no guilt copy. Pip's voice is
  warm and plain.
- Decor is free in v1. If monetization is added later, it needs its own review,
  and pricing must never be tied to a streak or a pressure moment.
- A virtual plant is always labeled virtual, in the sprite and in text.
- A real plant sprite always cites what it is based on, and the user can
  override it.
- Virtual-plant reminders are opt-in. Any other notification is optional and
  capped by user settings. Notification policy is specified separately.

## 8. Testing and Storybook

Engine tests, using fixed fake dates:

- Growth from each event, including zero growth for early actions, half growth
  for late actions, damp-soil watering, and a second watering in a cycle.
- Window length for short and long cycles.
- The cycle multiplier for short and long cycles.
- The 30-per-day room cap with several plants.
- The tutorial bonus applying once.
- Level thresholds, unlock order, and the pacing target for a 7-day cycle.
- On-time streak, rest token use, token earn-back, and reset with no tokens.
- Real plant condition from schedule, health factors, and "looks off."
- Starter schedule used and labeled when a plant has none.
- Virtual plant moisture model over simulated days, including a peek revealing
  the state and watering resetting it.
- Real and virtual plants earning identical growth.
- Carry-over of growth, unlocks, and streak when a real plant is added.
- Catalog gate at 30 calendar days with and without a real plant.

Storybook stories:

- Pip in each of four forms and each reaction, on the sill and on the shelf.
- Plant templates in each of three conditions, real and virtual.
- Room states for levels 1 to 4.
- Locked, unlocked, and catalog-open slots.
- Tutorial steps, and the post-tutorial room.

## 9. Existing Grove systems this overlaps

Reading `grove-backend` and `grove-frontend` found systems that already do
part of this. They must be reconciled before any plan is written.

| Existing | Where | Conflict or reuse |
|---|---|---|
| Per-plant `next_water_due` | `grove-frontend/src/pages/CarePage.js` | **Reuse** as the real plant's due date. Verify a cycle length is also available. Plants without it show "Schedule needed", which the starter schedule covers. |
| Species data | `grove-backend/curated_species.py` | **Possible source** for species default intervals and the virtual plant model. Verify it holds watering intervals. |
| Daily streak (`last_log_date`, current and longest) | `update_streak` in `grove-backend/server.py` | **Conflict.** It counts daily logs. The on-time streak counts care windows. Decide whether to replace, rename, or run both. |
| Daily missions, including `water_streak` ("Water at least 1 plant today") | `grove-backend/missions.py` | **Conflict.** This mission rewards daily watering, which is the overwatering pattern this spec avoids. A soil-check mission is the recommended replacement. |
| Bulk "water round" | `grove-frontend/src/pages/CarePage.js` | **Conflict.** It waters every plant at once, skipping the check. Gate it behind a check or a due state. |
| XP awarded by missions | `grove-backend/missions.py` | **Reconcile.** Room growth should either read from the existing XP or stay clearly separate. |
| Badges with streak families (7, 14, 30, 60 days) | `grove-backend/server.py`, `BadgesPage.js` | **Reconcile** with the on-time streak. |
| Explainable 6-factor plant health breakdown | `grove-backend/server.py` | **Reuse** as the health input for real plant condition. |
| Existing pages: `CozyRoomPlannerVariations`, `CareGrowthPage` | `grove-frontend/src/pages` | **Review.** Not read. They may overlap with the room or growth view. |
| Study 001 framing: "calm, non-gamified" and rooms and badges are out of scope | `docs/research/studies/trusted-first-care-action.md` | **Tension.** This spec adds game mechanics and a non-owner path. A new study should test them. |

## 10. Open review findings

Resolved in v3: the trial cap (removed), missing schedules (starter
schedule), narrow windows (scaled with late credit), and early-check
rejection (Pip coaching).

Still open:

- **A virtual plant can replace a real one.** With full parity, a user may stay
  on a virtual plant and never add a real one, which lowers the primary
  metric. This is a trade-off the founder accepted. Track the funnel and
  revisit with data.
- **Virtual care teaches schedule, not care.** A simulated plant teaches
  cadence but not how soil feels. Copy must not imply it does.
- **The logging action is not designed.** The spec designs the reward, not
  how a user logs a check. Reminders and notifications are also out of scope.
- **No share surface.** There is no share card, export, or crop, so the
  Pinterest/IG hook is untested.
- **First-week load.** The first screen shows level, check-ins, and several
  actions. This may overwhelm new owners.
- **Real-user evidence.** Everything so far is synthetic.

## 11. Open questions

- Is a non-owner audience in scope for the MVP? Virtual plants imply yes,
  while Study 001 excludes them.
- Do the existing daily streak, missions, and badges stay, get replaced, or run
  alongside the room? Who owns that decision?
- Retention and engagement targets beyond the primary metric. There is no
  baseline yet.
- Whether 5 species templates is the right v1 set.
- Whether the cycle length is already stored per plant.
- How the engine behaves for users who add several plants on the same day.
- Whether a home-screen widget, like Finch's, comes after web.
