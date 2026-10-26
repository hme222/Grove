// Small helpers for the sign-up form.

const COMMON = /^([^@\s]+)@(gmail|yahoo|outlook|icloud|hotmail)$/i;
const SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/;

// "maya@gmail" -> "maya@gmail.com". Only for the few big providers, and only ever offered, never applied.
export function suggestEmail(value) {
  const m = COMMON.exec((value || '').trim());
  return m ? `${m[1]}@${m[2].toLowerCase()}.com` : null;
}

export function looksLikeEmail(value) {
  return SHAPE.test((value || '').trim());
}

// "maya.r88@gmail.com" -> "Maya". Empty when the address gives fewer than two letters to go on.
export function nameFromEmail(value) {
  const local = (value || '').split('@')[0];
  const m = /[A-Za-z]+/.exec(local);
  return m && m[0].length >= 2 ? m[0][0].toUpperCase() + m[0].slice(1).toLowerCase() : '';
}
