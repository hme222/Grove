# Pip's nook: optional pixel room and lesson guide

Date: 2026-10-13
Revised: 2026-10-14 (v4)
Status: Draft for review. Not approved for planning.

## Revision notes

**v4 (2026-10-14)** aligns the design with how Grove already works, after
reading the app:

- The pixel scene is renamed **Pip's nook**, because "Rooms" already means the
  rooms of a home in Grove.
- Pip's nook is **opt-in**. It resolves the tension with the onboarding
  promise "Grove does not gamify your plants."
- Pip **hosts Grove's existing lessons** instead of running a separate
  tutorial. A short quiz picks the lesson track.
- Rewards follow Grove's own soil-led teaching ("listen to the soil, not the
  calendar"). Care windows, the on-time streak, and rest tokens from v3 are
  removed.
- Nook progress derives from signals Grove already has: care logs, lessons,
  missions, and badges.

**v3** made Pip a week-1 tutorial and added the virtual plant. **v2** fixed
cadence, honest sprites, and Pip's roles.

## 1. Purpose and scope

Grove helps people pay attention to what a plant actually needs. The nook is an
optional layer that celebrates that attention and the learning behind it, with
a mascot, Pip, who guides the first week. The audience is **new plant
owners** (the confirmed MVP audience, see `docs/product/confirmed-context.md`).

This spec covers:

- **Pip**: an 8-bit guide and Grove's mascot.
- **Pip's nook**: an optional pixel scene that fills in as the user learns and
  cares.
- **Lesson hosting**: Pip presenting Grove's existing lessons.
- **Plant sprites**: pixel versions of real and virtual plants.
- **The nook layer**: the rules that turn existing Grove signals into nook
  progress.

It does not cover plant identification, diagnosis, reminders, or community
features.

### Success criteria

Primary metric for the first 90 days: **share of new users who add a first
real plant.**

Track alongside it: nook opt-in rate, quiz completed, week-1 lessons
completed, soil tests logged, virtual plant to real plant, and first soil test
within 7 days.

Guardrails, which count as failures if broken:

- No core Grove feature requires the nook.
- The nook is offered once. Declining is respected and never nagged.
- No progress is ever removed from a user.
- No copy shames or guilt-trips a user.
- The reward system never pays a user to overwater.
- A plant sprite never shows a condition the user's records, or a clearly
  labeled simulation, do not support.
- A virtual plant is never presented as a real one.
- The nook never scores or grades a plant. It rewards the person's attention.

### Stated by the founder

- Gamified 8-bit plant with a small room, now called Pip's nook.
- Mascot with a refined Pinterest/IG look.
- Care drives growth, and growth earns decor (layered loop).
- Decor is fixed first. Chosen decor opens after 30 days in the app.
- In the first week, Pip is a tutorial. Then Pip goes on the shelf.
- A user who owns no plant continues with a virtual plant that follows a real
  schedule, and it earns the full reward.
- The nook is opt-in.
- A quiz picks the lesson track.
- The logic follows current Grove logic, including lessons that Pip guides.
- Success metric: first real plant added.
- One hero plant, other plants on the shelf.
- Pip sits on the sill first and moves to the shelf at level 2.
- Web first, in `grove-frontend` (React) with Storybook.
- Decor is free in v1. Monetization is decided later.
- Growth and decor carry over when a real plant is added.

### Assumptions (change these if wrong)

- "30 days in app" means 30 **calendar days since signup**.
- "Within a week" means the guided tutorial ends when the track's lessons are
  finished or at day 7, whichever comes first.
- Lessons are core Grove. Users who decline the nook still get the lessons,
  shown without Pip.
- The muted, refined palette is a taste decision. Research found no data on
  palette trends.
- The reference pacing in section 3 is a model of a typical user, not
  measured data.

## 2. Research basis and limits

- Finch's design is the closest outside model: no penalties for missed days, a
  pet and room as the reward surface, and no red failure marks. Evidence is
  design write-ups, not company data. A critique flags too many customization
  options at the start as overwhelming.
- No source reviewed measures the effect of streak freezes on retention.
- Streak anxiety is described by practitioner commentary. No controlled
  studies were found.
- Sources agree new owners often overwater, and better plant apps ask users to
  confirm soil moisture. Grove's own Soil Finger-Test lesson teaches the same.
- Pixel art revival claims come from vendor blogs and are not verified.
- Study 002 is synthetic. Its findings are predictions, not user evidence.

## 3. The nook layer

The nook layer is a pure module with no UI. It reads existing Grove signals
and a few new events, and returns nook state. It is not a second game engine.
Growth is derived from the event log on every read, never a stored counter.

### Opt-in

- After the quiz, Pip's nook is offered once on a single card, in the same
  style as Grove's one-card section tutorials. Proposed copy, for content
  review: "Optional: a small pixel nook that grows as you learn. It never
  scores your plants."
- The offer is recorded so it is never repeated. The choice can change at any
  time in Settings, next to Tutorials and tips.
- Without the nook, lessons, missions, badges, and Care Today work exactly as
  they do now.

### Signals and rewards

Rewards come from what Grove already records, plus a few new events. Values are
starting points to tune.

| Signal | Source | Growth | Limit |
|---|---|---|---|
| Lesson completed | New event; stored as `lesson:<id>` in `tutorials_seen[]` | +15 | Once per lesson |
| Soil test logged, with outcome (dry or damp) | **New event.** Not in the care log today. | +15 | Once per plant per day |
| Right decision: damp, and the user chooses to wait | New `decision` on the soil test | +10 | With the soil test |
| Right decision: dry, and the user waters | Existing water log | +10 | With the soil test |
| Water logged on damp soil | Existing water log | +0, with a gentle note | n/a |
| Light check | New event | +10 | Once per plant per 14 days |
| Leaves wiped | Existing care log | +5 | Once per plant per 14 days |
| Daily mission completed | Existing missions | Mission's existing XP (10 to 15) | Once per day |
| Badge earned | Existing badges | +20 | Once per badge |

- "Walk away" is a win. Checking damp soil and waiting earns the same as
  checking dry soil and watering.
- There are no care windows. Checking early is never penalized, because the
  lesson says to listen to the soil, not the calendar.
- Room growth is capped at **30 per day**.
- Growth belongs to the user's nook, not to a plant, so it carries from a
  virtual plant to a real one.

### Levels and unlocks

| Level | Name | Growth needed | Unlocks |
|---|---|---|---|
| 1 | Bare | 0 | Window, table, sill, floor |
| 2 | Settling in | 100 | Shelf. Pip moves onto it. |
| 3 | Lived in | 220 | Rug and lamp |
| 4 | In bloom | 420 | Hanging pothos, botanical print, Pip's bloom form |

Unlocks are never removed. Each level also appears as a badge in the existing
"working toward" section, so progress stays in one place.

**Reference user** for tuning: week 1 earns about 130 (two lessons, three soil
decisions, two missions). Later weeks earn about 100 (three soil decisions,
one or two missions). That gives level 2 near the end of week 1, level 3 near
the end of week 2, and level 4 near the end of week 4, just before the catalog
at day 30. Thresholds must be simulated against real activity logs before they
are fixed.

### Streak

The nook reuses Grove's existing daily streak and streak badges. It adds no
new streak and no rest tokens. A soil test and a wait decision count as care
logs, so a day of checking and waiting keeps the streak.

### Plants: real and virtual

- A **real plant** uses the due date Grove already tracks. If a plant shows
  "Schedule needed," the nook uses a starter schedule from its species and
  labels it.
- A **virtual plant** is for users with no plant. They pick a species from the
  sprite templates. Its soil dries on a species-based model over **real days**
  and resets when watered. A "peek" reveals the simulated moisture, so it
  cannot be tapped without effect. It earns the same growth as a real plant
  and is always labeled virtual. Reminders for it are off by default.

### Plant condition (sprite state)

| Condition | Meaning |
|---|---|
| `fine` | Nothing due, and no concern in the health check. |
| `due-soon` | The plant's due date is today or tomorrow. |
| `needs-attention` | Overdue, or the user flagged "looks off," or the health check shows a low factor. |

For a real plant, condition comes from the existing schedule, the user's logs,
and Grove's 6-factor plant health breakdown. For a virtual plant, it comes
from the moisture model and is labeled "virtual." Condition never comes from
nook growth. The user can set "looks off" on any real plant.

### Catalog gate

The choose-your-own decor catalog opens at **30 calendar days since signup**
for users who have the nook on. It does not require a real plant.

## 4. Pip hosts the lessons

**Pip is the guide. Pip is not a plant.**

### Quiz and tracks

A short quiz after onboarding picks the user's track. It is new. Grove's
onboarding has no quiz today, and the backend stores no track.

Draft quiz and mapping, for content review. The track names below are internal
labels from the lesson pages. Users never see them.

| If the user says... | Track | Lesson |
|---|---|---|
| "I killed a plant and feel bad about it" | Reset (Heartbroken Optimist) | Plant Parent Reset, 5 lessons |
| "I overwater or don't trust my instincts" | Rebirth (Recovering Black Thumb) | Soil Finger-Test, 5 cards |
| "Someone gave me a plant and I have no idea what to do" | Rescue (Accidental Guardian) | Plant ER, 5 cards |
| "I forget to care for my plants" | Steady Sprout | Habit Stacking, 5 cards |
| "I want to design with plants, or I have none yet" | Seedling (Botanical Visionary) | Window Blueprint, 5 cards |

Everyone also gets the **Quick Wins** mini-lesson first. Lesson content
already exists on the static lesson pages and is used as written. Two other
lesson pages (Chunky Aroid Mix, Plant Cluster) were not reviewed, and their
tracks are unknown.

### Week-1 tutorial

- Pip is on the sill from the first screen, if the user opted in.
- Pip presents Quick Wins, then the user's track lesson. Without the nook, the
  same cards appear without Pip.
- The first real action is the lesson's own interactive card. The Soil
  Finger-Test ends with "Log my first soil test," which becomes the first soil
  test event.
- The existing first-care celebration still fires on the first care log. Pip
  reacts after the user dismisses it, so there is no double celebration.
- The tutorial ends when the track's lessons are finished or at day 7. After
  that, Pip stops prompting and speaks only to celebrate a level-up or on
  request.
- Pip stays on the sill until the shelf unlocks at level 2, then moves onto
  the shelf and stays there.
- Pip grows with the nook level through four forms: seed, sprout, leafy, and
  the founder's bloom flower at level 4. The copy says "Pip grows with you."
- Pip never droops and never reflects plant health.

### Virtual plant to real plant

A user can add a real plant at any time. It becomes the hero on the table. The
virtual plant moves to the shelf as a labeled keepsake, and the user can retire
it. Growth and unlocked decor carry over.

## 5. Pip's nook and slots

- Fixed 128 x 80 logical pixel layout, drawn on canvas and scaled by whole
  numbers only.
- Named slots: `table` (hero plant), `sill` (Pip at first), `shelf`, `rug`,
  `lamp`, `wall-art`, `hanging`, `window`.
- Each slot is `locked` (faint outline), `unlocked` (fixed item), or `open`
  (after the catalog gate, with about 3 variants per slot).
- Items use an interface (`id`, `slot`, `draw` or `image`) so any item can
  later switch from a drawn sprite to a PNG without changing the layer or
  renderer.
- The user chooses the hero plant. Other plants, including a retired virtual
  one, appear as small pots on the shelf.
- Plants use sprite templates by species group: pothos, monstera, succulent,
  snake plant, generic. Each has **three condition states** and no growth
  stages. Plants never get faces and never bloom on screen.
- On a 343px phone, whole-number scaling gives 2x (256px), so a face drawn at
  that size is about 32px, too small to carry mood alone.

### Accessibility

- Canvas is not readable by assistive technology, so the same state is shown
  as text: level, plant conditions, unlocked items, and the **next unlock**
  ("Shelf unlocks at 12 more growth").
- Condition is always a text label, never the face alone.
- Pip's idle bob stops when `prefers-reduced-motion` is set.
- Meaning never relies on color alone.
- Each real plant sprite states its source in plain language: "From your
  records and Grove's plant check."

## 6. Visual language

- Palette: sage (`#A9C5A0`, `#6E9A74`, `#44684F`), cream (`#F3EAD9`),
  terracotta (`#C98B6B`, `#A56A4E`), blush (`#E8B4B0`), ink (`#3B3A36`).
  Final values should map to Grove design tokens.
- Pip's bloom form uses the founder's pixel flower: pink petals, amber center,
  green stem and leaves, with the saturation lowered to match the palette.
- Sprites are drawn on a 16 x 16 grid. The nook is 128 x 80.
- Pip's face shows reaction through eyes and mouth only.
- A virtual plant carries a small "virtual" tag on its pot.

## 7. Ethics guardrails

- Nothing a user earned is ever removed.
- No red failure marks, no streak-loss warnings, no guilt copy. Pip's voice is
  warm and plain, and lesson text is used as already written.
- The nook rewards the person's attention and learning. It never scores a
  plant.
- Decor is free in v1. If monetization is added later, it needs its own review.
- A virtual plant is always labeled virtual, in the sprite and in text.
- A real plant sprite always cites what it is based on, and the user can
  override it.
- Virtual-plant reminders are opt-in. Any other notification is optional and
  capped by user settings.

## 8. Testing and Storybook

Layer tests, using fixed fake dates and a stubbed event log:

- Each signal's growth, limits, and the 30-per-day cap.
- The soil-decision matrix: damp and wait, dry and water, damp and water, dry
  and wait.
- No penalty for early checks.
- Lesson completion recorded once and counted once.
- Level thresholds and unlock order, checked against the reference user.
- Existing streak updates correctly from soil tests and wait decisions.
- Opt-in offered once, declined, and re-enabled in Settings, with core
  features unchanged.
- Quiz answers mapping to the right track.
- Real plant condition from schedule, health factors, and "looks off."
- Starter schedule used and labeled when a plant has none.
- Virtual plant moisture model over simulated days, including peek and
  watering.
- Carry-over of growth and unlocks from a virtual plant to a real one.
- Catalog gate at 30 days with the nook on and off.

Storybook stories:

- Pip in each of four forms and each reaction, on the sill and on the shelf.
- Plant templates in each of three conditions, real and virtual.
- Nook states for levels 1 to 4.
- Locked, unlocked, and catalog-open slots.
- A lesson card hosted by Pip and the same card without Pip.
- The quiz, the opt-in card, and the post-tutorial nook.

## 9. How this fits existing Grove systems

Verified by reading `grove-backend` and `grove-frontend`.

| Existing | Where | How the nook relates |
|---|---|---|
| Onboarding promise "Grove does not gamify your plants" | `components/Onboarding.js` | **Resolved by opt-in.** Reword the nook offer so it doesn't contradict the promise. |
| Master lessons and Quick Wins (static pages, not wired) | `pages/SoilFingerTestVariation.js`, `QuickWinVariations.js`, `ResetCourseVariation.js`, `PlantERVariations.js`, `HabitStackingVariations.js`, `WindowBlueprintVariations.js` | **Reuse content as written.** They must become real lesson screens that save progress. |
| One-time tutorials in `tutorials_seen[]`; badges already read it (`light_reader`) | `components/SectionTutorial.js`, `grove-backend/server.py` | **Reuse** for opt-in, quiz, and lesson completion. |
| First-session banner and first-care celebration | `FirstSessionBanner.js`, `FirstCareCelebration.js`, server flags | **Reuse.** Pip reacts after the celebration. |
| Daily missions with XP, including `water_streak` | `grove-backend/missions.py` | **Conflict.** "Water at least 1 plant today" works against the Soil Finger-Test lesson. Replace it with a soil-check mission. |
| Bulk "water round" | `pages/CarePage.js` | **Conflict.** It waters every plant without a check. Gate it behind a check or a due state. |
| Daily streak and streak badges | `update_streak`, `server.py`, `BadgesPage.js` | **Reuse.** The nook adds no streak. |
| Badges and "working toward" | `badge_catalog.py`, `badge_progress.py`, `WorkingTowardSection.js` | **Reuse** as the surface for nook levels. |
| Per-plant `next_water_due` | `pages/CarePage.js` | **Reuse** as the due date. Plants without it use a starter schedule. |
| Species data (`default_watering_days`) | `grove-backend/server.py` | **Likely source** for the starter schedule and the virtual plant model. |
| 6-factor plant health breakdown | `grove-backend/server.py` | **Reuse** for real plant condition. |
| "Rooms" (rooms of a home), room scan | `pages/RoomPage.js`, `RoomScanScreen.js` | **Name collision.** Resolved by calling the scene "Pip's nook." |
| `CozyRoomPlannerVariations`, `CareGrowthPage` | `grove-frontend/src/pages` | **Not reviewed.** May overlap with the nook or growth view. |
| Study 001 framing: calm, non-gamified, rooms and badges out of scope | `docs/research/studies/trusted-first-care-action.md` | **Tension.** Test the nook as a separate opt-in layer in a new study. |

## 10. Open review findings

- **A virtual plant can replace a real one.** With full parity, a user may stay
  on a virtual plant and never add a real one. Track the funnel and revisit.
- **Virtual care teaches the idea of listening to the soil, not the feel of
  it.** Copy must not imply otherwise.
- **The soil test is self-reported for real plants.** It can be tapped without
  touching the soil. The lesson's "no wrong answer" framing accepts this.
- **No share surface.** There is no share card, export, or crop.
- **First-week load.** The first week now holds a quiz, an opt-in card,
  lessons, and a first soil test. This may be too much.
- **Real-user evidence.** Everything so far is synthetic.

## 11. Open questions

- Quiz content and wording, and who validates the track mapping.
- Where the soil test outcome and decision are stored. The care log has no such
  type today.
- Whether XP from missions rolls up into any level or total. This was not
  confirmed.
- Whether the reference-user pacing holds against real activity logs.
- Whether the opt-in card should come before or after the quiz.
- Who owns the decision to replace the `water_streak` mission and gate the
  bulk water round.
- Whether 5 species templates is the right v1 set.
- How users with several plants on the same day are handled.
- The tracks of the Chunky Aroid Mix and Plant Cluster lessons.
