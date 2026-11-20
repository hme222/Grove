# Grove rubric for scored critique

The rubric the critic panel uses for Grove (FloraGrove). Its scoring rules and hard gates are the portable rubric's,
word for word. Its anchors name things that actually happened in this repo, so a grader can check a claim against a
file or a screen instead of forming an impression.

## What the work is trying to earn

Grove is for **new plant owners** (`docs/product/confirmed-context.md`). MVP decisions optimize for three things
(`CLAUDE.md`): **early care confidence**, **understandable next actions**, and **safe recovery from mistakes**. A
screen that is tidy but leaves a new owner unsure what to do next, or unsure whether something saved, has not earned
its score. Evidence from collectors, florists or horticulturalists does not stand in for new owners.

## Primary viewport, mode and how to render

- **Viewport:** phone, 390 x 844. Also check a short phone (390 x 600) for Structure, and 200% root text for
  Accessibility and Craft.
- **Mode:** the dark forest theme. Pip's nook and the two light lessons are the paper family, a recorded departure
  (`design/README.md`, "Paper family").
- **Rendered build:** the walkthrough demo is the production build on a fake in-browser backend
  (`walkthrough/README.md`). Rebuild it from the code under review, serve it on 4174, and drive it with Playwright
  (`walkthrough/node_modules/playwright`). `walkthrough/scripts/demo-test.mjs` walks the whole flow and is the quickest
  way to learn selectors. Screens outside its path (badges, verification, photo identify, room scan, anything needing
  AI) show "not in the demo" by design.
- **Checks:** in `grove-frontend`: `npm run check:tokens`, `npm run lint` (max 0 warnings), `CI=true npm test --
  --watchAll=false`, `npm run build`. In `grove-backend`: `python3 -m pytest -q tests`. Then the demo walk:
  `SERVE_DIR=../demo/site node scripts/demo-test.mjs mobile <out-dir>` from `walkthrough`.

---

## Scoring rules

These override any anchor below.

1. **"Looks good" is a 6, not a 9. A 9 survives a senior critique untouched.**
   Work that reads well on first glance has cleared 6. Nine means someone who
   knows the system went looking for the seam and did not find one.

2. **A dimension scores 8 or above only if it was verified by rendering,
   measuring or testing. Never from reading code.**
   If the evidence is "I read it and it looked right", the ceiling is 7, and
   you say so. Grove's own example: a panel critic read the code and called the
   rendered build fine. A second critic rendered the same build and found the
   "Watered" button failing every time on the demo, with a message blaming the
   person's connection.

---

## The six dimensions

| Dimension | What it asks | Weight |
| --- | --- | --- |
| System fidelity | Does every value trace back to a token, and every component to the library | High |
| Coherence | Does it read as one product, or as screens that arrived separately | High |
| Craft | Spacing, rhythm, states, the small deliberate decisions | High |
| UX judgment | Are the states handled, the hierarchy clear, the failure paths designed | High |
| Accessibility | Contrast, touch targets, whether meaning ever rests on colour alone | Medium |
| Structure | Does the layout hold together and the thing render | Low |

Weights for a single score: High 3, Medium 2, Low 1.

---

### 1. System fidelity — High

**4** — A hand-built version of something the library has. Grove case: Pip's nook offer was a plain `div` with
`role="dialog"` and hand-rolled focus, beside a Radix `Dialog` every other dialog used (`nook/NookOfferCard.jsx`,
rebuilt on Radix in Nov 2026). Raw hex or px in component source that `npm run check:tokens` does not list.

**6** — The token check passes, but controls skip the shared primitives. Grove case: a Nov 2026 count found 261 raw
`<button>` tags in 105 files against `components/ui/button.jsx`, each restating the 44px minimum and focus ring by
hand. The token check cannot see this; only counting the primitives can. A size prop whose variants are identical
(`ToxicityBadge` `sm` and `md`) is the same failure in miniature.

**9** — `check:tokens` passes **and** every literal left is in `scripts/token-exceptions.json` with a `reason` and a
`retireWhen` (the check fails on a stale entry). A value with no token went into `design/tokens.json` and was
regenerated with `npm run tokens`, never patched into the generated CSS. When a literal is removed, its exception is
removed in the same change (the first-care burst's `marginTop: 70` became `mt-16` and its entry was retired). Raw
controls outside `components/ui/` are a short, named list.

---

### 2. Coherence — High

**4** — Header chrome that moves between screens. Grove case: the Help, bell and profile cluster lost a slot on Profile
and on Help my plant, so it shifted. The same word meaning two things: "Help" opened plant triage in the header and the
app guide in Profile.

**6** — Consistent components, but surfaces written for another audience sit at equal weight. Grove case: Notification
settings listed swap matches, reactions, plant sitters and bouquet reminders beside "Daily care check" for a new owner
with those features switched off. Or a departure that is real but unrecorded.

**9** — Every screen keeps its header buttons in the same places, with the current one shown as a "you are here" mark
rather than removed. One action, one name: the header pill is "Plant help" and opens plant triage, and the app guide
is "Help & tutorial" everywhere. Features that are switched off leave no trace in settings. Every departure (the paper
nook, the paper light lessons, the welcome stage's fixed artwork) is written down in `design/README.md`, so it reads
as a decision.

---

### 3. Craft — High

**4** — Text that breaks mid-word. Grove case: the header title used `overflow-wrap: anywhere`, so "Notification
settings" rendered as "Notificatio / n settings". Counts that read wrong: "1 Care logs", "0h Hours".

**6** — Motion and states exist, but timing works against the person. Grove case: the welcome intro showed a blank
hero for about 9 seconds with motion on, because the words and photo waited behind decorative pen lines. Three
different wins (first plant, first care, lesson complete) using one identical burst, so none of them lands.

**9** — Content first, decoration after: the welcome words and photo are in by about 2 seconds and the pen lines finish
around them. Reduced motion shows the finished screen at once. Status never rests on motion alone. The first-care
moment shows the person's own plant, so it is not interchangeable with the other celebrations. Large text grows the
labels that matter (the welcome "Sign up" is in rem) without breaking the fixed artwork.

---

### 4. UX judgment — High

**4** — A failure blamed on the wrong cause, or a next action missing. Grove cases: the one-tap "Watered" said "Check
your connection" for every failure, including server faults. After a soil check said "Water it", nothing let the person
log the watering, so Today kept calling the plant due. A plant search with no match showed a blank area.

**6** — The failure paths exist but flatter or stack. Grove cases: the nook called a never-checked plant "Healthy".
Repeated water failures stacked one toast per tap, each with its own Try again. Load errors read the same for offline
and for an HTTP 500.

**9** — Every failure names its cause (no response: "Check your connection"; 5xx: "on our side … It isn't your
connection"), says nothing was lost, and offers Try again in one slot (`lib/errors.js`, `components/LoadError.js`).
Every decision leads to its next action (soil check → "I watered it"). A summary never flatters: an unchecked plant
reads "No checks yet" on every screen by one rule (`lib/careActions.js` `displayStatus`). Pet-safety claims show their
source (ASPCA) where they are made (`CLAUDE.md`: toxicity claims need a cited source), and the add list and the plant
page agree.

---

### 5. Accessibility — Medium

**4** — A gate fails, or a control loses its name or its focus. Grove cases: Escape on the first-care celebration left
focus on the page body. The rebuilt nook offer briefly had no accessible name, because an explicit `id` on its heading
overrode the one Radix wires to `aria-labelledby`. A test caught it.

**6** — Gates pass, but large text or overlays undo it. Grove cases: Pip's sprite stood on the tab bar and covered the
last card on several screens, worst at 200% text. A visible label and its accessible name disagreed ("Help" with
`aria-label="Help with a plant"`).

**9** — Gates pass and were measured. Focus returns to the opener, or to `#main-content` if the opener is gone, never
the body. Dialogs are Radix, so they trap focus and hide the background. Accessible names contain the visible words
(WCAG 2.5.3). Pip reserves his own height at the bottom of the page (`--pip-reserve`). Search results and errors are
announced (`role="status"`, `role="alert"`). Everything reflows at 200% text with no sideways scroll. `CLAUDE.md`:
large text, reduced motion, focus management and error states are part of done for any screen change.

---

### 6. Structure — Low

A 4 here caps every other dimension at 4.

**4** — The checks are red on the main branch. Grove case: two stale `eslint-disable` comments in
`ProfilePage.test.js` were merged, so `npm run lint` (max 0 warnings) failed on `main` until the next panel. A route
that exists only as a file: `/challenges` had no inbound link after the profile hub removed it.

**6** — Renders at 390 x 844, but the shell or a walk breaks elsewhere: chrome that scrolls with content at 390 x 600,
or a demo walk that stops because the script predates a screen (it missed "Meet Pip" and the first-plant card).

**9** — Lint, tokens, frontend and backend tests, build and the demo walk are all green on the tree under review. It
holds at 390 x 844 and 390 x 600 with no horizontal overflow. Every route is reachable by clicking or is a recorded
redirect (`App.js` redirects, with the reason in a comment).

---

## Hard gates

Pass/fail. **Not scored, and not tradeable against a high score elsewhere.** A
failed gate is a failed submission regardless of the six dimensions above.

| Gate | Threshold | How to check |
| --- | --- | --- |
| **Contrast** | 4.5:1 for body text against its actual background | Measure the rendered pixels, not the token's documented value. Check text over tinted cards and translucent surfaces, where the composite differs from the swatch. |
| **Touch targets** | 44pt minimum | Measure the hit area, not the visible pill — they differ. A token documenting 48 clears the gate; the check is that every control actually binds to it. |
| **No raw hex in component source** | Zero | Run the project's token check. Strip comments and skip generated output first, so a hit is real drift. |
| **No two states that should differ rendering identically** | Zero | Render them side by side. This catches a paused state reusing a captured state's appearance — two meanings on one appearance, where the accessible name then describes the wrong one. |

**On the last gate specifically:** it is the one most often passed by assertion.
Two states differing in a prop that maps to the same rendered output is a
failure even when the code plainly distinguishes them. Rendering is the only
check that finds it — scoring rule 2 restated as a gate.

Grove notes for the gates: the paper family's contrast pairs are listed in `design/README.md`; `paperBorder` is
decorative only. Toxicity chips are 30px tall with an extended hit area (`ToxicityBadge.js`, `before:-top-2 before:-bottom-2.5`):
hit-test it, do not read the class.
