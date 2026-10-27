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
    assert tracks.build_lesson_queue("seedling", []) == ["light-basics", "soil-finger-test"]


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


# ---- first-run plan quiz (four skippable questions) ----

def test_plan_every_option_points_at_an_existing_track_or_nothing():
    for question, options in tracks.PLAN_QUESTIONS.items():
        assert len(options) == 6, question
        for option, track in options.items():
            assert track is None or track in tracks.TRACKS, (question, option)


def test_plan_every_track_can_be_reached():
    reachable = {t for opts in tracks.PLAN_QUESTIONS.values() for t in opts.values() if t}
    assert reachable == set(tracks.TRACKS)


def test_plan_all_skipped_uses_default_and_says_nothing_matched():
    for empty in ({}, None, "nope", []):
        out = tracks.resolve_plan(empty)
        assert out["primary_track"] == tracks.DEFAULT_TRACK
        assert out["matched"] == []
        assert out["answers"] == {}


def test_plan_ignores_unknown_questions_and_options():
    out = tracks.resolve_plan({"q9": "gift", "q1": "<script>", "q2": 5})
    assert out == {"primary_track": tracks.DEFAULT_TRACK, "matched": [], "answers": {}}


def test_plan_one_answer_picks_its_track_and_quotes_it():
    out = tracks.resolve_plan({"q1": "gift"})
    assert out["primary_track"] == "rescue"
    assert out["matched"] == [{"question": "q1", "answer": "gift"}]


def test_plan_majority_wins_and_matched_lists_only_the_winners():
    out = tracks.resolve_plan({"q1": "loved_and_lost", "q2": "feel_guilty", "q3": "save_gift", "q4": "know_basics"})
    assert out["primary_track"] == "reset"
    assert out["matched"] == [
        {"question": "q1", "answer": "loved_and_lost"},
        {"question": "q2", "answer": "feel_guilty"},
    ]
    assert out["answers"]["q4"] == "know_basics"


def test_plan_tie_goes_to_track_priority():
    # one vote each for seedling and rescue: rescue is earlier in TRACK_PRIORITY
    out = tracks.resolve_plan({"q1": "none_yet", "q3": "save_gift"})
    assert out["primary_track"] == "rescue"


def test_plan_confident_answers_alone_fall_back_to_default():
    out = tracks.resolve_plan({"q1": "my_job", "q2": "check_roots", "q3": "advanced", "q4": "botanical"})
    assert out["primary_track"] == tracks.DEFAULT_TRACK
    assert out["matched"] == []
    assert len(out["answers"]) == 4


def test_plan_resolves_to_a_real_first_lesson():
    out = tracks.resolve_plan({"q4": "blank_slate"})
    assert tracks.build_lesson_queue(out["primary_track"], [])[0] == "light-basics"


def test_the_library_lists_the_two_light_lessons_and_not_the_retired_one():
    assert "light-basics" in tracks.LIBRARY_LESSON_IDS
    assert "window-map" in tracks.LIBRARY_LESSON_IDS
    assert "window-blueprint" not in tracks.LIBRARY_LESSON_IDS
    assert "window-blueprint" in tracks.LEGACY_LESSON_IDS


def test_the_retired_lesson_is_still_read_from_the_records():
    assert tracks.completed_lessons(["lesson:window-blueprint"]) == ["window-blueprint"]


def test_finishing_the_old_lesson_credits_part_one_only():
    done = ["window-blueprint"]
    credited = tracks.with_legacy_credit(done)
    assert "light-basics" in credited and "window-map" not in credited
    assert done == ["window-blueprint"]
    assert tracks.with_legacy_credit(["plant-er"]) == ["plant-er"]


def test_a_seedling_user_who_finished_the_old_lesson_only_has_soil_left():
    credited = tracks.with_legacy_credit(["window-blueprint"])
    assert tracks.build_lesson_queue("seedling", credited) == ["soil-finger-test"]
