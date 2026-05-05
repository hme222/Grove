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
            "feed birds through autumn. "
            "\n\nThis guild is intentionally short. Two species is enough to establish a real "
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
            "These four tropical plants all originate from forest understory or cloud forest "
            "habitats where ambient humidity sits at 70%+. Indoors they sulk in dry winter air. "
            "Grouped together — ideally on a pebble tray or inside an enclosed plant cabinet — "
            "they create their own microclimate: each leaf transpires moisture that the others "
            "absorb, raising local humidity 10–20% above the room average. "
            "\n\nThe Boston Fern is the workhorse — it transpires the most water and acts as a "
            "living humidifier for the more demanding Calathea Orbifolia and Anthurium "
            "warocqueanum. Peace Lily is the visual anchor and the most forgiving when humidity "
            "briefly drops. Together they need filtered medium light (no direct sun), evenly "
            "moist soil, and tap-water-free irrigation for the Calathea — fluoride and chlorine "
            "burn its silver-banded edges."
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
            "autumn for early-spring bloom; Lisianthus and Rose 'Juliet' carry the late spring "
            "and early summer; Café au Lait Dahlias take over from midsummer through frost; "
            "Silver Dollar Eucalyptus provides the foliage backbone year-round. "
            "\n\nThis is the bouquet that has dominated weddings for the last decade — there's a "
            "reason. The blush palette of Juliet and Café au Lait against silver eucalyptus "
            "reads as 'designed' even when assembled by a beginner, and the bloom succession "
            "means you'll have material on hand whenever you need to cut. "
            "Disbud the rose for fewer, larger blooms (the standard florist trick), and sear "
            "anemone stems briefly in hot water after cutting to extend vase life."
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
            "These four plants survive — even thrive — in light that would kill most "
            "houseplants. North-facing windows, internal hallways, north-side bathrooms, "
            "office corners away from windows: this is the guild for those spots. "
            "\n\nSnake Plant and ZZ Plant are the structural uprights — both store water in "
            "rhizomes, both will forgive multiple weeks of neglect, both are happy in light "
            "barely brighter than office fluorescents. Pothos is the trailing softener — let it "
            "drape from a high shelf or climb a moss pole. Peace Lily is the only one in this "
            "group that will actually flower in low light, giving the hallway a moment of "
            "drama once or twice a year. "
            "\n\nWatering is once every two weeks for the Snake Plant and ZZ; weekly for the "
            "Pothos and Peace Lily. The Peace Lily's dramatic wilt-recovery is a feature, not "
            "a bug — it tells you when to water without you having to remember."
        ),
        "design_notes": (
            "Place the upright Snake Plant and ZZ at eye level on a console or low shelf, with "
            "Pothos trailing from above and Peace Lily on the floor. The vertical rhythm makes "
            "the hallway feel intentional rather than 'wherever the plants fit'."
        ),
    },
]
