// Class strings for the paper family: Pip's nook page, the light lessons and the Pip cards.
// Everything on paper is a token from design/tokens.json (paper, paperCard, paperDeep, paperBorder,
// ink, inkSoft, paperGreen, paperAccent, paperPale, paperError). Text on paper is 4.5:1 or better.

const BUTTON = 'inline-flex min-h-touch items-center justify-center gap-2 rounded-control border-hairline px-4 py-3 font-ui text-sm font-medium disabled:opacity-60';

// The one filled action on a paper surface: Root with paper text.
export const PAPER_BUTTON = `${BUTTON} border-grove-root bg-grove-root text-grove-paper hover:bg-grove-paperGreen`;

// A quiet, outlined action.
export const PAPER_BUTTON_QUIET = `${BUTTON} border-grove-paperGreen bg-transparent text-grove-root hover:bg-grove-paperPale`;

// A full-width choice in a lesson step.
export const PAPER_CHOICE = 'w-full min-h-touch rounded-small border-hairline border-grove-paperGreen bg-grove-paper px-4 py-3 text-left font-ui text-sm text-grove-ink hover:bg-grove-paperPale disabled:opacity-60';

// A toggle chip (aria-pressed). The check icon is added by the caller, so state is never color alone.
export const paperChip = (on) =>
  `min-h-touch rounded-control border-hairline px-3 py-3 font-ui text-sm text-grove-ink ${
    on ? 'border-grove-root bg-grove-paperPale' : 'border-grove-paperGreen bg-grove-paper hover:bg-grove-paperPale'
  }`;

export const PAPER_FIELD = 'mt-1 min-h-touch w-full rounded-control border-hairline border-grove-paperGreen bg-grove-paper px-3 py-2 font-ui text-sm text-grove-ink';
export const PAPER_LINK = 'inline-flex min-h-touch items-center font-ui text-sm text-grove-paperGreen underline';
export const PAPER_ERROR = 'font-ui text-sm text-grove-paperError';
export const PAPER_LABEL = 'font-ui text-sm uppercase tracking-label text-grove-inkSoft';

// Surfaces.
export const PAPER_CARD = 'rounded-card border-hairline border-grove-paperBorder bg-grove-paperCard p-5';
export const PAPER_PANEL = 'rounded-card border-hairline border-grove-paperBorder bg-grove-paperDeep p-5';
export const PAPER_FRAME = 'rounded-chip bg-grove-paperDeep p-2';
