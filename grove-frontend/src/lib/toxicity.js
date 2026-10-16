// Pet-safety labels for a species' `toxicity` value.
//
// Safety rule: only an explicit non-toxic value may read as "Pet-safe".
// A missing, empty, or unrecognized value is "unknown", never safe.
// Every level carries its own icon and words, so meaning never rests on color.
// Contrast (text on background): safe 5.4:1, mild 4.8:1, toxic 5.5:1, unknown 5.2:1.

export const TOXICITY_LEVELS = {
  non_toxic: {
    level: 'non_toxic',
    label: 'Pet-safe',
    icon: 'safe',
    className: 'text-[#3B6D11] bg-[#EAF3DE] border-[#3B6D11]/30',
  },
  mild: {
    level: 'mild',
    label: 'Mildly toxic',
    icon: 'caution',
    className: 'text-[#8A6A3D] bg-[#FBFAF7] border-[#8A6A3D]/40',
  },
  toxic: {
    level: 'toxic',
    label: 'Toxic if ingested',
    icon: 'danger',
    className: 'text-[#B42318] bg-[#FEE4E2] border-[#B42318]/40',
  },
  unknown: {
    level: 'unknown',
    label: 'Pet safety unknown — check before bringing it home',
    icon: 'unknown',
    className: 'text-[#5F5E5A] bg-[#EDE5D8] border-[#D3C9B8]',
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
