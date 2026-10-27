import React from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Leaf } from 'lucide-react';
import { getFileUrl } from '../lib/api';
import { CONDITION_LABELS } from './nookCopy';
import { PAPER_BUTTON_QUIET } from './paperStyles';

// Status is a word and an icon, never color alone.
const CONDITION_ICONS = {
  fine: { Icon: CheckCircle2, tone: 'text-grove-paperAccent' },
  'due-soon': { Icon: Clock, tone: 'text-grove-ink' },
  'needs-attention': { Icon: AlertCircle, tone: 'text-grove-paperError' },
};

function PhotoSlot({ plant }) {
  // The nook state does not carry a photo yet. When it does (`photo_url`), it shows here.
  const url = plant.photo_url ? getFileUrl(plant.photo_url) : null;
  return (
    <div className="flex aspect-video items-center justify-center overflow-hidden rounded-chip bg-grove-paperDeep" data-testid={`nook-photo-${plant.id}`}>
      {url ? (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Leaf className="h-6 w-6 text-grove-paperGreen" aria-hidden="true" />
      )}
    </div>
  );
}

// A scrollable region must be focusable so keyboard users can scroll it with the arrow keys
// (WCAG 2.1.1). It is spread because the lint rule for tabIndex on a region cannot tell it scrolls.
const SCROLL_FOCUS = { tabIndex: 0 };

// One light tile per plant, in a row that swipes sideways and snaps to each tile. The region is
// focusable so a keyboard user can scroll it with the arrow keys.
export default function PlantTiles({ plants, onToggleLooksOff }) {
  return (
    <div
      role="region"
      aria-label="Your plants"
      {...SCROLL_FOCUS}
      className="-mx-4 overflow-x-auto scroll-px-4 snap-x snap-mandatory px-4 pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-grove-paperGreen"
      data-testid="nook-tiles"
    >
      <ul className="flex w-max gap-3">
        {plants.map((plant) => {
          const { Icon, tone } = CONDITION_ICONS[plant.condition] || CONDITION_ICONS.fine;
          return (
            <li
              key={plant.id}
              className="flex w-tile shrink-0 snap-start flex-col gap-2 rounded-chip border-hairline border-grove-paperBorder bg-grove-paperCard p-2 shadow-rest"
              data-testid={`nook-plant-${plant.id}`}
            >
              <PhotoSlot plant={plant} />
              <span className="line-clamp-2 font-plant text-base font-semibold leading-tight text-grove-root">{plant.name}</span>
              <span className="flex items-start gap-1.5 font-ui text-sm text-grove-inkSoft">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
                <span data-testid={`nook-condition-${plant.id}`}>
                  {CONDITION_LABELS[plant.condition]}
                  {plant.looks_off ? ', marked as looking off' : ''}
                </span>
              </span>
              <button
                type="button"
                aria-pressed={plant.looks_off}
                onClick={() => onToggleLooksOff(plant)}
                className={`${PAPER_BUTTON_QUIET} mt-auto w-full rounded-pill aria-pressed:border-grove-root aria-pressed:bg-grove-paperPale`}
                data-testid={`nook-looks-off-${plant.id}`}
              >
                {plant.looks_off && <Check className="h-4 w-4" aria-hidden="true" />}
                Looks off
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
