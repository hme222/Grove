import React from 'react';
import { GROVE_BRAND } from '../../constants/brand';

// Body of the "About FloraGrove" sheet: the mission, nothing else.
export default function AboutSheetBody() {
  return <p className="font-ui text-sm text-grove-cream leading-relaxed">{GROVE_BRAND.mission}</p>;
}
