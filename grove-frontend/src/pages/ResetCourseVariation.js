import React from "react";
import {
  Leaf,
  Sparkles,
  Sun,
  Droplets,
  ArrowRight,
  Check,
  Heart,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Home,
  Compass,
  User,
  Bell,
  X,
  BookOpen,
  Sprout,
  Wind,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * ResetCourseCarouselVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-lesson "Plant Parent Reset"
 * course for the Heartbroken Optimist persona.
 *
 * All variations share the same lesson content (verbatim from
 * spec) and differ only in visual carousel mechanic.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data (verbatim from brief)
   ================================================================ */
export const LESSONS = [
  {
    n: 1,
    header: "Lesson 1 of 5 · Mindset Reset",
    headline: "You are not a plant killer.",
    body:
      "Most plants don\u2019t die from lack of love\u2014they die from <strong>too much</strong> of it (usually overwatering!). Let go of the guilt. Today, we start fresh with a clean slate and zero judgment.",
    visualAlt: "A warm illustration of a hand holding a tiny green sprout",
    cta: "I\u2019m ready to start fresh",
    icon: Heart,
    accent: "from-rose-100 via-amber-50 to-emerald-50",
    ring: "text-rose-600",
    dot: "bg-rose-400",
  },
  {
    n: 2,
    header: "Lesson 2 of 5 · Watering 101",
    headline: "Ditch the calendar schedule.",
    body:
      "Don\u2019t water on a rigid weekly routine. Instead, <strong>poke your finger 2 inches deep</strong> into the soil. If it feels dry and dusty like a cookie crumb, it\u2019s time to water. If it feels damp, walk away!",
    visualAlt: "Diagram: dry topsoil finger test vs. damp deep soil",
    cta: "Got it, check the soil first",
    icon: Droplets,
    accent: "from-sky-100 via-emerald-50 to-lime-50",
    ring: "text-sky-700",
    dot: "bg-sky-400",
  },
  {
    n: 3,
    header: "Lesson 3 of 5 · Potting Basics",
    headline: "Give those roots some air.",
    body:
      "Imagine standing in wet socks all day\u2014that\u2019s what happens to roots in a pot with no drainage. <strong>Always</strong> use a pot with a hole at the bottom so excess water can escape. Your plant\u2019s roots need to breathe!",
    visualAlt: "Water safely draining from the bottom of a terracotta pot",
    cta: "Use pots with holes, got it",
    icon: Wind,
    accent: "from-amber-100 via-orange-50 to-emerald-50",
    ring: "text-amber-700",
    dot: "bg-amber-400",
  },
  {
    n: 4,
    header: "Lesson 4 of 5 · Light Matching",
    headline: "\u201CBright, indirect light\u201D demystified.",
    body:
      "If you can comfortably read a book in a spot without turning on a light, your plant will love it. Avoid blasting direct, hot afternoon sun right onto the leaves\u2014it sunburns them just like us!",
    visualAlt: "Cozy room diagram with safe light zones away from direct sun",
    cta: "Find my light zone",
    icon: Sun,
    accent: "from-amber-100 via-yellow-50 to-emerald-50",
    ring: "text-amber-600",
    dot: "bg-amber-300",
  },
  {
    n: 5,
    header: "Lesson 5 of 5 · Reading Signs",
    headline: "A yellow leaf is just a whisper, not a scream.",
    body:
      "Spotting a yellow leaf doesn\u2019t mean your plant is dying! It\u2019s usually just telling you: <em>\u201CHey, I got slightly too wet this week.\u201D</em> Snip it off, let the soil dry out, and watch it bounce back.",
    visualAlt: "Close-up of a leaf turning green with a healthy badge",
    cta: "Finish & unlock my dashboard",
    icon: Sprout,
    accent: "from-lime-100 via-emerald-50 to-emerald-100",
    ring: "text-emerald-700",
    dot: "bg-emerald-500",
    isFinal: true,
  },
];

/* ================================================================
   Small shared UI primitives
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
        Heartbroken Optimist
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

/* Progress dot row: filled vs empty per current index */
const DotRow = ({ current, size = "default" }) => {
  const sz = size === "sm" ? "h-1" : "h-1.5";
  return (
    <div className="flex items-center gap-1.5">
      {LESSONS.map((_, i) => (
        <span
          key={i}
          className={`${sz} rounded-full transition-all ${
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
};

/* Reusable illustration placeholder — different per lesson */
const LessonVisual = ({ lesson, size = "md" }) => {
  const Icon = lesson.icon;
  const heights = { sm: "h-32", md: "h-44", lg: "h-56" };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${lesson.accent} ${heights[size]}`}
      role="img"
      aria-label={lesson.visualAlt}
    >
      {/* Layered organic blob */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-6 -top-4 h-40 w-40 opacity-40"
        aria-hidden="true"
      >
        <path
          d="M140,40 C170,60 180,110 160,145 C140,180 90,190 60,165 C30,140 20,90 50,55 C80,20 110,20 140,40 Z"
          fill="#065F46"
          opacity="0.15"
        />
      </svg>
      <svg
        viewBox="0 0 200 200"
        className="absolute -left-8 -bottom-6 h-32 w-32 opacity-30"
        aria-hidden="true"
      >
        <path
          d="M140,40 C170,60 180,110 160,145 C140,180 90,190 60,165 C30,140 20,90 50,55 C80,20 110,20 140,40 Z"
          fill="#0F766E"
          opacity="0.2"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur">
          <Icon className={`h-8 w-8 ${lesson.ring}`} strokeWidth={1.75} />
        </div>
        <span className="mt-3 rounded-full bg-white/70 px-3 py-0.5 text-[10px] font-medium text-emerald-900 backdrop-blur">
          Lesson {lesson.n} illustration
        </span>
      </div>
    </div>
  );
};

/* ================================================================
   VARIATION 1 — Classic Swipeable Card Deck
   Full-bleed hero card, prev/next arrows, dot indicator
   ================================================================ */
const VariationOne = () => {
  const lesson = LESSONS[0]; // showing lesson 1
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-classic-carousel">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Plant Parent Reset
            </span>
            <DotRow current={0} />
          </div>
          <button className="text-xs font-medium text-emerald-800/70">
            Skip
          </button>
        </div>

        {/* Card */}
        <Card className="mt-6 flex-1 overflow-hidden rounded-3xl border-none shadow-lg shadow-emerald-900/5">
          <CardContent className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-800">
                {lesson.header}
              </span>
              <span className="text-[10px] font-semibold text-emerald-800/60">
                {lesson.n} / 5
              </span>
            </div>

            <h1 className="mt-5 font-serif text-[26px] leading-[1.15] text-emerald-950">
              {lesson.headline}
            </h1>

            <LessonVisual lesson={lesson} size="md" />

            <p
              className="mt-5 text-[14px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: lesson.body }}
            />

            <div className="mt-auto pt-6">
              <Button
                className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                data-testid="v1-cta-got-it"
              >
                {lesson.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Arrow controls */}
        <div className="mt-4 flex items-center justify-between">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-800/50"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-[11px] text-emerald-800/60">
            Swipe or tap the arrows
          </span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Peeking Card Stack (physical deck)
   Front card active; next two peek behind at slight offsets
   ================================================================ */
const VariationTwo = () => {
  const active = LESSONS[1]; // lesson 2
  return (
    <PhoneFrame tone="bg-[#F1EEE3]" testId="v2-card-stack">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              The Reset Deck
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-800/70">
              Card {active.n} of 5
            </p>
          </div>
          <button className="rounded-full bg-white p-2 shadow-sm">
            <Bell className="h-4 w-4 text-emerald-800" />
          </button>
        </div>

        {/* Stack container */}
        <div className="relative mt-6 flex-1">
          {/* 3rd card peeking */}
          <div
            className="absolute inset-x-8 top-6 rounded-3xl bg-white/60 shadow-sm"
            style={{ height: 480 }}
          />
          {/* 2nd card peeking */}
          <div
            className="absolute inset-x-5 top-3 rounded-3xl bg-white/85 shadow-md"
            style={{ height: 480 }}
          />
          {/* Front card */}
          <Card
            className="absolute inset-x-0 top-0 overflow-hidden rounded-3xl border-none bg-white shadow-2xl shadow-emerald-900/10"
            style={{ height: 480 }}
          >
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-sky-800">
                  {active.header}
                </span>
              </div>
              <h1 className="mt-4 font-serif text-[24px] leading-tight text-emerald-950">
                {active.headline}
              </h1>
              <LessonVisual lesson={active} size="sm" />
              <p
                className="mt-3 text-[13px] leading-relaxed text-emerald-900/80"
                dangerouslySetInnerHTML={{ __html: active.body }}
              />
              <div className="mt-auto flex items-center justify-between">
                <span className="text-[10px] text-emerald-800/50">
                  Swipe up to continue
                </span>
                <button className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-900 px-4 text-xs font-medium text-white">
                  <Check className="h-3.5 w-3.5" />
                  Got it
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom: mini-deck preview + progress */}
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
              The rest of the deck
            </span>
            <DotRow current={1} size="sm" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {LESSONS.map((l) => (
              <div
                key={l.n}
                className={`flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-center ${
                  l.n === active.n
                    ? "bg-emerald-900 text-white"
                    : l.n < active.n
                      ? "bg-emerald-100 text-emerald-800/70"
                      : "bg-white/70 text-emerald-800/60"
                }`}
              >
                <l.icon className="h-3.5 w-3.5" />
                <span className="mt-1 text-[9px] font-semibold">0{l.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 3 — Vertical Scroll-Snap Course
   Full list of all 5 lessons stacked with a sticky progress rail
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame tone="bg-white" testId="v3-vertical-scroll">
    <div className="px-5 pb-28 pt-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
            Welcome back, Maya
          </p>
          <h1 className="mt-1 font-serif text-[22px] leading-tight text-emerald-950">
            Your Plant Parent Reset
          </h1>
          <p className="mt-1 text-[12px] text-emerald-800/70">
            Scroll to move through 5 gentle lessons.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <span className="font-serif text-sm text-emerald-900">2/5</span>
          </div>
          <Progress value={40} className="mt-2 h-1 w-12 bg-emerald-100" />
        </div>
      </div>

      {/* Sticky rail + lessons */}
      <div className="relative mt-5">
        <span className="absolute left-4 top-4 bottom-4 w-0.5 rounded-full bg-emerald-100" />
        <span
          className="absolute left-4 top-4 w-0.5 rounded-full bg-emerald-800"
          style={{ height: "40%" }}
        />

        <div className="space-y-4 pl-12">
          {LESSONS.map((l) => {
            const Icon = l.icon;
            const status = l.n < 3 ? "done" : l.n === 3 ? "current" : "future";
            return (
              <Card
                key={l.n}
                className={`relative rounded-2xl border-emerald-100 ${
                  status === "current"
                    ? "shadow-lg ring-2 ring-emerald-800"
                    : "shadow-sm"
                }`}
              >
                {/* Rail node */}
                <span
                  className={`absolute -left-[34px] top-4 flex h-6 w-6 items-center justify-center rounded-full ${
                    status === "done"
                      ? "bg-emerald-800 text-white"
                      : status === "current"
                        ? "bg-amber-300 text-emerald-950 ring-4 ring-amber-100"
                        : "bg-white text-emerald-800/50 ring-2 ring-emerald-100"
                  }`}
                >
                  {status === "done" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="text-[10px] font-bold">{l.n}</span>
                  )}
                </span>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${l.ring}`} />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        status === "future"
                          ? "text-emerald-800/40"
                          : "text-emerald-700"
                      }`}
                    >
                      {l.header}
                    </span>
                  </div>
                  <p
                    className={`mt-2 font-serif text-[16px] leading-snug ${
                      status === "future"
                        ? "text-emerald-950/50"
                        : "text-emerald-950"
                    }`}
                  >
                    {l.headline}
                  </p>
                  {status !== "future" && (
                    <p
                      className="mt-2 text-[12px] leading-relaxed text-emerald-900/70"
                      dangerouslySetInnerHTML={{ __html: l.body }}
                    />
                  )}
                  {status === "current" && (
                    <Button
                      size="sm"
                      className="mt-3 h-9 rounded-full bg-emerald-900 px-4 text-[12px]"
                      data-testid={`v3-cta-lesson-${l.n}`}
                    >
                      {l.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom trophy CTA */}
      <Card className="mt-6 rounded-2xl border-none bg-emerald-950 text-emerald-50">
        <CardContent className="flex items-center gap-3 p-4">
          <Trophy className="h-8 w-8 shrink-0 text-lime-200" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              Finish all 5 to unlock
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-100/80">
              Your Confidence Starter badge & personal dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 4 — Journal / Book Spread
   Serif-heavy, illustrated, feels like a hand-designed booklet
   ================================================================ */
const VariationFour = () => {
  const lesson = LESSONS[2]; // lesson 3 — drainage
  return (
    <PhoneFrame tone="bg-[#F5F0E4]" testId="v4-journal-book">
      {/* Paper texture via subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, #000 1px, transparent 1px), radial-gradient(circle at 70% 60%, #000 1px, transparent 1px)",
          backgroundSize: "18px 18px, 22px 22px",
        }}
      />
      <div className="relative flex h-full flex-col px-6 pt-3">
        {/* Book header */}
        <div className="flex items-center justify-between">
          <button className="text-emerald-900/70">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-800/70">
            The Grove Journal
          </p>
          <BookOpen className="h-4 w-4 text-emerald-800/70" />
        </div>

        {/* Chapter label */}
        <div className="mt-6 flex items-center gap-3">
          <span className="font-serif text-6xl italic text-emerald-800/30">
            0{lesson.n}
          </span>
          <div className="pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
              {lesson.header}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/60">
              An entry in your Reset Book
            </p>
          </div>
        </div>

        {/* Big serif headline */}
        <h1 className="mt-6 font-serif text-[30px] leading-[1.05] text-emerald-950">
          {lesson.headline}
        </h1>

        {/* Ornament rule */}
        <div className="mt-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-emerald-800/30" />
          <Flower2 className="h-3.5 w-3.5 text-emerald-800/50" />
          <span className="h-px flex-1 bg-emerald-800/30" />
        </div>

        {/* Illustration frame */}
        <div className="mt-5 rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-emerald-900/10 backdrop-blur">
          <LessonVisual lesson={lesson} size="sm" />
          <p className="mt-2 text-center font-serif text-[10px] italic text-emerald-800/60">
            Fig. {lesson.n} &mdash; {lesson.visualAlt.toLowerCase()}
          </p>
        </div>

        {/* Body */}
        <p
          className="mt-5 font-serif text-[14px] leading-relaxed text-emerald-950/85"
          style={{ fontFamily: "Georgia, serif" }}
          dangerouslySetInnerHTML={{ __html: lesson.body }}
        />

        {/* Footer nav */}
        <div className="mt-auto pb-4">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            <DotRow current={2} size="sm" />
          </div>
          <Button
            className="h-12 w-full rounded-none border-2 border-emerald-900 bg-transparent text-sm font-semibold uppercase tracking-widest text-emerald-900 hover:bg-emerald-900 hover:text-white"
            data-testid="v4-cta-turn-page"
          >
            Turn the page &nbsp;&mdash;&nbsp; {lesson.cta}
          </Button>
          <p className="mt-3 text-center font-serif text-[10px] italic text-emerald-800/50">
            &mdash; page {lesson.n} of 5 &mdash;
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 5 — Conversational Chat
   Lessons delivered as a warm chat with Grove assistant
   ================================================================ */
const VariationFive = () => (
  <PhoneFrame tone="bg-[#F4F1E8]" testId="v5-chat">
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-lime-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              Grove &middot; your plant coach
            </p>
            <p className="text-[10px] text-emerald-700">
              Reset chat &middot; step 4 of 5
            </p>
          </div>
        </div>
        <button className="rounded-full p-2 hover:bg-emerald-50">
          <X className="h-4 w-4 text-emerald-800" />
        </button>
      </div>

      {/* Chat scroll */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {/* Grove bubble — lesson 1 */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[240px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-700">
              {LESSONS[0].header}
            </p>
            <p className="mt-1 font-serif text-[14px] leading-snug text-emerald-950">
              {LESSONS[0].headline}
            </p>
            <p
              className="mt-1.5 text-[12px] leading-relaxed text-emerald-900/75"
              dangerouslySetInnerHTML={{ __html: LESSONS[0].body }}
            />
          </div>
        </div>

        {/* User reply */}
        <div className="flex justify-end">
          <div className="max-w-[220px] rounded-2xl rounded-br-md bg-emerald-800 p-3 text-white shadow-sm">
            <p className="text-[12px]">{LESSONS[0].cta} ✓</p>
          </div>
        </div>

        {/* Grove lesson 2 */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[260px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-700">
              {LESSONS[1].header}
            </p>
            <p className="mt-1 font-serif text-[14px] leading-snug text-emerald-950">
              {LESSONS[1].headline}
            </p>
            <div className="mt-2">
              <LessonVisual lesson={LESSONS[1]} size="sm" />
            </div>
            <p
              className="mt-2 text-[12px] leading-relaxed text-emerald-900/75"
              dangerouslySetInnerHTML={{ __html: LESSONS[1].body }}
            />
          </div>
        </div>

        {/* Quick-reply chip */}
        <div className="flex justify-end">
          <button className="rounded-full border border-emerald-800 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            {LESSONS[1].cta} ✓
          </button>
        </div>

        {/* Grove lesson 3 preview */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-3.5 w-3.5" />
          </div>
          <div className="max-w-[260px] rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
              {LESSONS[2].header}
            </p>
            <p className="mt-1 font-serif text-[14px] leading-snug text-emerald-950">
              {LESSONS[2].headline}
            </p>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-end gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-3.5 w-3.5" />
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

      {/* Reply composer with quick chips */}
      <div className="border-t border-emerald-100 bg-white/90 px-4 pt-3 pb-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="rounded-full bg-emerald-900 px-3 py-1.5 text-[11px] font-medium text-white"
            data-testid="v5-cta-got-it"
          >
            <Check className="mr-1 inline h-3 w-3" /> Use pots with holes, got it
          </button>
          <button className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            Tell me why
          </button>
          <button className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            Skip for now
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <DotRow current={2} size="sm" />
          <span className="ml-auto text-[10px] text-emerald-800/60">
            3 of 5 lessons
          </span>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   BONUS — Final "Unlock" card mock (shown as a static preview
   below the 5 variations so reviewers see the CTA endpoint too)
   ================================================================ */
const FinalCardPreview = () => {
  const l = LESSONS[4];
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
          Shared final card
        </span>
        <span className="h-px flex-1 bg-emerald-200" />
      </div>
      <h2 className="mb-4 font-serif text-2xl text-emerald-950">
        The 5th lesson &mdash; and the transition CTA
      </h2>
      <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
        Every variation ends here: the final &ldquo;yellow leaf&rdquo; lesson
        followed by the celebratory dashboard unlock.
      </p>
      <div className="flex justify-center">
        <PhoneFrame tone="bg-[#F7F5EE]" testId="bonus-final-card">
          <div className="flex h-full flex-col px-5 pb-6 pt-3">
            <div className="flex items-center justify-between">
              <button className="rounded-full bg-white p-2 shadow-sm">
                <ChevronLeft className="h-4 w-4 text-emerald-800" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Plant Parent Reset
                </span>
                <DotRow current={4} />
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">
                5 / 5
              </span>
            </div>

            <Card className="mt-6 flex-1 overflow-hidden rounded-3xl border-none shadow-lg">
              <CardContent className="flex h-full flex-col p-5">
                <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  {l.header}
                </span>
                <h1 className="mt-4 font-serif text-[24px] leading-tight text-emerald-950">
                  {l.headline}
                </h1>
                <LessonVisual lesson={l} size="md" />
                <p
                  className="mt-4 text-[13px] leading-relaxed text-emerald-900/80"
                  dangerouslySetInnerHTML={{ __html: l.body }}
                />

                {/* Badge unlock strip */}
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-100 to-emerald-100 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                      Unlocked
                    </p>
                    <p className="text-[13px] font-semibold text-emerald-950">
                      Confidence Starter badge
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                    data-testid="bonus-cta-finish"
                  >
                    Ready to build your confidence?
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="mt-2 text-center text-[10px] text-emerald-800/60">
                    Your persona dashboard is waiting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
};

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const ResetCourseCarouselVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="reset-course-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Plant Parent Reset &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: Heartbroken Optimist &middot; same lessons, 5 UIs
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Classic Swipeable Card Deck"
        subtitle="Full-bleed hero card, dot indicator, prev/next arrows. The safe, familiar mobile carousel."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Peeking Card Stack"
        subtitle="Physical deck feel &mdash; the current card floats above 2 peeking siblings. Bottom rail previews the whole deck."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Vertical Scroll-Snap Course"
        subtitle="All 5 lessons on one scroll with a sticky progress rail. Done, current, and future states visible at once."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Journal / Book Spread"
        subtitle="Serif-heavy, hand-designed booklet feel. Turns the reset course into a keepsake."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Conversational Chat"
        subtitle="Grove delivers lessons as a warm coach chat. Quick-reply chips act as &ldquo;Got it&rdquo; buttons."
      />
      <VariationFive />

      {/* Shared endpoint card so reviewers see the transition CTA */}
      <FinalCardPreview />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default ResetCourseCarouselVariations;
