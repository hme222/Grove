import React from 'react';
import PipSettings from '../PipSettings';
import NookSettings from '../NookSettings';

// Body of the "Pip" sheet: the Pip switches and the nook switch, without their own cards.
export default function PipSheetBody() {
  return (
    <div className="space-y-4">
      <PipSettings bare />
      <NookSettings bare />
    </div>
  );
}
