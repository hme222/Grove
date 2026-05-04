import os
import uuid
import json
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def call_claude(system_message: str, prompt: str, model: str = "claude-sonnet-4-6") -> str:
    # Enforce American English across all Grove AI outputs.
    american_suffix = (
        " Write in American English. Use American spellings (color not colour, "
        "favorite not favourite, organize not organise, center not centre, "
        "analyze not analyse). Tone: warm, knowledgeable, appropriate for "
        "American plant enthusiasts."
    )
    if "American English" not in system_message:
        system_message = system_message.rstrip() + american_suffix
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not set")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"grove-{uuid.uuid4()}",
            system_message=system_message
        )
        chat.with_model("anthropic", model)
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
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
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not set")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"grove-vision-{uuid.uuid4()}",
            system_message=system_message
        )
        chat.with_model("anthropic", model)
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(text=prompt, file_contents=[image_content])
        response = await chat.send_message(user_message)
        return response
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

async def suggest_watering_schedule(species_name: str, latin_name: str, grow_medium: str, location: str = "Unknown") -> dict:
    system = "You are a botanical expert. Always respond with valid JSON only, no markdown formatting or code blocks."
    prompt = f"""Suggest a watering frequency in days for {species_name} ({latin_name}) grown in {grow_medium} in {location} during the current season.
Return ONLY valid JSON: {{ "days": <number>, "reason": "<string max 100 words>", "confidence": "high"|"medium"|"low" }}"""
    response = await call_claude(system, prompt)
    return parse_json_response(response)

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
Give them a 2-3 word title and a 3-4 sentence description using warm, encouraging language (avoid clinical or negative framing).
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
