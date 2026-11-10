# Grove review demo

A click-through copy of the real Grove app for colleagues and friends. It runs on fixed fake data for one
made-up new plant owner (Maya) and needs no server, database or AI key. Nothing in `grove-frontend/` or
`grove-backend/` is changed by anything in this folder.

## Run it locally

    cd walkthrough
    npm install            # first time only
    npm run demo           # builds demo/site and serves http://localhost:4174

Open http://localhost:4174. On a desktop browser the app shows inside a phone frame. On a phone it fills the screen.

**Restart:** reload the page (on desktop there is also a "Restart demo" button). Every load starts fresh, so the
one-time moments (quiz, first-care celebration, Meet Pip) replay.

## Suggested path

Welcome, quiz (you can skip questions), plan, soil finger-test lesson, add a plant (try "spider"), Today, resume the
lesson and log the soil test, celebration, Meet Pip, Pip's nook (tap Pip on Today).

## How it works

- `demo/browser-entry.js` replaces the network with `scripts/mock-core.mjs` before the app starts.
- `scripts/mock-core.mjs` holds the fake backend. Its responses mirror the real server's shapes, and the plant guide
  and add-plant search use the real curated species list (`fixtures/species.json`, exported by `scripts/export-species.py` from
  `grove-backend/curated_species.py`).
- `scripts/build-demo.mjs` copies `app-build/` (the production build of the frontend) into `demo/site`, adds the
  shim and local fonts, removes analytics, and marks the page `noindex`.

## Rebuild after the app changes

    cd ../grove-frontend
    REACT_APP_BACKEND_URL=http://mock.local BUILD_PATH=../walkthrough/app-build npx craco build
    cd ../walkthrough && npm run demo

## Tests

    SERVE_DIR=../demo/site node scripts/demo-test.mjs mobile  .cache/demo-mobile
    SERVE_DIR=../demo/site node scripts/demo-test.mjs desktop .cache/demo-desktop

Each drives the whole flow with no request mocking and prints any call the demo does not cover.

## Known gaps

Screens outside the main path return quiet empty states or a "not in the demo" error: badge catalog, verification,
photo identify, room scan, and anything needing the AI. The video pipeline (capture and Remotion) is paused; the
capture notes are in the project history.
