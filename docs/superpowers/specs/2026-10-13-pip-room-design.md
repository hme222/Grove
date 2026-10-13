# Pip room: gamified pixel plant and room

Date: 2026-10-13
Status: Draft for review

## 1. Purpose and scope

Grove needs a mascot and a care loop that make early plant care feel
confident and calm for **new plant owners** (the confirmed MVP audience, see
`docs/product/confirmed-context.md`).

This spec covers:

- **Pip**: an 8-bit practice plant that is also Grove's mascot.
- **The room**: a small pixel room that shows the user's progress and
  unlocks decor.
- **The game engine**: the rules that turn real care events into growth,
  streaks, and unlocks.

It does not cover plant identification, diagnosis, reminders, or community
features. Those already belong to the wider Grove product.

### Success criteria

Primary metric for the first 90 days: **share of trial users who add a first
real plant.** Pip exists to make that step feel worth taking.

Guardrails, which count as failures if broken:

- No progress is ever removed from a user.
- No copy shames or guilt-trips a user.
- The reward system never pays a user to overwater.

### Stated by the founder

- Gamified 8-bit plant with a small room.
- Mascot with a refined Pinterest/IG look.
- Care drives growth, and growth earns decor (layered loop).
- Decor is fixed first. Chosen decor opens after 30 days in the app.
- Pip is a trial plant that shows the experience before a user adds a real
  plant. Growth and decor carry over to the real plant.
- Success metric: first real plant added.
- One hero plant, other plants on a shelf.
- Web first, in `grove-frontend` (React) with Storybook.
- Decor is free in v1. Monetization is decided later.

### Assumptions (change these if wrong)

- "30 days in app" means 30 **calendar days since signup**, so a missed day
  never delays the unlock.
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
- Plant-care apps (Planta, PictureThis, Greg) lean on per-plant schedules, and
  sources agree new owners often overwater. Better apps ask users to confirm
  soil moisture instead of watering on a fixed calendar.
- Pixel art revival claims come from vendor blogs and are not verified.

## 3. Game engine

The engine is a pure module with no UI. Input is a list of care events and the
current date. Output is the room state.

### Events

Each event has a type, a timestamp, and a `plantId`.

| Event | Meaning |
|---|---|
| `soil_checked` | User confirmed soil moisture (dry or damp). |
| `watered` | User watered the plant. |
| `light_checked` | User confirmed the plant's light spot. |
| `leaves_wiped` | User cleaned the leaves. |

`plantId` is either `pip` (practice) or a real plant id.

### Growth

Growth belongs to the **user's room**, not to a plant. This is what lets
progress carry over from Pip to a real plant.

| Action | Growth |
|---|---|
| `soil_checked` (once per plant per day) | +15 |
| `watered`, only when the last `soil_checked` was dry or the plant is due | +10 |
| `watered` when soil was damp, or a second watering the same day | +0, with a gentle note |
| `light_checked` (once per plant per day) | +10 |
| `leaves_wiped` (once per plant per day) | +5 |
| Full care day bonus (soil check, watering if due, light check) | +10 |

The reward is for the check, so a user cannot gain growth by watering more.
Growth is calculated from the event log on every read. It is never a stored
counter.

### Stages and unlocks

| Stage | Growth needed | Unlocks |
|---|---|---|
| Seed | 0 | Room starts with window, table, floor |
| Sprout | 30 | Shelf |
| Leafy | 80 | Rug and lamp |
| Bloom | 150 | Hanging pothos and botanical print |

Unlocks are never removed.

### Streak, rest tokens, mood

- Streak counts days with at least a `soil_checked` event.
- A user starts with 2 rest tokens. A missed day uses a token and keeps the
  streak. With no tokens, the streak resets to 0. Growth and stage never go
  down.
- One token is earned back for every 7 days of streak, up to a maximum of 3.
- Mood is `happy` or `droopy`. Pip or the real plant sprite is `droopy` after a
  missed day until the next care event. Droopy is visual only and has no
  other cost.

### Catalog gate

The choose-your-own decor catalog opens when **both** are true:

1. 30 calendar days have passed since signup.
2. The user has added at least one real plant.

## 4. Pip trial

- Pip is labeled **practice plant** and is present from the first screen.
- Trial care is simulated. Tapping care actions on Pip gives growth but
  never touches a real plant's record.
- The trial has no streak, no rest tokens, and no drooping. Pip counts as
  "due" for watering once per day after a dry soil check, so the trial can
  teach the check-then-water order.
- Trial growth is capped at **Leafy (80)**. The shelf, rug, and lamp unlock.
  The bloom, hanging pothos, and print stay as faint outlines so the user can
  see what a real plant would add.
- When the user adds a real plant:
  - The real plant takes the table slot.
  - Pip moves to the shelf and becomes the guide who speaks care tips.
  - Growth and unlocked decor carry over, and the cap is removed.
  - Streak, rest tokens, and drooping turn on.

## 5. Room and slots

- Fixed 128 x 80 logical pixel layout, drawn on canvas and scaled by whole
  numbers only.
- Named slots: `table` (hero plant), `shelf`, `rug`, `lamp`, `wall-art`,
  `hanging`, `window`.
- Each slot is `locked` (faint outline), `unlocked` (fixed item), or `open`
  (after the catalog gate, with about 3 variants per slot).
- Items use an interface (`id`, `slot`, `draw` or `image`) so any item can later
  switch from a drawn sprite to a PNG without changing the engine or
  renderer.
- The hero plant is chosen by the user. Other real plants appear as small pots
  on the shelf.
- Real plants use sprite templates by species group: pothos, monstera,
  succulent, snake plant, generic. Each has four stages. Template count is
  fixed for v1 and further species are out of scope.

### Accessibility

- Canvas is not readable by assistive technology, so the same state is shown
  as text: stage, streak, rest tokens, and unlocked items.
- Pip's idle bob stops when `prefers-reduced-motion` is set.
- Meaning never relies on color alone. Mood changes the face and leaf
  position as well as color.

## 6. Visual language

- Palette: sage (`#A9C5A0`, `#6E9A74`, `#44684F`), cream (`#F3EAD9`),
  terracotta (`#C98B6B`, `#A56A4E`), blush (`#E8B4B0`), ink (`#3B3A36`).
  Final values should map to Grove design tokens when they exist.
- Pip's bloom stage uses the founder's pixel flower: pink petals, amber center,
  green stem and leaves, with the saturation lowered to match the palette.
- Sprites are drawn on a 16 x 16 grid. The room is 128 x 80.
- Pip's face shows mood through eyes and mouth only.

## 7. Ethics guardrails

- Nothing a user earned is ever removed.
- No red failure marks, no streak-loss warnings, no guilt copy. Pip's voice is
  warm and plain.
- Decor is free in v1. If monetization is added later, it needs its own review
  and pricing must never be tied to a streak or a pressure moment.
- The practice plant is always labeled as practice.
- Any notification is optional and capped by user settings. Notification
  policy is specified separately.

## 8. Testing and Storybook

Engine tests, using fixed fake dates:

- Growth from each event, including the zero reward for a second watering and
  for watering damp soil.
- Stage thresholds and unlock order.
- Streak, rest token use, token earn-back, and reset with no tokens.
- Trial cap at 80 and removal on adding a real plant.
- Carry-over of growth and unlocks from Pip to a real plant.
- Catalog gate with each condition missing, then both met.

Storybook stories:

- Pip at each stage, happy and droopy.
- Room states: seed, sprout, leafy, bloom.
- Locked, unlocked, and catalog-open slots.
- Trial room and post-hand-off room.

## 9. Open questions

- Retention and engagement targets beyond the primary metric. There is no
  baseline yet.
- Whether 5 species templates is the right v1 set.
- How reminders and notifications interact with the engine. That is a
  separate spec.
- How the engine behaves for users who add several real plants at once on
  the same day.
- Whether a home-screen widget, like Finch's, comes after web.
