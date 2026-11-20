# FloraGrove Founding Member sales page (draft, not deployed)

This folder is **not served**. Vercel's root directory is `grove-landing/`, so nothing here is public. The live site is the
waitlist page in `grove-landing/`.

What is here: the page (`index.html`), every price, date, count and link in one file (`offer.mjs`), the words built from it
(`offer-copy.mjs`), the renderer (`page.mjs`), screenshots (`img/`), generated colors (`tokens.generated.css`), and tests.

## Review it
It needs a web origin because it loads ES modules. Serve this folder with any static server, for example
`python3 -m http.server 4180` from here, and open it. While values are missing it shows a draft banner at the top.

## Checks
- `npm test` runs the copy rules (never "unlimited", prices only from config, only shipped features, dates, spots).
- `npm run check:offer` fails until nothing is missing. It lists what is.

## Before this goes live
1. Fill the missing values in `offer.mjs` (`npm run check:offer` must pass): the Stripe link, contact email, Terms and Privacy
   links, which features are shipped and their tier, and the FAQ answers.
2. The name FloraGrove must be cleared first (your plan flags a live FLORA registered mark). Do not take payments before that.
3. The app must really enforce what the page says: the free photo ID allowance is a server setting
   (`FREE_ID_ALLOWANCE`, default 3) and the server has to be deployed.
4. Pet-safety labels are held back (see `grove-backend/species_safety.py`). Keep that feature unshipped here until they are on.
5. Test the Stripe link end to end, then copy these files into `grove-landing/` and update the meta description and social tags
   there in the same change.
