"""
Phase 14B.2 — Curated themed guilds.

Four bundles per the user's spec. Each guild bundles 4–6 species with a
paragraph on why they work together. Slugs reference species defined in
`curated_species.py`.

Tags surface as filter chips in a future iteration; accent_color tints
the guild card and the GuildDetailPage hero.
"""

CURATED_GUILDS = [
    {
        "slug": "native-pollinator-bed",
        "name": "Native Pollinator Bed",
        "subtitle": "An outdoor bed that feeds bees, butterflies, and goldfinches through the season",
        "accent_color": "#BA7517",
        "tags": ["outdoor", "native", "pollinator"],
        "species_slugs": [
            "rudbeckia-hirta",
            "echinacea-purpurea",
        ],
        "description": (
            "Black-eyed Susan and Purple Coneflower are the foundation of any North American "
            "native pollinator bed. They overlap in bloom time through midsummer, share the "
            "same pollinator guild (native bees, butterflies, and later goldfinches feeding on "
            "spent seed heads), and want exactly the same conditions: full sun, average garden "
            "soil, no fertilizer, and a hands-off approach to deadheading so the seed heads can "
            "feed birds through fall. "
            "\n\nThis guild is intentionally short. Two species are enough to establish a real "
            "ecological relationship — adding more should be a deliberate choice based on your "
            "specific region's native flora. Ask your local native plant nursery for region-"
            "appropriate companions like Asclepias tuberosa (butterfly weed) or "
            "Monarda fistulosa (wild bergamot) once these two are established."
        ),
        "design_notes": (
            "Plant in odd-numbered drifts (3 or 5 of each) rather than alternating. Mature "
            "drifts read as a single mass to pollinators and look intentional rather than dotty."
        ),
    },
    {
        "slug": "tropical-humidity-cluster",
        "name": "Tropical Humidity Cluster",
        "subtitle": "Indoor plants that share a humid microclimate — group them and they reinforce each other",
        "accent_color": "#5DCAA5",
        "tags": ["indoor", "humidity", "tropical"],
        "species_slugs": [
            "goeppertia-orbifolia",
            "nephrolepis-exaltata",
            "spathiphyllum-wallisii",
            "anthurium-warocqueanum",
        ],
        "description": (
            "These four tropical plants come from forest understory or wet forest habitats and "
            "need more humidity than a dry heated room gives. Indoors they sulk in dry winter air. "
            "Grouped together — ideally on a pebble tray or inside an enclosed plant cabinet — "
            "they create their own microclimate: each leaf transpires moisture that the others "
            "absorb, raising local humidity a little above the room average. "
            "\n\nThe Boston Fern is the workhorse — it transpires the most water and acts as a "
            "living humidifier for the more demanding Calathea Orbifolia and Anthurium "
            "warocqueanum. Peace Lily is the visual anchor and the most forgiving when humidity "
            "briefly drops. Together they need filtered medium light (no direct sun), evenly "
            "moist soil, and filtered or rain water for the Calathea — fluoride and minerals in tap "
            "water can burn its silver-banded edges. "
            "\n\nPets: Peace Lily and Anthurium are toxic to cats and dogs if chewed; Calathea and Boston Fern are not."
        ),
        "design_notes": (
            "Tier the cluster vertically — Anthurium hanging or staked at the back, Calathea "
            "and Peace Lily at mid-height, Boston Fern cascading from a higher shelf so its "
            "fronds drape over the others. The visual layers also stratify humidity."
        ),
    },
    {
        "slug": "cut-flower-border",
        "name": "Cut-Flower Border",
        "subtitle": "A florist's-eye border that fills bouquets all season",
        "accent_color": "#D4537E",
        "tags": ["outdoor", "cut-flower", "designed"],
        "species_slugs": [
            "eustoma-grandiflorum",
            "anemone-coronaria",
            "eucalyptus-polyanthemos",
            "dahlia-cafe-au-lait",
            "rosa-juliet-ausjameson",
        ],
        "description": (
            "Five species that bloom in succession from cool-season into late summer, giving a "
            "cutting border that supplies bouquets continuously. Plant the Anemone corms in "
            "fall for early-spring bloom in mild-winter areas (roughly zones 7–10), or in spring "
            "where winters are cold; Lisianthus and Rose 'Juliet' carry the late spring "
            "and early summer; Café au Lait Dahlias take over from midsummer through frost; "
            "Silver Dollar Eucalyptus provides the foliage backbone year-round in warm zones (roughly 8–9); "
            "in colder areas treat it as an annual or grow it in a pot. "
            "\n\nThis is the bouquet that has dominated weddings for the last decade — there's a "
            "reason. The blush palette of Juliet and Café au Lait against silver eucalyptus "
            "reads as 'designed' even when assembled by a beginner, and the bloom succession "
            "means you'll have material on hand whenever you need to cut. "
            "Disbud the rose for fewer, larger blooms (the standard florist trick), and sear "
            "anemone stems briefly in hot water after cutting to extend vase life. "
            "\n\nPets: eucalyptus is toxic to cats and dogs if chewed, and anemone and dahlia can irritate the mouth and skin."
        ),
        "design_notes": (
            "Plant the eucalyptus along the back as the structural spine; rose and dahlias mid-"
            "border for height; lisianthus and anemone at the front for filler stems. Stagger "
            "rather than block-plant — you'll be cutting from this border weekly and want a "
            "natural look as it gets harvested."
        ),
    },
    {
        "slug": "low-light-hallway",
        "name": "Low-Light Hallway",
        "subtitle": "The most forgiving plants for the gloomiest spot in the house",
        "accent_color": "#1C5C44",
        "tags": ["indoor", "low-light", "beginner"],
        "species_slugs": [
            "dracaena-trifasciata",
            "zamioculcas-zamiifolia",
            "epipremnum-aureum",
            "spathiphyllum-wallisii",
        ],
        "description": (
            "These four tolerate low light better than most houseplants. North-facing windows "
            "(south-facing in the southern hemisphere), rooms a few feet back from a window and "
            "office corners with daylight suit them. They grow slowly there, and the Pothos and "
            "Peace Lily lose vigour in very dim rooms. A hallway with no window needs a grow light. "
            "\n\nSnake Plant and ZZ Plant are the structural uprights. Both store water in their "
            "leaves or rhizomes and forgive a few missed weeks, which makes them the safest picks if "
            "you travel. Pothos is the trailing softener: let it drape from a high shelf or climb a "
            "moss pole. Peace Lily flowers best in medium light, so expect fewer blooms in the dimmest spot. "
            "\n\nCheck the soil rather than the calendar: every two to four weeks for the Snake Plant "
            "and ZZ, weekly for the Pothos, and every five days or so for the Peace Lily, and less often "
            "in winter. A Peace Lily droops when it is thirsty, but do not wait for that every time; "
            "check the top inch and water when it starts to dry. "
            "\n\nPets and children: all four are toxic to cats and dogs if chewed. Keep them on a shelf "
            "or stand out of reach, or choose a pet-safe set such as Cast Iron Plant."
        ),
        "design_notes": (
            "Put the Snake Plant and ZZ on a high stand or shelf where pets cannot reach, or swap in "
            "Cast Iron Plant if you have cats or dogs. Keep Pothos trailing from above and Peace Lily on a high stand. The vertical rhythm makes "
            "the hallway feel intentional rather than 'wherever the plants fit'."
        ),
    },
]
