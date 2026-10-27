"""Phase 14C.4 — Daily plant trivia (Supplement v1 Part D.7).

30+ curated trivia cards across six categories: care · biology · native ·
propagation · light · pollinator. The headline is one short sentence; the
body is one to two sentences. `linked_species_slug` (optional) deep-links
the "Read more in Greenhouse" CTA to a specific species detail page.

Rotation is deterministic per (user_id, calendar_day) — every member of
the community sees the same daily trivia, and a given user sees the same
trivia for the duration of the day. The card rotates at midnight in the
user's local timezone (handled by the frontend by passing tz_offset).
"""
TRIVIA_SEED_VERSION = "14c4-trivia-v2"

TRIVIA_CARDS = [
    # ---------------- Care (5) ----------------
    {
        "headline": "Most houseplants want less water than you think.",
        "body": "The majority of indoor-plant deaths are from overwatering, not underwatering. For most leafy plants, let the top inch dry out; succulents want the whole pot dry. Your finger is a good first moisture meter, and lifting the pot helps too.",
        "category": "care",
        "linked_species_slug": None,
    },
    {
        "headline": "Rotate your plants a quarter-turn each week.",
        "body": "Plants grow toward the light. A weekly quarter-turn keeps them upright and balanced rather than leaning into the window.",
        "category": "care",
        "linked_species_slug": None,
    },
    {
        "headline": "Yellow leaves usually mean the roots are stressed.",
        "body": "Yellowing from the bottom up is most often overwatering or too little light. Browning at the tips usually points to dry air, dry soil or minerals in the water.",
        "category": "care",
        "linked_species_slug": None,
    },
    {
        "headline": "Tap water can be fine — or fatal — depending on the plant.",
        "body": "Calatheas, prayer plants, and carnivorous species hate chlorinated tap water. Most aroids and pothos handle it without complaint. Letting tap water sit overnight removes chlorine only; fluoride and hardness stay, so use rain or filtered water for the fussy ones.",
        "category": "care",
        "linked_species_slug": "goeppertia-orbifolia",
    },
    {
        "headline": "Fertilizer doesn't fix unhappy plants — it amplifies whatever's happening.",
        "body": "Feeding a stressed plant accelerates the stress. Get watering, light, and roots right first; only then does fertilizer help.",
        "category": "care",
        "linked_species_slug": None,
    },

    # ---------------- Biology (5) ----------------
    {
        "headline": "Leaves are solar panels with plumbing.",
        "body": "Photosynthesis happens in chloroplasts, but every leaf also has a network of veins moving water in and sugars out. When leaves go limp, both systems are losing pressure.",
        "category": "biology",
        "linked_species_slug": None,
    },
    {
        "headline": "Stomata open and close on the underside of every leaf.",
        "body": "These microscopic pores let CO₂ in and water vapour out. On hot, dry days plants can close them to save water. Misting leaves does little for most houseplants.",
        "category": "biology",
        "linked_species_slug": None,
    },
    {
        "headline": "A Monstera's holes are a structural feature, not a defect.",
        "body": "Mature monsteras develop fenestrations, and these may help wind pass through the leaf without tearing it and let light reach lower foliage in dense canopies.",
        "category": "biology",
        "linked_species_slug": "monstera-deliciosa",
    },
    {
        "headline": "Roots breathe.",
        "body": "Plant roots need oxygen as much as water. Compacted soil drowns roots even when the watering schedule looks right — repotting into chunky, well-aerated mix is often the actual fix.",
        "category": "biology",
        "linked_species_slug": None,
    },
    {
        "headline": "Trichomes are why some leaves look fuzzy.",
        "body": "Those tiny hairs on the underside of African violet, begonia, and gynura leaves are trichomes — they reduce water loss and deter small insects.",
        "category": "biology",
        "linked_species_slug": None,
    },

    # ---------------- Native (5) ----------------
    {
        "headline": "Pothos is invasive in subtropical regions.",
        "body": "Adored as a houseplant, but in places like Florida, Hawaii, and parts of Australia, escaped pothos smothers native canopy. Never compost or dump cuttings outdoors in those zones.",
        "category": "native",
        "linked_species_slug": "epipremnum-aureum",
    },
    {
        "headline": "Most native bee species in the US are solitary.",
        "body": "Of the ~4,000 native bee species, about 70% nest in the ground, and many of the rest use hollow stems. Leaving stem stubs in your garden through winter gives them a place to overwinter.",
        "category": "native",
        "linked_species_slug": None,
    },
    {
        "headline": "Replacing one invasive with a native pulls double weight.",
        "body": "Removing an invasive frees up resources; planting a native restores them. Conservation-conscious growers do both moves at once whenever possible.",
        "category": "native",
        "linked_species_slug": None,
    },
    {
        "headline": "Milkweed is the only host plant for monarch caterpillars.",
        "body": "Adult monarchs feed on many flowers, but their caterpillars only eat milkweed. No milkweed in the region means no monarchs the next generation.",
        "category": "native",
        "linked_species_slug": None,
    },
    {
        "headline": "Native plants don't need fertilizer.",
        "body": "By definition, a native plant evolved in your local soil and climate. Fertilizing them often does more harm than good — extra nutrients favor weeds and invasive neighbors.",
        "category": "native",
        "linked_species_slug": None,
    },

    # ---------------- Propagation (5) ----------------
    {
        "headline": "Many cuttings root in water — but transition slowly to soil.",
        "body": "Water roots and soil roots are different structures. A cutting that's lived in water for a month may sulk for two weeks after potting up. Move it to a damp medium gradually.",
        "category": "propagation",
        "linked_species_slug": None,
    },
    {
        "headline": "Cut just below a node.",
        "body": "The node is the small bump where leaves and roots emerge. This is true for pothos and other aroids: a cutting taken between nodes will rarely root.",
        "category": "propagation",
        "linked_species_slug": None,
    },
    {
        "headline": "Cinnamon can help keep a cut from rotting.",
        "body": "Standard ground cinnamon has antifungal properties and helps prevent rot at the cut site. It won't speed rooting on its own, but it gives the cutting a fighting chance.",
        "category": "propagation",
        "linked_species_slug": None,
    },
    {
        "headline": "Variegated cuttings can revert to plain green.",
        "body": "Variegation is genetically unstable. If you take a cutting from a section with no white at all, the new plant will most likely come back fully green.",
        "category": "propagation",
        "linked_species_slug": None,
    },
    {
        "headline": "Air-layering works for plants that hate cuttings.",
        "body": "Wrap a damp sphagnum collar around a stem node and seal it in plastic. Roots form on the parent plant before you sever — perfect for fiddle leaf figs and rubber trees.",
        "category": "propagation",
        "linked_species_slug": "ficus-lyrata",
    },

    # ---------------- Light (5) ----------------
    {
        "headline": "Bright indirect light is the most lied-about phrase in plant care.",
        "body": "It means a spot close to a bright window, within about 3 feet (1 meter), where daylight is strong but the sun does not land on the leaves. Most rooms are darker than this; a light meter app will show you.",
        "category": "light",
        "linked_species_slug": None,
    },
    {
        "headline": "Light intensity drops fast away from the window.",
        "body": "Light falls off steeply as you move away from the glass; a few feet back it can be a small fraction of what hits the window (the exact amount depends on the window and the weather). Most 'low light' plants still want to be fairly close to a window.",
        "category": "light",
        "linked_species_slug": None,
    },
    {
        "headline": "North-facing windows are real growing spaces, just slower.",
        "body": "North-facing windows (south-facing in the southern hemisphere) give gentle, steady light that suits ferns, calatheas and African violets in summer. In winter they can be too dim, so watch for stretching.",
        "category": "light",
        "linked_species_slug": None,
    },
    {
        "headline": "A grow light at 12 inches beats a window at 6 feet.",
        "body": "If your room is dim, an LED grow light running 10–12 hours a day matters more than where you put the plant. The right strength depends on the plant and the lamp, so follow the lamp maker's guidance for distance and hours.",
        "category": "light",
        "linked_species_slug": None,
    },
    {
        "headline": "New growth points to the strongest light.",
        "body": "Watch where the freshest leaves emerge — they always orient toward the brightest source. That's a free reading of how your plant feels about its current spot.",
        "category": "light",
        "linked_species_slug": None,
    },

    # ---------------- Pollinator (5) ----------------
    {
        "headline": "Hummingbirds choose red because many insects can't see it well.",
        "body": "Many insect eyes peak in the UV–blue range and see little red, though butterflies do see it. Plants with red tubular flowers effectively reserve their nectar for hummingbirds.",
        "category": "pollinator",
        "linked_species_slug": None,
    },
    {
        "headline": "Bees can see colors we can't.",
        "body": "Bee vision extends into ultraviolet. Many flowers we see as plain yellow have hidden UV \"runway\" patterns directing bees straight to the nectar.",
        "category": "pollinator",
        "linked_species_slug": None,
    },
    {
        "headline": "Night-blooming jasmine is for moths.",
        "body": "Strong fragrance after sunset, white or pale flowers that reflect moonlight, and lots of nectar — every clue says \"moth pollinated.\" Your nose just gets a free seat.",
        "category": "pollinator",
        "linked_species_slug": None,
    },
    {
        "headline": "A single bumblebee can visit 5,000 flowers in a day.",
        "body": "Bumblebees are heavy and warm — they can fly in cooler weather than honeybees and shake pollen out of stubborn flowers like tomatoes. They're the workhorse of small gardens.",
        "category": "pollinator",
        "linked_species_slug": None,
    },
    {
        "headline": "A few weedy flowers in spring keep your pollinators alive.",
        "body": "Dandelions, white clover, and wild violets bloom before most garden plants wake up. Letting them flower for two weeks in March/April can be the difference between a thriving and starving local bee population.",
        "category": "pollinator",
        "linked_species_slug": None,
    },

    # ---------------- Bonus (3) ----------------
    {
        "headline": "Plants communicate through their roots.",
        "body": "Connected by mycorrhizal fungi, trees in a forest can share sugars and even chemical warning signals. Researchers are still working out how much this matters.",
        "category": "biology",
        "linked_species_slug": None,
    },
    {
        "headline": "Repotting is least stressful at the start of the growing season.",
        "body": "A plant about to put on new roots doesn't mind a fresh pot. The same operation in November can stall growth for months. Spring is usually best.",
        "category": "care",
        "linked_species_slug": None,
    },
    {
        "headline": "Bigger pot ≠ happier plant.",
        "body": "When you upsize too much, the soil holds water the roots can't reach, and rot follows. Step up one to two inches in diameter at most.",
        "category": "care",
        "linked_species_slug": None,
    },
]

# Sanity-check counts at import time
assert len(TRIVIA_CARDS) >= 30, f"Need ≥30 trivia cards, got {len(TRIVIA_CARDS)}"
_categories = {c["category"] for c in TRIVIA_CARDS}
assert _categories == {"care", "biology", "native", "propagation", "light", "pollinator"}, \
    f"Trivia categories mismatch: {_categories}"
