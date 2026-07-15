"""
Import curated botanical illustrations from Wikimedia Commons for all species.
Each species gets a hand-drawn/painted botanical plate as its primary illustration.
Wikipedia photos remain as gallery images.
"""
import asyncio
import os
import hashlib
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# Curated botanical illustrations — best plate per species from Wikimedia Commons
# Format: slug -> {url, thumb_url, title, license, source}
# Thumb URLs use Wikimedia's /thumb/ pattern at 500px width

def commons_thumb(full_url, width=500):
    """Generate a Wikimedia Commons thumbnail URL from a full image URL."""
    # Pattern: .../commons/X/XX/Filename -> .../commons/thumb/X/XX/Filename/{width}px-Filename
    if "/commons/" not in full_url:
        return full_url
    parts = full_url.split("/commons/")
    if len(parts) != 2:
        return full_url
    path = parts[1]  # e.g. "e/e8/Filename.jpg"
    filename = path.split("/")[-1]
    return f"{parts[0]}/commons/thumb/{path}/{width}px-{filename}"


ILLUSTRATIONS = {
    "monstera-deliciosa": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e8/Monstera_deliciosa_libostrom_zpror%C3%A1%C5%BEen%C3%BD_Vesm%C3%ADr_1875.jpg",
        "title": "Monstera deliciosa, Vesmír 1875",
        "license": "Public domain",
    },
    "epipremnum-aureum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Epipremnum_aureum_as_Pothos_aureus.jpg",
        "title": "Epipremnum aureum (as Pothos aureus) botanical plate",
        "license": "Public domain",
    },
    "dracaena-trifasciata": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Sansevieria_zeylanica_Blanco2.422-cropped.jpg",
        "title": "Sansevieria zeylanica, Flora de Filipinas (Blanco)",
        "license": "Public domain",
    },
    "chlorophytum-comosum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/00/Archives_de_l%27Institut_botanique_de_l%27Universit_de_Lige%22_%281897-%29_%2819565989829%29.jpg",
        "title": "Chlorophytum comosum, Archives de l'Institut botanique (1897)",
        "license": "No restrictions",
    },
    "aloe-vera": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Illustration_from_Medical_Botany%2C_digitally_enhanced_from_rawpixel%27s_own_original_plates_173.jpg",
        "title": "Aloe vera, Medical Botany illustration",
        "license": "CC BY-SA 4.0",
    },
    "anthurium-warocqueanum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/94/Anthurium_waroqueanum.JPG",
        "title": "Anthurium warocqueanum botanical illustration",
        "license": "Public domain",
    },
    "zamioculcas-zamiifolia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Zamioculcas_zamiifolia_CBM.png",
        "title": "Zamioculcas zamiifolia, Curtis's Botanical Magazine",
        "license": "Public domain",
    },
    "ficus-elastica": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/84/Ficus_elastica_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-206.jpg",
        "title": "Ficus elastica, Köhler's Medizinal-Pflanzen",
        "license": "Public domain",
    },
    "ficus-lyrata": {
        # No direct illustration found — use the Naturalis Ficus elastica artwork as closest relative
        # Will try a targeted search separately
        "url": None,
        "title": None,
        "license": None,
    },
    "goeppertia-orbifolia": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Goeppertia_pavonii_-_illustration.jpg",
        "title": "Goeppertia pavonii botanical illustration (related species)",
        "license": "Public domain",
    },
    "strelitzia-reginae": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/31/The_Botanical_Magazine%2C_Plate_119_%28Volume_4%2C_1791%29.png",
        "title": "Strelitzia reginae, The Botanical Magazine Plate 119 (1791)",
        "license": "Public domain",
    },
    "rudbeckia-hirta": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/39/Field_book_of_American_wild_flowers_%28Colored_Plate_23%29_%286263088925%29.jpg",
        "title": "Rudbeckia hirta, Field Book of American Wild Flowers (Colored Plate 23)",
        "license": "Public domain",
    },
    "hedera-helix": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Billeder_af_nordens_flora_%28Plate_249%29_BHL10459699.jpg",
        "title": "Hedera helix, Billeder af Nordens Flora Plate 249",
        "license": "Public domain",
    },
    "eucalyptus-polyanthemos": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Eucalyptus_cinerea_from_%22A_critical_revision_of_the_genus_Eucalyptus%22_%281903%29_%2820088927024%29.jpg",
        "title": "Eucalyptus cinerea, A Critical Revision of the Genus Eucalyptus (1903)",
        "license": "No restrictions",
    },
    "eustoma-grandiflorum": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/13/%28Lisianthus%29%2C_da_Cole%C3%A7%C3%A3o_Brasiliana_Iconogr%C3%A1fica.jpg",
        "title": "Lisianthus, Coleção Brasiliana Iconográfica",
        "license": "Public domain",
    },
    "anemone-coronaria": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/80/WitteHeinrichFlora1868-051-Anemone_coronaria.png",
        "title": "Anemone coronaria, Witte Heinrich Flora (1868)",
        "license": "Public domain",
    },
    "hoya-carnosa": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Curtis%27s_botanical_magazine_%28No._788%29_%288470972612%29.jpg",
        "title": "Hoya carnosa, Curtis's Botanical Magazine No. 788",
        "license": "Public domain",
    },
    "curio-rowleyanus": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/81/Curtis%27s_botanical_magazine_%28Plate_3487%29_%288043247828%29.jpg",
        "title": "Senecio species, Curtis's Botanical Magazine Plate 3487",
        "license": "Public domain",
    },
    "nephrolepis-exaltata": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/09/The_native_flowers_and_ferns_of_the_United_States_in_their_botanical%2C_horticultural_and_popular_aspects_%281879%29_%2814777970541%29.jpg",
        "title": "Nephrolepis exaltata, Native Flowers and Ferns of the United States (1879)",
        "license": "No restrictions",
    },
    "crassula-ovata": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/83/The_Botanical_Magazine%2C_Plate_384_%28Volume_11%2C_1797%29.png",
        "title": "Crassula ovata, The Botanical Magazine Plate 384 (1797)",
        "license": "Public domain",
    },
    "dahlia-cafe-au-lait": {
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/7b/WitteHeinrichFlora1868-064-Dahlia_pinnata.png",
        "title": "Dahlia pinnata, Witte Heinrich Flora (1868)",
        "license": "Public domain",
    },
}


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "grove_db")]

    species_list = await db.species.find({}).to_list(100)
    print(f"Found {len(species_list)} species\n")

    updated = 0
    skipped_bhl = 0
    skipped_none = 0

    for s in species_list:
        slug = s.get("slug", "")
        name = s.get("common_name", slug)

        # Species that already have curated BHL plates — keep those
        if s.get("bhl_primary_thumbnail") and s.get("bhl_illustrations"):
            print(f"  {name}: SKIP (already has BHL plate)")
            skipped_bhl += 1
            continue

        illo = ILLUSTRATIONS.get(slug)
        if not illo or not illo.get("url"):
            print(f"  {name}: SKIP (no illustration selected for slug '{slug}')")
            skipped_none += 1
            continue

        full_url = illo["url"]
        thumb_url = commons_thumb(full_url, 500)

        await db.species.update_one(
            {"id": s["id"]},
            {"$set": {
                "botanical_illustration": full_url,
                "botanical_illustration_thumb": thumb_url,
                "botanical_illustration_title": illo["title"],
                "botanical_illustration_license": illo["license"],
                "botanical_illustration_source": "wikimedia_commons",
            }},
        )
        print(f"  {name}: OK — {illo['title']}")
        updated += 1

    print(f"\nDone: {updated} updated, {skipped_bhl} kept BHL, {skipped_none} skipped (no illustration)")


if __name__ == "__main__":
    asyncio.run(main())
