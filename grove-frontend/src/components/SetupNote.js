import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI, userAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const REMINDER_NOTE_KEY = 'grove-reminder-note-seen';
export const PETS_NOTE_KEY = 'grove-pets-note-skipped';

const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k) => { try { window.localStorage.setItem(k, '1'); } catch { /* storage can be blocked */ } };

// Two short questions, asked once after someone has a plant, one at a time in the same card:
// how many reminders they want, and whether pets share the home. Each has equal ways to answer.
export default function SetupNote() {
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

  const btn = 'min-h-[44px] rounded-[12px] border-[0.5px] px-4 font-ui text-sm disabled:opacity-60';
  const primary = `${btn} border-grove-lime bg-grove-lime text-grove-root`;
  const equal = `${btn} border-grove-fernLine text-grove-cream hover:border-grove-lime`;
  const quiet = `${btn} border-transparent text-grove-sage underline underline-offset-2`;

  if (!remindersDone && remindersOn) {
    return (
      <section aria-label="Reminders" data-testid="reminder-note" className="rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-4">
        <p className="font-plant text-lg text-grove-cream">One reminder a day, only when needed</p>
        <p className="mt-1 font-ui text-sm text-grove-sage">We send a single message when plants need a check. You can turn it off any time.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={doneReminders} data-testid="reminder-keep" className={primary}>Sounds good</button>
          <button type="button" onClick={turnOffReminders} data-testid="reminder-off" className={equal}>Turn off</button>
          <button type="button" onClick={() => navigate('/settings/notifications')} className={quiet}>Settings</button>
        </div>
      </section>
    );
  }

  const askPets = user && (user.has_pets === undefined || user.has_pets === null) && !petsSkipped && (remindersDone || !remindersOn);
  if (askPets) {
    return (
      <section aria-label="Pets" data-testid="pets-note" className="rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-4">
        <p className="font-plant text-lg text-grove-cream">Do you have pets at home?</p>
        <p className="mt-1 font-ui text-sm text-grove-sage">If you do, we will show whether each of your plants is safe for them.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => answerPets(true)} data-testid="pets-yes" className={primary}>Yes</button>
          <button type="button" disabled={saving} onClick={() => answerPets(false)} data-testid="pets-no" className={equal}>No pets</button>
          <button type="button" onClick={skipPets} className={quiet}>Not now</button>
        </div>
      </section>
    );
  }
  return null;
}
