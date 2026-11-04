import React, { useRef, useState } from 'react';
import { Heart, AlertTriangle, OctagonAlert, CircleHelp } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { getToxicityInfo } from '../lib/toxicity';

const ICONS = { safe: Heart, caution: AlertTriangle, danger: OctagonAlert, unknown: CircleHelp };

const SIZES = {
  sm: { box: 'px-2.5 py-1 min-h-6 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
  md: { box: 'px-2.5 py-1 min-h-6 text-xs gap-1.5', icon: 'h-3.5 w-3.5' },
};

// One pet-safety chip for every place a species appears: Add Plant, plant ID,
// plant detail, and the Greenhouse species page. Icon + words + color.
// Its meaning shows in a small panel on hover, on keyboard focus and on tap (Escape or a tap elsewhere closes it).
// `interactive={false}` is for a chip that sits inside a link or button (a list row): it still explains itself on hover,
// but takes no focus and no tap, so the row stays one control; the full panel is on the plant's own page.
export default function ToxicityBadge({ toxicity, size = 'md', className = '', testId = 'toxicity-badge', interactive = true }) {
  const info = getToxicityInfo(toxicity);
  const Icon = ICONS[info.icon];
  const s = SIZES[size] || SIZES.md;
  const [open, setOpen] = useState(false);
  const touched = useRef(false);
  return (
    <TooltipPrimitive.Provider delayDuration={150} skipDelayDuration={300}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span
            data-testid={testId}
            data-level={info.level}
            tabIndex={interactive ? 0 : undefined}
            onPointerDown={(e) => { touched.current = e.pointerType === 'touch'; }}
            onClick={interactive ? () => { if (touched.current) setOpen(true); } : undefined}
            className={`inline-flex items-center rounded-pill border-hairline font-ui ${s.box} ${info.className} ${interactive ? 'cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime' : ''} ${className}`}
          >
            <Icon className={`${s.icon} flex-shrink-0`} aria-hidden="true" />
            <span>{info.label}</span>
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            data-testid={`${testId}-definition`}
            className="z-tip max-w-[16rem] rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-3 py-2 font-ui text-sm leading-snug text-grove-cream shadow-dialog"
          >
            {info.definition}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
