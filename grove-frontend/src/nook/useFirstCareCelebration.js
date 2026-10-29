import { useCallback, useRef, useState } from 'react';
import { markFirstCareThisSession } from '../lib/firstRunGate';

// The first-care celebration. The user is only marked as having celebrated when it closes,
// so the nook offer cannot appear underneath it.
export function useFirstCareCelebration(user, updateUser) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null); // { plantName, actions } of the log that opened it
  const shown = useRef(false);

  const celebrate = useCallback(
    (firstCarePending, logged) => {
      if (firstCarePending && user && !user.first_care_celebrated && !shown.current) {
        shown.current = true;
        setDetails(logged || null);
        setOpen(true);
      }
    },
    [user],
  );

  const close = useCallback(() => {
    setOpen(false);
    markFirstCareThisSession();
    if (updateUser) updateUser({ first_care_celebrated: true });
  }, [updateUser]);

  return { open, details, celebrate, close };
}
