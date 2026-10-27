import { Hand, Sun, Cloud, Sprout, MapPin, Home, Sparkles, Eye } from 'lucide-react';

// Card text for the two light lessons. Cards with `interactive` get a step from `steps.js`.
// Both lessons are drawn on paper (see LessonPlayer): the same family, two quiet tints.
export const HEMISPHERE_NOTE = 'Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.';
const part1 = { paper: true, accent: 'from-grove-paperCard via-grove-paper to-grove-paperDeep', ring: 'text-grove-paperGreen' };
const part2 = { paper: true, accent: 'from-grove-paperCard via-grove-paper to-grove-paperPale', ring: 'text-grove-paperAccent' };

export const LIGHT_BASICS_CARDS = [
  {
    ...part1,
    header: 'Card 1 of 4 · Try it',
    headline: 'Try the hand test.',
    body: 'Hold your hand about a foot above the spot where your plant will go, around midday. What does the shadow look like?',
    icon: Hand,
    interactive: 'shadow-test',
  },
  {
    ...part1,
    header: 'Card 2 of 4 · What it means',
    headline: 'Direct and indirect light.',
    body:
      '<strong>Direct light</strong> means the sun&rsquo;s rays land on the leaves. A crisp shadow means direct light.<br/><br/>' +
      '<strong>Bright indirect light</strong> is a spot close to a bright window, within about 3 feet (1 meter), where daylight is strong but the sun does not land on the leaves. A soft shadow means bright indirect light, and a faint one means low light.<br/><br/>' +
      'Grove uses four words: direct, bright indirect, medium, and low.',
    cta: 'Got it',
    icon: Sun,
    interactive: 'reading-note',
  },
  {
    ...part1,
    header: 'Card 3 of 4 · The curtain',
    headline: 'A curtain softens the sun.',
    body:
      'A sheer curtain turns direct sun into filtered, bright indirect light. Same window, same spot, and a kinder light for leaves that scorch.<br/><br/>' +
      `<em>${HEMISPHERE_NOTE}</em>`,
    cta: 'Got it',
    icon: Cloud,
    interactive: 'curtain',
  },
  {
    ...part1,
    header: 'Card 4 of 4 · Read the plant',
    headline: 'Let the plant tell you.',
    body:
      'A plant stretching toward the glass, going pale, or showing crispy, scorched patches is telling you about its light.<br/><br/>' +
      'Light also fades quickly with distance. A plant a few steps back from the window gets a level less.<br/><br/>' +
      'If a plant already looks unwell, the Plant ER lesson is a good next step.',
    cta: 'Got it',
    icon: Eye,
  },
];

export const WINDOW_MAP_CARDS = [
  {
    ...part2,
    header: 'Card 1 of 4 · Your window',
    headline: 'Which window is yours?',
    body: 'Pick the window nearest the spot where your plant will go. Then tell us when the sun reaches it.',
    icon: MapPin,
    interactive: 'window-pick',
  },
  {
    ...part2,
    header: 'Card 2 of 4 · Your room',
    headline: 'Your room, lit your way.',
    body:
      'Here is how that window lights a room. Try the other directions to see how they differ.<br/><br/>' +
      'North windows give low light. Pothos and Snake plant tolerate it, but they will grow slowly and may need a brighter spot in winter. ' +
      'Pothos and Snake plant are toxic to cats and dogs if chewed. Keep them out of reach, or check the plant&rsquo;s pet-safety label first.<br/><br/>' +
      `<em>${HEMISPHERE_NOTE}</em>`,
    cta: 'Got it',
    icon: Home,
    interactive: 'window-room',
  },
  {
    ...part2,
    header: 'Card 3 of 4 · What fits',
    headline: 'What fits your light.',
    body: 'Light decides which plants are happy. Here is how your spot suits them.',
    cta: 'Got it',
    icon: Sprout,
    interactive: 'fits',
  },
  {
    ...part2,
    header: 'Card 4 of 4 · Your light',
    headline: 'That is your light.',
    body: 'A last look at the light you picked.',
    icon: Sparkles,
    interactive: 'closing',
  },
];
