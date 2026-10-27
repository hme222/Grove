"""
Phase 14B.1 — Hand-curated species seed.

Each entry corresponds 1:1 to the user's specified list (Supplement v2). Care
and light defaults are conservative middle-ground values pulled from the cited
sources. Citations preserve the user's source intent.

Light levels: 'low' | 'medium' | 'bright_indirect' | 'bright_direct'
Light bands: `light_min` is the lowest light the plant survives in, `light_ideal` the light it grows
best in. These two values, `sun_sensitive`, and the `synonyms` lists are professional horticultural
judgment (checked against general RHS-style care guidance), not figures quoted from a single page.
`sun_sensitive` marks plants whose leaves scorch or fade in direct sun. `default_light_level` stays
for backwards compatibility. `origin_note` overrides the generated "native to ..." sentence, and
`beginner_friendly: False` marks plants that are not for a first plant.
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
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Bright indirect light. Let the top inch of soil dry between waterings, and water less in winter. Give it a moss pole or trellis: climbing helps it mature and produce split leaves, but light matters too.",
        "synonyms": ["Swiss cheese plant", "Split-leaf philodendron", "Monstera"],
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
        "light_min": "low",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Tolerates low to bright indirect light; no direct midday sun, and not a windowless room. Water when the top inch is dry, less in winter. Note: outdoors in tropical regions this species is invasive — never compost cuttings or release into the environment.",
        "synonyms": ["Pothos", "Golden pothos", "Devil's ivy", "Scindapsus aureus"],
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
        "default_light_level": "medium",
        "light_min": "low",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Tolerates low light and erratic watering, though it grows best in brighter indirect light. Let soil dry completely between waterings, and water less in winter; overwatering is the only common way to kill it.",
        "synonyms": ["Sansevieria trifasciata", "Sansevieria", "Mother-in-law's tongue", "Snake plant"],
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
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright indirect light. Water when the top inch dries, less in winter. Prolific producer of plantlets — clip and pot to share with friends.",
        "synonyms": ["Chlorophytum", "Airplane plant"],
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
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright direct light, ideally a south- or west-facing window. Water deeply but only when soil is bone dry. Use a fast-draining cactus mix. The whole plant is toxic to cats and dogs, so keep it out of their reach.",
        "synonyms": ["Aloe barbadensis", "Aloe barbadensis miller"],
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
        "light_min": "low",
        "light_ideal": "medium",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Low to medium light works; avoid direct sun. Likes evenly moist soil. Check the top inch. Water when it just starts to dry, before it droops, and less often in winter.",
        "synonyms": ["Spathiphyllum", "Peace lily"],
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
        "origin_note": "Cultivar: Philodendron erubescens 'Pink Princess', a selection of a species native to Colombia.",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Cultivar selected for unstable pink variegation. Bright indirect light is non-negotiable — too little and the pink reverts to green. If the pink fades, prune back to a pink node and give brighter indirect light. Water when top inch is dry, less in winter. Stake to climb.",
        "synonyms": ["Pink Princess", "Philodendron erubescens 'Pink Princess'"],
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
        "native_range": "Wet forests of Colombia",
        "default_watering_days": 5,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Collector species nicknamed the Queen Anthurium. Demands very high humidity (70%+), bright indirect light, and a chunky aroid mix. Not a beginner plant; water a little less in winter.",
        "beginner_friendly": False,
        "synonyms": ["Queen anthurium"],
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
        "default_light_level": "medium",
        "light_min": "low",
        "light_ideal": "medium",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Stores water in rhizomes. Tolerates low light and missed waterings. Water only when soil is fully dry, and less in winter.",
        "synonyms": ["Zamioculcas", "Zanzibar gem", "ZZ"],
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
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Glossy leaves love bright indirect light. Water when the top two inches of soil are dry, less in winter. Wipe leaves to keep them shining.",
        "synonyms": ["Rubber tree", "Indian rubber tree"],
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
        "light_min": "bright_indirect",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Wants a consistent spot in bright indirect light — hates being moved. Water when top two inches of soil are dry, less in winter. Sensitive to drafts.",
        "synonyms": ["Fiddle leaf fig", "Fiddleleaf fig"],
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
        "light_min": "medium",
        "light_ideal": "medium",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Medium indirect light only — direct sun bleaches the silver bands. Keeps soil consistently moist, a little less in winter. Use filtered or rain water; tap water minerals burn the leaf edges.",
        "synonyms": ["Calathea orbifolia", "Calathea", "Goeppertia"],
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
        "native_range": "Eastern Cape, South Africa",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Wants the brightest spot you can give it; flowers indoors only with several hours of direct sun. Water when the top two inches are dry; in winter, let the top few inches dry before watering.",
        "synonyms": ["Crane flower", "Bird of paradise"],
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
        "default_watering_days": 21,
        "default_light_level": "bright_direct",
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native pollinator workhorse. Full sun and average garden soil. Water new plantings every few days for the first season; once established it is drought tolerant, so water only in long dry spells. Long-blooming for late-summer pollinators.",
        "synonyms": ["Rudbeckia", "Black eyed Susan"],
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
        "default_watering_days": 21,
        "default_light_level": "bright_direct",
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native prairie perennial. Full sun and well-drained soil. Water new plantings every few days for the first season; once established it is drought tolerant, so water only in long dry spells. Leave the spent seed heads up over winter — finches feed on them.",
        "synonyms": ["Purple coneflower", "Echinacea"],
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
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright to medium indirect light indoors. Keep soil evenly moist. Outdoors in much of North America this species is aggressively invasive — never compost cuttings, and consider native alternatives like Virginia creeper (Parthenocissus quinquefolia).",
        "synonyms": ["Common ivy"],
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
        "origin_note": "Cultivar: a David Austin English Rose bred in 2006 from garden rose hybrids, so it has no wild range.",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Famous David Austin cut-flower rose with peachy-apricot rosette blooms. A garden plant: full sun and well-drained soil. Check the soil and deep water about weekly in dry weather; a potted rose or tuber rots if watered on a short cycle. Disbud for fewer, bigger blooms — the standard florist trick.",
        "synonyms": ["Juliet rose", "Rosa Juliet", "Rosa Ausjameson"],
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
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Cut-flower staple — round silvery juvenile leaves are the foliage you've seen in every wedding bouquet for a decade. Full sun, well-drained soil. Cut hard in spring to keep juvenile foliage.",
        "synonyms": ["Eucalyptus", "Silver dollar gum"],
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
        "native_range": "Great Plains of the United States to Mexico",
        "default_watering_days": 5,
        "default_light_level": "bright_direct",
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Native to the southern Great Plains of the United States and Mexico; major commercial cut flower. Full sun, even moisture, neutral to alkaline soil. Long vase life (10–14 days) — handle stems gently, they bruise.",
        "synonyms": ["Eustoma", "Prairie gentian", "Texas bluebell"],
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
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Cool-season cut flower. Plant corms in fall where winters are mild, or in spring where they are cold; full sun and well-drained soil. Sappy stems — sear or hot-water dip after cutting for best vase life. Sap irritates skin and mouth; wear gloves when cutting.",
        "synonyms": ["Poppy anemone", "Windflower"],
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
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright indirect light. Let soil dry between waterings, and water less in winter. Don't deadhead spent flower spurs — Hoya re-flowers from the same peduncle for years.",
        "synonyms": ["Wax plant", "Porcelain flower"],
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
        "light_min": "bright_indirect",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Trailing succulent. Bright indirect light; soak, then let it dry fully. Pearls shrivel and flatten when dry. Translucent, mushy pearls mean overwatering.",
        "synonyms": ["Senecio rowleyanus", "String of pearls"],
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
        "native_range": "Pantropical (tropical regions worldwide)",
        "default_watering_days": 3,
        "default_light_level": "medium",
        "light_min": "medium",
        "light_ideal": "medium",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Indirect light, high humidity, soil that never fully dries; water less often in winter. Browning fronds mean a dry root ball or dry air. Check the soil first.",
        "synonyms": ["Nephrolepis", "Sword fern", "Boston fern"],
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
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright direct light keeps the leaves compact and red-edged. Water deeply only when soil is bone dry. A jade plant rarely outlives its owner — they get passed down generations.",
        "synonyms": ["Crassula argentea", "Lucky plant", "Jade"],
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
        "origin_note": "Cultivar: bred from the Dahlia pinnata lineage, whose wild ancestors are native to Mexico and Central America.",
        "default_watering_days": 7,
        "default_light_level": "bright_direct",
        "light_min": "bright_direct",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "The dinner-plate dahlia of wedding bouquets — blush, blooms 8–10 inches across. A garden plant: plant tubers after last frost in full sun and stake early. Check the soil and deep water about weekly in dry weather; potted tubers rot if watered on a short cycle. Lift tubers in cold-winter zones.",
        "synonyms": ["Dahlia"],
        "flags": {"cultivar": True, "parent_species": "Dahlia pinnata lineage", "cut_flower": True},
        "citations": [
            {"label": "American Dahlia Society", "url": "https://www.dahlia.org/"}
        ],
    },
    # 26. Added after the first synthetic user test found common houseplants missing
    {
        "slug": "phalaenopsis",
        "common_name": "Moth Orchid",
        "latin_name": "Phalaenopsis",
        "family": "Orchidaceae",
        "native_range": "Tropical Asia and northern Australia",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright, indirect light, such as an east or west window. Water about weekly in warm weather with tepid water and let it drain fully; the roots rot if they stay wet. Pot it in bark-based orchid mix, not regular potting soil, and keep it above 16°C.",
        "synonyms": ["Moth orchid", "Phal"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/phalaenopsis/growing-guide"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/phalaenopsis-orchid"}
        ],
    },
    # 27
    {
        "slug": "chamaedorea-elegans",
        "common_name": "Parlor Palm",
        "latin_name": "Chamaedorea elegans",
        "family": "Arecaceae",
        "native_range": "Southern Mexico to Guatemala",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "light_min": "low",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright, indirect light; summer sun scorches the fronds. Keep the soil lightly moist but never waterlogged, and use rain or filtered water if your tap water is hard. It copes with cooler rooms, around 13°C in winter.",
        "synonyms": ["Parlour palm", "Neanthe bella palm"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/29185/chamaedorea-elegans/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/parlor-palm"}
        ],
    },
    # 28
    {
        "slug": "aglaonema-modestum",
        "common_name": "Chinese Evergreen",
        "latin_name": "Aglaonema modestum",
        "family": "Araceae",
        "native_range": "Tropical Asia",
        "default_watering_days": 7,
        "default_light_level": "medium",
        "light_min": "low",
        "light_ideal": "medium",
        "default_grow_medium": "soil",
        "toxicity": "mild",
        "care_summary": "Filtered, medium light; direct sun burns the leaves. Keep the soil lightly moist and let the top dry a little between waterings. Chewing it irritates the mouth (calcium oxalate crystals), so keep it away from pets, and wear gloves when handling it.",
        "synonyms": ["Aglaonema"],
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/707/aglaonema-modestum/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/chinese-evergreen"}
        ],
    },
    # 29
    {
        "slug": "dracaena-fragrans",
        "common_name": "Corn Plant",
        "latin_name": "Dracaena fragrans",
        "family": "Asparagaceae",
        "native_range": "Tropical Africa",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright, indirect light with shade from hot sun. Water moderately while it is growing and sparingly in winter; let the top two inches dry between drinks. It is harmful to cats and dogs if eaten, so keep it out of reach.",
        "synonyms": ["Dracaena", "Dracaena massangeana", "Cornstalk dracaena"],
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/6093/dracaena-fragrans/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/corn-plant"}
        ],
    },
    # 30
    {
        "slug": "schlumbergera-buckleyi",
        "common_name": "Christmas Cactus",
        "latin_name": "Schlumbergera × buckleyi",
        "family": "Cactaceae",
        "native_range": "Hybrid of two southeastern Brazilian rainforest species",
        "origin_note": "Hybrid of two southeastern Brazilian rainforest species, raised in cultivation. Often sold as Christmas cactus; many plants sold under that name are actually S. truncata (Thanksgiving cactus).",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A rainforest cactus, not a desert one. Bright, indirect light, away from strong sun, and potting mix that stays moist but never waterlogged. Two cool, drier rests (around 12 to 15°C), one in fall and one after flowering, help it set buds. Moving it or sudden temperature swings make the buds drop.",
        "synonyms": ["Christmas cactus", "Thanksgiving cactus", "Schlumbergera truncata", "Holiday cactus", "Zygocactus"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/christmas-cactus/how-to-grow"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/christmas-cactus"}
        ],
    },
    # 31
    {
        "slug": "haworthiopsis-fasciata",
        "common_name": "Zebra Haworthia",
        "latin_name": "Haworthiopsis fasciata",
        "family": "Asphodelaceae",
        "native_range": "South Africa (Cape)",
        "default_watering_days": 14,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A small succulent that likes bright light but not hot midday sun. Use gritty cactus potting mix, water moderately while it grows, and keep it almost dry in winter. It rots if it sits in damp potting mix.",
        "synonyms": ["Haworthia fasciata", "Haworthia", "Zebra plant"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/504897/haworthiopsis-fasciata/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/zebra-haworthia"}
        ],
    },
    # Added after the first synthetic user test: more common houseplants, succulents and a cactus.
    # Only species with a direct ASPCA page are listed; pet safety is never guessed.
    # 32
    {
        "slug": "echeveria-elegans",
        "common_name": "Echeveria",
        "latin_name": "Echeveria elegans",
        "family": "Crassulaceae",
        "native_range": "Mexico",
        "default_watering_days": 14,
        "default_light_level": "bright_direct",
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A rosette succulent that wants as much sun as you can give it, such as a south or west window. Use gritty, fast-draining potting mix. Water moderately while it grows and very little in winter, just enough to stop shrivelling. It rots if it stays wet.",
        "synonyms": ["Echeveria", "Mexican snowball"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/6226/echeveria-elegans/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/hens-and-chickens"}
        ],
    },
    # 33
    {
        "slug": "sedum-morganianum",
        "common_name": "Burro's Tail",
        "latin_name": "Sedum morganianum",
        "family": "Crassulaceae",
        "native_range": "Mexico",
        "default_watering_days": 14,
        "default_light_level": "bright_indirect",
        "light_min": "bright_indirect",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A trailing succulent for bright, filtered light. Use gritty potting mix, water thoroughly, then let it dry out completely while it grows, and water sparingly in winter. The fat leaves drop off if it is knocked or moved a lot.",
        "synonyms": ["Donkey's tail", "Donkey tail"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/16969/sedum-morganianum/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/burros-tail"}
        ],
    },
    # 34
    {
        "slug": "beaucarnea-recurvata",
        "common_name": "Ponytail Palm",
        "latin_name": "Beaucarnea recurvata",
        "family": "Asparagaceae",
        "native_range": "Mexico",
        "default_watering_days": 14,
        "default_light_level": "bright_direct",
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A slow plant that stores water in its swollen base, so it forgives forgotten waterings. Give it as much light as possible and water moderately while it grows, then keep it drier in winter. Overwatering is the way to lose it.",
        "synonyms": ["Nolina recurvata", "Elephant's foot", "Beaucarnea"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/1993/beaucarnea-recurvata/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/pony-tail"}
        ],
    },
    # 35
    {
        "slug": "pachira-aquatica",
        "common_name": "Money Tree",
        "latin_name": "Pachira aquatica",
        "family": "Malvaceae",
        "native_range": "Central America and northern South America",
        "default_watering_days": 7,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Bright light or partial shade, and potting mix that stays lightly moist but drains freely. Not the same plant as the jade plant, which is also sold as a money tree and is toxic to pets: check the Latin name on the label.",
        "synonyms": ["Money tree", "Guiana chestnut", "Malabar chestnut"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/12078/pachira-aquatica/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/money-tree"}
        ],
    },
    # 36
    {
        "slug": "aspidistra-elatior",
        "common_name": "Cast Iron Plant",
        "latin_name": "Aspidistra elatior",
        "family": "Asparagaceae",
        "native_range": "Origin uncertain; long cultivated in China and Japan",
        "origin_note": "Origin uncertain; long cultivated in China and Japan.",
        "default_watering_days": 10,
        "default_light_level": "low",
        "light_min": "low",
        "light_ideal": "medium",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "Named for its toughness: it copes with low light, patchy watering and cool rooms (about 5 to 20°C). Keep it out of hot sun and away from heaters. The one way to harm it is soggy potting mix, which rots the roots.",
        "synonyms": ["Cast-iron plant", "Aspidistra"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/1715/aspidistra-elatior/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/cast-iron-plant"}
        ],
    },
    # 37
    {
        "slug": "peperomia-obtusifolia",
        "common_name": "Baby Rubber Plant",
        "latin_name": "Peperomia obtusifolia",
        "family": "Piperaceae",
        "native_range": "Mexico, South America and the West Indies",
        "default_watering_days": 7,
        "default_light_level": "medium",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "sun_sensitive": True,
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A compact, glossy plant that likes partial shade or filtered light and potting mix that is moist but well drained. Let the top of the potting mix dry a little between waterings. It is not related to the rubber plant (Ficus), which is a different species.",
        "synonyms": ["Peperomia", "Pepper face"],
        "flags": {"introduced_widely": True, "pet_safe": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/106212/peperomia-obtusifolia/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/baby-rubber-plant"}
        ],
    },
    # 38
    {
        "slug": "dracaena-marginata",
        "common_name": "Madagascar Dragon Tree",
        "latin_name": "Dracaena marginata",
        "family": "Asparagaceae",
        "native_range": "Madagascar",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "light_min": "medium",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright light with some shade from hot sun. Water once the top 2 inches of potting mix is dry, and use rain or filtered water because fluoride in tap water browns the leaf tips. All parts are harmful to cats and dogs if eaten, so keep it out of reach.",
        "synonyms": ["Dracaena", "Dragon tree", "Red-edged dracaena"],
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/31916/dracaena-marginata-v/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/madagascar-dragon-tree"}
        ],
    },
    # 39
    {
        "slug": "kalanchoe-blossfeldiana",
        "common_name": "Flaming Katy",
        "latin_name": "Kalanchoe blossfeldiana",
        "family": "Crassulaceae",
        "native_range": "North-eastern Madagascar",
        "default_watering_days": 10,
        "default_light_level": "bright_indirect",
        "light_min": "bright_indirect",
        "light_ideal": "bright_indirect",
        "default_grow_medium": "soil",
        "toxicity": "toxic",
        "care_summary": "Bright, filtered light. Water moderately while it grows and sparingly when it is resting, using gritty potting mix. Harmful to cats and dogs if eaten (it can affect the heart), so keep it where pets cannot reach it.",
        "synonyms": ["Kalanchoe", "Florist kalanchoe"],
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/78810/kalanchoe-blossfeldiana/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/kalanchoe"}
        ],
    },
    # 40
    {
        "slug": "opuntia-microdasys",
        "common_name": "Bunny Ears Cactus",
        "latin_name": "Opuntia microdasys",
        "family": "Cactaceae",
        "native_range": "Central and northern Mexico",
        "default_watering_days": 14,
        "default_light_level": "bright_direct",
        "light_min": "bright_indirect",
        "light_ideal": "bright_direct",
        "default_grow_medium": "soil",
        "toxicity": "non_toxic",
        "care_summary": "A desert cactus that needs full sun and sharply draining potting mix. Water only once the potting mix has dried out while it grows, and keep it dry in winter. It is not poisonous, but the tiny barbed bristles and spines injure mouths and paws, so keep it out of reach; handle it with folded newspaper.",
        "synonyms": ["Bunny ears", "Opuntia", "Polka-dot cactus"],
        "flags": {"introduced_widely": True},
        "citations": [
            {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/11881/opuntia-microdasys/details"},
            {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/tree-cactus"}
        ],
    },
]
