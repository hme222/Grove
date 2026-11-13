import { useEffect, useState } from 'react';
import { useFirstRunBlocking } from '../../lib/firstRunGate';

const FIELD = 'input, textarea, select, [contenteditable="true"]';

const fieldFocused = () => !!(document.activeElement && document.activeElement.matches && document.activeElement.matches(FIELD));
const dialogOpen = () => !!document.querySelector('[role="dialog"]');

// True while something else owns the screen: a dialog, a text field, or a first-run layer.
export function useOtherThingOpen() {
  const gate = useFirstRunBlocking();
  const [other, setOther] = useState(false);
  useEffect(() => {
    const check = () => setOther(dialogOpen() || fieldFocused());
    check();
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
      observer.disconnect();
    };
  }, []);
  return gate || other;
}

