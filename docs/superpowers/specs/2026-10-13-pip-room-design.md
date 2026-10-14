# Pip's nook: optional pixel nook and lesson guide

Date: 2026-10-13
Revised: 2026-10-14 (v5)
Status: Draft for review. Not approved for planning.

## Revision notes

**v5 (2026-10-14)** applies a second UX review of v4:

- A short quiz now leads into the track's lesson, which is the onboarding. Each
  lesson ends on a real "your turn" action.
- The nook is offered after the first real action, with a short Pip preview.
- Rewards are flat. Logging earns the same however the user decided, and the
  app coaches instead of grading. Numbers are hidden in the interface.
- The nook shows a **weekly rhythm**, not a streak chain.
- Pip returns daily through one "Pip's note" slot that mixes trivia and tips.
  A weekly nudge comes first, and a widget comes later.
- The virtual plant becomes a **seedling readiness** plant. It has no needs
  and no moisture model, and it leads toward a real plant.
- Pip goes quiet when any plant needs attention.
- The quiz is multi-select with one primary track.
- Success adds a confidence pulse and harm signals.
- Pip sits in a flat cream panel inside lesson cards.

**v4** made the nook opt-in and had Pip host Grove's lessons. **v3** added the
tutorial and virtual plant. **v2** fixed cadence, honest sprites, and Pip's
roles.

## 1. Purpose and scope

Grove helps people pay attention to what a plant actually needs. Pip's nook is
an optional layer that celebrates that attention and the learning behind it,
with a mascot, Pip, who guides the first week. The audience is **new plant
owners** (the confirmed MVP audience, see
`docs/product/confirmed-context.md`).

This spec covers:

- **Pip**: an 8-bit guide and Grove's mascot.
- **Pip's nook**: an optional pixel scene that fills in as the user learns and
  cares.
- **Lesson hosting**: Pip presenting Grove's existing lessons.
- **Plant sprites**: pixel versions of the user's real plants.
- **The seedling readiness plant**: a virtual plant for people who don't own
  one yet.
- **The nook layer**: the rules that turn existing Grove signals into nook
  progress.

It does not cover plant identification, diagnosis, or community features.

### Success criteria

Primary metric for the first 90 days: **share of new users who add a first
real plant.**

Track alongside it:

- Nook opt-in rate.
- Quiz completed, and first real action within 7 days.
- Lessons completed in week 1.
- Soil tests logged.
- Readiness plant to real plant.
- **Confidence pulse:** one question at day 7 and day 30, "How confident do you
  feel caring for your plants?"
- **Harm signals:** overwatering reports, uninstalls after a missed week, and
  Pip opt-outs.

Opt-in users choose themselves, so compare them with non-opt-in users
cautiously. A randomized offer timing is an option later.

Guardrails, which count as failures if broken:

- No core Grove feature requires the nook.
- The nook is offered once. Declining is respected and never nagged.
- No progress is ever removed from a user.
- No copy shames or guilt-trips a user.
- The reward system never pays a user to overwater.
- A plant sprite never shows a condition the user's records do not support.
- A readiness plant is never presented as a real plant and never has a need.
- The nook never scores or grades a plant, or a user's judgment.

### Stated by the founder

- Gamified 8-bit plant with a small room, now called Pip's nook.
- Mascot with a refined Pinterest/IG look.
- Care drives growth, and growth earns decor (layered loop).
- Decor is fixed first. Chosen decor opens after 30 days in the app.
- In the first week, Pip is a tutorial. Then Pip goes on the shelf.
- A user who owns no plant continues with a virtual plant (now the readiness
  plant).
- The nook is opt-in, offered after the first-care celebration with a preview.
- A quiz picks the lesson track and routes into the track lesson as onboarding.
- Rewards are flat for logging, with an optional note.
- A weekly rhythm replaces the streak chain in the nook.
- Pip returns daily as one note slot that mixes trivia and tips, with
  time-of-day personality.
- A weekly nudge and, later, a home-screen widget bring users back.
- Pip is quiet and supportive when a plant needs attention.
- Success adds a confidence pulse and harm signals.
- The logic follows current Grove logic.
- Success metric: first real plant added.
- One hero plant, other plants on the shelf.
- Pip sits on the sill first and moves to the shelf at level 2.
- Web first, in `grove-frontend` (React) with Storybook.
- Decor is free in v1. Monetization is decided later.

### Assumptions (change these if wrong)

- "30 days in app" means 30 **calendar days since signup**.
- "Within a week" means the guided tutorial ends when the user finishes the
  track lessons or at day 7, whichever comes first.
- Lessons are core Grove. Users who decline the nook still get them, shown
  without Pip.
- The first lesson is shown without Pip, because the nook is offered after the
  first real action.
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
- The two UX reviews of this spec were my own critique, not outside data.

## 3. The nook layer

The nook layer is a pure module with no UI. It reads existing Grove signals
and a few new events, and returns nook state. It is not a second game engine.
Growth is derived from the event log on every read, never a stored counter.

### Opt-in

- The nook is offered **once**, right after the first real action: the first
  care log (when the existing first-care celebration fires), or, for a user
  with no plant, the first readiness step.
- The offer is a single card in the style of Grove's one-card section
  tutorials, with a five-second Pip preview. Proposed copy, for content
  review: "Optional: a small pixel nook that grows as you learn. It never
  scores your plants."
- The offer is recorded so it is never repeated. The choice can change at any
  time in Settings, next to Tutorials and tips.
- Without the nook, lessons, missions, badges, trivia, and Care Today work
  exactly as they do now.

### Signals and rewards

Rewards come from what Grove already records, plus a few new events. Values are
starting points to tune. The interface shows no numbers. It only says that the
nook grew.

| Signal | Source | Growth | Limit |
|---|---|---|---|
| Lesson completed | New event, stored as `lesson:<id>` in `tutorials_seen[]` | +15 | Once per lesson |
| Soil test logged | **New event.** Not in the care log today. | +15, flat | Once per plant per day |
| Light check | New event | +10 | Once per plant per 14 days |
| Leaves wiped | Existing care log | +5 | Once per plant per 14 days |
| Readiness step | New event, readiness plant only | +10 | Once per step |
| Daily mission completed | Existing missions | Mission's existing XP (10 to 15) | Once per day |
| Badge earned | Existing badges | +20 | Once per badge |

- A soil test records its outcome (dry or damp) and the user's decision (water
  or wait). The reward is the same for every outcome and decision. A mismatch
  gets coaching, not fewer points. For example, damp soil and a plan to water
  gets "Damp? A good spot to wait."
- Watering itself earns nothing, so the system never pays for overwatering.
- Checking early is never penalized. The lesson says to listen to the soil, not
  the calendar.
- An optional **"what did you notice?"** note, with a few one-tap chips, is
  attached to the plant's journal. It earns no extra growth.
- Room growth is capped at **30 per day**.
- Growth belongs to the user's nook, not to a plant, so it carries to a real
  plant.

### Levels and unlocks

| Level | Name | Growth needed | Unlocks |
|---|---|---|---|
| 1 | Bare | 0 | Window, table, sill, floor |
| 2 | Settling in | 100 | Shelf. Pip moves onto it. |
| 3 | Lived in | 200 | Rug and lamp |
| 4 | In bloom | 300 | Hanging pothos, botanical print, Pip's bloom form |

Unlocks are never removed. Each level also appears as a badge in the existing
"working toward" section. Unlocks announce themselves quietly in the nook (see
quiet mode).

**Reference user** for tuning: week 1 earns about 100 (two lessons, three soil
tests, two missions). Later weeks earn about 70 (three soil tests, one or two
missions). That gives level 2 at the end of week 1, level 3 near the end of
week 3, and level 4 near the end of week 4, close to the catalog at day 30.
Badges add a little on top. Thresholds must be simulated against real activity
logs before they are fixed.

### Weekly rhythm

The nook shows **"days you showed up this week"**, counting any care log, soil
test, or lesson. There is no chain, no reset message, and each week starts
fresh. The nook adds no rest tokens.

Grove's existing daily streak and streak badges are not changed by this spec.
Whether they stay is an open decision (section 12).

### Plants: real and readiness

- A **real plant** uses the due date Grove already tracks. If a plant shows
  "Schedule needed," the nook uses a starter schedule from its species
  (`default_watering_days`) and labels it.
- A **readiness plant** is for users with no plant yet. They pick a species,
  and the plant grows through readiness steps:
  - Find a light spot (Window Blueprint lesson).
  - Check drainage (Plant ER lesson).
  - Choose a soil mix. Grove has a Chunky Aroid Mix lesson that was not
    reviewed, so this step's content is unconfirmed.
- Its states are only **seed, sprouting, and ready**. It has no moisture model,
  no reminders, no care actions, and no need that can go unmet.
- At **ready**, Pip asks "Ready to meet a real one?" and shows that species'
  real schedule. Adding a real plant makes it the hero. The readiness plant
  moves to the shelf as a keepsake, or the user can retire it.
- The readiness plant earns growth only from readiness steps and lessons. It
  earns nothing for care, because there is no care to do.

### Plant condition (sprite state)

| Condition | Meaning |
|---|---|
| `fine` | Nothing due, and no concern in the health check. |
| `due-soon` | The plant's due date is today or tomorrow. |
| `needs-attention` | Overdue, or the user flagged "looks off," or the health check shows a low factor. |

Condition comes from the existing schedule, the user's logs, and Grove's
6-factor plant health breakdown. It never comes from nook growth. The user can
set "looks off" on any real plant.

### Quiet mode

When any real plant is `needs-attention`:

- Pip stops celebrating. No level-up animation, no cheerful note.
- Pip offers one calm line of support, with a link to the relevant lesson, such
  as the Plant ER card.
- Growth and unlocks still apply. They appear in the nook without fanfare.

### Catalog gate

The choose-your-own decor catalog opens at **30 calendar days since signup**
for users who have the nook on.

## 4. Pip, the quiz, and lessons

**Pip is the guide. Pip is not a plant.**

### Quiz and tracks

A short quiz after onboarding picks the user's track. It is new. Grove's
onboarding has no quiz today, and the backend stores no track.

- It takes at most three taps, and answers are **multi-select** with one
  primary track chosen for the user.
- It asks about the situation, not identity. The track can be changed any
  time.
- The track names below are internal labels from the lesson pages. Users never
  see them.

Draft mapping, for content review:

| If the user says... | Track | Lesson |
|---|---|---|
| "A plant of mine looks unwell or I feel bad about one I lost" | Reset (Heartbroken Optimist) | Plant Parent Reset, 5 lessons |
| "I overwater or don't trust my instincts" | Rebirth (Recovering Black Thumb) | Soil Finger-Test, 5 cards |
| "Someone gave me a plant and I have no instructions" | Rescue (Accidental Guardian) | Plant ER, 5 cards |
| "I forget to care for my plants" | Steady Sprout | Habit Stacking, 5 cards |
| "I want to design with plants, or I have none yet" | Seedling (Botanical Visionary) | Window Blueprint, 5 cards |

### Lesson as onboarding

- The quiz routes straight into the primary track's lesson, which serves as the
  first-week onboarding.
- Each track lesson ends on a **"your turn" action that logs something real**:
  - Rebirth: the first soil test.
  - Rescue: assessing the plant.
  - Steady Sprout: choosing an anchor habit.
  - Seedling: finding a light spot, as a first readiness step.
  - Reset: a first care log, after the mindset cards.
- Lesson text is used as already written. Only the closing action needs
  confirming for tracks other than Rebirth.

### Week-1 flow

1. Onboarding, then the quiz (three taps or fewer).
2. The track lesson, shown without Pip.
3. The first real action. The existing first-care celebration fires.
4. The nook offer, with the Pip preview.
5. If accepted, Pip appears on the sill and hosts Quick Wins and the remaining
   lessons. If declined, the lessons appear without Pip.
6. The tutorial ends when the lessons are finished or at day 7. Pip stops
   prompting. Pip then moves to the shelf once it unlocks at level 2.

### Pip's note, and personality

- On Care Today, opted-in users see **one "Pip's note" slot** per day. It
  alternates between Grove's existing daily trivia and a short care tip. The
  mission card stays separate. Users without the nook keep today's trivia card.
- Pip has a cosmetic time-of-day mood: curious in the morning, sleepy at
  night. It is never tied to plant health or to the user's actions.
- Pip grows with the nook level through four forms: seed, sprout, leafy, and
  the founder's bloom flower at level 4. The copy says "Pip grows with you."
- Pip never droops and never reflects plant health.

### Return triggers

- A **weekly nudge**, off by default, set in the existing notification
  preferences. It sends only when something is new. Proposed copy, for review:
  "Your nook has something new."
- A **home-screen widget** is a later phase. It needs a native build, and v1 is
  web.

There is no separate nook tile. The Pip's note slot is the entry point.

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
- The user chooses the hero plant. Other plants, including a retired readiness
  plant, appear as small pots on the shelf.
- Plants use sprite templates by species group: pothos, monstera, succulent,
  snake plant, generic. Each has **three condition states** and no growth
  stages. Plants never get faces and never bloom on screen.
- The readiness plant uses a seedling sprite for seed and sprouting, and the
  species template at ready.
- On a 343px phone, whole-number scaling gives 2x (256px), so a face drawn at
  that size is about 32px, too small to carry mood alone.

### Accessibility

- Canvas is not readable by assistive technology, so the same state is shown
  as text: level, weekly rhythm, plant conditions, unlocked items, and the
  **next unlock** ("Shelf unlocks soon").
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
- **Pip in lessons.** Pip sits in a flat cream panel inside lesson cards. The
  lesson's gradient behind the panel is toned down so the two visual systems
  don't compete.

## 7. Ethics guardrails

- Nothing a user earned is ever removed.
- No red failure marks, no streak-loss warnings, no guilt copy. Pip's voice is
  warm and plain, and lesson text is used as already written.
- The nook rewards the person's attention and learning. It never scores a plant
  or grades a user's judgment.
- Numbers stay out of the interface. The nook says it grew.
- Decor is free in v1. If monetization is added later, it needs its own review.
- A readiness plant is always labeled, and never has a need.
- A real plant sprite always cites what it is based on, and the user can
  override it.
- The weekly nudge is off by default. Any other notification is optional and
  capped by user settings.

## 8. Testing and Storybook

Layer tests, using fixed fake dates and a stubbed event log:

- Each signal's growth, limits, and the 30-per-day cap.
- Flat soil test reward for every outcome and decision, with coaching text
  chosen by the mismatch.
- Watering earning nothing.
- No penalty for early checks.
- Optional note stored in the journal with no growth.
- Lesson completion recorded once and counted once.
- Level thresholds and unlock order, checked against the reference user.
- Weekly rhythm counting days correctly and resetting each week.
- Opt-in offered once after the first real action, including the no-plant path,
  declined, and re-enabled in Settings, with core features unchanged.
- Quiz multi-select resolving to one primary track, and changing track later.
- Each track lesson ending on a logged real action.
- Real plant condition from schedule, health factors, and "looks off."
- Starter schedule used and labeled when a plant has none.
- Readiness plant moving through seed, sprouting, and ready, with no needs and
  no reminders.
- Carry-over of growth and unlocks from a readiness plant to a real one.
- Quiet mode suppressing celebrations while a plant needs attention.
- Pip's note alternating trivia and tips once per day.
- Catalog gate at 30 days with the nook on and off.

Storybook stories:

- Pip in each of four forms and each reaction, on the sill and on the shelf.
- Plant templates in each of three conditions.
- The readiness plant in seed, sprouting, and ready.
- Nook states for levels 1 to 4, and the quiet mode variant.
- Locked, unlocked, and catalog-open slots.
- A lesson card with Pip in the cream panel, and the same card without Pip.
- The quiz, the opt-in card with preview, and Pip's note slot.

## 9. Measurement

- Instrument the primary metric and every tracked step in section 1.
- The confidence pulse is a single question at day 7 and day 30, shown once.
- Harm signals need definitions before launch, especially "overwatering
  report," which Grove does not record today.
- Because opt-in is self-selected, report nook and non-nook results separately.

## 10. How this fits existing Grove systems

Verified by reading `grove-backend` and `grove-frontend`.

| Existing | Where | How the nook relates |
|---|---|---|
| Onboarding promise "Grove does not gamify your plants" | `components/Onboarding.js` | **Resolved by opt-in** and by never scoring plants. Reword the offer so it does not contradict the promise. |
| Master lessons and Quick Wins (static pages, not wired) | `pages/SoilFingerTestVariation.js`, `QuickWinVariations.js`, `ResetCourseVariation.js`, `PlantERVariations.js`, `HabitStackingVariations.js`, `WindowBlueprintVariations.js` | **Reuse content as written.** They must become real lesson screens that save progress and end on a real action. |
| One-time tutorials in `tutorials_seen[]`; badges already read it (`light_reader`) | `components/SectionTutorial.js`, `grove-backend/server.py` | **Reuse** for opt-in, quiz, and lesson completion. |
| First-session banner and first-care celebration | `FirstSessionBanner.js`, `FirstCareCelebration.js`, server flags | **Reuse.** The nook offer follows the celebration. |
| Daily trivia and daily missions, including `water_streak` | `components/DailyTriviaCard.js`, `DailyMissionCard.js`, `grove-backend/missions.py` | **Reuse** trivia in Pip's note. **Conflict:** "Water at least 1 plant today" works against the Soil Finger-Test lesson. Replace it with a soil-check mission. |
| Bulk "water round" | `pages/CarePage.js` | **Conflict.** It waters every plant without a check. Gate it behind a check or a due state. |
| Daily streak and streak badges | `update_streak`, `server.py`, `BadgesPage.js` | **Tension.** The nook uses a weekly rhythm. The app's daily streak is unchanged here. |
| Badges and "working toward" | `badge_catalog.py`, `badge_progress.py`, `WorkingTowardSection.js` | **Reuse** as the surface for nook levels. |
| Notification preferences | `pages/NotificationPreferencesPage.js` | **Reuse** for the weekly nudge. |
| Per-plant `next_water_due` | `pages/CarePage.js` | **Reuse** as the due date. |
| Species data (`default_watering_days`) | `grove-backend/server.py` | **Reuse** for the starter schedule and the readiness plant's real schedule. |
| 6-factor plant health breakdown | `grove-backend/server.py` | **Reuse** for real plant condition. |
| "Rooms" (rooms of a home), room scan | `pages/RoomPage.js`, `RoomScanScreen.js` | **Name collision**, resolved by calling the scene "Pip's nook." |
| `CozyRoomPlannerVariations`, `CareGrowthPage` | `grove-frontend/src/pages` | **Not reviewed.** May overlap with the nook or growth view. |
| Study 001 framing: calm, non-gamified, rooms and badges out of scope | `docs/research/studies/trusted-first-care-action.md` | **Tension.** Test the nook as a separate opt-in layer in a new study. |

## 11. Open review findings

- **The soil test is self-reported for real plants.** It can be tapped without
  touching the soil. The lesson's "no wrong answer" framing accepts this, and
  flat rewards remove the incentive to game it.
- **First-week load.** The quiz, a lesson, a first action, an opt-in, and more
  lessons still add up. Study 003 should time it.
- **No share surface.** There is no share card, export, or crop, so the
  Pinterest/IG hook is untested.
- **Real-user evidence.** Everything so far is synthetic.
- **Scope.** The catalog and five species templates are still in v1. They are
  candidates to cut if the build runs long.

## 12. Open questions

- Quiz content and wording, and who validates the track mapping.
- The closing "your turn" action for the Reset, Rescue, Steady Sprout, and
  Seedling lessons.
- Where the soil test outcome, decision, and note are stored. The care log has
  no such type today.
- How "overwatering report" is defined and captured.
- Whether XP from missions rolls up into any level or total. This was not
  confirmed.
- Whether the reference-user pacing holds against real activity logs.
- Whether the app's daily streak and streak badges stay, change, or move to a
  weekly rhythm. Who owns that decision?
- Who owns the decision to replace the `water_streak` mission and gate the
  bulk water round.
- The content of the Chunky Aroid Mix lesson, and the tracks of the Chunky
  Aroid Mix and Plant Cluster lessons.
- Whether to cut the catalog or the species templates for v1.
- Timing and tooling for the home-screen widget.
