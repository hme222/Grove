// The quiz shows only to new accounts, so people who joined before it
// shipped are never interrupted.
export const QUIZ_WINDOW_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldShowQuiz(user, now = Date.now()) {
  if (!user) return false;
  if (user.onboarding_complete !== true) return false;
  if (user.primary_track) return false;
  if (!user.created_at) return false;
  const created = new Date(user.created_at).getTime();
  if (Number.isNaN(created)) return false;
  const ageDays = (now - created) / DAY_MS;
  return ageDays >= 0 && ageDays <= QUIZ_WINDOW_DAYS;
}
