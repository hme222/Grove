import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from './api';
import { careTextMode } from './careCopy';
import { useInstantSave } from '../components/profile/useInstantSave';

// The Simple / Detailed care tips setting, shared by the Care page and the Profile sheet so both save it the same way.
// setMode applies the choice at once and puts the old one back if the save fails; error and retry drive SaveError.
export function useCareTextDetail() {
  const { user, updateUser } = useAuth();
  const mode = careTextMode(user);
  const { run, busy, error, retry } = useInstantSave();

  const setMode = useCallback((next) => {
    if (next === mode) return Promise.resolve(false);
    const previous = mode;
    return run(
      () => { if (updateUser) updateUser({ care_text_detail: next }); },
      () => userAPI.updateMe({ care_text_detail: next }),
      () => { if (updateUser) updateUser({ care_text_detail: previous }); },
    );
  }, [mode, run, updateUser]);

  return { mode, setMode, busy, error, retry };
}

export default useCareTextDetail;
