// Grove — Phase 11B haptics utility
// Web-first; degrades gracefully on devices without vibration.
// On non-vibrating devices we attach a one-shot CSS "ripple" to the action target
// so the user still gets a tactile-feeling visual confirmation.
//
// In Phase 12 (Capacitor wrap) this file is replaced with @capacitor/haptics calls.

const hasVibrate = () => typeof navigator !== 'undefined'
  && typeof navigator.vibrate === 'function';

// Fire an obvious DOM ripple at the click point on the given element.
// Used as a fallback when navigator.vibrate is missing (iOS Safari etc.).
export function spawnRipple(target, opts = {}) {
  if (!target || typeof target !== 'object') return;
  try {
    const rect = target.getBoundingClientRect ? target.getBoundingClientRect() : null;
    if (!rect) return;
    const ripple = document.createElement('span');
    ripple.className = 'grove-ripple';
    if (opts.tone === 'success') ripple.classList.add('grove-ripple--success');
    else if (opts.tone === 'warm') ripple.classList.add('grove-ripple--warm');
    const size = Math.max(rect.width, rect.height) * 1.6;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    // Centered ripple
    ripple.style.left = (rect.width - size) / 2 + 'px';
    ripple.style.top = (rect.height - size) / 2 + 'px';
    // Ensure target is positioned for absolute child
    const cs = getComputedStyle(target);
    if (cs.position === 'static') target.style.position = 'relative';
    target.appendChild(ripple);
    setTimeout(() => { ripple.remove(); }, 650);
  } catch (e) { /* ignore */ }
}

function safeVibrate(pattern) {
  try {
    if (hasVibrate()) {
      navigator.vibrate(pattern);
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

// Light tap — used for selection / minor confirmation
export function impactLight(target) {
  if (!safeVibrate(10)) spawnRipple(target);
}

// Medium impact — used for care logging, repotting
export function impactMedium(target) {
  if (!safeVibrate(18)) spawnRipple(target);
}

// Success pattern — used for milestones, first care, streak unlocks
export function success(target) {
  if (!safeVibrate([12, 40, 18])) spawnRipple(target, { tone: 'success' });
}

// Warm note — used for warnings / undo
export function warm(target) {
  if (!safeVibrate([8, 30, 8])) spawnRipple(target, { tone: 'warm' });
}

const haptics = { impactLight, impactMedium, success, warm, spawnRipple };
export default haptics;
