"""Species artwork is served only when its license has been checked against the source's own record.

Three kinds of image can sit on a species record, and each is filtered here on the way out (the database is not changed):

- Botanical plates from Wikimedia Commons (`botanical_illustration*`). Served only for the files in VERIFIED_PLATES,
  whose license and author were read from each file's own Commons record on 2026-11-20.
- Biodiversity Heritage Library plates (`bhl_*`). BHL sets copyright status per volume and some volumes of the same
  journal are in copyright with a non-commercial license. A page is served only when its ID is in
  VERIFIED_BHL_PAGES. None has been read yet, so no BHL plate is served. To add one, open
  biodiversitylibrary.org/page/<id>, read "Copyright & Usage", and add it only if the status is public domain.
- The older Wikipedia lead image (`wiki_image`, `wiki_thumbnail`), which carried one blanket license label.
  species_safety.scrub_species replaces it with the credited photo from species_photos.json; a species with no
  credited photo gets no photo.
"""
from urllib.parse import unquote

COMMONS = "Wikimedia Commons"

# slug -> the Commons file name it was verified for, with the license and author from that file's Commons record.
VERIFIED_PLATES = {
    "monstera-deliciosa": ("Monstera_deliciosa_libostrom_zprorážený_Vesmír_1875.jpg", "Public domain", "Unknown author, Vesmír (1875)"),
    "epipremnum-aureum": ("Epipremnum_aureum_as_Pothos_aureus.jpg", "Public domain", "Unknown author, L’Illustration horticole (1871)"),
    "dracaena-trifasciata": ("Sansevieria_zeylanica_Blanco2.422-cropped.jpg", "Public domain", "Francisco Manuel Blanco"),
    "chlorophytum-comosum": ("Archives_de_l'Institut_botanique_de_l'Universit_de_Lige\"_(1897-)_(19565989829).jpg", "No known copyright restrictions", "Internet Archive Book Images"),
    "aloe-vera": ("Illustration_from_Medical_Botany,_digitally_enhanced_from_rawpixel's_own_original_plates_173.jpg", "CC BY-SA 4.0", "Rawpixel"),
    "anthurium-warocqueanum": ("Anthurium_waroqueanum.JPG", "Public domain", "Pajast"),
    "zamioculcas-zamiifolia": ("Zamioculcas_zamiifolia_CBM.png", "Public domain", "W. Fitch"),
    "ficus-elastica": ("Ficus_elastica_-_Köhler–s_Medizinal-Pflanzen-206.jpg", "Public domain", "Köhler’s Medizinal-Pflanzen (1897)"),
    "goeppertia-orbifolia": ("Goeppertia_pavonii_-_illustration.jpg", "Public domain", "W. H. Fitch"),
    "strelitzia-reginae": ("The_Botanical_Magazine,_Plate_119_(Volume_4,_1791).png", "Public domain", "William Curtis"),
    "rudbeckia-hirta": ("Field_book_of_American_wild_flowers_(Colored_Plate_23)_(6263088925).jpg", "Public domain", "Ferdinand Schuyler Mathews"),
    "hedera-helix": ("Billeder_af_nordens_flora_(Plate_249)_BHL10459699.jpg", "Public domain", "August Mentz and C. H. Ostenfeld"),
    "eucalyptus-polyanthemos": ("Eucalyptus_cinerea_from_\"A_critical_revision_of_the_genus_Eucalyptus\"_(1903)_(20088927024).jpg", "No known copyright restrictions", "J. H. Maiden"),
    "eustoma-grandiflorum": ("(Lisianthus),_da_Coleção_Brasiliana_Iconográfica.jpg", "Public domain", "Unknown author"),
    "anemone-coronaria": ("WitteHeinrichFlora1868-051-Anemone_coronaria.png", "Public domain", "Abraham Jacobus Wendel"),
    "hoya-carnosa": ("Curtis's_botanical_magazine_(No._788)_(8470972612).jpg", "Public domain", "Curtis’s Botanical Magazine (1805)"),
    "curio-rowleyanus": ("Curtis's_botanical_magazine_(Plate_3487)_(8043247828).jpg", "Public domain", "Curtis’s Botanical Magazine (1836)"),
    "nephrolepis-exaltata": ("The_native_flowers_and_ferns_of_the_United_States_in_their_botanical,_horticultural_and_popular_aspects_(1879)_(14777970541).jpg", "No known copyright restrictions", "Internet Archive Book Images"),
    "crassula-ovata": ("The_Botanical_Magazine,_Plate_384_(Volume_11,_1797).png", "Public domain", "William Curtis"),
    "dahlia-cafe-au-lait": ("WitteHeinrichFlora1868-064-Dahlia_pinnata.png", "Public domain", "Abraham Jacobus Wendel"),
}

# BHL page IDs whose own "Copyright & Usage" line has been read and says public domain. Empty until someone reads them.
VERIFIED_BHL_PAGES = frozenset()

PLATE_FIELDS = ("botanical_illustration", "botanical_illustration_thumb", "botanical_illustration_title",
                "botanical_illustration_license", "botanical_illustration_source", "botanical_illustration_credit")
BHL_PRIMARY_FIELDS = ("bhl_primary_illustration", "bhl_primary_thumbnail")
UNCREDITED_PHOTO_FIELDS = ("wiki_image", "wiki_thumbnail", "wiki_image_license")


def _file_name(url):
    return unquote((url or "").rsplit("/", 1)[-1])


def scrub_art(out, slug, has_credited_photo):
    """Remove artwork whose license has not been verified from `out` (a species dict being sent to the app), in place."""
    plate = VERIFIED_PLATES.get(slug)
    if out.get("botanical_illustration") and plate and _file_name(out["botanical_illustration"]) == plate[0]:
        out["botanical_illustration_license"] = plate[1]
        out["botanical_illustration_credit"] = f"{plate[2]}, via {COMMONS}"
    else:
        for field in PLATE_FIELDS:
            out.pop(field, None)

    if "bhl_illustrations" in out or any(f in out for f in BHL_PRIMARY_FIELDS):
        kept = [p for p in out.get("bhl_illustrations") or [] if isinstance(p, dict) and p.get("page_id") in VERIFIED_BHL_PAGES]
        out["bhl_illustrations"] = kept
        out["bhl_illustration_count"] = len(kept)
        out["bhl_primary_illustration"] = kept[0].get("full_image_url") if kept else None
        out["bhl_primary_thumbnail"] = kept[0].get("thumbnail_url") if kept else None

    if not has_credited_photo:
        for field in UNCREDITED_PHOTO_FIELDS:
            out.pop(field, None)
    return out
