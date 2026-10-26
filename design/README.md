# FloraGrove design (v0.2)

Made Oct 19, 2026 from the dark-forest onboarding mock.

- `tokens.json`: the single source of truth for the app. `grove-frontend` generates its CSS variables and Tailwind theme from it (`npm run tokens`); never edit the generated files. `grove-tokens.css` is the older hand-written copy, kept for the design canvases only.
- `design-system.dc.html`, `waitlist-landing.dc.html`: artboard sources from the Grove design canvas on claude.ai (they render there, not standalone).
- `forest-placeholder.jpg`: cropped from the mock screenshot at 370×240. Too low-res to ship; swap in a full-size photo.

Waitlist placeholders still to fill: email provider (form is design-only), privacy policy link, contact email, and what the signup email promises.

## v0.2 (Oct 2026)
- Chosen landing page: studio/Studio12-Rise.dc.html
- New tokens: night, well, fern line, lichen, two primaries, field and phone radii, motion. See tokens.json.
- Not yet applied to grove-frontend (index.css / tailwind.config.js still use the old light palette).


## v0.3 (Studio 12 approved)
- Hand-drawn lines: tapered filled shape, no wobble, no pen tip. Revealed by a soft-edged wipe that moves straight down (top to bottom), slow pen pace (2.2s / 1.5s).
- Stars: pop in, then twinkle on three rhythms.
- Welcome sequence: Grove + Welcome to Grove, stars, line 1, definition, line 2, photo with the rest. App plays once (tap to skip); landing page loops slowly.
- Phone frame: real iPhone proportions (364 x 763), peeks from the bottom of the page.
- In the app: grove-frontend/src/components/WelcomeScreen.js (+ .css) is the first onboarding screen.


## v0.4 (FloraGrove rebrand)
- Name: FloraGrove (one word, capital F and G). Community groups keep the lowercase name "grove". (The tabs are now Today, Plants, Learn, Community.)
- Wordmark: light Alegreya Sans "Flora" + bold Cormorant Garamond "Grove", with two leaves as the "v" (outlined = Flora, solid = Grove). Outlined SVGs in design/brand/.
- Mark and app icon: the v on Root #202D14 (design/brand/icon-1024.png, favicon.svg).
- Welcome screen: "Welcome to FloraGrove"; the first hand-drawn line and the stars were re-fitted to the new word position.
- In the app: src/components/brand/FloraGroveWordmark.js and FloraGroveMark.js.

## Final landing page
12C is the chosen landing page: Studio 12 with the "Coming to iPhone · Dec 2026" pill and "Free to join. Coming to iPhone in December." under the button (design/studio/date/StudioDate-C-Pill.dc.html; design/studio/Studio12-Rise.dc.html matches it). The app (/waitlist) and grove-landing use it.


## v0.5 (tokens drive the app)
- `design/tokens.json` now holds colour, radius, border width, max/min sizes, z-index, type sizes and the shadcn variable mapping. `npm run tokens` writes `src/styles/tokens.generated.css` and `tailwind.tokens.js`; `prestart` and `prebuild` run it.
- `npm run check:tokens` fails on raw hex, `rgb()`/`rgba()`/`hsl()` literals, stock Tailwind palette colours, stock `font-sans`/`font-mono`/`font-serif`, numeric `width`/`height`/`margin*`/`padding*`/`borderRadius` in inline `style={{}}`, and arbitrary bracket values (radius, text, border, size, spacing and position, z-index, colour). Transparency is `tint()` or `color-mix` over a `var(--grove-*)`. `scripts/token-exceptions.json` lists each named exception with a reason and a retirement condition and fails when one goes stale; the list is short and every entry is art tied to a device frame or a composition canvas, or a file another workstream still owns. `npm run verify` runs tokens, lint, tests and the build.
- The shadcn colour layer (`--primary`, `--background`, `--border`, ...) is bound to tokens exactly. `scripts/generate-tokens.js` emits each variable as a space-separated integer RGB triplet (`--primary: 146 180 75`, lime `#92B44B`) and `tailwind.config.js` consumes it as `rgb(var(--primary) / <alpha-value>)`; the old rounded `hsl(var(--x))` form is gone, so a default Button renders the token hex. `scripts/check-computed-tokens.js` (part of `npm run check:tokens` and `verify`) parses the generated CSS, fails if any shadcn variable does not resolve to exactly its token hex, and fails on any `hsl(var(` consumer. Built-page computed styles were checked against the token hex.
- `src/components/ui/**` is linted like the rest of the source and scanned by `check-tokens`.
- Navigation is a link, an action is a button. `src/components/AppLink.js` renders `<a href={to}>` and on a plain left-click calls `preventDefault()` and `useNavigate()(to)`; modifier keys, middle-click and `target="_blank"` fall through to the browser, so new tab and copy link work. It imports only `useNavigate` from react-router-dom. Tab bar tabs (`aria-current`), plant and bouquet tiles, shortcut pills, grove and room rows, search rows, lesson rows and notification rows use it.
- Landmarks: `PageHeader` renders a `<header>`; `ProtectedFullScreen` wraps its routes in `<main id="main-content">` with its own skip link, so pages inside it do not render a `<main>` of their own. The page scroll container sets `scrollbar-gutter: stable` so header icons do not shift when a scrollbar appears.
- More tokens: `w-popover`, `shadow-rest|lift|dialog` (shadows are tinted Night, never pure black), `pb-nav` (tab bar height from `navHeight` plus the safe area). Tailwind's `sans` and `mono` families resolve to the UI face.
- Utility names: `rounded-control|small|inset|chip|tag|round|card|field|hairline`, `border-hairline|strong`, `max-w-page|content|sheet|column|form|note|dialog|entry|reading`, `min-h-touch|row|panel|screen|hero|field`, `min-w-touch|tab`, `z-nav|sheet|entry|...`. Dynamic colour in inline styles uses `var(--grove-*)`, with `tint()` from `lib/color.js` for transparency.
Header: the title row is at least 44px high and the title's first line sits at the same height; a wrapped long title makes the header one line taller. It sits at x=16 on tab roots and moves right of the Back button on pushed screens. A long title (a guild name) wraps to a second line inside the header instead of being cut off.
- Pushed sub-pages (title at x=80 beside Back): `/lessons`, `/groves`, `/rooms`, `/bouquets`, `/wants`, `/wishlist`, `/swaps`, `/add-plant` and everything under Profile. Tab roots (Today, Plants, Learn, Community, Profile) have no Back.
- Compact rows include the Today plant row and guild species rows (`rounded-small px-4 py-3`); the Learn species cards are cards because they carry an image. Not-found pages all use `NotFoundPage` with a Back to the place the person came from.
- Today and Progress carry the To do / Progress strip inside the header, so their header is one row taller; that is the only header with a second row.
- Tiles (badge, photo, plant tiles) are `rounded-chip` with their own padding; rows are `rounded-small px-4 py-3`; cards are `rounded-card p-5`.
- Page actions (Select, Add, Post an update, Water all) live in one toolbar row at the top of the page body, right-aligned, built from `HeaderAction`; the header itself holds only Back, the title, the bell and the profile button.
- Cards: one card is `rounded-card`, 20px padding, 0.5px hairline; a compact row is `rounded-small`, `px-4 py-3`. Display type (Cormorant) is for titles of 16px and up; labels and captions use the UI face. Borders are `border-hairline` or `border-strong`, never a bare `border`.
- Dialogs: the lime button is always the top button. It is the safe choice when the action removes or ends something (Archive, Leave, Delete, Cancel swap, Reset: `ConfirmDialog`), and the committing action everywhere else (Log care, Water all). The other button is outlined. Dialogs scroll inside the viewport on short screens (`max-h-viewport`).
- One switch: `SwitchRow` (whole row is the 44px target, state written as On/Off as well as shown). One failed-load pattern: `LoadError` / `LoadErrorPage`, always with Try again, never a zero or an empty state.
- Every button, tab and switch is at least 44 by 44 px (global floor in `index.css`; inline text links are exempt under WCAG 2.5.5).
- Archive, not Delete: the dialog says what leaves and what is kept, and the toast offers Undo (`POST /plants/{id}/restore`).
- One Button. Actions go through `src/components/ui/button.jsx` (`Button`, `buttonVariants`): `default` (lime on Root, the one primary), `outline` (transparent, `border-strong border-grove-fernLine text-grove-cream hover:bg-grove-moss`), `ghost`, `link`, `destructive`, and `chip` (round pill, lime fill when `aria-pressed`). One radius (`rounded-control`; `chip` is the pill), one face (`font-ui`), a 44px floor (`min-h-touch`; `size="icon"` is `h-touch w-touch`). Raw buttons and links are written `className={cn(buttonVariants({ variant }), "layout-only classes")}`; `AlertDialogCancel` takes a `variant`. Tiles, chips with state ternaries and icon toggles may stay raw. ESLint (`no-restricted-syntax` in `eslint.config.js`) fails on a raw `<button>` or `<a>` whose `className` string or template carries `bg-grove-lime`, so a new lime button has to use `buttonVariants`; a variant-prefixed state style such as `focus:bg-grove-lime` is allowed.
- Waiting: `src/components/Loading.js`. `Loading({ label, className })` is `role="status"`, a decorative spinner (`Spinner`, aria-hidden, still under reduced motion) and a visible label such as "Loading your plants", so the words carry the meaning. `LoadingList({ count, label })` is static `bg-grove-moss/40 rounded-card h-24` blocks plus the label, used for list and grid waits (Today, Plants, Learn, Community feed, Groves, Rooms). No bare spinner divs.
- Failure inside a working screen: `LoadError compact` (same words as the full card, smaller, `role="alert"`, the same lime Try again through `buttonVariants`, optional one-line `note` such as "The plant guide below still works."). Used for the guilds row, lesson progress, search and the public bouquet. When both the guilds and the species list fail on Learn there is one `LoadError`, naming both, and no "still works" claim.
- Scrim: one `bg-scrim` colour token (Night at 80%, a `color-mix` in `tokens.json` `backgroundColor`) for dialogs, alert dialogs, the swap celebration and the photo lightbox. The hand-rolled overlays keep `useDialogA11y` (focus moves in, Escape closes).
- Space scale: `tokens.json` `space` is the px list for padding, margin, gap and space-x/y: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 96, 104 (note in `spaceNote`). The generator writes it into the Tailwind theme `spacing` (extend) with step = px / 4, so `p-5`, `gap-1.5` and `mt-0.5` still work and 2, 6, 10, 20, 40, 96 are on the scale because each was used five or more times. `check-tokens` rule `off-scale-spacing` fails on any `p*`, `m*`, `gap*` or `space-x/y` utility whose step times 4 is not in `space` (0, `px` and `auto` are allowed, negatives follow their positive); `w-`/`h-`/inset are separate. To add a step, add the px value to `tokens.json` and run `node scripts/generate-tokens.js`.
- Community stays a prominent tab for MVP. The strategy argues for low prominence, but swaps and groves are the retention loop, so it keeps a tab. Revisit after Study 001.
- Motion and type tokens: `tokens.json` now carries `keyframes` and `animation` (`animate-petal`, `animate-popin`), `transitionDuration` (`duration-settle`), `letterSpacing` (`tracking-label`, `tracking-display`) and `lineHeight` (`leading-reading`). `check-tokens` fails on `animate-[`, `duration-[`, `leading-[`, `tracking-[`, `delay-[` and `ease-[` values, and on `w-11`, `h-11`, `w-12`, `h-12` on a `<button>`, `<a>`, `<label>`, `<input>` or `AppLink` (use `w-touch h-touch`).

### Route to home tab
| Home tab | Routes |
| --- | --- |
| Today | `/care/*`, `/help-my-plant`, `/search` |
| Plants | `/plants`, `/bouquets`, `/rooms`, `/wants`, `/add-plant`, `/wishlist` |
| Learn | `/greenhouse`, `/lessons` (guild and species detail are full-screen reading pages reached from here; see departures) |
| Community | `/feed`, `/groves`, `/swap`, `/swaps` |
| none (reached from the profile button; tab bar stays) | `/profile` and its sub-pages, `/notifications`, `/badges`, `/challenges`, `/help`, `/florist` (florist accounts only; everyone else gets a message and goes to Profile) |

- Prototype and variation pages live in `grove-frontend/prototypes/`, outside the bundle and with no routes.

### Deliberate departures
Routes that legitimately differ from the shell (tab bar, `PageHeader`, one `<main>`). Everything else renders inside `ProtectedShell` in `App.js`, a layout route, so the tab bar does not remount when you move between tabs.
- Lesson player (`/lessons/:lessonId`): full screen, no tabs. It is a focused task with its own progress and exit; the tab bar would invite leaving mid-lesson.
- Verify flow (`/verify`): modal-like and no tabs, because it is a short commitment (identity, pact, agreement) that should be finished or cancelled. It does use `PageHeader` with Back.
- Plant detail (`/plants/:plantId`) and bouquet detail (`/bouquets/:bouquetId`): photo hero with an overlay Back (`BackButton overlay`) instead of the inline header, because the photo is the page. The tab bar stays.
- Welcome, onboarding, quiz, login, register, waitlist and the public bouquet page: outside the shell, because the visitor is signed out or has not yet chosen where to go.
- Species detail, guild detail and the admin demo panel: signed in but full screen with their own header, as before.
- Caption text is 14px (`text-xs` is overridden from Tailwind's 12px, and equals `text-sm`) because 12px and 13px failed the reading checks.
- Lesson card art uses `color-mix` tints of tokens rather than separate tint tokens.
- Profile and its sub-pages (`/profile`, `/notifications`, `/badges`, `/challenges`, `/help`, `/florist`) are reached from the header profile button, not from a tab, so they intentionally have no active tab. The tab bar stays visible.
- Not found: any unknown address, and any missing plant, bouquet, guild, species or grove id, renders `NotFoundPage` (with a way back to Today) instead of silently redirecting. A "Skip to content" link is the first focusable element in the shell and targets `<main id="main-content">`.
- Tab bar height: `navHeight` (72px) is the real height of the bar; `h-nav`, `pb-nav` and `bottom-nav` add the safe area, and `bottom-nav-stack` clears the bar plus a floating session bar (`floatBarHeight`). `z-sticky` (40) is the sticky-header layer, `z-raised` (1) a local lift.
- The Welcome stage is scaled as one picture; its Continue button grows by `--touch-min / --stage-scale` so the hit area is 44 CSS px on screen.

- `touchTarget.button` (48px) is for the marketing page only (`WaitlistPage.css`); in the app every control is 44px (`min-h-touch`).
