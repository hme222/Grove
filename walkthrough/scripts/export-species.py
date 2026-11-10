"""Re-export the demo's species fixture from the real curated list. Run after grove-backend/curated_species.py changes:
    python3 scripts/export-species.py
Pet safety is exported exactly as the backend serves it: only values with an ASPCA citation behind them."""
import json
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, "..", "grove-backend"))
from curated_species import CURATED_SPECIES  # noqa: E402
from species_safety import scrub_species  # noqa: E402

out = [{**scrub_species(s), "id": f"sp_{s['slug']}"} for s in CURATED_SPECIES]
for s in out:
    if s.get("toxicity") is None:
        s.pop("toxicity", None)
with open(os.path.join(root, "fixtures", "species.json"), "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"exported {len(out)} species; with a sourced toxicity value: {sum(1 for s in out if 'toxicity' in s)}")
