// Credits for every self-hosted photo in public/photos. All are from Unsplash, free to use under the
// Unsplash License (https://unsplash.com/license); credit is appreciated, not required. Thumbnails are
// crops of the same photo. Add a row here whenever a file is added: a test fails if a photo is used
// in src without a credit, or if a credited file is missing.
const LICENSE = 'Unsplash License';
const p = (id) => `https://unsplash.com/photos/${id}`;
const a = (handle) => `https://unsplash.com/@${handle}`;

const SKYE = ['Skye Whisler', a('skyewhisler'), p('a-potted-plant-sitting-on-a-table-next-to-a-watering-can-4uX2gnJ19QQ')];
const JAKAYLA = ['Jakayla Toney', a('thegardenstateexplorer'), p('sunlight-streams-through-lush-green-houseplants-on-windowsill-sl0v1Ud9Eqk')];
const HANNES = ['Hannes Köttner', a('hk_filmografy'), p('a-potted-plant-sitting-in-front-of-a-window-cFDWyDkmxBI')];
const AJOY = ['AJOY DAS', a('champsara'), p('close-up-of-dry-soil-with-scattered-pebbles-0ldAi89gjx4')];
const VERONIQUE = ['Véronique Trudel', a('veroniquetrudel'), p('a-shelf-filled-with-potted-plants-and-a-watering-can-jud8545RZr4')];
const ANNIE = ['Annie Spratt', a('anniespratt'), p('green-potted-plant-on-brown-wooden-table-yyXw1lGJypI')];
const KATE = ['Kate Darmody', a('kdarmody'), p('green-potted-plant-on-brown-wooden-table-m40vzmdVMR8')];
const MICHAEL = ['Michael Kater', a('michael_kater'), p('a-room-filled-with-lots-of-potted-plants-next-to-a-window-Tl24So-5CCw')];
const REKA = ['Réka Romány', a('ro_reka'), p('green-plant-on-white-window-curtain-ueKSayFn4XI')];
const ANGELINA = ['Angelina Jollivet', a('angelinajlv'), p('pink-beige-and-red-flower-bouquet-in-clear-glass-vase-mNEpmNiFdXs')];
const WOLFGANG = ['Wolfgang Hasselmann', a('wolfgang_hasselmann'), p('a-small-green-plant-growing-from-the-soil-sGMVZeb7yiQ')];
const VIKA = ['Vika Chartier', a('vikachartier'), p('green-potted-plant-near-window-Y0dBD80odGw')];

const HOWARD = ['Howard Walsh', a('hswalsh'), p('a-dirt-path-winds-through-a-sun-dappled-forest-eohdpP_XFJw')];
// The first-run photos were exported from the Figma file 'Grove App', where the layer names credit Maxx Gong
// on Unsplash. The profile is verified; the exact photo pages are not, so photoUrl is the profile and the note says so.
const MAXX = ['Maxx Gong', a('maxxgong'), a('maxxgong')];
const UNVERIFIED = 'photo page not verified';

const row = (file, title, [photographer, photographerUrl, photoUrl], note) => ({ file, title, photographer, photographerUrl, photoUrl, license: LICENSE, ...(note ? { note } : {}) });

export const photoCredits = [
  row('watering-1.jpg', 'Snake plant beside a pale blue watering can', SKYE),
  row('watering-thumb-1.jpg', 'Snake plant beside a pale blue watering can (thumbnail)', SKYE),
  row('light-1.jpg', 'Sunlight through houseplants on a windowsill', JAKAYLA),
  row('light-thumb-1.jpg', 'Sunlight through houseplants on a windowsill (thumbnail)', JAKAYLA),
  row('light-2.jpg', 'A small plant in front of a window', HANNES),
  row('light-thumb-2.jpg', 'A small plant in front of a window (thumbnail)', HANNES),
  row('soil-1.jpg', 'Close-up of dry soil', AJOY),
  row('soil-thumb-1.jpg', 'Close-up of dry soil (thumbnail)', AJOY),
  row('shelf-1.jpg', 'A shelf of potted plants', VERONIQUE),
  row('shelf-thumb-1.jpg', 'A shelf of potted plants (thumbnail)', VERONIQUE),
  row('plant-1.jpg', 'Potted plants on a table', ANNIE),
  row('plant-thumb-1.jpg', 'Potted plants on a table (thumbnail)', ANNIE),
  row('plant-2.jpg', 'A living room with plants by the window', KATE),
  row('room-1.jpg', 'Plants in a sunny window', MICHAEL),
  row('calm-1.jpg', 'A plant beside a white curtain', REKA),
  row('bouquet-1.jpg', 'A bouquet in a glass vase', ANGELINA),
  row('sprout-1.jpg', 'A small fern sprout in soil', WOLFGANG),
  row('window-1.jpg', 'Small plants along a windowsill', VIKA),
  row('welcome-forest.jpg', 'A sunlit path through a forest', HOWARD),
  row('welcome-forest-edited.jpg', 'A misty forest (the edited welcome photo)', MAXX, UNVERIFIED),
  row('onboarding-forest.jpg', 'A misty forest', MAXX, UNVERIFIED),
  row('onboarding-shelf.jpg', 'A shelf of plants', MAXX, UNVERIFIED),
  row('onboarding-plants.jpg', 'Potted plants', MAXX, UNVERIFIED),
  row('onboarding-windowsill.jpg', 'Plants on a windowsill', MAXX, UNVERIFIED),
  row('onboarding-sprouts.jpg', 'Sprouts in soil', MAXX, UNVERIFIED),
  row('onboarding-soil.jpg', 'Close-up of soil', MAXX, UNVERIFIED),
];

export default photoCredits;
