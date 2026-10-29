// Titles and short blurbs for the lessons. Card text itself stays in the
// lesson pages. Ids must match `LESSON_IDS` in grove-backend/tracks.py.
export const LESSON_META = {
  'soil-finger-test': {
    id: 'soil-finger-test',
    photo: '/photos/soil-1.jpg',
    thumb: '/photos/soil-thumb-1.jpg',
    title: 'Soil finger-test',
    blurb: 'Check the soil with your finger, then decide.',
  },
  'plant-parent-reset': {
    id: 'plant-parent-reset',
    photo: '/photos/shelf-1.jpg',
    thumb: '/photos/shelf-thumb-1.jpg',
    title: 'Plant parent reset',
    blurb: 'Five short lessons to start fresh.',
  },
  'plant-er': {
    id: 'plant-er',
    photo: '/photos/plant-1.jpg',
    thumb: '/photos/plant-thumb-1.jpg',
    title: 'Plant ER',
    blurb: 'First steps for a plant you inherited.',
  },
  'habit-stacking': {
    id: 'habit-stacking',
    photo: '/photos/watering-1.jpg',
    thumb: '/photos/watering-thumb-1.jpg',
    title: 'Habit stacking',
    blurb: 'Tie plant care to a habit you already have.',
  },
  'light-basics': {
    id: 'light-basics',
    photo: '/photos/light-1.jpg',
    thumb: '/photos/light-thumb-1.jpg',
    title: "Your spot's light",
    blurb: 'Try a hand test and learn direct from indirect light.',
  },
  'window-map': {
    id: 'window-map',
    photo: '/photos/light-2.jpg',
    thumb: '/photos/light-thumb-2.jpg',
    title: 'Your window',
    blurb: 'Pick your window and see how it lights a room.',
  },
};

// One-tap notes on a soil test. They are saved with the log.
export const NOTE_CHIPS = ['Looked fine', 'Leaves drooping', 'New growth', 'Soil pulling away', 'Saw pests'];

export function lessonPath(id) {
  return `/lessons/${id}`;
}
