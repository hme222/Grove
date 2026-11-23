import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buttonVariants } from './ui/button';
import { notificationAPI, userAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const REMINDER_NOTE_KEY = 'grove-reminder-note-seen';
export const PETS_NOTE_KEY = 'grove-pets-note-skipped';

const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k) => { try { window.localStorage.setItem(k, '1'); } catch { /* storage can be blocked */ } };

// Two short questions, asked once after someone has a plant, one at a time in the same card:
// how many reminders they want, and whether pets share the home. Each has equal ways to answer.
// As a sheet, a question rises over the page above the tab bar with the page dimmed behind it, so it asks once and then
// gets out of the way instead of taking space in the list. The page behind stays readable; the question has to be answered
// (or put off with its own button) before the page can be used.
function Frame({ sheet, label, testId, children }) {
  const ref = useRef(null);
  useEffect(() => { if (sheet && ref.current) ref.current.focus({ preventScroll: true }); }, [sheet]);
  if (!sheet) {
    return <section aria-label={label} data-testid={testId} className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">{children}</section>;
  }
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-sheet bg-grove-night/60" />
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid={testId}
        className="fixed inset-x-0 bottom-nav z-sheet mx-auto max-w-column rounded-t-card border-hairline border-grove-moss bg-grove-forest p-5 pb-6 focus:outline-none"
      >
        {children}
      </section>
    </>
  );
}

export default function SetupNote({ sheet = false }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [remindersOn, setRemindersOn] = useState(false);
  const [remindersDone, setRemindersDone] = useState(() => !!read(REMINDER_NOTE_KEY));
  const [petsSkipped, setPetsSkipped] = useState(() => !!read(PETS_NOTE_KEY));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (remindersDone) return undefined;
    Promise.resolve(notificationAPI?.getPreferences?.())
      .then((res) => { if (alive) setRemindersOn(!!res?.data?.push_care_due); })
      .catch(() => {});
    return () => { alive = false; };
  }, [remindersDone]);

  const doneReminders = () => { write(REMINDER_NOTE_KEY); setRemindersDone(true); };
  const turnOffReminders = async () => {
    try { await notificationAPI.updatePreferences({ push_care_due: false }); } catch { /* the settings page can still change it */ }
    doneReminders();
  };
  const answerPets = async (value) => {
    setSaving(true);
    if (updateUser) updateUser({ has_pets: value });
    try { await userAPI.updateMe({ has_pets: value }); } catch { if (updateUser) updateUser({ has_pets: null }); }
    setSaving(false);
  };
  const skipPets = () => { write(PETS_NOTE_KEY); setPetsSkipped(true); };

  const primary = buttonVariants({ variant: 'outline' });
  const equal = buttonVariants({ variant: 'outline' });
  const quiet = buttonVariants({ variant: 'link' });

  if (!remindersDone && remindersOn) {
    return (
      <Frame sheet={sheet} label="Reminders" testId="reminder-note">
        <p className="font-plant text-base font-semibold text-grove-cream">One reminder a day, only when needed</p>
        <p className="mt-1 font-ui text-sm text-grove-sage">We send a single message when plants need a check. You can turn it off any time.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={doneReminders} data-testid="reminder-keep" className={primary}>Sounds good</button>
          <button type="button" onClick={turnOffReminders} data-testid="reminder-off" className={equal}>Turn off</button>
          <button type="button" onClick={() => navigate('/settings/notifications')} className={quiet}>Settings</button>
        </div>
      </Frame>
    );
  }

  const askPets = user && (user.has_pets === undefined || user.has_pets === null) && !petsSkipped && (remindersDone || !remindersOn);
  if (askPets) {
    return (
      <Frame sheet={sheet} label="Pets" testId="pets-note">
        <p className="font-plant text-base font-semibold text-grove-cream">Do you have pets at home?</p>
        <p className="mt-1 font-ui text-sm text-grove-sage">If you do, we&rsquo;ll show whether each of your plants is safe for them.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => answerPets(true)} data-testid="pets-yes" className={primary}>Yes</button>
          <button type="button" disabled={saving} onClick={() => answerPets(false)} data-testid="pets-no" className={equal}>No pets</button>
          <button type="button" onClick={skipPets} className={quiet}>Not now</button>
        </div>
      </Frame>
    );
  }
  return null;
}
