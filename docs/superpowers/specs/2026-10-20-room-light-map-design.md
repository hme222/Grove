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

1. Teach direct light, indirect light, and the four light levels that match `default_light_level`.
2. Show all eight window directions (N, NE, E, SE, S, SW, W, NW) in the nook, with when the sun arrives and how far it reaches.
3. Show the curtain: a sheer curtain turns a direct patch into filtered, bright indirect light.
4. Teach the real-world checks a gardener uses: the hand-shadow test, what the window looks out on, seasons, and reading the plant.
5. End the lesson by the person picking which way their window faces. Save it.
6. For people who opted in to the nook, the final nook is lit by their window.
7. Show which of Grove's species fit that window.

## Non-goals

- Grow lights, glass types, multiple windows, light meters, and exact sun maths by latitude. (My call. Grow lights get no card in this version.)
- Light never changes a real plant's condition on screen. Condition still comes only from the schedule, "looks off", and Grove's health check, as the nook spec says.
- No score, level or number for light. The interface does not show lux, hours, or growth.

## Anti-goals

- Telling someone their plant is in the "wrong" place in a way that sounds like a failure. Copy says "this spot is a good fit for X" or "this spot suits Y better".
- Requiring a window pick to use Grove or the nook.
- Treating a guess as fact. Copy says "roughly".

## The lesson, in two parts

Both parts are hosted by Pip, with Pip's panel above the card as in Plan 2. Each card also exists as plain text, so nothing depends on the picture.

### Part 1: Light, simply (about 5 cards)

1. **Direct versus indirect.** Direct: the sun's rays land on the leaves. Indirect: the room is bright but no rays touch the leaves.
2. **Four levels.** Direct, bright indirect, medium, low. These are the words on species pages.
3. **The shadow test.** Hold a hand about a foot above the plant at midday. A crisp shadow is direct light, a soft-edged one is bright indirect, and a faint one is low. This replaces "Not sure" guessing.
4. **The curtain.** The same south window without and with a sheer curtain. A direct patch becomes filtered, bright indirect light.
5. **Read the plant.** A plant stretching toward the glass, going pale, or with scorched, crispy patches is telling you about light. Links to the Plant ER lesson. One line on distance: light falls off quickly, so a plant a few steps back from the window is a level dimmer.

### Part 2: Your window (about 6 cards)

1. **The map.** Eight nook rooms, one per direction. Each shows when sun reaches the floor, how far it travels, and what a plant by the window gets. Northern hemisphere reading:
   - N: no direct sun, steady indirect light, dimmer in winter.
   - NE: gentle morning sun.
   - E: morning sun, then indirect.
   - SE: strong sun from morning to midday.
   - S: the most direct sun, all day.
   - SW: hot direct sun from midday into the evening.
   - W: hot, low-angle afternoon sun, with glare.
   - NW: weak late sun, mostly indirect.
2. **What can you see out of the window?** Open sky, a tree, or a building. A tree or building dims the light by roughly one level.
3. **Seasons.** A summer and winter switch on the map. In winter the sun sits low and the patch reaches deeper into the room. In summer it is high and short. A north room that is fine in July can be dark in January.
4. **West and southwest glass is hot** (one line, with the curtain as the fix). **North glass runs cold in winter** (one line: keep leaves off the glass). Both are tips inside existing cards, not cards of their own. (My call.)
5. **Pick your window.** A compass with eight directions plus "Not sure". Choosing "Not sure" shows the shadow test and a short "check with your phone's compass" tip, then the person picks.
   - A hemisphere question appears here once: "Are you in the northern or southern hemisphere?" with the answer saved. In the southern hemisphere N and S are swapped in all copy and drawings. (My call; the default is north.)
6. **Your nook, lit your way.** The nook shows with the person's window light, with a list of Grove's species that fit that light, and one closing line from Pip: "I'm Pip. I'm your guide, not a plant. I'll sit where your light is good." This is the end of the lesson. (My call: the "what Pip is" line closes the lesson but the final picture is the nook, because Pip was already introduced by the nook offer.)

Cards use short, warm, plain copy with no guilt. Part 2 can be taken without Part 1, but is queued after it.

## Data

New fields on the user, saved by one endpoint (`POST /api/users/me/window`) and read from `/api/users/me` and the nook state:

- `window_direction`: one of `N NE E SE S SW W NW`. `unsure` is never saved: "Not sure" leads to the shadow test and phone-compass tip, then the person picks their best guess. (My call.)
- `window_view`: `open`, `tree`, or `building`. It is asked on the same card as the direction, optional, and defaults to `open`. (My call.)
- `hemisphere`: `north` or `south`.

All three are optional and independent of `nook_enabled`. Saving happens when the person picks on the window card, so a pick survives leaving the lesson. Saving never marks a lesson done by itself; the existing mark-done step does that. If the user has started the nook's readiness plant, saving a window also completes its `light-spot` step (+10 growth, once, through the existing readiness code). (My call.)

The nook state gains `window: {direction, view, hemisphere, season}` (season from the current date and hemisphere) and `fits`, a short list of species names for the window's light level. It never includes numbers.

## What the nook does with it

- `drawRoom.js` accepts a `window` view and draws the sun patch for that direction, with a short, soft patch for N or NE and a long, warm one for S, SW and W. A tree or building view softens it one step. Season changes the patch length. The picture is a rough sketch, not a sun simulator.
- If no direction is saved, the nook looks as it does today.
- The nook page writes the same information in text: "Your window faces southwest and looks out on a tree. Mornings are gentle and afternoons are warm."
- Reduced motion and no canvas behave as they do today.

## Light level for a window (rules)

A pure module (`light.py` and a matching small frontend helper) maps direction, view, season and hemisphere to a base light level, with `fits` chosen from species whose `default_light_level` equals that level or the one below it. It is the single source for both the lesson's "what a plant gets" text and the nook. The N/S swap for the southern hemisphere is done once here.

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

The exact pixel art for the sun patches, the card wording within the intent above, and the helper and endpoint names.

## Open for the owner

1. Which tracks get these lessons, and how Part 2 follows Part 1. `build_lesson_queue` only has two slots per track, and both are already used.
