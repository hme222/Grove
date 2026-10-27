import React from 'react';
import { cn } from '../lib/utils';

// The one spinner. Decorative (aria-hidden) and still while the person prefers reduced motion;
// the words next to it say what is happening, so nothing depends on the motion.
export function Spinner({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-5 w-5 shrink-0 rounded-pill border-strong border-grove-fernLine border-t-transparent motion-safe:animate-spin', className)}
    />
  );
}

// A wait with no shape yet: spinner plus a visible label, announced as a status.
export default function Loading({ label = 'Loading', className, ...props }) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 py-16', className)} {...props}>
      <Spinner className="h-6 w-6" />
      <p className="font-ui text-sm text-grove-sage">{label}</p>
    </div>
  );
}

// A wait for a list or grid: tinted blocks where the cards will be, with the same visible label so
// the screen says what it is waiting for. The blocks default to the height of a real media row
// (min-h-media-row) so the list does not jump when data lands; pass `rowHeight` (a token-backed
// class such as 'min-h-row') for shorter rows. They breathe with the soft-pulse token, and stay
// still under reduced motion.
export function LoadingList({ count = 3, label = 'Loading', rowHeight = 'min-h-media-row', className, ...props }) {
  return (
    <div role="status" className={cn('w-full', className)} {...props}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn(rowHeight, 'rounded-card bg-grove-moss/40 motion-safe:animate-soft-pulse')} />
        ))}
      </div>
      <p className="mt-3 text-center font-ui text-sm text-grove-sage">{label}</p>
    </div>
  );
}
