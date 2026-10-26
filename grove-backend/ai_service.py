import os
import json
import re
import logging
from datetime import datetime, timezone
from typing import Optional
import anthropic

logger = logging.getLogger(__name__)

client = anthropic.AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

async def call_claude(system_message: str, prompt: str, model: str = "claude-sonnet-4-6") -> str:
    american_suffix = (
        " Write in American English. Use American spellings (color not colour, "
        "favorite not favourite, organize not organise, center not centre, "
        "analyze not analyse). Tone: warm, knowledgeable, appropriate for "
        "American plant enthusiasts."
    )
    if "American English" not in system_message:
        system_message = system_message.rstrip() + american_suffix
    try:
        response = await client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_message,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        raise

async def call_claude_vision(system_message: str, prompt: str, image_base64: str, model: str = "claude-sonnet-4-6") -> str:
    american_suffix = (
        " Write in American English. Use American spellings (color not colour, "
        "favorite not favourite, organize not organise, center not centre, "
        "analyze not analyse). Tone: warm, knowledgeable, appropriate for "
        "American plant enthusiasts."
    )
    if "American English" not in system_message:
        system_message = system_message.rstrip() + american_suffix
    try:
        response = await client.messages.create(
            model=model,
            max_tokens=1024,
            system=system_message,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Claude Vision API error: {e}")
        raise

def parse_json_response(response: str) -> dict:
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        json_match = re.search(r'(\[.*\])', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        raise ValueError(f"Could not parse JSON from response: {response[:200]}")

MIN_WATERING_DAYS = 3
MAX_WATERING_DAYS = 28
SCHEDULE_REASON = "Check the soil first; treat this as a reminder to check, not a command to water."

_SOUTH = {"south", "southern"}


def normalize_hemisphere(value) -> str:
    """'north' or 'south'. Anything missing or unknown is north."""
    return "south" if str(value or "").strip().lower() in _SOUTH else "north"


def clamp_watering_days(value, default: int = 7) -> int:
    """A whole number of days between 3 and 28, whatever the model returned."""
    try:
        days = int(round(float(value)))
    except (TypeError, ValueError):
        days = default
    return max(MIN_WATERING_DAYS, min(MAX_WATERING_DAYS, days))


def build_schedule_prompt(species_name: str, latin_name: str, grow_medium: str, location: str = "Unknown",
                          hemisphere=None, now=None) -> str:
    """The watering-schedule prompt, with the month and hemisphere so the season is real, not guessed."""
    now = now or datetime.now(timezone.utc)
    hemi = normalize_hemisphere(hemisphere)
    month = now.strftime("%B")
    return (
        f"Suggest how often to check the soil of {species_name} ({latin_name}) grown in {grow_medium} in {location}. "
        f"It is {month} in the {hemi}ern hemisphere, so allow for the season (plants usually need water less often in "
        f"winter and more often in summer). Answer in whole days between {MIN_WATERING_DAYS} and {MAX_WATERING_DAYS}.\n"
        'Return ONLY valid JSON: { "days": <number>, "reason": "<string max 100 words>", "confidence": "high"|"medium"|"low" }'
    )


def finish_schedule(result: dict) -> dict:
    """Clamp the model's days and replace its reason with the fixed, non-commanding wording."""
    data = dict(result or {})
    data["days"] = clamp_watering_days(data.get("days"))
    data["reason"] = SCHEDULE_REASON
    return data


async def suggest_watering_schedule(species_name: str, latin_name: str, grow_medium: str, location: str = "Unknown",
                                    hemisphere=None) -> dict:
    system = "You are a botanical expert. Always respond with valid JSON only, no markdown formatting or code blocks."
    prompt = build_schedule_prompt(species_name, latin_name, grow_medium, location, hemisphere)
    response = await call_claude(system, prompt)
    return finish_schedule(parse_json_response(response))

async def generate_plant_biography(plant_data: dict) -> str:
    system = "You are a warm, knowledgeable botanical writer for the Grove plant community app. Always respond with valid JSON only."
    prompt = f"""Write a 3-4 sentence biography of a {plant_data.get('common_name', 'plant')} named \"{plant_data.get('nickname', plant_data.get('common_name', 'this plant'))}\".
Care history: {plant_data.get('care_summary', 'recently added to collection')}.
{f"Propagated from a cutting by {plant_data.get('propagated_from', 'another grower')}" if plant_data.get('propagated_from') else ''}
Write as if describing a valued member of a community, not a possession.
Return ONLY valid JSON: {{ "biography": "<string>" }}"""
    response = await call_claude(system, prompt)
    data = parse_json_response(response)
    return data.get('biography', response)

async def generate_plant_personality(stats: dict) -> dict:
    system = "You are a warm botanical personality analyst for the Grove app. Always respond with valid JSON only."
    prompt = f"""Based on this plant owner's data, generate a plant personality profile:
- Total plants: {stats.get('total_plants', 0)}
- Top species: {stats.get('top_species', 'various')}
- Watering consistency: {stats.get('watering_consistency', 'moderate')}%
- Propagation count: {stats.get('propagation_count', 0)}
- Swap count: {stats.get('swap_count', 0)}
- Collection vitality: {stats.get('thriving_rate', 100)}% of plants currently thriving
Give them a 2-3 word title and a 3-4 sentence description using warm, encouraging language (avoid clinical or negative framing). Never compare them with other owners, never mention streaks or consistency scores, and never say they are doing better or worse than anyone.
Return ONLY valid JSON: {{ "title": "<string>", "body": "<string>" }}"""
    response = await call_claude(system, prompt)
    return parse_json_response(response)

# Phase 14B.2 — Species performance narrative.
# Summarizes aggregated community stats into one editorial paragraph in
# Grove's calm, non-clinical voice. Cached for 7 days at the call site.
async def summarize_species_performance(species: dict, perf: dict) -> str:
    system = (
        "You are a warm, knowledgeable botanical writer for Grove. Write one "
        "tight paragraph (3 to 4 sentences) summarizing community performance "
        "data for a species. Be honest about challenges, specific with numbers, "
        "and useful for someone deciding whether to add this plant to their "
        "collection. Don't be saccharine, don't be clinical. If sample size is "
        "small, say so plainly. Return JSON only."
    )
    common = species.get('common_name', 'this plant')
    latin = species.get('latin_name', '')
    sample = perf.get('sample', {})
    problems = perf.get('common_problems') or []
    top_problems = ", ".join(p['label'] for p in problems[:3]) if problems else "none reported yet"
    prompt = f"""Write a one-paragraph summary of how Grove growers are doing with {common} ({latin}).

Data:
- Total plants in Grove: {sample.get('total_plants', 0)}
- Unique growers: {sample.get('unique_growers', 0)}
- Sample confidence: {sample.get('confidence', 'low')}
- 1-year survival rate: {perf.get('success_rate_1y_pct')}% (cohort of {sample.get('cohort_one_year', 0)} plants ≥1yr old)
- Median watering cadence among healthy plants: every {perf.get('median_watering_days_healthy')} days
- Average days to first bloom: {perf.get('avg_days_to_first_bloom')} days
- Most-reported problems: {top_problems}

Return ONLY valid JSON: {{ "narrative": "<string, 3-4 sentences>" }}
"""
    response = await call_claude(system, prompt)
    data = parse_json_response(response)
    return data.get('narrative', '').strip()
