import React, { useEffect, useState } from 'react';
import { lightAPI } from '../../lib/api';
import StepNext from './StepNext';
import { suitLine } from './lightCopy';
import { PAPER_ERROR, PAPER_LINK } from '../../nook/paperStyles';

// Part 2, card 3: which of the person's plants suit their spot, or which species would.
// It never scores anything, and it never blocks the lesson.
export default function FitsStep({ next, cta }) {
  const [state, setState] = useState({ loaded: false, failed: false, data: null });

  useEffect(() => {
    let alive = true;
    lightAPI
      .fits()
      .then((res) => alive && setState({ loaded: true, failed: false, data: res.data }))
      .catch(() => alive && setState({ loaded: true, failed: true, data: null }));
    return () => {
      alive = false;
    };
  }, []);

  const { loaded, failed, data } = state;
  return (
    <div className="space-y-3" data-testid="fits-step">
      {failed && (
        <p role="alert" className={PAPER_ERROR} data-testid="fits-error">
          Could not load this just now. You can carry on.
        </p>
      )}
      {loaded && data && !data.has_window && (
        <p className="font-ui text-sm text-grove-ink" data-testid="fits-none">
          Pick a window first and this will fill in.
        </p>
      )}
      {data && data.has_window && data.plants.length > 0 && (
        <ul className="space-y-1" data-testid="fits-plants">
          {data.plants.map((plant) => (
            <li key={plant.id} className="font-ui text-sm text-grove-ink">
              {suitLine(plant.name, plant.suit)}
            </li>
          ))}
        </ul>
      )}
      {data && data.has_window && data.plants.length === 0 && data.species.length > 0 && (
        <div data-testid="fits-species">
          <p className="mb-1 font-ui text-sm text-grove-ink">These plants like this kind of light:</p>
          <ul className="space-y-1">
            {data.species.map((species) => (
              <li key={species.id}>
                <a href={`/greenhouse/${species.id}`} className={PAPER_LINK}>
                  {species.common_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <StepNext cta={cta} onClick={next} />
    </div>
  );
}
