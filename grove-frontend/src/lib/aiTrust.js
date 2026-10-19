// Plain-language confidence and "why" lines for AI output.
// Survey: 22/37 trust AI more when it explains why; 17/37 want a confidence score.

// Plant ID treats < 0.7 as low confidence (PlantIdentifyScreen), so the bands match it.
export function confidenceLevel(value) {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return ['high', 'medium', 'low'].includes(v) ? v : null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value >= 0.85) return 'high';
  if (value >= 0.7) return 'medium';
  return 'low';
}

const LEVEL_TEXT = {
  high: 'High confidence',
  medium: 'Fairly confident',
  low: 'Not sure, please check',
};

// "High confidence (92%)" for numbers, "High confidence" for the schedule's labels.
// Returns null when there is nothing honest to say.
export function confidenceText(value) {
  const level = confidenceLevel(value);
  if (!level) return null;
  const pct = typeof value === 'number' ? ` (${Math.round(value * 100)}%)` : '';
  return `${LEVEL_TEXT[level]}${pct}`;
}

// What a plant-ID match is based on, using only data the API returned.
// TODO(api): /plants/identify returns no reason or runner-up guesses. Once it
// returns `matchedTraits` and `alternatives`, lead with the traits here and list
// the top guesses with their confidence.
export function identifyWhy(identified) {
  const match = identified?.libraryMatch;
  if (match?.latinName) {
    const family = match.family ? ` in the ${match.family} family` : '';
    const source = match.source ? ` (${match.source})` : '';
    return `Top photo match. Grove's library lists ${match.latinName}${family}${source}. Check the leaf shape against it.`;
  }
  return "Top photo match. It isn't in Grove's library yet, so check the leaf shape against a trusted guide.";
}
