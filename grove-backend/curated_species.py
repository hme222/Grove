"""
Phase 14B.1 — Hand-curated species seed.

Each entry corresponds 1:1 to the user's specified list (Supplement v2). Care
and light defaults are conservative middle-ground values pulled from the cited
sources. Citations preserve the user's source intent.

Light levels: 'low' | 'medium' | 'bright_indirect' | 'bright_direct'
Flags surface as badges on the SpeciesDetailPage and inform the swap/wishlist
gating in Wave 14C.
"""

CURATED_SPECIES = [
    # 1
    {
        "slug": "monstera-deliciosa",
        "common_name": "Monstera",
        "latin_name": "Monstera deliciosa",
        "family": "Araceae",
        "native_range": "Southern Mexico to Panama",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Bright indirect light. Let the top inch of soil dry between waterings. Provides a moss pole or trellis to climb; that's when the iconic fenestrations appear.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/11455/monstera-deliciosa/details"},
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=MODE"}
        ],
    },
    # 2
    {
        "slug": "epipremnum-aureum",
        "common_name": "Pothos",
        "latin_name": "Epipremnum aureum",
        "family": "Araceae",
        "native_range": "Mo'orea, French Polynesia",
        "default_watering_days": 7,
        "default_light_level": "medium",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Adapts to almost any indoor light. Water when the top inch is dry. Note: outdoors in tropical regions this species is invasive — never compost cuttings or release into the environment.",
        "flags": {"invasive_outdoors": True, "introduced_widely": True},
        "citations": [
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=EPAU"},
            {"label": "Global Invasive Species Database (ISSG)", "url": "http://www.iucngisd.org/gisd/species.php?sc=1463"}
        ],
    },
    # 3
    {
        "slug": "dracaena-trifasciata",
        "common_name": "Snake Plant",
        "latin_name": "Dracaena trifasciata",
        "family": "Asparagaceae",
        "native_range": "West Africa (Nigeria to Congo)",
        "default_watering_days": 14,
        "default_light_level": "low",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Tolerates low light and erratic watering. Let soil dry completely between waterings; overwatering is the only common way to kill it.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/76090/sansevieria-trifasciata/details"},
            {"label": "Kew Gardens — Plants of the World Online", "url": "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77181068-1"}
        ],
    },
    # 4
    {
        "slug": "chlorophytum-comosum",
        "common_name": "Spider Plant",
        "latin_name": "Chlorophytum comosum",
        "family": "Asparagaceae",
        "native_range": "Coastal southern Africa",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright indirect light. Water when the top inch dries. Prolific producer of plantlets — clip and pot to share with friends.",
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/3717/chlorophytum-comosum/details"}
        ],
    },
    # 5
    {
        "slug": "aloe-vera",
        "common_name": "Aloe vera",
        "latin_name": "Aloe vera",
        "family": "Asphodelaceae",
        "native_range": "Arabian Peninsula",
        "default_watering_days": 14,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Bright direct light, ideally a south- or west-facing window. Water deeply but only when soil is bone dry. Use a fast-draining cactus mix.",
        "flags": {"medicinal": True, "introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/14345/aloe-vera/details"},
            {"label": "Iran J Med Sci — peer-reviewed review", "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2763764/"}
        ],
    },
    # 6
    {
        "slug": "spathiphyllum-wallisii",
        "common_name": "Peace Lily",
        "latin_name": "Spathiphyllum wallisii",
        "family": "Araceae",
        "native_range": "Tropical Americas",
        "default_watering_days": 5,
        "default_light_level": "medium",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Low to medium light works; avoid direct sun. Keeps soil consistently moist — wilts dramatically when thirsty, recovers within hours of watering.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/17681/spathiphyllum-wallisii/details"}
        ],
    },
    # 7
    {
        "slug": "philodendron-pink-princess",
        "common_name": "Philodendron Pink Princess",
        "latin_name": "Philodendron erubescens 'Pink Princess'",
        "family": "Araceae",
        "native_range": "Cultivar (parent: Philodendron erubescens, Colombia)",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Cultivar selected for unstable pink variegation. Bright indirect light is non-negotiable — too little and the pink reverts to green. Water when top inch is dry. Stake to climb.",
        "flags": {"cultivar": True, "parent_species": "Philodendron erubescens"},
        "citations": [
            {"label": "International Aroid Society", "url": "https://www.aroid.org/genera/philodendron/"}
        ],
    },
    # 8
    {
        "slug": "anthurium-warocqueanum",
        "common_name": "Anthurium warocqueanum",
        "latin_name": "Anthurium warocqueanum",
        "family": "Araceae",
        "native_range": "Cloud forests of Colombia",
        "default_watering_days": 5,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Collector species nicknamed the Queen Anthurium. Demands very high humidity (70%+), bright indirect light, and a chunky aroid mix. Not a beginner plant.",
        "flags": {"collector": True, "introduced_widely": False},
        "citations": [
            {"label": "International Aroid Society", "url": "https://www.aroid.org/genera/anthurium/"},
            {"label": "Phytotaxa peer-reviewed (Croat & Carlsen)", "url": "https://www.biotaxa.org/Phytotaxa/article/view/phytotaxa.20.1.4"}
        ],
    },
    # 9
    {
        "slug": "zamioculcas-zamiifolia",
        "common_name": "ZZ Plant",
        "latin_name": "Zamioculcas zamiifolia",
        "family": "Araceae",
        "native_range": "Eastern Africa (Kenya to South Africa)",
        "default_watering_days": 14,
        "default_light_level": "low",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Stores water in rhizomes. Tolerates low light and forgets-to-water schedules. Water only when soil is fully dry.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/details?plantid=2155"},
            {"label": "Kew Gardens", "url": "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:84543-1"}
        ],
    },
    # 10
    {
        "slug": "ficus-elastica",
        "common_name": "Rubber Plant",
        "latin_name": "Ficus elastica",
        "family": "Moraceae",
        "native_range": "Eastern Himalayas to South-east Asia",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Glossy leaves love bright indirect light. Water when the top two inches of soil are dry. Wipe leaves to keep them shining.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/7000/ficus-elastica/details"}
        ],
    },
    # 11
    {
        "slug": "ficus-lyrata",
        "common_name": "Fiddle-leaf Fig",
        "latin_name": "Ficus lyrata",
        "family": "Moraceae",
        "native_range": "Western Africa",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Wants a consistent spot in bright indirect light — hates being moved. Water when top two inches of soil are dry. Sensitive to drafts.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/7039/ficus-lyrata/details"}
        ],
    },
    # 12
    {
        "slug": "goeppertia-orbifolia",
        "common_name": "Calathea Orbifolia",
        "latin_name": "Goeppertia orbifolia",
        "family": "Marantaceae",
        "native_range": "Bolivia",
        "default_watering_days": 5,
        "default_light_level": "medium",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Medium indirect light only — direct sun bleaches the silver bands. Keeps soil consistently moist. Use filtered or rain water; tap water minerals burn the leaf edges.",
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/108807/calathea-orbifolia/details"},
            {"label": "Borchsenius & Suárez (Phytotaxa)", "url": "https://www.biotaxa.org/Phytotaxa/article/view/phytotaxa.124.1.2"}
        ],
    },
    # 13
    {
        "slug": "strelitzia-reginae",
        "common_name": "Bird of Paradise",
        "latin_name": "Strelitzia reginae",
        "family": "Strelitziaceae",
        "native_habitat": "South Africa",
        "native_range": "Eastern Cape, South Africa",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Wants the brightest spot you can give it; flowers indoors only with several hours of direct sun. Water when top inch is dry; let the leaves curl slightly before watering in winter.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Kew Gardens — Plants of the World Online", "url": "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:797486-1"},
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/18079/strelitzia-reginae/details"}
        ],
    },
    # 14
    {
        "slug": "rudbeckia-hirta",
        "common_name": "Black-eyed Susan",
        "latin_name": "Rudbeckia hirta",
        "family": "Asteraceae",
        "native_range": "Eastern and central North America",
        "default_watering_days": 5,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native pollinator workhorse. Full sun and average garden soil; once established it's drought tolerant. Long-blooming for late-summer pollinators.",
        "flags": {"native_to_na": True, "pollinator": True, "pet_safe": True},
        "citations": [
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=RUHI2"},
            {"label": "Xerces Society — Pollinator Plants", "url": "https://www.xerces.org/publications/plant-lists"}
        ],
    },
    # 15
    {
        "slug": "echinacea-purpurea",
        "common_name": "Coneflower",
        "latin_name": "Echinacea purpurea",
        "family": "Asteraceae",
        "native_range": "Eastern North America",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native prairie perennial. Full sun and well-drained soil. Leaves the spent seed heads up over winter — finches feed on them.",
        "flags": {"native_to_na": True, "pollinator": True, "pet_safe": True},
        "citations": [
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=ECPU"},
            {"label": "Xerces Society — Pollinator Plants", "url": "https://www.xerces.org/publications/plant-lists"}
        ],
    },
    # 16
    {
        "slug": "hedera-helix",
        "common_name": "English Ivy",
        "latin_name": "Hedera helix",
        "family": "Araliaceae",
        "native_range": "Europe and western Asia",
        "default_watering_days": 7,
        "default_light_level": "medium",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright to medium indirect light indoors. Keep soil evenly moist. Outdoors in much of North America this species is aggressively invasive — never compost cuttings, and consider native alternatives like Virginia creeper (Parthenocissus quinquefolia).",
        "flags": {"invasive_outdoors": True, "native_alternatives_us": ["Parthenocissus quinquefolia", "Asarum canadense"]},
        "citations": [
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=HEHE"},
            {"label": "Invasive.org — Center for Invasive Species", "url": "https://www.invasive.org/species/subject.cfm?sub=3027"}
        ],
    },
    # 17
    {
        "slug": "rosa-juliet-ausjameson",
        "common_name": "Garden Rose 'Juliet'",
        "latin_name": "Rosa 'Juliet' (Auspoly)",
        "family": "Rosaceae",
        "native_range": "Cultivar (David Austin English Rose, 2006)",
        "default_watering_days": 3,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Famous David Austin cut-flower rose with peachy-apricot rosette blooms. Full sun, deep regular watering, well-drained soil. Disbud for fewer, bigger blooms — the standard florist trick.",
        "flags": {"cultivar": True, "parent_species": "Rosa hybrid (David Austin breeding)", "cut_flower": True},
        "citations": [
            {"label": "David Austin Roses — official cultivar page", "url": "https://www.davidaustinroses.com/products/juliet-auspoly"}
        ],
    },
    # 18
    {
        "slug": "eucalyptus-polyanthemos",
        "common_name": "Silver Dollar Eucalyptus",
        "latin_name": "Eucalyptus polyanthemos",
        "family": "Myrtaceae",
        "native_range": "South-eastern Australia (Vic, NSW)",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Cut-flower staple — round silvery juvenile leaves are the foliage you've seen in every wedding bouquet for a decade. Full sun, well-drained soil. Cut hard in spring to keep juvenile foliage.",
        "flags": {"introduced_widely": True, "cut_flower": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/95220/eucalyptus-polyanthemos/details"}
        ],
    },
    # 19
    {
        "slug": "eustoma-grandiflorum",
        "common_name": "Lisianthus",
        "latin_name": "Eustoma grandiflorum",
        "family": "Gentianaceae",
        "native_range": "Southern United States to northern Mexico",
        "default_watering_days": 5,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native to the SW United States; major commercial cut flower. Full sun, even moisture, neutral to alkaline soil. Long vase life (10–14 days) — handle stems gently, they bruise.",
        "flags": {"native_to_na": True, "cut_flower": True, "pet_safe": True},
        "citations": [
            {"label": "USDA NRCS PLANTS", "url": "https://plants.usda.gov/home/plantProfile?symbol=EUGR8"},
            {"label": "Association of Specialty Cut Flower Growers", "url": "https://www.ascfg.org/"}
        ],
    },
    # 20
    {
        "slug": "anemone-coronaria",
        "common_name": "Anemone",
        "latin_name": "Anemone coronaria",
        "family": "Ranunculaceae",
        "native_range": "Mediterranean basin",
        "default_watering_days": 5,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Cool-season cut flower. Plant corms in autumn; full sun and well-drained soil. Sappy stems — sear or hot-water dip after cutting for best vase life.",
        "flags": {"cut_flower": True, "introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/1297/anemone-coronaria/details"}
        ],
    },
    # 21
    {
        "slug": "hoya-carnosa",
        "common_name": "Hoya",
        "latin_name": "Hoya carnosa",
        "family": "Apocynaceae",
        "native_range": "Eastern Asia and Australia",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright indirect light. Let soil dry between waterings. Don't deadhead spent flower spurs — Hoya re-flowers from the same peduncle for years.",
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "International Hoya Association", "url": "http://international-hoya.org/"}
        ],
    },
    # 22
    {
        "slug": "curio-rowleyanus",
        "common_name": "String of Pearls",
        "latin_name": "Curio rowleyanus",
        "family": "Asteraceae",
        "native_range": "South-western Africa (Namibia, South Africa)",
        "default_watering_days": 14,
        "default_light_level": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Trailing succulent. Bright indirect light; soak then let dry. Pearls shrivel slightly before watering — over-watered pearls split open.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/204937/senecio-rowleyanus/details"}
        ],
    },
    # 23
    {
        "slug": "nephrolepis-exaltata",
        "common_name": "Boston Fern",
        "latin_name": "Nephrolepis exaltata",
        "family": "Nephrolepidaceae",
        "native_range": "Tropical Americas",
        "default_watering_days": 3,
        "default_light_level": "medium",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Indirect light, high humidity, soil that never fully dries. Browning fronds are almost always a humidity problem, not a watering one.",
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/12009/nephrolepis-exaltata/details"}
        ],
    },
    # 24
    {
        "slug": "crassula-ovata",
        "common_name": "Jade Plant",
        "latin_name": "Crassula ovata",
        "family": "Crassulaceae",
        "native_range": "South Africa and Mozambique",
        "default_watering_days": 14,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Bright direct light keeps the leaves compact and red-edged. Water deeply only when soil is bone dry. A jade plant rarely outlives its owner — they get passed down generations.",
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/4844/crassula-ovata/details"}
        ],
    },
    # 25
    {
        "slug": "dahlia-cafe-au-lait",
        "common_name": "Dahlia 'Café au Lait'",
        "latin_name": "Dahlia 'Café au Lait'",
        "family": "Asteraceae",
        "native_range": "Cultivar (parents in Dahlia pinnata lineage; native genus to Mexico)",
        "default_watering_days": 3,
        "default_light_level": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "The dinner-plate dahlia of wedding bouquets — blush, blooms 8–10 inches across. Plant tubers after last frost in full sun, stake early, deep weekly watering once established. Lift tubers in cold-winter zones.",
        "flags": {"cultivar": True, "parent_species": "Dahlia pinnata lineage", "cut_flower": True, "pet_safe": True},
        "citations": [
            {"label": "American Dahlia Society", "url": "https://www.dahlia.org/"}
        ],
    },
]
