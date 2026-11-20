# FloraGrove pricing and launch plan

Source: your draft v8 (2026-11-19), recorded here on 2026-11-20. Prices are starting hypotheses to test, not validated numbers. The app name is treated as FloraGrove, pending trademark clearance (see Flags).

How to read this file: **Decided** items are the ones your draft marks "Decided by you". **Recommended** items are the draft's own suggestions, not yet confirmed. **Open** items have no answer yet. Where the draft and the repo disagree, "Where this differs from the repo" says so; nothing was changed silently.

## Decided

- **Founding Member presale:** $29.99 one-time buys a year of Pro, starting the day the app launches on the App Store. **100 spots.** The founding price closes when the spots sell out or at App Store launch, whichever comes first. This replaces the earlier 90-day post-launch window, which would have overlapped with the presale price.
- **Loyalty price:** founders renew at **$29.99 a year** for as long as their subscription stays active, even when the public price is higher. A founder who cancels and returns after more than **30 days** pays the public price.
- **Friends and family** who convert at the founding price count toward the 100 spots.
- **Public price from App Store launch:** about $40 a year ($39.99).
- **Dates:**
  - Mon Nov 24: external TestFlight build submitted for Beta App Review.
  - **Dec 1:** friends and family start. The stranger presale opens the same day, with TestFlight access.
  - **Dec 15:** App Store launch target, with manual release.
  - **Jan 15, 2027:** refund deadline. Full refund if TestFlight or App Store delivery is missed.
- **Friends and family** get free access through **Jan 31, 2027**. Tie it to the account (a comp flag), not the TestFlight install, so it carries over to the App Store version.
- **Free vs Pro for the AI features (option B):**
  - Photo plant ID: **3 free lifetime IDs per account.** Pro is described as "plenty for everyday use", never "unlimited". The allowance is one config number.
  - Sick-plant diagnosis: **Pro only.** Open idea, untested: show what's wrong for free and gate the treatment plan and check-ins.
  - Reminders, care guidance and quiet hours stay free.
  - Why: a locked ID blocks new owners (confidence 1.9 out of 5 in the draft; see below) from adding a plant at all, scan cost is small, and ID is the organic-growth hook. It is easier to tighten later than to loosen. Revisit after TestFlight data.
- **Model:** Haiku 5.5 for plant ID and diagnosis. Validate on 50 to 100 real photos, including sick plants and bad light. If accuracy falls short, escalate to Sonnet only on low confidence or when the user taps "not right".

## Recommended (not yet confirmed)

| Item | Price / rule |
|---|---|
| Free | Reminders, care guidance, up to about 10 plants (cap undecided), 2 bouquets, **3 lifetime free plant IDs**. Never paywall mid-task |
| Pro monthly | **$4.99** from day one, no launch discount |
| Annual from App Store launch | **$39.99** (test against $29.99 later) |
| Founder renewal | **$29.99** through a founders-only product. Public price if lapsed more than 30 days |
| Lifetime | **$49.99** list |
| Trial | **14 days.** The clock starts at the first plant add or first paid feature, not install. Prefer a no-card "reverse trial" that drops to Free and keeps history |
| Collector tier (later) | About $9.99 a month or $59.99 a year (analytics, valuation report, household seats). Only after Pro has users and a fake-door test shows demand. A natural home for heavy AI users |
| Elite | Dropped for launch |
| Florist Pro | Parked until after the MVP |

## How the loyalty price works on the App Store

Researched 2026-11-19 from Apple docs and developer discussions. Not tested in your App Store Connect account.

- **Year one:** a comp flag on the founder's account in your own database, since they paid on your website. Do not sell Apple offer codes. Apple rejected apps for using their own promo codes to unlock paid features and told them to use Apple offer codes, and guideline 3.1.1 says vouchers redeemable for digital services can only be sold through in-app purchase. Apple offer codes also give only a free or discounted period of a set length, not a permanent price.
- **Year two onward (recommended):** a separate **founders-only $29.99 annual subscription product in its own subscription group**, shown in the app only to founders. The app enforces the 30-day rule by showing it only while founder status is active or lapsed 30 days or fewer. It is not needed for the Dec 15 submission. Build it before the first founder renewals and before friends and family reach Jan 31 and want to convert.
- **Caveats:**
  - Apple does not let you hide a product from the App Store product page.
  - Do not show a paywall to a founder who already has an active subscription (double-subscription risk across groups).
  - Say in App Review notes how founder pricing works.
- **Alternative (not recommended):** raise one product's price with "preserve current price for existing subscribers". Apple supports it, but it only protects people already subscribed through Apple. Founders pay through Stripe, so they would not be covered, and it can't enforce a 30-day lapse rule.
- **Unverified:** whether App Review accepts a founders-only product and a web-purchased year-one entitlement. The US storefront allows external purchase links per the sources found, but Apple's answer on this exact setup has not been seen.

## Spots display rule

With 100 spots and an organic audience, "100 of 100 left" looks empty. The sales page says "Limited to the first 100 founding members" until half are gone, then "N of 100 left". Both are true. The count is updated by hand and never faked. Built in `grove-sales/offer-copy.mjs` (`spotsLine`). The sales page is a draft in `grove-sales/` and is not deployed.

## Schedule gates

- **Fri Nov 20 evening:** first build uploaded to App Store Connect, to flush out signing and account problems.
- **Mon Nov 24:** TestFlight build submitted. If not, move strangers to Dec 8 before anything is public. Fallback for friends only: internal testers (up to 100 App Store Connect users, no review needed).
- **Dec 1 to 4:** build in-app purchases (public $39.99 annual and $4.99 monthly), create subscription products, write the store listing.
- **Fri Dec 4 (target) / Tue Dec 8 (latest):** submit to the App Store. If in-app purchase isn't working in the sandbox by Dec 4, move launch to the first week of January (reviews can run slower Dec 20 to 26) and tell founders the new date. The Jan 15 refund deadline still holds.
- Page copy says the App Store date is "targeted for". It never promises it.

## AI cost controls (recommended)

- A hard fair-use cap on Pro (starting point: about 30 scans a day and 300 a month), shown in the app, never blocking mid-task. Put the cap in the terms.
- Resize photos on the phone to about 1,024 px on the long edge before upload. The draft estimates about 2,460 tokens at full size against about 1,050; the formula is from memory and needs confirming on real calls.
- Don't call the AI for static content. Pre-generate care info per species once, and cache repeat results.
- Rate limits and one account per person, so the 3 free IDs are not an open endpoint.
- Log tokens and cost per call from the first TestFlight day.
- Confirm whether there is any chat or multi-photo feature. Chat costs more because each reply carries the conversation.

## App Store notes

- Subscriptions unlocked in the app must use in-app purchase (guideline 3.1.1). US storefront apps may also link to web checkout (3.1.1(a)), in addition to in-app purchase and not instead of it, per the sources found.
- First-submission review: Apple says 90% clear within 48 hours (average 1.5 days). Other trackers say 2 to 5 days for new apps, longer in peak season. About 23% of submissions were rejected in 2025. A rejection restarts the clock.
- Wrapper risk: a mostly-web app in a shell can fail "minimum functionality". Make sure native notifications and camera work. The `grove-mobile/` shell does not have native push yet.
- Disclose the AI photo processing. Strip location data from photos before upload.
- TestFlight builds expire 90 days after upload. A Nov 24 upload runs out about Feb 22.
- Apple's offer-code quota is up to 1,000,000 redemptions per app per quarter, per Apple's help page.

## Evidence (from the draft)

- **Competitor annual prices** cluster at $30 to $40: PictureThis $29.99 to $39.99, Planta $35.99 to $47.99, Greg about $29.99, Plant Parent $29.99, PlantIn $29.99 to $39.99. Blossom ($69.99 to $79.99) and Strava ($79.99) are the high end. Monthly: Plant Parent $4.99, Greg $3.99 to $6.99, Planta about $8 to $10, PlantIn $9.99. Lifetime where offered: $49.99 to $59.99.
- **Survey (draft's figures):** about 30 people, convenience sample. 12 chose one-time $29.99. Monthly picks were 5 "under $3", 5 "$3 to $5", 1 "$6 to $10", none higher. Lifetime share appears as 39%, 40%, 42% and 47% in different chats. Reminders were a top dealbreaker (74%). "Explains why" was the top AI-trust factor (63%). 13 new owners rated confidence keeping a plant alive at 1.9 out of 5. **These numbers differ from the raw sheet; see the next section.**
- **AI cost (assumptions, not measured):** about $0.0004 per ID and $0.0008 per diagnosis on Haiku 5.5, and about $0.008 and $0.015 on Sonnet 5.5. Per user per year on Haiku: typical about $0.08, engaged about $0.44, heavy about $1.31. On Sonnet: about $1.61, $8.39 and $25.55. Three free IDs per 1,000 free users is about $1.20 on Haiku and $24 on Sonnet. Verify prices in your Anthropic console.
- Friends-and-family feedback is a weak pricing signal, because people say yes to be kind. A paying friend is a stronger signal than a free one.
- **Strava lessons:** analytics there are a passive byproduct of a built network. Grove's depend on manual logging, so don't price off $79.99. Keep shareable assets free as the growth loop.

## Where this differs from the repo

Checked on 2026-11-20 against `docs/research/data/grove-concept-survey-2026-anonymized.csv`, `docs/research/findings/2026-grove-concept-survey.md`, `docs/product/scope-v1.md` and the code. The draft is left as sent above; these are the differences.

| Topic | Draft says | Repo says |
|---|---|---|
| Survey size | About 30 people | 37 responses |
| Confidence keeping a plant alive | 13 new owners, mean 1.9 | Findings doc: 18 in the new-owner block, mean 2.06. Raw sheet: the 12 who described themselves as new answered with mean 1.67 (about 1.7). The "13" matches a different question (light confidence, 13 of 14 strict-new, mean 2.38) |
| One-time lifetime purchase | 12 chose $29.99 one-time. Lifetime share 39%, 40%, 42% or 47% | 16 of 37 (43%) chose "one-time lifetime purchase (e.g., $29.99)" |
| Monthly picks | 5 under $3, 5 at $3 to $5, 1 at $6 to $10 | 6 under $3, 7 at $3 to $5, 1 at $6 to $10 |
| Photo diagnosis status | Pro only, treated as built | `scope-v1.md` lists it as **dormant**: an A/B test, off by default (`EXPERIMENT_HELP_DIAGNOSIS=off`), needing the Anthropic key. Plant ID by photo is listed as core |
| What the paid tier is | AI features (ID past the free allowance, diagnosis); collector tier later | `scope-v1.md` calls the home-wide light map the strongest paid candidate and "likely the paid tier" |
| Free tier limits | Up to about 10 plants (cap undecided), 2 bouquets, 3 lifetime IDs | Survey: 20 of 37 said a small collection (up to 5) should be free. The app has a free-tier bouquet limit and says "upgrade for unlimited bouquets" (`BouquetsPage.js`). The draft's rule is never to say "unlimited" for IDs on the sales page |
| Business model | Pricing decided (see Decided) | `confirmed-context.md` (last confirmed July 28, 2026) lists the business model, distribution and twelve-month objective as still unknown. `scope-v1.md` said "Pricing is undecided" until this update |
| Quote | "Help me easily keep plants alive. I'm very new!" | The survey answer reads "Helpe easily keep plants alive (eg when to water which plant and how much. I'm very new!)" |

## Build status

Updated 2026-11-20. Built in the code and covered by tests, but **not deployed and not tested end to end against a real database or the real model**:

- **Entitlements** (`grove-backend/entitlements.py`): Pro is a `tier` of pro or florist_pro, or a `pro_until` date still in the future, with a `pro_source` (`founder`, `friends_family` or `comp`). `GET /api/entitlements/me` reports it.
- **3 free photo IDs per account, for life** (`FREE_ID_ALLOWANCE`). Checked before the model is called. Only a confident identification uses one, so a blurry photo or a model failure never costs a new owner an ID. Pro accounts use none.
- **Sick-plant diagnosis is Pro only** (`DIAGNOSIS_REQUIRES_PRO`, default on). It is checked after the experiment arm, so while the A/B test is off nobody reaches it. **Before turning the A/B test on for free accounts, decide:** either set `DIAGNOSIS_REQUIRES_PRO=off` for the test, or accept that free accounts in the photo-check arm will be told it is a Pro feature.
- **Fair-use caps and rate limit** on every AI photo call (plant ID, diagnosis, room scan, bouquet ID): 30 a day and 300 a month (the plan's starting points, not decided) and 6 a minute (not in the plan; added as a guard). Room scan and bouquet ID have the caps but no free-ID allowance, because the plan doesn't cover them.
- **Granting Pro without a payment:** `grove-backend/scripts/grant_pro.py` (dry run by default; never shortens a running grant). Use it for friends and family (through Jan 31, 2027) and, by hand, for founders once their year's end date is known.
- **In the app:** a plain message when free IDs are used up or a cap is hit, with "Search by name" as the way forward; a "N free photo IDs left" line after a good identification; Pro-only wording in the photo check.
- **Indexes:** `ai_usage` gets a user-and-time index and expires records after 35 days (created at server start).

Still not built:

- In-app purchase, the public $39.99 and $4.99 products, and the founders-only product.
- Any upgrade screen. Today a person who runs out of free IDs is told what they can still do, not sold anything.
- Anything that grants founder Pro automatically after a Stripe payment. For now it is a manual script run.
- Native push (the `grove-mobile/` shell loads the web app only).
- The renewal reminder email for founders.
- A free plant cap (still undecided).

## Math

- Apple net at 15% (small-business program, check eligibility): $29.99 nets about $25.49, $39.99 about $33.99, and $4.99 monthly about $4.24.
- Stripe presale: about 2.9% plus $0.30 (about $1.17 on $29.99). The fee may not be returned on refunds.
- Refund exposure if delivery fails with all 100 spots sold: about $2,999 returned plus about $117 in unreturned Stripe fees.
- Loyalty price cost: about $10 a year per founder against the $39.99 public price, about $1,000 a year if all 100 renew.
- A monthly subscriber needs 6 months to equal $29.99 and 8 months to equal $39.99.

## Flags

- **Trademark:** FLORA is a live registered mark (reg #7444865, FloraSense Inc., classes 9 and 42) for plant-ID app software, and GROVE has live software marks. Not legal advice. Have an attorney clear "FloraGrove" before taking payments. The sales page includes a clause that founding memberships carry over if the name changes.
- **Delivery risk:** confirm an uploaded iOS build with working plant ID and diagnosis exists before the refund promise goes live.
- **Support load:** 100 founders each get a direct line to you. Set an expectation for response time.
- **App Review risk on the founder setup:** a web-purchased year one plus a founders-only product is unconfirmed with Apple. Put it in the review notes and keep a fallback (refund, or move founders to in-app purchase).

## Open items

- Is the stable build an uploaded iOS binary? The Pro grants, the 3-ID limit and the fair-use caps are now in the code (see Build status) but have not run against the real database or model. In-app purchase is not built.
- Renewal reminder email lead time for founders (suggest 30 days).
- Monthly income target (never answered). It sets how many tiers and subscribers are worth it.
- Free plant cap. Past chats say 5, 15 and unlimited.
- Raw survey sheet: lifetime share is 16 of 37 (43%) there. Settle which figure to use anywhere it's quoted.
- Entity choice (individual or LLC) for Stripe and for the Apple Developer account.
- Verify competitor prices in the US App Store.
- After TestFlight: test the free tier with 5 to 10 non-founders. Check whether they reach a first plant and return on day 2, then revisit the ID allowance.

## Sources

- https://apppricinglab.com/app/apple/1410126781 (Planta)
- https://www.stork.ai/en/picturethis (PictureThis)
- https://adapty.io/paywall-library/greg/ (Greg)
- https://wp-prod-new.adapty.io/paywall-library/plant-parent (Plant Parent)
- https://apppricinglab.com/iap/apple/1527399597 (PlantIn)
- https://apppricinglab.com/app/apple/1487453649 (Blossom)
- https://www.thepricer.org/how-much-does-strava-cost/ (Strava)
- https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes (offer codes)
- https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions (price changes)
- https://developer.apple.com/videos/play/tech-talks/110350 (preserve price for existing subscribers)
- https://developer.apple.com/forums/thread/771781 (rejection for own promo codes)
- https://developer.apple.com/forums/thread/697948 (legacy vs current subscription groups)
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/overview-of-testflight/ (TestFlight)
- https://www.macrumors.com/2024/12/02/app-store-review-times-holidays/ (holiday review times)
- https://axonbuild.com/blog/how-long-does-app-store-review-take/ (review times)
- https://superwall.com/blog/external-checkout-a-b-testing-and-trial-toggles-confirmed-apples-rules-for-ios (US external links)
- Earlier Grove chats in this project: Senior UX data analysis; Grove app feature gaps vs competitors; Refining a plant community problem statement
