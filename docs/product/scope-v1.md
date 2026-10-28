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
| **First run** | Short intro, account, zip (hardiness zone), four-question plan quiz, plan screen. See "Designer pushback" for the length of this flow |
| **Add a plant** | Species search, optional photo, pet-safety badge on every species |
| **Plant ID by photo** | Confidence in words, a "Why:" line, editable species, honest failure state. Needs the Anthropic key, added last before launch |
| **Today** | Due list with one step and its reason per plant, Simple / Detailed text, soil check then water, Water All with 8-second undo, "needs a check" wording, end-of-round summary |
| **Reminders** | Care check only, 1 a day (adjustable to 3), quiet hours on, never behind a paywall |
| **First-care moment** | The celebration after the first care log, with a "Tell a friend" button (share sheet, or copy link) |
| **Accessibility** | Zero critical or major WCAG findings, VoiceOver and 200% text pass on this path, labels, 12px minimum, 3:1 borders |

## Supporting

| Area | What v1 includes |
|---|---|
| **Learn** | Lessons with quizzes and sources (Plant Parent Reset, Plant ER, light lessons), Greenhouse species pages with RHS and ASPCA sources |
| **Plants tab** | Plant detail, archive with undo, rooms as a filter, Plants and Bouquets as separate segments (the switch only shows if you have bouquets) |
| **Pip** | Pip's note, weekly rhythm with the nudge off by default |
| **Journal and check-ins** | Memory journal, weekly check-ins |
| **Help my plant** | Points to the Plant ER lesson and states its limits plainly. No diagnosis |
| **Profile** | Settings, notifications, Simple / Detailed, pets |
| **Business** | Free, no ads, reminders free, stated in the upgrade copy. Pricing is undecided |

## Dormant

| Area | Why it waits | What brings it back |
|---|---|---|
| **Community** (feed, Groves, swaps, saved cuttings, kudos) | Needs people to fill it, and it needs moderation tools (report, block) for user posts. Survey: 7th of the dealbreakers, 6 of 37 have zero interest | The trigger below. Flag: `REACT_APP_COMMUNITY=on` |
| **Badges and challenges** | The strategy says no gamification as the core loop | A decision that they are optional extras |
| **Room and light map** | Half-built; the lesson and prompt cover the need for now. Top visuals pick (29 of 37) and the strongest paid candidate | Finish it as a whole feature, likely the paid tier |
| **AI diagnosis** | #3 dealbreaker (18 of 37) and the most trusted AI feature, but needs its own decision and study | Study and decision after Study 001 |
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

## Designer pushback, and what I did with it

- **Too many surfaces.** Badges, challenges, rooms and the florist pages were live. Dormant now means unlinked and flagged, but only community is actually flagged in code. The rest still need hiding (see below).
- **Navigation.** The tab bar is now Today, Plants, Learn. Pip's nook and Profile have no obvious door, and Learn mixes Greenhouse, lessons and guilds. Decide the navigation next.
- **Onboarding length.** About ten steps before value, which conflicts with "no account wall before value." Proposal: one intro slide, account after the first plant. Not changed yet.
- **Half-built features.** Room map and Help my plant are either finished or pointed at a lesson that works.
- **Share placement.** The share button moved from Profile (never seen) to the first-care moment.

## Open decisions (yours)

1. Anthropic key: you decided to add it last. Plant ID is the center of Study 001, so decide whether the study waits for it or tests species search as the entry path.
2. Navigation: what the third and fourth doors are for Pip and Profile.
3. Onboarding: cut to one slide and move the account step after the first plant?
4. The community trigger numbers above.
5. Operational definition of "new plant owner" for recruiting, and who makes the continue, revise or pause call after Study 001.
6. Business model and the twelve-month objective.
