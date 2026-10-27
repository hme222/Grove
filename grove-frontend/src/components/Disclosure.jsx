import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// The one disclosure panel for reference text that most people never open (Photo credits on Help, Sources
// on a lesson). A native <details>, so it opens with Enter and Space and works without script. Fill is
// Canopy with a Moss hairline; the summary is a 44px UI-face label with a chevron that turns when open
// (only for people who have not asked for less motion). Question-and-answer lists use the Accordion.
export default function Disclosure({ title, children, className, testId, bodyClassName }) {
  return (
    <details className={cn('group rounded-small border-hairline border-grove-moss bg-grove-canopy px-4', className)} data-testid={testId}>
      <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-control font-ui text-sm font-medium text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className={cn('pb-4', bodyClassName)}>{children}</div>
    </details>
  );
}
