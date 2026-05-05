"""
Phase 14B.2 — Curated companion plant pairings.

Maps each species slug → list of {companion_slug, reasoning}. Companions
are rendered on the species detail page as "Pairs well with" with the
short reasoning surfaced inline. Pairings are intentionally bidirectional
(if A pairs with B, B pairs with A) but the reasoning may differ depending
on which species is the focal point.
"""

COMPANIONS = {
    # 1. Monstera
    "monstera-deliciosa": [
        {"slug": "epipremnum-aureum", "reasoning": "Both Araceae enjoy the same medium light and weekly water — Pothos drapes from the moss pole as Monstera climbs."},
        {"slug": "spathiphyllum-wallisii", "reasoning": "Peace Lily fills the floor space below; both prefer evenly moist soil and the same indirect-light corner."},
        {"slug": "ficus-elastica", "reasoning": "A Rubber Plant nearby gives vertical contrast and shares the bright-indirect zone without competing for water."},
    ],
    # 2. Pothos
    "epipremnum-aureum": [
        {"slug": "monstera-deliciosa", "reasoning": "Climbing aroid pair — Monstera goes up the pole, Pothos trails down the planter edge."},
        {"slug": "dracaena-trifasciata", "reasoning": "Snake Plant and Pothos share the most forgiving low-light shelf in the house — a low-stress beginner cluster."},
        {"slug": "zamioculcas-zamiifolia", "reasoning": "ZZ's structural upright form anchors the trailing Pothos; both tolerate erratic watering schedules."},
    ],
    # 3. Snake Plant
    "dracaena-trifasciata": [
        {"slug": "zamioculcas-zamiifolia", "reasoning": "Two architectural low-water uprights — ideal for a forget-to-water hallway."},
        {"slug": "epipremnum-aureum", "reasoning": "Pothos trailing past Snake Plant's vertical sword-leaves is a low-light interior staple."},
        {"slug": "crassula-ovata", "reasoning": "Both store water in their tissues and want the same dry-then-soak rhythm."},
    ],
    # 4. Spider Plant
    "chlorophytum-comosum": [
        {"slug": "epipremnum-aureum", "reasoning": "Two prolific propagators that share light requirements — clip a baby of each into the same starter pot for a friend."},
        {"slug": "nephrolepis-exaltata", "reasoning": "Boston Fern and Spider Plant make a hanging duo — both like indirect light and consistent moisture."},
    ],
    # 5. Aloe vera
    "aloe-vera": [
        {"slug": "crassula-ovata", "reasoning": "Two desert succulents that share the brightest windowsill and a 14-day water rhythm."},
        {"slug": "curio-rowleyanus", "reasoning": "Trailing String of Pearls beside upright Aloe makes a sun-loving succulent shelf."},
    ],
    # 6. Peace Lily
    "spathiphyllum-wallisii": [
        {"slug": "nephrolepis-exaltata", "reasoning": "Both crave the same humid, evenly-moist conditions — group them and they'll share a microclimate."},
        {"slug": "goeppertia-orbifolia", "reasoning": "Peace Lily and Calathea both want filtered light and consistently moist soil — they reinforce each other's humidity."},
        {"slug": "monstera-deliciosa", "reasoning": "Peace Lily fills the lower canopy under a climbing Monstera in the same indirect-light zone."},
    ],
    # 7. Pink Princess
    "philodendron-pink-princess": [
        {"slug": "anthurium-warocqueanum", "reasoning": "Two collector aroids that demand the same bright-indirect light and chunky aroid mix — group for shared humidity."},
        {"slug": "monstera-deliciosa", "reasoning": "Family-mate that can host a moss pole nearby; the green deliciosa offsets PPP's pink variegation beautifully."},
    ],
    # 8. Anthurium warocqueanum
    "anthurium-warocqueanum": [
        {"slug": "goeppertia-orbifolia", "reasoning": "Two humidity-dependent specimens — pair them inside an enclosed cabinet to stabilize 70%+ humidity."},
        {"slug": "philodendron-pink-princess", "reasoning": "Both want the same chunky aroid mix and bright-indirect light — share substrate, share microclimate."},
        {"slug": "nephrolepis-exaltata", "reasoning": "Boston Fern under the Queen Anthurium acts as a living humidifier."},
    ],
    # 9. ZZ Plant
    "zamioculcas-zamiifolia": [
        {"slug": "dracaena-trifasciata", "reasoning": "Both store water in rhizomes and tolerate low light — the most forgiving shelf in any home."},
        {"slug": "epipremnum-aureum", "reasoning": "ZZ structures the upright; Pothos drapes — both forgive forgetful watering."},
    ],
    # 10. Rubber Plant
    "ficus-elastica": [
        {"slug": "ficus-lyrata", "reasoning": "Two Ficus trees that share the same bright-indirect spot; their leaf shapes contrast as living sculpture."},
        {"slug": "strelitzia-reginae", "reasoning": "Rubber Plant + Bird of Paradise = a bold, statement-tree corner with shared bright-light needs."},
    ],
    # 11. Fiddle-leaf Fig
    "ficus-lyrata": [
        {"slug": "ficus-elastica", "reasoning": "Sibling Ficus species that handle the same conditions — pair them and the gap when one sulks is filled by the other."},
        {"slug": "strelitzia-reginae", "reasoning": "Both want bright direct light and a stable home; together they make a dramatic large-leaf trio."},
    ],
    # 12. Calathea Orbifolia
    "goeppertia-orbifolia": [
        {"slug": "nephrolepis-exaltata", "reasoning": "Both want filtered light and high humidity — Boston Fern boosts ambient moisture for Calathea's tap-water-sensitive leaves."},
        {"slug": "spathiphyllum-wallisii", "reasoning": "Peace Lily and Calathea share the medium-light, evenly-moist regime."},
        {"slug": "anthurium-warocqueanum", "reasoning": "Both are humidity-cabinet candidates — group for stable 70%+."},
    ],
    # 13. Bird of Paradise
    "strelitzia-reginae": [
        {"slug": "ficus-lyrata", "reasoning": "Both architectural large-leaf trees that want the brightest spot in the house."},
        {"slug": "ficus-elastica", "reasoning": "Bold-leaved companions for a sun-drenched corner — same watering rhythm."},
    ],
    # 14. Black-eyed Susan
    "rudbeckia-hirta": [
        {"slug": "echinacea-purpurea", "reasoning": "The two iconic native prairie perennials — bloom sequentially through summer, feed the same pollinators."},
    ],
    # 15. Coneflower
    "echinacea-purpurea": [
        {"slug": "rudbeckia-hirta", "reasoning": "Black-eyed Susan and Coneflower together is the foundational native pollinator combination — overlapping bloom times, shared pollinator guild."},
    ],
    # 16. English Ivy — invasive; surface natives instead, no companions recommended
    "hedera-helix": [],
    # 17. Garden Rose 'Juliet'
    "rosa-juliet-ausjameson": [
        {"slug": "eucalyptus-polyanthemos", "reasoning": "The classic florist pairing — Eucalyptus foliage is the silver foil that makes Juliet's apricot bloom sing."},
        {"slug": "dahlia-cafe-au-lait", "reasoning": "Both blush-toned cut-flower stars; they share a vase beautifully and bloom in overlapping windows."},
        {"slug": "eustoma-grandiflorum", "reasoning": "Lisianthus's smaller blooms infill around the rose's bigger statement heads."},
    ],
    # 18. Silver Dollar Eucalyptus
    "eucalyptus-polyanthemos": [
        {"slug": "rosa-juliet-ausjameson", "reasoning": "Eucalyptus is the foliage backbone of any rose-led arrangement; the silver leaves frame Juliet."},
        {"slug": "dahlia-cafe-au-lait", "reasoning": "Café au Lait dahlias against silver eucalyptus is the single most photographed wedding-bouquet combination."},
        {"slug": "anemone-coronaria", "reasoning": "Anemones tucked into eucalyptus cuts give a moody, painterly arrangement."},
    ],
    # 19. Lisianthus
    "eustoma-grandiflorum": [
        {"slug": "rosa-juliet-ausjameson", "reasoning": "Lisianthus reads like a rose's smaller sister — they layer naturally in mixed bouquets."},
        {"slug": "anemone-coronaria", "reasoning": "Cool-season cut-flower pair — both have long vase lives and share a planting window."},
        {"slug": "dahlia-cafe-au-lait", "reasoning": "Lisianthus and Dahlia bloom in succession; one bridges into the other through the season."},
    ],
    # 20. Anemone
    "anemone-coronaria": [
        {"slug": "eustoma-grandiflorum", "reasoning": "Cool-season pair — anemones bloom early, lisianthus picks up as anemones fade."},
        {"slug": "rosa-juliet-ausjameson", "reasoning": "Anemones at the rose's feet give a wild, low-mounding contrast to upright rose stems."},
    ],
    # 21. Hoya
    "hoya-carnosa": [
        {"slug": "curio-rowleyanus", "reasoning": "Two trailing succulents/semi-succulents — String of Pearls beside Hoya makes a layered hanging duo."},
        {"slug": "epipremnum-aureum", "reasoning": "Hoya and Pothos share light needs and a relaxed watering schedule — both reward neglect."},
    ],
    # 22. String of Pearls
    "curio-rowleyanus": [
        {"slug": "crassula-ovata", "reasoning": "Two South African succulents that share the same bone-dry-then-soak rhythm and bright light."},
        {"slug": "hoya-carnosa", "reasoning": "Hanging-pot pair — pearls trail, Hoya drapes its waxy leaves."},
    ],
    # 23. Boston Fern
    "nephrolepis-exaltata": [
        {"slug": "spathiphyllum-wallisii", "reasoning": "Peace Lily and Boston Fern reinforce each other's humidity needs — both sulk in dry air."},
        {"slug": "goeppertia-orbifolia", "reasoning": "Both want filtered light and high humidity; group inside a humidity cabinet."},
    ],
    # 24. Jade Plant
    "crassula-ovata": [
        {"slug": "aloe-vera", "reasoning": "Classic succulent pair — both want the brightest window and a 14-day soak."},
        {"slug": "curio-rowleyanus", "reasoning": "Upright Jade with trailing Pearls makes a sculptural succulent shelf."},
    ],
    # 25. Dahlia 'Café au Lait'
    "dahlia-cafe-au-lait": [
        {"slug": "rosa-juliet-ausjameson", "reasoning": "Two blush-toned dinner-plate stars — together they're the wedding-bouquet of the decade."},
        {"slug": "eucalyptus-polyanthemos", "reasoning": "Eucalyptus foliage is what holds a Café au Lait arrangement together; without it the dahlia floats."},
        {"slug": "eustoma-grandiflorum", "reasoning": "Lisianthus underplants nicely around dahlias and shares the same cutting rhythm."},
    ],
}
