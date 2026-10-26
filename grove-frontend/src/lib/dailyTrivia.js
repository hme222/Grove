// The daily plant tip on Today is off unless the person turns it on. The flag lives on the user (`show_daily_trivia`)
// and is mirrored in localStorage, because the backend's user update does not store the field yet and a refetch of
// the user would otherwise drop it.
const KEY = 'grove_show_daily_trivia';

export function readTriviaFlag() {
  try { return localStorage.getItem(KEY) === 'true'; } catch { return false; }
}

export function writeTriviaFlag(on) {
  try { localStorage.setItem(KEY, on ? 'true' : 'false'); } catch { /* storage can be blocked */ }
}

export function showDailyTrivia(user) {
  if (user?.show_daily_trivia === true) return true;
  if (user?.show_daily_trivia === false) return false;
  return readTriviaFlag();
}
