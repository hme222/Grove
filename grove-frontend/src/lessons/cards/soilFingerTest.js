// Lesson cards for "Soil finger-test". The text is used exactly as written; colors are design tokens.
import { Hand, Timer, Cookie, Waves, Heart } from "lucide-react";

export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The hook",
    headline: "Erase the plant guilt.",
    body:
      "Most plants don\u2019t die from a lack of love \u2014 they die from <strong>drowning</strong>. Throw away any rigid watering schedule that says &ldquo;water every Tuesday.&rdquo; From today, we listen to the soil, not the calendar.",
    cta: "I\u2019m ready to unlearn",
    icon: Heart,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 2,
    header: "Card 2 of 5 · The probe",
    headline: "Your natural moisture sensor.",
    body:
      "Use your index finger as a physical moisture probe. Push it into the soil <strong>up to your second knuckle</strong> in a pot 6 in (15 cm) or bigger. In a small pot, the first knuckle is enough. That&rsquo;s the whole tool. No gadgets, no apps.",
    cta: "Got it &mdash; finger as probe",
    icon: Hand,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 3,
    header: "Card 3 of 5 · The walk away",
    headline: "Is it damp?",
    body:
      "If the soil feels <strong>damp and cool</strong> &mdash; like a wrung-out sponge &mdash; walk away. <strong>No water today.</strong> Your plant is quietly drinking what it already has. A few plants, such as peace lily and ferns, like to stay lightly moist.",
    cta: "Walk away &mdash; got it",
    icon: Waves,
    accent: "from-grove-sage/15 via-grove-sage/10 to-grove-lime/10",
    ring: "text-grove-sage",
    chip: "bg-grove-sage/15 text-grove-sage",
    outcome: "walk",
  },
  {
    n: 4,
    header: "Card 4 of 5 · The water sign",
    headline: "Is it dry?",
    body:
      "If the soil feels <strong>dry and dusty</strong> &mdash; like cake crumbs falling off your finger &mdash; it&rsquo;s ready for a thorough drink. Water slowly until it runs from the drainage hole. Succulents and cacti: wait until the whole pot is dry. A few plants, such as peace lily and ferns, like to stay lightly moist, so water them as the top starts to dry.",
    cta: "Give it a drink &mdash; got it",
    icon: Cookie,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
    outcome: "water",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your turn",
    headline: "60 seconds. One plant. Real answer.",
    body:
      "Go to your nearest plant right now. Press your finger into the soil, to the second knuckle (the first in a small pot). Then tap what you found below &mdash; there is no wrong answer.",
    cta: "Log my first soil test",
    icon: Timer,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
    interactive: true,
  },
];
