import React from 'react';
import { normalizeToxicity } from '../lib/toxicity';

// When a plant has no recorded pet-safety listing, say where to look instead of leaving a dead end.
// Renders nothing for a plant with a sourced answer.
export const ASPCA_PLANT_LIST = 'https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants';

export default function PetSafetyLookup({ toxicity, className = '', testId = 'pet-safety-lookup' }) {
  if (normalizeToxicity(toxicity) !== 'unknown') return null;
  return (
    <a
      href={ASPCA_PLANT_LIST}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className={`inline-flex min-h-touch items-center font-ui text-sm text-grove-cream underline underline-offset-2 ${className}`}
    >
      Look it up on the ASPCA&rsquo;s plant list
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
