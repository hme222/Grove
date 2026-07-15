import React from "react";
import {
  Leaf,
  Sparkles,
  Droplets,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Coffee,
  Cat,
  Sun,
  Sprout,
  Anchor,
  Feather,
  Wind,
  Scissors,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * BehavioralChangeWidgets
 * ------------------------------------------------------------
 * Two mobile portrait micro-interaction widgets designed with
 * CBT + habit-loop psychology (Noom-style) and a Lo-Fi Cozy
 * paper aesthetic:
 *   1. The Guilt Reframer  (Heartbroken Optimist)
 *   2. The Habit Anchor    (Steady Sprout)
 *
 * Standalone. No routing, no backend, no tests.
 * ------------------------------------------------------------
 */

/* Cozy palette */
const C = {
  cream: "#F5F0E4",
  paper: "#FBF6EA",
  oatmeal: "#E8D5B7",
  sage: "#A3B18A",
  sageDark: "#6B7A56",
  forest: "#344E41",
  forestDeep: "#22331E",
  terracotta: "#C08552",
  terracottaDark: "#8B5A2B",
  rose: "#D8A48F",
  amber: "#E8B87A",
  ink: "#3B2F2A",
};

/* Phone frame */
const PhoneFrame = ({ children, tone = "bg-[#F5F0E4]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] p-3 shadow-2xl shadow-emerald-950/20" style={{ background: C.forestDeep }}>
      <div className={`relative overflow-hidden rounded-[42px] ${tone}`} style={{ height: 820 }}>
        <div className="flex items-center justify-between px-7 pt-4 pb-2 font-mono text-[11px] font-semibold" style={{ color: C.ink }}>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="ml-1 h-2 w-4 rounded-sm border" style={{ borderColor: C.ink }} />
          </span>
        </div>
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full" style={{ background: C.forestDeep }} />
        <div className="relative h-[calc(100%-30px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const VariationLabel = ({ number, title, subtitle, badge }) => (
  <div className="mx-auto max-w-3xl px-6 pt-20 pb-8 text-left">
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-50"
        style={{ background: C.forest }}>
        Variation {number}
      </span>
      <Badge variant="outline" className="rounded-full border-2 px-3 py-1 text-xs" style={{ borderColor: C.sage, background: C.paper, color: C.forest }}>
        {badge}
      </Badge>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mt-3 font-serif text-2xl leading-tight" style={{ color: C.forest }}>{title}</h2>
    {subtitle && <p className="mt-1 max-w-2xl text-sm" style={{ color: C.forest + "AA" }}>{subtitle}</p>}
  </div>
);

/* Paper texture */
const PaperTexture = () => (
  <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
    style={{
      backgroundImage:
        "radial-gradient(circle at 30% 20%, #000 1px, transparent 1px), radial-gradient(circle at 70% 60%, #000 1px, transparent 1px)",
      backgroundSize: "18px 18px, 22px 22px",
    }} />
);

/* Pixel Sprout — slightly droopy variant for V1 */
const PIX = 8;
const DROOPY = [
  "..............",
  "......ss......",
  ".....slLl.....",
  "....LLyLLL....",
  "..LLLwLLwLL...",
  "..LLLeLLeLL...",
  "..LLLLnLLLL...",
  "..cLLLLLLLc...",
  "...LLyLLLL....",
  ".....SS.......",
  "....pppp......",
  "...pppppp.....",
  "...oooooo.....",
  "....oooo......",
];
const droopyMap = {
  s: C.sageDark,
  S: C.sageDark,
  L: C.sage,
  l: C.sageDark,
  y: C.amber, // yellow leaf pixel
  w: C.paper,
  e: C.forestDeep,
  n: C.forestDeep, // small frown
  c: C.rose,
  p: C.terracotta,
  o: C.terracottaDark,
};
const DroopySprout = ({ scale = 1 }) => {
  const width = DROOPY[0].length * PIX;
  const height = DROOPY.length * PIX;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width * scale} height={height * scale} shapeRendering="crispEdges" aria-hidden="true">
      {DROOPY.map((row, y) =>
        row.split("").map((ch, x) => {
          const color = droopyMap[ch];
          if (!color) return null;
          return <rect key={`${x}-${y}`} x={x * PIX} y={y * PIX} width={PIX} height={PIX} fill={color} />;
        })
      )}
    </svg>
  );
};

/* ================================================================
   VARIATION 1 — The Guilt Reframer (CBT)
   ================================================================ */
const VariationOne = () => (
  <PhoneFrame tone="bg-[#F5F0E4]" testId="v1-guilt-reframer">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-5 pb-5 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="rounded-full border-2 p-1.5" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
            <Heart className="h-3 w-3" style={{ color: C.rose }} />
            CBT · reframe
          </span>
        </div>
        <span className="rounded-full border-2 px-2 py-0.5 font-mono text-[9px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
          2 min
        </span>
      </div>

      {/* Card */}
      <div className="mt-4 rounded-3xl border-2 p-5 shadow-[0_5px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        {/* Hero */}
        <div className="flex flex-col items-center">
          <DroopySprout scale={1.6} />
          <span className="mt-2 rounded-full border-2 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
            style={{ borderColor: C.forest, background: C.amber, color: C.forest }}>
            One yellow leaf spotted
          </span>
        </div>

        <h1 className="mt-4 text-center font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
          Spotted a yellow leaf?
          <br />
          <em style={{ color: C.terracottaDark }}>Let&rsquo;s decode it.</em>
        </h1>
        <p className="mt-2 text-center text-[12px] leading-relaxed" style={{ color: C.forest + "CC" }}>
          Your brain jumped to &ldquo;I failed.&rdquo; That&rsquo;s a habit &mdash; not a truth.
          Three tiny steps to soften it.
        </p>
      </div>

      {/* 3-step flow */}
      <div className="mt-4 space-y-3">
        {/* Step 1 — completed */}
        <div className="relative rounded-2xl border-2 p-3 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.sage + "40" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.paper }}>
              <Check className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.sageDark }}>Step 1 · Reframe</p>
              <p className="mt-0.5 font-serif text-[14px] font-bold italic" style={{ color: C.forest }}>
                &ldquo;It&rsquo;s not a failure. It&rsquo;s just data.&rdquo;
              </p>
              <p className="mt-1 text-[11px] leading-snug" style={{ color: C.forest + "CC" }}>
                Yellow leaves are how plants talk. You listened &mdash; that&rsquo;s already care.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 — active checklist */}
        <div className="rounded-2xl border-2 p-3 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2" style={{ background: C.amber, borderColor: C.forest, color: C.forest }}>
              <span className="text-xs font-bold">2</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>Step 2 · Investigate</p>
              <p className="mt-0.5 font-serif text-[14px] font-bold" style={{ color: C.forest }}>
                Poke the soil &mdash; wet or dry?
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button data-testid="v1-soil-wet" className="rounded-xl border-2 py-2 text-left"
                  style={{ borderColor: C.forest, background: "#DFF0F5", boxShadow: `0 3px 0 0 ${C.forest}`, transform: "translateY(0)" }}>
                  <div className="flex items-center gap-2 px-3">
                    <Droplets className="h-4 w-4" style={{ color: "#075985" }} />
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: C.forest }}>Wet</p>
                      <p className="font-mono text-[9px]" style={{ color: C.forest + "AA" }}>= overwatered</p>
                    </div>
                    <Check className="ml-auto h-4 w-4" style={{ color: C.sageDark }} />
                  </div>
                </button>
                <button data-testid="v1-soil-dry" className="rounded-xl border-2 py-2 text-left"
                  style={{ borderColor: C.forest + "66", background: C.paper }}>
                  <div className="flex items-center gap-2 px-3">
                    <Sun className="h-4 w-4" style={{ color: C.amber }} />
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: C.forest }}>Dry</p>
                      <p className="font-mono text-[9px]" style={{ color: C.forest + "AA" }}>= thirsty</p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="mt-2 text-[11px] italic" style={{ color: C.forest + "AA" }}>
                Most yellow leaves &mdash; ~70% &mdash; are from wet feet, not thirst.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 — action */}
        <div className="rounded-2xl border-2 border-dashed p-3" style={{ borderColor: C.forest + "77", background: C.oatmeal + "60" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2" style={{ background: C.paper, borderColor: C.forest, color: C.forest }}>
              <span className="text-xs font-bold">3</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>Step 3 · Small action</p>
              <p className="mt-0.5 font-serif text-[14px] font-bold" style={{ color: C.forest }}>
                Snip &middot; dry &middot; breathe.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
                  <Scissors className="h-2.5 w-2.5" /> Snip the yellow leaf
                </span>
                <span className="flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
                  <Wind className="h-2.5 w-2.5" /> Let soil dry 3 days
                </span>
                <span className="flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
                  <Heart className="h-2.5 w-2.5" /> Say &ldquo;good job&rdquo;
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-snug" style={{ color: C.forest + "CC" }}>
                Then step away for a minute. You&rsquo;re doing great.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <button data-testid="v1-cta-reframe-complete"
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 py-3.5 font-mono text-[12px] font-bold uppercase tracking-widest shadow-[0_4px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.forest, color: C.cream }}>
          <Sparkles className="h-4 w-4" style={{ color: C.amber }} />
          Reframe Complete &nbsp;&middot;&nbsp; +10 Confidence
        </button>
        <p className="mt-2 text-center font-mono text-[9px]" style={{ color: C.forest + "88" }}>
          Cognitive reframing works best when practised weekly.
        </p>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 2 — The Habit Anchor (Implementation Intentions)
   ================================================================ */
const DropdownRow = ({ label, icon: Icon, selected, sub, testId }) => (
  <button data-testid={testId}
    className="flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left shadow-[0_3px_0_0_#3B2F2A]"
    style={{ borderColor: C.forest, background: C.paper }}>
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2" style={{ borderColor: C.forest, background: C.oatmeal }}>
      <Icon className="h-5 w-5" style={{ color: C.forest }} />
    </div>
    <div className="flex-1">
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest + "AA" }}>{label}</p>
      <p className="mt-0.5 font-serif text-[15px] font-bold" style={{ color: C.forest }}>{selected}</p>
      {sub && <p className="font-mono text-[9px]" style={{ color: C.forest + "AA" }}>{sub}</p>}
    </div>
    <ChevronDown className="h-4 w-4" style={{ color: C.forest }} />
  </button>
);

const VariationTwo = () => (
  <PhoneFrame tone="bg-[#EDE4CD]" testId="v2-habit-anchor">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-5 pb-5 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="rounded-full border-2 p-1.5" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
          <X className="h-3.5 w-3.5" />
        </button>
        <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
          <Anchor className="h-3 w-3" style={{ color: C.sageDark }} />
          Habit anchor
        </span>
        <span className="rounded-full border-2 px-2 py-0.5 font-mono text-[9px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
          1 min
        </span>
      </div>

      {/* Diary page header */}
      <div className="mt-4 rounded-t-3xl border-2 border-b-0 p-4 pb-3 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: C.forest + "AA" }}>
          Grove Diary &middot; today&rsquo;s intention
        </p>
        <h1 className="mt-1 font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
          Anchor your care routine.
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed" style={{ color: C.forest + "CC" }}>
          Behavior science says: routines that <em>stack</em> onto existing habits are
          <strong> 2.7&times; more likely</strong> to stick. Let&rsquo;s wire yours.
        </p>
      </div>

      {/* Diary body — the builder */}
      <div className="rounded-b-3xl border-2 border-t-0 p-4 shadow-[0_5px_0_0_#3B2F2A]"
        style={{
          borderColor: C.forest,
          background: C.paper,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 25px, ${C.forest}0A 25px 26px)`,
        }}>
        {/* Sentence formula */}
        <div className="rounded-2xl border-2 p-3" style={{ borderColor: C.forest, background: C.oatmeal + "55" }}>
          <p className="font-serif text-[15px] leading-[1.6]" style={{ color: C.forest }}>
            &ldquo;When I{" "}
            <span className="rounded-md px-1.5 py-0.5 font-mono text-[13px] font-bold" style={{ background: C.amber, color: C.forest }}>
              grind my morning coffee
            </span>
            , I will check my{" "}
            <span className="rounded-md px-1.5 py-0.5 font-mono text-[13px] font-bold" style={{ background: C.sage, color: C.forest }}>
              8-Bit Sprout
            </span>
            .&rdquo;
          </p>
          <p className="mt-1 font-mono text-[9px] italic" style={{ color: C.forest + "99" }}>
            &mdash; implementation intention, Gollwitzer 1999
          </p>
        </div>

        {/* Two builders */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
              Step 1 &middot; When I
            </p>
            <DropdownRow
              testId="v2-habit-select"
              icon={Coffee}
              label="Daily habit"
              selected="Grind my morning coffee"
              sub="Every day · ~7:15 AM"
            />
            {/* Alt options */}
            <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
              {[
                { icon: Cat, label: "Feed the cat" },
                { icon: Sun, label: "Open the blinds" },
              ].map((o) => (
                <button key={o.label}
                  className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-mono text-[10px] font-bold"
                  style={{ borderColor: C.forest + "66", background: C.paper, color: C.forest }}>
                  <o.icon className="h-2.5 w-2.5" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connector arrow */}
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] font-bold" style={{ color: C.forest + "AA" }}>
            <span className="h-px w-8" style={{ background: C.forest + "44" }} />
            <ArrowRight className="h-3 w-3" />
            <span className="h-px w-8" style={{ background: C.forest + "44" }} />
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
              Step 2 &middot; I will check my
            </p>
            <DropdownRow
              testId="v2-plant-select"
              icon={Sprout}
              label="Plant"
              selected="8-Bit Sprout"
              sub="on your desk &middot; virtual"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
              {[
                { icon: Leaf, label: "Real Monstera" },
                { icon: Feather, label: "Bathroom Fern" },
              ].map((o) => (
                <button key={o.label}
                  className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-mono text-[10px] font-bold"
                  style={{ borderColor: C.forest + "66", background: C.paper, color: C.forest }}>
                  <o.icon className="h-2.5 w-2.5" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence forecast */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 p-3" style={{ borderColor: C.forest, background: C.sage + "35" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2" style={{ background: C.paper, borderColor: C.forest }}>
            <Sparkles className="h-4 w-4" style={{ color: C.sageDark }} />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.sageDark }}>
              Confidence forecast
            </p>
            <p className="text-[12px] leading-snug" style={{ color: C.forest }}>
              <strong>78%</strong> of Groves who stack this way still tend their plant
              on <strong>day 30</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <button data-testid="v2-cta-lock-loop"
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 py-3.5 font-mono text-[12px] font-bold uppercase tracking-widest shadow-[0_4px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.forest, color: C.cream }}>
          <Anchor className="h-4 w-4" style={{ color: C.amber }} />
          Lock My Cozy Habit Loop
        </button>
        <p className="mt-2 text-center font-mono text-[9px]" style={{ color: C.forest + "88" }}>
          Gentle nudge queued for tomorrow, 7:15 AM.
        </p>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const BehavioralChangeWidgets = () => (
  <div className="min-h-screen font-sans" style={{ background: "#EAE2CE" }} data-testid="behavioral-change-widgets-page">
    <header className="border-b" style={{ borderColor: C.sage, background: C.paper }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.forest, color: C.cream }}>
            <Heart className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg" style={{ color: C.forest }}>
            Grove &middot; Behavioral-change widgets &mdash; CBT + habit-loop
          </span>
        </div>
        <span className="hidden font-mono text-xs sm:block" style={{ color: C.forest + "AA" }}>
          Noom-style · self-efficacy
        </span>
      </div>
    </header>

    <VariationLabel
      number={1}
      badge="Heartbroken Optimist"
      title="The Guilt Reframer &mdash; CBT cognitive reframing"
      subtitle="A 3-step reframe flow anchored by a droopy pixel sprout. Softens the &ldquo;I&rsquo;m a plant killer&rdquo; automatic thought into curious observation."
    />
    <VariationOne />

    <VariationLabel
      number={2}
      badge="Steady Sprout"
      title="The Habit Anchor &mdash; implementation intentions"
      subtitle="A cozy diary spread that wires plant care onto an existing daily habit using the Gollwitzer &ldquo;when-then&rdquo; formula, with confidence forecast."
    />
    <VariationTwo />

    <footer className="border-t" style={{ borderColor: C.sage, background: C.paper }}>
      <div className="mx-auto max-w-5xl px-6 py-8 font-mono text-xs" style={{ color: C.forest + "AA" }}>
        Static concepts only &middot; no backend, no analytics wired.
      </div>
    </footer>
  </div>
);

export default BehavioralChangeWidgets;
