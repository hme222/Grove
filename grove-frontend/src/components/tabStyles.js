// The one tab style: text tabs on the 16px page margin, 44px high, the active tab in medium
// weight with a lime underline. Used by the Care views, the Plants and Bouquets strip and every
// Radix tab set (ui/tabs.jsx), so a tab always looks and behaves the same.
import { cn } from '../lib/utils';

export const TAB_STRIP_CLASS = 'flex items-center gap-6 overflow-x-auto';

export const TAB_CLASS =
  'inline-flex min-h-touch min-w-touch flex-shrink-0 items-center justify-start gap-1.5 whitespace-nowrap border-b-strong border-transparent px-0 font-ui text-sm text-grove-sage transition-colors duration-150 hover:text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime focus-visible:ring-offset-2 focus-visible:ring-offset-grove-forest disabled:pointer-events-none disabled:opacity-50';

export const TAB_ACTIVE_CLASS = 'border-grove-lime font-medium text-grove-cream';

// cn() merges, so the active border colour and text colour replace the base transparent/sage ones instead of
// both landing on the element and the stylesheet order deciding (which left the active tab looking inactive).
export const tabClass = (active) => cn(TAB_CLASS, active && TAB_ACTIVE_CLASS);
