"""The one exact step shown on a care card, by how each species dries out.

A single "check the top inch" line is wrong for succulents, orchids and moisture lovers, so each
species in the guide maps to a dry-down group. A species with no entry shows the generic line.
"""

STEPS = {
    "top_inch": "Check the top inch of soil. Water if it's dry.",
    "top_two_inches": "Check the top two inches of soil. Water if they're dry.",
    "fully_dry": "Feel the whole pot. Water only when the soil is dry all the way down, or the pot feels light.",
    "evenly_moist": "Check the top inch. Water when it just starts to dry. It should never go bone dry or sit wet.",
    "roots": "Look at the roots. Silvery means water; green means wait. Let the bark mix drain fully.",
}

GROUPS = {
    "top_inch": ["epipremnum-aureum", "chlorophytum-comosum", "monstera-deliciosa", "philodendron-pink-princess",
                 "hoya-carnosa", "chamaedorea-elegans", "peperomia-obtusifolia", "hedera-helix",
                 "aglaonema-modestum", "aspidistra-elatior"],
    "top_two_inches": ["ficus-elastica", "ficus-lyrata", "strelitzia-reginae", "dracaena-fragrans",
                       "dracaena-marginata", "dracaena-trifasciata", "zamioculcas-zamiifolia",
                       "pachira-aquatica", "beaucarnea-recurvata"],
    "fully_dry": ["aloe-vera", "crassula-ovata", "haworthiopsis-fasciata", "echeveria-elegans",
                  "sedum-morganianum", "curio-rowleyanus", "opuntia-microdasys", "kalanchoe-blossfeldiana",
                  "schlumbergera-buckleyi"],
    "evenly_moist": ["spathiphyllum-wallisii", "goeppertia-orbifolia", "nephrolepis-exaltata",
                     "anthurium-warocqueanum"],
    "roots": ["phalaenopsis"],
}

STEP_BY_SLUG = {slug: STEPS[group] for group, slugs in GROUPS.items() for slug in slugs}


def care_step_for(slug):
    """The care-card step for a species slug, or None when the guide has no entry."""
    return STEP_BY_SLUG.get(slug)
