import { useSyncExternalStore } from 'react';

// One first-run layer at a time. App sets this while the sign-up flow, the quiz or the nook offer is open;
// the section tutorial and the coach tips wait until it clears instead of stacking on top.
let blocking = false;
const listeners = new Set();

export function setFirstRunBlocking(next) {
  if (blocking === next) return;
  blocking = next;
  listeners.forEach((fn) => fn());
}

export function isFirstRunBlocking() {
  return blocking;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useFirstRunBlocking() {
  return useSyncExternalStore(subscribe, isFirstRunBlocking, isFirstRunBlocking);
}
