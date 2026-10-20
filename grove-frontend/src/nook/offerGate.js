export function hasFinishedALesson(user) {
  return (user?.tutorials_seen || []).some((entry) => typeof entry === 'string' && entry.startsWith('lesson:'));
}

// The nook is offered once, after a new user's first real action: a first care log
// (the first-care celebration) or a first finished lesson, whichever comes first.
export function shouldShowNookOffer(user) {
  if (!user) return false;
  if (user.onboarding_complete !== true) return false;
  if (!user.primary_track) return false;
  if (user.nook_offered_at) return false;
  return user.first_care_celebrated === true || hasFinishedALesson(user);
}
