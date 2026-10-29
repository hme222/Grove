// "smooth" for scrollIntoView, unless the person has asked for less motion.
export function scrollBehavior() {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto';
  return 'smooth';
}
