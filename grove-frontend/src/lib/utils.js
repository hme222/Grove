import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge"
import { tokenNames } from "../styles/tokens.generated";

// tailwind-merge only knows Tailwind's stock scale. Teach it the token names (rounded-card,
// max-w-sheet, shadow-dialog, z-sheet, ...) so a caller's `rounded-small` replaces a component's
// default `rounded-card` instead of both landing on the element and the stylesheet order deciding.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: tokenNames.borderRadius }],
      // Without this, `border-strong` is read as a border colour and a later `border-grove-*` deletes it.
      "border-w": [{ border: tokenNames.borderWidth }],
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
