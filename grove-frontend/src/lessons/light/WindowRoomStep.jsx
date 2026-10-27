import React, { useEffect, useMemo, useState } from 'react';
import NookCanvas from '../../nook/NookCanvas';
import { windowSentence, directionName } from '../../nook/windowLight';
import { lightAPI } from '../../lib/api';
import { lessonView } from './lessonView';
import { levelName } from './lightCopy';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const GROW_LIGHT = 'A lamp or grow light does the work of a window. Choose one made for low light plants.';

const chip = (on) =>
  `min-h-[44px] rounded-[8px] border-[0.5px] px-3 py-3 text-sm font-ui text-[#1A1A17] ${
    on ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20' : 'border-[#D3C9B8] bg-[#F5F0E8] hover:border-[#2D5016]'
  }`;

// Part 2, card 2: one room lit the way the person picked. The chips and the season switch only
// change the picture and the words. They save nothing.
export default function WindowRoomStep({ window }) {
  const lamp = !!window?.lamp;
  const hemisphere = window?.hemisphere || 'north';
  const viewKind = window?.view || 'open';
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [direction, setDirection] = useState(window?.direction || null);
  const [season, setSeason] = useState(window?.season || 'summer');

  useEffect(() => {
    if (lamp) return undefined;
    let alive = true;
    lightAPI
      .guide(hemisphere, viewKind)
      .then((res) => {
        if (alive) setItems(res.data?.items || []);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [lamp, hemisphere, viewKind]);

  const item = items && items.find((entry) => entry.direction === direction && entry.season === season);

  const room = useMemo(() => {
    if (lamp) return lessonView({ lamp: true });
    const drawDirection = item ? item.draw_direction : window?.draw_direction;
    return lessonView({ draw_direction: drawDirection, direction, season, view: viewKind, lamp: false });
  }, [lamp, item, window, direction, season, viewKind]);

  const label = lamp
    ? 'A room lit by a lamp.'
    : `A room lit through a ${directionName(direction)} window, ${season}.`;
  const text = lamp
    ? "There's no window here, so the room is lit by a lamp."
    : item
      ? `Facing ${directionName(direction)}, ${season}: ${levelName(item.level)}. ${item.arrives}`
      : windowSentence(window);

  return (
    <div className="space-y-3" data-testid="window-room-step">
      <div className="rounded-[12px] bg-[#EDE5D8] p-2">
        <NookCanvas view={room} animate={false} label={label} />
      </div>

      {!lamp && items && (
        <>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Window direction">
            {DIRECTIONS.map((d) => (
              <button key={d} type="button" aria-pressed={direction === d} onClick={() => setDirection(d)} className={chip(direction === d)} data-testid={`chip-${d}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Season">
            {['summer', 'winter'].map((s) => (
              <button key={s} type="button" aria-pressed={season === s} onClick={() => setSeason(s)} className={chip(season === s)} data-testid={`season-${s}`}>
                {s === 'summer' ? 'Summer' : 'Winter'}
              </button>
            ))}
          </div>
        </>
      )}

      {failed && (
        <p role="alert" className="text-xs font-ui text-red-700" data-testid="room-error">
          Could not load the other windows. Your own window is shown below.
        </p>
      )}

      <p className="text-sm text-[#1A1A17]" data-testid="room-text">
        {text}
      </p>
      {lamp && (
        <p className="text-sm text-[#1A1A17]" data-testid="room-grow-light">
          {GROW_LIGHT}
        </p>
      )}

      <ul className="text-xs font-ui text-[#2B2B26] list-disc pl-4 space-y-1" data-testid="room-footnotes">
        {hemisphere === 'south' ? (
          <>
            <li>West and northwest glass gets hot. A sheer curtain helps.</li>
            <li>South glass runs cold in winter. Keep leaves off it.</li>
          </>
        ) : (
          <>
            <li>West and southwest glass gets hot. A sheer curtain helps.</li>
            <li>North glass runs cold in winter. Keep leaves off it.</li>
          </>
        )}
      </ul>
    </div>
  );
}
