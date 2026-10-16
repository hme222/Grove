# Proposed app changes from the 35-response survey

Proposals only. **No app code was changed.** Evidence comes from [`2026-grove-concept-survey.md`](2026-grove-concept-survey.md), and every count can be reproduced with [`../scripts/survey_stats.py`](../scripts/survey_stats.py). File paths are relative to the repo root. Line numbers are from `feat/lessons-quiz-soil-test` at `98278a8`.

**Ranking:** strongest evidence first. That means how many people, whether it came up in more than one question or audience, and whether it's tied to a delete or churn answer. One exception is flagged below: #6 is a safety bug and should be fixed first whatever its rank.

**Effort:** S = copy or default change, under half a day. M = a small component or preference plus wiring, 1 to 3 days. L = a new flow or backend work.

## Summary

| # | Proposal | Evidence | Effort |
|---|---|---|---|
| 1 | Cap notifications and make quieter defaults | 11/35 would delete over notification volume; reminders are the #1 dealbreaker (26/35) | S defaults, M cap |
| 2 | Turn "streak at risk" off by default and drop the guilt framing | 11/13 would stop if it feels like a chore; 11/35 notification delete trigger | S |
| 3 | Show *why* and a readable confidence on every AI suggestion | Explains why 20/35, confidence 15/35, AI-bots frustration 7/35 | S |
| 4 | Keep bouquets out of the plant collection grid | 24/35 don't want them mixed in (16 separate tab, 8 not at all) vs 5 mixed | M |
| 5 | Add a Simple/Detailed toggle for care text | 10/16 new-owner block (7/11 strict-new); 3/35 delete over wordiness | M |
| 6 | **Fix "Pet-safe" fallback and show toxicity wherever a species appears** (safety: do first) | 4/11 strict-new, 5/16 overall; 3/3 florists; 10/35 want placement alerts | S |
| 7 | Gentle overdue wording by default | Strict-new 8/11 prefer the gentle nudge | S |
| 8 | Add undo, and an optional soil check, to "Water All" | 9/13 prefer one-tap bulk; 7/13 would stop if logging one by one | S |
| 9 | Let users choose how often the daily trivia card appears | 15/32 don't want it daily as-is | S/M |
| 10 | Soften the vase-life countdown and add a "varies" disclaimer | 6/35 find it stressful (2/3 florists); 2/3 florists want a disclaimer | S |
| 11 | Make community optional in onboarding | Forums 6/35 dealbreaker; 6/35 zero interest; R05 deletes over required community | S |
| 12 | Upgrade copy: never gate reminders, say "no ads," lifetime option | 30/35 want reminders free; 15/35 prefer lifetime; ads 3 and paywall 2 delete triggers | S copy, business decision |
| 13 | Public bouquet page: pet warning, disclaimer, florist contact, AI label | Florists n=3 **(small n)**: pet 3/3, disclaimer 2/3, reorder or contact 2/3 | M |

## Details

### 1. Cap notifications and make quieter defaults

- **Where:** `grove-backend/server.py:3729-3746` (`DEFAULT_NOTIFICATION_PREFS`). Settings UI: `grove-frontend/src/pages/NotificationPreferencesPage.js:8-36`. Empty-state copy: `grove-frontend/src/components/NotificationBell.js:200`.
- **Current:**
  - 10 of 11 push types default to **on**. Only `push_kudos_received` is off. The ones on include `push_streak_at_risk`, `push_streak_milestone`, `push_bloom_hour` ("Daily moments when your grove is blooming"), and `push_grove_challenge`.
  - `quiet_hours_enabled` defaults to `False`.
  - There's no daily cap anywhere.
  - No sender for `care_due` or `care_overdue` exists yet: the type keys are only in the preferences. So the defaults can be fixed now, before anything starts sending.
- **Proposed:**
  - Add a **daily cap**: at most one care notification a day that bundles every due plant ("3 plants could use a check today"). Make the cap a visible setting in the preferences page: 1/day (default), up to 3/day, off.
  - Default to **off**: streak at risk, streak milestones, bloom hour, Grove challenges.
  - Default quiet hours to **on** (22:00 to 08:00 is already the stored default window).
  - Matches the Pip spec's own rule: "Any other notification is optional and capped by user settings."
- **Evidence:**
  - 11/35 named notification or reminder volume as an instant-delete trigger. It's the largest coded theme.
  - R06 named a limit of "more than one notification a day" and R14 "more than 3 notifications/daily."
  - At the same time, reminders are the #1 dealbreaker (26/35) and the top beginner feature (8/16). So the fix is to cap them, not remove them.
- **Effort:** S for defaults. M for the cap and bundling, which belongs in the sender when it's built.

### 2. Turn "streak at risk" off by default and drop the guilt framing

- **Where:** `NotificationPreferencesPage.js:16`, help text "Heads-up before your streak breaks at midnight." Backend default: `server.py:3732`. Contradicts `grove-frontend/src/components/Onboarding.js:21`: "Grove does not gamify your plants."
- **Current:** the streak-loss warning is on by default, and its copy warns about a streak breaking.
- **Proposed:** default it to off. If it stays at all, reword it around the plant, not the streak ("Your pothos is due for a soil check"). This closes the tension the Pip spec already logged in its open questions (section 12).
- **Evidence:** 11/13 collectors would stop updating if the app "feels like an administrative chore." The 11/35 notification delete trigger. R01: "Plant care should feel peaceful and wholesome, not stressful."
- **Effort:** S.

### 3. Show *why* and a readable confidence on every AI suggestion

- **Where:**
  - `grove-frontend/src/pages/PlantDetailPage.js:339-345` (AI schedule card). Line 343 renders `Confidence: {aiSchedule.confidence}` in `text-[#D3C9B8]` on `bg-[#EAF3DE]`, which is nearly invisible.
  - `grove-frontend/src/pages/BouquetDetailPage.js:221-223`: flower `% confident` in `#D3C9B8` on `#FBEAF0`.
  - `grove-frontend/src/pages/PlantIdentifyScreen.js:230`: confidence shown, no reason.
- **Current:** the schedule card shows a reason (`aiSchedule.reason`, line 342), but confidence is too faint to read. Plant ID shows a percentage with no "why." Bouquet flower confidence is too faint to read.
- **Proposed:**
  - Label the reason "Why:" and put it first.
  - Make confidence readable (use the body text token) and plain ("High confidence" or "Not sure, please check").
  - On plant ID, add one line on what the match is based on, plus a reference photo if the API returns one.
  - Under each AI care suggestion, add a short "Check the soil before you water" line. That ties into the soil-test lesson already being built.
- **Evidence:**
  - Trust builders (of 35): explains why 20, expert-verified 17, confidence score 15, photo examples 13, cited sources 12, check the soil first 5.
  - 7/35 say the biggest frustration is not knowing if info is AI-written.
  - Study 001 threshold: "At least 4 of 5 recognize that AI output can be edited or rejected."
- **Effort:** S. The contrast and labels are copy and class changes. The reference photo depends on the API.

### 4. Keep bouquets out of the plant collection grid

- **Where:** `grove-frontend/src/pages/CollectionPage.js:120` (count includes bouquets) and `:128-131` (combined list, "plants then bouquets"). `grove-frontend/src/components/BottomNav.js:6` puts `/bouquets` under the Collection tab.
- **Current:** bouquets render as tiles in the same grid as houseplants and count toward the collection total.
- **Proposed:** give bouquets their own segment, a "Bouquets" toggle at the top of Collection or a separate list, and leave them out of the plant count. Bouquet care, the vase-life countdown, and the florist page all stay as they are.
- **Evidence:** 16/35 want bouquets "in a strictly separate, dedicated tab." 8/35 don't want bouquets in the app at all. Only 5/35 want them mixed into the collection.
- **Effort:** M.

### 5. Add a Simple/Detailed toggle for care text

- **Where:** no such setting exists. Care reasons render at `grove-frontend/src/pages/CarePage.js:251-257` (`status_reason`, italic, clamped to two lines). AI reason at `PlantDetailPage.js:342`. Bouquet care plan at `BouquetDetailPage.js:256-280`.
- **Current:** one fixed level of explanation.
- **Proposed:** add a "Care tips: Simple / Detailed" preference to Profile or the first-run quiz. Simple shows the step plus one reason. Detailed adds the full reasoning, symptoms to look for, and sources. Prototype it in Study 001 before building it fully.
- **Evidence:** 10/16 in the new-owner block chose "Let me toggle between Simple and Detailed" (7 of 11 strict-new). 3/35 named wordy or complicated explanations as a delete trigger (R07, R21, R30). 9/32 say online advice is buried in long posts.
- **Effort:** M.

### 6. Fix the "Pet-safe" fallback and show toxicity wherever a species appears (do first)

- **Where:**
  - `grove-frontend/src/pages/SpeciesDetailPage.js:150-151`: `TOXICITY_INFO[toxKey] || TOXICITY_INFO.non_toxic`.
  - `grove-frontend/src/pages/AddPlantPage.js:215`: raw `sp.toxicity` value in green (`#639922`) for every value, including "toxic".
  - `PlantIdentifyScreen.js:227-233` and `PlantDetailPage.js` show no toxicity at all.
- **Current:** a species with a missing or unrecognized toxicity value is labeled **"Pet-safe."** All seeded entries checked in `grove-backend/*.py` currently use valid values (mild, non_toxic, non-toxic, toxic), so this is latent today. But any species added later without a value would be shown as pet-safe. On Add Plant, "toxic" is shown in the same green as "non_toxic."
- **Proposed:**
  - Fall back to "Toxicity unknown: keep away from pets until checked" (neutral style).
  - Reuse `TOXICITY_INFO` labels, colors, and icons on Add Plant, so meaning doesn't rest on color alone.
  - Add the same chip to the ID review screen and the plant detail page.
- **Evidence:**
  - 4 of 11 strict-new respondents who saw the stressor question chose pet safety (5 of 16 overall).
  - 3/3 florists say customers call about pet toxicity **(small n)**.
  - 10/35 want unsafe-placement alerts for pets on the room map.
  - Rank is moderate on counts. It's first in effort-to-risk because a wrong "Pet-safe" label can cause harm.
- **Effort:** S.

### 7. Gentle overdue wording by default

- **Where:** `CarePage.js:152-162` (`getDueLabel`: "Overdue 3 days", "Overdue today"); `CarePage.js:20-24` (filter labeled "Urgent"); `NotificationPreferencesPage.js:15` ("When a plant goes multiple days overdue").
- **Current:** direct, deadline language, plus pink "urgent" styling.
- **Proposed:** default to a check-in framing: "Check the soil today, last watered 9 days ago." Rename the "Urgent" filter "Check first." Offer the direct style ("5 days past its usual schedule") as an option, since everyone outside the strict-new group who answered chose direct.
- **Evidence:** overall 8 gentle vs 8 direct (n=16). **Strict-new respondents chose gentle 8 of 11.** The 5 others all chose direct **(small n)**. Gentle copy also matches the soil-check-first flow being built.
- **Effort:** S.

### 8. Add undo, and an optional soil check, to "Water All"

- **Where:** `CarePage.js:106-126` (`handleWaterAll`, toast "Watered N plants" at line 111) and the button at `:171-182`.
- **Current:** one tap logs water for every due plant. No confirmation, no undo.
- **Proposed:** keep the one-tap flow. Add an **Undo** action to the success toast. Optionally add a one-line "Checked the soil?" step, which answers the Pip spec's open question about a soil check before the bulk round.
- **Evidence:** 9/13 collectors prefer one-tap bulk logging. 7/13 would stop updating if they had to log plants one by one. 3/35 named logging friction as a delete trigger. The undo also covers mistaken taps, which Study 001 tests as recovery.
- **Effort:** S. It needs a bulk-undo endpoint or reuse of the delete-log call.

### 9. Let users choose how often the daily trivia card appears

- **Where:** `grove-frontend/src/components/DailyTriviaCard.js:7-19` ("shared community-wide for the day"; dismiss only for the day). Rendered at `CarePage.js:304`.
- **Current:** a new card every day on Care, the same for everyone. It can only be dismissed one day at a time.
- **Proposed:** add "Show tips: daily / a few times a week / off," and favor tips about plants the user owns. Apply the same rule to the Pip spec's daily "Pip's note."
- **Evidence:** of 32, 12 love it daily, but 12 want it "occasionally, but definitely not every day," 5 only if personalized to their plants, and 3 would ignore it. That's 15/32 against daily as it is.
- **Effort:** S/M.

### 10. Soften the vase-life countdown and add a "varies" disclaimer

- **Where:** `BouquetDetailPage.js:164-168` (pill "Day 4 / 7"); `BouquetDetailPage.js:256-259` ("7 days expected vase life"); `CollectionPage.js:380` ("Past vase life", "Ends today").
- **Current:** an explicit countdown and a hard expiry label, with no disclaimer.
- **Proposed:**
  - Show a range with a qualifier: "Usually lasts 5 to 7 days. Varies with room and water."
  - Replace "Past vase life" with neutral copy, such as "Still going."
  - Let people hide the countdown.
- **Evidence:** 14/35 found it helpful, 15 neutral, 6 stressful. Strict-new: helpful 7, neutral 4, stressful 2. Florists: stressful 2 of 3. 2/3 florists want a "vase life varies" disclaimer **(small n)**. R26 wrote that stem life depends on care before the bouquet is made, so AI "would not be accurate in determining the stem life."
- **Effort:** S.

### 11. Make community optional in onboarding

- **Where:** `Onboarding.js:34-38` ("Learn from other growers … At day 7, the feed unlocks").
- **Current:** new-owner onboarding presents the community feed as part of the core path.
- **Proposed:** replace this screen with a care-first one, or reword it as optional ("If you want, you can join a grove later"). Study 001 already keeps community out of the MVP test.
- **Evidence:** forums got 6/35 dealbreaker votes (#7). 6/35 have "zero interest in social features inside a utility app." R05 would delete over "required community building." The people who do want community mainly want help with sick plants (19/35).
- **Effort:** S.

### 12. Upgrade copy: never gate reminders, say "no ads," offer lifetime

- **Where:**
  - `grove-frontend/src/pages/ProfilePage.js:236-238`: "Free tier: 15 plants, 2 active bouquets, basic care. Upgrade for unlimited plants, AI biographies, and advanced analytics."
  - `grove-frontend/src/pages/CareGrowthPage.js:134`: "Unlock … on a Pro plan."
  - `grove-frontend/src/pages/BouquetsPage.js:95`.
- **Current:** the upsell leads with AI biographies. There's no statement about ads (no ads were found in the frontend). There's no lifetime option.
- **Proposed** (copy now, pricing later):
  - State that reminders and basic care stay free and that there are no ads.
  - Lead the upsell with unlimited plants and the light/room tools, which are the most-picked paid features.
  - Drop AI biographies as a headline benefit.
  - Put a one-time purchase option on the table for the monetization decision.
  - Never interrupt a flow in progress with a paywall.
- **Evidence:**
  - Basic reminders should be free: 30/35.
  - 15/35 prefer a one-time lifetime purchase, 7 free only, 13 a monthly price.
  - Would pay for: unlimited collection 17, room/light map 16.
  - Only 4/35 would trust an AI plant biography.
  - Delete triggers: ads 3, paywall or price 2 (R19: "a pay wall in the middle of progress").
- **Effort:** S for copy. Pricing is a founder decision, and the Pip spec says it needs its own review.

### 13. Public bouquet page: pet warning, disclaimer, florist contact, AI label (small n)

- **Where:** `grove-frontend/src/pages/PublicBouquetPage.js`:
  - `:50-58`: Grove logo leads, studio name in small text.
  - `:103-125`: AI care plan published as "Care Instructions" with no label.
  - `:129-134`: the only call to action is "Track this bouquet in Grove" (`/register`).
  - `:137-141`: footer describes Grove swaps.
  - Florist side: `BouquetDetailPage.js:256-280` has no way to edit the care plan before sharing (share at `:102-104`).
- **Current:** no pet-toxicity section, no vase-life disclaimer, no florist reorder or contact button. AI text goes to customers unedited and unlabeled.
- **Proposed:**
  - Add a pet-toxicity line per flower.
  - Add a "Vase life varies by environment" disclaimer.
  - Add an optional florist "Reorder / contact" button, and put the studio name first.
  - Let the florist edit the care plan before sharing, or switch to standard checklist steps with no AI text.
- **Evidence (florists, n=3, small n):** pet warnings 3/3, disclaimer 2/3, reorder or contact 2/3, branding 2/3, short 2 to 3 bullet checklist 2/3. On AI text, 3/3 want either human control (edit, templates, AI off) or no AI at all. R35 (the Sept 24 response) asked for exactly this page. QR usefulness was rated 2, 2, and 5, and 21/35 overall would not use florist tools.
- **Caution:** florists are a later audience in [`docs/product/confirmed-context.md`](../../product/confirmed-context.md). Do the cheap safety items (pet line, disclaimer). Hold the rest for a florist discovery study.
- **Effort:** M.

## Checked and left alone

- **Quick view of due plants:** R03 would delete without one. It already exists: Care Today and the status dots (`grove-frontend/src/constants/tooltips.js:44`).
- **30-day AI schedule review banner** (`CarePage.js:420-445`): already prompts users to review AI cadence, which matches "override and edit" (AI schedule mean 4.15, n=13). Keep it.
- **Low-confidence ID path** (`PlantIdentifyScreen.js:57-58`, threshold 0.7, editable fields): matches the trust findings. The only change is #3 above.
- **Bulk actions on Collection** (`CollectionPage.js:16-25`, warning at 20 plants): matches the bulk-logging preference.
