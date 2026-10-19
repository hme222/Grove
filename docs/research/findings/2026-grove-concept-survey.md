# Grove concept survey, 2026: findings

- **Data:** [`../data/grove-concept-survey-2026-anonymized.csv`](../data/grove-concept-survey-2026-anonymized.csv), 37 responses (R01 to R37), May 22 to Oct 16, 2026. Emails and phone numbers were removed before the file was added.
- **Every number below** comes from [`../scripts/survey_stats.py`](../scripts/survey_stats.py) (Python standard library only). Run `python3 docs/research/scripts/survey_stats.py` and the output follows this document section by section.
- **What this is:** a self-report survey about features that mostly don't exist yet. It shows what people *say* they want and fear. It doesn't show what they would *do*. The research system in [`../grove-research-system.md`](../grove-research-system.md) treats it that way too: attitudinal evidence, not proof of need.
- **Small-sample flag:** any group under 10 people is marked **(small n)**. The florist group is 3 people. Read their answers as quotes, not as percentages.

## How the survey was routed

People chose a "perspective" early on, and the form sent each perspective to a different block of questions. So some questions have 18 or 13 answers rather than 37.

| Block | Who saw it | Answered |
|---|---|---|
| New-owner block (confidence, stressors, alert style, text length) | "New plant owner" perspective | 18 (12 strict-new, 2 experienced, 2 "own plants but not good at them", 1 bouquet-only, 1 other) |
| Collection block (stop-updating, bulk logging, AI schedule) | "Experienced plant owner" perspective | 13 (12 experienced, 1 strict-new) |
| Florist block | "Florist" perspective | 3 **(small n)** |
| Everything else (features, AI trust, pricing, bouquets, delete triggers) | Everyone | 34 to 37 |

## Sample

Self-described relationship with plants (n=37):

| Group | n |
|---|---|
| Experienced owner or collector (3+ plants) | 14 |
| New to plant care (0 to 2 casual plants), "strict-new" | 14 |
| Florist or floral professional | 3 **(small n)** |
| Mostly buys or receives bouquets | 3 **(small n)** |
| Owns plants but isn't good at them (two free-text answers) | 2 **(small n)** |
| Other free-text answer (waters a parent's plants while they travel) | 1 **(small n)** |

## 1. Launch dealbreakers

"If Grove could only launch with three features, which are dealbreakers?" Percentages are of all 37. Three people picked more than three (R11 picked 4, R12 picked 5, R23 picked 4). Their picks are counted as given.

| Rank | Feature | Votes | % |
|---|---|---|---|
| 1 | Smart care reminders | 28 | 76% |
| 2 | Plant ID camera | 20 | 54% |
| 3 | AI diagnosis for sick plants | 18 | 49% |
| 4 (tie) | Growth photo journal | 8 | 22% |
| 4 (tie) | Room/light map | 8 | 22% |
| 4 (tie) | The Greenhouse encyclopedia | 8 | 22% |
| 7 | Community forums ("Groves") | 7 | 19% |
| 8 | Bulk logging | 5 | 14% |
| 9 | Bouquet scanner | 4 | 11% |
| 10 | Plant swapping | 3 | 8% |
| 11 (tie) | Wishlist | 1 | 3% |
| 11 (tie) | Florist QR care pages | 1 | 3% |

The top three hold up in the pick-two-per-category questions too: reminders 33/37 in Plant Care, plant ID 28/37 and AI diagnosis 24/37 in Scanning. In Visuals & Social, the room/light map led with 29/37 and forums came second with 21/37. **Forums do well when people have to pick two social features. They do badly when forums have to compete with care features.**

## 2. Confidence

| Measure | Group | Answered | Mean (1 to 5) |
|---|---|---|---|
| Keeping a plant alive | New-owner block | 18 | 2.06 |
| Judging if a spot has the right light | Strict-new | 13 of 14 | **2.38** |
| Judging if a spot has the right light | Experienced | 14 of 14 | **3.43** |
| Judging if a spot has the right light | Everyone | 34 | 2.88 (13 rated it 1 or 2) |

The two "own plants but not good at them" respondents both rated light confidence 1 **(small n)**.

## 3. What new owners find stressful

New-owner block, n=18, up to four picks:

| Stressor | n |
|---|---|
| How much water to give | 13 |
| Diagnosing yellow, brown, or drooping leaves | 13 |
| When to water | 11 |
| Whether a spot has enough sunlight | 8 |
| Pet safety or toxicity | 5 |
| Don't know where to start | 5 |

**Pet safety, stated precisely:** 4 strict-new respondents chose it (R06, R07, R23, R25). That's 4 of the 12 strict-new respondents who answered this question. The other 2 strict-new respondents (R10, R12) took a different perspective and never saw it. Counting everyone who saw the question, 5 of 18 chose it. Pet safety also shows up in three other places:

- All 3 florists say customers call to ask about pet toxicity **(small n)**.
- 11 of 37 want room-map alerts when a toxic plant is placed where pets can reach it.
- 1 of 18 picked "warn me if a plant is toxic" as the *single* most helpful beginner feature.

## 4. Care preferences in the new-owner block (n=18)

| Question | Result |
|---|---|
| Daily checklist usefulness | Mean 4.50; 11 of 18 rated it 5 |
| Most helpful beginner feature (pick one) | Smart reminders 9, beginner-safe plant picks 4, light placement 2 |
| **Overdue alert style** | 9 gentle nudge, 9 direct alert overall. **Strict-new: 9 of 12 chose the gentle nudge.** All 6 other respondents chose direct **(small n)** |
| **Text length** | **12 of 18 want a Simple/Detailed toggle** (8 of 12 strict-new). One quick sentence 3, short bullets 2, the exact step only 1 |

## 5. Keeping a collection updated (collection block, n=13)

| Question | Result |
|---|---|
| What would make you **stop updating** after week 1 | "Feels like an administrative chore" 11, logging plants one by one 7, adding a plant takes more than 30 seconds 5, no bulk photo upload 3, reminders conflict with my intuition 2 |
| Logging 10 plants watered at once | One tap for all (bulk) 9, each plant individually 2, wouldn't log watering 2 |
| What makes a collection worth the time | Growth-photo timeline 10, AI scanner fills in species and care 7, local climate adjusts care 6 |
| AI-suggested schedule you can fully edit | Mean 4.15 (6 rated it 5, 1 rated it 1) |

"Administrative chore" is the top answer to the *stop-updating* question. It isn't the top *delete* trigger. That's notifications (section 7).

## 6. AI trust (everyone)

- **5 of 37 would use no AI features** (R02, R04, R10, R28, R35). R28 ticked "none" and also ticked four AI features, so the firm count is 4 to 5.
- **8 of 37** (8 of 34 who answered) said their biggest frustration with care info online is that it's "hard to tell if the information is accurate or just written by AI bots."
- The other top frustrations: advice buried in long posts or videos (9) and advice too generic for my home (9). Conflicting advice across sites got 3.

AI features people would trust and use (of 37): diagnosis 23, species ID 22, starting care schedule 18, bouquet flower ID 12, bouquet vase-life estimate 4, plant biography 5.

What makes AI advice trustworthy (up to four, of 37):

| Trust builder | n |
|---|---|
| Explains why it made the recommendation | 22 |
| Reviewed or verified by experts | 19 |
| Shows a confidence score | 17 |
| Cites botanical sources | 14 |
| Shows photo examples to check against | 13 |
| Reminds me to check the actual soil or plant first | 5 |

## 7. Instant-delete triggers (free text, everyone)

Each answer was hand-coded. The codes and the raw text are printed side by side in the script so you can check them. Coding is conservative: R16's "emails or pop-ups" isn't counted as notification volume. R36's "constant nothing alerts" is coded as both ads and notification volume. R37's "do many adds" is read as ads (a typo for "ads" is my reading), and "words, font, etc not being easily visible" is coded as legibility.

| Theme | n of 37 | IDs |
|---|---|---|
| **Too many notifications or reminders** | **12** | R01, R06, R09, R14, R20, R24, R25, R26, R29, R31, R32, R36 |
| Ads | 5 | R04, R11, R17, R36, R37 |
| Logging or data-entry friction | 3 | R06, R08, R18 |
| Too wordy or complicated | 3 | R07, R21, R30 |
| Paywall or price | 2 | R19 ("a pay wall in the middle of progress"), R33 |
| AI wrong or untrustworthy | 2 | R02 (generative AI), R35 (misidentifying species) |
| Required community | 1 | R05 |
| Emails or pop-ups | 1 | R16 |
| Text or fonts hard to read | 1 | R37 |
| No quick view of what needs water | 1 | R03 |
| No answer or not sure | 8 | |

Two people named a number: R06 would delete at "more than one notification a day," R14 at "more than 3 notifications/daily." R01: "Plant care should feel peaceful and wholesome, not stressful."

## 8. Pricing (everyone, n=37)

| Preference | n |
|---|---|
| One-time lifetime purchase (e.g., $29.99) | **16** |
| Free tier only (ads or limits tolerated) | 7 |
| Under $3/month | 6 |
| $3 to $5/month | 7 |
| $6 to $10/month | 1 |

Should be free: basic reminders and scheduling 32, a small collection (up to 5) 20, AI ID and diagnosis 16, unlimited collection 15. Would pay for: unlimited collection 18, room/light map 18, florist tools 13, AI ID and diagnosis 13. Would not use: florist tools 22, swapping and Groves 15.

## 9. Bouquets and florists

**Florist block, n=3 (small n):** R02 (flower farmer and workshop instructor), R26 (retail floral designer), R35 (studio designer, weddings and events).

| Question | Answers |
|---|---|
| Customer complaints | Pet-toxicity calls 3, unrealistic vase-life expectations 2, flowers die from poor care 1, hydrangea-type fading 1 |
| QR care page usefulness (1 to 5) | 2, 2, 5 |
| What the page must include | **Pet toxicity warnings 3**. Flower names 2, vase-life window *with a disclaimer* 2, Day 1 vs ongoing steps 2, shop branding 2, **reorder or contact button 2** |
| Before sharing AI-written care text | "Vase life varies" disclaimer 2, full edit control 1, saved templates 1, **turn AI text off and use standard checkboxes 1**, never trust AI copy 1 |
| Format | Very short checklist (2 to 3 bullets) 2, depends on the arrangement 1 |
| Would pay for a pro version | "Maybe, depending on price" 2, "maybe, if data shows customers use the pages" 1 |

In practice, all three florists want either human control over AI text or no AI text at all.

**Bouquet questions everyone answered (n=37):**

- **Same app as houseplants?** Yes, but in a separate "Bouquet Memories" tab 16. No, houseplants only 8. Rarely get bouquets 8. Yes, mixed in with the collection 5.
- **Vase-life countdown:** helpful 15, neutral or not useful 16, stressful or depressing 6.
  - Strict-new: helpful 7, neutral 5, stressful 2.
  - Experienced: neutral 9, helpful 4, stressful 1.
  - Florists: stressful 2, neutral 1 **(small n)**.

## 10. Other concept signals (everyone)

- **Daily trivia or tip:** love it 12, occasionally but not every day 14, only if personalized to my plants 5, would ignore it 3. **17 of 34 don't want it daily as-is.**
- **Room map value:** highlight too-dark or too-sunny zones 30, seasonal light changes 19, unsafe-placement alerts for pets 11. Only 4 wouldn't set one up.
- **Community motivation:** troubleshooting sick plants with real people 21, local events and swaps 16. Zero interest in community 6.
- **Swaps:** 12 would never swap. 10 would only swap face to face, whatever the app offers.

## 11. What changed from the 35-response analysis

The earlier analysis (35 responses, May 22 to Sept 24) is the same file minus two responses. **R36 and R37 were added on Oct 16.** Both chose the new-plant-owner perspective, so unlike R35 (a florist), they speak to the MVP audience.

- **R36** (1 to 2 plants, plant-care confidence 1 of 5, light confidence 2): picked reminders, the Greenhouse, and forums as the three dealbreakers. Wants a Simple/Detailed toggle and the gentle nudge. Would delete over "ads or constant nothing alerts." Biggest problem to solve: "How do I take care of plants? I am very bad at them."
- **R37** (0 plants; waters a parent's plants during trips; coded "other"): picked reminders, plant ID, and AI diagnosis. Wants the Simple/Detailed toggle and the direct alert. Would delete over ads and text or fonts that aren't easy to see "for all ages." Biggest problem to solve: be accessible to all ages, with a high-accuracy scan.

| Count | 35 responses | 37 responses |
|---|---|---|
| Smart reminders (dealbreaker) | 26 (74%) | 28 (76%) |
| Plant ID camera | 19 (54%) | 20 (54%) |
| AI diagnosis | 17 (49%) | 18 (49%) |
| The Greenhouse | 7, 6th | 8, tied 4th |
| Community forums | 6, 7th | 7, 7th |
| Simple/Detailed toggle | 10 of 16 | 12 of 18 |
| Strict-new prefer the gentle nudge | 8 of 11 | 9 of 12 |
| Notification volume as a delete trigger | 11 | 12 |
| Ads as a delete trigger | 3 | 5 |
| Text or fonts hard to read (delete trigger) | 0 | 1 |
| Trust: explains why | 20 | 22 |
| Trust: expert-verified | 17 | 19 |
| Trust: shows a confidence score | 15 | 17 |
| Would use no AI features | 5 | 5 |
| "Hard to tell if AI-written" | 7 | 8 |

The top three keep their order, and their shares barely move. The Greenhouse rises from 6th to a three-way tie for 4th, on one vote. That's one more vote on a 37-person sample, not a trend. Neither response changes an MVP priority. Both agree with what the earlier 35 said: reminders first, gentle wording for strict-new owners, a text toggle, and no ads.

## Limits

- Self-report about hypothetical features. No behavior was observed.
- Convenience sample. Routing means the new-owner and collection blocks are 18 and 13 people, not 37.
- Some people picked more options than allowed. Their picks are counted as given and listed by the script.
- Delete triggers are hand-coded by one person. Change `DELETE_CODES` in the script to re-code them.
- Per [`../../product/confirmed-context.md`](../../product/confirmed-context.md), florist and experienced-collector answers must not decide MVP questions for new plant owners.
