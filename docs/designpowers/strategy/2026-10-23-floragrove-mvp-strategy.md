# Design Strategy: FloraGrove MVP for new plant owners

Date: 2026-10-23 | Status: draft for alignment

Inputs: `docs/product/confirmed-context.md` (audience order), `docs/research/findings/2026-priority-implications.md` and `2026-grove-concept-survey.md` (37-response survey, attitudinal only), `docs/research/studies/trusted-first-care-action.md` (Study 001, not yet run), the 2026-10-23 accessibility audit, and the taste profile.

**Evidence status.** No participants have been recruited and no sessions run. The survey can argue for or against a priority but cannot settle one. Everything below is a direction to test, not a validated conclusion.

## Design principles

### 1. One next action, and the reason for it
**The principle:** Every screen answers "what does this plant need today, and why?" before it shows anything else.
**In practice:** Care Today leads. Each instruction carries its reason ("soil is dry two knuckles down"). The collection is a way to reach a plant, not a dashboard to admire.
**We will NOT:** build screens that list everything at equal weight, or give advice without the reason behind it.

### 2. Say how sure we are, and make it easy to disagree
**The principle:** Every AI result shows its confidence and can be corrected in one step.
**In practice:** Identification shows a confidence level and an editable species. A wrong answer is a normal path, not an error state. Failures say what happened and keep the person's work.
**We will NOT:** present AI output in a confident voice with no way to question it, or block the app when AI is unavailable.

### 3. Quiet by default
**The principle:** The app earns attention instead of taking it.
**In practice:** Reminders have a daily cap. No streaks, no "at risk" pushes, no daily trivia unless the person chooses it. Reminders are never behind a paywall.
**We will NOT:** ship the current defaults (10 of 11 push types on, no cap). 12 of 37 survey respondents said notification volume would make them delete the app, and 11 of 13 collectors said chore-like tracking would make them stop.

### 4. Readable and operable before it is beautiful
**The principle:** Legibility and access are part of the design, not a pass at the end.
**In practice:** Every field has a label. Text is 12px or larger. Borders that identify a control reach 3:1. Every screen has one heading and a landmark. A Simple / Detailed text switch is a candidate MVP feature (12 of 18 new owners asked for one).
**We will NOT:** use placeholder text as the only label, or put meaning in colour alone.

## Competitive evidence and MVP parity check

**Evidence quality: desk research only.** Sources are app store listings, support pages, review sites and review aggregators, searched on 2026-10-23. Nothing here comes from hands-on use of the apps. Prices differ between listings and regions, vendor accuracy claims are not independently verified, and some reviews are dated. Treat it as a reasonable first picture, and verify the starred items (*) by using the apps.

### What the four apps do

| | Planta | Greg | PictureThis | Blossom |
|---|---|---|---|---|
| Watering reminders | Basic watering free; other care schedules paid [1][2] | "Smart" reminders paid, about $30 a year, 7-day trial [3] | Not researched | Paywall appears when you try to turn reminders on, right after adding your first plant [4] |
| Plant ID by photo | Paid [1] | Listed as free to scan [3] | Core feature | Core feature; multi-photo mode [4] |
| Diagnosis of sick plants | Paid ("Dr. Planta") [1] | Not found | Reviewers call it unreliable [5] | Included in Premium; links to product purchases [4] |
| Light guidance | Light meter paid [1] | Light gauge paid [3] | Not researched | Search by light need [4] |
| Community | None found | Q&A and a social feed [3] | Not researched | None found |
| Pet-safety info | Not researched | Not researched | Not researched | Searchable by pet safety [4] |
| Price (verify*) | $9.99 a month, $35.99 to $47.99 a year, depending on the listing [1] | About $29.99 a year [3] | Billing and cancellation complaints are the most common [5] | Not found |

### Recurring user complaints (the opening for FloraGrove)

1. **Paywalls and billing.** The most frequent complaint across apps: unclear trials, hard cancellation, and features locked right after first use [4][5][6].
2. **Wrong identification, and no easy fix.** Reviewers report misidentified plants making all later care advice wrong. One review says correcting a PictureThis result works only if you already know the plant's name [5][6].
3. **Reminders that don't adapt.** Planta reviewers say reminders ignore early or late watering, causing stress, and that completed tasks don't always clear [6].

### Parity check: is the MVP on par?

| Capability | Competitors | FloraGrove today | Verdict |
|---|---|---|---|
| Watering and care reminders | Table stakes; often partly paywalled | Built; free by principle | **At parity, better on price.** Needs a daily cap |
| Plant ID by photo | Table stakes | Built, with confidence and editable fields, but **off in production** until the Anthropic key is added | **Below parity until the key is added.** Correction flow is better than the weakest competitor |
| Care guidance with reasons | Present | Built (Care Today, species pages) | At parity. The reason shown with each instruction is a differentiator |
| Pet safety | Present in at least one | Built (toxicity pills on species and Greenhouse) | At parity |
| Plant library | Present | Built (Greenhouse) | At parity |
| Light guidance | Paid in Planta and Greg | Partly built (room scan, light-spot lesson); not validated | **Behind.** Not required for MVP, but competitors treat it as a headline feature |
| Sick-plant diagnosis | Planta, Blossom; unreliable at PictureThis | Not built (concept only) | **Behind, and it matters.** It was the #3 dealbreaker in your survey (18 of 37), and 23 of 37 would trust it. Outside the Study 001 slice, so a deliberate gap |
| Community | Greg | Built (Groves) | Ahead on breadth, but the survey argues against making it prominent |
| Reminders that adapt to when you actually watered | Planta is criticised for lacking it | Care Today lets you decide if care is needed, but I have not verified it reschedules after early or late watering | **Verify*** |
| Native app (push, widgets, camera quality) | All four are native apps | A web app with phone-app styling; the iPhone app is planned for December | **Behind.** iOS web push needs the app installed to the home screen. This is the largest structural gap |

**Verdict.** On table stakes the MVP is close, with two real gaps: plant ID is switched off, and there is no native app. The plan already covers the first. Diagnosis and light guidance are deliberate gaps that competitors charge for, so say so plainly instead of hiding them.

### Where FloraGrove can be different

- **Free reminders, with the price stated early.** Competitors put the paywall exactly where the value starts.
- **An easy way to fix a wrong answer.** Confidence is shown, and the species is editable in one step.
- **Fewer, calmer notifications**, with the reason shown for each.
- **Honest limits.** Say what the app can't do yet, rather than a confident wrong answer.

### To verify by using the apps (about 2 hours, fresh accounts on an iPhone)

(a) Where each paywall appears and how cancellation works. (b) How each app recovers from a wrong ID. (c) Default reminder volume in the first week. (d) VoiceOver and large-text behaviour on the first-care path. (e) Whether reminders reschedule after early or late watering.

### Sources

[1] [Planta support: Premium features](https://support.getplanta.com/do-planta-offer-a-free-trial-of-premium) and [App Store listing](https://apps.apple.com/us/app/planta-plant-garden-care/id1410126781)
[2] [iMore review of Planta](https://www.imore.com/apps/planta-is-a-pricey-but-detailed-houseplant-care-iphone-app-for-indoor-gardeners)
[3] [Greg on the App Store](https://apps.apple.com/app/id1512912236) and [AlternativeTo](https://alternativeto.net/software/greg--plant-identifier-and-care/about)
[4] [Blossom on the App Store](https://apps.apple.com/app/1487453649) and [teardown](https://screensdesign.com/showcase/blossom-plant-care-guide)
[5] [Kimola PictureThis feedback analysis](https://kimola.com/reports/explore-in-depth-feedback-analysis-of-picturethis-app-app-store-us-142047) and [Common Sense Media reviews](https://www.commonsensemedia.org/app-reviews/picturethis-plant-identifier/user-reviews/adult)
[6] [Planta review roundup](https://www.onclarity.com/leaderboard/insight/getplanta) and [Kimola on another plant app](https://kimola.com/reports/explore-user-feedback-insights-on-plant-care-app-app-store-us-141763)

## Experience map

| Stage | What happens | Emotional state | Inclusive considerations |
|---|---|---|---|
| Entry | Waitlist at floragrove.app, later the iPhone app | Curious, a bit guilty about past plants | Page already passes automated checks; keep the form label and error text plain |
| First 5 seconds | "Stop guessing when to water." One field, one button | Hopeful | Large touch targets; no account wall before value |
| Setup | Onboarding, add one plant with a photo | Eager, slightly anxious | Labelled fields; photo is optional with a species search fallback |
| Identification | Review result and confidence | Hopeful, then doubtful if wrong | Confidence in words, not just colour; correction in one step |
| Care Today | See what's due, decide if care is needed | Relief or worry | One clear action per plant; the reason in plain language |
| Friction | Wrong ID, AI unavailable, upload fails, too many reminders | Frustrated, distrustful | Errors say what happened and what to do; nothing lost |
| Exit and return | Log, postpone or correct; capped reminder next day | Satisfied, or guilty if nagged | Quiet defaults; a pet-safety note wherever a species appears |

## Success metrics

Targets are proposals. There are no baselines until Study 001 runs.

| Metric | Measures | Proposed target | How |
|---|---|---|---|
| Unaided first-care completion | Can a new owner set up a plant and act on Care Today without help | At least 4 of 5 participants | Study 001 moderated tasks |
| Appropriate override | Does the person correct a deliberately wrong ID or watering suggestion | At least 4 of 5 | Study 001 tasks 3 and 4 |
| Failure recovery | Can they continue after an AI or upload failure with no lost work | 5 of 5 | Study 001 task 5 |
| Notification tolerance | Do people turn reminders off or leave | Fewer than 1 in 10 within 14 days | Product analytics once live |
| Accessibility: task completion | Can the first-care path be completed with VoiceOver and at 200% text | 100%, no blockers | Manual assistive-technology pass |
| Accessibility: audit | Open critical and major WCAG findings | Zero critical, zero major before public launch | Re-run the 2026-10-23 audit |

## Constraints and trade-offs

- **Not optimising for** collectors, florists, influencers, community, swaps, bouquets or the room map in the MVP. The survey argues against giving Groves and swaps prominence, and the confirmed audience order puts new owners first.
- **Not gamifying.** No streaks or badges as the core loop.
- **Monetisation is undecided.** The only constraint carried forward: reminders stay free.
- **AI features depend on an Anthropic key that does not exist yet.** Plant ID by photo is the #2 dealbreaker (20 of 37) and the centre of Study 001, but it is off in production. Decide whether to get a key before the study or test species search as the entry path.
- **Visual direction note.** The taste profile favours warm earth tones; FloraGrove ships as a dark forest theme. The olive/sage and type-led principles carry over, but the 85% warm-neutral colour ratio does not apply here.

## Open decisions (owner: you)

1. Anthropic key: decided to add it soon and leave it as the last step after everything else is fixed.
2. Operational definition of "new plant owner" for recruitment.
3. Who makes the continue, revise or pause decision after Study 001, and the definition of a new plant owner (proposed in the chat; confirm).
4. Business model and the twelve-month objective.
