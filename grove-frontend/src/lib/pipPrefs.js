import { useAuth } from '../contexts/AuthContext';
import { userAPI } from './api';

// Pip is on for everyone unless turned off, and shows nothing until he has said hello (`pip_introduced`).
//   pipOn       the "Show Pip" switch. Reads as on when never set, so no one needs a migration.
//   peeksPref   the "peeks in" switch (what Profile shows). On when never set, always off when Pip is off.
//   introduced  Pip has said hello, in onboarding or on the first-visit card.
//   shows       Pip may appear anywhere: switched on and introduced.
//   peeksOn     Pip may peek in: shows, and the peeks switch is on.
export function usePipPrefs() {
  const { user, updateUser } = useAuth();
  const pipOn = !!user && user.pip_enabled !== false;
  const peeksPref = pipOn && user.pip_peeks_enabled !== false;
  const introduced = !!user && user.pip_introduced === true;
  const shows = pipOn && introduced;
  const peeksOn = shows && peeksPref;
  const save = async (patch) => {
    const res = await userAPI.updateMe(patch);
    if (updateUser) updateUser(res.data);
  };
  return { pipOn, peeksPref, introduced, shows, peeksOn, save };
}
