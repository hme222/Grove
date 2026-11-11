// The four first-run questions. Every question can be skipped, and each says why it is asked.
// Question and option ids must match `PLAN_QUESTIONS` in grove-backend/tracks.py (a test checks it).
// Each option has an icon key (drawn by QuizSteps) as decoration beside the words; the label alone carries the meaning.
// The answers only choose the first lesson, from the lessons that already exist.
export const PLAN_QUESTIONS = [
  {
    id: 'q1',
    heading: 'How do plants fit into your life right now?',
    why: 'Why we ask: it tells us where to start.',
    options: [
      { id: 'none_yet', icon: 'sprout', label: 'I don’t have any yet' },
      { id: 'loved_and_lost', icon: 'heart-crack', label: 'I’ve loved and lost a few' },
      { id: 'gift', icon: 'gift', label: 'I got one as a gift' },
      { id: 'few_fine', icon: 'leaf', label: 'A few, doing fine' },
      { id: 'collection', icon: 'trees', label: 'A growing collection' },
      { id: 'my_job', icon: 'briefcase', label: 'Plants are my job' },
    ],
  },
  {
    id: 'q2',
    heading: 'A leaf turns yellow. What’s your first move?',
    why: 'Why we ask: your first move shows which lesson would help most.',
    options: [
      { id: 'wonder_wrong', icon: 'help', label: 'I wonder what I did wrong' },
      { id: 'feel_guilty', icon: 'frown', label: 'I feel guilty' },
      { id: 'water_or_sun', icon: 'droplets', label: 'Water it or move it to the sun' },
      { id: 'check_roots', icon: 'search', label: 'Check roots, soil and light' },
      { id: 'nutrients', icon: 'flask', label: 'Think nutrient deficiency' },
      { id: 'no_plant', icon: 'sprout', label: 'I don’t own a plant yet' },
    ],
  },
  {
    id: 'q3',
    heading: 'What would feel like a win?',
    why: 'Why we ask: so your plan aims at what you want from it.',
    options: [
      { id: 'inspiration', icon: 'sparkles', label: 'A little green inspiration' },
      { id: 'confidence', icon: 'smile', label: 'Confidence, less worry' },
      { id: 'save_gift', icon: 'life-buoy', label: 'Saving a plant I was given' },
      { id: 'routine', icon: 'calendar', label: 'A simple care routine' },
      { id: 'advanced', icon: 'sliders', label: 'Dialing in advanced care' },
      { id: 'skip_basics', icon: 'fast-forward', label: 'Skipping the basics' },
    ],
  },
  {
    id: 'q4',
    heading: 'How can we best support your plant journey?',
    why: 'Why we ask: so the lessons match where you are.',
    options: [
      { id: 'blank_slate', icon: 'sprout', label: 'I’m starting from scratch' },
      { id: 'overwhelmed', icon: 'target', label: 'Too much advice. Give me one thing to try' },
      { id: 'winging_it', icon: 'compass', label: 'I’m figuring it out as I go' },
      { id: 'know_basics', icon: 'book', label: 'I know the basics. Help me go deeper' },
      { id: 'mechanics', icon: 'cog', label: 'I like understanding how it works' },
      { id: 'botanical', icon: 'microscope', label: 'I want the science behind it' },
    ],
  },
];

export const answerLabel = (questionId, answerId) => {
  const q = PLAN_QUESTIONS.find((item) => item.id === questionId);
  const o = q && q.options.find((item) => item.id === answerId);
  return o ? o.label : '';
};
