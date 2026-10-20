import React from 'react';
import { lightAPI, nookAPI } from '../../lib/api';
import ShadowTestStep from './ShadowTestStep';
import CurtainPair from './CurtainPair';
import WindowPickStep from './WindowPickStep';
import WindowRoomStep from './WindowRoomStep';
import FitsStep from './FitsStep';
import ClosingStep from './ClosingStep';
import { LIGHT_BASICS_CARDS, WINDOW_MAP_CARDS } from './lightCards';

// The stories feed the steps made-up answers instead of the backend, so every state can be seen.
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const ARRIVES = {
  N: 'No direct sun. Steady, even light.', NE: 'Gentle sun in the early morning.', E: 'Sun in the morning, then bright light.',
  SE: 'Strong sun from morning to midday.', S: 'The most direct sun, all day.', SW: 'Hot sun from midday into the evening.',
  W: 'Hot, low sun in the afternoon, with glare.', NW: 'Weak sun late in the day.',
};
const SWAP = { N: 'S', S: 'N', NE: 'SE', SE: 'NE', SW: 'NW', NW: 'SW', E: 'E', W: 'W' };
const guideFor = (hemisphere) => ({
  data: {
    hemisphere, view: 'open',
    items: DIRECTIONS.flatMap((direction) =>
      ['summer', 'winter'].map((season) => {
        const draw = hemisphere === 'south' ? SWAP[direction] : direction;
        return {
          direction, draw_direction: draw, season, arrives: ARRIVES[draw],
          level: ['S', 'SE', 'SW', 'W'].includes(draw) ? 'bright_direct' : draw === 'N' && season === 'winter' ? 'low' : 'bright_indirect',
        };
      })
    ),
  },
});
const withFakes = (Story) => {
  lightAPI.guide = (hemisphere) => Promise.resolve(guideFor(hemisphere));
  lightAPI.fits = () => Promise.resolve({
    data: {
      has_window: true, level: 'bright_direct',
      plants: [{ id: 'p1', name: 'Jade', suit: 'suits' }, { id: 'p2', name: 'Pothos', suit: 'prefers_dimmer' }],
      species: [{ id: 's1', slug: 'aloe', common_name: 'Aloe' }],
    },
  });
  return <Story />;
};

const win = (over) => ({ sun: 'midday', direction: 'S', draw_direction: 'S', view: 'open', hemisphere: 'north', season: 'summer', level: 'bright_direct', arrives: ARRIVES.S, lamp: false, ...over });
const noop = () => {};

export default {
  title: 'Grove/Light lessons',
  decorators: [withFakes],
  parameters: {
    docs: {
      description: {
        component:
          'Part 1 (Your spot’s light) and Part 2 (Your window). Saving needs the backend, so in Storybook the pick and the shadow test show their error state when tapped.',
      },
    },
  },
};

export const ShadowTest = { render: () => <ShadowTestStep next={noop} onSaved={noop} /> };
export const Curtain = { render: () => <CurtainPair /> };
export const WindowPick = { render: () => <WindowPickStep next={noop} onSaved={noop} /> };
export const RoomSouth = { render: () => <WindowRoomStep window={win()} /> };
export const RoomSouthwest = { render: () => <WindowRoomStep window={win({ direction: 'SW', draw_direction: 'SW', arrives: ARRIVES.SW })} /> };
export const RoomWest = { render: () => <WindowRoomStep window={win({ direction: 'W', draw_direction: 'W', arrives: ARRIVES.W })} /> };
export const RoomNorth = { render: () => <WindowRoomStep window={win({ direction: 'N', draw_direction: 'N', arrives: ARRIVES.N, level: 'medium' })} /> };
export const RoomNortheast = { render: () => <WindowRoomStep window={win({ direction: 'NE', draw_direction: 'NE', arrives: ARRIVES.NE, level: 'bright_indirect' })} /> };
export const RoomSouthHemisphereNorthWindow = {
  render: () => <WindowRoomStep window={win({ direction: 'N', draw_direction: 'S', hemisphere: 'south', arrives: ARRIVES.S })} />,
};
export const RoomNoWindow = {
  render: () => <WindowRoomStep window={win({ sun: 'nowindow', direction: null, draw_direction: null, level: 'low', arrives: 'No window here. A lamp or grow light will do the work.', lamp: true })} />,
};
export const Fits = { render: () => <FitsStep next={noop} cta="Got it" /> };

const nookState = () => ({
  unlocked: ['window', 'table', 'sill', 'floor'], pip: { form: 'leafy', location: 'sill' }, hero: { group: 'pothos', condition: 'fine' },
  shelf_plants: [], readiness: null, window: win({ direction: 'SW', draw_direction: 'SW', arrives: ARRIVES.SW }),
});
export const EndingWithNook = {
  render: () => {
    nookAPI.state = () => Promise.resolve({ data: nookState() });
    return <ClosingStep nookOn picked={null} markDone={<p>Finish control goes here.</p>} />;
  },
};
export const EndingKeepsake = {
  render: () => <ClosingStep nookOn={false} picked={win({ direction: 'SW', draw_direction: 'SW', arrives: ARRIVES.SW })} markDone={<p>Finish control goes here.</p>} />,
};
export const EndingNoWindow = {
  render: () => {
    nookAPI.state = () => Promise.resolve({ data: { ...nookState(), window: null } });
    return <ClosingStep nookOn={false} picked={null} markDone={<p>Finish control goes here.</p>} />;
  },
};
export const CardText = {
  render: () => (
    <ol>
      {[...LIGHT_BASICS_CARDS, ...WINDOW_MAP_CARDS].map((card) => (
        <li key={card.header}>
          <strong>{card.header}</strong>: {card.headline}
        </li>
      ))}
    </ol>
  ),
};
