// Pet-safety labels for a species' `toxicity` value.
//
// Pet safety is shown only when it is sourced: the backend sends a value only when the species record cites an ASPCA
// Toxic and Non-Toxic Plants page, and the ASPCA gives two answers (toxic, non-toxic), so there is no "mild" level here.
// Only an explicit non-toxic value may read as "Non-toxic to cats and dogs". A missing, empty, or unrecognized value
// (including an old "mild") is "unknown", never safe.
// Every level carries its own icon and words, so meaning never rests on color.
// Every level's text is at least 4.5:1 against the dark forest surface.

export const TOXICITY_LEVELS = {
  non_toxic: {
    level: 'non_toxic',
    label: 'Non-toxic to cats and dogs',
    definition: 'The ASPCA lists this plant as non-toxic to cats and dogs. Any plant can still upset a stomach if a pet eats a lot of it.',
    icon: 'safe',
    className: 'text-grove-sprout bg-grove-canopy border-grove-lime',
  },
  toxic: {
    level: 'toxic',
    label: 'Toxic to cats and dogs',
    definition: 'The ASPCA lists this plant as toxic to cats and dogs. Keep it where they can’t reach it.',
    icon: 'danger',
    className: 'text-grove-blush bg-grove-canopy border-grove-bloom',
  },
  unknown: {
    level: 'unknown',
    label: 'Pet safety unknown — check before bringing it home',
    definition: 'We have no ASPCA listing recorded for this plant, so don’t assume it’s safe. Check the ASPCA’s toxic and non-toxic plant list before bringing it home.',
    icon: 'unknown',
    className: 'text-grove-sage bg-grove-canopy border-grove-fernLine',
  },
};

const ALIASES = {
  non_toxic: 'non_toxic',
  nontoxic: 'non_toxic',
  toxic: 'toxic',
};

export function normalizeToxicity(value) {
  if (typeof value !== 'string') return 'unknown';
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ALIASES[key] || 'unknown';
}

export function getToxicityInfo(value) {
  return TOXICITY_LEVELS[normalizeToxicity(value)];
}
