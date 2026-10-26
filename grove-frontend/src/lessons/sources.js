// Where each lesson's plant-care claims come from. Only pages that were opened and read are listed,
// each with a paraphrase of what it supports. `gaps` says plainly what no page was found for.
// RHS = Royal Horticultural Society. Kew = Royal Botanic Gardens, Kew.

const RHS_WATER = {
  publisher: 'RHS',
  title: 'How plants absorb water',
  url: 'https://www.rhs.org.uk/advice/understanding-plants/how-plants-absorb-water',
  supports: 'Feel the soil with a finger and water only if it is dry. Waterlogged compost pushes out the air roots need, and yellowing and rotten roots can follow.',
};
const RHS_BREATHE = {
  publisher: 'RHS',
  title: 'How plants breathe and exchange gases',
  url: 'https://www.rhs.org.uk/advice/understanding-plants/how-plants-breathe',
  supports: 'Roots take in oxygen from air in the compost, so pots need drainage holes and excess water should drain away.',
};
const RHS_LIGHT = {
  publisher: 'RHS',
  title: 'How plants use light to grow',
  url: 'https://www.rhs.org.uk/advice/understanding-plants/how-plants-use-light-to-grow',
  supports: 'South and west aspects are sunnier and warmer; north and east are shadier. Pale, spindly growth can mean too little light.',
};
const RHS_HOUSEPLANTS = {
  publisher: 'RHS',
  title: 'Houseplant 101',
  url: 'https://www.rhs.org.uk/plants/types/houseplants/houseplant-101',
  supports: 'A beginner series on watering, light and humidity for the main kinds of houseplant.',
};
const KEW_ORCHIDS = {
  publisher: 'Kew',
  title: 'Caring for your orchids',
  url: 'https://www.kew.org/read-and-watch/caring-for-your-orchids',
  supports: 'Water when the pot feels light and the compost is dry, then let it dry again before the next watering (written for orchids).',
};
const KEW_CLEAN = {
  publisher: 'Kew',
  title: 'How to: Spring clean your houseplants',
  url: 'https://www.kew.org/read-and-watch/how-to-spring-clean-your-houseplants',
  supports: 'Dust on leaves blocks light, so wiping leaves helps plants use the light they get.',
};

const GAP_WINTER = 'We found no page we read on how much less to water in winter than in summer. Plants usually need water less often in winter, so check the soil rather than follow a number.';
const GAP_KNUCKLE = 'The knuckle depth (second knuckle in a pot 6 in or 15 cm or bigger, first knuckle in a small pot) is common practice, not taken from a page we read.';
const GAP_PETS = 'We did not check pet toxicity for the plants named as examples. Several common houseplants, such as Monstera, Pothos and Philodendron, can be harmful to cats and dogs, so look up each plant before you bring it home if you have pets.';

export const LESSON_SOURCES = {
  'soil-finger-test': { sources: [RHS_WATER, KEW_ORCHIDS], gaps: [GAP_WINTER, GAP_KNUCKLE] },
  'plant-parent-reset': {
    sources: [RHS_WATER, RHS_BREATHE, RHS_LIGHT, RHS_HOUSEPLANTS],
    gaps: [
      '"Bright, indirect light" is explained in an RHS video we did not read, so the plain-words definition here is ours.',
      GAP_WINTER,
      GAP_KNUCKLE,
    ],
  },
  'plant-er': {
    sources: [RHS_BREATHE, KEW_ORCHIDS, RHS_HOUSEPLANTS],
    gaps: [
      'We found no Kew or RHS page on draughts, so that card is common practice, not sourced.',
      'The advice to soak a pot that water runs straight through for 20 minutes in a basin, and to hold off repotting and feeding a plant in distress, is common practice, not taken from a page we read.',
      GAP_WINTER,
      GAP_KNUCKLE,
    ],
  },
  'window-blueprint': {
    sources: [RHS_LIGHT, KEW_CLEAN],
    gaps: [
      'The sources describe south and west as sunnier for the northern hemisphere. For the southern hemisphere we swap north and south, which is our reading, not a page we read.',
      GAP_PETS,
    ],
  },
  'habit-stacking': {
    sources: [RHS_WATER],
    gaps: [
      'The habit technique is not plant science. The watering step in it follows the source here.',
      GAP_WINTER,
      GAP_KNUCKLE,
      GAP_PETS,
    ],
  },
};
