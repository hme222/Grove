# FloraGrove design (v0.2)

Made Oct 19, 2026 from the dark-forest onboarding mock.

- `grove-tokens.css`: color, type, radius tokens. Not wired into the app yet; `grove-frontend/src/index.css` still uses the old light palette.
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
- Name: FloraGrove (one word, capital F and G). Community groups keep the lowercase name "grove"; the community tab stays "Grove".
- Wordmark: light Alegreya Sans "Flora" + bold Cormorant Garamond "Grove", with two leaves as the "v" (outlined = Flora, solid = Grove). Outlined SVGs in design/brand/.
- Mark and app icon: the v on Root #202D14 (design/brand/icon-1024.png, favicon.svg).
- Welcome screen: "Welcome to FloraGrove"; the first hand-drawn line and the stars were re-fitted to the new word position.
- In the app: src/components/brand/FloraGroveWordmark.js and FloraGroveMark.js.
