import { useSyncExternalStore } from 'react';

// One first-run layer at a time. Anything that takes over the screen (the sign-up flow, the quiz, the nook
// offer, the first-care celebration) holds the gate while it is open; the section tutorial and the coach
// tips wait until every hold is released instead of stacking on top.
let holds = 0;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function holdFirstRun() {
  holds += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds -= 1;
    notify();
  };
}

export function isFirstRunBlocking() {
  return holds > 0;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useFirstRunBlocking() {
  return useSyncExternalStore(subscribe, isFirstRunBlocking, isFirstRunBlocking);
}

// The nook is not offered in the same visit as the first-care celebration.
let firstCareThisSession = false;
export function markFirstCareThisSession() {
  firstCareThisSession = true;
}
export function hadFirstCareThisSession() {
  return firstCareThisSession;
}
