# Lessons, Quiz, and Soil Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Grove's static lesson mockups into real, saved lessons; add a short quiz that picks a first lesson; and add a soil test care action, with the Soil Finger-Test as the second lesson for every track.

**Architecture:** Backend adds two small pure modules (`tracks.py` for quiz and lesson order, `soil_check.py` for soil test fields and coaching) that `server.py` calls from a few new or extended endpoints. Lesson progress is stored in the existing `tutorials_seen[]` as `lesson:<id>`. The frontend reuses the card data already in the lesson mockup pages by exporting it, and adds a lesson player, a quiz overlay, and a soil test option in the care log.

**Tech Stack:** FastAPI + Motor (MongoDB) + pytest on the backend. React 19, craco (CRA jest), Tailwind, shadcn UI, Storybook 8 on the frontend.

**Spec:** `docs/superpowers/specs/2026-10-13-pip-room-design.md` (v5.2 plus corrections). This plan implements the parts of sections 3 and 4 that do not need the nook: the soil test event, the quiz, lesson order, and lesson storage. The nook itself is Plan 2 (see the end of this document).

## Global Constraints

- Lesson text is used as already written in the lesson mockup pages. Do not rewrite it.
- Track names (`reset`, `rebirth`, `rescue`, `steady_sprout`, `seedling`) are internal labels. Users never see them.
- Lesson completion is stored in `tutorials_seen[]` as `lesson:<id>`.
- Lesson ids are exactly: `soil-finger-test`, `plant-parent-reset`, `plant-er`, `habit-stacking`, `window-blueprint`.
- Quiz option ids are exactly: `unwell_or_guilt`, `overwater`, `gifted_no_instructions`, `forget`, `design_or_no_plant`.
- The quiz is multi-select, with one primary track chosen for the user. Empty answers fall back to the `rebirth` track.
- Lesson 1 is the primary track lesson. Lesson 2 is the Soil Finger-Test for every track. Rebirth is the exception: its lesson 1 is the Soil Finger-Test and its lesson 2 is `plant-parent-reset`.
- A user with no real plant who reaches the Soil Finger-Test's last card sees "Save this for your first plant." No soil test is logged, the lesson is not marked complete, and it is offered again after a plant is added.
- The soil test is logged as care action `soil_check`, with `soil_outcome` of `dry` or `damp` and an optional `soil_decision` of `water` or `wait`. Its reward is the same for every outcome and decision. Mismatches get coaching, not a different result.
- The existing `water_streak` mission keeps its type id. Only its copy changes.
- A soil test counts as a care log, so it updates the existing daily streak like any other care action.
- No core Grove feature may require the nook. This plan adds none of the nook.
- Copy is warm and plain. No guilt, no shame, no scores on plants.
- Existing users who joined before this ships must not be interrupted by the quiz. It shows only to accounts created within the last 14 days.
- Backend tests are `pytest` on pure modules. Frontend tests run through `npm test` (craco, jest). Jest here cannot resolve the `@/` import alias, so jest tests import only files with no `@/` imports.

## Review Focus

Failure modes the spec implies but a straight reading would not test. Each has a test in the task that owns the code.

1. **Quiz with no answers or unknown ids.** Expected: no crash, unknown ids ignored, `rebirth` default. (Task 1.)
2. **Soil test with a missing or invalid outcome or decision.** Expected: a 400 with a plain message, and no partial care logs written. (Tasks 2 and 3.)
3. **Completing an unknown lesson, or the same lesson twice.** Expected: 404 for unknown, no duplicate entry and no error for a repeat. (Task 4.)
4. **A user with no plant opening the Soil Finger-Test.** Expected: no log, no completion, and the server refuses completion with a 409. (Tasks 4 and 9.)
5. **An existing, long-time user opening the app after release.** Expected: no quiz overlay. (Task 6.)

---

## File structure

**Create (backend, in `grove-backend/`):**
- `tracks.py`: quiz resolution, lesson queue, lesson id helpers. Pure.
- `soil_check.py`: soil test field validation and coaching copy. Pure.
- `tests/conftest.py`: puts `grove-backend/` on the import path.
- `tests/test_tracks.py`, `tests/test_soil_check.py`, `tests/test_missions_copy.py`.

**Modify (backend):**
- `server.py`: imports, care log changes, quiz and lesson endpoints.
- `missions.py`: `water_streak` copy.

**Create (frontend, in `grove-frontend/src/`):**
- `lessons/lessonMeta.js`: lesson titles, quiz options, note chips, route helper.
- `lessons/quizGate.js`: pure rule for when to show the quiz.
- `lessons/registry.js`: lesson id to card data.
- `lessons/LessonPlayer.jsx`: steps through cards.
- `lessons/SoilTestStep.jsx`: the soil lesson's last card.
- `lessons/MarkDoneStep.jsx`: the other lessons' last card.
- `lessons/LessonPlayer.stories.jsx`, `components/QuizFlow.stories.jsx`.
- `lessons/lessonMeta.test.js`, `lessons/quizGate.test.js`.
- `pages/LessonPage.jsx`, `pages/LessonsPage.jsx`.
- `components/QuizFlow.jsx`, `components/NextLessonCard.jsx`.

**Modify (frontend):**
- `lib/api.js`: `lessonAPI`.
- `pages/SoilFingerTestVariation.js`, `HabitStackingVariations.js`, `PlantERVariations.js`, `WindowBlueprintVariations.js`, `ResetCourseVariation.js`: export card data.
- `App.js`: routes, quiz overlay.
- `components/CareLogModal.js`: soil test option.
- `pages/CarePage.js`: next lesson card.

---

### Task 1: Quiz and lesson order logic (backend)

**Files:**
- Create: `grove-backend/tracks.py`
- Create: `grove-backend/tests/conftest.py`
- Test: `grove-backend/tests/test_tracks.py`

**Interfaces:**
- Produces:
  - `TRACKS: tuple[str, ...]`, `LESSON_IDS: tuple[str, ...]`, `TRACK_LESSON: dict[str, str]`, `QUIZ_OPTION_TRACK: dict[str, str]`
  - `DEFAULT_TRACK: str`, `SOIL_LESSON: str`
  - `resolve_primary_track(answers: Iterable[str]) -> str`
  - `build_lesson_queue(primary_track: str, completed: Iterable[str]) -> list[str]`
  - `lesson_tutorial_id(lesson_id: str) -> str`
  - `completed_lessons(tutorials_seen: Iterable[str] | None) -> list[str]`

- [ ] **Step 1: Create the test import path helper**

Create `grove-backend/tests/conftest.py`:

```python
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
```

- [ ] **Step 2: Write the failing tests**

Create `grove-backend/tests/test_tracks.py`:

```python
import pytest

import tracks


@pytest.mark.parametrize(
    "answer,track",
    [
        ("unwell_or_guilt", "reset"),
        ("overwater", "rebirth"),
        ("gifted_no_instructions", "rescue"),
        ("forget", "steady_sprout"),
        ("design_or_no_plant", "seedling"),
    ],
)
def test_single_answer_maps_to_track(answer, track):
    assert tracks.resolve_primary_track([answer]) == track


def test_empty_answers_use_default_track():
    assert tracks.resolve_primary_track([]) == tracks.DEFAULT_TRACK
    assert tracks.DEFAULT_TRACK == "rebirth"


def test_none_answers_use_default_track():
    assert tracks.resolve_primary_track(None) == tracks.DEFAULT_TRACK


def test_unknown_answers_are_ignored():
    assert tracks.resolve_primary_track(["nonsense", "<script>"]) == tracks.DEFAULT_TRACK
    assert tracks.resolve_primary_track(["nonsense", "forget"]) == "steady_sprout"


def test_priority_when_several_answers_are_picked():
    # rescue beats reset beats rebirth beats steady_sprout beats seedling
    assert tracks.resolve_primary_track(["design_or_no_plant", "forget"]) == "steady_sprout"
    assert tracks.resolve_primary_track(["forget", "overwater"]) == "rebirth"
    assert tracks.resolve_primary_track(["overwater", "unwell_or_guilt"]) == "reset"
    assert tracks.resolve_primary_track(["unwell_or_guilt", "gifted_no_instructions"]) == "rescue"


def test_queue_puts_soil_lesson_second_for_every_other_track():
    assert tracks.build_lesson_queue("reset", []) == ["plant-parent-reset", "soil-finger-test"]
    assert tracks.build_lesson_queue("rescue", []) == ["plant-er", "soil-finger-test"]
    assert tracks.build_lesson_queue("steady_sprout", []) == ["habit-stacking", "soil-finger-test"]
    assert tracks.build_lesson_queue("seedling", []) == ["window-blueprint", "soil-finger-test"]


def test_queue_for_rebirth_starts_with_soil_lesson():
    assert tracks.build_lesson_queue("rebirth", []) == ["soil-finger-test", "plant-parent-reset"]


def test_queue_drops_completed_lessons_and_keeps_order():
    assert tracks.build_lesson_queue("rescue", ["plant-er"]) == ["soil-finger-test"]
    assert tracks.build_lesson_queue("rescue", ["soil-finger-test"]) == ["plant-er"]
    assert tracks.build_lesson_queue("rescue", ["plant-er", "soil-finger-test"]) == []


def test_queue_falls_back_for_unknown_track():
    assert tracks.build_lesson_queue("made-up", []) == tracks.build_lesson_queue("rebirth", [])
    assert tracks.build_lesson_queue(None, []) == tracks.build_lesson_queue("rebirth", [])


def test_lesson_tutorial_id_uses_prefix():
    assert tracks.lesson_tutorial_id("plant-er") == "lesson:plant-er"


def test_completed_lessons_reads_only_known_lesson_entries():
    seen = ["collection", "lesson:plant-er", "lesson:not-a-lesson", "lighting", "lesson:soil-finger-test", 7, None]
    assert tracks.completed_lessons(seen) == ["plant-er", "soil-finger-test"]


def test_completed_lessons_handles_missing_list():
    assert tracks.completed_lessons(None) == []
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd grove-backend && python3 -m pytest tests/test_tracks.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'tracks'`

- [ ] **Step 4: Write the implementation**

Create `grove-backend/tracks.py`:

```python
"""Lesson tracks and quiz resolution for Grove.

Pure functions only: no database access, so they can be unit tested.
Track names are internal labels. Users never see them.
"""
from typing import Iterable, List, Optional, Set

TRACKS = ("reset", "rebirth", "rescue", "steady_sprout", "seedling")

LESSON_IDS = (
    "soil-finger-test",
    "plant-parent-reset",
    "plant-er",
    "habit-stacking",
    "window-blueprint",
)

TRACK_LESSON = {
    "reset": "plant-parent-reset",
    "rebirth": "soil-finger-test",
    "rescue": "plant-er",
    "steady_sprout": "habit-stacking",
    "seedling": "window-blueprint",
}

QUIZ_OPTION_TRACK = {
    "unwell_or_guilt": "reset",
    "overwater": "rebirth",
    "gifted_no_instructions": "rescue",
    "forget": "steady_sprout",
    "design_or_no_plant": "seedling",
}

# When several answers are picked, the first track in this list wins.
TRACK_PRIORITY = ("rescue", "reset", "rebirth", "steady_sprout", "seedling")

DEFAULT_TRACK = "rebirth"
SOIL_LESSON = "soil-finger-test"
# Rebirth users already get the soil lesson first, so their second lesson is this one.
REBIRTH_SECOND_LESSON = "plant-parent-reset"
LESSON_PREFIX = "lesson:"


def resolve_primary_track(answers: Optional[Iterable[str]]) -> str:
    """Pick one track from the quiz answers. Unknown answers are ignored."""
    picked: Set[str] = set()
    for answer in answers or []:
        track = QUIZ_OPTION_TRACK.get(answer) if isinstance(answer, str) else None
        if track:
            picked.add(track)
    for track in TRACK_PRIORITY:
        if track in picked:
            return track
    return DEFAULT_TRACK


def build_lesson_queue(primary_track: Optional[str], completed: Optional[Iterable[str]]) -> List[str]:
    """Return the lessons still to do, in order.

    Lesson 1 is the primary track's lesson. Lesson 2 is the Soil Finger-Test,
    except for rebirth, whose lesson 1 already is the Soil Finger-Test.
    """
    track = primary_track if primary_track in TRACK_LESSON else DEFAULT_TRACK
    first = TRACK_LESSON[track]
    second = REBIRTH_SECOND_LESSON if first == SOIL_LESSON else SOIL_LESSON
    done = set(completed or [])
    return [lesson for lesson in (first, second) if lesson not in done]


def lesson_tutorial_id(lesson_id: str) -> str:
    """The entry stored in `tutorials_seen[]` when a lesson is completed."""
    return f"{LESSON_PREFIX}{lesson_id}"


def completed_lessons(tutorials_seen: Optional[Iterable[str]]) -> List[str]:
    """Read completed lesson ids out of `tutorials_seen[]`. Other entries are ignored."""
    out: List[str] = []
    for entry in tutorials_seen or []:
        if not isinstance(entry, str) or not entry.startswith(LESSON_PREFIX):
            continue
        lesson_id = entry[len(LESSON_PREFIX):]
        if lesson_id in LESSON_IDS and lesson_id not in out:
            out.append(lesson_id)
    return out
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests/test_tracks.py -v`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add grove-backend/tracks.py grove-backend/tests/conftest.py grove-backend/tests/test_tracks.py
git commit -m "feat: add quiz and lesson order logic"
```

---

### Task 2: Soil test fields and coaching (backend)

**Files:**
- Create: `grove-backend/soil_check.py`
- Test: `grove-backend/tests/test_soil_check.py`

**Interfaces:**
- Produces:
  - `SOIL_ACTION: str` (`"soil_check"`), `SOIL_OUTCOMES: tuple`, `SOIL_DECISIONS: tuple`
  - `class SoilCheckError(ValueError)`
  - `soil_fields(action: str, outcome: str | None, decision: str | None) -> dict` (empty dict for any action other than `soil_check`; raises `SoilCheckError` when invalid)
  - `soil_coaching(outcome: str | None, decision: str | None) -> str`

- [ ] **Step 1: Write the failing tests**

Create `grove-backend/tests/test_soil_check.py`:

```python
import pytest

import soil_check


def test_non_soil_actions_return_no_fields():
    assert soil_check.soil_fields("water", "dry", "water") == {}
    assert soil_check.soil_fields("check", None, None) == {}


def test_valid_soil_check_returns_fields():
    assert soil_check.soil_fields("soil_check", "dry", "water") == {
        "soil_outcome": "dry",
        "soil_decision": "water",
    }
    assert soil_check.soil_fields("soil_check", "damp", None) == {
        "soil_outcome": "damp",
        "soil_decision": None,
    }


@pytest.mark.parametrize("bad_outcome", [None, "", "wet", "DRY", 5])
def test_soil_check_needs_a_valid_outcome(bad_outcome):
    with pytest.raises(soil_check.SoilCheckError):
        soil_check.soil_fields("soil_check", bad_outcome, "water")


@pytest.mark.parametrize("bad_decision", ["", "drown", "WATER", 3])
def test_soil_check_rejects_an_invalid_decision(bad_decision):
    with pytest.raises(soil_check.SoilCheckError):
        soil_check.soil_fields("soil_check", "dry", bad_decision)


def test_error_messages_are_plain():
    with pytest.raises(soil_check.SoilCheckError) as err:
        soil_check.soil_fields("soil_check", None, None)
    assert str(err.value) == "A soil test needs an outcome: dry or damp."


def test_coaching_exists_for_every_outcome_and_decision():
    for outcome in soil_check.SOIL_OUTCOMES:
        for decision in soil_check.SOIL_DECISIONS + (None,):
            text = soil_check.soil_coaching(outcome, decision)
            assert text
            assert text.endswith(".")


def test_coaching_for_a_mismatch_suggests_waiting_or_watering():
    assert "good spot to wait" in soil_check.soil_coaching("damp", "water")
    assert "ready for a drink" in soil_check.soil_coaching("dry", "wait")


def test_coaching_never_blames_the_user():
    for outcome in soil_check.SOIL_OUTCOMES:
        for decision in soil_check.SOIL_DECISIONS + (None,):
            text = soil_check.soil_coaching(outcome, decision).lower()
            assert "wrong" not in text
            assert "mistake" not in text


def test_coaching_for_unknown_outcome_is_empty():
    assert soil_check.soil_coaching("wet", "water") == ""
    assert soil_check.soil_coaching(None, None) == ""
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd grove-backend && python3 -m pytest tests/test_soil_check.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'soil_check'`

- [ ] **Step 3: Write the implementation**

Create `grove-backend/soil_check.py`:

```python
"""Soil test fields and coaching copy.

Pure functions, no database access, so they can be unit tested. The soil
test is logged as a care action named `soil_check`. Every outcome and
decision is accepted. The coaching text explains, and never grades.
"""
from typing import Dict, Optional

SOIL_ACTION = "soil_check"
SOIL_OUTCOMES = ("dry", "damp")
SOIL_DECISIONS = ("water", "wait")


class SoilCheckError(ValueError):
    """Raised when a soil test has a missing or invalid value."""


def soil_fields(action: str, outcome: Optional[str], decision: Optional[str]) -> Dict[str, Optional[str]]:
    """Fields to store on a care log. Empty for any action but `soil_check`."""
    if action != SOIL_ACTION:
        return {}
    if outcome not in SOIL_OUTCOMES:
        raise SoilCheckError("A soil test needs an outcome: dry or damp.")
    if decision is not None and decision not in SOIL_DECISIONS:
        raise SoilCheckError("A soil test decision must be water or wait.")
    return {"soil_outcome": outcome, "soil_decision": decision}


_COACHING = {
    ("damp", "wait"): "Damp soil means your plant is still drinking, so waiting is a good call. Check again in a few days.",
    ("dry", "water"): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
    ("damp", "water"): "Damp already? This is a good spot to wait. Check again in a few days.",
    ("dry", "wait"): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
    ("damp", None): "Damp soil means your plant is still drinking. Check again in a few days.",
    ("dry", None): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
}


def soil_coaching(outcome: Optional[str], decision: Optional[str]) -> str:
    """Short, plain coaching text for a soil test. Empty if the outcome is unknown."""
    return _COACHING.get((outcome, decision), "")
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests/test_soil_check.py -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add grove-backend/soil_check.py grove-backend/tests/test_soil_check.py
git commit -m "feat: add soil test fields and coaching"
```

---

### Task 3: Log soil tests through the care log endpoint (backend)

**Files:**
- Modify: `grove-backend/server.py` (imports near line 33; `CareLogCreate` near line 1700; `VALID_CARE_ACTIONS` near line 1717; `create_care_log` near line 1750; `bulk_care_log` near line 1800)

**Interfaces:**
- Consumes: `soil_check.SOIL_ACTION`, `soil_check.soil_fields`, `soil_check.soil_coaching`, `soil_check.SoilCheckError` (Task 2)
- Produces: `POST /api/plants/{plant_id}/care-logs` accepts `actions: ["soil_check"]` with `soil_outcome` and `soil_decision`, stores both on the log, and returns `_meta.soil_coaching`. `POST /api/care-logs/bulk` rejects `soil_check` with a 400.

There is no automated endpoint test harness in this repository (`backend_test*.py` hit a hosted URL). This task is verified by compiling the file, a static check, and a manual request.

- [ ] **Step 1: Add the imports**

In `grove-backend/server.py`, replace:

```python
import missions as missions_mod
```

with:

```python
import missions as missions_mod
import soil_check as soil_check_mod
import tracks as tracks_mod
```

- [ ] **Step 2: Add the model fields**

Replace:

```python
    notes: Optional[str] = None
    root_length_cm: Optional[float] = None
    water_level_pct: Optional[int] = None
```

with:

```python
    notes: Optional[str] = None
    root_length_cm: Optional[float] = None
    water_level_pct: Optional[int] = None
    # Soil test (action "soil_check"): what the user felt and what they chose.
    soil_outcome: Optional[str] = None
    soil_decision: Optional[str] = None
```

- [ ] **Step 3: Recognize the action**

Replace:

```python
    'clean', 'stake', 'inspect', 'health_check'
}
```

with:

```python
    'clean', 'stake', 'inspect', 'health_check', 'soil_check'
}
```

- [ ] **Step 4: Validate before any log is written**

In `create_care_log`, replace:

```python
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
    # Phase 14A.2: share a group_id across multi-action logs created together so
```

with:

```python
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
    # Validate a soil test up front so a bad request writes no logs at all.
    if soil_check_mod.SOIL_ACTION in actions:
        try:
            soil_check_mod.soil_fields(soil_check_mod.SOIL_ACTION, input.soil_outcome, input.soil_decision)
        except soil_check_mod.SoilCheckError as e:
            raise HTTPException(status_code=400, detail=str(e))
    # Phase 14A.2: share a group_id across multi-action logs created together so
```

- [ ] **Step 5: Store the soil fields on the log**

Replace:

```python
            "water_level_pct": input.water_level_pct if act in ('water', 'change_water', 'flush') else None,
            "logged_at": now.isoformat(), "created_at": now.isoformat(),
            "group_id": group_id,
        }
        await db.care_logs.insert_one(log)
```

with:

```python
            "water_level_pct": input.water_level_pct if act in ('water', 'change_water', 'flush') else None,
            "logged_at": now.isoformat(), "created_at": now.isoformat(),
            "group_id": group_id,
        }
        log.update(soil_check_mod.soil_fields(act, input.soil_outcome, input.soil_decision))
        await db.care_logs.insert_one(log)
```

- [ ] **Step 6: Return the coaching text**

Replace:

```python
        'logs': [serialize_doc({k: v for k, v in l.items() if k != '_id'}) for l in logs_out],
    }
    return primary
```

with:

```python
        'logs': [serialize_doc({k: v for k, v in l.items() if k != '_id'}) for l in logs_out],
    }
    if soil_check_mod.SOIL_ACTION in actions:
        primary['_meta']['soil_coaching'] = soil_check_mod.soil_coaching(input.soil_outcome, input.soil_decision)
    return primary
```

- [ ] **Step 7: Reject soil tests in the bulk endpoint**

In `bulk_care_log`, replace:

```python
async def bulk_care_log(input: BulkCareLogCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
```

with:

```python
async def bulk_care_log(input: BulkCareLogCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
    if soil_check_mod.SOIL_ACTION in actions:
        raise HTTPException(status_code=400, detail="A soil test is logged one plant at a time.")
```

- [ ] **Step 8: Verify the file compiles and the edits are present**

Run: `cd grove-backend && python3 -m py_compile server.py && grep -n "soil_check_mod" server.py`
Expected: no compile error, and at least 7 matching lines (import, validation try, `SoilCheckError`, `log.update`, `_meta`, bulk guard).

- [ ] **Step 9: Manual check against a running backend**

With the backend running locally against a MongoDB, and a seeded testing account from `grove-backend/seed_testing.py`, log in and get a token, then:

```bash
curl -s -X POST "$API/plants/$PLANT_ID/care-logs" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"actions":["soil_check"],"soil_outcome":"damp","soil_decision":"wait"}'
```
Expected: 200, `_meta.soil_coaching` is "Damp soil means your plant is still drinking, so waiting is a good call. Check again in a few days.", and `soil_outcome` is `damp` on the log.

```bash
curl -s -X POST "$API/plants/$PLANT_ID/care-logs" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"actions":["soil_check"]}'
```
Expected: 400 with `{"detail":"A soil test needs an outcome: dry or damp."}` and no new row in `care_logs`.

If a local backend and MongoDB are not available, record that this step was not run.

- [ ] **Step 10: Commit**

```bash
git add grove-backend/server.py
git commit -m "feat: log soil tests as a care action"
```

---

### Task 4: Quiz and lesson endpoints (backend)

**Files:**
- Modify: `grove-backend/server.py` (insert before `@api_router.get("/users/me/stats")`)

**Interfaces:**
- Consumes: `tracks_mod.resolve_primary_track`, `build_lesson_queue`, `completed_lessons`, `lesson_tutorial_id`, `LESSON_IDS`, `SOIL_LESSON`, `DEFAULT_TRACK`, `QUIZ_OPTION_TRACK` (Task 1)
- Produces:
  - `POST /api/users/me/quiz` body `{"answers": [str]}` returns the queue payload.
  - `GET /api/lessons/queue` returns `{"primary_track": str, "queue": [str], "completed": [str], "library": [str], "has_plant": bool}`.
  - `POST /api/lessons/{lesson_id}/complete` returns the same payload. 404 for an unknown lesson, 409 for the soil lesson when the user has no plant.
  - User document fields `quiz_answers: [str]`, `primary_track: str`, `quiz_completed_at: str`.

- [ ] **Step 1: Add the endpoints**

In `grove-backend/server.py`, replace:

```python
@api_router.get("/users/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
```

with:

```python
# ============ LESSONS AND QUIZ ============

class QuizBody(BaseModel):
    answers: List[str] = []


async def _user_has_plant(user_id: str) -> bool:
    count = await db.plants.count_documents({"user_id": user_id, "is_archived": {"$ne": True}})
    return count > 0


async def _lesson_queue_for(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id}) or {}
    track = user.get("primary_track") or tracks_mod.DEFAULT_TRACK
    done = tracks_mod.completed_lessons(user.get("tutorials_seen"))
    return {
        "primary_track": track,
        "queue": tracks_mod.build_lesson_queue(track, done),
        "completed": done,
        "library": list(tracks_mod.LESSON_IDS),
        "has_plant": await _user_has_plant(user_id),
    }


@api_router.post("/users/me/quiz")
async def submit_quiz(body: QuizBody, current_user: dict = Depends(get_current_user)):
    """Save quiz answers and pick the primary lesson track.

    An empty list (the quiz was skipped) falls back to the default track.
    """
    track = tracks_mod.resolve_primary_track(body.answers)
    known = [a for a in body.answers if a in tracks_mod.QUIZ_OPTION_TRACK]
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "quiz_answers": known,
            "primary_track": track,
            "quiz_completed_at": now,
            "updated_at": now,
        }},
    )
    return await _lesson_queue_for(current_user['user_id'])


@api_router.get("/lessons/queue")
async def get_lesson_queue(current_user: dict = Depends(get_current_user)):
    return await _lesson_queue_for(current_user['user_id'])


@api_router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a lesson complete. Safe to call twice."""
    if lesson_id not in tracks_mod.LESSON_IDS:
        raise HTTPException(status_code=404, detail="Lesson not found")
    user_id = current_user['user_id']
    # The soil lesson ends in a real soil test, so it cannot finish without a plant.
    if lesson_id == tracks_mod.SOIL_LESSON and not await _user_has_plant(user_id):
        raise HTTPException(status_code=409, detail="Add a plant before finishing this lesson.")
    await db.users.update_one(
        {"id": user_id},
        {"$addToSet": {"tutorials_seen": tracks_mod.lesson_tutorial_id(lesson_id)},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await check_and_award_badges(user_id)
    return await _lesson_queue_for(user_id)


@api_router.get("/users/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
```

- [ ] **Step 2: Verify the file compiles and routes are registered**

Run: `cd grove-backend && python3 -m py_compile server.py && grep -n "lessons/queue\|lessons/{lesson_id}/complete\|users/me/quiz" server.py`
Expected: no compile error, and three route lines.

- [ ] **Step 3: Manual check against a running backend**

With a token for a seeded testing account:

```bash
curl -s -X POST "$API/users/me/quiz" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"answers":["forget","nonsense"]}'
```
Expected: `primary_track` is `steady_sprout`, `queue` is `["habit-stacking","soil-finger-test"]`.

```bash
curl -s -X POST "$API/users/me/quiz" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"answers":[]}'
curl -s -X POST "$API/lessons/not-a-lesson/complete" -H "Authorization: Bearer $TOKEN"
curl -s -X POST "$API/lessons/plant-er/complete" -H "Authorization: Bearer $TOKEN"
curl -s -X POST "$API/lessons/plant-er/complete" -H "Authorization: Bearer $TOKEN"
```
Expected, in order: `primary_track` is `rebirth`; a 404 `Lesson not found`; `completed` contains `plant-er`; the same response again with `plant-er` listed once. For an account with no plants, `POST /lessons/soil-finger-test/complete` returns 409 `Add a plant before finishing this lesson.`

If a local backend is not available, record that this step was not run.

- [ ] **Step 4: Commit**

```bash
git add grove-backend/server.py
git commit -m "feat: add quiz and lesson endpoints"
```

---

### Task 5: Reword the daily mission (backend)

**Files:**
- Modify: `grove-backend/missions.py` (`MISSION_COPY["water_streak"]`)
- Test: `grove-backend/tests/test_missions_copy.py`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `MISSION_COPY["water_streak"]` with the same keys and the same `xp` (10), `icon`, `cta_path`, but copy that matches the soil lesson. The mission type id stays `water_streak`.

Any care log already completes this mission (see `on_care_log`), so a soil test counts. Only the words are wrong.

- [ ] **Step 1: Write the failing test**

Create `grove-backend/tests/test_missions_copy.py`:

```python
import missions


def test_water_streak_keeps_its_id_xp_and_shape():
    assert "water_streak" in missions.MISSION_TYPES
    copy = missions.MISSION_COPY["water_streak"]
    assert copy["xp"] == 10
    assert copy["icon"] == "droplet"
    assert copy["cta_path"] == "/care"
    assert set(copy) == {"title", "subtitle", "cta", "cta_path", "xp", "icon"}


def test_water_streak_copy_asks_for_a_check_not_for_watering():
    copy = missions.MISSION_COPY["water_streak"]
    assert copy["title"] == "Check one plant"
    assert "water" in copy["subtitle"].lower()
    assert "decide" in copy["subtitle"].lower()
    assert "water one plant" not in copy["title"].lower()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd grove-backend && python3 -m pytest tests/test_missions_copy.py -v`
Expected: FAIL on `copy["title"] == "Check one plant"` (current title is "Water one plant").

- [ ] **Step 3: Change the copy**

In `grove-backend/missions.py`, replace:

```python
    "water_streak": {
        "title": "Water one plant",
        "subtitle": "Even one plant tended today keeps the rhythm going.",
```

with:

```python
    "water_streak": {
        "title": "Check one plant",
        "subtitle": "Press a finger into the soil, then decide whether to water or wait.",
```

Also replace the docstring line:

```python
  - water_streak     → Water at least 1 plant today
```

with:

```python
  - water_streak     → Check at least 1 plant today (any care log completes it)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd grove-backend && python3 -m pytest tests -v`
Expected: PASS (all backend tests from Tasks 1, 2, and 5)

- [ ] **Step 5: Commit**

```bash
git add grove-backend/missions.py grove-backend/tests/test_missions_copy.py
git commit -m "fix: reword the daily plant mission to match the soil lesson"
```

---

### Task 6: Lesson metadata, quiz rule, and API client (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/lessonMeta.js`
- Create: `grove-frontend/src/lessons/quizGate.js`
- Modify: `grove-frontend/src/lib/api.js` (after the `missionAPI` block)
- Test: `grove-frontend/src/lessons/lessonMeta.test.js`, `grove-frontend/src/lessons/quizGate.test.js`

**Interfaces:**
- Produces:
  - `LESSON_META: Record<string, {id, title, blurb}>`, `QUIZ_OPTIONS: {id, label}[]`, `NOTE_CHIPS: string[]`, `lessonPath(id): string`
  - `QUIZ_WINDOW_DAYS: number`, `shouldShowQuiz(user, now?: number): boolean`
  - `lessonAPI.queue()`, `lessonAPI.complete(lessonId)`, `lessonAPI.submitQuiz(answers)`

- [ ] **Step 1: Write the failing tests**

Create `grove-frontend/src/lessons/lessonMeta.test.js`:

```js
import { LESSON_META, QUIZ_OPTIONS, NOTE_CHIPS, lessonPath } from './lessonMeta';

test('lesson ids match the backend list', () => {
  expect(Object.keys(LESSON_META).sort()).toEqual([
    'habit-stacking',
    'plant-er',
    'plant-parent-reset',
    'soil-finger-test',
    'window-blueprint',
  ]);
});

test('every lesson has a matching id, a title, and a blurb', () => {
  Object.entries(LESSON_META).forEach(([key, lesson]) => {
    expect(lesson.id).toBe(key);
    expect(lesson.title.length).toBeGreaterThan(0);
    expect(lesson.blurb.length).toBeGreaterThan(0);
  });
});

test('quiz option ids match the backend list', () => {
  expect(QUIZ_OPTIONS.map((o) => o.id).sort()).toEqual([
    'design_or_no_plant',
    'forget',
    'gifted_no_instructions',
    'overwater',
    'unwell_or_guilt',
  ]);
});

test('quiz labels never show internal track names', () => {
  const internal = ['reset', 'rebirth', 'rescue', 'steady sprout', 'seedling', 'black thumb', 'heartbroken'];
  QUIZ_OPTIONS.forEach((option) => {
    const text = option.label.toLowerCase();
    internal.forEach((name) => expect(text).not.toContain(name));
  });
});

test('note chips are unique and short', () => {
  expect(new Set(NOTE_CHIPS).size).toBe(NOTE_CHIPS.length);
  NOTE_CHIPS.forEach((chip) => expect(chip.length).toBeLessThanOrEqual(24));
});

test('lessonPath builds the lesson route', () => {
  expect(lessonPath('plant-er')).toBe('/lessons/plant-er');
});
```

Create `grove-frontend/src/lessons/quizGate.test.js`:

```js
import { shouldShowQuiz, QUIZ_WINDOW_DAYS } from './quizGate';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-14T12:00:00Z');
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

const newUser = (overrides = {}) => ({
  onboarding_complete: true,
  primary_track: undefined,
  created_at: iso(0),
  ...overrides,
});

test('shows for a new user who finished onboarding and has no track', () => {
  expect(shouldShowQuiz(newUser(), NOW)).toBe(true);
});

test('does not show before onboarding is complete', () => {
  expect(shouldShowQuiz(newUser({ onboarding_complete: false }), NOW)).toBe(false);
});

test('does not show once a track is saved', () => {
  expect(shouldShowQuiz(newUser({ primary_track: 'rebirth' }), NOW)).toBe(false);
});

test('does not interrupt long-time users', () => {
  expect(shouldShowQuiz(newUser({ created_at: iso(QUIZ_WINDOW_DAYS + 1) }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: iso(200) }), NOW)).toBe(false);
});

test('still shows on the last day of the window', () => {
  expect(shouldShowQuiz(newUser({ created_at: iso(QUIZ_WINDOW_DAYS - 0.5) }), NOW)).toBe(true);
});

test('handles missing or bad data without throwing', () => {
  expect(shouldShowQuiz(null, NOW)).toBe(false);
  expect(shouldShowQuiz(undefined, NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: undefined }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: 'not a date' }), NOW)).toBe(false);
  expect(shouldShowQuiz(newUser({ created_at: new Date(NOW + 5 * DAY).toISOString() }), NOW)).toBe(false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons`
Expected: FAIL with `Cannot find module './lessonMeta'` and `Cannot find module './quizGate'`

- [ ] **Step 3: Write `lessonMeta.js`**

Create `grove-frontend/src/lessons/lessonMeta.js`:

```js
// Titles and short blurbs for the lessons. Card text itself stays in the
// lesson pages. Ids must match `LESSON_IDS` in grove-backend/tracks.py.
export const LESSON_META = {
  'soil-finger-test': {
    id: 'soil-finger-test',
    title: 'Soil Finger-Test',
    blurb: 'Check the soil with your finger, then decide.',
  },
  'plant-parent-reset': {
    id: 'plant-parent-reset',
    title: 'Plant Parent Reset',
    blurb: 'Five short lessons to start fresh.',
  },
  'plant-er': {
    id: 'plant-er',
    title: 'Plant ER',
    blurb: 'First steps for a plant you inherited.',
  },
  'habit-stacking': {
    id: 'habit-stacking',
    title: 'Habit Stacking',
    blurb: 'Tie plant care to a habit you already have.',
  },
  'window-blueprint': {
    id: 'window-blueprint',
    title: 'Window Blueprint',
    blurb: 'Match your plants to the light in your window.',
  },
};

// Ids must match `QUIZ_OPTION_TRACK` in grove-backend/tracks.py.
// Labels describe a situation, never an identity or an internal track name.
export const QUIZ_OPTIONS = [
  { id: 'unwell_or_guilt', label: 'A plant of mine looks unwell, or I feel bad about one I lost' },
  { id: 'overwater', label: "I overwater, or I don't trust my instincts" },
  { id: 'gifted_no_instructions', label: 'Someone gave me a plant and I have no instructions' },
  { id: 'forget', label: 'I forget to care for my plants' },
  { id: 'design_or_no_plant', label: 'I want to design with plants, or I have none yet' },
];

// One-tap notes on a soil test. They are saved with the log.
export const NOTE_CHIPS = ['Looked fine', 'Leaves drooping', 'New growth', 'Soil pulling away', 'Saw pests'];

export function lessonPath(id) {
  return `/lessons/${id}`;
}
```

- [ ] **Step 4: Write `quizGate.js`**

Create `grove-frontend/src/lessons/quizGate.js`:

```js
// The quiz shows only to new accounts, so people who joined before it
// shipped are never interrupted.
export const QUIZ_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldShowQuiz(user, now = Date.now()) {
  if (!user) return false;
  if (user.onboarding_complete !== true) return false;
  if (user.primary_track) return false;
  if (!user.created_at) return false;
  const created = new Date(user.created_at).getTime();
  if (Number.isNaN(created)) return false;
  const ageDays = (now - created) / DAY_MS;
  return ageDays >= 0 && ageDays <= QUIZ_WINDOW_DAYS;
}
```

- [ ] **Step 5: Add the API client**

In `grove-frontend/src/lib/api.js`, replace:

```js
// Plants
export const plantAPI = {
```

with:

```js
// Lessons and quiz
export const lessonAPI = {
  queue: () => api.get('/lessons/queue'),
  complete: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
  submitQuiz: (answers) => api.post('/users/me/quiz', { answers }),
};

// Plants
export const plantAPI = {
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons`
Expected: PASS (2 test files, all tests)

- [ ] **Step 7: Commit**

```bash
git add grove-frontend/src/lessons grove-frontend/src/lib/api.js
git commit -m "feat: add lesson metadata, quiz rule, and lesson API client"
```

---

### Task 7: Export the lesson card data and build the registry (frontend)

**Files:**
- Modify: `grove-frontend/src/pages/SoilFingerTestVariation.js:40`, `HabitStackingVariations.js:42`, `PlantERVariations.js:42`, `WindowBlueprintVariations.js:38`, `ResetCourseVariation.js:43`
- Create: `grove-frontend/src/lessons/registry.js`

**Interfaces:**
- Produces: `LESSON_CARDS: Record<lessonId, Card[]>` where each `Card` has `header`, `headline`, `body` (HTML string), `cta` (HTML string), and optionally `icon`, `accent`, `ring`, `n`, `interactive`. Card text is not changed.

Jest cannot import these pages (they use the `@/` alias), so this task is verified by a production build.

- [ ] **Step 1: Export the card data**

Run from `grove-frontend`:

```bash
sed -i '' 's/^const CARDS = \[/export const CARDS = [/' src/pages/SoilFingerTestVariation.js src/pages/HabitStackingVariations.js src/pages/PlantERVariations.js src/pages/WindowBlueprintVariations.js
sed -i '' 's/^const LESSONS = \[/export const LESSONS = [/' src/pages/ResetCourseVariation.js
grep -n "^export const CARDS\|^export const LESSONS" src/pages/*.js
```
Expected: five matching lines, one per file (lines 38, 40, 42, 42, 43). If the executor is on Linux, use `sed -i` without the empty string argument.

- [ ] **Step 2: Create the registry**

Create `grove-frontend/src/lessons/registry.js`:

```js
import { CARDS as SOIL_CARDS } from '../pages/SoilFingerTestVariation';
import { CARDS as HABIT_CARDS } from '../pages/HabitStackingVariations';
import { CARDS as ER_CARDS } from '../pages/PlantERVariations';
import { CARDS as WINDOW_CARDS } from '../pages/WindowBlueprintVariations';
import { LESSONS as RESET_CARDS } from '../pages/ResetCourseVariation';

// Lesson id to card list. The text lives in the lesson pages and is used as written.
export const LESSON_CARDS = {
  'soil-finger-test': SOIL_CARDS,
  'plant-parent-reset': RESET_CARDS,
  'plant-er': ER_CARDS,
  'habit-stacking': HABIT_CARDS,
  'window-blueprint': WINDOW_CARDS,
};
```

- [ ] **Step 3: Verify the build**

Run: `cd grove-frontend && CI=true npm run build`
Expected: build completes with no "export 'CARDS' was not found" errors.

- [ ] **Step 4: Commit**

```bash
git add grove-frontend/src/pages grove-frontend/src/lessons/registry.js
git commit -m "feat: expose lesson card data through a registry"
```

---

### Task 8: Lesson player (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/LessonPlayer.jsx`
- Create: `grove-frontend/src/lessons/LessonPlayer.stories.jsx`

**Interfaces:**
- Consumes: card shape from Task 7.
- Produces: `<LessonPlayer cards={Card[]} renderFinalCard={(card) => ReactNode} onExit={() => void} />`. Steps through the cards with Back and Next. On the last card it renders `renderFinalCard(card)` in place of the Next button, if provided.

- [ ] **Step 1: Write the component**

Create `grove-frontend/src/lessons/LessonPlayer.jsx`:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Steps through a lesson's cards. The last card hands over to
// `renderFinalCard`, which holds the lesson's "your turn" action. Card text
// comes from Grove's own lesson files and may contain simple HTML.
export default function LessonPlayer({ cards, renderFinalCard, onExit }) {
  const [index, setIndex] = useState(0);
  const headingRef = useRef(null);
  const card = cards[index];
  const isLast = index === cards.length - 1;
  const Icon = card.icon;

  // Move focus to the new card's headline so keyboard and screen reader users land on it.
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, [index]);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4 py-8" data-testid="lesson-player">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-ui text-[#2B2B26] underline underline-offset-2"
            data-testid="lesson-exit"
          >
            Back to lessons
          </button>
          <p className="text-xs font-ui text-[#2B2B26]" data-testid="lesson-progress">
            Card {index + 1} of {cards.length}
          </p>
        </div>

        <div className={`rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-gradient-to-br ${card.accent || ''} bg-[#FDFAF6] p-6`}>
          {Icon && <Icon className={`h-8 w-8 mb-4 ${card.ring || 'text-[#3B6D11]'}`} strokeWidth={1.75} aria-hidden="true" />}
          <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26] mb-2">{card.header}</p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-plant text-[#1C2E10] text-2xl mb-3 focus:outline-none"
            data-testid="lesson-headline"
            dangerouslySetInnerHTML={{ __html: card.headline }}
          />
          <p className="text-sm leading-relaxed text-[#1A1A17]" dangerouslySetInnerHTML={{ __html: card.body }} />
        </div>

        <div className="mt-4">
          {isLast && renderFinalCard ? (
            renderFinalCard(card)
          ) : (
            <div className="flex gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="flex items-center justify-center gap-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] hover:border-[#2D5016]"
                  data-testid="lesson-back"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
                </button>
              )}
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(i + 1, cards.length - 1))}
                className="flex-1 flex items-center justify-center gap-2 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
                data-testid="lesson-next"
              >
                <span dangerouslySetInnerHTML={{ __html: card.cta || 'Next' }} />
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the stories**

Create `grove-frontend/src/lessons/LessonPlayer.stories.jsx`:

```jsx
import React from 'react';
import { Heart, Hand, Timer } from 'lucide-react';
import LessonPlayer from './LessonPlayer';

// Sample cards only. Real card text lives in the lesson pages.
const SAMPLE_CARDS = [
  {
    n: 1,
    header: 'Card 1 of 3 · The Hook',
    headline: 'Erase the plant guilt.',
    body: 'Most plants don’t die from a lack of love — they die from <strong>drowning</strong>.',
    cta: 'I’m ready',
    icon: Heart,
    accent: 'from-rose-100 via-amber-50 to-emerald-50',
    ring: 'text-rose-600',
  },
  {
    n: 2,
    header: 'Card 2 of 3 · The Probe',
    headline: 'Your natural moisture sensor.',
    body: 'Push your index finger <strong>2 inches deep</strong> into the soil.',
    cta: 'Got it &mdash; finger as probe',
    icon: Hand,
    accent: 'from-amber-100 via-orange-50 to-emerald-50',
    ring: 'text-amber-700',
  },
  {
    n: 3,
    header: 'Card 3 of 3 · Your Turn',
    headline: '60 seconds. One plant. Real answer.',
    body: 'Go to your nearest plant right now.',
    cta: 'Log my first soil test',
    icon: Timer,
    accent: 'from-lime-100 via-emerald-50 to-emerald-100',
    ring: 'text-emerald-700',
    interactive: true,
  },
];

export default {
  title: 'Grove/LessonPlayer',
  component: LessonPlayer,
  parameters: {
    docs: {
      description: {
        component:
          'Steps through a lesson one card at a time. The last card shows whatever the lesson needs for its "your turn" step.',
      },
    },
  },
};

export const Steps = {
  args: { cards: SAMPLE_CARDS, onExit: () => {} },
};

export const WithFinalCard = {
  args: {
    cards: SAMPLE_CARDS,
    onExit: () => {},
    renderFinalCard: () => (
      <button type="button" className="w-full rounded-[2px] bg-[#1C2E10] text-[#F5F0E8] px-4 py-3 text-xs">
        Your turn goes here
      </button>
    ),
  },
};
```

- [ ] **Step 3: Verify in Storybook**

Run: `cd grove-frontend && npm run storybook`
Open `Grove/LessonPlayer / Steps`. Expected: card 1 shows with a heart icon, "Card 1 of 3", and a "Next" button labelled "I'm ready". Clicking through reaches card 3. Open `WithFinalCard`, step to card 3, and expect the Next button to be replaced by "Your turn goes here". Pressing Back from card 2 returns to card 1. With the keyboard, Tab to the button, press Enter, and expect focus to land on the next headline.

- [ ] **Step 4: Commit**

```bash
git add grove-frontend/src/lessons/LessonPlayer.jsx grove-frontend/src/lessons/LessonPlayer.stories.jsx
git commit -m "feat: add lesson player"
```

---

### Task 9: Soil test step, lesson pages, and routes (frontend)

**Files:**
- Create: `grove-frontend/src/lessons/SoilTestStep.jsx`
- Create: `grove-frontend/src/lessons/MarkDoneStep.jsx`
- Create: `grove-frontend/src/pages/LessonPage.jsx`
- Create: `grove-frontend/src/pages/LessonsPage.jsx`
- Modify: `grove-frontend/src/App.js` (imports near line 25; routes before `<Route path="/help"`)

**Interfaces:**
- Consumes: `LessonPlayer` (Task 8), `LESSON_CARDS` (Task 7), `LESSON_META`, `NOTE_CHIPS`, `lessonPath` (Task 6), `lessonAPI`, `plantAPI`, `careAPI` (api.js).
- Produces: routes `/lessons` and `/lessons/:lessonId`.
  - `<SoilTestStep hasPlant={boolean} onLogged={(meta) => void} />`
  - `<MarkDoneStep onDone={() => void} onNotYet={() => void} />`

- [ ] **Step 1: Confirm the plant name field**

Run: `cd grove-frontend && grep -n "plant\.name\|plant\.nickname\|plant\.common_name" src/pages/CarePage.js | head -5`
Expected: shows which field Care Today uses for a plant's display name. Use that field first in `plantLabel` below (the code tries `name`, then `nickname`, then `common_name`).

- [ ] **Step 2: Write the soil test step**

Create `grove-frontend/src/lessons/SoilTestStep.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantAPI, careAPI } from '../lib/api';
import { NOTE_CHIPS } from './lessonMeta';

const OUTCOMES = [
  { value: 'dry', label: 'Dry and dusty' },
  { value: 'damp', label: 'Damp and cool' },
];
const DECISIONS = [
  { value: 'water', label: 'Water it' },
  { value: 'wait', label: 'Wait' },
];

const plantLabel = (p) => p.name || p.nickname || p.common_name || 'Unnamed plant';

const choiceClass = (on) =>
  `flex-1 rounded-[8px] border-[0.5px] px-3 py-3 text-sm font-ui text-[#1A1A17] ${
    on ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20' : 'border-[#D3C9B8] bg-[#F5F0E8] hover:border-[#2D5016]'
  }`;

// The Soil Finger-Test's last card. With a plant it logs a real soil test.
// Without one it says to save the lesson for the first plant, logs nothing,
// and does not mark the lesson complete.
export default function SoilTestStep({ hasPlant, onLogged }) {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [decision, setDecision] = useState('');
  const [chips, setChips] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!hasPlant) return undefined;
    let alive = true;
    plantAPI
      .getAll()
      .then((res) => {
        if (!alive) return;
        const list = res.data?.plants || [];
        setPlants(list);
        if (list.length > 0) setPlantId(list[0].id);
      })
      .catch(() => {
        if (alive) setError('Could not load your plants. Try again.');
      });
    return () => {
      alive = false;
    };
  }, [hasPlant]);

  if (!hasPlant) {
    return (
      <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="soil-step-no-plant">
        <p className="font-plant text-[#1C2E10] text-lg mb-1">Save this for your first plant</p>
        <p className="text-sm text-[#1A1A17] mb-3">
          When you add a plant, this lesson will be waiting. You&apos;ll press a finger into its soil and log what you find.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/lessons')}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10]"
          >
            Back to lessons
          </button>
          <button
            type="button"
            onClick={() => navigate('/add-plant')}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
            data-testid="soil-step-add-plant"
          >
            Add a plant
          </button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4" data-testid="soil-step-saved">
        <p className="font-plant text-[#1C2E10] text-lg mb-1">Soil test logged</p>
        {saved.soil_coaching && <p className="text-sm text-[#1A1A17] mb-3">{saved.soil_coaching}</p>}
        <button
          type="button"
          onClick={() => onLogged(saved)}
          className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
          data-testid="soil-step-continue"
        >
          Finish lesson
        </button>
      </div>
    );
  }

  const toggleChip = (chip) =>
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));

  const submit = async () => {
    if (!plantId) {
      setError('Pick the plant you tested.');
      return;
    }
    if (!outcome) {
      setError('Choose what you felt: dry or damp.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await careAPI.createLog(plantId, {
        actions: ['soil_check'],
        soil_outcome: outcome,
        soil_decision: decision || null,
        notes: chips.join(', '),
      });
      setSaved(res.data?._meta || {});
    } catch (_e) {
      setError('Could not save your soil test. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4 space-y-3" data-testid="soil-step">
      {plants.length > 1 && (
        <label className="block text-xs font-ui text-[#2B2B26]">
          Which plant?
          <select
            value={plantId}
            onChange={(e) => setPlantId(e.target.value)}
            className="mt-1 w-full rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-3 py-2 text-sm"
            data-testid="soil-step-plant"
          >
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {plantLabel(p)}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset>
        <legend className="text-xs font-ui text-[#2B2B26] mb-2">What did you feel, two inches down?</legend>
        <div className="flex gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={outcome === o.value}
              onClick={() => setOutcome(o.value)}
              className={choiceClass(outcome === o.value)}
              data-testid={`soil-outcome-${o.value}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-ui text-[#2B2B26] mb-2">What will you do? (optional)</legend>
        <div className="flex gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={decision === d.value}
              onClick={() => setDecision(decision === d.value ? '' : d.value)}
              className={choiceClass(decision === d.value)}
              data-testid={`soil-decision-${d.value}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-ui text-[#2B2B26] mb-2">What did you notice? (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {NOTE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={chips.includes(chip)}
              onClick={() => toggleChip(chip)}
              className={`rounded-[20px] border-[0.5px] px-3 py-1 text-xs font-ui ${
                chips.includes(chip) ? 'border-[#1C2E10] bg-[#EAF3DE]' : 'border-[#D3C9B8] bg-[#F5F0E8]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs font-ui text-red-700" data-testid="soil-step-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        aria-busy={saving}
        className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
        data-testid="soil-step-submit"
      >
        {saving ? 'Saving…' : 'Log my soil test'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write the mark-done step**

Create `grove-frontend/src/lessons/MarkDoneStep.jsx`:

```jsx
import React from 'react';

// The last card for lessons whose "your turn" step happens outside this
// screen. It records that the user tried the step.
export default function MarkDoneStep({ onDone, onNotYet }) {
  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="mark-done-step">
      <p className="text-sm text-[#1A1A17] mb-3">Try the step when you&apos;re ready. Mark the lesson done once you have.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNotYet}
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10]"
          data-testid="mark-done-not-yet"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
          data-testid="mark-done-done"
        >
          Mark lesson done
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the lesson page**

Create `grove-frontend/src/pages/LessonPage.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonAPI } from '../lib/api';
import { LESSON_CARDS } from '../lessons/registry';
import { LESSON_META } from '../lessons/lessonMeta';
import LessonPlayer from '../lessons/LessonPlayer';
import SoilTestStep from '../lessons/SoilTestStep';
import MarkDoneStep from '../lessons/MarkDoneStep';
import FirstCareCelebration from '../components/FirstCareCelebration';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const cards = LESSON_CARDS[lessonId];
  const [hasPlant, setHasPlant] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setHasPlant(!!res.data?.has_plant);
      })
      .catch(() => {
        if (alive) setHasPlant(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!cards || !LESSON_META[lessonId]) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-plant text-[#1C2E10] text-xl mb-2">That lesson isn&apos;t here</p>
          <button type="button" onClick={() => navigate('/lessons')} className="text-sm underline text-[#2D5016]">
            Back to lessons
          </button>
        </div>
      </div>
    );
  }

  const finish = async () => {
    setError('');
    try {
      await lessonAPI.complete(lessonId);
      navigate('/lessons');
    } catch (_e) {
      setError('Could not save your progress. Try again.');
    }
  };

  const onSoilLogged = (meta) => {
    if (meta?.first_care_pending) setCelebrate(true);
    else finish();
  };

  const renderFinalCard = () => (
    <>
      {lessonId === 'soil-finger-test' ? (
        <SoilTestStep hasPlant={hasPlant} onLogged={onSoilLogged} />
      ) : (
        <MarkDoneStep onDone={finish} onNotYet={() => navigate('/lessons')} />
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-ui text-red-700" data-testid="lesson-error">
          {error}
        </p>
      )}
    </>
  );

  return (
    <>
      <LessonPlayer cards={cards} renderFinalCard={renderFinalCard} onExit={() => navigate('/lessons')} />
      <FirstCareCelebration
        open={celebrate}
        onClose={() => {
          setCelebrate(false);
          finish();
        }}
      />
    </>
  );
}
```

- [ ] **Step 5: Write the lessons list page**

Create `grove-frontend/src/pages/LessonsPage.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

export default function LessonsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setData(res.data);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const completed = new Set(data?.completed || []);
  const next = data?.queue?.[0];
  const then = data?.queue?.[1];

  return (
    <div>
      <PageHeader title="Lessons" />
      <div className="max-w-[640px] mx-auto px-4 py-4 space-y-4">
        {failed && (
          <p role="alert" className="text-sm font-ui text-red-700">
            Could not load your lessons. Try again in a moment.
          </p>
        )}

        {next && (
          <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4" data-testid="lessons-up-next">
            <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Up next</p>
            <p className="font-plant text-[#1C2E10] text-xl">{LESSON_META[next].title}</p>
            <p className="text-sm text-[#1A1A17] mb-3">{LESSON_META[next].blurb}</p>
            <button
              type="button"
              onClick={() => navigate(lessonPath(next))}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
              data-testid="lessons-start"
            >
              Start lesson
            </button>
          </section>
        )}

        {then && (
          <p className="text-sm font-ui text-[#2B2B26]" data-testid="lessons-then">
            After that: {LESSON_META[then].title}
          </p>
        )}

        {data && !next && (
          <p className="text-sm font-ui text-[#1C2E10]" data-testid="lessons-all-done">
            You&apos;ve finished your first lessons. The rest are below whenever you want them.
          </p>
        )}

        <section>
          <h2 className="font-plant text-[#1C2E10] text-lg mb-2">All lessons</h2>
          <ul className="space-y-2">
            {(data?.library || Object.keys(LESSON_META)).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => navigate(lessonPath(id))}
                  className="w-full flex items-center justify-between gap-3 rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3 py-3 text-left hover:border-[#2D5016]"
                  data-testid={`lesson-row-${id}`}
                >
                  <span>
                    <span className="block text-sm font-ui text-[#1C2E10]">{LESSON_META[id].title}</span>
                    <span className="block text-xs font-ui text-[#2B2B26]">{LESSON_META[id].blurb}</span>
                  </span>
                  {completed.has(id) && (
                    <span className="flex items-center gap-1 text-xs font-ui text-[#3B6D11]">
                      <Check className="h-4 w-4" aria-hidden="true" /> Done
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Register the pages and routes**

In `grove-frontend/src/App.js`, replace:

```jsx
import HelpPage from "./pages/HelpPage";
```

with:

```jsx
import HelpPage from "./pages/HelpPage";
import LessonsPage from "./pages/LessonsPage";
import LessonPage from "./pages/LessonPage";
```

Then replace:

```jsx
        <Route path="/help" element={
```

with:

```jsx
        <Route path="/lessons" element={
          <ProtectedRoute>
            <AppLayout><LessonsPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
```

- [ ] **Step 7: Verify the build**

Run: `cd grove-frontend && CI=true npm run build`
Expected: build completes with no errors.

- [ ] **Step 8: Verify the flow in the running app**

Run the backend and frontend, sign in as a seeded testing account that has at least one plant, and open `/lessons`. Expected:
- "Up next" shows a lesson, and "All lessons" lists all five.
- Open `/lessons/soil-finger-test`, step to card 5, and the soil test form appears. Tapping "Log my soil test" with nothing chosen shows "Choose what you felt: dry or damp." and sends nothing.
- Choose "Damp and cool" and "Wait", submit, and see "Soil test logged" with the coaching sentence. "Finish lesson" returns to `/lessons`, and Soil Finger-Test shows "Done".
- For an account with no plants, the same card shows "Save this for your first plant," and `/lessons` still lists the lesson as not done.
- Open `/lessons/plant-er`, step to card 5, and "Mark lesson done" completes it.

If a running backend is not available, record that this step was not run, and verify the visible states with Storybook (Task 8) instead.

- [ ] **Step 9: Commit**

```bash
git add grove-frontend/src/lessons grove-frontend/src/pages/LessonPage.jsx grove-frontend/src/pages/LessonsPage.jsx grove-frontend/src/App.js
git commit -m "feat: add lesson pages with a real soil test step"
```

---

### Task 10: Quiz overlay (frontend)

**Files:**
- Create: `grove-frontend/src/components/QuizFlow.jsx`
- Create: `grove-frontend/src/components/QuizFlow.stories.jsx`
- Modify: `grove-frontend/src/App.js` (router import line 4; `AppRoutes` at line 93; the `Onboarding` render line)

**Interfaces:**
- Consumes: `QUIZ_OPTIONS`, `lessonPath` (Task 6), `shouldShowQuiz` (Task 6), `lessonAPI.submitQuiz` (Task 6).
- Produces: `<QuizFlow onDone={(payload) => void} />` where `payload` is the queue response (`{primary_track, queue, ...}`).

- [ ] **Step 1: Write the component**

Create `grove-frontend/src/components/QuizFlow.jsx`:

```jsx
import React, { useState } from 'react';
import { lessonAPI } from '../lib/api';
import { QUIZ_OPTIONS } from '../lessons/lessonMeta';

// One screen, multi-select. It only picks the first lesson, and says so.
export default function QuizFlow({ onDone }) {
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const submit = async (answers) => {
    setSaving(true);
    setError('');
    try {
      const res = await lessonAPI.submitQuiz(answers);
      onDone(res.data);
    } catch (_e) {
      setError('Could not save that. Try again.');
      setSaving(false);
    }
  };

  const start = () => {
    if (picked.length === 0) {
      setError('Pick at least one, or skip for now.');
      return;
    }
    submit(picked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F0E8] px-4" data-testid="quiz-flow">
      <div className="w-full max-w-md">
        <h1 className="font-plant text-[#1C2E10] text-3xl mb-2">What&apos;s going on with your plants?</h1>
        <p className="text-sm text-[#2B2B26] mb-4">
          Pick everything that fits. This only chooses your first lesson, and you can change it any time.
        </p>

        <div className="space-y-2" role="group" aria-label="Your plant situation">
          {QUIZ_OPTIONS.map((option) => {
            const on = picked.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(option.id)}
                className={`w-full text-left rounded-[8px] border-[0.5px] px-4 py-3 text-sm font-ui text-[#1A1A17] ${
                  on ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20' : 'border-[#D3C9B8] bg-[#FDFAF6] hover:border-[#2D5016]'
                }`}
                data-testid={`quiz-option-${option.id}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-ui text-red-700" data-testid="quiz-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={start}
          aria-busy={saving}
          className="mt-4 w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
          data-testid="quiz-start"
        >
          {saving ? 'Saving…' : 'Start my first lesson'}
        </button>
        <button
          type="button"
          onClick={() => submit([])}
          className="mt-3 w-full text-center text-xs font-ui text-[#2B2B26] underline underline-offset-2"
          data-testid="quiz-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the story**

Create `grove-frontend/src/components/QuizFlow.stories.jsx`:

```jsx
import QuizFlow from './QuizFlow';

export default {
  title: 'Grove/QuizFlow',
  component: QuizFlow,
  parameters: {
    docs: {
      description: {
        component:
          'A one-screen, multi-select quiz that chooses the first lesson. Saving needs the backend, so in Storybook the buttons show the error state.',
      },
    },
  },
};

export const Default = { args: { onDone: () => {} } };
```

- [ ] **Step 3: Wire the quiz into the app**

In `grove-frontend/src/App.js`, replace:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
```

with:

```jsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
```

Replace:

```jsx
import LessonPage from "./pages/LessonPage";
```

with:

```jsx
import LessonPage from "./pages/LessonPage";
import QuizFlow from "./components/QuizFlow";
import { shouldShowQuiz } from "./lessons/quizGate";
import { lessonPath } from "./lessons/lessonMeta";
```

Replace:

```jsx
  const { user, loading } = useAuth();

  const [showOnboarding, setShowOnboarding] = useState(false);
```

with:

```jsx
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
```

If that exact text is not found, open `AppRoutes` (near line 93) and make the same three changes by hand: destructure `updateUser`, call `useNavigate()`, and add the `quizDone` state, all before the `if (loading)` early return.

Replace:

```jsx
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
```

with:

```jsx
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Onboarding saved this on the server; mirror it so the quiz can follow right away.
    updateUser({ onboarding_complete: true });
  };

  const showQuiz = !showOnboarding && !quizDone && shouldShowQuiz(user);

  const handleQuizDone = (data) => {
    updateUser({ primary_track: data.primary_track });
    setQuizDone(true);
    const first = data.queue && data.queue[0];
    if (first) navigate(lessonPath(first));
  };
```

Replace:

```jsx
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
```

with:

```jsx
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showQuiz && <QuizFlow onDone={handleQuizDone} />}
```

- [ ] **Step 4: Verify the build and tests**

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false src/lessons && CI=true npm run build`
Expected: tests pass and the build completes.

- [ ] **Step 5: Verify in the running app**

Register a brand new account, finish onboarding, and expect the quiz overlay to appear right away. Expected:
- "Start my first lesson" with nothing picked shows "Pick at least one, or skip for now." and does not call the server.
- Picking "I forget to care for my plants" and starting opens `/lessons/habit-stacking`.
- Reload the page, and the quiz does not return.
- Sign in as an old seeded account whose `created_at` is older than 14 days: no quiz appears.
- In a new account, pressing "Skip for now" opens `/lessons/soil-finger-test`.

If a running backend is not available, record that this step was not run, and check the quiz states in Storybook.

- [ ] **Step 6: Commit**

```bash
git add grove-frontend/src/components/QuizFlow.jsx grove-frontend/src/components/QuizFlow.stories.jsx grove-frontend/src/App.js
git commit -m "feat: add the first-lesson quiz after onboarding"
```

---

### Task 11: Soil test in the care log, and the next lesson on Care Today (frontend)

**Files:**
- Modify: `grove-frontend/src/components/CareLogModal.js`
- Create: `grove-frontend/src/components/NextLessonCard.jsx`
- Modify: `grove-frontend/src/pages/CarePage.js` (import near line 8; card near line 189)

**Interfaces:**
- Consumes: `lessonAPI.queue`, `LESSON_META`, `lessonPath` (Task 6). `useAuth` from `contexts/AuthContext` for `user.primary_track`.
- Produces: a "Soil test" tile in the care log that sends `soil_outcome` and `soil_decision`; a `<NextLessonCard />` on Care Today.

- [ ] **Step 1: Add the soil test tile to the care log**

In `grove-frontend/src/components/CareLogModal.js`:

Replace:

```jsx
import { Droplets, Wind, Utensils, Scissors, FlowerIcon, SproutIcon, Camera, FileText, RotateCw, ClipboardCheck } from 'lucide-react';
```

with:

```jsx
import { Droplets, Wind, Utensils, Scissors, FlowerIcon, SproutIcon, Camera, FileText, RotateCw, ClipboardCheck, Hand } from 'lucide-react';
```

Replace:

```jsx
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
```

with:

```jsx
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
  { value: 'soil_check', label: 'Soil test', icon: Hand, color: '#BA7517' },
```

Replace:

```jsx
  const [logging, setLogging] = useState(false);
```

with:

```jsx
  const [logging, setLogging] = useState(false);
  const [soilOutcome, setSoilOutcome] = useState('');
  const [soilDecision, setSoilDecision] = useState('');
  const [soilError, setSoilError] = useState('');
```

Replace:

```jsx
  const handleReset = () => {
    setSelected(new Set());
    setNotes('');
  };
```

with:

```jsx
  const handleReset = () => {
    setSelected(new Set());
    setNotes('');
    setSoilOutcome('');
    setSoilDecision('');
    setSoilError('');
  };
```

Replace:

```jsx
    if (count === 0) return;
    setLogging(true);
    try {
      const res = await careAPI.createLog(plantId, { actions: selectedArr, notes });
      const meta = res.data?._meta;
```

with:

```jsx
    if (count === 0) return;
    const hasSoilTest = selected.has('soil_check');
    if (hasSoilTest && !soilOutcome) {
      setSoilError('Choose what you felt: dry or damp.');
      return;
    }
    setSoilError('');
    setLogging(true);
    try {
      const res = await careAPI.createLog(plantId, {
        actions: selectedArr,
        notes,
        ...(hasSoilTest ? { soil_outcome: soilOutcome, soil_decision: soilDecision || null } : {}),
      });
      const meta = res.data?._meta;
      if (meta?.soil_coaching) toast.message(meta.soil_coaching);
```

Replace:

```jsx
        {count > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 mb-2
```

with:

```jsx
        {selected.has('soil_check') && (
          <div className="mb-3 p-3 bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px]" data-testid="care-soil-fields">
            <p className="text-[11px] font-ui text-[#1C2E10] mb-2">Press a finger 2 inches into the soil. What did you feel?</p>
            <div className="flex gap-2 mb-2">
              {[['dry', 'Dry and dusty'], ['damp', 'Damp and cool']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilOutcome === value}
                  onClick={() => setSoilOutcome(value)}
                  className={`flex-1 rounded-[8px] border-[0.5px] px-2 py-2 text-[11px] font-ui text-[#1A1A17] ${
                    soilOutcome === value ? 'border-[#1C2E10] bg-[#EAF3DE]' : 'border-[#D3C9B8] bg-[#FDFAF6]'
                  }`}
                  data-testid={`care-soil-outcome-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-ui text-[#1C2E10] mb-2">What will you do? (optional)</p>
            <div className="flex gap-2">
              {[['water', 'Water it'], ['wait', 'Wait']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilDecision === value}
                  onClick={() => setSoilDecision(soilDecision === value ? '' : value)}
                  className={`flex-1 rounded-[8px] border-[0.5px] px-2 py-2 text-[11px] font-ui text-[#1A1A17] ${
                    soilDecision === value ? 'border-[#1C2E10] bg-[#EAF3DE]' : 'border-[#D3C9B8] bg-[#FDFAF6]'
                  }`}
                  data-testid={`care-soil-decision-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {soilError && (
              <p role="alert" className="mt-2 text-[11px] font-ui text-red-700" data-testid="care-soil-error">
                {soilError}
              </p>
            )}
          </div>
        )}

        {count > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 mb-2
```

- [ ] **Step 2: Write the next lesson card**

Create `grove-frontend/src/components/NextLessonCard.jsx`:

```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

// Shows the next unfinished lesson on Care Today. Only for people who took
// (or skipped) the quiz, so long-time users see nothing new.
export default function NextLessonCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessonId, setLessonId] = useState(null);

  useEffect(() => {
    if (!user?.primary_track) return undefined;
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setLessonId(res.data?.queue?.[0] || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.primary_track]);

  if (!user?.primary_track || !lessonId || !LESSON_META[lessonId]) return null;
  const lesson = LESSON_META[lessonId];

  return (
    <section
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4 flex items-center justify-between gap-3"
      data-testid="next-lesson-card"
    >
      <div>
        <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Your next lesson</p>
        <p className="font-plant text-[#1C2E10] text-lg">{lesson.title}</p>
        <p className="text-xs font-ui text-[#2B2B26]">{lesson.blurb}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate(lessonPath(lessonId))}
        className="shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
        data-testid="next-lesson-start"
      >
        Start
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Place the card on Care Today**

In `grove-frontend/src/pages/CarePage.js`, replace:

```jsx
import DailyMissionCard from '../components/DailyMissionCard';
```

with:

```jsx
import DailyMissionCard from '../components/DailyMissionCard';
import NextLessonCard from '../components/NextLessonCard';
```

Replace:

```jsx
        <DailyMissionCard />
```

with:

```jsx
        <NextLessonCard />
        <DailyMissionCard />
```

- [ ] **Step 4: Verify the build**

Run: `cd grove-frontend && CI=true npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Verify in the running app**

Sign in as a seeded account with a plant, open a plant, and open the care log. Expected:
- A "Soil test" tile appears. Selecting it shows "Press a finger 2 inches into the soil. What did you feel?" with two choices and an optional decision.
- Pressing "Log Care" with the soil test selected and no outcome shows "Choose what you felt: dry or damp." and sends nothing.
- Choosing "Dry and dusty" and logging shows the success toast and a second toast with the coaching sentence.
- Logging "Soil test" together with "Water" in one sweep succeeds.
- On Care Today, a user with a saved track sees "Your next lesson"; a long-time user with no track sees no card.
- The daily mission card now reads "Check one plant", and logging a soil test completes it.

If a running backend is not available, record that this step was not run.

- [ ] **Step 6: Commit**

```bash
git add grove-frontend/src/components/CareLogModal.js grove-frontend/src/components/NextLessonCard.jsx grove-frontend/src/pages/CarePage.js
git commit -m "feat: add soil test to the care log and next lesson to Care Today"
```

---

### Task 12: Final verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-10-13-pip-room-design.md` (status line only)

- [ ] **Step 1: Run every automated check**

Run: `cd grove-backend && python3 -m pytest tests -v`
Expected: PASS (tracks, soil_check, and missions copy tests).

Run: `cd grove-frontend && CI=true npm test -- --watchAll=false`
Expected: PASS (`lessonMeta` and `quizGate` tests).

Run: `cd grove-frontend && CI=true npm run build`
Expected: build completes.

- [ ] **Step 2: Run the end-to-end walkthrough**

On a running backend, with a brand new account and no plants, check each line:
- Onboarding, then the quiz. Pick "Someone gave me a plant and I have no instructions." Expected: `/lessons/plant-er` opens.
- Finish Plant ER with "Mark lesson done." Expected: `/lessons` shows Plant ER as Done and "Up next" shows Soil Finger-Test.
- Open Soil Finger-Test and reach card 5 with no plant. Expected: "Save this for your first plant," and the lesson is still not done.
- Add a plant, return to Soil Finger-Test, log a soil test, and finish. Expected: the first-care celebration plays once, the lesson shows Done, and Care Today no longer shows a next lesson.
- Open the care log and confirm the soil test tile and the reworded mission.

Record any step that was not run, and why.

- [ ] **Step 3: Record the status in the spec**

In `docs/superpowers/specs/2026-10-13-pip-room-design.md`, replace:

```markdown
Status: Approved by the founder for planning on 2026-10-14. Open questions in
section 12 remain and are carried into the plan.
```

with:

```markdown
Status: Approved by the founder for planning on 2026-10-14. Open questions in
section 12 remain and are carried into the plans. Plan 1 (lessons, quiz, soil
test) is `docs/superpowers/plans/2026-10-14-lessons-quiz-soil-test.md`. The
nook is Plan 2.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-10-13-pip-room-design.md
git commit -m "docs: link Plan 1 from the spec"
```

---

## Self-review

**Spec coverage (this plan's scope).**
- Quiz, multi-select, one primary track, default on empty: Task 1, Task 4, Task 10.
- Lesson order, Soil Finger-Test second for every track, Rebirth exception: Task 1.
- Lesson completion stored as `lesson:<id>` in `tutorials_seen[]`: Tasks 1 and 4.
- Soil test as a care action with outcome and decision, flat reward, coaching, optional note chips: Tasks 2, 3, 9, 11. (Growth numbers belong to Plan 2. Note chips are saved in `notes`.)
- No-plant user sees "Save this for your first plant", lesson offered again after adding a plant: Tasks 4, 9.
- Mission copy reword: Task 5.
- Quiz only for new accounts: Task 6, Task 10.
- Existing streak updated by soil tests: no change needed, because `update_streak` runs for every care log.
- Lessons as onboarding with a first real action: Tasks 9, 10.

**Not in this plan, on purpose.**
- The "your turn" actions behind Habit Stacking (habit reminder), Plant ER (triage guide), and Window Blueprint (lighting zone) were not verified to exist. v1 records "mark done" only (spec section 4).
- Quick Wins has no lesson content for two of its five steps, so it is not included (spec section 4).
- Opt-in, Pip, the nook, rewards and growth numbers, levels, the weekly rhythm, Pip's note, the thumbnail, the readiness plant, quiet mode, and the catalog: Plan 2.
- The weekly nudge, the confidence pulse, harm signals, and the widget: Plan 3.
- Asking for a soil check before the bulk water round, and the existing `push_streak_at_risk` preference: owner decisions in the spec's open questions, not engineering tasks.

**Placeholder scan.** No TBD or "similar to" steps. Edits that depend on exact existing text give the old text and a fallback. The three manual steps (Task 3 Step 9, Task 4 Step 3, and the running-app steps) say what to do when a local backend is not available.

**Type consistency.** Lesson ids and quiz ids are listed once in Global Constraints and tested in both `test_tracks.py` and `lessonMeta.test.js`. `lessonAPI.queue()` returns the same payload the backend `_lesson_queue_for` builds (`primary_track`, `queue`, `completed`, `library`, `has_plant`), and `LessonPage`, `LessonsPage`, and `NextLessonCard` read only those keys. `_meta.soil_coaching` is produced in Task 3 and read in Tasks 9 and 11. `first_care_pending` is the existing flag.

**Known gaps.**
- There is no automated endpoint test harness in this repository. Tasks 3 and 4 add pure-module tests and manual checks.
- Jest cannot resolve the `@/` alias, so component and page code is verified by a production build, Storybook, and the walkthrough.
- The plant name field in `SoilTestStep` is confirmed in Task 9 Step 1.

## Plans that follow

**Plan 2: Pip's nook** (`docs/superpowers/plans/` once written) covers the opt-in, Pip, the nook layer and endpoint, the canvas renderer, the readiness plant, quiet mode, Pip's note with the thumbnail, and nook levels as badges. It is written after Plan 1 ships, because the spec requires the growth thresholds to be simulated against real activity logs, and `soil_check` logs and lesson completions only exist once Plan 1 is live. Writing it earlier would mean fixing numbers from an invented reference user.

**Plan 3: return triggers and measurement** covers the weekly nudge, the day-7 and day-30 confidence pulse, harm signals, and later the home-screen widget. It needs the open decisions in the spec (how "overwatering report" is defined, and the native build for the widget).
