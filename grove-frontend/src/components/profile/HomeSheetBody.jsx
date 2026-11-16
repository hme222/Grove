import React, { useRef } from 'react';
import SaveError from './SaveError';
import LocationFields from './LocationFields';
import useInstantSave from './useInstantSave';
import { buttonVariants } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../lib/api';
import { ZIP_ZONE_ENABLED } from '../../lib/features';

const PETS = [[true, 'Yes, I have pets'], [false, 'No pets']];
const HEMISPHERES = [['north', 'Northern'], ['south', 'Southern']];

// Body of the "Your home" sheet: pets at home, hemisphere, and (when the zone flag is on) location.
// Each choice saves the instant it is tapped and goes back with an inline error if the save fails.
export default function HomeSheetBody() {
  const { user, updateUser } = useAuth();
  const pets = useInstantSave();
  const hemi = useInstantSave();
  const petsRef = useRef(null);
  const hemiRef = useRef(null);

  const savePets = (value, event) => {
    if (user?.has_pets === value) return;
    petsRef.current = event.currentTarget;
    const previous = user?.has_pets ?? null;
    pets.run(
      () => updateUser({ has_pets: value }),
      () => userAPI.updateMe({ has_pets: value }),
      () => updateUser({ has_pets: previous }),
    );
  };

  const saveHemisphere = (value, event) => {
    if (user?.hemisphere === value) return;
    hemiRef.current = event.currentTarget;
    const previous = user?.hemisphere ?? null;
    hemi.run(
      () => updateUser({ hemisphere: value }),
      () => userAPI.updateMe({ hemisphere: value }),
      () => updateUser({ hemisphere: previous }),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 id="pets-heading" className="font-plant text-grove-cream text-base font-semibold">Pets at home</h3>
        <p className="mt-1 font-ui text-xs text-grove-sage">If pets share your home, each plant shows whether it is safe for them.</p>
        <div role="group" aria-labelledby="pets-heading" data-testid="profile-pets" className="mt-3 flex flex-wrap gap-2">
          {PETS.map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={user?.has_pets === value}
              aria-describedby={pets.error ? 'pets-error' : undefined}
              disabled={pets.busy}
              onClick={(e) => savePets(value, e)}
              data-testid={value ? 'profile-pets-yes' : 'profile-pets-no'}
              className={buttonVariants({ variant: 'chip' })}
            >
              {label}
            </button>
          ))}
        </div>
        <SaveError id="pets-error" error={pets.error} onRetry={pets.retry} testId="pets-error" focusAfter={petsRef} />
      </div>

      <div className="border-t-hairline border-grove-moss pt-4">
        <h3 id="hemisphere-label" className="font-plant text-grove-cream text-base font-semibold">Hemisphere</h3>
        <p className="mt-1 font-ui text-sm text-grove-sage">The seasons run the other way in the south, so seasonal tips follow this.</p>
        <div role="group" aria-labelledby="hemisphere-label" data-testid="profile-hemisphere" className="mt-3 flex flex-wrap gap-2">
          {HEMISPHERES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={user?.hemisphere === id}
              aria-describedby={hemi.error ? 'hemisphere-error' : undefined}
              disabled={hemi.busy}
              onClick={(e) => saveHemisphere(id, e)}
              data-testid={`profile-hemisphere-${id}`}
              className={buttonVariants({ variant: 'chip' })}
            >
              {label}
            </button>
          ))}
        </div>
        <SaveError id="hemisphere-error" error={hemi.error} onRetry={hemi.retry} testId="hemisphere-error" focusAfter={hemiRef} />
      </div>

      {ZIP_ZONE_ENABLED && (
        <div className="border-t-hairline border-grove-moss pt-4">
          <LocationFields />
        </div>
      )}
    </div>
  );
}
