"""
Free-to-use photos (Wikimedia Commons, picked by eye from find_plant_photos.py output)
for the plants in the seeded test accounts, keyed by the common_name used in
seed_testing.py. getFileUrl() in the frontend passes http URLs through unchanged, so
these work without the object store.

Run `python seed_photos.py` to fill photo_url on the seeded users' plants that have
none. seed_testing.py also calls photo_fields() so a fresh seed includes them.

Weakest matches (Commons has few clean photos): Dracaena marginata (outdoor tree),
Monstera deliciosa (flower spathes). Swap in a better one by editing PHOTOS.
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

SEEDED_USERNAMES = (
    "mayagreens", "rootsandstems", "clarenolan_studio",
    # supporting grove members
    "mossandleaf", "rootandgrove", "ferngrove", "leaflight", "grovekeeper", "morningcuttings",
)

PHOTOS = {'Aloe Vera': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Cape_Town_%28ZA%29%2C_Table_Mountain%2C_Aloe_vera_--_2024_--_2869.jpg/960px-Cape_Town_%28ZA%29%2C_Table_Mountain%2C_Aloe_vera_--_2024_--_2869.jpg',
               'credit': 'Dietmar Rabich / Wikimedia Commons, CC BY-SA 4.0',
               'source': 'https://commons.wikimedia.org/wiki/File:Cape_Town_(ZA),_Table_Mountain,_Aloe_vera_--_2024_--_2869.jpg'},
 'Peace Lily': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Peace_lily_-_2.jpg/960px-Peace_lily_-_2.jpg',
                'credit': 'W.carter / Wikimedia Commons, CC BY-SA 4.0',
                'source': 'https://commons.wikimedia.org/wiki/File:Peace_lily_-_2.jpg'},
 'Pothos': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Epipremnum_aureum_31082012.jpg/960px-Epipremnum_aureum_31082012.jpg',
            'credit': 'Joydeep / Wikimedia Commons, CC BY-SA 3.0',
            'source': 'https://commons.wikimedia.org/wiki/File:Epipremnum_aureum_31082012.jpg'},
 'Rubber Plant': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Ficus_November_2008-1.jpg/960px-Ficus_November_2008-1.jpg',
                  'credit': 'Alvesgaspar (talk) / Wikimedia Commons, CC BY-SA 4.0',
                  'source': 'https://commons.wikimedia.org/wiki/File:Ficus_November_2008-1.jpg'},
 'Snake Plant': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Dracaena_trifasciata_177940020.jpg/960px-Dracaena_trifasciata_177940020.jpg',
                 'credit': '四角銅鑼 / Wikimedia Commons, CC BY 4.0',
                 'source': 'https://commons.wikimedia.org/wiki/File:Dracaena_trifasciata_177940020.jpg'},
 'Spider Plant': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Malamadre_%28Chlorophytum_comosum%29.jpg/960px-Malamadre_%28Chlorophytum_comosum%29.jpg',
                  'credit': 'Juan Carlos Fonseca Mata / Wikimedia Commons, CC BY-SA 4.0',
                  'source': 'https://commons.wikimedia.org/wiki/File:Malamadre_(Chlorophytum_comosum).jpg'},
 'Alocasia zebrina': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Alocasia_zebrina_1zz.jpg/960px-Alocasia_zebrina_1zz.jpg',
                      'credit': 'Photo by David J. Stang / Wikimedia Commons, CC BY-SA 4.0',
                      'source': 'https://commons.wikimedia.org/wiki/File:Alocasia_zebrina_1zz.jpg'},
 'Anthurium clarinervium': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Anthurium_clarinervium-3-Ien_house-yercaud-salem-India.jpg/960px-Anthurium_clarinervium-3-Ien_house-yercaud-salem-India.jpg',
                            'credit': 'Yercaud-elango / Wikimedia Commons, CC BY-SA 4.0',
                            'source': 'https://commons.wikimedia.org/wiki/File:Anthurium_clarinervium-3-Ien_house-yercaud-salem-India.jpg'},
 'Begonia maculata': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/%28MHNT%29_Begonia_maculata_-_young_leaf.jpg/960px-%28MHNT%29_Begonia_maculata_-_young_leaf.jpg',
                      'credit': 'Didier Descouens / Wikimedia Commons, CC BY-SA 4.0',
                      'source': 'https://commons.wikimedia.org/wiki/File:(MHNT)_Begonia_maculata_-_young_leaf.jpg'},
 'Calathea ornata': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Calathea_ornata_cc3.jpg/960px-Calathea_ornata_cc3.jpg',
                     'credit': 'Dinkum / Wikimedia Commons, CC0',
                     'source': 'https://commons.wikimedia.org/wiki/File:Calathea_ornata_cc3.jpg'},
 'Dracaena marginata': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Dracaena_reflexa.JPG/960px-Dracaena_reflexa.JPG',
                        'credit': 'No machine-readable author provided. B.navez assumed (based on copyright '
                                  'claims) / Wikimedia Commons, CC BY-SA 3.0',
                        'source': 'https://commons.wikimedia.org/wiki/File:Dracaena_reflexa.JPG'},
 'Fern (Asplenium)': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Asplenium-nidus-SF24240-01.jpg/960px-Asplenium-nidus-SF24240-01.jpg',
                      'credit': 'Steve Fitzgerald / Wikimedia Commons, CC BY-SA 4.0',
                      'source': 'https://commons.wikimedia.org/wiki/File:Asplenium-nidus-SF24240-01.jpg'},
 'Fiddle Leaf Fig': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Ficus_lyrata_98162192.jpg/960px-Ficus_lyrata_98162192.jpg',
                     'credit': 'Diogo Luiz / Wikimedia Commons, CC BY-SA 4.0',
                     'source': 'https://commons.wikimedia.org/wiki/File:Ficus_lyrata_98162192.jpg'},
 'Hoya carnosa': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Hoya_carnosa_-_umbel_with_nectar_droplets.jpg/960px-Hoya_carnosa_-_umbel_with_nectar_droplets.jpg',
                  'credit': 'Franz van Duns / Wikimedia Commons, CC BY-SA 4.0',
                  'source': 'https://commons.wikimedia.org/wiki/File:Hoya_carnosa_-_umbel_with_nectar_droplets.jpg'},
 'Hoya kerrii': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Hoya_kerrii_with_stems.jpg/960px-Hoya_kerrii_with_stems.jpg',
                 'credit': 'Tangopaso / Wikimedia Commons, CC BY-SA 3.0',
                 'source': 'https://commons.wikimedia.org/wiki/File:Hoya_kerrii_with_stems.jpg'},
 'Maranta leuconeura': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Maranta_leuconeura_%27Marisela%27.jpg/960px-Maranta_leuconeura_%27Marisela%27.jpg',
                        'credit': 'KATHERINE WAGNER-REISS / Wikimedia Commons, CC BY-SA 4.0',
                        'source': 'https://commons.wikimedia.org/wiki/File:Maranta_leuconeura_%27Marisela%27.jpg'},
 'Monstera Thai Constellation': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Monstera_deliciosa_variegata_-2-NRI_layout-bengaluru-India.jpg/960px-Monstera_deliciosa_variegata_-2-NRI_layout-bengaluru-India.jpg',
                                 'credit': 'Yercaud-elango / Wikimedia Commons, CC BY-SA 4.0',
                                 'source': 'https://commons.wikimedia.org/wiki/File:Monstera_deliciosa_variegata_-2-NRI_layout-bengaluru-India.jpg'},
 'Monstera deliciosa': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Monstera_deliciosa_-_Wilhelma_01.jpg/960px-Monstera_deliciosa_-_Wilhelma_01.jpg',
                        'credit': 'H. Zell / Wikimedia Commons, CC BY-SA 3.0',
                        'source': 'https://commons.wikimedia.org/wiki/File:Monstera_deliciosa_-_Wilhelma_01.jpg'},
 'Peperomia argyreia': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Peperomia_argyreia.jpg/960px-Peperomia_argyreia.jpg',
                        'credit': 'James Steakley / Wikimedia Commons, CC BY-SA 3.0',
                        'source': 'https://commons.wikimedia.org/wiki/File:Peperomia_argyreia.jpg'},
 'Peperomia obtusifolia': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Peperomia_obtusifolia%2C_Conservatorio_bot%C3%A1nico%2C_Fort_Wayne%2C_Indiana%2C_Estados_Unidos%2C_2012-11-12%2C_DD_01.jpg/960px-Peperomia_obtusifolia%2C_Conservatorio_bot%C3%A1nico%2C_Fort_Wayne%2C_Indiana%2C_Estados_Unidos%2C_2012-11-12%2C_DD_01.jpg',
                           'credit': 'Diego Delso / Wikimedia Commons, CC BY-SA 3.0',
                           'source': 'https://commons.wikimedia.org/wiki/File:Peperomia_obtusifolia,_Conservatorio_bot%C3%A1nico,_Fort_Wayne,_Indiana,_Estados_Unidos,_2012-11-12,_DD_01.jpg'},
 'Philodendron gloriosum': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Philodendrum_gloriosum_%2851662819210%29.jpg/960px-Philodendrum_gloriosum_%2851662819210%29.jpg',
                            'credit': 'Calmuziclover / Wikimedia Commons, CC BY 2.0',
                            'source': 'https://commons.wikimedia.org/wiki/File:Philodendrum_gloriosum_(51662819210).jpg'},
 'Philodendron micans': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Philodendron_hederaceum_kz1.jpg/960px-Philodendron_hederaceum_kz1.jpg',
                         'credit': 'Krzysztof Ziarnek, Kenraiz / Wikimedia Commons, CC BY-SA 4.0',
                         'source': 'https://commons.wikimedia.org/wiki/File:Philodendron_hederaceum_kz1.jpg'},
 'Pilea peperomioides': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pilea_peperomioides_Chinese_money_plant.jpg/960px-Pilea_peperomioides_Chinese_money_plant.jpg',
                         'credit': 'Husky / Wikimedia Commons, CC0',
                         'source': 'https://commons.wikimedia.org/wiki/File:Pilea_peperomioides_Chinese_money_plant.jpg'},
 'Rhaphidophora tetrasperma': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Rhapidophora_Tetrasperma.jpg/960px-Rhapidophora_Tetrasperma.jpg',
                               'credit': 'Jule.Kat / Wikimedia Commons, CC BY-SA 4.0',
                               'source': 'https://commons.wikimedia.org/wiki/File:Rhapidophora_Tetrasperma.jpg'},
 'Scindapsus pictus': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Scindapsus_pictus_2.jpg/960px-Scindapsus_pictus_2.jpg',
                       'credit': 'Umfassender / Wikimedia Commons, CC BY-SA 4.0',
                       'source': 'https://commons.wikimedia.org/wiki/File:Scindapsus_pictus_2.jpg'},
 'Syngonium podophyllum': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Syngonium_podophyllum_%28_Arrowhead_plant%29.jpg/960px-Syngonium_podophyllum_%28_Arrowhead_plant%29.jpg',
                           'credit': 'Stephanie cheks / Wikimedia Commons, CC BY-SA 4.0',
                           'source': 'https://commons.wikimedia.org/wiki/File:Syngonium_podophyllum_(_Arrowhead_plant).jpg'},
 'Tradescantia zebrina': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tradescantia_Zebrina_flower.jpg/960px-Tradescantia_Zebrina_flower.jpg',
                          'credit': 'Anak kampuang / Wikimedia Commons, CC BY-SA 4.0',
                          'source': 'https://commons.wikimedia.org/wiki/File:Tradescantia_Zebrina_flower.jpg'},
 'Eucalyptus': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Eucalyptus_Cinerea_%2840335349065%29.jpg/960px-Eucalyptus_Cinerea_%2840335349065%29.jpg',
                'credit': 'Steve McDonald / Wikimedia Commons, CC BY 2.0',
                'source': 'https://commons.wikimedia.org/wiki/File:Eucalyptus_Cinerea_(40335349065).jpg'},
 'Lavender': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Lavandula_angustifolia_in_Sedovo_1.jpg/960px-Lavandula_angustifolia_in_Sedovo_1.jpg',
              'credit': 'Andrey Butko / Wikimedia Commons, CC BY-SA 3.0',
              'source': 'https://commons.wikimedia.org/wiki/File:Lavandula_angustifolia_in_Sedovo_1.jpg'},
 'Olive tree': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Lun_olive_tree_1600_years.jpg/960px-Lun_olive_tree_1600_years.jpg',
                'credit': 'Palauenc05 / Wikimedia Commons, CC BY-SA 4.0',
                'source': 'https://commons.wikimedia.org/wiki/File:Lun_olive_tree_1600_years.jpg'},
 'Rose bush': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Pink_rose_bed_Easton_Lodge_Gardens_walled_garden_Little_Easton_Essex_England_01.jpg/960px-Pink_rose_bed_Easton_Lodge_Gardens_walled_garden_Little_Easton_Essex_England_01.jpg',
               'credit': 'Acabashi / Wikimedia Commons, CC BY-SA 4.0',
               'source': 'https://commons.wikimedia.org/wiki/File:Pink_rose_bed_Easton_Lodge_Gardens_walled_garden_Little_Easton_Essex_England_01.jpg'},
 'Succulent': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rosa_de_alabastro_%28Echeveria_elegans%29%2C_jard%C3%ADn_del_molino%2C_Sierra_de_San_Felipe%2C_Set%C3%BAbal%2C_Portugal%2C_2012-05-11%2C_DD_01.JPG/960px-Rosa_de_alabastro_%28Echeveria_elegans%29%2C_jard%C3%ADn_del_molino%2C_Sierra_de_San_Felipe%2C_Set%C3%BAbal%2C_Portugal%2C_2012-05-11%2C_DD_01.JPG',
               'credit': 'Diego Delso / Wikimedia Commons, CC BY-SA 3.0',
               'source': 'https://commons.wikimedia.org/wiki/File:Rosa_de_alabastro_(Echeveria_elegans),_jard%C3%ADn_del_molino,_Sierra_de_San_Felipe,_Set%C3%BAbal,_Portugal,_2012-05-11,_DD_01.JPG'}}



# Photos for seeded bouquets, florist portfolio pieces and posts. Keys are
# "bouquet:<name>", "portfolio:<title>" and "post:<username>". Clare's portfolio
# and bouquets share a few photos on purpose: they are the same studio's work.
SCENES = {'bouquet:Birthday flowers from mom': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Birthday_flower_bouquet_-_2021-08-26_-_Sarah_Stierch.jpg/960px-Birthday_flower_bouquet_-_2021-08-26_-_Sarah_Stierch.jpg',
                                       'credit': 'Missvain / Wikimedia Commons, CC BY 4.0',
                                       'source': 'https://commons.wikimedia.org/wiki/File:Birthday_flower_bouquet_-_2021-08-26_-_Sarah_Stierch.jpg'},
 "bouquet:Partner's birthday": {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Flickr_-_ronsaunders47_-_Birthday_bouquet..jpg/960px-Flickr_-_ronsaunders47_-_Birthday_bouquet..jpg',
                                'credit': 'Ronald Saunders from Warrington, UK / Wikimedia Commons, CC BY-SA '
                                          '2.0',
                                'source': 'https://commons.wikimedia.org/wiki/File:Flickr_-_ronsaunders47_-_Birthday_bouquet..jpg'},
 'bouquet:Housewarming': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bouquet_of_red_roses.jpg/960px-Bouquet_of_red_roses.jpg',
                          'credit': 'পাপৰি বৰা / Wikimedia Commons, CC BY-SA 4.0',
                          'source': 'https://commons.wikimedia.org/wiki/File:Bouquet_of_red_roses.jpg'},
 'bouquet:Sarah & James — Wedding': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Wedding-Flowers.jpg/960px-Wedding-Flowers.jpg',
                                     'credit': 'Djmuenchen s4l / Wikimedia Commons, CC BY-SA 4.0',
                                     'source': 'https://commons.wikimedia.org/wiki/File:Wedding-Flowers.jpg'},
 'bouquet:Emma Thompson — Birthday': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Rose_bouquet%2C_D%C3%B6hren.jpg/960px-Rose_bouquet%2C_D%C3%B6hren.jpg',
                                      'credit': 'Gerda Arendt / Wikimedia Commons, CC0',
                                      'source': 'https://commons.wikimedia.org/wiki/File:Rose_bouquet,_D%C3%B6hren.jpg'},
 'bouquet:Harrington Corporate — Monday': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Tropical_flower_arrangement_wedding.jpg/960px-Tropical_flower_arrangement_wedding.jpg',
                                           'credit': 'Photo by and (c)2007 Jina Lee / Wikimedia Commons, CC '
                                                     'BY-SA 3.0',
                                           'source': 'https://commons.wikimedia.org/wiki/File:Tropical_flower_arrangement_wedding.jpg'},
 'bouquet:Past Wedding 1': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Decorative_flowers_and_fruits_on_the_wedding_table_with_blurry_background.jpg/960px-Decorative_flowers_and_fruits_on_the_wedding_table_with_blurry_background.jpg',
                            'credit': 'Shixart1985 / Wikimedia Commons, CC BY 2.0',
                            'source': 'https://commons.wikimedia.org/wiki/File:Decorative_flowers_and_fruits_on_the_wedding_table_with_blurry_background.jpg'},
 'bouquet:Past Anniversary': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Red_roses_from_bouquet_2.jpg/960px-Red_roses_from_bouquet_2.jpg',
                              'credit': 'Montanabw / Wikimedia Commons, CC BY-SA 4.0',
                              'source': 'https://commons.wikimedia.org/wiki/File:Red_roses_from_bouquet_2.jpg'},
 'bouquet:Past Corporate': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg/960px-DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg',
                            'credit': 'PattayaPatrol / Wikimedia Commons, CC BY-SA 4.0',
                            'source': 'https://commons.wikimedia.org/wiki/File:DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg'},
 'portfolio:Spring Wedding Arch': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/DSCN0136_-_Flickr_-_Shward.jpg/960px-DSCN0136_-_Flickr_-_Shward.jpg',
                                   'credit': 'Josh Ward from Eugene, Oregon, USA / Wikimedia Commons, CC BY '
                                             '2.0',
                                   'source': 'https://commons.wikimedia.org/wiki/File:DSCN0136_-_Flickr_-_Shward.jpg'},
 'portfolio:Editorial Shoot — Vogue': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg/960px-DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg',
                                       'credit': 'PattayaPatrol / Wikimedia Commons, CC BY-SA 4.0',
                                       'source': 'https://commons.wikimedia.org/wiki/File:DFC_2281_Two_small_potted_cacti_with_rounded_clustered_forms_sit_side_by_side_on_a_windowsill_a_calm_seaside_view_blurred_in_the_background.jpg'},
 'portfolio:Corporate Event — Tech Launch': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Tropical_flower_arrangement_wedding.jpg/960px-Tropical_flower_arrangement_wedding.jpg',
                                             'credit': 'Photo by and (c)2007 Jina Lee / Wikimedia Commons, '
                                                       'CC BY-SA 3.0',
                                             'source': 'https://commons.wikimedia.org/wiki/File:Tropical_flower_arrangement_wedding.jpg'},
 'post:rootsandstems': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Anthurium_waroqueanum.JPG/960px-Anthurium_waroqueanum.JPG',
                        'credit': 'Pajast / Wikimedia Commons, Public domain',
                        'source': 'https://commons.wikimedia.org/wiki/File:Anthurium_waroqueanum.JPG'},
 'post:clarenolan_studio': {'url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Eustoma_russellianum_cultivar_1DS-II_3-7672.jpg/960px-Eustoma_russellianum_cultivar_1DS-II_3-7672.jpg',
                            'credit': 'SAplants / Wikimedia Commons, CC BY-SA 4.0',
                            'source': 'https://commons.wikimedia.org/wiki/File:Eustoma_russellianum_cultivar_1DS-II_3-7672.jpg'}}

# Names the seed data uses for plants that share a photo with another entry.
ALIASES = {"Chlorophytum comosum": "Spider Plant", "Monstera": "Monstera deliciosa"}


def photo_fields(common_name):
    """Extra plant-document fields for a seeded plant; empty when there is no photo."""
    p = PHOTOS.get(ALIASES.get(common_name, common_name))
    return {"photo_url": p["url"], "photo_credit": p["credit"]} if p else {}


def scene_fields(kind, key):
    """photo_url + photo_credit for a seeded bouquet, portfolio item or post; {} if none."""
    p = SCENES.get(f"{kind}:{key}")
    return {"photo_url": p["url"], "photo_credit": p["credit"]} if p else {}


async def main():
    load_dotenv(Path(__file__).parent / ".env")
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ.get("DB_NAME", "grove_db")]
    updated = missing = 0
    for username in SEEDED_USERNAMES:
        user = await db.users.find_one({"username": username})
        if not user:
            print(f"  @{username}: not found, skipped")
            continue
        async for plant in db.plants.find({"user_id": user["id"], "$or": [{"photo_url": ""}, {"photo_url": None}]}):
            fields = photo_fields(plant["common_name"])
            if not fields:
                missing += 1
                print(f"  no photo for '{plant['common_name']}' (@{username})")
                continue
            await db.plants.update_one({"id": plant["id"]}, {"$set": fields})
            updated += 1
    print(f"\nUpdated {updated} plants, {missing} without a matching photo.")

    scenes = 0
    for coll, kind, field in (("bouquets", "bouquet", "name"), ("portfolio_items", "portfolio", "title")):
        async for doc in db[coll].find({"$or": [{"photo_url": ""}, {"photo_url": None}]}):
            fields = scene_fields(kind, doc.get(field))
            if fields:
                await db[coll].update_one({"id": doc["id"]}, {"$set": fields})
                scenes += 1
    for username in ("rootsandstems", "clarenolan_studio"):
        user = await db.users.find_one({"username": username})
        post = user and await db.posts.find_one({"user_id": user["id"], "$or": [{"photo_url": ""}, {"photo_url": None}]})
        if post:
            await db.posts.update_one({"id": post["id"]}, {"$set": scene_fields("post", username)})
            scenes += 1
    print(f"Updated {scenes} bouquets, portfolio items and posts.")


if __name__ == "__main__":
    asyncio.run(main())
