import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge"
import { tokenNames } from "../styles/tokens.generated";

// tailwind-merge only knows Tailwind's stock scale. Teach it the token names (rounded-card,
// max-w-sheet, shadow-dialog, z-sheet, ...) so a caller's `rounded-small` replaces a component's
// default `rounded-card` instead of both landing on the element and the stylesheet order deciding.
// Per-side widths (border-b-strong, border-x-hairline...) need the same lesson as the all-sides one.
const SIDE_WIDTHS = Object.fromEntries(
  ['x', 'y', 't', 'r', 'b', 'l'].map((side) => [`border-w-${side}`, [{ [`border-${side}`]: tokenNames.borderWidth }]])
);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: tokenNames.borderRadius }],
      // Without this, `border-strong` is read as a border color and a later `border-grove-*` deletes it.
      "border-w": [{ border: tokenNames.borderWidth }],
      ...SIDE_WIDTHS,
      aspect: [{ aspect: tokenNames.aspectRatio }],
      "max-w": [{ "max-w": tokenNames.maxWidth }],
      "max-h": [{ "max-h": tokenNames.maxHeight }],
      shadow: [{ shadow: tokenNames.boxShadow }],
      z: [{ z: tokenNames.zIndex }],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
