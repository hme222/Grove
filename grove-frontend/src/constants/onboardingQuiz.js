// The four first-run questions. Every question can be skipped, and each says why it is asked.
// Question and option ids must match `PLAN_QUESTIONS` in grove-backend/tracks.py (a test checks it).
// The answers only choose the first lesson, from the lessons that already exist.
export const PLAN_QUESTIONS = [
  {
    id: 'q1',
    heading: 'How do plants fit into your life right now?',
    why: 'Why we ask: it tells us where to start.',
    options: [
      { id: 'none_yet', label: 'I don’t have any yet' },
      { id: 'loved_and_lost', label: 'I’ve loved and lost a few' },
      { id: 'gift', label: 'I got one as a gift' },
      { id: 'few_fine', label: 'A few, doing fine' },
      { id: 'collection', label: 'A growing collection' },
      { id: 'my_job', label: 'Plants are my job' },
    ],
  },
  {
    id: 'q2',
    heading: 'A leaf turns yellow. What’s your first move?',
    why: 'Why we ask: your first move shows which lesson would help most.',
    options: [
      { id: 'wonder_wrong', label: 'I wonder what I did wrong' },
      { id: 'feel_guilty', label: 'I feel guilty' },
      { id: 'water_or_sun', label: 'Water it or move it to the sun' },
      { id: 'check_roots', label: 'Check roots, soil and light' },
      { id: 'nutrients', label: 'Think nutrient deficiency' },
      { id: 'no_plant', label: 'I don’t own a plant yet' },
    ],
  },
  {
    id: 'q3',
    heading: 'What would feel like a win each morning?',
    why: 'Why we ask: so your plan aims at what you want from it.',
    options: [
      { id: 'inspiration', label: 'A little green inspiration' },
      { id: 'confidence', label: 'Confidence, less worry' },
      { id: 'save_gift', label: 'Saving a plant I was given' },
      { id: 'routine', label: 'A simple care routine' },
      { id: 'advanced', label: 'Dialing in advanced care' },
      { id: 'skip_basics', label: 'Skipping the basics' },
    ],
  },
  {
    id: 'q4',
    heading: 'How do you approach plant care today?',
    why: 'Why we ask: so the lessons match how much you already know.',
    options: [
      { id: 'blank_slate', label: 'I’m a blank slate' },
      { id: 'overwhelmed', label: 'Overwhelmed. Give me one trick' },
      { id: 'winging_it', label: 'Winging it day to day' },
      { id: 'know_basics', label: 'I know the basics' },
      { id: 'mechanics', label: 'I love the mechanics' },
      { id: 'botanical', label: 'I apply botanical science' },
    ],
  },
];

export const answerLabel = (questionId, answerId) => {
  const q = PLAN_QUESTIONS.find((item) => item.id === questionId);
  const o = q && q.options.find((item) => item.id === answerId);
  return o ? o.label : '';
};
