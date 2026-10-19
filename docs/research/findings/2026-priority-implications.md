# Feature priorities vs the 37-response survey

Companion to [`2026-grove-concept-survey.md`](2026-grove-concept-survey.md). All counts come from [`../scripts/survey_stats.py`](../scripts/survey_stats.py).

## What the existing docs actually say about priority

The repo has **no ranked feature list.** What it does have:

- **Audience order.** [`docs/product/confirmed-context.md`](../../product/confirmed-context.md): new plant owners are the MVP audience, then experienced collectors, then florists, influencers, and horticulturalists as separate later segments. "Evidence from one audience must not be generalized to another."
- **MVP study scope.** [`docs/research/studies/trusted-first-care-action.md`](../studies/trusted-first-care-action.md), "Artifact under test": onboarding, add a plant with a photo, review ID and watering guidance, Care Today, decide whether care is needed, then log or correct it. "Do not test community, swaps, badges, rooms, and bouquets in this study."
- **Unresolved priority.** [`docs/research/grove-research-system.md`](../grove-research-system.md), "Research debt": "The first-use value proposition spans care, memory, community, and confidence; their priority is unresolved." It also says concept routes outnumber validated decisions.
- **Status.** [`docs/research/README.md`](../README.md): no participants recruited, no sessions run, "Product conclusions supported by research: no."
- **Approved build direction.** [`docs/superpowers/specs/2026-10-13-pip-room-design.md`](../../superpowers/specs/2026-10-13-pip-room-design.md): lessons, quiz, and soil test (Plan 1), plus an optional nook (Plan 2). A weekly nudge is off by default. Trivia and tips come daily through "Pip's note." It lists as open questions whether to keep the daily streak, and whether to ask for a soil check before the bulk water round.

So "current priority" below means where each feature sits in that scope: **MVP core** (inside Study 001's slice), **out of MVP study** (explicitly excluded), **later audience** (florist or collector), or **not addressed**. "Built" is what exists in `grove-frontend/src` today.

The survey is attitudinal. It can argue for or against a priority. It can't settle one. That stays the job of Study 001.

## Per feature

Dealbreaker rank = "Ultimate Trade-off" (pick 3, n=37).

| Feature | Current priority (source) | Built? | Dealbreaker rank (n/37) | Other evidence | Implication |
|---|---|---|---|---|---|
| **Smart care reminders** | MVP core: Care Today (Study 001) | Yes: Care Today, due labels, notification preferences | **#1 (28)** | 33/37 in category pick; 9/18 "most helpful beginner feature"; 32/37 want it free. **But 12/37 would delete over notification volume** | **Confirmed, with a condition:** keep reminders central and cap their volume. The rank didn't change (26/35 before). The new point is that the most-wanted feature and the top delete trigger are the same thing. |
| **Plant ID camera** | MVP core: "review identification" (Study 001) | Yes: `PlantIdentifyScreen.js` with confidence and editable fields | **#2 (20)** | 28/37 in Scanning; 22/37 would trust AI ID. R35's delete trigger is misidentification | **Confirmed.** Supports keeping the low-confidence and edit path Study 001 already tests. |
| **AI diagnosis for sick plants** | Not addressed. Concept only (`/plant-er`, `PlantERVariations.js`) | No | **#3 (18)** | 24/37 in Scanning; **23/37 would trust it, the highest of any AI feature**; 13/18 new owners find leaf symptoms stressful; 21/37 want community troubleshooting for sick plants | **The data argues for raising it.** It's the biggest gap between demand and current scope. Study 001 limits AI to ID and watering, so diagnosis needs its own decision before it enters MVP. |
| **Growth photo journal** | Not addressed (photos are in onboarding: "Make it real") | Partly: `PhotoGallery.js`, `BloomingTimeline.js` | #4 tie (8) | 21/37 in category pick; **10/13 collectors** say a growth timeline makes the collection worth it | **Collector feature.** Moderate for MVP. Strong for the first expansion audience. |
| **Room/light map** | Out of MVP study ("rooms" excluded); light-spot lesson in Pip spec | Partly: `/rooms`, `RoomScanScreen.js`, `/cozy-room-planner` concept | #4 tie (8) | **29/37 top Visuals pick**; 30/37 want too-dark or too-sunny zones flagged; strict-new light confidence 2.38 vs experienced 3.43; 18/37 would pay for it | **The data argues for the light-check part,** not the decorative room. The need is in new owners' low light confidence, which the Pip spec's light-spot lesson already addresses. Also the strongest paid-feature candidate. |
| **The Greenhouse encyclopedia** | Not addressed | Yes: `/greenhouse`, `SpeciesDetailPage.js` | #4 tie (8), up from 6th (7) | 21/37 want visual water and light summaries; 19/37 regional ecology | **No change.** The extra vote comes from one new-owner response (R36), which moves it into a three-way tie. Supporting content, not a dealbreaker. |
| **Community forums ("Groves")** | Out of MVP study | Yes: `/groves`, `GroveChat.js`; onboarding promises the feed "at day 7" | **#7 (7)** | 21/37 as a *social* pick; 6/37 zero interest; R05 would delete over *required* community | **The data argues against MVP prominence.** Keep it optional, and take the day-7 feed promise out of the new-owner onboarding. Still 7th; one more vote (R36) took it from 6 to 7. |
| **Bulk logging** | Not addressed in priority docs; Pip spec asks about a soil check before the bulk water round | Yes: Care "Water All", Collection bulk actions | #8 (5) | **9/13 collectors** prefer one-tap; 7/13 would stop updating if they had to log one by one | **Keep what's built.** Low dealbreaker rank, high churn protection for collectors. Add undo and a soil check rather than more features. |
| **Bouquet scanner** | Out of MVP study ("bouquets" excluded) | Yes: bouquet identify on `BouquetDetailPage.js` | **#9 alone (4)** | 12/37 would trust bouquet flower ID; 16/37 want bouquets in a *separate* tab, 8/37 don't want them at all, only 5/37 want them mixed in. Today `CollectionPage.js` mixes them into the plant grid | **Priority shouldn't change.** The 4th vote came from one florist (R35). It stays a later-audience feature. |
| **Plant swapping** | Out of MVP study | Yes: `/swaps`, match and chat | #10 (3) | 12/37 would never swap; 10/37 only face to face; 15/37 wouldn't use "Plant Swapping & Groves" | **The data argues against investing further** before a collector study. |
| **Wishlist** | Not addressed | Yes: `/wants` | #11 tie (1) | 6/37 in category pick; 5/13 collectors | **Lowest.** No new work warranted. |
| **Florist QR care pages** | Later audience (florists, confirmed-context) | Yes: `/bouquet/:slug` public page, `/florist` | **#11 tie (1)** | 3/3 florists want pet warnings; 2/3 want a reorder or contact button; QR usefulness rated 2, 2, 5; **22/37 would not use florist tools** | **First signal, still small n.** One studio florist found it valuable, two retail-side florists didn't. Florists need their own discovery study before more build, as the product doc already says. The cheap fixes (pet warning, vase-life disclaimer) are worth doing anyway. See the app-changes doc. |

## Cross-cutting items the docs don't rank

| Item | Current status (source) | Evidence | Implication |
|---|---|---|---|
| **Notification volume** | Pip spec: weekly nudge off by default, others "optional and capped by user settings." But `server.py` defaults 10 of 11 push types to on, with no cap | 12/37 delete trigger; R06 ">1/day", R14 ">3/day" | Treat a daily cap as an MVP requirement, not a setting. |
| **Daily streaks** | Open question in the Pip spec | 11/13 collectors would stop if it feels like an "administrative chore"; R01 "peaceful … not stressful" | Supports the Pip spec's weekly-rhythm direction and turning off `push_streak_at_risk`. |
| **Pet safety** | Not addressed | 4/12 strict-new (5/18 overall) find it stressful; 3/3 florists get pet calls; 11/37 want placement alerts | Small but cross-audience and safety-relevant. Show it wherever a species is shown. |
| **AI explanations** | Study 001 hypothesis 3: "AI assistance increases clarity without creating false confidence" | Explains why 22/37, confidence score 17/37, expert-verified 19/37; 5/37 want no AI | Directly supports Study 001's trust measures. Add "why" and visible confidence to every AI output, plus a no-AI path. |
| **Simple/Detailed text** | Not addressed | 12/18 new-owner block want a toggle; 3/37 delete over wordiness; 1 more (R37) cites hard-to-read text and fonts | A new MVP candidate. Cheap to prototype for Study 001. |
| **Daily trivia** | Pip spec: daily through Pip's note; `DailyTriviaCard` on Care daily | 17/34 don't want it daily as-is | Let users choose how often (daily, a few times a week, off), or personalize it. |
| **Pricing** | Pip spec: "Monetization is decided later"; profile copy says free tier is 15 plants | 16/37 prefer a one-time lifetime purchase; 32/37 want reminders free; R19 deletes over a mid-progress paywall | Input for the later monetization decision. Never gate reminders. |

## Rank changes since the 35-response analysis

1. **The Greenhouse:** 7 to 8 votes, from 6th to a three-way tie for 4th with the growth journal and room map.
2. **Community forums:** 6 to 7 votes, still 7th.
3. **Smart reminders, plant ID, AI diagnosis:** 26 to 28, 19 to 20, 17 to 18. Same ranks, same shares (76%, 54%, 49%).

R36 and R37 are both new-owner responses, so they count toward the MVP audience. They still don't move a priority: the top three keep their order, and the Greenhouse tie rests on one vote.
