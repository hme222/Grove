# Synthetic user test: Pip room (spec v2)

Date: 2026-10-14
Status: **Synthetic. Hypotheses only. Not evidence from real users.**
Build tested: spec v2 (`docs/superpowers/specs/2026-10-13-pip-room-design.md`)
and the inline room prototype, read against the current Grove code.

## Method and limits

Five invented personas walked six scenarios. The personas are mine, not
recruited people, and "new plant owner" is not yet operationally defined (see
`docs/product/confirmed-context.md`). Findings are predictions to check with
real participants. The Study 001 session guide is the template for that.

Code facts used (read, not assumed):

- `CarePage.js` has a bulk "water round" (`waterAPI.logRound`, toast
  "Watered N plants") and shows "Schedule needed" when a plant has no
  `next_water_due`.
- `missions.py` has a daily `water_streak` mission: "Water at least 1 plant
  today."
- `server.py` has a daily streak (`last_log_date`) and a 6-factor plant health
  breakdown.
- Not reviewed: `CozyRoomPlannerVariations.js` (1,002 lines) and
  `CareGrowthPage.js`.

## Personas

| Persona | Context |
|---|---|
| Maya, 27 | Pothos for 3 weeks. Anxious. Checks daily and has over-watered before. |
| Dev, 41 | Was gifted a snake plant and a succulent. Busy and forgetful. Opens apps about every 10 days. |
| Rosa, 63 | First plant is a fern. Low vision, 200% zoom, screen reader. Reads everything. |
| Theo, 22 | Owns no plant yet. Came for cozy pixel rooms he saw on Pinterest. |
| Sam, 34 | Has killed three plants. Skeptical of games. Wants plain help. |

## Scenarios

1. First open: meet Pip and the practice plant.
2. Trial: check soil, then water.
3. Add a real plant and hand off.
4. Day 6 of a 7-day cycle: check soil early.
5. Miss a care window.
6. Day 30: open the catalog.

## Barrier matrix

| Scenario | Maya | Dev | Rosa | Theo | Sam |
|---|---|---|---|---|---|
| 1 Meet Pip | ✓ | ✓ | ⚠ | ✓ | ⚠ twee |
| 2 Trial loop | ✓ | ✓ | ⚠ | ⚠ hits cap fast | ⚠ pretend care |
| 3 Add real plant | ⚠ | ✗ no schedule | ⚠ | ⚠ owns none | ✓ |
| 4 Early check | ⚠ zero reward | ✓ | ✓ | n/a | ⚠ |
| 5 Missed window | ✓ | ✗ constant | ⚠ | n/a | ⚠ |
| 6 Day-30 catalog | ✓ | ⚠ rarely reached | ⚠ | n/a | ✓ |

## Findings

### Critical

- **The app contradicts the room.** The existing `water_streak` mission and
  "water round" reward daily and bulk watering, while the room gives nothing
  for watering damp soil. Maya earns a streak for the exact habit that
  over-waters her plant, then sees Pip say watering was not needed. Two
  systems give opposite signals. Fix: replace the mission with a soil-check
  mission, and gate the water round behind a check or a due state.
- **No schedule means no room.** A plant with no `next_water_due` ("Schedule
  needed") has no care window, so it earns no growth and shows no condition.
  Dev and Theo add a plant and nothing happens, which breaks the hand-off at
  the moment the success metric depends on. Fix: when there is no schedule, use
  a species default window and label it "starter schedule," and let the user
  edit it.

### Major

- **Early checks feel rejected.** Maya checks daily out of worry. "Logged, no
  growth" counts her care as nothing. Fix: Pip responds to the check with
  coaching, for example "Dry 2 cm down? Not yet. I'll nudge you Thursday." The
  reward is learning, not points.
- **The window is too narrow for forgetful users.** A 3-day window on a
  14-day cycle means Dev misses most windows, burns his rest tokens in the
  first month, and never reaches level 4 or sees the catalog's value. Fix:
  scale the window with cycle length (for example 20% of the cycle) and give
  late logs reduced growth instead of zero.
- **Screen reader and low-vision gaps.** The locked decor outlines carry no
  text, so Rosa gets no sense of progress. Fix: always state the next unlock
  in text ("Shelf unlocks at 12 more growth"). The phrase "Based on your log
  and Grove's health check" is vague. Also, the 128-wide room on a 343px phone
  allows only 2x whole-number scaling (256px), which makes Pip's face about
  32px, too small to carry mood. Condition must lean on labels, not the face.
- **The trial hits its cap in about two days.** At roughly 50 growth per
  practice day, Theo reaches the level-3 cap fast, then sees locked outlines
  that read as "pay to continue." He is also not in the confirmed MVP audience
  (current owners), so the trial may attract people Study 001 excludes. Fix:
  decide the audience question, then either offer a starter-plant picker for
  non-owners or slow the trial.
- **Cute reads as unserious to Sam.** Simulating care on a fake plant feels
  childish to someone who wants real help first. This is the tension with
  Study 001's calm, non-gamified framing. A plant sprite that says
  `needs-attention` from an uncertain health check also sounds more confident
  than the text elsewhere in Grove. Fix: lead with the real plant for users who
  skip the trial, and keep the override visible.

### Minor

- Rest tokens are hidden until used, so Dev meets "used a rest token" with no
  explanation. Add one line at first use.
- When the real plant replaces the practice plant, the practice plant just
  vanishes. Keep it as a shelf keepsake.
- Reminders and notifications are unspecified, and Dev depends on them.

## Opportunities

1. **Make "not yet" a reward.** Early checks become coached learning. No
   competitor reviewed does this.
2. **Explain the sprite.** The existing 6-factor health breakdown can say why a
   plant is `due-soon` or `needs-attention`. An explainable sprite is a trust
   advantage.
3. **Fix the existing mission.** Swapping `water_streak` for a soil-check
   mission is a small change that removes the overwatering incentive in the
   live app.
4. **Wider, kinder windows.** Scaled windows and late credit protect the
   forgetful majority.
5. **A shareable room card.** A cropped, HUD-free image of the room at "day
   30" gives the Pinterest/IG claim a real surface.
6. **A non-owner path.** Theo shows a possible audience beyond current
   owners. That is a founder decision, not a design one.
7. **Keepsake practice pot** on the shelf to soften the hand-off.
8. **Next-unlock text line.** It helps Rosa and everyone else.

## Recommendation

Fix and re-test. Resolve the two critical items and the window scaling in the
spec before any plan is written, then run Study 001's session guide with real
new owners using this room.
