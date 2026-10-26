import React from "react";
import {
  Leaf,
  Sparkles,
  Sun,
  Droplets,
  ArrowRight,
  Check,
  Heart,
  Home,
  Compass,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Lock,
  CheckCircle2,
  HelpCircle,
  X,
  Ruler,
  Flower2,
  Wind,
  Sprout,
  Star,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * QuickWinsVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * post-onboarding dashboards, each showcasing a different UI
 * treatment for the "Quick Wins" 5-card mini-lesson carousel.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared shell — phone frame + section label
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#FBFAF5]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] bg-emerald-950 p-3 shadow-2xl shadow-emerald-950/25">
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 780 }}
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

const VariationLabel = ({ number, title, subtitle, persona, personaTone }) => (
  <div className="mx-auto max-w-3xl px-6 pt-20 pb-8 text-left">
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation {number}
      </span>
      {persona && (
        <Badge
          variant="outline"
          className={`rounded-full border-emerald-300 bg-white px-3 py-1 text-xs ${
            personaTone || "text-emerald-800"
          }`}
        >
          {persona}
        </Badge>
      )}
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

const BottomTabBar = ({ active = "home" }) => {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "care", icon: Droplets, label: "Care" },
    { id: "you", icon: User, label: "You" },
  ];
  return (
    <div className="absolute inset-x-3 bottom-3 flex items-center justify-around rounded-3xl border border-emerald-100 bg-white/95 px-2 py-3 shadow-lg shadow-emerald-900/5 backdrop-blur">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <div key={t.id} className="flex flex-col items-center gap-1">
            <Icon
              className={`h-5 w-5 ${
                isActive ? "text-emerald-800" : "text-emerald-900/40"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-emerald-900" : "text-emerald-900/40"
              }`}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* Small header block used across variations */
const DashboardHeader = ({ eyebrow, title, persona, personaColor }) => (
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-serif text-[22px] leading-tight text-emerald-950">
        {title}
      </h1>
      {persona && (
        <span
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${personaColor}`}
        >
          <Sparkles className="h-3 w-3" />
          {persona}
        </span>
      )}
    </div>
    <button className="rounded-full bg-white p-2 shadow-sm">
      <Bell className="h-4 w-4 text-emerald-800" />
    </button>
  </div>
);

/* ================================================================
   VARIATION 1 — Heartbroken Optimist Reset Course
   Swipeable carousel with prominent "Card 1 of 5" hero card
   ================================================================ */
const VariationOne = () => (
  <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-reset-course">
    <div className="px-5 pb-28 pt-3">
      <DashboardHeader
        eyebrow="Welcome, Maya"
        title="Your Reset Course starts here."
        persona="Heartbroken Optimist"
        personaColor="bg-rose-100 text-rose-800"
      />

      <p className="mt-3 text-sm leading-relaxed text-emerald-900/70">
        Five gentle lessons to rebuild your confidence &mdash; two minutes each,
        no quizzes, no pressure.
      </p>

      {/* Progress dots */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
          Quick wins &middot; 1 of 5
        </span>
        <div className="ml-auto flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === 0 ? "w-6 bg-emerald-800" : "w-1.5 bg-emerald-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Hero lesson card */}
      <Card className="mt-4 overflow-hidden rounded-3xl border-none bg-gradient-to-br from-rose-100 via-amber-50 to-emerald-100 shadow-lg shadow-emerald-900/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
              ~ 90 sec
            </span>
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Lesson 1
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug text-emerald-950">
            The plants you&rsquo;ve lost weren&rsquo;t wasted.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-emerald-900/75">
            Every plant you didn&rsquo;t save taught you something real. This
            time, we&rsquo;ll listen to what they said &mdash; together.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              className="h-11 flex-1 rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
              data-testid="v1-cta-got-it"
            >
              <Check className="mr-2 h-4 w-4" />
              Got it, keep going
            </Button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white">
              <ChevronRight className="h-4 w-4 text-emerald-800" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming lesson strip */}
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-800/70">
        Coming up
      </p>
      <div className="mt-3 space-y-2.5">
        {[
          {
            n: 2,
            icon: Droplets,
            title: "Meet 3 plants that forgive you",
            time: "2 min",
          },
          {
            n: 3,
            icon: Sprout,
            title: "Thirsty vs. overwatered &mdash; the finger test",
            time: "90 sec",
          },
          {
            n: 4,
            icon: Sun,
            title: "Reading light without a meter",
            time: "2 min",
          },
          {
            n: 5,
            icon: Star,
            title: "Celebrating the first new leaf",
            time: "1 min",
          },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <div
              key={l.n}
              className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                <Icon className="h-4 w-4 text-emerald-800" />
              </div>
              <div className="flex-1">
                <p
                  className="text-[13px] font-semibold text-emerald-950"
                  dangerouslySetInnerHTML={{ __html: l.title }}
                />
                <p className="mt-0.5 text-[10px] text-emerald-800/60">
                  Lesson {l.n} &middot; {l.time}
                </p>
              </div>
              <Lock className="h-3.5 w-3.5 text-emerald-800/40" />
            </div>
          );
        })}
      </div>

      {/* Final CTA */}
      <div className="mt-6 rounded-2xl border border-emerald-200 border-dashed p-4 text-center">
        <p className="font-serif text-sm text-emerald-950">
          After lesson 5:
        </p>
        <p className="mt-1 text-xs text-emerald-800/70">
          Ready to meet your first (very forgiving) plant?
        </p>
      </div>
    </div>
    <BottomTabBar active="home" />
  </PhoneFrame>
);

/* ================================================================
   VARIATION 2 — Green Dreamer Foundation Course
   Horizontal swipe carousel with visual lesson thumbnails
   ================================================================ */
const VariationTwo = () => (
  <PhoneFrame tone="bg-white" testId="v2-foundation-course">
    <div className="px-5 pb-28 pt-3">
      <DashboardHeader
        eyebrow="Welcome, James"
        title="Foundations for your future jungle."
        persona="Green Dreamer"
        personaColor="bg-lime-100 text-emerald-900"
      />

      <p className="mt-3 text-sm leading-relaxed text-emerald-900/70">
        Big dreams start with five small foundations. Skim them now, master them
        this weekend.
      </p>

      {/* Featured hero lesson card */}
      <Card className="relative mt-5 overflow-hidden rounded-3xl border-none shadow-lg shadow-emerald-900/10">
        <div className="h-40 bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900">
          <div className="flex items-start justify-between p-4">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
              1 / 5
            </span>
            <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
              2 min read
            </span>
          </div>
          {/* Fake plant silhouette */}
          <div className="mt-2 flex justify-center">
            <Leaf className="h-16 w-16 text-white/60" strokeWidth={1.2} />
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            Foundation 01
          </p>
          <h3 className="mt-1.5 font-serif text-xl leading-snug text-emerald-950">
            Read your home&rsquo;s light before you buy anything.
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/70">
            Every dream jungle starts with knowing your windows. Stand at 2pm,
            note the shadow sharpness &mdash; that&rsquo;s your plant palette.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button
              className="h-10 flex-1 rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
              data-testid="v2-cta-got-it"
            >
              Got it
              <Check className="ml-2 h-4 w-4" />
            </Button>
            <button className="rounded-full border border-emerald-200 px-3 py-2 text-[11px] font-medium text-emerald-800">
              Save for later
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Horizontal preview strip of remaining lessons */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/70">
          Swipe next
        </p>
        <div className="flex gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-white">
            <ChevronLeft className="h-3.5 w-3.5 text-emerald-800" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-3 overflow-hidden">
        {[
          {
            n: 2,
            title: "Pick 3 statement plants that survive rookies",
            grad: "from-lime-300 to-emerald-600",
            icon: Flower2,
          },
          {
            n: 3,
            title: "Match your pot to your watering style",
            grad: "from-amber-200 to-emerald-500",
            icon: Ruler,
          },
          {
            n: 4,
            title: "Space plants for airflow (and drama)",
            grad: "from-teal-300 to-emerald-700",
            icon: Wind,
          },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <div
              key={l.n}
              className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div
                className={`flex h-20 items-end justify-between bg-gradient-to-br p-2 ${l.grad}`}
              >
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                  0{l.n}
                </span>
                <Icon className="h-4 w-4 text-white/80" />
              </div>
              <div className="p-3">
                <p className="text-[12px] font-semibold leading-snug text-emerald-950">
                  {l.title}
                </p>
                <p className="mt-1 text-[10px] text-emerald-800/60">2 min</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* End-of-course CTA */}
      <Card className="mt-6 rounded-2xl border-none bg-emerald-950 text-emerald-50">
        <CardContent className="flex items-center gap-4 p-5">
          <Trophy className="h-8 w-8 shrink-0 text-lime-200" />
          <div className="flex-1">
            <p className="font-serif text-sm">After all 5 foundations:</p>
            <p className="mt-0.5 text-xs text-emerald-100/80">
              Ready to design your first FloraGrove room?
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-lime-200" />
        </CardContent>
      </Card>
    </div>
    <BottomTabBar active="home" />
  </PhoneFrame>
);

/* ================================================================
   VARIATION 3 — Gamified Streak / Step Path
   Vertical path unlocking a Confidence Badge
   ================================================================ */
const VariationThree = () => {
  const steps = [
    {
      n: 1,
      title: "Say goodbye to plant guilt",
      body: "Loss isn&rsquo;t failure &mdash; it&rsquo;s data.",
      status: "done",
    },
    {
      n: 2,
      title: "Learn the 3-finger soil test",
      body: "The one habit that prevents 80% of overwatering.",
      status: "current",
    },
    {
      n: 3,
      title: "Meet 3 forgiving plants",
      body: "Bulletproof species picked from your quiz.",
      status: "locked",
    },
    {
      n: 4,
      title: "Read your window light",
      body: "No meter, no gadgets &mdash; just your palm.",
      status: "locked",
    },
    {
      n: 5,
      title: "Celebrate the first new leaf",
      body: "Small wins that stack into confidence.",
      status: "locked",
    },
  ];

  return (
    <PhoneFrame tone="bg-[#F4F1E8]" testId="v3-gamified-streak">
      <div className="px-5 pb-28 pt-3">
        <DashboardHeader
          eyebrow="Quick Wins &middot; 1/5 unlocked"
          title="Your path to a Confidence Badge."
          persona="Heartbroken Optimist"
          personaColor="bg-rose-100 text-rose-800"
        />

        {/* Badge preview */}
        <Card className="mt-5 overflow-hidden rounded-3xl border-none bg-gradient-to-br from-amber-100 via-rose-50 to-emerald-100">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 opacity-60">
                <Trophy className="h-7 w-7 text-amber-600" />
              </div>
              <Lock className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white p-1 text-emerald-900" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                Locked
              </p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-950">
                Confidence Starter Badge
              </p>
              <p className="text-[11px] text-emerald-800/70">
                Finish all 5 lessons to unlock
              </p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-emerald-950">1</p>
              <p className="text-[10px] text-emerald-800/60">of 5</p>
            </div>
          </CardContent>
        </Card>

        {/* Overall progress */}
        <div className="mt-5 flex items-center gap-3">
          <Progress value={20} className="h-2 flex-1 bg-emerald-100" />
          <span className="text-[11px] font-semibold text-emerald-800">
            20%
          </span>
        </div>

        {/* Step path */}
        <div className="relative mt-6">
          <span className="absolute left-4 top-3 bottom-3 w-px border-l-2 border-dashed border-emerald-200" />
          <div className="space-y-3">
            {steps.map((s) => {
              const isDone = s.status === "done";
              const isCurrent = s.status === "current";
              return (
                <div
                  key={s.n}
                  className={`relative flex items-start gap-3 rounded-2xl p-3.5 ${
                    isCurrent
                      ? "bg-white shadow-md ring-2 ring-emerald-800"
                      : "bg-white/60"
                  }`}
                >
                  <div
                    className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-emerald-800 text-white"
                        : isCurrent
                          ? "bg-amber-400 text-emerald-950 ring-4 ring-amber-100"
                          : "bg-emerald-100 text-emerald-800/50"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <span className="text-xs font-bold">{s.n}</span>
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[13px] font-semibold ${
                          s.status === "locked"
                            ? "text-emerald-900/50"
                            : "text-emerald-950"
                        }`}
                        dangerouslySetInnerHTML={{ __html: s.title }}
                      />
                      {isCurrent && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-950">
                          Now
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        s.status === "locked"
                          ? "text-emerald-900/40"
                          : "text-emerald-800/70"
                      }`}
                      dangerouslySetInnerHTML={{ __html: s.body }}
                    />
                  </div>
                  {isCurrent && (
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-emerald-900 px-3 text-[11px]"
                      data-testid="v3-cta-start-step"
                    >
                      Start
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <p className="mt-6 text-center text-[11px] text-emerald-800/60">
          Finish the path &middot; unlock your first plant recommendation
        </p>
      </div>
      <BottomTabBar active="care" />
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 4 — Interactive Flashcard (True/False)
   Minimalist conversational myth-buster
   ================================================================ */
const VariationFour = () => (
  <PhoneFrame tone="bg-[#F9F7F0]" testId="v4-flashcard">
    <div className="flex h-full flex-col px-5 pt-3">
      {/* Compact header */}
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-white p-2 shadow-sm">
          <X className="h-4 w-4 text-emerald-800" />
        </button>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full ${
                i < 2 ? "w-8 bg-emerald-800" : "w-8 bg-emerald-100"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold text-emerald-800">
          2 / 5
        </span>
      </div>

      {/* Flashcard */}
      <div className="mt-8 flex flex-1 flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <HelpCircle className="h-3.5 w-3.5" />
          Myth-buster
        </div>

        <h3 className="mt-3 font-serif text-[26px] leading-[1.15] text-emerald-950">
          &ldquo;Yellow leaves always mean my plant is thirsty.&rdquo;
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-emerald-900/70">
          Tap what you think &mdash; there&rsquo;s no wrong answer, just a
          gentler way to read your plants.
        </p>

        {/* Answer buttons */}
        <div className="mt-8 space-y-3">
          <button
            className="flex w-full items-center justify-between rounded-2xl border-2 border-emerald-100 bg-white p-4 text-left transition hover:border-emerald-300"
            data-testid="v4-answer-true"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
                True
              </p>
              <p className="mt-1 text-sm text-emerald-950">
                Yellow = thirsty, water now
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200">
              <Check className="h-4 w-4 text-emerald-300" />
            </span>
          </button>

          <button
            className="flex w-full items-center justify-between rounded-2xl border-2 border-emerald-800 bg-emerald-800 p-4 text-left"
            data-testid="v4-answer-false"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
                False
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                It usually means overwatered
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <Check className="h-4 w-4 text-emerald-800" />
            </span>
          </button>
        </div>

        {/* Explanation preview */}
        <Card className="mt-6 rounded-2xl border-none bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
              Why it matters
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-900">
              Soggy roots mimic thirst. Feel the soil first &mdash; if it&rsquo;s
              wet, hold off. Your plant is asking for air, not water.
            </p>
          </CardContent>
        </Card>

        <div className="mt-auto mb-24 flex items-center gap-3">
          <button className="flex-1 text-sm font-medium text-emerald-800/70">
            Skip
          </button>
          <Button
            className="h-12 flex-1 rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v4-cta-next"
          >
            Next myth
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 5 — Visual Quick-Tip Carousel
   Micro-infographic heavy, soft gradients
   ================================================================ */
const MoistureInfographic = () => (
  <div className="mt-5 rounded-2xl bg-white/70 p-4 backdrop-blur">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
      Soil moisture guide
    </p>
    <div className="mt-4 flex items-end gap-2">
      {[
        { label: "Bone dry", color: "bg-amber-200", h: 24, warn: true },
        { label: "Dry-ish", color: "bg-amber-300", h: 36 },
        { label: "Just right", color: "bg-emerald-500", h: 60, hero: true },
        { label: "Damp", color: "bg-emerald-700", h: 44 },
        { label: "Soggy", color: "bg-sky-700", h: 30, warn: true },
      ].map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center">
          <div
            className={`w-full rounded-t-xl ${b.color} ${
              b.hero ? "ring-2 ring-emerald-900 ring-offset-2" : ""
            }`}
            style={{ height: b.h }}
          />
          <span
            className={`mt-1.5 text-center text-[9px] font-medium ${
              b.hero ? "text-emerald-900" : "text-emerald-800/60"
            }`}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[11px] leading-relaxed text-emerald-900/80">
      Aim for the middle. When in doubt, wait one more day &mdash; roots love a
      little thirst.
    </p>
  </div>
);

const VariationFive = () => (
  <PhoneFrame
    tone="bg-gradient-to-b from-[#F4F7F0] via-[#EDF3E6] to-[#E4EED8]"
    testId="v5-visual-tips"
  >
    {/* Soft decorative blob */}
    <svg
      className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 opacity-50"
      viewBox="0 0 400 400"
      fill="none"
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

    <div className="relative px-5 pb-28 pt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            Quick Tip 3 of 5
          </p>
          <h1 className="mt-1 font-serif text-[22px] text-emerald-950">
            Learn to read soil, not calendars.
          </h1>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 backdrop-blur">
          <Droplets className="h-4 w-4 text-emerald-800" />
        </span>
      </div>

      {/* Featured card with infographic */}
      <Card className="mt-5 overflow-hidden rounded-3xl border-none bg-white/60 shadow-md backdrop-blur">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Tip 03
            </span>
            <span className="text-[11px] text-emerald-800/60">40-sec read</span>
          </div>
          <h3 className="mt-3 font-serif text-lg leading-snug text-emerald-950">
            The finger test beats every schedule.
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/70">
            Push a finger in up to the second knuckle. Dry? Water. Damp?
            Wait. That&rsquo;s the entire lesson.
          </p>

          <MoistureInfographic />

          <Button
            className="mt-5 h-11 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v5-cta-got-it"
          >
            <Check className="mr-2 h-4 w-4" />
            Got it &mdash; next tip
          </Button>
        </CardContent>
      </Card>

      {/* Mini carousel dots */}
      <div className="mt-5 flex items-center justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === 2 ? "w-6 bg-emerald-800" : "w-1.5 bg-emerald-800/30"
            }`}
          />
        ))}
      </div>

      {/* Peek at next tip */}
      <div className="mt-6 rounded-2xl bg-white/50 p-4 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800/70">
          Up next &middot; Tip 04
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-emerald-500">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-emerald-950">
              Reading light with your palm
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-800/60">
              A shadow test that beats every lux meter &middot; 50 sec
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-800/60" />
        </div>
      </div>

      {/* End of course CTA */}
      <Card className="mt-4 rounded-2xl border-none bg-emerald-950 text-emerald-50">
        <CardContent className="flex items-center gap-3 p-4">
          <BookOpen className="h-6 w-6 shrink-0 text-lime-200" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              After tip 5:
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-100/80">
              Ready to meet your first plant?
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-lime-200" />
        </CardContent>
      </Card>
    </div>
    <BottomTabBar active="explore" />
  </PhoneFrame>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const QuickWinsVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="quick-wins-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              FloraGrove &middot; Quick Wins carousel concepts (mobile)
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            5 static variations &middot; portrait mockups
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        persona="Heartbroken Optimist"
        personaTone="text-rose-800"
        title="Reset Course &mdash; Rebuild trust card by card"
        subtitle="Swipeable hero card + upcoming-lesson stack. Warm, low-stakes, forgiveness-first copy."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        persona="Green Dreamer"
        personaTone="text-emerald-800"
        title="Foundation Course &mdash; Visual swipe carousel"
        subtitle="Rich featured card with lush thumbnails; horizontal preview strip of remaining lessons."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        persona="Heartbroken Optimist"
        personaTone="text-rose-800"
        title="Gamified Streak &mdash; Confidence Badge path"
        subtitle="Vertical step path with locks, current-step ring, and a badge unlock preview."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        persona="Any persona"
        title="Interactive Flashcard &mdash; True/False myth-buster"
        subtitle="Minimalist conversational UI. One question per card, tap to reveal a gentle explanation."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        persona="Any persona"
        title="Visual Quick-Tip Carousel &mdash; Micro-infographic heavy"
        subtitle="Soft gradients and botanical shapes. Each tip anchored by a small custom infographic."
      />
      <VariationFive />

      <footer className="mt-24 border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default QuickWinsVariations;
