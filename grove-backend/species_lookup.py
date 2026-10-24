"""Match a plant to Grove's species guide by name.

Plants added by typing a name have no species link, so the guide is matched by Latin name first and
then by common name (case-insensitive, exact). No match means "unknown", never a guess.
"""


def name_index(species_docs, field):
    """{lowercase latin or common name: the species' value for `field`}."""
    index = {}
    for sp in species_docs:
        for key in (sp.get("latin_name"), sp.get("common_name")):
            if key:
                index[key.strip().lower()] = sp.get(field)
    return index


def lookup(plant, index):
    """The indexed value for this plant, or None when its names are not in the guide."""
    for key in (plant.get("latin_name"), plant.get("common_name")):
        if key and key.strip().lower() in index:
            return index[key.strip().lower()]
    return None
