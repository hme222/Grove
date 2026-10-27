// Pip's mood is cosmetic. It follows the time of day and never reflects plant health.
export function pipMood({ hour, quiet = false, celebrating = false }) {
  if (quiet) return 'calm';
  if (celebrating) return 'pleased';
  if (hour >= 5 && hour < 11) return 'curious';
  if (hour >= 21 || hour < 5) return 'sleepy';
  return 'calm';
}
