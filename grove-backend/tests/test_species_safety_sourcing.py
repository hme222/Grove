import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from species_safety import has_toxicity_source, scrub_species, sourced_toxicity  # noqa: E402

ASPCA = {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/x"}
RHS = {"label": "Royal Horticultural Society", "url": "https://www.rhs.org.uk/plants/1/x"}


def test_a_value_counts_only_with_an_aspca_citation():
    assert sourced_toxicity({"toxicity": "non_toxic", "citations": [RHS, ASPCA]}) == "non_toxic"
    assert sourced_toxicity({"toxicity": "toxic", "citations": [ASPCA]}) == "toxic"
    assert sourced_toxicity({"toxicity": "toxic", "citations": [RHS]}) is None
    assert sourced_toxicity({"toxicity": "non_toxic"}) is None


def test_grove_does_not_grade_toxicity_itself():
    assert sourced_toxicity({"toxicity": "mild", "citations": [ASPCA]}) is None
    assert sourced_toxicity({"toxicity": "non-toxic", "citations": [ASPCA]}) is None
    assert sourced_toxicity({}) is None and sourced_toxicity(None) is None


def test_scrub_returns_a_copy_with_unsourced_values_removed():
    doc = {"common_name": "Pothos", "toxicity": "mild", "citations": [RHS]}
    out = scrub_species(doc)
    assert out["toxicity"] is None and out["common_name"] == "Pothos"
    assert doc["toxicity"] == "mild"  # the input is untouched
    assert scrub_species(None) is None
    assert has_toxicity_source({"citations": [ASPCA]}) and not has_toxicity_source({"citations": []})
