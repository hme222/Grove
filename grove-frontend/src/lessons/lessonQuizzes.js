// Micro-quizzes that end the reading-card lessons, and the "try it" step after each one.
// Every question is a situation with one correct answer. Each option carries its own short
// reason, shown the moment it is picked, so a wrong pick teaches instead of scoring.
// Facts are limited to what the lesson cards and sources state.

export const LESSON_QUIZZES = {
  'plant-parent-reset': [
    {
      id: 'calendar',
      prompt: 'It is Saturday, your usual watering day. You push a finger into the soil and it is still damp. What do you do?',
      options: [
        { id: 'a', label: 'Water it anyway, because it is Saturday.', why: 'A fixed day ignores what the soil is saying. Check the soil first, every time.' },
        { id: 'b', label: 'Leave it and check again in a day or two.', correct: true, why: 'Check the soil before watering, and water when it is dry rather than on a set calendar day.' },
        { id: 'c', label: 'Water a little, to stay on schedule.', why: 'A small top-up on a schedule still adds water the soil did not ask for. Let the soil decide.' },
      ],
    },
    {
      id: 'cachepot',
      prompt: 'You love a decorative pot, but it has no drainage hole. How do you use it?',
      options: [
        { id: 'a', label: 'Keep the plant in its nursery pot inside it. Lift the plant out to water, let it drain, then put it back.', correct: true, why: 'The nursery pot has holes, so water can drain, and lifting the plant out to water keeps the roots out of standing water.' },
        { id: 'b', label: 'Plant straight into it and water a little at a time.', why: 'Without a hole the water has nowhere to go. Pots need drainage holes, however carefully you water.' },
        { id: 'c', label: 'Plant straight into it and water on a fixed day.', why: 'Without a hole the water has nowhere to go. Pots need drainage holes, and a fixed day adds to the risk.' },
      ],
    },
    {
      id: 'light',
      prompt: 'Which of these is bright, indirect light?',
      options: [
        { id: 'a', label: 'A spot where you can read a book without a lamp.', why: 'Being able to read is not a reliable test of plant light. Look at where the spot sits instead.' },
        { id: 'b', label: 'On a sill in hot midday sun, touching the glass.', why: 'That is direct light, which can scorch leaves. Indirect means out of the direct midday sun.' },
        { id: 'c', label: 'A spot close to a bright window, within about 3 feet (1 meter), where the sun does not land on the leaves.', correct: true, why: 'That is bright and indirect: strong daylight without the sun landing on the leaves.' },
      ],
    },
  ],
  'plant-er': [
    {
      id: 'no-holes',
      prompt: 'You inherit a plant in a pot with no drainage holes. What is a safe next step?',
      options: [
        { id: 'a', label: 'Water it a little at a time so it never pools.', why: 'Even small amounts collect at the bottom when there is no hole. Pots need drainage holes.' },
        { id: 'b', label: 'Keep the plant in a pot with holes, such as its nursery pot. If it sits in an outer pot, lift the plant out to water, let it drain, then put it back.', correct: true, why: 'Water can drain through the holes, and lifting the plant out to water keeps the roots out of standing water.' },
        { id: 'c', label: 'Water it well, then tip it out later.', why: 'Water that sits against the roots is the risk, and tipping it later leaves it there in the meantime.' },
      ],
    },
    {
      id: 'wet-droop',
      prompt: 'The plant is drooping, and the soil is soaking wet. What do you do?',
      options: [
        { id: 'a', label: 'Give it a drink, because drooping means thirsty.', why: 'With wet soil, drooping is usually a sign of overwatering, so more water would add to the problem.' },
        { id: 'b', label: 'Hold off watering and let the soil dry out.', correct: true, why: 'A drooping plant with wet soil is usually overwatered. Let it dry, then check the soil again.' },
        { id: 'c', label: 'Repot it into fresh soil today.', why: 'Repotting is for when the roots are mushy or smell sour. Start by letting the soil dry out and checking the roots.' },
      ],
    },
    {
      id: 'feed',
      prompt: 'The plant looks stressed. Should you fertilize it to help it recover?',
      options: [
        { id: 'a', label: 'Yes, a feed gives it energy to recover.', why: 'Do not fertilize a stressed plant. Feeding adds to the load on the roots.' },
        { id: 'b', label: 'No. Sort out the basics first and leave the fertilizer.', correct: true, why: 'Do not fertilize a stressed, newly potted or dormant plant. Light, drainage and watering come first.' },
        { id: 'c', label: 'Only if it was repotted recently.', why: 'A recently potted plant is also one not to fertilize, so that is no reason to feed it.' },
      ],
    },
  ],
  'habit-stacking': [
    {
      id: 'what-to-do',
      prompt: 'Your habit cue fires: you have just ground your coffee. What do you do at the plant?',
      options: [
        { id: 'a', label: 'Check the soil, and water only if it is dry.', correct: true, why: 'The cue is a reminder to look. Check the soil before watering, then decide.' },
        { id: 'b', label: 'Water it, because the habit says it is time.', why: 'A habit is a reminder to check, not an order to water. Watering on a routine ignores what the soil needs.' },
        { id: 'c', label: 'Water a little every day so it never dries out.', why: 'Daily top-ups can leave the soil wet all the time. Check the soil first.' },
      ],
    },
    {
      id: 'knuckle',
      prompt: 'After feeding the cat, you check a small desk plant in a 4 inch pot. How deep do you push your finger?',
      options: [
        { id: 'a', label: 'To the first knuckle.', correct: true, why: 'In small pots, the first knuckle is deep enough. Pots 6 inches (15 cm) or bigger need the second knuckle.' },
        { id: 'b', label: 'To the second knuckle.', why: 'The second knuckle is for pots 6 inches (15 cm) or bigger. A small pot only needs the first.' },
        { id: 'c', label: 'Just touch the surface.', why: 'The top can dry while the soil below is still wet. Push your finger in to the first knuckle.' },
      ],
    },
    {
      id: 'succulent',
      prompt: 'The plant at your desk is a desert succulent, an aloe. When does it want water?',
      options: [
        { id: 'a', label: 'Whenever the top of the soil feels dry.', why: 'Desert succulents and cacti want the whole pot dry, not just the top.' },
        { id: 'b', label: 'Every time you do your habit.', why: 'A habit is a time to check, not to water. Desert succulents and cacti want the whole pot dry first.' },
        { id: 'c', label: 'When the whole pot is dry.', correct: true, why: 'Desert succulents want the whole pot dry before the next drink. A finger cannot test a whole pot, so lift it: a light pot is a dry pot.' },
      ],
    },
  ],
};

// What the "Try it on your plant" step does for lessons with a natural action. Lessons not listed
// here keep the plain Mark lesson done step.
export const LESSON_ACTIONS = {
  'plant-er': {
    to: '/plants',
    text: 'Pick one of your plants and lift it. Check the bottom of the pot for drainage holes.',
    cta: 'Choose a plant',
  },
  'habit-stacking': {
    to: '/care/today',
    text: 'Open Today and pick the daily moment you will use to check your plants.',
    cta: 'Open Today',
  },
};
