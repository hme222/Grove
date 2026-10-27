import React from 'react';
import NookCanvas from './NookCanvas';
import PipPanel from './PipPanel';
import { drawSprite } from './drawRoom';
import { PALETTE } from './palette';
import { plantSprite, pipSprite } from './sprites';

const BASE = ['window', 'table', 'sill', 'floor'];
const LEVELS = {
  1: BASE,
  2: [...BASE, 'shelf'],
  3: [...BASE, 'shelf', 'rug', 'lamp'],
  4: [...BASE, 'shelf', 'rug', 'lamp', 'hanging', 'wall-art'],
};
const FORMS = { 1: 'seed', 2: 'sprout', 3: 'leafy', 4: 'bloom' };

const room = (level, over = {}) => ({
  unlocked: LEVELS[level],
  pip: { form: FORMS[level], location: level >= 2 ? 'shelf' : 'sill', mood: 'calm' },
  hero: null,
  readiness: null,
  shelfPlants: [],
  ...over,
});

export default {
  title: 'Grove/Pip’s nook',
  component: NookCanvas,
  parameters: {
    docs: {
      description: {
        component:
          'The pixel nook, scaled by whole numbers. Locked items show as faint outlines. A plant’s sprite shows its condition from its records, never from nook growth. Pip’s mood is cosmetic.',
      },
    },
  },
};

export const Level1ReadinessSeed = {
  args: { view: room(1, { readiness: { state: 'seed', group: 'pothos' } }), label: 'Level 1 with a readiness seed' },
};
export const Level2Hero = {
  args: {
    view: room(2, { hero: { group: 'monstera', condition: 'fine' }, shelfPlants: [{ condition: 'fine' }, { condition: 'due-soon' }] }),
    label: 'Level 2 with a hero plant',
  },
};
export const Level3DueSoon = {
  args: { view: room(3, { hero: { group: 'snake', condition: 'due-soon' } }), label: 'Level 3, plant due soon' },
};
export const Level4NeedsAttention = {
  args: {
    view: room(4, { hero: { group: 'pothos', condition: 'needs-attention' }, shelfPlants: [{ condition: 'needs-attention' }] }),
    label: 'Level 4, plant needs attention',
  },
};
export const Level4ReadinessReady = {
  args: { view: room(4, { readiness: { state: 'ready', group: 'succulent' } }), label: 'Level 4 with a ready readiness plant' },
};

function Sheet({ rowsList }) {
  const refs = React.useRef([]);
  React.useEffect(() => {
    rowsList.forEach((rows, i) => {
      const canvas = refs.current[i];
      const ctx = canvas && canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, 15, 24);
      drawSprite(ctx, rows, 7, 23);
    });
  }, [rowsList]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: PALETTE.c, padding: 12 }}>
      {rowsList.map((rows, i) => (
        <canvas
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          width={15}
          height={24}
          style={{ width: 60, height: 96, imageRendering: 'pixelated' }}
        />
      ))}
    </div>
  );
}

export const PlantTemplates = {
  render: () => {
    const rowsList = [];
    ['pothos', 'monstera', 'succulent', 'snake', 'generic'].forEach((group) =>
      ['fine', 'due-soon', 'needs-attention'].forEach((condition) => rowsList.push(plantSprite(group, condition)))
    );
    return <Sheet rowsList={rowsList} />;
  },
};

export const PipFormsAndMoods = {
  render: () => {
    const rowsList = [];
    ['seed', 'sprout', 'leafy', 'bloom'].forEach((form) => rowsList.push(pipSprite(form, 'calm')));
    ['curious', 'sleepy', 'pleased'].forEach((mood) => rowsList.push(pipSprite('leafy', mood)));
    return <Sheet rowsList={rowsList} />;
  },
};

export const PipOnAPanel = { render: () => <PipPanel form="leafy" label="Pip" animate /> };
