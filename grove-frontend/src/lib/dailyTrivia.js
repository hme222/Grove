// The daily plant tip on Today is off unless the person turns it on. The flag lives on the user (`show_daily_trivia`,
// stored by PATCH /users/me) and is mirrored in localStorage. The server copy wins when it is set; the local copy
// covers people who chose before the server stored the field, whose choice was only ever kept on their device.
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
