// Pet-safety labels for a species' `toxicity` value.
//
// Safety rule: only an explicit non-toxic value may read as "Pet-safe".
// A missing, empty, or unrecognized value is "unknown", never safe.
// Every level carries its own icon and words, so meaning never rests on color.
// Every level's text is at least 4.5:1 against the dark forest surface.

export const TOXICITY_LEVELS = {
  non_toxic: {
    level: 'non_toxic',
    label: 'Pet-safe',
    icon: 'safe',
    className: 'text-grove-sprout bg-grove-lime/15 border-grove-lime/40',
  },
  mild: {
    level: 'mild',
    label: 'Mildly toxic',
    icon: 'caution',
    className: 'text-grove-sun bg-grove-sun/10 border-grove-sun/40',
  },
  toxic: {
    level: 'toxic',
    label: 'Toxic if ingested',
    icon: 'danger',
    className: 'text-grove-blush bg-grove-bloom/15 border-grove-bloom/40',
  },
  unknown: {
    level: 'unknown',
    label: 'Pet safety unknown — check before bringing it home',
    icon: 'unknown',
    className: 'text-grove-sage bg-grove-moss border-grove-fernLine',
  },
};

const ALIASES = {
  non_toxic: 'non_toxic',
  nontoxic: 'non_toxic',
  mild: 'mild',
  mildly_toxic: 'mild',
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
