// Titles and short blurbs for the lessons. Card text itself stays in the
// lesson pages. Ids must match `LESSON_IDS` in grove-backend/tracks.py.
export const LESSON_META = {
  'soil-finger-test': {
    id: 'soil-finger-test',
    title: 'Soil Finger-Test',
    blurb: 'Check the soil with your finger, then decide.',
  },
  'plant-parent-reset': {
    id: 'plant-parent-reset',
    title: 'Plant Parent Reset',
    blurb: 'Five short lessons to start fresh.',
  },
  'plant-er': {
    id: 'plant-er',
    title: 'Plant ER',
    blurb: 'First steps for a plant you inherited.',
  },
  'habit-stacking': {
    id: 'habit-stacking',
    title: 'Habit Stacking',
    blurb: 'Tie plant care to a habit you already have.',
  },
  'window-blueprint': {
    id: 'window-blueprint',
    title: 'Window Blueprint',
    blurb: 'Match your plants to the light in your window.',
  },
};

// Ids must match `QUIZ_OPTION_TRACK` in grove-backend/tracks.py.
// Labels describe a situation, never an identity or an internal track name.
export const QUIZ_OPTIONS = [
  { id: 'unwell_or_guilt', label: 'A plant of mine looks unwell, or I feel bad about one I lost' },
  { id: 'overwater', label: "I overwater, or I don't trust my instincts" },
  { id: 'gifted_no_instructions', label: 'Someone gave me a plant and I have no instructions' },
  { id: 'forget', label: 'I forget to care for my plants' },
  { id: 'design_or_no_plant', label: 'I want to design with plants, or I have none yet' },
];

// One-tap notes on a soil test. They are saved with the log.
export const NOTE_CHIPS = ['Looked fine', 'Leaves drooping', 'New growth', 'Soil pulling away', 'Saw pests'];

export function lessonPath(id) {
  return `/lessons/${id}`;
}
