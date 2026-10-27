import React, { useMemo } from 'react';
import NookCanvas from '../../nook/NookCanvas';
import { lessonView } from './lessonView';

const SOUTH = { draw_direction: 'S', direction: 'S', season: 'summer', lamp: false };

// Part 1, card 3: the same south window without and with a sheer curtain. The curtain turns the
// sharp patch into a soft one, so the second room uses the softened patch.
export default function CurtainPair({ hemisphere = 'north' }) {
  // The sunny window faces the equator: south in the north, and north in the south.
  const side = hemisphere === 'south' ? 'North' : 'South';
  const bare = useMemo(() => lessonView({ ...SOUTH, view: 'open' }), []);
  const curtained = useMemo(() => lessonView({ ...SOUTH, view: 'tree' }), []);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="curtain-pair">
      <figure className="rounded-[12px] bg-[#EDE5D8] p-2">
        <NookCanvas view={bare} animate={false} label={`${side} window, no curtain`} />
        <figcaption className="mt-1 text-xs font-ui text-[#1A1A17]">Direct. Sharp patch, strong light.</figcaption>
      </figure>
      <figure className="rounded-[12px] bg-[#EDE5D8] p-2">
        <NookCanvas view={curtained} animate={false} label={`${side} window, sheer curtain`} />
        <figcaption className="mt-1 text-xs font-ui text-[#1A1A17]">Filtered, bright indirect. Soft patch, no scorch.</figcaption>
      </figure>
    </div>
  );
}
