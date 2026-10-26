// Colour helpers that work with design-token variables (var(--grove-*)) as well as plain colours.

// A translucent tint of a colour. Appending an alpha to a hex string does not work for a variable.
export const tint = (color, percent) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

// Each themed guild takes its accent from the palette. The guild's own colour in the database is ignored,
// so a guild can never bring a colour that is not a token.
const GUILD_ACCENT = {
  'low-light-hallway': 'sage',
  'cut-flower-border': 'lichen',
  'native-pollinator-bed': 'sprout',
  'tropical-humidity-cluster': 'lime',
};
export const guildAccent = (guild) => `var(--grove-${GUILD_ACCENT[guild?.slug] || 'lime'})`;
