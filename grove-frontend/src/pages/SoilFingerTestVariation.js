import React from "react";
import {
  Leaf,
  Sparkles,
  Droplets,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Hand,
  Timer,
  Cookie,
  Waves,
  BookOpen,
  Sprout,
  Trophy,
  Heart,
  CircleDot,
  AlertCircle,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * SoilFingerTestVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Soil Finger-Test"
 * master lesson for the Recovering Black Thumb (Rebirth Track).
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data
   ================================================================ */
const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    headline: "Erase the plant guilt.",
    body:
      "Most plants don\u2019t die from a lack of love \u2014 they die from <strong>drowning</strong>. Throw away any rigid watering schedule that says &ldquo;water every Tuesday.&rdquo; From today, we listen to the soil, not the calendar.",
    cta: "I\u2019m ready to unlearn",
    icon: Heart,
    accent: "from-rose-100 via-amber-50 to-emerald-50",
    ring: "text-rose-600",
    chip: "bg-rose-100 text-rose-800",
  },
  {
    n: 2,
    header: "Card 2 of 5 · The Probe",
    headline: "Your natural moisture sensor.",
    body:
      "Use your index finger as a physical moisture probe. Push it <strong>2 inches deep</strong> into the soil &mdash; up to your second knuckle. That&rsquo;s the whole tool. No gadgets, no apps.",
    cta: "Got it &mdash; finger as probe",
    icon: Hand,
    accent: "from-amber-100 via-orange-50 to-emerald-50",
    ring: "text-amber-700",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 3,
    header: "Card 3 of 5 · The Walk Away",
    headline: "Is it damp?",
    body:
      "If the soil feels <strong>damp and cool</strong> &mdash; like a wrung-out sponge &mdash; walk away. <strong>No water today.</strong> Your plant is quietly drinking what it already has.",
    cta: "Walk away &mdash; got it",
    icon: Waves,
    accent: "from-sky-100 via-blue-50 to-emerald-50",
    ring: "text-sky-700",
    chip: "bg-sky-100 text-sky-900",
    outcome: "walk",
  },
  {
    n: 4,
    header: "Card 4 of 5 · The Water Sign",
    headline: "Is it dry?",
    body:
      "If the soil feels <strong>dry and dusty</strong> &mdash; like cake crumbs falling off your finger &mdash; it&rsquo;s ready for a thorough drink. Water slowly until it runs from the drainage hole.",
    cta: "Give it a drink &mdash; got it",
    icon: Cookie,
    accent: "from-amber-100 via-yellow-50 to-orange-50",
    ring: "text-amber-600",
    chip: "bg-amber-100 text-amber-900",
    outcome: "water",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    headline: "60 seconds. One plant. Real answer.",
    body:
      "Go to your nearest plant right now. Press your finger 2 inches into the soil. Then tap what you found below &mdash; there is no wrong answer.",
    cta: "Log my first soil test",
    icon: Timer,
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
        className="rounded-full border-emerald-300 bg-emerald-50 px-3 py-1 text-xs text-emerald-900"
      >
        Recovering Black Thumb &middot; Rebirth Track
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
   VARIATION 1 — Tactile / Sensory Illustration
   Featured card: Card 2 (The Probe) — showcases the touch mechanic
   ================================================================ */
const FingerIllustration = () => (
  <div className="relative mx-auto h-52 w-52">
    <svg viewBox="0 0 200 200" className="h-full w-full">
      {/* Pot rim */}
      <ellipse cx="100" cy="130" rx="72" ry="16" fill="#7C2D12" opacity="0.25" />
      <ellipse cx="100" cy="128" rx="72" ry="14" fill="#B45309" />
      <path d="M32,128 L44,190 L156,190 L168,128 Z" fill="#92400E" />

      {/* Soil */}
      <ellipse cx="100" cy="128" rx="66" ry="10" fill="#3F2A17" />
      <ellipse cx="100" cy="128" rx="60" ry="8" fill="#5C3A20" />

      {/* Finger */}
      <g transform="translate(90,20)">
        <rect x="0" y="0" width="24" height="110" rx="12" fill="#F5D0A9" />
        <rect x="0" y="105" width="24" height="12" rx="4" fill="#E8B98A" />
        {/* Knuckle line */}
        <line
          x1="0"
          y1="60"
          x2="24"
          y2="60"
          stroke="#D97706"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.7"
        />
        <text x="30" y="64" fontSize="8" fill="#B45309" fontWeight="700">
          2&quot; mark
        </text>
        {/* Nail */}
        <rect x="4" y="2" width="16" height="6" rx="3" fill="#FDE68A" />
      </g>

      {/* Depth indicator */}
      <g>
        <line
          x1="60"
          y1="128"
          x2="60"
          y2="160"
          stroke="#065F46"
          strokeDasharray="2 3"
          strokeWidth="1"
        />
        <text x="20" y="150" fontSize="9" fill="#065F46" fontWeight="700">
          2 in
        </text>
      </g>

      {/* Soil crumbs */}
      <circle cx="55" cy="132" r="2" fill="#3F2A17" />
      <circle cx="145" cy="134" r="2.5" fill="#3F2A17" />
      <circle cx="70" cy="140" r="1.5" fill="#5C3A20" />
    </svg>
    {/* Floating "cool sponge" note */}
    <div className="absolute -right-2 top-6 rotate-6 rounded-md bg-white px-2 py-1 text-[9px] font-medium text-emerald-800 shadow-sm">
      Cool &amp; damp?
    </div>
    <div className="absolute -left-1 bottom-4 -rotate-6 rounded-md bg-white px-2 py-1 text-[9px] font-medium text-emerald-800 shadow-sm">
      Dry &amp; dusty?
    </div>
  </div>
);

const VariationOne = () => {
  const card = CARDS[1]; // The Probe
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-tactile">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Soil Finger-Test
            </span>
            <DotRow current={1} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            2/5
          </span>
        </div>

        <FingerIllustration />

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Hand className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />
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
              The Walk Away
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Moisture Meter Gauge
   Featured card: Card 3 (The Walk Away) with needle in "Damp" zone
   ================================================================ */
const MoistureGauge = ({ position = 0.7 }) => {
  // position 0 = bone dry (left), 1 = soggy (right)
  const angle = -90 + position * 180;
  return (
    <div className="relative mx-auto h-40 w-full">
      <svg viewBox="0 0 300 160" className="h-full w-full">
        {/* Zones — arcs */}
        <path
          d="M40,140 A110,110 0 0 1 82,50"
          stroke="#F59E0B"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M82,50 A110,110 0 0 1 150,30"
          stroke="#FBBF24"
          strokeWidth="20"
          fill="none"
        />
        <path
          d="M150,30 A110,110 0 0 1 218,50"
          stroke="#10B981"
          strokeWidth="20"
          fill="none"
        />
        <path
          d="M218,50 A110,110 0 0 1 260,140"
          stroke="#0369A1"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />

        {/* Zone labels */}
        <text x="40" y="155" fontSize="9" fill="#B45309" fontWeight="700">
          Bone dry
        </text>
        <text x="90" y="45" fontSize="9" fill="#B45309" fontWeight="700">
          Dry
        </text>
        <text x="140" y="20" fontSize="9" fill="#065F46" fontWeight="700">
          Just right
        </text>
        <text x="200" y="45" fontSize="9" fill="#065F46" fontWeight="700">
          Damp
        </text>
        <text x="220" y="155" fontSize="9" fill="#075985" fontWeight="700">
          Soggy
        </text>

        {/* Needle */}
        <g transform={`translate(150,140) rotate(${angle})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-95"
            stroke="#065F46"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon points="0,-100 -6,-85 6,-85" fill="#065F46" />
        </g>
        <circle cx="150" cy="140" r="10" fill="#065F46" />
        <circle cx="150" cy="140" r="4" fill="#FBFAF5" />
      </svg>
      <p className="absolute inset-x-0 -bottom-1 text-center text-[10px] font-medium text-emerald-800/70">
        Your reading &middot; <span className="font-bold text-emerald-900">Damp</span>
      </p>
    </div>
  );
};

const VariationTwo = () => {
  const card = CARDS[2]; // Walk Away / Damp
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-sky-50 via-white to-emerald-50"
      testId="v2-moisture-gauge"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Reading the meter
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            3/5
          </span>
        </div>

        <div className="mt-6 rounded-3xl border border-sky-100 bg-white/70 p-4 backdrop-blur">
          <MoistureGauge position={0.72} />
        </div>

        <Card className="mt-5 rounded-3xl border-none bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
            >
              {card.header}
            </span>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Verdict banner */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-900 p-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800">
                <ThumbsUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200">
                  Verdict
                </p>
                <p className="text-[13px] font-semibold">
                  Walk away &middot; check again in 2 days
                </p>
              </div>
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
   VARIATION 3 — Diagnostic Split (Damp vs Dry)
   Shows Cards 3 & 4 side-by-side as a decision card
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame tone="bg-[#F5F3EC]" testId="v3-split-diagnostic">
    <div className="flex h-full flex-col px-5 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-white p-2 shadow-sm">
          <ChevronLeft className="h-4 w-4 text-emerald-800" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
            The two outcomes
          </span>
          <DotRow current={3} />
        </div>
        <span className="text-[10px] font-semibold text-emerald-700">3+4/5</span>
      </div>

      <div className="mt-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
          Cards 3 &amp; 4 &middot; The Decision
        </p>
        <h1 className="mt-2 font-serif text-[22px] leading-tight text-emerald-950">
          What did your finger find?
        </h1>
        <p className="mt-2 text-[12px] text-emerald-800/70">
          Tap the one that matches. The soil will always tell you.
        </p>
      </div>

      {/* Damp panel */}
      <Card className="mt-5 rounded-3xl border-none bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${CARDS[2].chip}`}>
              Damp &amp; cool
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
              <Waves className="h-4 w-4 text-sky-700" />
            </span>
          </div>
          <p className="mt-2 font-serif text-[18px] text-emerald-950">
            Feels like a wrung-out sponge
          </p>
          <div className="mt-2 flex items-start gap-2">
            <ThumbsUp className="mt-0.5 h-3.5 w-3.5 text-emerald-700" />
            <p className="text-[12px] font-semibold text-emerald-900">
              Walk away &mdash; no water today
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="my-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-800/50">
        <span className="h-px flex-1 bg-emerald-200" />
        or
        <span className="h-px flex-1 bg-emerald-200" />
      </div>

      {/* Dry panel */}
      <Card className="rounded-3xl border-none bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${CARDS[3].chip}`}>
              Dry &amp; dusty
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
              <Cookie className="h-4 w-4 text-amber-700" />
            </span>
          </div>
          <p className="mt-2 font-serif text-[18px] text-emerald-950">
            Like cake crumbs falling off
          </p>
          <div className="mt-2 flex items-start gap-2">
            <Droplets className="mt-0.5 h-3.5 w-3.5 text-sky-700" />
            <p className="text-[12px] font-semibold text-emerald-900">
              Give it a thorough drink
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reminder callout */}
      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-white/70 p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <p className="text-[11px] leading-relaxed text-emerald-950">
          When in doubt, wait a day. Roots love a little thirst &mdash; they
          hate wet socks.
        </p>
      </div>

      <div className="mt-auto pt-4">
        <Button
          className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
          data-testid="v3-cta-continue"
        >
          Got it &mdash; both signs make sense
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 4 — Notebook / Sticky-Note Journal
   Featured card: Card 1 (The Hook) — warm, handwritten Rebirth feel
   ================================================================ */
const VariationFour = () => {
  const card = CARDS[0];
  return (
    <PhoneFrame tone="bg-[#FDF9EE]" testId="v4-notebook">
      {/* Notebook lines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 31px, #E8D9B5 32px)",
          backgroundSize: "100% 32px",
          opacity: 0.45,
        }}
      />
      {/* Left margin line */}
      <div className="pointer-events-none absolute inset-y-0 left-10 w-px bg-rose-300/60" />

      <div className="relative flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="text-emerald-900/70">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-800/70">
            The Rebirth Notebook &middot; Entry 01
          </p>
          <BookOpen className="h-4 w-4 text-emerald-800/70" />
        </div>

        {/* Washi tape */}
        <div className="mt-6 flex justify-center">
          <span className="-rotate-2 rounded-sm bg-emerald-200/80 px-6 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-900 shadow-sm">
            {card.header}
          </span>
        </div>

        {/* Handwritten style heading */}
        <h1
          className="mt-6 pl-3 text-[30px] leading-[1.1] text-emerald-950"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        >
          {card.headline}
        </h1>

        <p
          className="mt-4 pl-3 text-[14px] leading-[1.7] text-emerald-900/85"
          style={{ fontFamily: "Georgia, serif" }}
          dangerouslySetInnerHTML={{ __html: card.body }}
        />

        {/* Sticky note */}
        <div className="mt-6 flex justify-end">
          <div className="relative w-56 rotate-3 rounded-sm bg-amber-200 p-3 shadow-md">
            <span className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rounded-sm bg-amber-300/70 shadow-sm" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-900">
              Sticky reminder
            </p>
            <p
              className="mt-1 text-[12px] leading-snug text-amber-950"
              style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
            >
              &ldquo;The soil tells me when. Not the calendar.&rdquo;
            </p>
          </div>
        </div>

        {/* Doodle */}
        <div className="mt-6 flex items-center gap-2 pl-3 text-emerald-800/60">
          <Sprout className="h-4 w-4" />
          <span className="h-px flex-1 border-t border-dashed border-emerald-800/40" />
          <Droplets className="h-4 w-4" />
          <span className="h-px flex-1 border-t border-dashed border-emerald-800/40" />
          <Heart className="h-4 w-4" />
        </div>

        <div className="mt-auto pb-2">
          <div className="mb-3 flex items-center justify-center">
            <DotRow current={0} />
          </div>
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v4-cta-turn-page"
          >
            {card.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p
            className="mt-3 text-center text-[11px] italic text-emerald-800/50"
            style={{ fontFamily: "Georgia, serif" }}
          >
            &mdash; page 1 of 5 &mdash;
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 5 — 60-Second Action Card (Card 5)
   Featured card: Card 5 with Water Day vs Walk Away toggle
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-action-timer"
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
              60-Second Action
            </span>
            <DotRow current={4} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            5/5
          </span>
        </div>

        {/* Timer ring */}
        <div className="relative mt-6 flex justify-center">
          <svg viewBox="0 0 120 120" className="h-32 w-32">
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#D1FAE5"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#065F46"
              strokeWidth="8"
              fill="none"
              strokeDasharray="326"
              strokeDashoffset="82"
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className="h-5 w-5 text-emerald-800" />
            <span className="mt-1 font-serif text-2xl leading-none text-emerald-950">
              0:45
            </span>
            <span className="text-[10px] font-medium text-emerald-800/60">
              take your time
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="mt-5">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
          >
            {card.header}
          </span>
          <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
            {card.headline}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/80">
            {card.body}
          </p>
        </div>

        {/* Decision toggle */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            data-testid="v5-walk-away"
            className="flex flex-col items-center rounded-2xl border-2 border-sky-200 bg-white/80 p-4 transition"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100">
              <Waves className="h-5 w-5 text-sky-700" />
            </div>
            <p className="mt-2 text-[13px] font-bold text-emerald-950">
              Walk Away Day
            </p>
            <p className="mt-0.5 text-[10px] text-emerald-800/60">
              Soil was damp
            </p>
          </button>
          <button
            data-testid="v5-water-day"
            className="flex flex-col items-center rounded-2xl border-2 border-emerald-800 bg-emerald-900 p-4 text-white shadow-md ring-2 ring-emerald-800"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800">
              <Droplets className="h-5 w-5 text-lime-200" />
            </div>
            <p className="mt-2 text-[13px] font-bold">Water Day</p>
            <p className="mt-0.5 text-[10px] text-emerald-100/80">
              Soil was dry
            </p>
            <Check className="mt-1 h-4 w-4 text-lime-200" />
          </button>
        </div>

        {/* Optional plant selector */}
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Plant tested
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Leaf className="h-4 w-4 text-emerald-800" />
            </div>
            <span className="text-[13px] font-semibold text-emerald-950">
              Pothos by the window
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-emerald-800/50" />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-log-test"
          >
            {card.cta}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            Your first soil-based decision. That&rsquo;s a real win.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final "Log My First Soil Test" endpoint
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
      After all 5 cards &mdash; the Rebirth win
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: the celebratory first-log confirmation and the
      primary &ldquo;Log My First Soil Test&rdquo; CTA into the main app.
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
                Rebirth Course &middot; complete
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
                    <Trophy className="h-10 w-10 text-emerald-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-6 text-center font-serif text-[24px] leading-tight text-emerald-950">
                You&rsquo;re not a black thumb.
                <br />
                <span className="italic text-emerald-700">
                  You&rsquo;re a listener now.
                </span>
              </h1>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-emerald-900/70">
                The calendar is gone. From here on, your finger &mdash; and the
                soil &mdash; do the talking.
              </p>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  First entry
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-emerald-800" />
                  <span className="text-[13px] font-semibold text-emerald-950">
                    Pothos &middot; Water Day &middot; just now
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Log My First Soil Test
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or add another plant first
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
const SoilFingerTestVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="soil-finger-test-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; The Soil Finger-Test &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: Recovering Black Thumb
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Tactile / Sensory Illustration"
        subtitle="A big custom SVG of a finger meeting soil at the 2-inch mark. Sensory-first hero anchoring every card (here: The Probe)."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Moisture Meter Gauge"
        subtitle="A semi-circle gauge with a swinging needle across Bone-dry → Soggy. The current card&rsquo;s outcome reads live (here: Damp / Walk Away)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Split Diagnostic (Damp vs Dry)"
        subtitle="Cards 3 and 4 merged into one decision screen &mdash; two tone-coded panels stacked with a soft &lsquo;or&rsquo; divider."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Notebook / Sticky-Note Journal"
        subtitle="A warm handwritten notebook feel &mdash; ruled paper, washi tape header, italic serif copy, and a rotated sticky-note quote. Fits the Rebirth track (here: The Hook)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="60-Second Action Card"
        subtitle="Card 5 in full &mdash; countdown timer ring, Walk-Away vs Water-Day toggle, plant selector, and the primary &ldquo;Log My First Soil Test&rdquo; CTA."
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

export default SoilFingerTestVariations;
