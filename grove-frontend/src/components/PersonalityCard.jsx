import React from 'react';
import { Sparkles } from 'lucide-react';
import { plantPersonality } from '../lib/plantPersonality';

export default function PersonalityCard({ stats }) {
  const { title, line } = plantPersonality(stats);
  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="personality-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-plant text-grove-cream text-base font-semibold">Plant personality</h3>
        <Sparkles className="h-4 w-4 text-grove-sprout" aria-hidden="true" />
      </div>
      {title && <p className="font-plant text-grove-cream text-3xl mb-1">{title}</p>}
      <p className="font-ui text-sm text-grove-cream">{line}</p>
    </div>
  );
}
