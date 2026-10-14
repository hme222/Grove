import React from "react";
import {
  Leaf,
  Sparkles,
  Coffee,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Link as LinkIcon,
  Clock,
  Cat,
  Sunrise,
  Droplets,
  Sprout,
  Bell,
  Brush,
  ShowerHead,
  Footprints,
  Trophy,
  Repeat,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * HabitStackingVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Habit Stacking Your
 * Plant Care" master lesson for The Steady Sprout track.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data
   ================================================================ */
export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Zero-effort Consistency",
    headline: "Don\u2019t rely on memory.",
    body:
      "To build a consistent care routine, don&rsquo;t try to remember. Instead, <strong>stack</strong> your plant check onto an unbreakable habit you already do every single day.",
    cta: "I\u2019m ready to stack",
    icon: Repeat,
    accent: "from-emerald-100 via-lime-50 to-emerald-50",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
  },
  {
    n: 2,
    header: "Card 2 of 5 · The Formula",
    eyebrow: "The Routine Recipe",
    headline: "The habit-stack formula.",
    body:
      "Use this one line as your template &mdash; then repeat it out loud until it feels like yours: <strong>&ldquo;After I do [Existing Habit], I will [Check My Plant].&rdquo;</strong>",
    cta: "Got the recipe",
    icon: LinkIcon,
    accent: "from-amber-100 via-yellow-50 to-emerald-50",
    ring: "text-amber-700",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 3,
    header: "Card 3 of 5 · Example A",
    eyebrow: "The Morning Grind",
    headline: "Coffee grinder \u2192 Monstera.",
    body:
      "&ldquo;Right after I grind my morning coffee, I will look at my Monstera&rsquo;s leaves.&rdquo; It takes 8 seconds and the smell of coffee becomes your daily cue.",
    cta: "Love this one",
    icon: Coffee,
    accent: "from-amber-100 via-orange-50 to-emerald-50",
    ring: "text-amber-800",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 4,
    header: "Card 4 of 5 · Example B",
    eyebrow: "The Furry Friend",
    headline: "Cat bowl \u2192 desk plant.",
    body:
      "&ldquo;Right after I feed my cat (like Luna, who keeps things grounded), I will touch the soil of my desk plant.&rdquo; Two little rituals, one shared moment.",
    cta: "This one too",
    icon: Cat,
    accent: "from-rose-100 via-amber-50 to-emerald-50",
    ring: "text-rose-700",
    chip: "bg-rose-100 text-rose-800",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Pick your anchor habit.",
    body:
      "Identify one daily habit you never skip &mdash; brushing teeth, making coffee, feeding the cat. Pair your plant check with it right now.",
    cta: "Create My Habit Reminder",
    icon: Bell,
    accent: "from-lime-100 via-emerald-50 to-emerald-100",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
    interactive: true,
  },
];

/* ================================================================
   Shared UI primitives
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#FBFAF5]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] bg-emerald-950 p-3 shadow-2xl shadow-emerald-950/25">
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 800 }}
      >
        <div className="flex items-center justify-between px-7 pt-4 pb-2 text-[11px] font-semibold text-emerald-950">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="ml-1 h-2 w-4 rounded-sm border border-emerald-950" />
          </span>
        </div>
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-emerald-950" />
        <div className="relative h-[calc(100%-30px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const VariationLabel = ({ number, title, subtitle }) => (
  <div className="mx-auto max-w-3xl px-6 pt-20 pb-8 text-left">
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation {number}
      </span>
      <Badge
        variant="outline"
        className="rounded-full border-lime-300 bg-lime-50 px-3 py-1 text-xs text-emerald-900"
      >
        Steady Sprout &middot; Steady Sprout Track
      </Badge>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mt-3 font-serif text-2xl leading-tight text-emerald-950 md:text-3xl">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-1 max-w-2xl text-sm text-emerald-800/70">{subtitle}</p>
    )}
  </div>
);

const DotRow = ({ current }) => (
  <div className="flex items-center gap-1.5">
    {CARDS.map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i === current
            ? "w-6 bg-emerald-800"
            : i < current
              ? "w-1.5 bg-emerald-500"
              : "w-1.5 bg-emerald-200"
        }`}
      />
    ))}
  </div>
);

/* ================================================================
   VARIATION 1 — Chain-Link Visual (The Formula)
   Featured card: Card 2
   ================================================================ */
const ChainLinkVisual = () => (
  <div className="relative mx-auto flex h-40 w-full items-center justify-center">
    {/* Left link — existing habit */}
    <div className="relative flex flex-col items-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-emerald-800 bg-white shadow-lg">
        <Coffee className="h-9 w-9 text-emerald-800" />
      </div>
      <span className="mt-2 rounded-full bg-emerald-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
        Existing habit
      </span>
    </div>

    {/* Chain connector */}
    <div className="relative mx-1 flex items-center">
      <LinkIcon className="h-6 w-6 rotate-45 text-amber-600" />
    </div>

    {/* Right link — plant check */}
    <div className="relative flex flex-col items-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-lime-600 bg-lime-50 shadow-lg">
        <Sprout className="h-9 w-9 text-emerald-700" />
      </div>
      <span className="mt-2 rounded-full bg-lime-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
        Plant check
      </span>
    </div>

    {/* Floating "+" */}
    <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-sm">
      stack
    </span>
  </div>
);

const VariationOne = () => {
  const card = CARDS[1];
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-chain-link">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Habit Stacking
            </span>
            <DotRow current={1} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            2/5
          </span>
        </div>

        <ChainLinkVisual />

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-amber-100 via-yellow-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <LinkIcon className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Formula card */}
            <div className="mt-4 rounded-2xl bg-emerald-950 p-4 text-emerald-50">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
                The recipe
              </p>
              <p className="mt-2 font-serif text-[16px] leading-snug">
                &ldquo;After I do{" "}
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-amber-200">
                  [existing habit]
                </span>
                , I will{" "}
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-lime-200">
                  [check my plant]
                </span>
                .&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v1-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-800/60">
            <button className="flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              The Hook
            </button>
            <button className="flex items-center gap-1 font-medium text-emerald-800">
              Example A
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Daily Routine Timeline (Morning Grind)
   Featured card: Card 3
   ================================================================ */
const RoutineTimeline = () => {
  const points = [
    { time: "7:00", label: "Wake", icon: Sunrise, active: false },
    { time: "7:15", label: "Grind coffee", icon: Coffee, active: true },
    { time: "7:16", label: "Check Monstera", icon: Sprout, plant: true },
    { time: "8:00", label: "Commute", icon: Footprints, active: false },
  ];
  return (
    <div className="relative mt-1 rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between text-[10px] font-medium text-emerald-800/70">
        <span className="flex items-center gap-1">
          <Sunrise className="h-3 w-3" />
          Morning
        </span>
        <span>Afternoon &rarr;</span>
      </div>
      <div className="relative mt-4">
        <span className="absolute left-3 right-3 top-4 h-0.5 rounded-full bg-emerald-100" />
        <div className="relative flex justify-between">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ring-2 ${
                    p.plant
                      ? "bg-lime-500 text-white ring-lime-100 shadow-md"
                      : p.active
                        ? "bg-emerald-900 text-white ring-emerald-100"
                        : "bg-white text-emerald-800/70 ring-emerald-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p
                  className={`mt-2 text-[9px] font-bold ${
                    p.plant
                      ? "text-emerald-800"
                      : p.active
                        ? "text-emerald-900"
                        : "text-emerald-800/50"
                  }`}
                >
                  {p.time}
                </p>
                <p
                  className={`text-[9px] leading-tight ${
                    p.plant || p.active
                      ? "text-emerald-900"
                      : "text-emerald-800/50"
                  }`}
                >
                  {p.label}
                </p>
              </div>
            );
          })}
        </div>
        {/* Highlight bracket showing the stack */}
        <div className="absolute left-[24%] right-[46%] top-0 flex flex-col items-center">
          <span className="w-full rounded-t-lg border-2 border-b-0 border-dashed border-amber-400 pt-1" style={{ height: 16 }} />
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-900">
            stack
          </span>
        </div>
      </div>
    </div>
  );
};

const VariationTwo = () => {
  const card = CARDS[2];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-amber-50 via-white to-emerald-50"
      testId="v2-timeline"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Your morning routine
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            3/5
          </span>
        </div>

        <RoutineTimeline />

        <Card className="mt-5 rounded-3xl border-none bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Coffee className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Quote pull */}
            <div className="mt-4 flex items-start gap-2 rounded-2xl border-l-4 border-amber-500 bg-white/70 p-3">
              <span
                className="flex-1 text-[12px] italic leading-relaxed text-emerald-950"
                style={{ fontFamily: "Georgia, serif" }}
              >
                &ldquo;The smell of coffee is my cue. My Monstera never gets forgotten.&rdquo;
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v2-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 3 — Fill-in-the-Blank Madlibs Card
   Featured cards: 2 + 5 combined into one editable sentence
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame tone="bg-[#F5F3EC]" testId="v3-madlibs">
    <div className="flex h-full flex-col px-5 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-white p-2 shadow-sm">
          <ChevronLeft className="h-4 w-4 text-emerald-800" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
            Build your sentence
          </span>
          <DotRow current={1} />
        </div>
        <span className="text-[10px] font-semibold text-emerald-700">2/5</span>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
          Your Routine Recipe
        </p>
        <h1 className="mt-1 font-serif text-[24px] leading-tight text-emerald-950">
          Fill in the two blanks.
        </h1>
        <p className="mt-1 text-[12px] text-emerald-800/70">
          The whole habit lives inside one sentence. Tap each box.
        </p>
      </div>

      {/* Big madlibs sentence */}
      <Card className="mt-5 rounded-3xl border-none bg-emerald-950 text-emerald-50 shadow-xl">
        <CardContent className="p-6">
          <p className="font-serif text-[22px] leading-[1.35] tracking-tight">
            After I{" "}
            <button
              data-testid="v3-blank-habit"
              className="mx-0.5 inline-flex items-center gap-1 rounded-lg border-b-2 border-amber-300 bg-amber-300/20 px-2 py-0.5 text-amber-200 hover:bg-amber-300/30"
            >
              grind my coffee
              <ChevronRight className="h-3 w-3" />
            </button>
            , I will{" "}
            <button
              data-testid="v3-blank-plant"
              className="mx-0.5 inline-flex items-center gap-1 rounded-lg border-b-2 border-lime-300 bg-lime-300/20 px-2 py-0.5 text-lime-200 hover:bg-lime-300/30"
            >
              check my Monstera
              <ChevronRight className="h-3 w-3" />
            </button>
            .
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-900/60 p-2.5">
            <Sparkles className="h-3.5 w-3.5 text-lime-200" />
            <p className="text-[11px] text-emerald-100/85">
              Read it out loud twice &mdash; it starts sticking after two.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Suggestion swaps */}
      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800/70">
          Or try one of these habits
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { label: "brush my teeth", icon: Brush },
            { label: "feed my cat", icon: Cat },
            { label: "take my shower", icon: ShowerHead },
            { label: "lock the front door", icon: Footprints },
          ].map((h) => {
            const Icon = h.icon;
            return (
              <button
                key={h.label}
                className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-900 hover:border-emerald-400"
              >
                <Icon className="h-3.5 w-3.5" />
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Button
          className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
          data-testid="v3-cta-lock-in"
        >
          Lock in this sentence
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 4 — Illustrated Vignette (Luna the cat)
   Featured card: Card 4 (Furry Friend)
   ================================================================ */
const CatVignette = () => (
  <div className="relative mx-auto h-52 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-amber-50 to-emerald-100">
    {/* Sun rays background */}
    <svg
      className="absolute inset-0 h-full w-full opacity-40"
      viewBox="0 0 300 220"
      aria-hidden="true"
    >
      <circle cx="240" cy="30" r="20" fill="#FCD34D" />
      <path d="M0,180 Q150,120 300,180 L300,220 L0,220 Z" fill="#FED7AA" opacity="0.6" />
    </svg>

    {/* Cat (Luna) */}
    <svg
      className="absolute left-4 bottom-4 h-32 w-32"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="50" cy="70" rx="30" ry="20" fill="#374151" />
      {/* Head */}
      <circle cx="50" cy="45" r="20" fill="#374151" />
      {/* Ears */}
      <polygon points="35,32 30,15 45,28" fill="#374151" />
      <polygon points="65,32 70,15 55,28" fill="#374151" />
      <polygon points="37,29 34,20 43,27" fill="#F472B6" />
      <polygon points="63,29 66,20 57,27" fill="#F472B6" />
      {/* Eyes */}
      <ellipse cx="43" cy="45" rx="2.5" ry="4" fill="#FBBF24" />
      <ellipse cx="57" cy="45" rx="2.5" ry="4" fill="#FBBF24" />
      <ellipse cx="43" cy="46" rx="1" ry="3" fill="#111827" />
      <ellipse cx="57" cy="46" rx="1" ry="3" fill="#111827" />
      {/* Nose + mouth */}
      <polygon points="48,52 52,52 50,55" fill="#F9A8D4" />
      <path d="M50,55 Q46,60 42,58" stroke="#111827" strokeWidth="1" fill="none" />
      <path d="M50,55 Q54,60 58,58" stroke="#111827" strokeWidth="1" fill="none" />
      {/* Whiskers */}
      <line x1="35" y1="52" x2="25" y2="50" stroke="#fff" strokeWidth="0.5" />
      <line x1="35" y1="55" x2="25" y2="56" stroke="#fff" strokeWidth="0.5" />
      <line x1="65" y1="52" x2="75" y2="50" stroke="#fff" strokeWidth="0.5" />
      <line x1="65" y1="55" x2="75" y2="56" stroke="#fff" strokeWidth="0.5" />
      {/* Bowl */}
      <ellipse cx="80" cy="88" rx="14" ry="4" fill="#3F2A17" opacity="0.3" />
      <path d="M68,88 L92,88 L88,80 L72,80 Z" fill="#F97316" />
    </svg>

    {/* Plant on desk */}
    <svg
      className="absolute right-4 bottom-4 h-28 w-24"
      viewBox="0 0 80 100"
      aria-hidden="true"
    >
      {/* Pot */}
      <path d="M15,80 L65,80 L58,100 L22,100 Z" fill="#B45309" />
      {/* Leaves */}
      <path d="M40,80 Q20,60 15,40 Q30,50 40,80 Z" fill="#059669" />
      <path d="M40,80 Q60,60 65,40 Q50,50 40,80 Z" fill="#059669" />
      <path d="M40,80 Q42,50 38,25 Q40,40 40,80 Z" fill="#10B981" />
    </svg>

    {/* Chain link */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md backdrop-blur">
      <LinkIcon className="h-4 w-4 rotate-45 text-emerald-800" />
    </div>

    {/* Label */}
    <div className="absolute left-4 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      Luna &middot; the anchor
    </div>
  </div>
);

const VariationFour = () => {
  const card = CARDS[3];
  return (
    <PhoneFrame tone="bg-[#FDF9EE]" testId="v4-cat-vignette">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Meet Luna
            </span>
            <DotRow current={3} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            4/5
          </span>
        </div>

        <div className="mt-5">
          <CatVignette />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                <Cat className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Formula reminder line */}
            <div className="mt-4 rounded-xl bg-rose-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-700">
                Your stack looks like
              </p>
              <p className="mt-1 font-serif text-[14px] italic text-emerald-950">
                &ldquo;After I feed Luna, I&rsquo;ll touch my desk plant&rsquo;s soil.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v4-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 5 — Habit Picker Grid (Card 5)
   Featured card: Card 5 with grid of anchor habits
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  const habits = [
    { label: "Morning coffee", icon: Coffee, active: true, cue: "7:15 AM" },
    { label: "Brush teeth", icon: Brush, cue: "7:00 AM" },
    { label: "Feed the cat", icon: Cat, cue: "7:30 AM" },
    { label: "Shower", icon: ShowerHead, cue: "7:45 AM" },
    { label: "Lock front door", icon: Footprints, cue: "8:15 AM" },
    { label: "Bedtime read", icon: BookOpen, cue: "10:30 PM" },
  ];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-habit-picker"
    >
      {/* Decorative blob */}
      <svg
        className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 opacity-40"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        <path
          d="M280,80 C340,120 360,220 320,290 C280,360 180,380 120,330 C60,280 40,180 100,110 C160,40 220,40 280,80 Z"
          fill="url(#v5g)"
        />
        <defs>
          <linearGradient id="v5g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7C4A0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E7F0DA" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Your Turn
            </span>
            <DotRow current={4} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            5/5
          </span>
        </div>

        <div className="mt-6">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
          >
            {card.header}
          </span>
          <h1 className="mt-3 font-serif text-[26px] leading-tight text-emerald-950">
            {card.headline}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/80">
            {card.body}
          </p>
        </div>

        {/* Habit picker grid */}
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Choose one anchor habit
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {habits.map((h) => {
              const Icon = h.icon;
              return (
                <button
                  key={h.label}
                  data-testid={`v5-habit-${h.label.replace(/ /g, "-").toLowerCase()}`}
                  className={`flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition ${
                    h.active
                      ? "border-emerald-800 bg-emerald-900 text-white shadow-md ring-2 ring-emerald-800"
                      : "border-emerald-200 bg-white/80 hover:border-emerald-400"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      h.active ? "bg-emerald-800" : "bg-emerald-50"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        h.active ? "text-lime-200" : "text-emerald-800"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-[12px] font-bold ${
                          h.active ? "text-white" : "text-emerald-950"
                        }`}
                      >
                        {h.label}
                      </p>
                      {h.active && (
                        <Check className="h-3 w-3 text-lime-200" />
                      )}
                    </div>
                    <p
                      className={`mt-0.5 flex items-center gap-1 text-[10px] ${
                        h.active ? "text-emerald-100/70" : "text-emerald-800/60"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {h.cue}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview stack sentence */}
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Your stack preview
          </p>
          <p className="mt-1 font-serif text-[13px] italic text-emerald-950">
            &ldquo;After I{" "}
            <span className="font-bold not-italic text-emerald-800">
              have my morning coffee
            </span>
            , I&rsquo;ll check my Monstera.&rdquo;
          </p>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-create-reminder"
          >
            {card.cta}
            <Bell className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            We&rsquo;ll nudge you gently at your cue time.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final "Create My Habit Reminder" endpoint
   ================================================================ */
const FinalCTAPreview = () => (
  <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
    <div className="mb-6 flex items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Shared endpoint
      </span>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mb-4 font-serif text-2xl text-emerald-950">
      After all 5 cards &mdash; the Steady Sprout win
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: the habit stack is saved and the first gentle
      reminder is queued.
    </p>
    <div className="flex justify-center">
      <PhoneFrame tone="bg-[#F7F5EE]" testId="bonus-final-cta">
        <div className="flex h-full flex-col px-5 pb-6 pt-3">
          <div className="flex items-center justify-between">
            <button className="rounded-full bg-white p-2 shadow-sm">
              <ChevronLeft className="h-4 w-4 text-emerald-800" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                Habit stack &middot; complete
              </span>
              <DotRow current={5} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">
              5/5 ✓
            </span>
          </div>

          <Card className="mt-6 flex-1 overflow-hidden rounded-3xl border-none shadow-lg">
            <CardContent className="flex h-full flex-col p-6">
              <div className="mt-4 flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-lime-200">
                    <Repeat className="h-10 w-10 text-emerald-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-6 text-center font-serif text-[24px] leading-tight text-emerald-950">
                One sentence.
                <br />
                <span className="italic text-emerald-700">One steady sprout.</span>
              </h1>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-emerald-900/70">
                Your care routine is now attached to something you already do.
                No app-checking required.
              </p>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Habit stack saved
                </p>
                <p className="mt-1 font-serif text-[13px] italic text-emerald-950">
                  &ldquo;After coffee &rarr; check Monstera&rdquo;
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-800/70">
                  <Bell className="h-3 w-3" />
                  Gentle nudge queued for 7:15 AM
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Create My Habit Reminder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or add a second stack later
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PhoneFrame>
    </div>
  </div>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const HabitStackingVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="habit-stacking-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Habit Stacking &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: The Steady Sprout
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Chain-Link Visual"
        subtitle="Two big rounded links &mdash; existing habit + plant check &mdash; joined by a chain icon and a dark &ldquo;recipe&rdquo; card (here: The Formula)."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Daily Routine Timeline"
        subtitle="A morning timeline with 4 anchor points; the plant check pops between coffee and commute under a dashed &lsquo;stack&rsquo; bracket (here: Morning Grind)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Fill-in-the-Blank Madlibs"
        subtitle="A giant dark sentence with two tappable blanks (amber = existing habit, lime = plant check) plus swap suggestions below."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Illustrated Vignette"
        subtitle="A warm hand-drawn SVG scene of Luna the cat and a desk plant, linked by a floating chain icon (here: The Furry Friend)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Habit Picker Grid"
        subtitle="Card 5 in full &mdash; 6 anchor habit tiles with cue times, live sentence preview, and the primary &ldquo;Create My Habit Reminder&rdquo; CTA."
      />
      <VariationFive />

      <FinalCTAPreview />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default HabitStackingVariations;
