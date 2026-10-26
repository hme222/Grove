import { Moon, Flower2, Bug, Droplets, Layers } from 'lucide-react';

// Each themed guild has its own symbol as well as its own accent, so they read as four different
// things at a glance instead of four tinted copies of one tile.
const ICONS = {
  'low-light-hallway': Moon,
  'cut-flower-border': Flower2,
  'native-pollinator-bed': Bug,
  'tropical-humidity-cluster': Droplets,
};

export const guildIcon = (guild) => ICONS[guild?.slug] || Layers;
