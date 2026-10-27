// Plain-language first checks for common plant problems. These are common causes, not a
// diagnosis: each one says what to look at and what to try, in the order that is usually right.
export const SYMPTOMS = [
  {
    id: 'yellow-leaves',
    soilCheck: true,
    label: 'Yellow leaves',
    causes: [
      { title: 'Too much water', check: 'Push a finger into the soil, to the second knuckle in a pot 6 in (15 cm) or bigger and the first in a small pot. If it is still wet days after watering, this is likely it. Lower leaves go yellow and soft first.', fix: 'Let the soil dry out before the next drink, empty the saucer, and make sure the pot has drainage holes.' },
      { title: 'Not enough light', check: 'Older leaves turn yellow while the plant slows down or stretches toward the window.', fix: 'Move it closer to bright, indirect light.' },
      { title: 'Normal aging', check: 'One lower leaf yellows now and then while the rest looks healthy.', fix: 'Pinch off the old leaf. No other change is needed.' },
      { title: 'Hungry for nutrients', check: 'New growth looks pale during spring and summer, and the plant has not been fed in months.', fix: 'Feed at half the strength on the label, once a month in the growing season.' },
    ],
  },
  {
    id: 'brown-tips',
    soilCheck: true,
    label: 'Brown, crispy tips',
    causes: [
      { title: 'Dry soil or dry air', check: 'The soil is bone dry, or the plant sits near a heater or vent.', fix: 'Water thoroughly until it drains, then move it away from direct heat or airflow.' },
      { title: 'Minerals in tap water', check: 'Tips brown on a peace lily, spider plant or dracaena, and you water with hard tap water.', fix: 'Use filtered or rain water, and flush the soil with plain water every few months.' },
      { title: 'Sun scorch', check: 'Tan or bleached patches on the sunny side of the plant, often on leaves close to the glass.', fix: 'Move it back from the glass or out of direct midday sun. Scorched patches will not turn green again; new growth will.' },
      { title: 'Too much fertilizer', check: 'You feed often and a white crust shows on the soil or pot rim.', fix: 'Flush the pot with water until it runs clear, then skip feeding for a few weeks.' },
    ],
  },
  {
    id: 'drooping',
    soilCheck: true,
    label: 'Drooping or wilting',
    causes: [
      { title: 'Thirsty', check: 'The soil is dry and the pot feels light.', fix: 'Water thoroughly. Most plants perk up within a day.' },
      { title: 'Too wet, roots struggling', check: 'The plant droops even though the soil is wet, and may smell sour.', fix: 'Stop watering and let the soil dry out. If the roots are mushy or smell sour, slide the plant out, trim the mushy brown roots, and repot into fresh, airy mix.' },
      { title: 'Shock from a change', check: 'You recently moved it, repotted it, or it sits in hot afternoon sun.', fix: 'Keep it somewhere steady, out of harsh sun, and give it a week or two to settle.' },
    ],
  },
  {
    id: 'soft-stem',
    label: 'Mushy stem or black spots',
    causes: [
      { title: 'Rot from overwatering', check: 'The stem base is soft, dark or smells bad.', fix: 'Act quickly: unpot it, cut away soft parts, repot in dry fresh mix, and hold off watering for several days. A healthy stem piece can be rooted as a backup.' },
      { title: 'Cold damage', check: 'Black patches on leaves touching a cold window, or after a draft.', fix: 'Move it away from cold glass and drafts. Damaged leaves will not recover; new growth will.' },
    ],
  },
  {
    id: 'dropping-leaves',
    soilCheck: true,
    label: 'Leaves dropping',
    causes: [
      { title: 'A recent change', check: 'It was moved, repotted, or the light or temperature changed in the last few weeks.', fix: 'Keep conditions steady. Some drop after a move is normal.' },
      { title: 'Watering at the extremes', check: 'The soil has been either soaked or dry for a long stretch.', fix: 'Aim for even watering. Use the finger test before each drink.' },
      { title: 'The season', check: 'It is fall or winter and only a few older leaves are falling.', fix: 'This can be natural. Water a little less and keep it bright.' },
      { title: 'Resting for winter', check: 'It is the dark months, growth has slowed, and the plant looks otherwise healthy.', fix: 'Many plants rest in winter and use less water. Check the soil first, water less often, and do not feed or repot until spring.' },
    ],
  },
  {
    id: 'leggy',
    label: 'Long, stretchy growth',
    causes: [
      { title: 'Not enough light', check: 'Long gaps between leaves and stems leaning toward the window.', fix: 'Move it to a brighter spot and turn the pot a quarter turn each week. Trim leggy stems to encourage fuller growth.' },
    ],
  },
  {
    id: 'bugs',
    label: 'Bugs or sticky leaves',
    causes: [
      { title: 'Spider mites or scale', check: 'Fine webbing, tiny speckles, or small brown bumps with a sticky residue.', fix: 'Move it away from other plants, wipe leaves with a damp cloth or mild soapy water (test on one leaf first and wait a day), and repeat weekly for three weeks. Keep the plant away from pets while the soap dries.' },
      { title: 'Mealybugs', check: 'White cottony patches where leaves meet the stem.', fix: 'Dab each patch with a cotton swab dipped in rubbing alcohol, then wipe the plant down (test on one leaf first). Check again after a week. Keep the plant away from pets while the alcohol dries.' },
      { title: 'Fungus gnats', check: 'Tiny flies rising from the soil when you water.', fix: 'Let the top two inches of soil dry between drinks and use yellow sticky traps.' },
    ],
  },
  {
    id: 'white-fuzz',
    label: 'White powder or fuzz',
    causes: [
      { title: 'Powdery mildew', check: 'A dusty white film on leaf surfaces.', fix: 'Remove badly affected leaves, give the plant more airflow, and water the soil, not the leaves.' },
      { title: 'Mold on the soil', check: 'White fuzz on the soil surface only.', fix: 'Scrape off the top layer, let the soil dry out, and open a window for air.' },
    ],
  },
  {
    id: 'not-growing',
    label: 'Not growing',
    causes: [
      { title: 'Resting for winter', check: 'It is the dark months and the plant looks otherwise healthy.', fix: 'This is normal. Water less and do not feed until spring.' },
      { title: 'Too little light', check: 'It has stayed the same size for months in a dim spot.', fix: 'Try a brighter location with indirect light.' },
      { title: 'Roots with no room', check: 'Roots poke out of the drainage holes or circle the surface.', fix: 'Repot into a pot one size up in spring.' },
    ],
  },
];

// Overwatering is the most common way a new owner hurts a plant, and wilting looks the same whether
// the soil is dry or soaked. So for symptoms that depend on moisture, the soil check comes first.
export const SOIL_CHECK = {
  title: 'First, feel the soil',
  body: 'Push a finger into the soil, to the second knuckle in a pot 6 in (15 cm) or bigger and the first in a small pot.',
  dry: 'Dry: water thoroughly, until it runs out of the bottom. Succulents and cacti: wait until the whole pot is dry.',
  wet: 'Wet or soggy: do not water. Check the roots and the drainage.',
};

export const SAFETY_NOTE = 'If a pet or child has eaten part of a plant, act at once. If a child collapses, has a seizure, has trouble breathing or cannot be woken, call 911 (or your local emergency number) now. Pets: call your vet or the ASPCA Animal Poison Control line, (888) 426-4435 in the US (a fee may apply). Children: call your local poison center (US poison help line 1-800-222-1222, or poison.org online). Outside the US, ask your local vet or poison center. Do not make them vomit unless told to, and bring the plant or a photo of it.';

// The same emergency guidance as a labelled list, so it can be scanned in a hurry. In an emergency
// comes first. SAFETY_NOTE above stays as the plain-text version of the same words.
export const SAFETY_INTRO = 'If a pet or child has eaten part of a plant, act at once.';
export const SAFETY_CONTACTS = [
  {
    id: 'emergency',
    heading: 'In an emergency',
    text: 'If a child collapses, has a seizure, has trouble breathing or cannot be woken, call 911 or your local emergency number now.',
    links: [{ label: 'Call 911', href: 'tel:911' }],
  },
  {
    id: 'pet',
    heading: 'If a pet ate it',
    text: 'Call your vet or the ASPCA Animal Poison Control line. A fee may apply.',
    links: [{ label: 'ASPCA Animal Poison Control, (888) 426-4435', href: 'tel:+18884264435' }],
  },
  {
    id: 'child',
    heading: 'If a child ate it',
    text: 'Call your local poison center.',
    links: [
      { label: 'US poison help line, 1-800-222-1222', href: 'tel:+18002221222' },
      { label: 'poison.org', href: 'https://www.poison.org', external: true },
    ],
  },
  {
    id: 'outside-us',
    heading: 'Outside the US',
    text: 'Ask your local vet or poison center.',
    links: [],
  },
];
export const SAFETY_STEPS = 'Do not make them vomit unless told to. Bring the plant or a photo.';
