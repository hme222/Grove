# FloraGrove competitive analysis: top 5 plant-care apps

Date: 2026-10-26 | Author: design-scout | Status: desk research, no hands-on use

**Evidence rules.** Every competitor claim carries a URL. "Not verified" means the page blocked me, returned nothing useful, or I only have a search snippet or an aggregator. Store listings were fetched on 2026-10-26 and show "last updated" dates without years (flagged). Review text comes from aggregator pages (JustUseApp, Common Sense Media, OnClarity) because the Apple and Google review feeds could not be read directly. Most aggregated reviews are undated. Treat complaint patterns as directional, not measured. Prices vary by region and offer; store listings list several prices without saying which billing period each covers.

**What changed since the 2026-10-23 strategy and 2026-10-24 audit.** Those documents covered Planta, Greg, PictureThis and Blossom. This pass (1) adds a fifth app (Plantum), (2) adds fresh store ratings and counts, (3) adds features not covered before: water calculators, pot-size tools, vacation or care-share modes, expert chat, shopping, widgets, offline, (4) re-checks FloraGrove's own code, and (5) separates ADD from CHANGE from KEEP. Findings that repeat earlier work are marked "(known)".

---

## (a) The five apps

### Why these five

| App | Why it is in | Standing evidence |
|---|---|---|
| Planta | The category's care-schedule reference. Largest "care first" brand with a Swedish studio and press coverage. | iOS 4.8 from 114K ratings ([App Store](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781)); site claims 7M+ users, press from NYT, Verge, Mashable ([getplanta.com](https://getplanta.com/)). |
| PictureThis | Largest by ratings. The ID-first benchmark, and the one new owners are most likely to download first. | iOS 4.8 from 1.1M ratings, #15 in Education Top Free ([App Store](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129)). |
| Greg | Closest in spirit to FloraGrove: schedule dashboard built around pot, light and place, plus community. Smaller, but the most relevant design comparison. | iOS 4.6 from 21K ratings ([App Store](https://apps.apple.com/app/id1512912236)). It is the weakest of the five on raw reach and stays in for relevance. |
| Blossom | Houseplant-focused, with rooms, journal, pet-safety search and a water calculator. The nearest feature set to FloraGrove's. | iOS 4.6 from 69K ratings ([App Store](https://apps.apple.com/app/id1487453649)); site claims 18.5M+ plants identified, 4.88M+ reminders completed ([blossomplant.com](https://blossomplant.com/)). |
| Plantum | A top-3 ID-plus-care app by ratings and, by one report, installs. | iOS 4.6 from 120K ratings ([App Store](https://apps.apple.com/us/app/-/id1476047194)); PCWorld reports 20M+ downloads ([search snippet](https://www.pcworld.com/article/2119130/this-plant-identification-app-is-just-15-for-life-now.html), not opened, so not verified). |

**Close sixth left out: PlantIn.** Google Play data shows about 10M installs and 4.0 from about 132K reviews ([apppricinglab](https://apppricinglab.com/app/google_play/com.myplantin.app), an aggregator, last update March 2026). Its App Store page returned 404 and its Play page would not load, so I could not verify features or pricing. Plantum has verified iOS numbers and a feature list, so it wins the slot. PlantIn should be the first swap-in if you want a sixth. Vera and Leaf were not assessed; I found no store evidence in this pass that put them ahead of the five.

### Planta

- **Positioning and target.** "Keep your plants alive": care schedules for houseplant owners ([getplanta.com](https://getplanta.com/)). Targets people who want a reminder system, not an identifier.
- **Pricing and free vs paid.** Free is "limited access". Paid: plant identification, care schedules other than watering, Dr. Planta, light meter, plant recommendations ([Planta support](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium)). App Store lists 1 month at $7.99 / $9.99, 12 months at $17.99, $35.99 and $47.99 ([App Store](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781)). Trial length: not stated on the support page.
- **Onboarding.** A 21-step flow: a quiz first, benefit screens before the location and notification permission requests, pot material that visibly changes watering. The paywall comes straight after the quiz, with a second "one week free trial" offer if dismissed ([ScreensDesign](https://screensdesign.com/showcase/planta-plant-garden-care)). The earlier audit cited 8 to 9 steps from a different teardown; the sources disagree, flagged.
- **Core loop.** Add a plant with location, light, pot size, material and last-watered date. Get a schedule. Water. If you water early and confirm the soil was dry, the app adjusts future reminders and says so ([ScreensDesign](https://screensdesign.com/showcase/planta-plant-garden-care)).
- **Signature feature.** Adaptive watering schedule using 30+ parameters plus local weather, and Dr. Planta diagnosis with an option for human expert review ([getplanta.com](https://getplanta.com/), [ScreensDesign](https://screensdesign.com/showcase/planta-plant-garden-care)).
- **Notifications.** Permission is asked in onboarding with a benefit screen first. Content and cadence: not verified. One review roundup lists "frequent marketing push notifications" ([search snippet from Kimola](https://kimola.com/reports/comprehensive-planta-app-customer-feedback-report-app-store-us-155863), page now returns 410, so not verified).
- **Praise.** Reminders and care tips; useful for organising care ([OnClarity](https://www.onclarity.com/leaderboard/insight/getplanta), no direct praise quotes).
- **Complaints.** About 25% of sampled users say they felt misled about what is free. About 20% say reminders do not adjust and cause overwatering. About 15% report misidentification. About 10% report glitches such as tasks that do not clear. One quote: "The app tells me to water my plants too frequently, risking root rot." ([OnClarity, weekly roundup dated 2026-10-26](https://www.onclarity.com/leaderboard/insight/getplanta); sample size not stated.)

### PictureThis

- **Positioning and target.** "Instantly identify plants with a snap." Identification first, then care, toxicity and disease ([picturethisai.com](https://www.picturethisai.com/)). Broad audience, includes weeds and garden plants.
- **Pricing and free vs paid.** Site lists no prices. App Store lists "PictureThis Pro" at $39.99, $7.99 and $3.99 and a Family Plan at $49.99, without periods ([App Store](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129)). Free versus paid split on the current app: not verified. A reviewer notes free ID exists but limited ([JustUseApp](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews), undated).
- **Onboarding.** Not verified in this pass. The earlier audit noted a trial offer first (older sources).
- **Core loop.** Photo, identify, save to collection, read care and toxicity, set reminders ([App Store](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129)).
- **Signature feature.** Photo ID at scale, disease diagnosis, and 24/7 expert chat per the listing. Expert chat being paid comes only from a 2020-era review ([Input Mag via search snippet](https://www.inputmag.com/reviews/picturethis-app-review-plant-care-identifier-for-dummies)), so current gating is not verified.
- **Notifications.** Not verified.
- **Praise.** ID quality: "has been correct 99% of the time", "infinitely better than any of the others" ([JustUseApp](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews), undated).
- **Complaints.** Billing and cancellation dominate the dated reviews (2021 to 2025): "IMPOSSIBLE TO GET HELP OR TO CANCEL", "clearly designed to trap people into subscriptions", "they charge when deleted" (2025-01-05). Also: wrong ID, and "it can put peoples plants at risk" ([JustUseApp](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews)). Common Sense Media's 14 parent reviews report the same billing theme ([Common Sense Media](https://www.commonsensemedia.org/app-reviews/picturethis-plant-identifier/user-reviews/adult)).

### Greg

- **Positioning and target.** "Identify, Diagnose & Reminders" ([App Store](https://apps.apple.com/app/id1512912236)). Greg's care plan is built from species, pot size and distance to the nearest window. Targets newer plant owners who like a friendly tone.
- **Pricing and free vs paid.** Free scanning. "Super Greg" is $29.99 a year with a 7-day trial and unlocks precision watering, smart watering reminders, an indoor light gauge and seasonal updates ([App Store](https://apps.apple.com/app/id1512912236)). An older TechCrunch piece says the free tier was limited to five plants ([TechCrunch via search snippet](https://techcrunch.com/?p=2234094), dated, not opened, so not verified for today).
- **Onboarding.** 6 steps: a personalisation quiz, then a mandatory paywall with 7-day trial and social proof. Plant setup uses a "64% complete" progress bar ([ScreensDesign](https://screensdesign.com/showcase/greg-plant-identifier-care)).
- **Core loop.** Photograph, personalise, receive watering and fertilising schedules, then a dashboard of upcoming tasks. A water-level graph shows past and future needs. Community hub for tips ([ScreensDesign](https://screensdesign.com/showcase/greg-plant-identifier-care)).
- **Signature feature.** Estimating pot size and window distance from a photo, and the community ([App Store](https://apps.apple.com/app/id1512912236)).
- **Notifications.** Not verified.
- **Praise.** "I really like that I don't have to guess when to water"; community "is awesome"; fast support ([JustUseApp, 27 reviews, page dated 2026-06-04](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews)).
- **Complaints.** Schedules wrong for hot climates (a desert user: advice of every 6 to 14 days "would have killed their plants"); ID wrong about half the time for one reviewer; crashes; forced setup questions that do not fit outdoor plants; users want fertilising, misting and repotting tracking and a plant history timeline ([JustUseApp](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews)). Billing complaints also appear in an aggregator summary (not opened).

### Blossom

- **Positioning and target.** "Your guide to happy plants". Houseplant owners who want care guides plus ID ([blossomplant.com](https://blossomplant.com/)).
- **Pricing and free vs paid.** App Store lists Premium 1 year at $59.99 to $79.99, 1 month at $5.99, and a $7.99 weekly bundle ([App Store](https://apps.apple.com/app/id1487453649)). Premium includes unlimited ID, disease ID, water calculations, reminders and the AI Botanist. Reminders are behind the subscription: users can add a first plant, then are asked to subscribe to turn reminders on ([ScreensDesign](https://screensdesign.com/showcase/blossom-plant-care-guide)).
- **Onboarding.** 9 steps. Emotional hook "Tired of killing your plants?", then light, pot size and location. Soft paywall after the first plant, with a Premium vs Lite comparison ([ScreensDesign](https://screensdesign.com/showcase/blossom-plant-care-guide)).
- **Core loop.** Home is an action-oriented "To do" list; plants are grouped into Rooms; camera ID and diagnosis feed a care schedule; AI Botanist chat for quick questions ([ScreensDesign](https://screensdesign.com/showcase/blossom-plant-care-guide)).
- **Signature feature.** Advanced search by light need, difficulty, type and pet safety; a water calculator by plant and pot size; shop links that add tools to an Amazon cart ([App Store](https://apps.apple.com/app/id1487453649)).
- **Notifications.** Reminders for watering, fertilising and repotting, and weather alerts ([App Store](https://apps.apple.com/app/id1487453649)). One user says notifications arrive "at random times" instead of the set time ([JustUseApp](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews)).
- **Praise.** "I love the reminders and the ability to take cute notes"; "a virtual encyclopedia of plant care"; the daily breakdown of watering tasks ([JustUseApp](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews)).
- **Complaints.** Misidentification; "Advertised as free... Then tries to charge you $20 a month" (2021); a 2025-01-26 review calls a price increase "a total rip-off"; photos in notes disappeared after an update; My Garden stops scrolling at about 10 plants; watering advice led to overwatering for some ([JustUseApp](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews); only four reviews dated).

### Plantum

- **Positioning and target.** AI identifier with a care toolkit ([App Store](https://apps.apple.com/us/app/-/id1476047194)). Mass-market, ID-led.
- **Pricing and free vs paid.** Plantum PRO listed at $39.99, $34.99, $7.99 and others, without periods. One 2026 review says $29.99 a year ([Educational App Store via search snippet](https://www.educationalappstore.com/app/natureid-plant-identification), not opened, so not verified). Free versus paid split: not verified.
- **Onboarding.** Not verified.
- **Core loop.** Identify, add, set watering, misting, feeding and rotating reminders ([App Store](https://apps.apple.com/us/app/-/id1476047194)).
- **Signature feature.** Tool bundle: Light Meter, Pot Meter (pot volume for repotting), Water Calculator, Weather Tracker, and Vacation Mode that shares a care schedule with friends ([App Store](https://apps.apple.com/us/app/-/id1476047194)).
- **Notifications.** Not verified.
- **Praise.** "Consistently the best plant identifier"; "I'm loving the reminders" ([JustUseApp](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews), undated).
- **Complaints.** The most common are billing and cancellation ("Plantum AUTOMATICALLY put me on an annual plan"); a paywall after a single photo ("You can take 1 photo total before it FORCES you to sign up for a free trial"); intrusive ads; wrong IDs; support that does not reply. Dated reviews are all 2021 to 2022 ([JustUseApp](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews)).

---

## (b) Feature matrix

Legend: **yes** = offered, no paywall evidence found. **paywalled** = offered, gated per a cited source. **partial** = limited or only part of the capability. **no** = not found. **n/v** = not verified. FloraGrove column comes from the code and routes I read, not from competitor evidence.

| Capability | Planta | PictureThis | Greg | Blossom | Plantum | **FloraGrove** |
|---|---|---|---|---|---|---|
| Plant ID by photo | paywalled [S1] | yes, free tier limited per reviews [S2][S9] | yes, free scan [S3] | partial: unlimited ID is Premium [S4] | partial: reviewer reports a one-photo free limit [S5][S10] | **no** (endpoint exists, AI key not added) |
| Diagnosis | paywalled (Dr. Planta) [S1] | yes, listed; gating n/v [S2] | listed in subtitle only; gating n/v [S3] | paywalled (Premium) [S4] | yes, listed; gating n/v [S5] | **partial**: symptom checklist, not diagnosis (`/help-my-plant`) |
| Light meter / AR | paywalled [S1] | n/v ("tracks light exposure" in listing) [S2] | paywalled light gauge [S3] | partial: Android only per site [S6] | yes, listed; gating n/v [S5] | **partial**: pick a room's light level and see plant fit; no sensor (`/rooms`) |
| Care reminders | partial: watering free, other schedules paid [S1] | yes, listed; gating n/v [S2] | paywalled "smart" reminders [S3] | paywalled [S7] | yes, listed; gating n/v [S5] | **yes**, free, 1 a day cap, quiet hours 21:00 to 08:00 |
| Watering calculator | partial: built into schedule [S8] | n/v | paywalled "precision watering" [S3] | paywalled [S4] | yes, listed; gating n/v [S5] | **partial**: species interval plus finger-test lesson; no pot-size logic |
| Lessons / education | n/v | yes: encyclopedia and care guides [S9] | n/v | partial: blog and videos [S4] | n/v | **yes**: 5 lessons (soil finger-test, Plant ER, Window Blueprint, Habit Stacking, Plant Parent Reset) |
| Community | partial: forum on site [S8]; roundup mentions removed community features [S11] | n/v | yes [S3] | no found | no found | **yes** (Groves, feed, swaps) |
| Pet safety | n/v | yes: toxic-plant warnings [S2][S9] | n/v | yes: search filter [S4] | n/v | **yes**: ASPCA-sourced, on 40 species |
| Journal / photo timeline | yes: growth journal [S1] | n/v | no found; users ask for a timeline [S12] | yes: notes with photos [S4] | n/v | **yes**: memory journal |
| Rooms | partial: light by room [S8] | n/v | n/v | yes [S7] | n/v | **yes** (`/rooms`) |
| Widgets | n/v | n/v | n/v | n/v | n/v | **no** (no widget code found) |
| Offline | n/v | n/v | n/v | n/v | n/v | **no** (manifest only; no service worker in `public/`) |
| Expert chat | partial: human review option in Dr. Planta [S13]; gating n/v | yes, listed; paid per a 2020-era review [S2] | partial: community Q&A [S3] | partial: AI Botanist chatbot, Premium [S4] | n/v | **no** |
| Shopping / marketplace | n/v | n/v | n/v | yes: products via Amazon cart [S4] | n/v | **no** (swaps and bouquets are peer features) |
| Gamification | n/v | n/v | partial: progress bar in setup [S13b] | n/v | n/v | **partial**: badges and challenges exist; streak pushes off by default |
| Care sharing / sitter (extra row) | yes: Care Share [S8] | n/v | n/v | n/v | yes: Vacation Mode [S5] | **yes**: sitter logging exists in the backend; UI discoverability not checked |

Sources: S1 [Planta support](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium). S2 [PictureThis App Store](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129). S3 [Greg App Store](https://apps.apple.com/app/id1512912236). S4 [Blossom App Store](https://apps.apple.com/app/id1487453649). S5 [Plantum App Store](https://apps.apple.com/us/app/-/id1476047194). S6 [blossomplant.com](https://blossomplant.com/). S7 [ScreensDesign Blossom](https://screensdesign.com/showcase/blossom-plant-care-guide). S8 [getplanta.com](https://getplanta.com/) and [Planta App Store](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781). S9 [picturethisai.com](https://www.picturethisai.com/). S10 [JustUseApp Plantum](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews). S11 [OnClarity Planta](https://www.onclarity.com/leaderboard/insight/getplanta). S12 [JustUseApp Greg](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews). S13 [ScreensDesign Planta](https://screensdesign.com/showcase/planta-plant-garden-care); S13b [ScreensDesign Greg](https://screensdesign.com/showcase/greg-plant-identifier-care).

**Reading the matrix.** The broad pattern (known): photo ID, diagnosis, light meter and precision watering sit behind subscriptions in at least Planta, Greg and Blossom. New this pass: Plantum and PictureThis bundle the same set, and every competitor ships a native app, which FloraGrove does not yet (listings above). Widgets and offline are unverified across all five, so I make no recommendation on them.

---

## (c) What FloraGrove needs

Ranked by impact for a new owner. Effort: S under a week, M one to three weeks, L over a month (my estimates, not measured against your codebase beyond the files named). Study 001 has not run, so priorities are evidence-informed, not validated.

| # | Item | Verdict | Bar set by | Evidence (URL) | Effort | Priority | Rationale for a new owner |
|---|---|---|---|---|---|---|---|
| 1 | Make watering reminders learn from "was the soil dry?" when a person logs early or late | CHANGE | Planta | [ScreensDesign Planta](https://screensdesign.com/showcase/planta-plant-garden-care) (adjusts after early watering); complaint [OnClarity](https://www.onclarity.com/leaderboard/insight/getplanta). FloraGrove resets the next due date to now plus a fixed interval on each log (`grove-backend/server.py` lines 1648, 1723) and does not use soil feedback. | M | Now | Overwatering is the commonest way new owners kill plants, and the finger-test lesson already teaches the check. Close the loop and say "we moved your next check to Friday because the soil was still damp". Also resolves the strategy's open "verify reschedule" item. |
| 2 | Turn plant ID by photo on, with confidence and one-step correction | ADD | Greg (free scan), PictureThis | [Greg](https://apps.apple.com/app/id1512912236), [PictureThis](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129); reviewer harm: [JustUseApp](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews) ("can put peoples plants at risk") | S to M (endpoint exists at `/plants/identify`; needs the key and QA) | Now (gates Study 001 per strategy) | It is the first thing new owners expect. Your edge is not accuracy; it is honest confidence and an easy fix. Keep the free tier free so it is not another Plantum "one photo then paywall". |
| 3 | A safe path for plants outside the 40 curated species | CHANGE | Blossom (library gaps are a complaint); PictureThis, Plantum (breadth) | Complaint: [JustUseApp Blossom](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews) ("not enough library submissions"); Plantum "missing common plants" [JustUseApp](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews). FloraGrove has "Or add custom plant" in `AddPlantPage.js`. | M | Now | With 40 species, ID will often return something you cannot care for. Give custom plants a generic care card, a clearly stated "pet safety unknown" state, and a "ask us to add this" request. Never leave a new owner at a dead end. |
| 4 | Ask for pot size, pot material and place at setup, and show why each answer matters | ADD | Planta, Greg, Blossom | [ScreensDesign Planta](https://screensdesign.com/showcase/planta-plant-garden-care) (pot material changes watering); [Greg App Store](https://apps.apple.com/app/id1512912236) (pot and window distance); [ScreensDesign Blossom](https://screensdesign.com/showcase/blossom-plant-care-guide) | M | Next | The advice a new owner can trust is advice that visibly changes with their pot. Keep every field optional: Greg users complain about forced questions ([JustUseApp Greg](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews)). |
| 5 | Climate-aware schedules (ask region or heating and season) | ADD | Planta (weather), Greg (complaint) | [getplanta.com](https://getplanta.com/) (local climate and weather); Greg desert-user complaint [JustUseApp](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews) | M | Next | A fixed per-species interval fails in hot, dry or cold homes. Start with one "how dry is your home?" question rather than live weather. |
| 6 | A native iPhone app (push, camera, widgets) | ADD | All five | Native listings: [Planta](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781), [PictureThis](https://apps.apple.com/us/app/picturethis-plant-identifier/id1252497129), [Greg](https://apps.apple.com/app/id1512912236), [Blossom](https://apps.apple.com/app/id1487453649), [Plantum](https://apps.apple.com/us/app/-/id1476047194). Strategy already flags it as the largest structural gap (known). | L | Next (December plan) | Reliable reminders are the #1 dealbreaker in your survey (28 of 37). Web push on iOS only works once installed to the home screen. I found no verified competitor widgets or offline mode, so those stay out of scope. |
| 7 | "How much water" guidance from pot size, not just "when" | ADD | Blossom, Plantum, Greg | [Blossom](https://apps.apple.com/app/id1487453649) (water calculator), [Plantum](https://apps.apple.com/us/app/-/id1476047194) (Water Calculator, Pot Meter), [Greg](https://apps.apple.com/app/id1512912236) | S to M | Next | New owners know when but not how much. Competitors paywall it; offering it free in the care step is a clear difference. Depends on item 4. |
| 8 | Reachable light check from a plant page, plus a guided manual test | CHANGE | Planta, Greg, Plantum (meter); Blossom (Android only) | [Planta support](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium), [Greg](https://apps.apple.com/app/id1512912236), [Plantum](https://apps.apple.com/us/app/-/id1476047194), [blossomplant.com](https://blossomplant.com/). FloraGrove: the light picker lives in Rooms, three taps deep (known; audit item 9). The Window Blueprint lesson exists (`lessons/cards/windowBlueprint.js`). | S (entry point), L (sensor or AR) | Now (entry point), Later (sensor) | Competitors all headline light. You already teach it. Put "Is this spot right?" on the plant page and link the lesson. I have not checked whether a web app can read an ambient-light sensor on iPhone, so the sensor stays "Later, feasibility unknown". |
| 9 | Non-watering care reminders (fertilise, repot, mist) that default to off or "seasonal" | ADD | Planta, Blossom, Plantum, Greg users | [Planta](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781), [Blossom](https://apps.apple.com/app/id1487453649), [Plantum](https://apps.apple.com/us/app/-/id1476047194); Greg users ask for them [JustUseApp](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews). FloraGrove can log fertilise and repot (`CareLogModal.js`); whether they schedule reminders is not verified. | M | Later | Useful once a person has kept plants for a season. Keep them inside the single daily cap. Do not add them for new owners at first run. |
| 10 | Surface the plant sitter ("Going away?") on the plant page | CHANGE | Planta (Care Share), Plantum (Vacation Mode) | [getplanta.com](https://getplanta.com/), [Plantum](https://apps.apple.com/us/app/-/id1476047194). FloraGrove has sitter logging in the backend and notification policy (`notification_policy.py`); I did not verify the UI entry point. | S | Later | Holidays are where a new owner's plants die. If the feature exists, make it findable. If it is not in the UI yet, treat this as ADD. |
| 11 | Plant history that shows what changed after each action | CHANGE | Greg users (asking), Planta (history filter) | [JustUseApp Greg](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews) (users want a timeline); [ScreensDesign Planta](https://screensdesign.com/showcase/planta-plant-garden-care) (history by action). FloraGrove already has the memory journal. | S | Later | Your journal is a keepsake. A small "care log" view with filters turns it into evidence the new owner can use when something goes wrong. |
| 12 | Keep the symptom checklist and add "which check first" ordering | KEEP | Planta, Blossom, PictureThis (diagnosis paywalled or unreliable) | [Planta support](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium), [ScreensDesign Blossom](https://screensdesign.com/showcase/blossom-plant-care-guide), [JustUseApp PictureThis](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews) ("instructions are WRONG & INCONSISTENT") | S | Next | A symptom list with the cheapest check first (soil, then light) is safer than a confident wrong diagnosis. Say plainly that it is not a diagnosis. Revisit once ID is live. |

**Notes on what I left out for lack of evidence.** Widgets, offline mode, shopping and expert chat have no verified competitor evidence beyond listings, and none of them fits the new-owner job better than items above, so they are not scored. Community prominence stays a deliberate KEEP below.

### Do NOT copy

1. **Paywall at the moment of first value.** Blossom turns on reminders only after subscribing ([ScreensDesign](https://screensdesign.com/showcase/blossom-plant-care-guide)); Greg's paywall is mandatory straight after the quiz ([ScreensDesign](https://screensdesign.com/showcase/greg-plant-identifier-care)); Planta's follows its quiz ([ScreensDesign](https://screensdesign.com/showcase/planta-plant-garden-care)). Your strategy already says reminders stay free.
2. **Free trials that convert silently, and hidden cancel buttons.** PictureThis and Plantum reviews are dominated by this ([JustUseApp PictureThis](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews), [JustUseApp Plantum](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews)); a 2026 review says Plantum's cancel button is "annoyingly hidden" ([search snippet](https://www.educationalappstore.com/app/natureid-plant-identification), not verified). When monetisation is decided, state price and trial end before any account step.
3. **Advertised as free, then gated.** Planta users feel misled about what is free (about 25% of the OnClarity sample, [OnClarity](https://www.onclarity.com/leaderboard/insight/getplanta)); Blossom and PictureThis reviews say the same. Label limits in advance.
4. **A paywall after one use** ("1 photo total before it FORCES you to sign up", [JustUseApp Plantum](https://justuseapp.com/en/app/1476047194/plantum-ai-plant-identifier/reviews)).
5. **Streak and "at risk" pressure.** None of the five was verified using streaks, so there is no competitor to copy. Greg's "64% complete" bar is a gamified setup device ([ScreensDesign](https://screensdesign.com/showcase/greg-plant-identifier-care)); skip it, and show progress only when it is a real next step.
6. **Marketing push notifications mixed with care reminders** (reported for Planta in a [Kimola snippet](https://kimola.com/reports/comprehensive-planta-app-customer-feedback-report-app-store-us-155863), page unavailable, so not verified; Blossom users also report reminders at random times, [JustUseApp](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews)). Keep the one-a-day care cap and quiet hours.
7. **Confident wrong answers with no recovery** (PictureThis reviewers, [JustUseApp](https://justuseapp.com/en/app/1252497129/picturethis-plant-identifier/reviews)).
8. **Affiliate shopping inside diagnosis.** Blossom ties product links to treatment ([ScreensDesign](https://screensdesign.com/showcase/blossom-plant-care-guide)). For a calm tool for beginners, a sale at the moment of worry erodes trust.
9. **Forced questions that do not fit the plant** (Greg outdoor-plant complaint, [JustUseApp](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews)). Make the new setup fields optional.
10. **Lists that break with growth.** Blossom's My Garden stops scrolling at about 10 plants and photo notes vanished after an update ([JustUseApp](https://justuseapp.com/en/app/1487453649/blossom-plant-identification/reviews)). Test the journal and plant list with 30+ plants and protect journal photos.

---

## (d) Where FloraGrove is already ahead or different

Proof is from the app code and docs, not from using it.

| Strength | Proof in the app | Competitor contrast |
|---|---|---|
| Reminders free and capped | `grove-backend/notification_policy.py`: care on by default, streaks, bloom hour, challenges, swaps and reactions off, quiet hours 21:00 to 08:00, one care notification a day, adjustable to 3. | Reminders paywalled at Blossom [S7] and Greg [S3]; Planta limits non-watering schedules [S1]. |
| Soil finger-test taught before advice | Lesson `soil-finger-test` in `grove-frontend/src/lessons/registry.js`, with `SoilTestStep.jsx`. | No competitor lesson of this kind verified; Blossom has articles [S4]. |
| Reasons shown with instructions | `CarePage.js` shows `status_reason` in Detailed mode and Simple shows the exact step. | Planta says it adjusts; no competitor verified showing the reason in plain words. |
| Symptom checklist stated as not a diagnosis | `HelpMyPlantPage.js` with `SAFETY_NOTE` from `lib/plantHelp.js`. | Diagnosis is paid at Planta and Blossom, and reviewed as unreliable at PictureThis. |
| Pet safety on every species card | `ToxicityBadge` on plant detail, species pick list and Greenhouse; ASPCA-sourced, 40 curated species. | Verified only at PictureThis and Blossom; not verified at Planta, Greg, Plantum. |
| Honest failed states and undo | Panel audit P0 items shipped per recent commits (`fdf692a`): failed states, archive with undo. Water All undo (`server.py` around line 1674). | Not assessed for competitors. |
| A calm tone and no streak push | Notification defaults above; Admin demo is the only streak UI found by grep. Badges and challenges routes still exist (`/badges`, `/challenges`). | Not verified either way for competitors. |
| Rooms with light fit | `RoomPage.js`: choose a room's light, plants show fit. | Blossom has rooms; Planta ties light to rooms behind its meter. |

**Caution.** The strategy docs say community, swaps, bouquets and groves are not MVP optimisation targets. They are breadth, not an advantage, for a new owner. Greg's users praise community ([JustUseApp](https://justuseapp.com/en/app/1512912236/greg-plant-care-assistant/reviews)), but your survey argues against prominence. I recommend KEEP: deliberate de-emphasis for new owners, revisit for collectors.

---

## (e) Open questions and what I could not verify

### Questions for you

1. Is plant ID going live before or after Study 001? It changes whether items 2 and 3 are "Now".
2. What will you charge for, if anything? The Do-NOT-copy list assumes reminders, ID and light stay free.
3. Does the sitter feature have a UI entry point today? Item 10 turns on the answer.
4. Do non-watering reminders (item 9) exist as schedules, or only as log actions?
5. Is the December native app still on, and is widgets in scope? I have no verified competitor evidence for widgets.
6. Should I swap in PlantIn, Vera or Leaf as a sixth for a follow-up?

### Could not verify

- **Planta Google Play, Plantum Google Play, PlantIn Google Play and App Store** pages did not load (404 or truncated). No Android ratings or install counts from the stores themselves.
- **Greg's own site** returned 403. No Greg help centre found; pricing and features come from the App Store.
- **Planta's price** is not on its site or support page; the range comes from the App Store listing, which does not match prices to periods. Trial length not verified.
- **PictureThis and Plantum:** free-versus-paid split, onboarding and notification behaviour, and expert-chat gating are not verified from first-party pages. PictureThis help centre not found.
- **Widgets, offline and shopping** at every app except Blossom's shopping: not verified. No first-party evidence for Planta widgets.
- **Reviews.** Kimola reports now return 410 (Planta, Greg). Review text is from JustUseApp, Common Sense Media and OnClarity, mostly undated; the dated PictureThis, Plantum and Blossom reviews are 2021 to 2025. JustUseApp and OnClarity sentiment scores are algorithmic and I did not use them. The 2026 aggregator pages (marlvel.ai, unstar.app, bottegadelsarto) were not relied on.
- **Stale risk.** App Store "last updated" dates have no year: Planta 3.124.0 "October 19", PictureThis 5.74.0, Greg 2.1.12, Blossom 2.62.30 "March 19", Plantum 6.21 "Sep 2". PCWorld's lifetime-deal page is from a previous year and the offer may have lapsed.
- **Nothing here comes from hands-on use.** The strategy's two-hour fresh-account check (paywall placement, wrong-ID recovery, first-week reminder volume, VoiceOver, early or late watering) is still the right way to confirm items 1, 2 and the Do-NOT-copy list.
