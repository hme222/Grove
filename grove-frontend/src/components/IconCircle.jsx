import React from 'react';
import { cn } from '@/lib/utils';

// A line icon in a small circle, the same chip the onboarding quiz uses beside each answer: sprout on moss at rest,
// forest on lime when it is the chosen one. `on` sets the state directly (a button that is pressed or expanded);
// `onGroup` lets a parent with the `group` class and a data-state of "active" or "open" drive it (a tab trigger).
// Decorative: the word beside it carries the meaning.
export default function IconCircle({ icon: Icon, on = false, onGroup = false, className, testId }) {
  return (
    <span
      aria-hidden="true"
      data-testid={testId}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill transition-colors duration-150',
        on ? 'bg-grove-lime text-grove-root' : 'bg-grove-moss text-grove-sprout',
        onGroup && 'group-data-[state=active]:bg-grove-lime group-data-[state=active]:text-grove-root group-data-[state=open]:bg-grove-lime group-data-[state=open]:text-grove-root',
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}
