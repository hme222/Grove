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
  ShieldCheck,
  Thermometer,
  LifeBuoy,
  Wind,
  Scale,
  Waves,
  AlertCircle,
  HeartHandshake,
  Heart,
  Stethoscope,
  ClipboardCheck,
  Trophy,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * PlantERVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Plant ER Triage"
 * master lesson for the Accidental Guardian (Rescue Track).
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data
   ================================================================ */
export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Deep breath",
    headline: "Suddenly have a plant with zero instructions?",
    body:
      "Don&rsquo;t panic. You don&rsquo;t need to become an expert tonight &mdash; you just need to keep it stable. Three simple triage steps will stop the immediate risk while you learn the rest.",
    cta: "I\u2019m ready &mdash; three steps",
    icon: LifeBuoy,
    accent: "from-rose-100 via-amber-50 to-emerald-50",
    ring: "text-rose-600",
    chip: "bg-rose-100 text-rose-800",
    step: null,
  },
  {
    n: 2,
    header: "Card 2 of 5 · Step 1",
    eyebrow: "Draft Defense",
    headline: "Move it away from drafts.",
    body:
      "Keep your plant away from direct AC vents, radiators, and doors that keep opening. Extreme temperature swings kill plants faster than almost anything else. A calm corner is a safe corner.",
    cta: "Draft-safe spot &mdash; got it",
    icon: Thermometer,
    accent: "from-sky-100 via-blue-50 to-emerald-50",
    ring: "text-sky-700",
    chip: "bg-sky-100 text-sky-900",
    step: "1",
  },
  {
    n: 3,
    header: "Card 3 of 5 · Step 2",
    eyebrow: "Escape Route",
    headline: "Check for drainage.",
    body:
      "Lift the pot. Does it have drainage holes at the bottom? If it doesn&rsquo;t, <strong>don&rsquo;t pour water into it yet</strong> &mdash; water will pool and rot the roots within days.",
    cta: "Checked the bottom &mdash; got it",
    icon: Droplets,
    accent: "from-emerald-100 via-lime-50 to-emerald-50",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
    step: "2",
  },
  {
    n: 4,
    header: "Card 4 of 5 · Step 3",
    eyebrow: "Moisture Check",
    headline: "Assess the weight.",
    body:
      "Feel the soil and lift the pot. If it&rsquo;s soaking wet, <strong>do nothing</strong>. If the pot feels feather-light and the soil is pulling away from the edges, take it to the sink for a thorough soak.",
    cta: "Weight-check &mdash; got it",
    icon: Scale,
    accent: "from-amber-100 via-yellow-50 to-emerald-50",
    ring: "text-amber-700",
    chip: "bg-amber-100 text-amber-900",
    step: "3",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Lift your mystery plant.",
    body:
      "Check the very bottom of the pot right now. Does it have drainage holes?",
    cta: "Start Triage Guide",
    icon: ClipboardCheck,
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
        className="rounded-full border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-800"
      >
        Accidental Guardian &middot; Rescue Track
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
   VARIATION 1 — Calm ER Triage Card
   Featured card: Card 1 (The Hook)
   ================================================================ */
const VariationOne = () => {
  const card = CARDS[0];
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-triage-card">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-rose-700">
              <LifeBuoy className="h-3 w-3" />
              Plant ER &middot; 3-Step Triage
            </span>
            <DotRow current={0} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            1/5
          </span>
        </div>

        {/* Calm hero — cross badge */}
        <div className="mt-8 flex justify-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg shadow-rose-900/10">
              <div className="relative">
                <svg viewBox="0 0 60 60" className="h-14 w-14">
                  {/* Cross made of leaves */}
                  <path
                    d="M25,4 L35,4 L35,25 L56,25 L56,35 L35,35 L35,56 L25,56 L25,35 L4,35 L4,25 L25,25 Z"
                    fill="#059669"
                    opacity="0.9"
                  />
                  <path
                    d="M27,10 L33,10 L33,27 L50,27 L50,33 L33,33 L33,50 L27,50 L27,33 L10,33 L10,27 L27,27 Z"
                    fill="#F0FDF4"
                  />
                </svg>
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white shadow-md">
              <Heart className="h-4 w-4" />
            </span>
          </div>
        </div>

        <Card className="mt-6 rounded-3xl border-none bg-gradient-to-br from-rose-100 via-amber-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <LifeBuoy className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-rose-700">
              {card.eyebrow}
            </p>
            <h1 className="mt-1 font-serif text-[22px] leading-snug text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />
          </CardContent>
        </Card>

        {/* Three-step preview */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { n: 1, icon: Thermometer, label: "Draft" },
            { n: 2, icon: Droplets, label: "Drainage" },
            { n: 3, icon: Scale, label: "Weight" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="flex flex-col items-center rounded-xl bg-white/70 py-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <Icon className="h-3.5 w-3.5 text-emerald-800" />
                </div>
                <p className="mt-1 text-[10px] font-bold text-emerald-950">
                  Step {s.n}
                </p>
                <p className="text-[9px] text-emerald-800/60">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v1-cta-got-it"
          >
            {card.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            No rush. Two minutes, three steps.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Vertical Step Path with Progress Rings
   Shows steps 1-3 clearly with connecting line
   ================================================================ */
const StepRing = ({ n, active, done }) => (
  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
    <svg viewBox="0 0 56 56" className="absolute h-full w-full">
      <circle
        cx="28"
        cy="28"
        r="24"
        stroke="#D1FAE5"
        strokeWidth="4"
        fill="none"
      />
      {(active || done) && (
        <circle
          cx="28"
          cy="28"
          r="24"
          stroke={done ? "#065F46" : "#F59E0B"}
          strokeWidth="4"
          fill="none"
          strokeDasharray="150"
          strokeDashoffset={done ? "0" : "40"}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      )}
    </svg>
    <div
      className={`z-10 flex h-10 w-10 items-center justify-center rounded-full ${
        done
          ? "bg-emerald-800 text-white"
          : active
            ? "bg-amber-300 text-emerald-950"
            : "bg-white text-emerald-800/50 ring-2 ring-emerald-100"
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">{n}</span>}
    </div>
  </div>
);

const VariationTwo = () => (
  <PhoneFrame tone="bg-[#F5F3EC]" testId="v2-step-path">
    <div className="flex h-full flex-col px-5 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-white p-2 shadow-sm">
          <ChevronLeft className="h-4 w-4 text-emerald-800" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
            The 3-step checklist
          </span>
          <DotRow current={2} />
        </div>
        <span className="text-[10px] font-semibold text-emerald-700">2/5</span>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-700">
          Rescue Track
        </p>
        <h1 className="mt-1 font-serif text-[24px] leading-tight text-emerald-950">
          Do these in order.
        </h1>
        <p className="mt-1 text-[12px] text-emerald-800/70">
          Three tiny checks &mdash; the whole rescue takes 2 minutes.
        </p>
      </div>

      {/* Overall progress */}
      <div className="mt-4 flex items-center gap-3">
        <Progress value={50} className="h-2 flex-1 bg-emerald-100" />
        <span className="text-[11px] font-semibold text-emerald-800">1 of 3</span>
      </div>

      {/* Step list */}
      <div className="relative mt-6">
        <span className="absolute left-7 top-6 bottom-6 w-0.5 rounded-full bg-emerald-100" />
        <div className="space-y-3">
          {[CARDS[1], CARDS[2], CARDS[3]].map((s, i) => {
            const Icon = s.icon;
            const status = i === 0 ? "done" : i === 1 ? "active" : "future";
            return (
              <Card
                key={s.n}
                className={`relative rounded-2xl border-emerald-100 ${
                  status === "active"
                    ? "shadow-md ring-2 ring-amber-300"
                    : "shadow-sm"
                }`}
              >
                <CardContent className="flex items-start gap-3 p-3">
                  <StepRing n={s.step} active={status === "active"} done={status === "done"} />
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${s.ring}`} />
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest ${
                          status === "future" ? "text-emerald-800/40" : "text-emerald-700"
                        }`}
                      >
                        {s.eyebrow}
                      </span>
                      {status === "active" && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-950">
                          Now
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 font-serif text-[16px] leading-snug ${
                        status === "future" ? "text-emerald-950/50" : "text-emerald-950"
                      }`}
                    >
                      {s.headline}
                    </p>
                    {status !== "future" && (
                      <p
                        className="mt-1 text-[11px] leading-relaxed text-emerald-800/70"
                        dangerouslySetInnerHTML={{ __html: s.body }}
                      />
                    )}
                    {status === "active" && (
                      <Button
                        size="sm"
                        className="mt-3 h-9 rounded-full bg-emerald-900 px-4 text-[12px]"
                        data-testid={`v2-cta-step-${s.step}`}
                      >
                        {s.cta}
                        <Check className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom card 5 hint */}
      <Card className="mt-6 rounded-2xl border-none bg-emerald-950 text-emerald-50">
        <CardContent className="flex items-center gap-3 p-3">
          <ClipboardCheck className="h-5 w-5 shrink-0 text-lime-200" />
          <p className="text-[12px] leading-snug">
            After all 3 steps &mdash; a 60-second live check on your plant.
          </p>
        </CardContent>
      </Card>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 3 — Interactive Pot Diagnostic
   Featured card: Card 3 (Drainage check)
   ================================================================ */
const PotDiagnostic = () => (
  <div className="relative mx-auto h-56 w-full">
    <svg viewBox="0 0 300 220" className="h-full w-full">
      {/* Ground surface */}
      <line x1="20" y1="200" x2="280" y2="200" stroke="#065F46" strokeOpacity="0.2" strokeDasharray="3 4" />

      {/* Pot */}
      <path
        d="M80,80 L220,80 L200,190 L100,190 Z"
        fill="#B45309"
        stroke="#7C2D12"
        strokeWidth="1.5"
      />
      <path
        d="M80,80 L220,80 L200,190 L100,190 Z"
        fill="url(#potShade)"
      />
      <ellipse cx="150" cy="80" rx="70" ry="10" fill="#3F2A17" />

      {/* Plant leaves */}
      <g transform="translate(150,70)">
        <path d="M0,0 Q-20,-30 -40,-25 Q-30,-10 0,-5" fill="#059669" />
        <path d="M0,0 Q20,-30 40,-25 Q30,-10 0,-5" fill="#059669" />
        <path d="M0,0 Q0,-40 -10,-45 Q0,-25 0,-5" fill="#10B981" />
      </g>

      {/* Drainage holes callout */}
      <circle cx="130" cy="190" r="4" fill="#3F2A17" />
      <circle cx="150" cy="190" r="4" fill="#3F2A17" />
      <circle cx="170" cy="190" r="4" fill="#3F2A17" />

      {/* Highlight ring around bottom */}
      <ellipse
        cx="150"
        cy="192"
        rx="60"
        ry="10"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="4 3"
      />

      {/* Arrow */}
      <path
        d="M260,190 Q235,180 215,190"
        stroke="#065F46"
        strokeWidth="1.5"
        fill="none"
      />
      <polygon points="215,190 220,187 220,193" fill="#065F46" />
      <text x="260" y="185" fontSize="10" fill="#065F46" fontWeight="700">
        Look here
      </text>

      <defs>
        <linearGradient id="potShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
    {/* Overlays */}
    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      Mystery plant
    </div>
    <div className="absolute right-3 top-3 rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
      Step 2 of 3
    </div>
  </div>
);

const VariationThree = () => {
  const card = CARDS[2]; // Drainage
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-emerald-50 via-white to-lime-50"
      testId="v3-pot-diagnostic"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Diagnostic view
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">3/5</span>
        </div>

        <div className="mt-5 rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
          <PotDiagnostic />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Search className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Two outcomes strip */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-300 bg-white/80 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                  <p className="text-[11px] font-bold text-emerald-950">
                    Holes = OK
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-emerald-800/70">
                  Continue to Step 3
                </p>
              </div>
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-700" />
                  <p className="text-[11px] font-bold text-emerald-950">
                    No holes = wait
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] text-emerald-800/70">
                  Do not water yet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v3-cta-got-it"
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
   VARIATION 4 — Chat-Bot Emergency Assistant
   Grove appears as a calm coach guiding through triage
   ================================================================ */
const VariationFour = () => (
  <PhoneFrame tone="bg-[#F4F1E8]" testId="v4-chat-triage">
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-emerald-100 bg-white/85 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-lime-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              Grove ER &middot; your triage coach
            </p>
            <p className="text-[10px] text-emerald-700">
              Step 2 of 3 in progress
            </p>
          </div>
        </div>
        <button className="rounded-full p-2 hover:bg-emerald-50">
          <X className="h-4 w-4 text-emerald-800" />
        </button>
      </div>

      {/* Progress strip */}
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-white/60 px-5 py-2 backdrop-blur">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex flex-1 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
              s === 1
                ? "bg-emerald-900 text-white"
                : s === 2
                  ? "bg-amber-100 text-amber-900"
                  : "bg-emerald-50 text-emerald-800/50"
            }`}
          >
            {s === 1 ? (
              <Check className="h-3 w-3" />
            ) : (
              <span>{s}</span>
            )}
            Step {s}
          </div>
        ))}
      </div>

      {/* Chat scroll */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* Grove greeting */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[240px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-700">
              {CARDS[0].header}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-emerald-950">
              {CARDS[0].headline}
            </p>
            <p
              className="mt-1.5 text-[12px] leading-relaxed text-emerald-900/75"
              dangerouslySetInnerHTML={{ __html: CARDS[0].body }}
            />
          </div>
        </div>

        {/* User reply */}
        <div className="flex justify-end">
          <div className="max-w-[220px] rounded-2xl rounded-br-md bg-emerald-800 p-3 text-white shadow-sm">
            <p className="text-[12px]">Okay, I&rsquo;m ready ✓</p>
          </div>
        </div>

        {/* Step 1 */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[240px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-sky-700" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-700">
                {CARDS[1].eyebrow}
              </p>
            </div>
            <p className="mt-1 text-[13px] font-semibold text-emerald-950">
              {CARDS[1].headline}
            </p>
            <p
              className="mt-1.5 text-[12px] leading-relaxed text-emerald-900/75"
              dangerouslySetInnerHTML={{ __html: CARDS[1].body }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-full border border-emerald-800 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            Moved it away ✓
          </button>
        </div>

        {/* Step 2 in progress */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[260px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm ring-2 ring-amber-200">
            <div className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-emerald-700" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                {CARDS[2].eyebrow}
              </p>
            </div>
            <p className="mt-1 text-[13px] font-semibold text-emerald-950">
              {CARDS[2].headline}
            </p>
            <p
              className="mt-1.5 text-[12px] leading-relaxed text-emerald-900/75"
              dangerouslySetInnerHTML={{ __html: CARDS[2].body }}
            />
          </div>
        </div>

        {/* Typing */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 delay-150" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600 delay-300" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick reply chips */}
      <div className="border-t border-emerald-100 bg-white/90 px-4 pt-3 pb-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="rounded-full bg-emerald-900 px-3 py-1.5 text-[11px] font-medium text-white"
            data-testid="v4-quick-yes"
          >
            <Check className="mr-1 inline h-3 w-3" /> Yes, it has holes
          </button>
          <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-800">
            No, it&rsquo;s sealed
          </button>
          <button className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            Not sure
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <DotRow current={2} />
          <span className="ml-auto text-[10px] text-emerald-800/60">
            Step 2 of 3
          </span>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 5 — Interactive Yes/No Decision (Card 5)
   Featured card: Card 5 with Yes Drains vs No Sealed toggle
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-yes-no-decision"
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
          <span className="text-[10px] font-semibold text-emerald-700">5/5</span>
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

        {/* Big Yes/No decision */}
        <div className="mt-6 space-y-3">
          <button
            data-testid="v5-yes-drains"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-emerald-800 bg-emerald-900 p-4 text-left text-white shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800">
              <Check className="h-6 w-6 text-lime-200" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
                Yes, it drains
              </p>
              <p className="mt-0.5 text-[14px] font-bold">
                I can see one or more holes
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/80">
                Safe to move on to the weight check &rarr;
              </p>
            </div>
          </button>
          <button
            data-testid="v5-no-sealed"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-rose-200 bg-white p-4 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
              <AlertCircle className="h-6 w-6 text-rose-700" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-700">
                No, it&rsquo;s sealed
              </p>
              <p className="mt-0.5 text-[14px] font-bold text-emerald-950">
                Solid bottom, no holes
              </p>
              <p className="mt-1 text-[11px] text-emerald-800/70">
                We&rsquo;ll walk you through the safe workaround.
              </p>
            </div>
          </button>
        </div>

        {/* Optional plant nickname */}
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Mystery plant nickname
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Leaf className="h-4 w-4 text-emerald-800" />
            </div>
            <input
              type="text"
              defaultValue="Hallway mystery"
              placeholder="e.g. Aunt Sarah&rsquo;s gift"
              className="flex-1 bg-transparent text-[13px] font-medium text-emerald-950 outline-none placeholder:text-emerald-800/40"
              data-testid="v5-input-name"
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-start-triage"
          >
            {card.cta}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            One quick answer &mdash; we&rsquo;ll do the thinking from here.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final "Start Triage Guide" endpoint
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
      After all 5 cards &mdash; the Rescue win
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: the mystery plant now has an owner and a plan.
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
                Triage complete
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
                    <HeartHandshake className="h-10 w-10 text-emerald-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-6 text-center font-serif text-[24px] leading-tight text-emerald-950">
                You didn&rsquo;t panic.
                <br />
                <span className="italic text-emerald-700">
                  You made a plan.
                </span>
              </h1>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-emerald-900/70">
                Your mystery plant has a home, a spot, and three checks. That&rsquo;s
                more than most guardians ever do.
              </p>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Triage saved
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-800" />
                  <span className="text-[13px] font-semibold text-emerald-950">
                    Hallway mystery &middot; drains &middot; needs weight-check
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Start Triage Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or identify the plant first
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
const PlantERVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="plant-er-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Plant ER Triage &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: Accidental Guardian
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Calm ER Triage Card"
        subtitle="A soft first-aid aesthetic &mdash; leafy green cross badge, low-alarm palette, and a 3-step preview strip (here: The Hook)."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Vertical Step Path with Progress Rings"
        subtitle="Three numbered step nodes with connecting spine. Amber ring shows the current step; done steps get an emerald check (here: Step 2 in progress)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Interactive Pot Diagnostic"
        subtitle="A custom SVG of the mystery pot with a dashed highlight around the drainage zone and an arrow pointer. Two-outcome strip below (here: Step 2 Drainage)."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Chat-Bot Emergency Assistant"
        subtitle="Grove ER coach guides you through triage as a chat conversation, with a live 3-step progress strip up top (here: partway through Step 2)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Interactive Yes/No Decision"
        subtitle="Card 5 in full &mdash; big Yes/No panels, mystery plant nickname input, and the primary &ldquo;Start Triage Guide&rdquo; CTA."
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

export default PlantERVariations;
