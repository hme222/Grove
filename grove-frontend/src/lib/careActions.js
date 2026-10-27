// The care actions a person can log. One list, used by the single-plant log and by bulk logging, so the
// two cannot drift. Every action has an icon and a label as well as a color: color never carries it alone.
import { Droplets, Wind, Utensils, RotateCw, Scissors, ClipboardCheck, Hand, Sun, Sparkles, Camera, FileText } from 'lucide-react';
import { Flower2 as FlowerIcon, Sprout as SproutIcon } from 'lucide-react';

export const CARE_ACTIONS = [
  { value: 'water', label: 'Water', icon: Droplets, color: 'var(--grove-lime)', hint: "Water until it runs from the bottom, then empty the saucer." },
  { value: 'mist', label: 'Mist', icon: Wind, color: 'var(--grove-sprout)', hint: "A light spray on the leaves. It does not replace watering." },
  { value: 'fertilize', label: 'Fertilize', icon: Utensils, color: 'var(--grove-sprout)', hint: "Plant food mixed into water, a few times a year." },
  { value: 'rotate', label: 'Rotate', icon: RotateCw, color: 'var(--grove-sage)', hint: "Turn the pot a quarter so all sides get light." },
  { value: 'prune', label: 'Prune', icon: Scissors, color: 'var(--grove-cream)', hint: "Cut off dead or yellow leaves with clean scissors." },
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: 'var(--grove-cream)', hint: "A look-over for pests, color and soil." },
  { value: 'soil_check', label: 'Soil test', icon: Hand, color: 'var(--grove-lichen)', hint: "Press a finger into the top inch of soil. Water if it is dry." },
  { value: 'light_check', label: 'Light check', icon: Sun, color: 'var(--grove-lichen)', hint: "Hold your hand above the spot at midday. A crisp shadow means direct sun." },
  { value: 'clean', label: 'Wipe leaves', icon: Sparkles, color: 'var(--grove-sprout)', hint: "Wipe dusty leaves with a damp cloth so they can use the light." },
  { value: 'repot', label: 'Repot', icon: FlowerIcon, color: 'var(--grove-sage)', hint: "Move it to a bigger pot with fresh soil." },
  { value: 'propagate', label: 'Propagate', icon: SproutIcon, color: 'var(--grove-sprout)', hint: "Take a cutting to grow a new plant." },
  { value: 'photo', label: 'Photo', icon: Camera, color: 'var(--grove-cream)', hint: "Add a photo to the plant’s journal." },
  { value: 'note', label: 'Note', icon: FileText, color: 'var(--grove-lichen)', hint: "Write what you noticed." },
];

// Bulk logging offers the first six: the ones that make sense across many plants at once.
export const BULK_ACTIONS = CARE_ACTIONS.slice(0, 6);
