// Lesson cards for "Plant Parent Reset". The text is used exactly as written; colors are design tokens.
import { Sun, Droplets, Heart, Sprout, Wind } from "lucide-react";

export const CARDS = [
  {
    n: 1,
    header: "Lesson 1 of 5 · Mindset Reset",
    headline: "You are not a plant killer.",
    body:
      "Most plants don\u2019t die from lack of love\u2014they die from <strong>too much</strong> of it (usually overwatering!). Let go of the guilt. Today, we start fresh with a clean slate and zero judgment.",
    visualAlt: "A warm illustration of a hand holding a tiny green sprout",
    cta: "I\u2019m ready to start fresh",
    icon: Heart,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    dot: "bg-grove-sprout",
  },
  {
    n: 2,
    header: "Lesson 2 of 5 · Watering 101",
    headline: "Ditch the calendar schedule.",
    body:
      "Don\u2019t water on a rigid weekly routine. Instead, <strong>push a finger in to the second knuckle</strong> (the first knuckle in a small pot under 6 in or 15 cm). If it feels dry and dusty like a cookie crumb, it\u2019s time to water. If it feels damp, walk away! Succulents and cacti are different. Desert succulents and cacti (aloe, jade, echeveria, opuntia) want the whole pot dry. Rainforest cacti such as Christmas cactus want it lightly moist. A finger cannot test a whole pot, so lift it: a light pot is a dry pot.",
    visualAlt: "Diagram: dry topsoil finger test vs. damp deep soil",
    cta: "Got it, check the soil first",
    icon: Droplets,
    accent: "from-grove-sage/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sage",
    dot: "bg-grove-sage",
  },
  {
    n: 3,
    header: "Lesson 3 of 5 · Potting Basics",
    headline: "Give those roots some air.",
    body:
      "Imagine standing in wet socks all day\u2014that\u2019s what happens to roots in a pot with no drainage. pots need <strong>drainage holes</strong> so excess water can escape. If a decorative pot has none, keep the plant in its nursery pot inside it. Lift the plant out to water, let it drain, then put it back. Your plant\u2019s roots need to breathe!",
    visualAlt: "Water safely draining from the bottom of a terracotta pot",
    cta: "Use pots with holes, got it",
    icon: Wind,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    dot: "bg-grove-sprout",
  },
  {
    n: 4,
    header: "Lesson 4 of 5 · Light Matching",
    headline: "\u201CBright, indirect light\u201D demystified.",
    body:
      "Bright, indirect light is a spot close to a bright window, within about 3 feet (1 meter), where daylight is strong but the sun does not land on the leaves. Being able to read there is not a reliable test. Avoid blasting direct, hot afternoon sun right onto the leaves\u2014it sunburns them just like us!",
    visualAlt: "Cozy room diagram with safe light zones away from direct sun",
    cta: "Find my light zone",
    icon: Sun,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    dot: "bg-grove-sprout",
  },
  {
    n: 5,
    header: "Lesson 5 of 5 · Reading Signs",
    headline: "A yellow leaf is just a whisper, not a scream.",
    body:
      "Spotting a yellow leaf doesn\u2019t mean your plant is dying! Check the soil first. If it is bone dry, thirst or light can also turn leaves yellow. If it is wet, it\u2019s usually just telling you: <em>\u201CHey, I got slightly too wet this week.\u201D</em> Snip it off, let the soil dry out, and watch it bounce back.",
    visualAlt: "Close-up of a leaf turning green with a healthy badge",
    cta: "Finish & unlock my dashboard",
    icon: Sprout,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    dot: "bg-grove-lime",
    isFinal: true,
  },
];
