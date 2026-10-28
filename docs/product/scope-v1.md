# FloraGrove scope: v1

Date: 2026-10-28 | Status: draft for your review

Built from the repo as it stands, the confirmed audience order (`confirmed-context.md`), the MVP strategy, the 37-response survey and the Pip room spec. "Built" means it exists in the code, not that it is validated: no research sessions have run yet.

**The v1 rule.** v1 serves new plant owners and answers one question: what does this plant need today, and why? Scope is sorted by the path Study 001 measures: set up, add a plant, act on Today, recover from a mistake. A feature is judged by whether it helps that path.

Three tiers:
- **Core.** The first-care path. It has to be excellent, and it is what we test.
- **Supporting.** Present and working, but not promoted. It doesn't compete with the core for attention.
- **Dormant.** Built or planned, hidden or not started. The code stays; nothing in the app points to it.

## Core

| Area | What v1 includes |
|---|---|
| **First run** | Short intro, account, hemisphere (sets the season), four-question plan quiz, plan screen. The zip and hardiness zone step is dormant. See "Designer pushback" for the length of this flow |
| **Add a plant** | Species search, optional photo, pet-safety badge on every species |
| **Plant ID by photo** | Confidence in words, a "Why:" line, editable species, honest failure state. Needs the Anthropic key, added last before launch |
| **Help my plant** | Symptom triage: pick what you see, do the soil check first, get the likely causes and quick checks. Rule-based, not AI, and it says so. This is v1's answer to "my plant looks sick" |
| **Light fit** | The window-light lesson (hand-shadow test, direct vs indirect, curtain, pick your window), the light prompt, and a plain "this spot suits / doesn't suit this plant" check. Light is the most common cause of a struggling plant, and new owners are least sure about it |
| **Today** | Due list with one step and its reason per plant, Simple / Detailed text, soil check then water, Water All with 8-second undo, "needs a check" wording, end-of-round summary |
| **Reminders** | Care check only, 1 a day (adjustable to 3), quiet hours on, never behind a paywall |
| **First-care moment** | The celebration after the first care log, with a "Tell a friend" button (share sheet, or copy link) |
| **Accessibility** | Zero critical or major WCAG findings, VoiceOver and 200% text pass on this path, labels, 12px minimum, 3:1 borders |

## Supporting

| Area | What v1 includes |
|---|---|
| **Learn** | Lessons with quizzes and sources (Plant Parent Reset, Plant ER, light lessons), Greenhouse species pages with RHS and ASPCA sources. Themed guilds are dormant |
| **Plants tab** | Plant detail, archive with undo, rooms as a filter, Plants and Bouquets as separate segments (the switch only shows if you have bouquets) |
| **Pip** | Pip's note, weekly rhythm with the nudge off by default |
| **Journal and check-ins** | Memory journal, weekly check-ins |
| **Profile** | Settings, notifications, Simple / Detailed, pets |
| **Business** | Free, no ads, reminders free, stated in the upgrade copy. Pricing is undecided |

## Dormant

| Area | Why it waits | What brings it back |
|---|---|---|
| **Community** (feed, Groves, swaps, saved cuttings, kudos) | Needs people to fill it, and it needs moderation tools (report, block) for user posts. Survey: 7th of the dealbreakers, 6 of 37 have zero interest | The trigger below. Flag: `REACT_APP_COMMUNITY=on` |
| **Badges and challenges** | The strategy says no gamification as the core loop | A decision that they are optional extras |
| **Home-wide light map** | The per-spot light lesson and check are in v1. A map of every window and room, light meters and glass types are the spec's own non-goals. Strongest paid candidate | Finish it as a whole feature, likely the paid tier |
| **Photo AI diagnosis** | Built as an A/B test, off by default (`EXPERIMENT_HELP_DIAGNOSIS=off`). It's the #3 dealbreaker (18 of 37), but a photo can't show soil moisture or roots, where most houseplant problems start, so a confident photo answer risks sending someone to water a plant that is already overwatered. The test arm asks the soil question first, shows confidence in words, and has a one-tap "None of these fit". Needs the Anthropic key | Turn it on with `split` once the key is in. Decide what result ships before you look at the numbers (see "Photo check A/B test") |
| **Zip and hardiness zone** | Zone describes outdoor winter lows and changes nothing about indoor care. Hemisphere and month already set the season. Flag: `REACT_APP_ZIP_ZONE=on` | Outdoor or patio plants, frost advice, or recommending species by region |
| **Themed guilds** | A second way to browse before a new owner has used the first. Flag: `REACT_APP_GUILDS=on` | After Greenhouse search is shown to be used |
| **Florists** (dashboard, QR care pages, public bouquet page work) | Florist n=3, a later audience | A florist discovery study. Cheap safety fixes (pet line, "vase life varies") are worth doing anyway |
| **Collector features** (growth timeline, wishlist, bulk-log polish, analytics) | Collectors are the first expansion audience | A collector study |
| **Native iPhone app** | Planned for December. Brings push, widgets, camera quality | Build decision |
| **Android, localization** | Not needed to prove v1 | After v1 results |

## Growth loops (v1)

Organic community forms outside the app first, so v1 gives people ways to carry FloraGrove there:

1. **Tell a friend** on the first-care celebration. Built: opens the share sheet, or copies the link where there is none. It points to floragrove.app.
2. **Founder-run space for the waitlist.** A small Discord or newsletter, run by you. Not built; it's a decision, not code.
3. **Shareable plant card** ("my plant's first month," from the memory journal). Not built; it needs a design pass, so it is the next candidate.

**Trigger to bring community in-app.** Set the numbers before you look at them. A starting proposal, to change as you see fit: bring it back when weekly active users reach 500, at least 30 people have asked for it in feedback or in your waitlist space, and you have a way to review reports within a day. Until all three are true, it stays dormant.

## Photo check A/B test

- **Arms.** Control is the symptom list. Treatment is the same list plus "Check with a photo." A person stays in their arm (assigned by a stable hash of their user id).
- **Modes.** `EXPERIMENT_HELP_DIAGNOSIS` is `off` (default, everyone sees control), `split` (50/50) or `on` (everyone sees the photo check, for internal testing). Without the Anthropic key nobody is put in the photo check, so a missing key can't make it look worse.
- **Guardrails, enforced on the server.** The photo can't be sent without a soil answer ("dry," "slightly damp," "wet"). "I haven't checked" never calls the model. Control users get a 403 from the endpoint.
- **Events recorded** (`experiment_events`): `exposure`, `triage_symptom_picked`, `photo_check_started`, `photo_check_result` (with confidence and soil answer), `photo_check_none_fit`, `photo_check_failed`.
- **Honest limits.** With a few hundred users this won't reach statistical significance. Read it as direction, alongside Study 001 sessions. Write down before you start what would make you ship it, for example: more people reach a next step in the photo arm, "None of these fit" stays low, and no one in either arm reports watering a plant after a "wet" soil answer.

## Designer pushback, and what I did with it

- **Too many surfaces.** Badges, challenges, home-wide rooms and the florist pages were live. Community, guilds and the zip step are now flagged off in code. Badges, challenges and the florist pages are still reachable and need hiding.
- **Navigation.** The tab bar is now Today, Plants, Learn. Pip's nook and Profile have no obvious door, and Learn mixes Greenhouse, lessons and guilds. Decide the navigation next.
- **Onboarding length.** About ten steps before value, which conflicts with "no account wall before value." The zip step is now out. Still to decide: one intro slide, and the account after the first plant.
- **Half-built features.** Room map and Help my plant are either finished or pointed at a lesson that works.
- **Share placement.** The share button moved from Profile (never seen) to the first-care moment.

## Open decisions (yours)

1. Anthropic key: you decided to add it last. Plant ID is the center of Study 001, so decide whether the study waits for it or tests species search as the entry path.
2. Navigation: what the third and fourth doors are for Pip and Profile.
3. Onboarding: cut to one intro slide and move the account step after the first plant?
4. The community trigger numbers above.
5. Operational definition of "new plant owner" for recruiting, and who makes the continue, revise or pause call after Study 001.
6. Business model and the twelve-month objective.
