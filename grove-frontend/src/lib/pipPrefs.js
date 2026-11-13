import { useAuth } from '../contexts/AuthContext';
import { userAPI } from './api';

// Pip is on for everyone unless turned off. Both switches read as on when the user has never set them, so no one needs a
// migration. The peeks (his "need help?" visits) can be off while Pip stays, and are always off when Pip is off.
export function usePipPrefs() {
  const { user, updateUser } = useAuth();
  const pipOn = !!user && user.pip_enabled !== false;
  const peeksOn = pipOn && user.pip_peeks_enabled !== false;
  const save = async (patch) => {
    const res = await userAPI.updateMe(patch);
    if (updateUser) updateUser(res.data);
  };
  return { pipOn, peeksOn, save };
}
