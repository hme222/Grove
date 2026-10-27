import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Keyboard and screen-reader behavior every dialog needs: move focus in when it opens, keep Tab
// inside it, close on Escape, and return focus to what opened it. Attach `ref` to the dialog
// element and give that element tabIndex={-1}.
export function useDialogA11y(ref, onClose, active = true) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return undefined;
    const opener = document.activeElement;
    const focusables = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

    (focusables()[0] || node).focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape' && closeRef.current) {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) { e.preventDefault(); node.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (!node.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [ref, active]);
}

export default useDialogA11y;
