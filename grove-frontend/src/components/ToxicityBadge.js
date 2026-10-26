import React from 'react';
import { Heart, AlertTriangle, OctagonAlert, CircleHelp } from 'lucide-react';
import { getToxicityInfo } from '../lib/toxicity';

const ICONS = { safe: Heart, caution: AlertTriangle, danger: OctagonAlert, unknown: CircleHelp };

const SIZES = {
  sm: { box: 'px-2.5 py-1 min-h-6 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
  md: { box: 'px-2.5 py-1 min-h-6 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
};

// One pet-safety chip for every place a species appears: Add Plant, plant ID,
// plant detail, and the Greenhouse species page. Icon + words + color.
export default function ToxicityBadge({ toxicity, size = 'md', className = '', testId = 'toxicity-badge' }) {
  const info = getToxicityInfo(toxicity);
  const Icon = ICONS[info.icon];
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      data-testid={testId}
      data-level={info.level}
      className={`inline-flex items-center rounded-round border-hairline font-ui leading-snug ${s.box} ${info.className} ${className}`}
    >
      <Icon className={`${s.icon} flex-shrink-0`} aria-hidden="true" />
      <span>{info.label}</span>
    </span>
  );
}
