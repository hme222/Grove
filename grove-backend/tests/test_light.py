from datetime import datetime, timezone

import light


def on(month, day=15):
    return datetime(2026, month, day, 12, 0, tzinfo=timezone.utc)


def test_sun_and_direction_map_both_ways():
    assert [light.direction_for_sun(s) for s in ("morning", "midday", "afternoon", "none")] == ["E", "S", "W", "N"]
    assert light.direction_for_sun("nowindow") is None
    expected = {"N": "none", "NE": "morning", "E": "morning", "SE": "morning", "S": "midday",
                "SW": "afternoon", "W": "afternoon", "NW": "afternoon"}
    assert {d: light.sun_for_direction(d) for d in light.DIRECTIONS} == expected


def test_the_southern_hemisphere_swaps_north_and_south_only():
    swapped = {"N": "S", "S": "N", "NE": "SE", "SE": "NE", "SW": "NW", "NW": "SW", "E": "E", "W": "W"}
    assert {d: light.effective_direction(d, "south") for d in light.DIRECTIONS} == swapped
    assert all(light.effective_direction(d, "north") == d for d in light.DIRECTIONS)


def test_seasons_follow_the_hemisphere():
    assert light.season_for(on(7), "north") == "summer"
    assert light.season_for(on(7), "south") == "winter"
    assert light.season_for(on(1), "north") == "winter"
    assert light.season_for(on(1), "south") == "summer"
    assert light.season_for(on(4), "north") == "summer"
    assert light.season_for(on(10), "north") == "winter"


def test_levels_for_every_direction_in_both_seasons():
    expected = {
        "N": ("medium", "low"),
        "NE": ("bright_indirect", "medium"),
        "E": ("bright_indirect", "bright_indirect"),
        "SE": ("bright_direct", "bright_direct"),
        "S": ("bright_direct", "bright_direct"),
        "SW": ("bright_direct", "bright_direct"),
        "W": ("bright_direct", "bright_direct"),
        "NW": ("bright_indirect", "medium"),
    }
    for direction, pair in expected.items():
        got = (light.level_for(direction, "open", "summer"), light.level_for(direction, "open", "winter"))
        assert got == pair, direction


def test_a_tree_or_building_dims_one_level_and_never_below_low():
    assert light.level_for("S", "open", "summer") == "bright_direct"
    assert light.level_for("S", "tree", "summer") == "bright_indirect"
    assert light.level_for("S", "building", "summer") == "bright_indirect"
    assert light.level_for("N", "building", "winter") == "low"


def test_a_window_facing_north_in_the_south_gets_southern_light():
    assert light.level_for("N", "open", "summer", "south") == "bright_direct"


def test_arrives_text_for_each_direction():
    assert light.arrives("S") == "The most direct sun, all day."
    assert light.arrives("N") == "No direct sun. Steady, even light."
    assert light.arrives("NE") == "Gentle sun in the early morning."
    assert light.arrives("E") == "Sun in the morning, then bright light."
    assert light.arrives("SE") == "Strong sun from morning to midday."
    assert light.arrives("SW") == "Hot sun from midday into the evening."
    assert light.arrives("W") == "Hot, low sun in the afternoon, with glare."
    assert light.arrives("NW") == "Weak sun late in the day."
    assert light.arrives("N", "south") == light.arrives("S")


def test_window_summary():
    assert light.window_summary(None, None, "open", "north", on(7)) is None
    summary = light.window_summary("afternoon", None, "tree", "north", on(7))
    assert summary == {
        "sun": "afternoon", "direction": "W", "draw_direction": "W", "view": "tree",
        "hemisphere": "north", "season": "summer", "level": "bright_indirect",
        "arrives": light.arrives("W"), "lamp": False,
    }
    nowindow = light.window_summary("nowindow", None, "open", "north", on(7))
    assert nowindow["direction"] is None and nowindow["draw_direction"] is None
    assert nowindow["level"] == "low" and nowindow["lamp"] is True
    assert nowindow["arrives"] == "No window here. A lamp or grow light will do the work."
    assert light.window_summary("midday", "SW", "open", "north", on(7))["direction"] == "SW"


def test_window_summary_draws_with_the_effective_direction():
    summary = light.window_summary("none", "N", "open", "south", on(7))
    assert summary["direction"] == "N" and summary["draw_direction"] == "S"
    assert summary["season"] == "winter"


def test_guide_lists_all_eight_directions_in_both_seasons():
    items = light.guide("north", "open")
    assert len(items) == 16
    assert all({"direction", "season", "level", "arrives"} <= set(item) for item in items)
    south = light.guide("south", "open")
    north_summer = next(i for i in south if i["direction"] == "N" and i["season"] == "summer")
    assert north_summer["level"] == "bright_direct"


def test_fits_species_takes_the_level_and_the_one_below():
    species = [
        {"id": "a", "common_name": "Zeta", "default_light_level": "bright_indirect"},
        {"id": "b", "common_name": "Alpha", "default_light_level": "medium"},
        {"id": "c", "common_name": "Low one", "default_light_level": "low"},
        {"id": "d", "common_name": "Sun one", "default_light_level": "bright_direct"},
        {"id": "e", "common_name": "No level"},
    ]
    names = [s["common_name"] for s in light.fits_species(species, "bright_indirect")]
    assert names == ["Alpha", "Zeta"]
    assert [s["common_name"] for s in light.fits_species(species, "low")] == ["Low one"]
    assert len(light.fits_species(species, "bright_indirect", limit=1)) == 1


def test_suit():
    assert light.suit("medium", "medium") == "suits"
    assert light.suit("medium", "bright_indirect") == "suits"
    assert light.suit("bright_direct", "medium") == "prefers_brighter"
    assert light.suit("low", "bright_direct") == "prefers_dimmer"


def test_guide_items_carry_the_direction_to_draw():
    south = {(i["direction"], i["season"]): i for i in light.guide("south", "open")}
    assert south[("N", "summer")]["draw_direction"] == "S"
    assert south[("E", "winter")]["draw_direction"] == "E"
    north = {(i["direction"], i["season"]): i for i in light.guide("north", "open")}
    assert north[("SW", "summer")]["draw_direction"] == "SW"
