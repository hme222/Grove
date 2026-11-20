// The launch intro (sprout and name, about 4.5s) plays on a device's first visit only. Someone who comes back signed out
// should reach the welcome screen at once. The flag lives in the device's localStorage; if storage is blocked (some private
// modes) the intro simply plays each time, which is the safe default.
const KEY = 'grove_launch_intro_seen';

export function launchIntroSeen() {
  try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function markLaunchIntroSeen() {
  try { window.localStorage.setItem(KEY, '1'); } catch { /* plays again next time */ }
}
