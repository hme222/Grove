# Room Light Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Window Blueprint" lesson with two short, resumable lessons that teach light with the nook room, save the person's window, and light the nook the way their window is.

**Architecture:** A pure backend module, `light.py`, holds every light rule (direction, season, hemisphere, level, fits). `light_service.py` saves the person's answers and `server.py` exposes them. The nook state gains a `window` object. On the frontend, `nook/windowLight.js` turns that into a sun patch, `drawRoom.js` draws it, and a new `lessons/light/` folder holds the card text and the interactive steps. `LessonPlayer` gets a small per-card render hook and resume support.

**Tech Stack:** FastAPI + Motor + pytest (backend). React 19, craco (CRA jest), canvas 2D, Storybook 8 (frontend).

**Spec:** `docs/superpowers/specs/2026-10-20-room-light-map-design.md`. **Depends on:** Plans 1 and 2. Branch from `feat/pips-nook`, or from `storybook` once both pull requests are merged. This plan uses `tracks.py`, the lesson player and page, `nook_service.py`, `drawRoom.js`, `buildView.js`, `NookPage.jsx`, and `NextLessonCard.jsx`.

## Decisions made while planning

The spec is the authority. Where this plan differs from it or settles something it left open, it is here with what it costs if wrong.

1. **`window-blueprint` stays in the code as a retired lesson id.** It is removed from the library and from `TRACK_LESSON`, but `tracks.completed_lessons` still reads it, so earned nook growth and badges are untouched. Anyone who finished it is shown `light-basics` as done at read time only. Cost if wrong: a finished user sees Part 1 as not done.
2. **`fits` is its own endpoint, `GET /api/light/fits`,** not part of the nook state. The nook page does not need it. Cost if wrong: move it into the state.
3. **Light levels per direction are content and need a gardener's eye.** The table in Task 1 is my first pass from the spec's wording. Cost if wrong: change the table; nothing else depends on its values except test expectations.
4. **A plant "suits" a spot when its species level equals the spot's level or is one step dimmer.** Brighter than the spot means "prefers brighter", two or more steps dimmer means "prefers dimmer". Cost if wrong: change one function.
5. **The midday prompt uses two flags, `light_prompt_pending` and `light_prompt_dismissed`,** and shows between 11:00 and 15:00 local time. Saving a window or a light reading also dismisses it. Cost if wrong: it shows at the wrong hours or once too often.
6. **Sun timing maps to a direction: morning to E, midday to S, afternoon to W, no sun to N.** A compass direction maps back to timing: N none; NE, E, SE morning; S midday; SW, W, NW afternoon. Cost if wrong: the nook picture is off by a diagonal.
7. **Seasons are a simple split.** Northern summer is April to September; southern is the reverse. Cost if wrong: shoulder months show the wrong season.
8. **The keepsake is a PNG saved from an offscreen canvas at 4 times size.** No share sheet. Cost if wrong: add sharing later.
9. **Art is a first pass,** drawn as simple rectangles like the rest of the nook. A designer should polish it in Storybook.

## Global Constraints

- Both lessons work without the nook. Pip hosts only when `user.nook_enabled` is true. The nook offer is made once and is never repeated by this lesson.
- Light levels use Grove's existing words: `low`, `medium`, `bright_indirect`, `bright_direct`.
- Window fields: `window_sun` is `morning | midday | afternoon | none | nowindow`; `window_direction` is `N | NE | E | SE | S | SW | W | NW`; `window_view` is `open | tree | building`, default `open`; `hemisphere` is `north | south`, default `north`; `light_reading` is `crisp | soft | faint`. `unsure` is never saved.
- Southern hemisphere swaps N and S in all copy and drawings, and swaps the seasons. East and west do not change.
- The interface shows no numbers for growth, light, or hours. Copy is warm and plain, with no guilt. A plant that would prefer other light gets a suggestion, never a failure.
- Light never changes a real plant's condition on screen.
- Part 1 has 4 cards and Part 2 has 4 cards. Every card has the existing exit. The lesson saves the card reached and resumes there.
- Everything shown in a picture is also written as text. Colour never carries meaning alone. Controls are at least 44 by 44 pixels and work with the keyboard. Motion stops when the user prefers reduced motion.
- The nook room is 128 by 80 pixels, scaled by whole numbers only.
- Jest here cannot resolve the `@/` alias or load `react-router-dom` v7. Tests mock those, as Plans 1 and 2 do. Use `npm`, and `CI=false` for builds.

## Review Focus

Failure modes the spec implies but a straight reading would not test. Each is covered by a test in the task that owns the code.

1. **A southern-hemisphere user.** Expected: N and S swap, the seasons swap, and a window facing north gets the sun a northern south-facing window gets. (Task 1, Task 5.)
2. **A person with no plant, no window, or the nook off.** Expected: the lesson finishes, the ending is the keepsake and not Pip's line, and "no window" shows a lamp and low-light species only. (Task 3, Task 10.)
3. **Leaving mid-lesson, resuming, or double taps on a pick.** Expected: the lesson reopens on the saved card, a pick saves once, and a failed save leaves the person on the card with an error. (Task 3, Task 7, Task 9.)
4. **Someone who finished the old Window Blueprint.** Expected: Part 1 shows as done, Part 2 does not, nothing new is written, and nook growth does not change. (Task 2.)
5. **Reduced motion, no canvas, or a blocked download.** Expected: nothing moves, nothing throws, the text says everything, and the keepsake button is hidden when there is no canvas. (Task 5, Task 10.)

---

## File structure

**Create (backend, in `grove-backend/`):**
- `light.py`: the rules. Pure.
- `light_service.py`: saves answers and builds the fits list.
- `tests/test_light.py`, `tests/test_light_service.py`, `tests/test_light_endpoints.py`.

**Modify (backend):** `tracks.py`, `server.py`, `nook_service.py`, `tests/test_tracks.py`, `tests/test_lesson_endpoints.py`, `tests/test_nook_service.py`.

**Create (frontend, in `grove-frontend/src/`):**
- `nook/windowLight.js`: turns a window into a sun patch.
- `lessons/light/lightCards.js` (card text for both parts), `lessons/light/lightCopy.js` (small copy helpers).
- `lessons/light/ShadowTestStep.jsx`, `CurtainPair.jsx`, `WindowPickStep.jsx`, `WindowRoomStep.jsx`, `FitsStep.jsx`, `ClosingStep.jsx`, `keepsake.js`.
- `components/LightPromptCard.jsx`.
- Tests next to each, and `lessons/light/LightLesson.stories.jsx`.

**Modify (frontend):** `lib/api.js`, `lessons/LessonPlayer.jsx`, `pages/LessonPage.jsx`, `pages/LessonsPage.jsx`, `lessons/registry.js`, `lessons/lessonMeta.js`, `components/NextLessonCard.jsx`, `nook/drawRoom.js`, `nook/buildView.js`, `pages/NookPage.jsx`, `pages/CarePage.js`, `App.js`, and the existing tests that list lesson ids.

---

### Task 1: The light rules (backend)

**Files:**
- Create: `grove-backend/light.py`
- Test: `grove-backend/tests/test_light.py`

**Interfaces:**
- Produces (all in `light.py`):
  - Constants `LEVELS = ("low", "medium", "bright_indirect", "bright_direct")`, `DIRECTIONS = ("N","NE","E","SE","S","SW","W","NW")`, `SUNS = ("morning","midday","afternoon","none","nowindow")`, `VIEWS = ("open","tree","building")`, `HEMISPHERES = ("north","south")`, `READINGS = ("crisp","soft","faint")`
  - `direction_for_sun(sun: str) -> str | None` (None for `nowindow`), `sun_for_direction(direction: str) -> str`
  - `effective_direction(direction: str, hemisphere: str) -> str`
  - `season_for(now: datetime, hemisphere: str) -> "summer" | "winter"`
  - `level_for(direction: str, view: str, season: str, hemisphere: str = "north") -> str`
  - `arrives(direction: str, hemisphere: str = "north") -> str`
  - `window_summary(sun, direction, view, hemisphere, now) -> dict | None`
  - `guide(hemisphere: str, view: str) -> list[dict]`
  - `fits_species(species: Iterable[dict], level: str, limit: int = 6) -> list[dict]`
  - `suit(plant_level: str, spot_level: str) -> "suits" | "prefers_brighter" | "prefers_dimmer"`

- [ ] **Step 1: Write the failing tests** in `grove-backend/tests/test_light.py`. Each is a plain pytest function:
  - `test_sun_and_direction_map_both_ways`: `direction_for_sun` gives `morning→E, midday→S, afternoon→W, none→N`, and `None` for `nowindow`. `sun_for_direction` gives `N→none; NE, E, SE→morning; S→midday; SW, W, NW→afternoon`.
  - `test_the_southern_hemisphere_swaps_north_and_south_only`: `effective_direction` for `south` gives `N→S, S→N, NE→SE, SE→NE, SW→NW, NW→SW, E→E, W→W`; for `north` it is the identity.
  - `test_seasons_follow_the_hemisphere`: `season_for` on 15 July is `summer` north and `winter` south; on 15 January the reverse; 15 April is `summer` north; 15 October is `winter` north.
  - `test_levels_for_every_direction_in_both_seasons`: with `open` view and `north`, the (summer, winter) pairs are `N: (medium, low)`, `NE: (bright_indirect, medium)`, `E: (bright_indirect, bright_indirect)`, `SE`, `S`, `SW`, `W`: `(bright_direct, bright_direct)`, `NW: (bright_indirect, medium)`.
  - `test_a_tree_or_building_dims_one_level_and_never_below_low`: S with `tree` is `bright_indirect`; N in winter with `building` is `low`.
  - `test_a_window_facing_north_in_the_south_gets_southern_light`: `level_for("N", "open", "summer", "south") == "bright_direct"`.
  - `test_arrives_text_for_each_direction`: `arrives("S")` is `"The most direct sun, all day."`, `arrives("N")` is `"No direct sun. Steady, even light."`, and the south hemisphere call `arrives("N", "south")` equals `arrives("S")`. The other six strings are: NE `"Gentle sun in the early morning."`, E `"Sun in the morning, then bright light."`, SE `"Strong sun from morning to midday."`, SW `"Hot sun from midday into the evening."`, W `"Hot, low sun in the afternoon, with glare."`, NW `"Weak sun late in the day."`.
  - `test_window_summary`: returns `None` when `sun` is `None`. For `("afternoon", None, "tree", "north", <15 July>)` it returns `{"sun": "afternoon", "direction": "W", "draw_direction": "W", "view": "tree", "hemisphere": "north", "season": "summer", "level": "bright_indirect", "arrives": <W text>, "lamp": False}`. For `nowindow` it returns `direction: None`, `draw_direction: None`, `level: "low"`, `lamp: True`, `arrives: "No window here. A lamp or grow light will do the work."`. For `("midday", "SW", ...)` the saved `direction` wins over the timing.
  - `test_guide_lists_all_eight_directions_in_both_seasons`: `len(guide("north","open")) == 16`, every item has `direction`, `season`, `level`, `arrives`, and for `south` the item for physical `N` summer has level `bright_direct`.
  - `test_fits_species_takes_the_level_and_the_one_below`: for level `bright_indirect` species with `default_light_level` `bright_indirect` and `medium` are included and `low` and `bright_direct` are not; the result is sorted by `common_name` and capped at `limit`; for level `low` only `low` species are included; species without a level are skipped.
  - `test_suit`: `suit("medium","medium")` and `suit("medium","bright_indirect")` are `suits`; `suit("bright_direct","medium")` is `prefers_brighter`; `suit("low","bright_direct")` is `prefers_dimmer`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd grove-backend && python3 -m pytest tests/test_light.py -q`
Expected: FAIL with `ModuleNotFoundError: No module named 'light'`

- [ ] **Step 3: Implement `light.py`** with the signatures above. Keep the base table as one dict of `(summer_level, winter_level)` pairs keyed by northern direction; `level_for` uses `effective_direction`, picks by season, then steps down one level for `tree` or `building` (floor at `low`). `season_for` treats April to September as northern summer. `window_summary` takes `direction or direction_for_sun(sun)`, then derives the rest; `draw_direction` is the effective direction.

- [ ] **Step 4: Run to verify it passes**

Run: `cd grove-backend && python3 -m pytest tests/test_light.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add grove-backend/light.py grove-backend/tests/test_light.py
git commit -m "feat: add the light rules"
```

---

### Task 2: Lesson ids, the seedling swap, and old finishers (backend)

**Files:**
- Modify: `grove-backend/tracks.py`, `grove-backend/server.py` (`_lesson_queue_for`, `complete_lesson`, `/lessons/queue`)
- Test: `grove-backend/tests/test_tracks.py`, `grove-backend/tests/test_lesson_endpoints.py`

**Interfaces:**
- Consumes: Plan 1's `tracks.py` and `_lesson_queue_for`.
- Produces:
  - `tracks.LESSON_IDS` now includes `light-basics` and `window-map`; `tracks.LEGACY_LESSON_IDS = ("window-blueprint",)`; `tracks.LIBRARY_LESSON_IDS` (the ids a person can start)
  - `TRACK_LESSON["seedling"] == "light-basics"`
  - `tracks.completed_lessons` still returns legacy ids (so growth is unchanged)
  - `tracks.with_legacy_credit(done: list[str]) -> list[str]`: adds `light-basics` when `window-blueprint` is in `done`
  - Queue response gains `up_next: str | None` and `progress: dict[str, int]`; `library` is `LIBRARY_LESSON_IDS`
  - `POST /api/lessons/window-blueprint/complete` returns 404

- [ ] **Step 1: Update and add tests.**
  - In `test_tracks.py` change the seedling expectation to `["light-basics", "soil-finger-test"]`, and add:
    - `test_the_library_lists_the_two_light_lessons_and_not_the_retired_one`
    - `test_the_retired_lesson_is_still_read_from_the_records`: `completed_lessons(["lesson:window-blueprint"]) == ["window-blueprint"]`
    - `test_finishing_the_old_lesson_credits_part_one_only`: `with_legacy_credit(["window-blueprint"])` contains `light-basics` and not `window-map`; the input list is not changed; with no legacy id the list is returned as it was.
    - `test_a_seedling_user_who_finished_the_old_lesson_only_has_soil_left`: `build_lesson_queue("seedling", with_legacy_credit(["window-blueprint"])) == ["soil-finger-test"]`
  - In `test_lesson_endpoints.py` add, using that file's existing fake client:
    - `test_the_queue_suggests_part_two_after_part_one`: a user with `lesson:light-basics` gets `up_next == "window-map"`; a user with both gets `None`; a user with neither gets `None`.
    - `test_the_queue_credits_the_old_lesson_without_writing`: user with `lesson:window-blueprint` gets `completed` containing `light-basics`, `up_next == "window-map"`, and their `tutorials_seen` is unchanged afterwards.
    - `test_the_queue_returns_saved_progress`: a user with `lesson_progress: {"window-map": 2}` gets `progress == {"window-map": 2}`; a user with none gets `{}`.
    - `test_the_retired_lesson_cannot_be_completed`: 404.
    - `test_the_new_lessons_can_be_completed_with_a_time_stamp`: completing `light-basics` adds `lesson:light-basics` and a `lesson_completed_at.light-basics`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-backend && python3 -m pytest tests/test_tracks.py tests/test_lesson_endpoints.py -q`
Expected: FAIL on the seedling queue and the missing ids.

- [ ] **Step 3: Implement** the constants and `with_legacy_credit` in `tracks.py`. In `server.py`, `_lesson_queue_for` reads `completed_lessons`, applies `with_legacy_credit` for the lists it returns, sets `up_next` to `window-map` when `light-basics` is in the credited list and `window-map` is not, returns `progress` from `user.get("lesson_progress") or {}`, and `library` from `LIBRARY_LESSON_IDS`. `complete_lesson` rejects ids not in `LESSON_IDS` or in `LEGACY_LESSON_IDS`.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests -q`
Expected: PASS (all backend tests). The nook growth tests still pass, which is the proof that legacy completions still count.

- [ ] **Step 5: Commit**

```bash
git add grove-backend/tracks.py grove-backend/server.py grove-backend/tests/test_tracks.py grove-backend/tests/test_lesson_endpoints.py
git commit -m "feat: add the two light lessons and retire window blueprint"
```

---

### Task 3: Saving the window, the reading, progress, and the prompt (backend)

**Files:**
- Create: `grove-backend/light_service.py`
- Modify: `grove-backend/server.py` (new endpoints, after the nook endpoints)
- Test: `grove-backend/tests/test_light_service.py`, `grove-backend/tests/test_light_endpoints.py`

**Interfaces:**
- Consumes: `light` (Task 1), `nook_service.complete_readiness_step` and `NookError` (Plan 2), `tests/fakes.py` `FakeDb`.
- Produces (in `light_service.py`):
  - `class LightError(Exception)` with `.status` and `.detail`
  - `async save_window(db, user_id, sun, direction, view, hemisphere, now_iso) -> dict` returns `light.window_summary(...)`
  - `async save_reading(db, user_id, reading, now_iso) -> dict` returns `{"light_reading": reading}`
  - `async save_progress(db, user_id, lesson_id, card, now_iso) -> dict` returns `{"lesson_progress": {...}}`
  - `async set_prompt(db, user_id, action, now_iso) -> dict` returns `{"light_prompt_pending": bool, "light_prompt_dismissed": bool}`
  - `async fits_for(db, user_id) -> dict` returns `{"has_window", "level", "plants": [{"id","name","suit"}], "species": [{"id","slug","common_name"}]}`
- Produces (endpoints, all `get_current_user`):
  - `POST /api/users/me/window` body `{sun?, direction?, view?, hemisphere?}`; 422 for a value outside the lists; 422 if neither `sun` nor `direction` is given
  - `POST /api/users/me/light-reading` body `{reading}`
  - `POST /api/lessons/{lesson_id}/progress` body `{card: int}`; 404 for an unknown or retired lesson; `card < 0` is 422
  - `POST /api/users/me/light-prompt` body `{action: "later" | "dismiss"}`
  - `GET /api/light/fits`, `GET /api/light/guide?hemisphere=&view=`

- [ ] **Step 1: Write the failing tests** (the service tests call the functions on a `FakeDb`; the endpoint tests use the client fixture pattern from `test_nook_endpoints.py`):
  - `test_saving_a_window_by_timing_derives_the_direction`: `save_window(db,"u1","afternoon",None,None,None,iso)` saves `window_sun="afternoon"`, `window_view="open"`, `hemisphere="north"`, and returns `direction == "W"`. `window_direction` is not stored.
  - `test_saving_by_compass_stores_the_direction_and_derives_the_timing`: direction `SE` stores `window_direction="SE"` and `window_sun="morning"`.
  - `test_no_window_stores_no_direction_and_clears_an_old_one`: after a compass save, `nowindow` leaves no `window_direction`.
  - `test_hemisphere_and_view_are_remembered_when_left_out`: a second save without them keeps the first values.
  - `test_saving_a_window_dismisses_the_prompt`: `light_prompt_pending` is false and `light_prompt_dismissed` is true afterwards.
  - `test_saving_a_window_completes_the_readiness_light_spot_step_once`: with a started `readiness_plant`, the step `light-spot` has a time stamp after the save and it does not change on a second save; with no readiness plant the save still succeeds and writes nothing to `readiness_plant`.
  - `test_saving_a_reading_keeps_the_value_and_dismisses_the_prompt`.
  - `test_progress_is_saved_per_lesson`: saving card 2 for `window-map` and card 1 for `light-basics` keeps both; a later card 0 for `window-map` replaces 2.
  - `test_progress_rejects_unknown_and_retired_lessons`: `LightError` status 404 for `nope` and for `window-blueprint`.
  - `test_the_prompt_actions`: `later` sets pending true; `dismiss` sets pending false and dismissed true; `later` after dismissed leaves pending false.
  - `test_fits_has_no_window_until_one_is_saved`: `{"has_window": False, "level": None, "plants": [], "species": []}`.
  - `test_fits_names_the_users_plants_and_matching_species`: a user at midday (level `bright_direct`, summer) with a plant whose species is `bright_direct` gets `suits`, a `low` species plant gets `prefers_dimmer`, a plant without `species_id` or with an unknown species is left out, archived plants are left out, and `species` lists only `bright_direct` and `bright_indirect` species sorted by name, at most 6.
  - Endpoint tests: `test_window_endpoint_rejects_bad_values` (a bad `sun`, a bad `direction`, a bad `view`, and an empty body are all 422), `test_window_endpoint_returns_the_summary`, `test_reading_endpoint_rejects_bad_values`, `test_progress_endpoint_404_and_422`, `test_guide_endpoint_has_sixteen_items`, `test_the_endpoints_only_touch_the_signed_in_user` (another user's document is unchanged).

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-backend && python3 -m pytest tests/test_light_service.py tests/test_light_endpoints.py -q`
Expected: FAIL: the module and routes do not exist.

- [ ] **Step 3: Implement `light_service.py`** with the signatures above, and the endpoints in `server.py` with pydantic `Literal` types for the enums. In `save_window`, call `nook_service.complete_readiness_step(db, user_id, "light-spot", now_iso)` and ignore a `NookError` with status 409. In `fits_for`, read `window_*` fields off the user, call `light.window_summary` for the level, load active plants that have a `species_id`, and load species from `db.species`. Extend `FakeDb` in `tests/fakes.py` only if a call used here is missing.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests -q`
Expected: PASS (all backend tests).

- [ ] **Step 5: Commit**

```bash
git add grove-backend/light_service.py grove-backend/server.py grove-backend/tests/test_light_service.py grove-backend/tests/test_light_endpoints.py grove-backend/tests/fakes.py
git commit -m "feat: save the person's window, light reading, progress, and prompt"
```

---

### Task 4: The nook state carries the window (backend)

**Files:**
- Modify: `grove-backend/nook_service.py` (`build_state`)
- Test: `grove-backend/tests/test_nook_service.py`

**Interfaces:**
- Consumes: `light.window_summary` (Task 1).
- Produces: the nook state gains `window`: `None`, or the dict `light.window_summary` returns. It never contains a number.

- [ ] **Step 1: Write the failing tests** in `test_nook_service.py`:
  - `test_state_has_no_window_until_one_is_saved`: `state["window"] is None`.
  - `test_state_carries_the_saved_window`: a user with `window_sun="midday"`, `window_view="tree"`, `hemisphere="north"` gets `window["level"] == "bright_indirect"`, `window["direction"] == "S"`, `window["lamp"] is False`.
  - `test_state_window_for_no_window`: `nowindow` gives `lamp True` and `direction None`.
  - `test_state_window_follows_the_hemisphere_in_the_drawing`: `window_direction="N"` and `hemisphere="south"` gives `window["direction"] == "N"` and `window["draw_direction"] == "S"`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-backend && python3 -m pytest tests/test_nook_service.py -q`
Expected: FAIL with `KeyError: 'window'`

- [ ] **Step 3: Implement** by adding `"window": light.window_summary(user.get("window_sun"), user.get("window_direction"), user.get("window_view") or "open", user.get("hemisphere") or "north", now)` to the dict `build_state` returns.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests -q`
Expected: PASS (all backend tests).

- [ ] **Step 5: Commit**

```bash
git add grove-backend/nook_service.py grove-backend/tests/test_nook_service.py
git commit -m "feat: add the window to the nook state"
```

---

### Task 5: Sun patches in the room (frontend)

**Files:**
- Create: `grove-frontend/src/nook/windowLight.js`
- Modify: `grove-frontend/src/nook/drawRoom.js`, `grove-frontend/src/nook/palette.js`, `grove-frontend/src/nook/buildView.js`, `grove-frontend/src/pages/NookPage.jsx`
- Test: `grove-frontend/src/nook/windowLight.test.js`, `drawRoom.test.js`, `helpers.test.js`, `grove-frontend/src/pages/NookPage.test.js`

**Interfaces:**
- Produces:
  - `windowLight.js`: `lightPatch(window | null) -> { kind: 'default' | 'none' | 'sun' | 'lamp', reach: number, tint: 'cool' | 'warm' | 'hot', soft: boolean }`, where `window` is the object from the nook state (`draw_direction`, `season`, `view`, `lamp`); `windowSentence(window) -> string`
  - `drawRoom(ctx, view, tick)`: `view.window` is optional; `view.pip` may be `null` (no Pip is drawn)
  - `buildView(state, mood)` adds `window: state.window`
  - `ROOM` gains `beamCool`, `beamWarm`, `beamHot`, `lamp`

- [ ] **Step 1: Write the failing tests.**
  - `windowLight.test.js`:
    - `test_no_window_keeps_the_old_beam`: `lightPatch(null).kind === 'default'`.
    - `test_north_has_no_patch_and_no_window_has_a_lamp`: `lightPatch({draw_direction:'N',season:'summer',view:'open',lamp:false}).kind === 'none'`; `lightPatch({lamp:true}).kind === 'lamp'`.
    - `test_reach_runs_from_short_to_long`: with `open` view in summer, reach for NE < E < SE < S, and `NW` < `W`.
    - `test_winter_reaches_deeper_than_summer_for_south_facing`: S, SE, and SW winter reach > summer reach.
    - `test_a_tree_or_building_shortens_and_softens`: reach with `tree` < reach with `open`, and `soft` is true.
    - `test_tint_is_hot_for_west_and_southwest_and_cool_for_morning_directions`.
    - `test_window_sentence`: `windowSentence({sun:'afternoon',direction:'SW',view:'tree',arrives:'Hot sun from midday into the evening.',lamp:false})` is `"Your window faces southwest and looks out on a tree. Hot sun from midday into the evening."`; for `lamp:true` it is `"There's no window here, so the nook is lit by a lamp."`; for `null` it is `""`.
  - `drawRoom.test.js` (reuse its `recorder` and `view` helpers):
    - `test_a_south_window_draws_a_warm_beam_in_the_floor_rows` (rects with `ROOM.beamWarm` exist and all lie within `y >= 56`).
    - `test_a_north_window_draws_no_beam_at_all` (no rects with any beam colour).
    - `test_no_window_in_the_view_draws_the_original_beam` (rects with `ROOM.beam`).
    - `test_a_lamp_glows_on_the_floor_and_the_pane_is_dark_when_there_is_no_window`.
    - `test_a_null_pip_draws_no_pip` (no `PALETTE.k` ink at Pip's spots, and no throw).
    - The existing "nothing is drawn outside the room" test also runs for `S` winter, `W` summer, and the lamp.
  - `helpers.test.js`: `buildView` passes `window` through, and is `null` when the state has none.
  - `NookPage.test.js`: with `window` in the state, the page shows `windowSentence(...)` as text; without it, no such line.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/nook src/pages/NookPage`
Expected: FAIL: `windowLight` is missing and the new draw cases fail.

- [ ] **Step 3: Implement** `windowLight.js` with a small table of `reach` and `tint` per drawing direction (summer values), winter adds a fixed extra for S, SE, SW and W, and `tree` or `building` subtracts a fixed amount and sets `soft`. In `drawRoom.js` replace the hard-coded beam loop with a function that draws `lightPatch(view.window)`: `default` keeps today's beam, `sun` draws the slanted band for `reach` columns in the matching `ROOM` tint (a softer alpha when `soft`), `none` draws nothing, `lamp` draws a small warm glow on the floor and makes the four window panes dark. Guard `view.pip` for `null`. Add the colours to `palette.js`. Add `windowSentence` to the NookPage text block.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Look at the rooms**

Draw S, SW, W, N, NE in both seasons and the lamp into images with a fake canvas context, as in Plan 2, and look. Check: patches start at the window, stay inside the room, and reach from short to long as the test says; the lamp reads as a lamp. Fix `drawRoom.js` or `windowLight.js`, not the tests.

- [ ] **Step 6: Commit**

```bash
git add grove-frontend/src/nook grove-frontend/src/pages/NookPage.jsx grove-frontend/src/pages/NookPage.test.js
git commit -m "feat: light the nook room by the person's window"
```

---

### Task 6: API client, lesson text, and ids (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/light/lightCards.js`, `grove-frontend/src/lessons/light/lightCopy.js`
- Modify: `grove-frontend/src/lib/api.js`, `lessons/registry.js`, `lessons/lessonMeta.js`
- Test: `grove-frontend/src/lessons/light/lightCards.test.js`, `lightCopy.test.js`, `lessons/lessonMeta.test.js`, `pages/LessonPages.test.js` (only the lists of ids)

**Interfaces:**
- Produces:
  - `api.js`: `lightAPI = { setWindow(body), setReading(reading), progress(lessonId, card), prompt(action), fits(), guide(hemisphere, view) }` (all `POST`/`GET` to the endpoints in Task 3), and `lessonAPI.progress` is not added (it lives on `lightAPI`)
  - `lightCards.js`: `export const LIGHT_BASICS_CARDS` and `WINDOW_MAP_CARDS`, each an array of 4 card objects `{ header, headline, body, cta, interactive?: 'shadow-test' | 'curtain' | 'window-pick' | 'window-room' | 'fits' | 'closing', icon? }`
  - `lightCopy.js`: `readingLine(reading) -> string`, `suitLine(name, suit) -> string`, `directionName(direction) -> string` (for example `SW` becomes `southwest`), `levelName(level) -> string` (the plain words: `Direct sun`, `Bright indirect`, `Medium`, `Low`)
  - `registry.js`: `LESSON_CARDS` has `light-basics` and `window-map`, and no `window-blueprint`
  - `lessonMeta.js`: `LESSON_META` has `light-basics` (title `Your spot's light`) and `window-map` (title `Your window`), no `window-blueprint`

- [ ] **Step 1: Write the failing tests.**
  - `lightCards.test.js`: `test_each_part_has_four_cards` and `test_every_card_has_a_headline_body_and_header`; `test_card_one_of_part_one_is_the_shadow_test` (`interactive === 'shadow-test'`) and its headline mentions the hand; `test_part_two_card_order` is `['window-pick','window-room','fits','closing']`; `test_no_card_text_contains_a_number_of_hours_or_the_word_wrong` (copy rule); `test_part_one_card_three_is_the_curtain`.
  - `lightCopy.test.js`: `readingLine('crisp')` mentions direct sun; `'soft'` mentions bright indirect; `'faint'` mentions low; `suitLine('Pothos','suits')` is `"Your Pothos suits this spot."`; `suitLine('Jade','prefers_brighter')` is `"Your Jade would like a sunnier spot."`; `suitLine('Fern','prefers_dimmer')` is `"Your Fern would like a shadier spot."`; `directionName('SW') === 'southwest'`; all eight names; `levelName` covers the four levels.
  - `lessonMeta.test.js` and `LessonPages.test.js`: update the id lists so they name `light-basics` and `window-map` and not `window-blueprint`, and add `test_lesson_meta_ids_match_the_backend_library`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons src/pages/LessonPages`
Expected: FAIL: the files and ids do not exist.

- [ ] **Step 3: Implement** the files above. Card copy follows the spec's Part 1 and Part 2 sections, short and plain, in the existing lesson-card style (`header: 'Card 1 of 4 · Try it'`, `cta`). Part 2's last-card text stays generic because the closing step swaps its own content in. Remove the `WindowBlueprintVariations` import from `registry.js` (the file stays in the repo as the retired lesson's source until Task 11 decides its route).

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add grove-frontend/src/lib/api.js grove-frontend/src/lessons grove-frontend/src/pages/LessonPages.test.js
git commit -m "feat: add the light lesson text and API client"
```

---

### Task 7: The lesson player renders steps and resumes (frontend)

**Files:**
- Modify: `grove-frontend/src/lessons/LessonPlayer.jsx`, `grove-frontend/src/pages/LessonPage.jsx`
- Test: `grove-frontend/src/lessons/LessonPlayer.test.js`, `grove-frontend/src/pages/LessonPages.test.js`

**Interfaces:**
- Consumes: `lightAPI` (Task 6), the queue's `progress` (Task 2).
- Produces:
  - `LessonPlayer` props: `initialIndex?: number` (default 0, clamped to the last card), `onAdvance?: (index: number) => void` (called with the new index after a move), `renderCard?: (card, helpers) => ReactNode | null` where `helpers = { next(), back(), index, isLast }`. When `renderCard` returns a node for a card, the node replaces that card's default next button (the default back button stays). A card with no node behaves as before.
  - `LessonPage` passes `initialIndex` from `queue.progress[lessonId]` when the lesson is not completed, calls `lightAPI.progress(lessonId, index)` on each advance (failures ignored), updates `user.lesson_progress` through `updateUser`, and passes `renderCard` from the light steps registry (`lessons/light/steps.js`, built in Tasks 8 to 10; until then it returns `null`).

- [ ] **Step 1: Write the failing tests.**
  - `LessonPlayer.test.js`: `test_initial_index_opens_that_card_and_is_clamped` (index 2 opens `Card 3`; 99 opens the last card; a negative value opens card 1); `test_on_advance_is_called_with_the_new_index_on_next_and_back`; `test_a_rendered_card_replaces_the_next_button_and_can_advance` (the render function receives `next`, calling it moves on, the default `lesson-next` button is absent on that card, and `lesson-back` is still there from card 2 on); `test_a_card_with_no_render_result_keeps_the_default_button`; `test_the_final_card_hook_still_works`.
  - `LessonPages.test.js`: `test_a_lesson_resumes_on_the_saved_card` (queue says `progress: {'plant-er': 1}` and the lesson is not completed → card 2 is open; completed → card 1); `test_advancing_saves_progress_and_a_failure_does_not_block` (`lightAPI.progress` called with `('plant-er', 1)`; when it rejects, the next card still shows); `test_progress_is_updated_on_the_signed_in_user`.
  - Add `lightAPI` to the file's `jest.mock('../lib/api', ...)` factory with `progress: jest.fn()`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons/LessonPlayer src/pages/LessonPages`
Expected: FAIL on the new props.

- [ ] **Step 3: Implement** the props. Keep the focus-on-headline effect. `LessonPage` reads `progress` and `completed` from the queue response it already loads.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add grove-frontend/src/lessons/LessonPlayer.jsx grove-frontend/src/lessons/LessonPlayer.test.js grove-frontend/src/pages/LessonPage.jsx grove-frontend/src/pages/LessonPages.test.js
git commit -m "feat: let lesson cards render steps and resume where they left off"
```

---

### Task 8: Part 1 steps: the shadow test and the curtain (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/light/ShadowTestStep.jsx`, `grove-frontend/src/lessons/light/CurtainPair.jsx`, `grove-frontend/src/lessons/light/steps.js`
- Test: `grove-frontend/src/lessons/light/ShadowTestStep.test.js`, `CurtainPair.test.js`

**Interfaces:**
- Consumes: `lightAPI.setReading`, `lightAPI.prompt` (Task 6), `drawRoom` and `NookCanvas` (Plan 2), `lightPatch` (Task 5).
- Produces:
  - `ShadowTestStep({ next, onSaved })`: four buttons (`shadow-crisp`, `shadow-soft`, `shadow-faint`, `shadow-later`). A choice calls `lightAPI.setReading(reading)` once, then `onSaved(reading)` and `next()`. `shadow-later` calls `lightAPI.prompt('later')` and `next()`. A failed save shows `shadow-error` (`role="alert"`) and does not advance. Buttons are at least 44 pixels tall and disabled while saving.
  - `CurtainPair()`: two small room pictures side by side, labelled `South window, no curtain` and `South window, sheer curtain`, with the text lines `Direct. Sharp patch, strong light.` and `Filtered, bright indirect. Soft patch, no scorch.`
  - `steps.js`: `renderLightCard(card, helpers, ctx) -> ReactNode | null`, mapping `card.interactive` to a step; `ctx` carries what `LessonPage` has (`user`, `updateUser`). Entries for later tasks return `null` until they exist.

- [ ] **Step 1: Write the failing tests** (mount with `createRoot`, `act`, mock `lightAPI`, as in `NookOfferCard.test.js`):
  - `test_choosing_a_reading_saves_it_once_and_moves_on`: click `shadow-crisp` twice quickly → `setReading` called once with `'crisp'`, `next` once, `onSaved` with `'crisp'`.
  - `test_each_reading_saves_its_own_value`.
  - `test_later_leaves_a_prompt_and_moves_on`: `prompt` called with `'later'`, `setReading` not called, `next` called.
  - `test_a_failed_save_shows_an_error_and_stays`: `setReading` rejects → `shadow-error` text is `Could not save that. Try again.`, `next` not called, buttons usable again.
  - `test_buttons_are_labelled_and_large`: each button has visible text and `min-h` at least 44 (class `min-h-[44px]`).
  - `CurtainPair.test.js`: both labels and both text lines are present, and there are two canvases or images with an accessible name.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons/light`
Expected: FAIL with `Cannot find module './ShadowTestStep'`

- [ ] **Step 3: Implement** the components. `CurtainPair` draws two bare rooms with `NookCanvas` at scale 2 using views with a `window` of S in summer, the second with `view: 'tree'` as the soft stand-in for the curtain (same patch, softened), and `pip: null`.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add grove-frontend/src/lessons/light
git commit -m "feat: add the shadow test and curtain steps"
```

---

### Task 9: Part 2 steps: the window pick and the room (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/light/WindowPickStep.jsx`, `grove-frontend/src/lessons/light/WindowRoomStep.jsx`
- Modify: `grove-frontend/src/lessons/light/steps.js`
- Test: `grove-frontend/src/lessons/light/WindowPickStep.test.js`, `WindowRoomStep.test.js`

**Interfaces:**
- Consumes: `lightAPI` (Task 6), `lightPatch`, `NookCanvas`, `ShadowTestStep` (Tasks 5 and 8).
- Produces:
  - `WindowPickStep({ next, onSaved })`. Shows, in order: a question for the sun timing (`pick-morning`, `pick-midday`, `pick-afternoon`, `pick-none`, `pick-unsure`, `pick-nowindow`), an optional view group (`view-open`, `view-tree`, `view-building`, default open, shown with `aria-pressed`), a hemisphere group (`hemi-north`, `hemi-south`, default north), and the shortcut `pick-compass` that opens eight direction buttons (`dir-N` … `dir-NW`). Saving calls `lightAPI.setWindow({ sun?, direction?, view, hemisphere })` once, then `onSaved(window)` and `next()`. `pick-unsure` shows the shadow test text and a `Check again` button (`pick-recheck`) that returns to the timing question; `pick-later` (`I'll check at noon`) calls `lightAPI.prompt('later')` and `next()`. A failed save shows `pick-error` and stays.
  - `WindowRoomStep({ window, hemisphere })`: one bare room (`pip: null`) lit for `window`, eight direction chips (`chip-N` … `chip-NW`, `aria-pressed` on the chosen one), a season switch (`season-summer`, `season-winter`), and a text block with the sentence, the level words, and when the sun arrives. Chips and season only change the picture and text; they do not save anything. Data comes from `lightAPI.guide(hemisphere, view)`, with a failure showing `room-error` and the text for the picked window only. Two footnotes: `West and southwest glass gets hot. A sheer curtain helps.` and `North glass runs cold in winter. Keep leaves off it.` For `nowindow`, chips and season are hidden, the picture is the lamp room, and a grow-light card text appears: `A lamp or grow light does the work of a window. Choose one made for low light plants.`

- [ ] **Step 1: Write the failing tests:**
  - `WindowPickStep.test.js`:
    - `test_pick_a_timing_saves_once_with_defaults`: click `pick-afternoon` twice → `setWindow` once with `{sun:'afternoon', view:'open', hemisphere:'north'}`, then `next`.
    - `test_view_and_hemisphere_choices_are_sent`: choose `view-tree` and `hemi-south` first → `{view:'tree', hemisphere:'south'}`.
    - `test_the_compass_saves_the_direction`: `pick-compass`, then `dir-SE` → `setWindow` called with `direction:'SE'` and no `sun`.
    - `test_no_window_is_a_choice`: `pick-nowindow` → `sun:'nowindow'`.
    - `test_not_sure_shows_the_shadow_test_and_does_not_save`: `pick-unsure` → text containing `crisp` is visible, `setWindow` not called, and `pick-recheck` brings the timing question back.
    - `test_later_leaves_a_prompt`: `pick-later` → `prompt('later')`, `next`, no `setWindow`.
    - `test_a_failed_save_stays_with_an_error`: `pick-error` text `Could not save that. Try again.`
    - `test_every_choice_is_a_labelled_button_at_least_44px_tall`.
  - `WindowRoomStep.test.js`:
    - `test_it_shows_the_sentence_and_when_the_sun_arrives_as_text` (using the picked window).
    - `test_chips_change_the_picture_and_text_without_saving`: click `chip-W`; the text shows W's `arrives` string from the mocked guide; no API write is called; `aria-pressed` moves.
    - `test_the_season_switch_changes_the_level_text`.
    - `test_a_south_hemisphere_guide_is_requested_for_a_south_user`: `guide` called with `('south','open')`.
    - `test_no_window_shows_the_lamp_text_and_hides_chips`.
    - `test_a_guide_failure_still_shows_the_picked_window_text_and_an_error`.
    - `test_footnotes_are_present`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons/light`
Expected: FAIL with `Cannot find module './WindowPickStep'`

- [ ] **Step 3: Implement** both components and the `steps.js` entries for `window-pick` and `window-room`. Keep a `savingRef` against double taps, as `SoilTestStep` does. After a successful pick, `updateUser` sets `window_sun`, `window_direction`, `window_view` and `hemisphere` on the signed-in user.

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add grove-frontend/src/lessons/light
git commit -m "feat: add the window pick and room steps"
```

---

### Task 10: What fits, and the ending (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/light/FitsStep.jsx`, `grove-frontend/src/lessons/light/ClosingStep.jsx`, `grove-frontend/src/lessons/light/keepsake.js`
- Modify: `grove-frontend/src/lessons/light/steps.js`
- Test: `grove-frontend/src/lessons/light/FitsStep.test.js`, `ClosingStep.test.js`, `keepsake.test.js`

**Interfaces:**
- Consumes: `lightAPI.fits` (Task 6), `suitLine` and `levelName` (Task 6), `drawRoom` and `ROOM_W`, `ROOM_H` (Plan 2), `nookAPI.state` (Plan 2), `PipPanel` (Plan 2).
- Produces:
  - `FitsStep({ next })`: loads `lightAPI.fits()`. With plants it lists each as `suitLine(name, suit)`; with none it lists species as links to `/species/{id}`; with `has_window: false` it says `Pick a window first and this will fill in.` Never shows a score. A failed load shows `fits-error` and a `next` button so the person is never stuck.
  - `ClosingStep({ nookOn, window, onDone })`: when `nookOn`, shows the lit nook (`NookCanvas` from `buildView(state)` with `state.window`) and Pip's line `I'm Pip. I'm your guide, not a plant. I'll sit where your light is good.` When not, shows the keepsake picture (a bare room lit their way) with the text `Roughly where the light falls` plus direction and season words, a `Save as an image` button (`keepsake-save`, hidden when the canvas is not available), and no Pip text and no nook invitation. Both end with the existing `MarkDoneStep` through `onDone`.
  - `keepsake.js`: `renderKeepsake(window, scale = 4) -> HTMLCanvasElement | null` (null without 2D canvas support) and `saveKeepsake(window, document)`, which triggers a download named `my-window-light.png` through an object URL and returns `true`, or `false` when it cannot.

- [ ] **Step 1: Write the failing tests:**
  - `FitsStep.test.js`: `test_plants_are_named_with_a_kind_line` (`Your Pothos suits this spot.`, `Your Jade would like a sunnier spot.`); `test_no_plants_lists_species_as_links`; `test_no_window_asks_to_pick_first`; `test_a_failed_load_shows_an_error_and_still_lets_the_person_continue`; `test_no_numbers_or_scores_appear` (the text contains no digit).
  - `ClosingStep.test.js`: `test_opted_in_shows_pip_and_his_line`; `test_not_opted_in_shows_no_pip_line_and_no_nook_nudge` (no `Pip`, no `nook` in the text, though the word `Pip` may appear in no other node); `test_not_opted_in_shows_the_keepsake_text_with_direction_and_season`; `test_the_save_button_is_hidden_without_canvas_support` (stub `getContext` to return `null`); `test_the_save_button_calls_save_once`; `test_done_calls_on_done_once_on_a_double_tap`; `test_no_window_ending_still_works` (keepsake text says the nook is lit by a lamp).
  - `keepsake.test.js`: `test_renders_at_four_times_size` (width 512, height 320); `test_returns_null_without_a_canvas`; `test_save_makes_a_png_download_with_the_right_name` (spy on an anchor's `download` and `click`, and on `URL.createObjectURL` and `revokeObjectURL`); `test_save_returns_false_when_to_blob_is_missing`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons/light`
Expected: FAIL with `Cannot find module './FitsStep'`

- [ ] **Step 3: Implement** the files and the `fits` and `closing` entries in `steps.js`. `LessonPage` passes `nookOn` and renders `MarkDoneStep` inside `ClosingStep` for `window-map` (and as before for `light-basics`).

- [ ] **Step 4: Run to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites).

- [ ] **Step 5: Commit**

```bash
git add grove-frontend/src/lessons/light
git commit -m "feat: add the what-fits step and the ending"
```

---

### Task 11: Care Today prompt, up-next, routes, stories, and verification (frontend)

**Files:**
- Create: `grove-frontend/src/components/LightPromptCard.jsx`, `grove-frontend/src/lessons/light/LightLesson.stories.jsx`
- Modify: `grove-frontend/src/pages/CarePage.js`, `grove-frontend/src/components/NextLessonCard.jsx`, `grove-frontend/src/pages/LessonsPage.jsx`, `grove-frontend/src/App.js`, `docs/superpowers/specs/2026-10-20-room-light-map-design.md`
- Test: `grove-frontend/src/components/LightPromptCard.test.js`, `NextLessonCard.test.js`, `pages/LessonPages.test.js`

**Interfaces:**
- Consumes: the queue's `up_next` (Task 2), `lightAPI.prompt` (Task 6), `user.light_prompt_pending`, `user.light_prompt_dismissed`.
- Produces:
  - `LightPromptCard({ now = new Date() })`: shows only when `user.light_prompt_pending` is true, `user.light_prompt_dismissed` is not true, and the local hour is 11 to 14 inclusive. Text `Ready to check your light?` with `Check now` (`light-prompt-go`, goes to the lesson where they left off: `/lessons/light-basics` if `user.window_sun` is missing and `light_reading` is missing, else `/lessons/window-map`) and `Not today` (`light-prompt-dismiss`, calls `lightAPI.prompt('dismiss')` once and hides the card). It is mounted on Care Today above the lesson card.
  - `NextLessonCard` shows `up_next` when the queue is empty, and `LessonsPage` marks `up_next` with the label `Up next` in the library list.
  - The `/window-blueprint` route in `App.js` redirects to `/lessons`.

- [ ] **Step 1: Write the failing tests:**
  - `LightPromptCard.test.js`: `test_shows_only_when_pending_not_dismissed_and_around_midday` (table: pending at 11:00, 14:59 → shown; at 10:59 and 15:00 → hidden; not pending → hidden; dismissed → hidden); `test_check_now_goes_to_the_right_lesson` (no window and no reading → `/lessons/light-basics`; with either → `/lessons/window-map`); `test_not_today_dismisses_once_and_hides`; `test_a_failed_dismiss_still_hides_the_card_for_now`.
  - `NextLessonCard.test.js`: `test_shows_up_next_when_the_queue_is_empty`; `test_the_queue_wins_over_up_next`.
  - `LessonPages.test.js`: `test_the_lessons_page_labels_the_up_next_light_lesson`.
  - A small route test in `App`'s existing test (or a new one) for the redirect only if `App.js` already has a test; otherwise confirm it in Step 5.

- [ ] **Step 2: Run to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/components src/pages/LessonPages`
Expected: FAIL: the component does not exist.

- [ ] **Step 3: Implement** the component and the edits. Add stories for the shadow test, the window pick, the room step in six windows (S, SW, W, N, NE and no window), the south-hemisphere room, the fits step, and both endings. Add a v5.4 note to the spec stating the plan's differences (decisions 1 to 9).

- [ ] **Step 4: Run every frontend and backend test**

Run: `cd grove-backend && python3 -m pytest tests -q` and `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (all suites). Note both counts.

- [ ] **Step 5: Build the app and Storybook, and look**

Run: `cd grove-frontend && CI=false npm run build` then `npm run build-storybook`. Expected: both exit 0. Delete `storybook-static` and `build` afterwards. Then run `npm run storybook` and look at the stories by eye: every room, both endings, the keepsake preview. If a running backend is not available, record that the walkthrough was not run.

- [ ] **Step 6: Commit**

```bash
git add grove-frontend/src docs/superpowers/specs/2026-10-20-room-light-map-design.md
git commit -m "feat: add the Care Today light prompt, up-next label, and stories"
```

---

## Self-review

**Spec coverage.** Goals 1 and 8 (personal, short, resumable) are Tasks 6 to 8 and 11. Goal 2 (eight directions) is Task 1's guide, Task 5's drawing, and Task 9's chips. Goal 3 (curtain) is Task 8. Goal 4 (shadow test, view, seasons, read the plant) is Tasks 6, 8, and 9. Goals 5 and 6 (pick, then the nook lit that way) are Tasks 3, 4, 5, 9, and 10. Goal 7 (fits) is Tasks 3 and 10. Data fields are Tasks 3 and 4. Save and resume is Tasks 3, 7, and 11. The no-window path, hemisphere, and keepsake are Tasks 1, 9, and 10. The retired lesson and the old finishers are Task 2. The readiness `light-spot` step is Task 3. The owner's decision (seedling swap, up next, library for all) is Tasks 2 and 11.

**Known gaps.** The first-pass art and the level table need a gardener's review (decisions 3 and 9). The curtain picture uses a softened patch as its stand-in for a curtain. The midday prompt uses local time only. Hemisphere is asked in the lesson only, so a user who never takes it is treated as northern. Nothing was run against MongoDB or a browser while planning.

**Plans that follow.** Queueing the lessons for other tracks, a Settings control to change the window later, and several windows are not here.
