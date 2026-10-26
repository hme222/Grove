// Pet-safety labels for a species' `toxicity` value.
//
// Safety rule: only an explicit non-toxic value may read as "Non-toxic to pets" (ASPCA wording; any plant can still upset a stomach).
// A missing, empty, or unrecognized value is "unknown", never safe.
// Every level carries its own icon and words, so meaning never rests on color.
// Every level's text is at least 4.5:1 against the dark forest surface.

export const TOXICITY_LEVELS = {
  non_toxic: {
    level: 'non_toxic',
    label: 'Non-toxic to pets',
    icon: 'safe',
    className: 'text-grove-sprout bg-grove-canopy border-grove-lime',
  },
  mild: {
    level: 'mild',
    label: 'Toxic to pets (mild)',
    icon: 'caution',
    className: 'text-grove-sun bg-grove-canopy border-grove-sun',
  },
  toxic: {
    level: 'toxic',
    label: 'Toxic if ingested',
    icon: 'danger',
    className: 'text-grove-blush bg-grove-canopy border-grove-bloom',
  },
  unknown: {
    level: 'unknown',
    label: 'Pet safety unknown — check before bringing it home',
    icon: 'unknown',
    className: 'text-grove-sage bg-grove-canopy border-grove-fernLine',
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
