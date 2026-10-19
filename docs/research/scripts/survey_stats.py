#!/usr/bin/env python3
"""Reproduce every number in docs/research/findings/2026-grove-concept-survey.md.

Standard library only. Run from anywhere:

    python3 docs/research/scripts/survey_stats.py
    python3 docs/research/scripts/survey_stats.py path/to/other.csv

Input: the anonymized Google Form export (37 responses, R01-R37). The file has
no emails, phone numbers, or times of day, and this script never prints any.

How multi-select answers are counted: Google Forms joins choices with ", ",
but several options contain commas themselves (for example "Smart care
reminders (Watering, feeding alerts)"). So each multi-select column is matched
against its exact option list below. Text that matches no option is reported
as "Other (free text)". Respondents who picked more options than the question
allowed are counted as they answered, and listed so the reader can see them.

Free-text delete triggers are hand-coded in DELETE_CODES. The raw answer is
printed next to each code so the coding can be checked line by line.
"""

import csv
import os
import sys
from collections import Counter, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = os.path.join(HERE, "..", "data", "grove-concept-survey-2026-anonymized.csv")

LATE_RESPONSE_DATE = "10/16/2026"  # R36-R37, added after the 35-response analysis

# ---------------------------------------------------------------- columns
# Matched by the start of the header text, so stray leading spaces in the
# export do not matter.
COLS = {
    "relationship": "Which best describes your relationship with plants",
    "perspective": "Which perspective should we prioritize",
    "confidence": "How confident do you feel keeping a plant alive",
    "stressors": "What feels most confusing or stressful about plant care",
    "checklist": "Imagine Grove showed you a short, actionable daily checklist",
    "alert_style": "If a plant goes too long without care",
    "text_length": "How much text explanation do you want",
    "beginner_feature": "Which of these beginner-focused features",
    "stop_updating": "Keeping a digital collection updated requires manual effort",
    "worth_time": "What would make maintaining a digital plant collection",
    "bulk_log": "Imagine you watered 10 plants at the same time",
    "ai_schedule": "Imagine Grove used AI to suggest a care schedule",
    "florist_work": "Which best describes your professional floral work",
    "florist_complaints": "What are your biggest customer-facing complaints",
    "qr_useful": "Imagine your customer scanned a custom QR code",
    "qr_contents": "What information should this customer-facing bouquet care page include",
    "ai_text_conditions": "If Grove uses AI to generate bouquet care text",
    "bouquet_format": "How would you prefer bouquet care instructions to be presented",
    "florist_pay": "Would you be willing to pay a premium subscription fee",
    "ai_features": "Which AI-driven features would you actually trust",
    "ai_trust": "What would make AI-generated care advice feel highly trustworthy",
    "frustration": "When looking for plant or flower care information online",
    "greenhouse": "What type of educational content would make you want to open",
    "trivia": "If Grove included an optional daily plant trivia question",
    "light_conf": "How confident are you in judging if a specific spot",
    "room_map_help": "Would a simple, stylized virtual room layout",
    "room_map_value": "What features would make a virtual room map highly valuable",
    "bouquet_same_app": "Would you want to track temporary fresh bouquets",
    "vase_countdown": "How would a \"Vase-life countdown timer\"",
    "community_motive": "What would be your primary motivation for joining an in-app plant community",
    "swap_safety": "If you were trading or swapping plant cuttings",
    "cat_care": "Feature Category Breakdown: If you could only choose TWO features from the Plant Care",
    "cat_scan": "Feature Category Breakdown: If you could only choose TWO features from the Intelligent",
    "cat_social": "Feature Category Breakdown: If you could only choose TWO features from the Visuals",
    "tradeoff": "The Ultimate Trade-off",
    "free": "Which features do you feel should be completely free",
    "pay": "Which features would you be willing to pay for",
    "not_use": "Which features would you not use",
    "price": "What price tier feels completely reasonable",
    "biggest_problem": "What is the single biggest problem you want Grove to solve",
    "delete": "What design flaw, annoying notification style",
}

# ------------------------------------------------- multi-select option lists
FEATURES = [
    "Smart care reminders (Watering, feeding alerts)",
    "Instantly identify houseplant species via camera",
    "AI photo diagnosis for sick plants (Pests, leaf yellowing)",
    "Growth photo journal (Side-by-side progression timeline)",
    "Cozy, stylized 2D Room/Light Map layout",
    "\"The Greenhouse\" bite-sized, ad-free plant encyclopedia",
    "Localized \"Groves\" community forums for help and chatting",
    "Quick bulk-logging (Log care for 10 plants in one tap)",
    "Bouquet scanner (Identify individual flowers in an arrangement)",
    "Verified local plant/cutting swapping system",
    "A comprehensive plant wishlist tracker",
    "Florist-branded bouquet care pages accessed via QR codes",
]
TIER_FEATURES = [
    "Tracking a small collection (up to 5 plants)",
    "Tracking an unlimited plant collection",
    "Basic care reminders & scheduling",
    "AI Plant Identification & Sickness Diagnosis",
    "The Stylized Room/Light Map feature",
    "Access to localized Plant Swapping & Groves",
    "Florist Tools (Branded QR care codes for clients)",
]
OPTIONS = {
    "stressors": [
        "Knowing when to water",
        "Knowing how much water to give",
        "Understanding if a spot has enough sunlight",
        "Diagnosing yellow, brown, or drooping leaves",
        "Understanding pet safety/toxicity",
        "Dealing with bugs/pests",
        "Identifying the plant species",
        "I just don't know where to start",
    ],
    "stop_updating": [
        "If adding a new plant takes more than 30 seconds",
        "If I have to log care actions for every single plant one by one",
        "If I can't easily upload photos in bulk",
        "If the app's care reminders conflict with my own intuition",
        "If the app feels like an \"administrative chore\" rather than a rewarding hobby",
    ],
    "worth_time": [
        "An AI photo scanner that automatically inputs the plant's species and ideal care needs",
        "A beautiful visual timeline showing side-by-side growth photos over months or years",
        "Seeing local climate or seasonal updates automatically adjust my care guidance",
        "A smart wishlist that helps me find and research my next plant",
        "A shareable digital profile page of my collection to show other plant friends",
        "The ability to track complex actions like propagation lines, pest treatments, and soil mixes",
    ],
    "florist_complaints": [
        "Customers have unrealistic expectations for how long cut flowers last",
        "Customers call to check if specific elements are toxic to their pets",
        "Customers don't know how to care for flowers and they die prematurely",
        "Customers don't understand why certain flowers (like hydrangeas) fade faster than others",
    ],
    "qr_contents": [
        "Individual flower names/varieties included in the arrangement",
        "Expected vase-life window with an explicit disclaimer",
        "Clear \"Day 1\" setup steps vs. ongoing care (trimming, water changes)",
        "Pet toxicity warnings",
        "Your flower shop’s branding, location, and social links",
        "A direct button to reorder, subscribe, or contact you",
    ],
    "ai_text_conditions": [
        "100% control to review, edit, or completely rewrite the flower list and text",
        "The ability to save my own permanent care templates so the AI doesn't change my methods",
        "A built-in, legally safe \"Vase life varies by environment\" disclaimer",
        "The ability to completely turn off AI text and only use standard care checkboxes",
        "I would never trust AI-generated copy with my customers",
    ],
    "ai_features": [
        "Scanning a leaf to identify a plant's species",
        "Scanning a sick leaf to diagnose a disease, mold, or pest issue",
        "Letting AI build a starting care schedule based on my local climate and room lighting",
        "Scanning an arrangement to identify all the separate cut flowers inside it",
        "Generating a custom care layout or vase-life estimate for a cut bouquet",
        "Generating a lighthearted, personalized background story/biography for my plant",
        "I would not use any AI features in a plant app",
    ],
    "ai_trust": [
        "Explaining why it made the recommendation (e.g., \"Suggested because this plant belongs to the succulent family\")",
        "Knowing the advice was reviewed or verified by professional florists/botanists",
        "Displaying an accuracy confidence score (e.g., \"94% match\")",
        "Showing photographic examples of similar plants to verify the diagnosis myself",
        "Explicitly citing botanical databases or scientific sources beneath the advice",
        "Seeing a message explicitly reminding me to check the actual soil/plant health before following the app",
    ],
    "greenhouse": [
        "Clear, visual summaries of basic water and light needs",
        "Regional ecology data (Is this plant native to my zone? Does it support local pollinators?)",
        "Detailed scientific insights (botanical names, propagation science, soil chemistry)",
        "Lightweight, fun daily trivia questions or weird plant facts",
        "Invasive plant warnings and alternative options for my zip code",
        "I wouldn't open an encyclopedia section; I only want care reminders",
    ],
    "room_map_value": [
        "Visually highlighting which plants are in dangerous \"too dark\" or \"too sunny\" zones",
        "Tracking seasonal light changes (e.g., showing how a South-facing window changes from winter to summer)",
        "Letting me view which plants look visually great grouped together in the same room",
        "The purely aesthetic joy of seeing a cute, organized digital representation of my real-life plant rooms",
        "Setting up alerts for unsafe placement (e.g., warning me if a toxic plant is mapped on a low table accessible to pets)",
        "I would not use or spend time setting up a virtual room map",
    ],
    "community_motive": [
        "Troubleshooting sick plants with real-time feedback from real people",
        "Finding local plant events, workshops, or neighborhood plant swaps",
        "Following professional florists or industry experts for design and care inspiration",
        "Safely swapping, trading, or buying unique plant cuttings or propagations locally",
        "Showing off beautiful photos of my rare plants or floral arrangements to people who care",
        "I have zero interest in social or community features inside a utility app",
    ],
    "cat_care": FEATURES,
    "cat_scan": FEATURES,
    "cat_social": FEATURES,
    "tradeoff": FEATURES,
    "free": TIER_FEATURES,
    "pay": TIER_FEATURES,
    "not_use": TIER_FEATURES,
}
PICK_LIMIT = {"cat_care": 2, "cat_scan": 2, "cat_social": 2, "tradeoff": 3,
              "stressors": 4, "worth_time": 4, "ai_trust": 4, "ai_text_conditions": 4,
              "florist_complaints": 4, "community_motive": 3}

# Short labels for the relationship question.
REL_LABELS = OrderedDict([
    ("I am an experienced plant owner", "experienced"),
    ("I am new to caring for plants", "new (strict)"),
    ("I own plants but am bad at them", "owns plants, not good at them"),
    ("I love plants but am not very good with them", "owns plants, not good at them"),
    ("I am a florist", "florist"),
    ("I mostly buy or receive bouquets", "bouquet-only"),
])

# ------------------------------------------------- hand-coded delete triggers
# Conservative: a theme is coded only when the answer names it. "Emails or
# pop-ups" (R16) is kept apart from notification volume on purpose.
DELETE_CODES = {
    "R01": ["notification/reminder volume"],
    "R02": ["generative AI / inaccurate info"],
    "R03": ["no quick view of what needs water"],
    "R04": ["ads"],
    "R05": ["required community"],
    "R06": ["notification/reminder volume", "logging/data-entry friction"],
    "R07": ["too wordy / complicated explanations"],
    "R08": ["logging/data-entry friction"],
    "R09": ["notification/reminder volume"],
    "R10": ["no answer / not sure"],
    "R11": ["ads"],
    "R12": ["no answer / not sure"],
    "R13": ["no answer / not sure"],
    "R14": ["notification/reminder volume"],
    "R15": ["no answer / not sure"],
    "R16": ["emails or pop-ups"],
    "R17": ["ads"],
    "R18": ["logging/data-entry friction"],
    "R19": ["paywall / price"],
    "R20": ["notification/reminder volume"],
    "R21": ["too wordy / complicated explanations"],
    "R22": ["not intuitive / slow to find info"],
    "R23": ["no answer / not sure"],
    "R24": ["notification/reminder volume"],
    "R25": ["notification/reminder volume"],
    "R26": ["notification/reminder volume"],
    "R27": ["no answer / not sure"],
    "R28": ["no answer / not sure"],
    "R29": ["notification/reminder volume"],
    "R30": ["too wordy / complicated explanations"],
    "R31": ["notification/reminder volume"],
    "R32": ["notification/reminder volume"],
    "R33": ["paywall / price"],
    "R34": ["no answer / not sure"],
    "R35": ["AI misidentification"],
    # R36: "constant nothing alerts" is the notification theme; "ads" is ads.
    # R37: "do many adds" read as ads; "words, font ... not easily visible" is legibility.
    "R36": ["ads", "notification/reminder volume"],
    "R37": ["ads", "text hard to read"],
}


# ---------------------------------------------------------------- helpers
def find_col(header, prefix):
    hits = [h for h in header if h.strip().startswith(prefix)]
    if len(hits) != 1:
        raise SystemExit(f"Column not found uniquely: {prefix!r} -> {hits}")
    return hits[0]


def split_multi(value, options):
    """Return (matched options, leftover free text)."""
    rest = value
    found = []
    for opt in sorted(options, key=len, reverse=True):
        if opt in rest:
            found.append(opt)
            rest = rest.replace(opt, "", 1)
    leftover = rest.replace(",", " ").strip()
    return found, leftover


def pct(n, d):
    if d == 0:
        return "n/a"
    return f"{int(n * 100 / d + 0.5)}%"


def mean(xs):
    return sum(xs) / len(xs) if xs else float("nan")


def short(text, n=70):
    text = text.replace("\n", " ")
    return text if len(text) <= n else text[: n - 1] + "…"


def heading(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def table_single(rows, col, denom_label="answered"):
    vals = [r[col].strip() for r in rows if r[col].strip()]
    c = Counter(vals)
    print(f"  ({len(vals)} {denom_label} of {len(rows)})")
    for k, v in c.most_common():
        print(f"  {v:>3}  {pct(v, len(vals)):>4}  {short(k, 90)}")
    return c, len(vals)


def table_multi(rows, key, denom=None, show_over=True):
    col = C[key]
    opts = OPTIONS[key]
    counts = Counter()
    answered = 0
    others = []
    over = []
    for r in rows:
        v = r[col].strip()
        if not v:
            continue
        answered += 1
        found, leftover = split_multi(v, opts)
        counts.update(found)
        if leftover:
            others.append((r["respondent"], leftover))
        lim = PICK_LIMIT.get(key)
        if lim and len(found) > lim:
            over.append((r["respondent"], len(found)))
    d = denom if denom is not None else answered
    print(f"  ({answered} answered; percentages of {d})")
    for opt in sorted(opts, key=lambda o: -counts[o]):
        print(f"  {counts[opt]:>3}  {pct(counts[opt], d):>4}  {short(opt, 90)}")
    for rid, text in others:
        print(f"    Other (free text) {rid}: {short(text, 100)}")
    if show_over and over:
        print("    Picked more than allowed: " + ", ".join(f"{rid} ({n})" for rid, n in over))
    return counts, answered


def crosstab(rows, col, n_chars=40):
    """Answer counts split by relationship group (only rows that answered)."""
    groups = OrderedDict()
    for r in rows:
        v = r[col].strip()
        if v:
            groups.setdefault(r["_group"], Counter())[short(v, n_chars)] += 1
    for g, c in groups.items():
        total = sum(c.values())
        print(f"    {g:<32} n={total:<2} " + "; ".join(f"{k}: {v}" for k, v in c.most_common()))


def group_of(row):
    rel = row[C["relationship"]]
    for prefix, label in REL_LABELS.items():
        if rel.startswith(prefix):
            return label
    return "other"


# ------------------------------------------------------------------ main
path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
with open(path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    header = reader.fieldnames
    ROWS = list(reader)

C = {k: find_col(header, p) for k, p in COLS.items()}
N = len(ROWS)
for r in ROWS:
    r["_group"] = group_of(r)
STRICT_NEW = [r for r in ROWS if r["_group"] == "new (strict)"]
EXPERIENCED = [r for r in ROWS if r["_group"] == "experienced"]
FLORISTS = [r for r in ROWS if r["_group"] == "florist"]
EARLIER = [r for r in ROWS if r["date"] != LATE_RESPONSE_DATE]
LATE = [r for r in ROWS if r["date"] == LATE_RESPONSE_DATE]

heading("1. SAMPLE")
def date_key(d):
    month, day, year = (int(x) for x in d.split("/"))
    return (year, month, day)


dates = sorted({r["date"] for r in ROWS}, key=date_key)
print(f"  Responses: {N}  (dates {dates[0]} to {dates[-1]})")
print(f"  Responses before {LATE_RESPONSE_DATE}: {len(EARLIER)}; on it: {len(LATE)} -> "
      + ", ".join(r["respondent"] for r in LATE))
print("  By self-described relationship:")
for label, n in Counter(r["_group"] for r in ROWS).most_common():
    print(f"  {n:>3}  {label}")
print("  By perspective chosen (this routed people to different question blocks):")
for k, n in Counter(r[C["perspective"]] for r in ROWS).most_common():
    print(f"  {n:>3}  {k}")

heading(f"2. LAUNCH DEALBREAKERS - 'The Ultimate Trade-off' (pick 3), all {N}")
trade, _ = table_multi(ROWS, "tradeoff", denom=N)
print("  Rank order (ties share a rank):")
ordered = sorted(FEATURES, key=lambda o: -trade[o])
rank = 0
prev = None
for i, opt in enumerate(ordered, 1):
    if trade[opt] != prev:
        rank = i
        prev = trade[opt]
    print(f"   #{rank:<2} {trade[opt]:>2}/{N}  {short(opt, 70)}")

print(f"\n  Same question, the {len(EARLIER)} responses before {LATE_RESPONSE_DATE}:")
trade_early, _ = table_multi(EARLIER, "tradeoff", denom=len(EARLIER), show_over=False)
print("  Change from adding the late response:")
for opt in FEATURES:
    if trade[opt] != trade_early[opt]:
        print(f"    {short(opt, 60)}: {trade_early[opt]} -> {trade[opt]}")

heading(f"3. CATEGORY PICKS (pick 2 per category), all {N}")
for key in ("cat_care", "cat_scan", "cat_social"):
    print(f"  -- {key}")
    counts, _ = table_multi(ROWS, key, denom=N)

heading("4. CONFIDENCE")
print("  Plant-care confidence 1-5 (asked only of the 'New plant owner' perspective):")
vals = [int(r[C["confidence"]]) for r in ROWS if r[C["confidence"]].strip()]
print(f"    n={len(vals)}  mean={mean(vals):.2f}  distribution={dict(sorted(Counter(vals).items()))}")
print("  Light-placement confidence 1-5 (asked of everyone), by relationship group:")
for label in ["new (strict)", "experienced", "owns plants, not good at them", "florist", "bouquet-only"]:
    grp = [r for r in ROWS if r["_group"] == label]
    v = [int(r[C["light_conf"]]) for r in grp if r[C["light_conf"]].strip()]
    m = f"{mean(v):.2f}" if v else "n/a"
    print(f"    {label:<32} answered {len(v):>2} of {len(grp):>2}  mean={m}  dist={dict(sorted(Counter(v).items()))}")
allv = [int(r[C["light_conf"]]) for r in ROWS if r[C["light_conf"]].strip()]
low = sum(1 for x in allv if x <= 2)
print(f"    all respondents: answered {len(allv)}  mean={mean(allv):.2f}  rated 1-2: {low} ({pct(low, len(allv))})")

heading("5. WHAT FEELS CONFUSING OR STRESSFUL (asked of 'New plant owner' perspective)")
table_multi(ROWS, "stressors")
answered_new = [r for r in STRICT_NEW if r[C["stressors"]].strip()]
pet_new = [r["respondent"] for r in answered_new
           if "Understanding pet safety/toxicity" in r[C["stressors"]]]
pet_all = [r["respondent"] for r in ROWS if "Understanding pet safety/toxicity" in r[C["stressors"]]]
print(f"  Pet safety, strict-new group: {len(pet_new)} of {len(answered_new)} who answered "
      f"(of {len(STRICT_NEW)} strict-new respondents) -> {', '.join(pet_new)}")
print(f"  Pet safety, everyone who saw the question: {len(pet_all)} -> {', '.join(pet_all)}")
not_answered = [r["respondent"] for r in STRICT_NEW if not r[C["stressors"]].strip()]
print(f"  Strict-new respondents who did not see/answer it: {', '.join(not_answered)}")
print("  Pet safety elsewhere: florists naming customer pet-toxicity calls, bouquet page contents,")
print("  room-map unsafe-placement alerts, and the one beginner-feature pick are reported below.")

heading("6. NEW-OWNER CARE PREFERENCES (asked of 'New plant owner' perspective, n=16)")
print("  Daily checklist usefulness (1-5):")
v = [int(r[C["checklist"]]) for r in ROWS if r[C["checklist"]].strip()]
print(f"    n={len(v)} mean={mean(v):.2f} dist={dict(sorted(Counter(v).items()))}")
print("  Who answered this block, by relationship group:")
for g, n in Counter(r["_group"] for r in ROWS if r[C["alert_style"]].strip()).most_common():
    print(f"    {n:>3}  {g}")
print("  Overdue alert style:")
table_single(ROWS, C["alert_style"])
print("  Overdue alert style by relationship group:")
crosstab(ROWS, C["alert_style"], 16)
print("  Text explanation length:")
table_single(ROWS, C["text_length"])
print("  Text explanation length by relationship group:")
crosstab(ROWS, C["text_length"], 24)
print("  Most helpful beginner feature (pick 1):")
table_single(ROWS, C["beginner_feature"])

heading("7. KEEPING A COLLECTION UPDATED (asked of 'Experienced plant owner' perspective)")
print("  Who answered this block, by relationship group:")
for g, n in Counter(r["_group"] for r in ROWS if r[C["bulk_log"]].strip()).most_common():
    print(f"    {n:>3}  {g}")
print("  What would make you STOP updating after week 1 (multi-select):")
table_multi(ROWS, "stop_updating")
print("  Logging 10 plants watered at once:")
table_single(ROWS, C["bulk_log"])
print("  What would make a digital collection worth the time (multi-select):")
table_multi(ROWS, "worth_time")
print("  AI-suggested, fully editable care schedule usefulness (1-5):")
v = [int(r[C["ai_schedule"]]) for r in ROWS if r[C["ai_schedule"]].strip()]
print(f"    n={len(v)} mean={mean(v):.2f} dist={dict(sorted(Counter(v).items()))}")

heading("8. AI TRUST (asked of everyone)")
print("  AI features people would trust and use:")
feats, _ = table_multi(ROWS, "ai_features", denom=N)
no_ai = [r for r in ROWS if "I would not use any AI features" in r[C["ai_features"]]]
contradict = [r["respondent"] for r in no_ai
              if len(split_multi(r[C["ai_features"]], OPTIONS["ai_features"])[0]) > 1]
print(f"  'Would not use any AI': {len(no_ai)}/{N} -> {', '.join(r['respondent'] for r in no_ai)}"
      f"; also ticked AI features anyway: {', '.join(contradict) or 'none'}")
print("  What makes AI advice trustworthy (pick up to 4):")
table_multi(ROWS, "ai_trust", denom=N)
print("  Single biggest frustration with care info online:")
table_single(ROWS, C["frustration"])

heading("9. DELETE TRIGGERS (free text, hand-coded; see DELETE_CODES)")
theme_counts = Counter()
for r in ROWS:
    codes = DELETE_CODES.get(r["respondent"], ["UNCODED"])
    theme_counts.update(codes)
    print(f"  {r['respondent']}  [{'; '.join(codes)}]  {short(r[C['delete']], 80)}")
print(f"  Theme totals (a response can carry two themes; percentages of {N}):")
for k, v in theme_counts.most_common():
    print(f"  {v:>3}  {pct(v, N):>4}  {k}")
notif = sorted(r for r, c in DELETE_CODES.items() if "notification/reminder volume" in c)
print(f"  Notification/reminder volume IDs: {', '.join(notif)}")
print("  Numeric limits people named: R06 'more than one notification a day'; R14 'more than 3 notifications/daily'")

heading("10. PRICING AND TIERS (asked of everyone)")
print("  Price tier:")
table_single(ROWS, C["price"])
print("  Should be free:")
table_multi(ROWS, "free", denom=N)
print("  Would pay for:")
table_multi(ROWS, "pay", denom=N)
print("  Would not use:")
table_multi(ROWS, "not_use", denom=N)

heading("11. BOUQUETS AND FLORISTS (florist block n=3; everyone for bouquet questions)")
print("  Florist respondents: " + ", ".join(f"{r['respondent']} ({r[C['florist_work']]})" for r in FLORISTS))
print("  Customer-facing complaints:")
table_multi(ROWS, "florist_complaints")
print("  QR care page usefulness for business (1-5):")
for r in ROWS:
    if r[C["qr_useful"]].strip():
        print(f"    {r['respondent']}: {r[C['qr_useful']]}")
print("  What the QR care page must include:")
table_multi(ROWS, "qr_contents")
print("  Before sharing AI-written bouquet care text with a customer:")
table_multi(ROWS, "ai_text_conditions")
print("  Instruction format:")
table_single(ROWS, C["bouquet_format"])
print("  Would pay for a professional version:")
table_single(ROWS, C["florist_pay"])
print("  Track bouquets in the same app as houseplants? (everyone)")
table_single(ROWS, C["bouquet_same_app"])
print("  Vase-life countdown timer reaction (everyone):")
table_single(ROWS, C["vase_countdown"])
print("  Vase-life countdown by relationship group:")
for label in ["new (strict)", "experienced", "owns plants, not good at them", "florist", "bouquet-only"]:
    grp = [r for r in ROWS if r["_group"] == label]
    c = Counter(r[C["vase_countdown"]].split("—")[0].split(" or ")[0].split(" /")[0] for r in grp)
    print(f"    {label:<32} " + ", ".join(f"{k}: {v}" for k, v in c.most_common()))

heading("12. OTHER CONCEPT SIGNALS (everyone)")
print("  Daily trivia/tip card:")
table_single(ROWS, C["trivia"])
print("  Greenhouse content that would get opened:")
table_multi(ROWS, "greenhouse", denom=N)
print("  Room map: what would make it valuable:")
table_multi(ROWS, "room_map_value", denom=N)
print("  Community motivation:")
table_multi(ROWS, "community_motive", denom=N)
print("  Swap safety:")
table_single(ROWS, C["swap_safety"])

heading("13. THE LATE RESPONSES (what changed vs the 35-response analysis)")
for r in LATE:
    print(f"  {r['respondent']}  group={r['_group']}  work={r[C['florist_work']]}")
    for key in ("ai_features", "tradeoff", "qr_contents", "ai_text_conditions", "frustration",
                "vase_countdown", "delete", "biggest_problem"):
        print(f"    {key}: {short(r[C[key]], 150)}")
print(f"  Counts on {len(EARLIER)} vs {N} for the AI-trust questions:")
for key, opt in [("ai_features", "I would not use any AI features in a plant app"),
                 ("ai_trust", OPTIONS["ai_trust"][0]),
                 ("ai_trust", OPTIONS["ai_trust"][1]),
                 ("ai_trust", OPTIONS["ai_trust"][2]),
                 ("ai_trust", OPTIONS["ai_trust"][3]),
                 ("ai_trust", OPTIONS["ai_trust"][4]),
                 ("ai_trust", OPTIONS["ai_trust"][5])]:
    e = sum(1 for r in EARLIER if opt in r[C[key]])
    a = sum(1 for r in ROWS if opt in r[C[key]])
    print(f"    {short(opt, 60):<62} {e}/{len(EARLIER)} -> {a}/{N}")
opt = "Hard to tell if the information is accurate or just written by AI bots"
e = sum(1 for r in EARLIER if r[C["frustration"]] == opt)
a = sum(1 for r in ROWS if r[C["frustration"]] == opt)
print(f"    {short(opt, 60):<62} {e}/{len(EARLIER)} -> {a}/{N}")
