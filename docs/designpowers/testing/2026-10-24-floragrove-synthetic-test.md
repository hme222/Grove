# Synthetic user test: FloraGrove information architecture and layout

**Date:** 2026-10-24 | **Build:** live app at commit `d55a00a` (Today home, Plants / Learn / Community tabs, rooms with light, Help my plant, search, one Pip card)
**Personas:** the 10 in `docs/designpowers/personas/2026-10-24-floragrove-personas.md`
**Method:** I walked each persona through the live app at iPhone width, using what the screens actually show, the code, and measurements. Nothing here is a real person's reaction. `?` means I could not verify it without a real device or screen reader.

## Summary
The new structure works for the basics: everyone can find Today, add a plant by name, and reach plain-language help. The main gaps are about **tone, naming, scale and a few missing paths**, not navigation depth. The biggest are: every plant on Today is alarm-pink and "past schedule" (Maya, Priya, Aaliyah), the names Today / Today / Care stack up (Luis, Grace, Priya), and type does not scale (Grace, Tom). Pet safety and reminders are hard to reach for the two people who care most (Dev, Sam). Screen reader use of the first-run welcome is unverified.

## Tasks
T1 get set up and add a first plant · T2 see what to do today and log care · T3 check whether a spot suits a plant · T4 a plant looks wrong · T5 is this safe for my pet or child · T6 learn something · T7 control reminders · T8 keep a photo memory

## Scenarios (two per persona, abbreviated)

**Maya (anxious beginner).** *On the subway, she opens the app to see if anything needs doing.* Today opens as home: good. She sees four cards, all pink, each saying "Check-in time · N days past schedule." She feels behind, though the wording is gentle. ⚠. *At home she is unsure the living room is bright enough for Rudy.* Plants → Rooms → "Medium" → "A little dim for Rudy, which likes bright, indirect light." Clear and useful. ✓, but she has to know Rooms is behind a chip on Plants.

**Dev (dog owner, 30 seconds a day).** *He just got a fiddle-leaf fig and wonders if it's safe for the dog.* Add plant → Search by name shows "Mildly toxic" in the list: ✓ for plants in the guide. A plant not in the guide goes to "Or add custom plant," which has no safety info and the plant page says "Pet safety unknown": ⚠. *He wants fewer pings.* Reminders live in Profile → Notification Settings, three taps from Today, and nothing asks him at setup: ⚠.

**Grace (larger text, new to apps).** *She opens Today and wants to know what "Care" and "Growth" at the top mean.* The tab says Today, the title says Today, the sub-tab says Care. She is unsure which she is on: ⚠. 172 text sizes in the code are fixed in pixels, so they will not follow her text-size setting: ⚠ (not verified on a device).

**Luis (second-language reader, cacti).** *He wants to add his jade plant and a barrel cactus.* Jade is in the guide. Cactus is not, so he adds it as custom with no light or care defaults: ⚠. *He reads "Check-in time · 5 days past schedule" and "Pip."* The phrase is gentle but figurative, and Pip is never explained: ⚠.

**Priya (ADHD).** *She opens Today to log one thing.* Header, search bar, filter chips, four cards, a "Something look off?" card, then a "From Pip" card: lots to scan, but the order is right (plants first): ⚠ for density. *She wants to ignore Pip today.* Pip is below the list and can be scrolled past: ✓.

**Marcus (tremor).** *He taps Log care on a card.* The button is large but the ✓ beside it is 36px and the Water All button is shorter than 44px; 11 controls on Today are under 44px: ⚠. *He wants to turn a reminder off.* The switches are 44 wide and 24 tall: ⚠.

**Hannah (VoiceOver).** *She adds her first succulent.* Plant tiles now announce status, pressed states are exposed on chips, dialogs trap focus: ✓ in the code. The welcome screen is a custom drawn canvas and I could not verify what VoiceOver reads: `?`.

**Tom (bouquets).** *He wants to track the roses his granddaughter sent.* Plants shows a grid that assumes he owns plants. Bouquets is a segment that only appears once one exists, and creating one means going through Profile → Bouquets: ⚠, and there is no first-run path for a bouquet-only owner.

**Aaliyah (dorm, budget, patchy data).** *First open of the day on poor Wi-Fi.* The free server can take about a minute to wake after idle; the app shows a spinner but no explanation: ⚠. *She wants a plant for a low-light room.* Rooms → "Low" works, and nothing is paywalled in what she touched: ✓.

**Sam (minding mum's plants, stress case).** *A plant's leaves are drooping and mum lands in two days.* "Something look off?" on Today → "Drooping or wilting" → "Start here: Thirsty." Sam waters an already wet pot: ⚠ (the check wording is right, the order is not). Sam also has no way to say these plants are someone else's: ⚠.

## Barrier matrix

| Task | Maya | Dev | Grace | Luis | Priya | Marcus | Hannah | Tom | Aaliyah | Sam |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 set up | ⚠ intro | ⚠ intro | ⚠ jargon | ⚠ no cactus | ⚠ intro | ⚠ chips | ? welcome | ⚠ no bouquet path | ⚠ wake-up wait | ⚠ one at a time |
| T2 today | ⚠ pink | ⚠ pink | ⚠ names, text | ⚠ idiom | ⚠ density | ⚠ targets | ✓ | ✓ | ✓ | ⚠ glare |
| T3 light | ✓ | ✓ | ⚠ text | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| T4 sick plant | ⚠ order | ⚠ order | ⚠ text | ⚠ idiom | ✓ | ✓ | ✓ | ⚠ order | ✓ | ⚠ order |
| T5 pet safety | ✓ | ⚠ custom | ✓ | ⚠ custom | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠ custom |
| T6 learn | ✓ | ✓ | ⚠ text | ⚠ jargon | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| T7 reminders | ✓ | ⚠ buried | ⚠ text | ✓ | ⚠ buried | ⚠ switch | ✓ | ✓ | ✓ | ✓ |
| T8 journal | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠ upload | ✓ | ⚠ no flowers | ⚠ big photos | ✓ |

## Cross-persona patterns
- **Universal barriers (2+ personas):** the pink, past-schedule tone on Today; Today / Today / Care naming; fixed-pixel text; the "Thirsty first" order in Help my plant; no safety or light data for plants outside the guide.
- **Friction hotspots:** the top of Today (title, tab and sub-tab collision, then search crowding the first card); the add-plant path for anything not in the 25-species guide; reaching reminder settings.
- **Emotional pattern:** guilt on Today (Maya, Priya), uncertainty about what is safe (Dev, Sam), and being left out (Tom, who owns no "plants").

## Findings

### Major
1. **Every plant on Today is pink and "past schedule."** Maya, Priya, Dev, Aaliyah. The calm-by-default principle says no alarm unless it is one. → Colour only the one or two most overdue; use a neutral card for the rest; say "Last watered 5 days ago" instead of "past schedule"; make Water All the single clear action.
2. **Three names for one place:** tab Today, title Today, sub-tab Care, and a hidden Growth tab. Luis, Grace, Priya. → Title the page by the day ("Today") and drop the Care sub-tab, or rename sub-tabs "To do" and "Progress."
3. **Type does not scale.** 172 fixed-pixel text sizes and a fixed 17px body. Grace, Tom, anyone using larger text. → Convert to rem-based sizes so browser and device text settings apply. (Quick and mechanical.)
4. **Help my plant tells you to water first.** Maya, Sam, Tom, Dev. → Start with "Feel the soil" as step one and branch: dry means water, wet means stop and check roots. Apply to Yellow leaves and Drooping.
5. **Pet safety is only reliable inside the guide.** Dev, Sam, Luis. Custom plants say "Pet safety unknown." → Ask once "Do you have pets?" and show the safety chip on Today and Plants cards; for custom plants, link to the vet advice line and prompt to try a different name.
6. **Reminders are three taps away and never asked about.** Dev, Priya, Marcus. → Ask one question after the first plant: "Remind you each morning? At 8am." with Not now as an equal choice.
7. **The guide has 25 species.** It covers most common houseplants (pothos, snake plant, ZZ, monstera, peace lily, spider plant, aloe, rubber plant, fiddle-leaf fig, jade) but not orchids, parlor palm, Chinese evergreen, dracaena or cacti in general. Luis, Tom, Grace. → Add the most common missing ones, and offer "closest match" instead of a dead end.
8. **Small targets on Today.** 11 controls under 44px, including the ✓ and Water All. Marcus, Sam. → Make them 44px and spaced.
9. **First open can take about a minute** on the free server, with no explanation. Aaliyah and every first-time user. → Say "Waking up, this can take a minute the first time," or upgrade the instance before launch.

### Minor
- The search bar sits against the first card on Today (no gap).
- Five intro screens and a quiz come before the first plant. A small Skip exists, but first value is late. (Maya, Priya, Dev)
- Bouquet-only owners have no first-run path (Tom).
- Names like Pip, Grove, Plant ER and Window Blueprint are never explained (Luis, Grace).
- The add-plant species list scrolls inside the screen (Marcus, Hannah).
- Swaps are locked behind 3 months and Pro; the Community tab leads with a feature most new owners can't use.

### Unverified (needs a real device)
- What VoiceOver reads on the welcome screens and the drawn lines (Hannah).
- Whether the app follows iOS Larger Text and Safari text size (Grace).
- Dark theme legibility in direct sun (Sam).

## Recommendation
**Fix and re-test.** The structure is sound and I would not change the four tabs. Do findings 1 to 4 and 6 first: they are copy, colour and order changes, not new features. Then run real sessions with 5 new owners, including one VoiceOver user and one person on larger text, before relying on any of this.

## Status after the first fix round (2026-10-24)

Checked on a local copy of the app, at iPhone width, with the real backend and Maya's test account.

| Finding | Status |
|---|---|
| 1. Pink, "past schedule" cards | **Fixed.** Cards use a neutral surface; the words are "Last watered N days ago" or "Due N days ago". The coloured stripe and dot stay. |
| 2. Today / Today / Care naming | **Fixed.** Sub-tabs are now "To do" and "Progress"; the Growth page is titled "Progress"; the one-time tips use the new tab names. |
| 3. Text does not scale | **Fixed.** 170 fixed-pixel sizes and the 17px body are now rem-based. At 125% root size, 12px text became 15px; at 150% and 200% Today, Plants, Rooms and Help my plant have no horizontal overflow (headers, filter chips, the mission row and the Plants/Bouquets switch now wrap). Not yet tested with iOS Larger Text on a real device. |
| 4. Help my plant waters first | **Fixed.** Yellow leaves, brown tips, drooping and leaves dropping open with "First, feel the soil": dry means water, wet means do not water. |
| 6. Reminders never asked about | **Fixed.** A one-time card after the first plant: "One reminder a day, only when needed" with Sounds good, Turn off and Settings. |
| 8. Small targets on Today | **Fixed** for the ✓, Water All, Log care and filter chips (44px). |
| 9. Slow first open | **Fixed (message only).** After 6 seconds the loading screen says the first open after a quiet spell can take about a minute. The server still sleeps on the free plan. |
| 5. Pet safety for custom plants | **Fixed.** A "Do you have pets at home?" question in the one-time setup card (and a control on Profile). For pet owners every card on Today shows a pet-safety chip. Plants added by typing a name are now matched to the guide by common name as well, so they stop reading as "unknown" when the guide knows them. A plant the guide does not know still says unknown. |
| 7. 25-species guide | **Fixed for the common cases.** The guide grew from 25 to 40 species, each with an RHS care source and an ASPCA pet-safety source. Added: moth orchid, parlor palm, Chinese evergreen, corn plant, Christmas cactus, zebra haworthia, echeveria, burro's tail, ponytail palm, money tree, cast iron plant, baby rubber plant, Madagascar dragon tree, flaming Katy and bunny ears cactus. Left out on purpose because the ASPCA has no entry under their real name: prayer plant, bird's nest fern, Chinese money plant. |
| Unverified items | **Open.** VoiceOver on the welcome screens, iOS Larger Text, dark theme in direct sun. |
