# Room light map: a lighting lesson in Pip's nook

Status: draft for approval. Builds on `2026-10-13-pip-room-design.md` (Pip's nook) and Plans 1 and 2.

## Intent

People pick a spot for a plant by looks, then wonder why it struggles. Grove already has a lighting lesson, "Window Blueprint", but it only names directions in words and it only reaches one lesson track. This design replaces it with a picture-first lesson. The same pixel room Pip lives in is lit from each window direction, so the person sees where the sun lands, learns direct versus indirect light, then picks which way their own window faces. After that, Pip's nook is lit the way their window is.

Why it matters: light is the cause behind most struggling plants, and a person who can read their window can choose plants that will live.

## What exists today (so the builder does not rebuild it)

- Lesson `window-blueprint` exists: 5 cards in `grove-frontend/src/pages/WindowBlueprintVariations.js` (hook, South and West, East, North plus a "read a book at 2 PM" rule, a "pick your first lighting zone" card). It belongs only to the `seedling` track. The last card saves nothing.
- Lesson ids live in `grove-backend/tracks.py` (`LESSON_IDS`, `TRACK_LESSON`) and `grove-frontend/src/lessons/` (`registry.js`, `lessonMeta.js`).
- A separate "lighting" section tutorial (`SectionTutorial tutorialId="lighting"`) and the `light_reader` badge read `tutorials_seen`. Leave them untouched.
- Every species has `default_light_level`: `low`, `medium`, `bright_indirect`, or `bright_direct`. This is the vocabulary for the whole lesson.
- Nothing stores a window direction, a view, or a hemisphere.
- The nook room is drawn by `grove-frontend/src/nook/drawRoom.js` from one view object, with whole-number pixel scaling and a text version of everything on the page.

## Goals

1. Start with the person's own window and spot, and teach direct light, indirect light, and the four light levels that match `default_light_level`.
2. Show all eight window directions (N, NE, E, SE, S, SW, W, NW) in the nook through direction chips, with when the sun arrives and how far it reaches.
3. Show the curtain: a sheer curtain turns a direct patch into filtered, bright indirect light.
4. Teach the real-world checks a gardener uses: the hand-shadow test, what the window looks out on, seasons, and reading the plant.
5. End the lesson by the person picking which way their window faces. Save it.
6. For people who opted in to the nook, the final nook is lit by their window.
7. Say which of the person's plants suit the spot, or which Grove species fit it.
8. Be short, resumable, and useful to someone on a phone.

## Non-goals

- Glass types, one home-wide window map, light meters, balcony and skylight options, and exact sun maths by latitude. For a balcony or skylight the person picks the closest match.
- Light never changes a real plant's condition on screen. Condition still comes only from the schedule, "looks off", and Grove's health check, as the nook spec says.
- No score, level or number for light. The interface does not show lux, hours, or growth.

## Anti-goals

- Telling someone their plant is in the "wrong" place in a way that sounds like a failure. Copy says "this spot is a good fit for X" or "this spot suits Y better".
- Requiring a window pick to use Grove or the nook.
- Treating a guess as fact. Copy says "roughly".

## The lesson, in two parts

Written with the free-lessons designer's pushback: it is about the person's own window first, it starts with doing, it is four cards per part, and every step can be left and resumed. Both parts are hosted by Pip (when the nook is on), with Pip's panel above the card as in Plan 2. Each card also exists as plain text, so nothing depends on the picture. Cards use short, warm, plain copy with no guilt.

### Part 1: Your spot's light (4 cards)

1. **Try it: the hand-shadow test.** "Hold your hand about a foot above the spot where your plant will go, around midday. What does the shadow look like?" Crisp, soft-edged, faint, or "I'll do this later". The answer is saved as the person's light reading for that spot (`light_reading`: `crisp`, `soft`, `faint`).
2. **Direct versus indirect, from their answer.** Direct: the sun's rays land on the leaves (a crisp shadow). Indirect: the room is bright but no rays touch the leaves (soft). Then the four levels, direct, bright indirect, medium, low, which are the words on species pages.
3. **The curtain.** The same window without and with a sheer curtain. A direct patch becomes filtered, bright indirect light.
4. **Read the plant.** A plant stretching toward the glass, going pale, or with scorched, crispy patches is telling you about light. Links to the Plant ER lesson. One line on distance: light falls off quickly, so a plant a few steps back from the window is a level dimmer.

"I'll do this later" on card 1 skips ahead with the rest of Part 1 as plain teaching, and Care Today offers the test again at midday (see Save and resume).

### Part 2: Your window (4 cards)

1. **Pick the window for your plant's spot.** Two questions, with the compass only as a shortcut.
   - "Which window is nearest the spot where your plant will go?" It is the window for that first plant, not for the whole home.
   - "When does the sun reach it?" Morning, midday, afternoon, no sun (just bright sky), I'm not sure, or there's no window here.
   - "I'm not sure" shows the hand-shadow test and then asks again. "I'll check at noon" saves where they are (see Save and resume).
   - Morning, midday, afternoon and no sun map to E, S, W and N. "I know the direction" opens the eight-direction compass, which saves the exact direction.
   - Optional on the same card: "What can you see out of it?" Open sky, a tree, or a building. A tree or building dims the light by roughly one level. It defaults to open sky.
   - A hemisphere question appears once: "Are you in the northern or southern hemisphere?" In the southern hemisphere N and S are swapped in all copy and drawings. (My call; the default is north.)
2. **Your room, lit your way.** One nook room lit the way they picked, with direction chips (N, NE, E, SE, S, SW, W, NW) and a summer and winter switch. The other seven windows are the chips: "see other windows". A line says when the sun arrives and what a plant by the window gets. Northern hemisphere reading:
   - N: no direct sun, steady indirect light, dimmer in winter.
   - NE: gentle morning sun.
   - E: morning sun, then indirect.
   - SE: strong sun from morning to midday.
   - S: the most direct sun, all day.
   - SW: hot direct sun from midday into the evening.
   - W: hot, low-angle afternoon sun, with glare.
   - NW: weak late sun, mostly indirect.
   In winter the sun sits low and the patch reaches deeper into the room; in summer it is high and short. Two footnotes: west and southwest glass is hot, and the curtain is the fix; north glass runs cold in winter, so keep leaves off it. (My call: footnotes, not cards.)
   For "no window" the room is lit by a lamp with no sun patch, and a grow-light card follows: a lamp or grow light is the honest answer for a dark spot, with one plain line on choosing one that suits low-light plants.
3. **What fits.** If the person has plants, say so plainly and kindly: "Your pothos suits this spot" or "Your jade would like a sunnier one". With no plants, a short list of Grove species that fit the light, each linking to its species page. Nothing is scored, and a plant that would prefer other light is a suggestion, never a failure.
4. **The ending.**
   - Opted in to the nook: the nook shows with their window light, and one line from Pip: "I'm Pip. I'm your guide, not a plant. I'll sit where your light is good." (My call: the "what Pip is" line closes the lesson, and the final picture is the nook, because Pip was already introduced by the nook offer.)
   - Not opted in: a keepsake instead of a flat ending, a "my window light" picture of the room lit their way, with the direction, the season, and the line "Roughly where the light falls". The person can save it as an image. No Pip line and no nudge toward the nook.

Part 2 can be taken without Part 1, but is suggested after it.

## Save and resume

Free lessons are often started in the wrong place, so no step traps the person.
- The lesson saves the card the person reached (`lesson_progress.<id>`, a card number) each time they advance, and reopening resumes there. Marking a lesson done still uses the existing mark-done step.
- "I'll do this later" and "I'll check at noon" leave a small, one-time Care Today prompt around midday: "Ready to check your light?" It is never repeated after the person answers or dismisses it.
- Every card has the existing exit.

## Data

New fields on the user, saved by one endpoint (`POST /api/users/me/window`) and read from `/api/users/me` and the nook state:

- `window_sun`: `morning`, `midday`, `afternoon`, `none`, or `nowindow`. `unsure` is never saved: "Not sure" leads to the shadow test, then the person answers.
- `window_direction`: one of `N NE E SE S SW W NW`, saved only when the person used the compass shortcut. Otherwise it is worked out from `window_sun`.
- `window_view`: `open`, `tree`, or `building`. It is asked on the same card as the direction, optional, and defaults to `open`. (My call.)
- `light_reading`: `crisp`, `soft`, or `faint`, from the hand-shadow test.
- `lesson_progress`: a map of lesson id to the last card reached.
- `light_prompt_dismissed`: true once the person answered or dismissed the one-time midday prompt on Care Today.
- `hemisphere`: `north` or `south`.

All three are optional and independent of `nook_enabled`. Window fields save when the person picks on the window card, so a pick survives leaving the lesson. Saving never marks a lesson done by itself; the existing mark-done step does that. If the user has started the nook's readiness plant, saving a window also completes its `light-spot` step (+10 growth, once, through the existing readiness code). (My call.)

The nook state gains `window: {sun, direction, view, hemisphere, season}` (season from the current date and hemisphere) and `fits`, a short list of species names for the window's light level. It never includes numbers.

## What the nook does with it

- `drawRoom.js` accepts a `window` view and draws the sun patch for that direction, with a short, soft patch for N or NE and a long, warm one for S, SW and W. A tree or building view softens it one step. Season changes the patch length. The picture is a rough sketch, not a sun simulator.
- For `nowindow`, the nook shows a lamp glow on the floor with no sun patch and no window light.
- If nothing is saved, the nook looks as it does today.
- The nook page writes the same information in text: "Your window faces southwest and looks out on a tree. Mornings are gentle and afternoons are warm."
- Reduced motion and no canvas behave as they do today.

## Light level for a window (rules)

A pure module (`light.py` and a matching small frontend helper) maps direction, view, season and hemisphere to a base light level, with `fits` chosen from species whose `default_light_level` equals that level or the one below it. For `nowindow` the level is low and `fits` lists low-light species only. It is the single source for both the lesson's "what a plant gets" text and the nook. The N/S swap for the southern hemisphere is done once here.

## Calls on how it fits the code (my calls)

- **Two new lesson ids**, `light-basics` (Part 1) and `window-map` (Part 2), added to `LESSON_IDS`, `registry.js` and `lessonMeta.js`.
- **`window-blueprint` is retired from lists.** Its `lesson:window-blueprint` records stay, so earned growth and badges are untouched. Anyone who finished it is shown Part 1 as done at read time only. Nothing is written to the database, so no growth or badges are handed out. Part 2 is not done for them. The `/window-blueprint` route redirects to `/lessons`.
- **The lesson player gets a small change:** a card may carry an optional `render` for an interactive picture (rooms, curtain pair, season switch, compass). The final-card hook stays as is.
- **People who have not opted in to the nook** see the same teaching pictures (a room is just an illustration) without Pip hosting. The last card shows the room lit their way with the species list and a plain closing line, with no "I'm Pip" line and no nudge toward the nook, because the offer is made once only.

## Constraints

- Reuse the lesson player, registry, mark-done step and Pip panel from Plans 1 and 2. Do not build a new lesson system.
- The existing `window-blueprint` lesson is replaced by the two parts. Users who already finished `window-blueprint` keep their `lesson:window-blueprint` record and count as having finished Part 1 and Part 2's map. (My call.)
- Which tracks get which part is decided in "Open for the owner" below.
- Colour never carries meaning alone: every room is labelled with the direction, time and light level in text.
- All eight rooms, the curtain pair and the compass work with the keyboard.
- The nook stays optional. Lessons and the window pick work without it.

## Left to the builder

The exact pixel art for the sun patches and the lamp glow, the card wording within the intent above, and the helper and endpoint names.

## Plan differences (v1.1)

Settled while planning and building; see the plan's "Decisions made while planning".
- `window-blueprint` stays in the code as a retired lesson id so earned growth and badges are untouched.
- "What fits" is its own endpoint (`GET /api/light/fits`), not part of the nook state.
- The lesson also saves `lesson_progress`, `light_reading` and the two prompt flags, and the guide carries `draw_direction`.
- A fifth interactive step, `reading-note`, reads the saved shadow back on Part 1 card 2.
- The keepsake for people without the nook never mentions the nook, including for a lamp window.

## Decided by the owner

Which tracks get the lessons: **only the seedling track changes.** Its lesson swaps from `window-blueprint` to `light-basics`, and finishing `light-basics` suggests `window-map` as "up next". Every other track keeps its two-lesson queue. Both parts are in the lessons library for everyone. (The owner chose the recommendation "for now", so a later change to queue other tracks is expected and should not be blocked by this design.)

## Open for the owner

Nothing.
