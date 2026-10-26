# FloraGrove audit: blind critic panel, persona re-run, competitor lens

Date: 2026-10-24 | Build: live app at commit `1ee70cf` (frontend as of `2aa00e8`), 390px phone width, dark forest theme
Method: three parts. (1) A blind four-critic panel graded the rendered app against the portable rubric (there is no `eval/rubric.md`). (2) The 10 synthetic personas were re-run against the current build with fresh measurements. (3) A competitor lens: Planta, Greg, PictureThis and Blossom, from desk research.

**Limits.** The personas are synthetic. The competitor lens is built from store listings, design critiques and reviews, not hands-on use, and some sources are dated (marked below). Critics could not test failure states in the browser or use a screen reader. Nobody opened `/plants/:id` or `/greenhouse/:id` visually in every critic's run.

---

## Part 1: the panel

**Verdict: 5.1 out of 10 (weighted mean). Reach 5/10, reported separately.**
The skill's template writes the total as "/15"; the weights sum to 15, so the mean is out of 10.

**Hard gate: touch targets (44px) FAILED.** Measured on the rendered app. A failed gate fails the submission, whatever the average. The contrast gate passed on the routes sampled (Today, Progress, Plants, Rooms, Want list, Saved cuttings, Add plant, Help my plant, Notification settings, Learn, a plant page). It was not run on Community, Groves, Swaps, Profile, Badges, Search or Bouquets.

| Dimension | Score | Weight | Basis |
|---|---|---|---|
| System fidelity | 4 | 3 | 631 hard-coded hex values, about 451 hard-coded corner radii and 676 hard-coded text sizes; the design tokens are copied by hand into the code, with nothing to keep them in step |
| Coherence | 5 | 3 | Back is built five ways with four names; the header's main action changes form per screen |
| Craft | 6 | 3 | Clear reduced-motion handling, a 3:1 field outline, consistent nav; held back by many small targets and 12px dominating a 17px body |
| UX judgment | 5 | 3 | Failure states report good news; flattering and contradictory Progress screen |
| Accessibility | 5 | 2 | Touch-target gate fails; one unlabeled search field |
| Structure | 7 | 1 | All 20 routes render, no overflow, nav stable; no build or lint was run by the critic |

(4×3 + 5×3 + 6×3 + 5×3 + 5×2 + 7×1) ÷ 15 = 5.1. No dimension reached 8: that needs rendering plus measuring, and none could test failure states or a screen reader.

### Findings, most severe first (verified by me against the code where marked)
1. **A failed load looks like good news.** If Today cannot fetch, it shows the "All caught up" state with only a toast (`CarePage.js` 101-109). *Verified.* A person with overdue plants is told nothing needs doing.
2. **Same pattern elsewhere.** Progress shows 0 plants, 0d streak and 0 logs on failure (`CareGrowthPage.js` 17-19, *verified*); Plants shows an empty collection (`CollectionPage.js` ~52); Plant detail bounces to Plants.
3. **Photo ID failure is mislabelled and loses the photo.** Any error shows "Photo upload failed" and returns to the capture step (`PlantIdentifyScreen.js` 66-69). *Verified.*
4. **Progress contradicts Today and the brief.** "Collection Vitality 100%" sits beside four plants due 4 to 6 days ago; a "Streak 12d" tile and a "Longest Streak" line, against the brief's "no streaks".
5. **Touch targets.** Measured: "Mark as done" 62×16 and "Read more in Learn" 111×16 on Today; "Open a plant" 32 tall; To do / Progress tabs 42 tall; all 20 notification switches 44×24 (the label is not part of the target); Want-list "Remove" 28×28 and destructive; Groves "Join" 43×33; Profile Sign Out 85×33, Refresh 76×29, View all 80×29; Badges filter chips 29 tall; Learn Previous/Next 33; Add plant "Back" 41×16; plant page Log Care 85×33 and its tabs 32 tall.
6. **"Delete" archives.** The trash button is labelled Delete, asks "Archive this plant?" in a browser pop-up, and calls the delete endpoint (`PlantDetailPage.js` 138-140, 279). *Verified.*
7. **The Learn search field has no label** (placeholder only), against the brief's own rule.
8. **Today's order.** Search bar and the setup card sit above the first plant (first card at about y=330 of 480 visible); "Water All" is the loudest header button even though each card says "water if it's dry".
9. **Back is built five ways** (settings pill "Back to Profile", Add plant 41×16 text link, Help chevron, circular floating buttons on detail pages), and Add plant and Help use a different header. Profile has a profile button that links to itself, and Sign Out is its most prominent control.
10. **Colours and sizes bypass the tokens.** The care-type colour table is typed twice (`CareLogModal.js` 12-22 and `CollectionPage.js` 17-22) using old light-palette values; badge tiers render as light-palette chips on the dark theme; `index.css` carries an off-token input outline.
11. **Unfinished pages are live.** 14 design-exploration routes (for example `/quick-wins`, `/plant-er`, `/window-blueprint`) are routed, unauthenticated, in production (`App.js` 182-195). Profile also links "Demo Admin Panel" and "Replay first-run" to ordinary accounts. *I have not checked whether the admin route itself is protected.*
12. **Naming.** "Want list" (plants you'd like) and "Saved cuttings" (posts you saved) are both lists with near-identical screens; the README still calls the community tab "Grove" and says the app uses the old light palette.

**One critic finding I'm correcting:** the system critic suggested `/wishlist`, `/wants` and `/rooms` might be unreachable. They are reachable from the shortcut chips on Plants and Community; its code search could not see links built from a list.

### Reach 5/10: where it settles (critic-ambition)
- Finishing a plant's care ends with a card sliding away and a toast; the "All caught up" state is a generic icon. Suggested: a row of the plants you just tended, with specific copy, and no counts.
- The reason for each instruction ("Why: …") only shows in Detailed mode, though the brief says every instruction carries its reason and it is the app's stated differentiator. Suggested: lead with the reason in the default mode.
- The first-care celebration is generic ("That's the loop"). Suggested: name the plant, the action and the next check date.

### What holds up
Global reduced-motion rule; a recorded reason for the 17px body and the 3:1 field outline; identical bottom nav on every tab; status that never rests on colour alone; every route renders at 390px with no sideways overflow; one `h1` and a `main` on every route.

---

## Part 2: the 10 personas, re-run

Changes since round one are all live: calmer Today wording, one name per place, scalable text, soil check first, reminder and pets questions, pet-safety chips, a 40-species guide, room light. Fresh measurements: no horizontal overflow on 16 routes, minimum text 12px, one `h1` and a `main` on every route.

| Task | Maya | Dev | Grace | Luis | Priya | Marcus | Hannah | Tom | Aaliyah | Sam |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 set up | ⚠ intro screens | ⚠ intro screens | ⚠ jargon | ⚠ no barrel cactus, "Pip" | ⚠ intro screens | ⚠ 16px Back | ? welcome | ⚠ no bouquet path | ⚠ wait (now explained) | ⚠ one at a time |
| T2 today | ✓ | ✓ | ⚠ tiny links | ⚠ "Pip" | ⚠ search + setup card first | ⚠ 16px links | ✓ | ✓ | ✓ | ? glare |
| T3 light | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| T4 sick plant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| T5 pets | ✓ | ⚠ unknown plants | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| T6 learn | ✓ | ✓ | ✓ | ⚠ jargon | ✓ | ⚠ 33px paging | ⚠ unlabeled search | ✓ | ✓ | ✓ |
| T7 reminders | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠ 24px switches | ✓ | ✓ | ✓ | ✓ |
| T8 journal | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠ no flowers | ⚠ big photos | ✓ |
| **T9 server unreachable** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**What improved:** every task that was a ⚠ for tone, naming, text size, soil advice, reminders, pet safety and light is now ✓ for most personas.
**New:** T9 is a new task the panel exposed. On a bad connection the app says "All caught up" (Aaliyah on patchy data, Sam travelling, Maya on the subway). It is a ✗ for everyone because the screen states something false, not because a persona cannot proceed.
**Still open for specific people:** Marcus (16px links, 24px switches), Hannah (unlabeled search, welcome screens unverified), Tom (no bouquet-only path), Luis (jargon, no barrel cactus), Priya (search and setup card before the first plant).

---

## Part 3: the competitor lens

**Evidence (desk research, sources at the end).** Planta: onboarding of 8 to 9 steps whose first question is "What can we help you with?" (sick plant, reminders, identify); location is requested with a reason; account creation comes near the end; a design critique faults the missing progress indicator and a central "+" that groups unrelated actions; the home has a greeting and a task summary. Greg: a dashboard with an actionable schedule, a social feed and communities, and a quiz followed by a mandatory paywall; reviews cite UI, identification and subscription complaints. PictureThis: tabs For You, Diagnose, Identify (a central camera), My Plants and More; a subscription prompt on most opens (older sources). Blossom: Search (with ID and a light check), Garden (with reminders), Diagnose and Explore (a 2022 review, possibly dated); a short guide then a skippable sign-up; the paywall appears when you turn on reminders after the first plant.

| | Planta | Greg | PictureThis | Blossom | **FloraGrove now** |
|---|---|---|---|---|---|
| Opens on | Greeting and task summary | Schedule dashboard | Camera/For You | Search | Today: search, setup card, then plants |
| First question | "What can we help you with?" | Personalisation quiz | Trial offer | Guide, then sign-up | Five intro screens, then a quiz |
| Identify | Paid | Free scan | Core, centre tab | Core, in Search | Second option in Add plant; AI off |
| Sick plant | Paid assistant | Not found | Diagnose tab | Diagnose tab | Symptom checker via a card on Today |
| Light | Paid light meter | Paid light gauge | Not researched | In Search | Free, three taps deep (Plants → Rooms) |
| Reminders | Free for watering | Paid | Not researched | Behind the paywall | Free, one question after the first plant |
| Community | None found | Core | Expert and community help | None found | Fourth tab; swaps locked |

### What each competitor's design team would say about your structure
- **Planta:** "You ask three things before the first plant: a search bar, a setup card, then the list. Open on a greeting and what is due. And ask first what the person needs help with, then route them: set up a plant, a sick plant, or learning." *Your edge:* light and reminders are free.
- **Greg:** "Our schedule is built around the plant and its surroundings. Your four cards all say the same sentence, 'Check the top inch of soil. Water if it's dry,' though you hold watering interval and light for every species." *Your edge:* no paywall wall after a quiz. *Where Greg is ahead:* community as a daily habit; your Community tab leads with locked swaps.
- **PictureThis:** "Identify and Diagnose were your survey's number 2 and 3 dealbreakers (20 and 18 of 37) and neither has a tab; they are sub-options. Make identify the first thing the Add button does once AI is on." *Your edge:* no subscription prompt on every open, and honest uncertainty.
- **Blossom:** "Search is a tab for us, with the light check inside it. Yours is a bar on Today and a chip on Plants, and the light check is three taps deep." *Your edge:* plain reasons, and reminders are not behind a paywall.

### Where FloraGrove is ahead
Free reminders and a free light check; a soil check before any advice; pet safety shown on every card for pet owners; a calm tone; no paywall on core care; sources named for care and pet safety.

---

## Prioritised fixes

**P0, truth and the failed gate**
1. Give Today, Progress, Plants and Plant detail a real failed state with Retry; never fall through to "All caught up" or zeros. Split the ID upload error from the identify error and keep the photo.
2. Bring every control to a 44px hit area (list in finding 5), including switches (make the whole row the target) and the destructive Want-list remove.
3. Say Archive, not Delete, and use an in-app dialog that states whether it can be undone.
4. Remove or ground the Progress card: compute the vitality figure from the same data as Today, and drop the streak tile.

**P1, structure and flows**
5. Today: plant list first; a one-line dismissable setup banner; make Water All secondary or confirm what it will log.
6. Personalise each card's care sentence from the species (watering style, light) and lead with the reason in the default mode.
7. One Back component and one header pattern (optional page action, bell, profile); remove the self-linking profile button; move Sign Out into the body.
8. A first question in onboarding that routes (set up a plant, a sick plant, learn), with the intro screens optional.
9. A persistent search entry and a light-check entry point reachable from a plant page.
10. Remove the unfinished routes and the "Demo Admin Panel" link from the live app, after confirming the admin route is protected.
11. Label the Learn search field; rename Want list or Saved cuttings so the two lists read as different things.

**P2, system and delight**
12. Generate the Tailwind config and CSS variables from `design/tokens.json`, add a check that fails on stray hex values, add radius and text-size tokens, and update the README.
13. Replace the empty "all caught up" and the first-care celebration with specific, plant-named moments.
14. Set a 13 to 14px caption minimum instead of 12px.

## Sources
- [Pratt design critique of Planta](https://ixd.prattsi.org/2025/09/design-critique-planta-ios-app/) and [Planta teardown](https://screensdesign.com/showcase/planta-plant-garden-care)
- [Greg teardown](https://screensdesign.com/showcase/greg-plant-identifier-care) and [Greg review analysis](https://kimola.com/reports/unlock-key-insights-greg-app-customer-feedback-report-app-store-us-155864)
- [TechRadar on PictureThis](https://www.techradar.com/computing/websites-apps/picturethis), [TapSmart guide](https://www.tapsmart.com/tips-and-tricks/picturethis-guide/), [PetaPixel review](https://petapixel.com/picturethis-best-plant-identifier-app/)
- [YourStory on Blossom (2022)](https://yourstory.com/2022/02/app-friday-simplifying-gardening-blossom-plants-startup/amp) and [Blossom teardown](https://screensdesign.com/showcase/blossom-plant-care-guide)
- Earlier evidence: [Planta support](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium), [Greg on the App Store](https://apps.apple.com/app/id1512912236)
