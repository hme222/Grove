import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePipPrefs } from '../../lib/pipPrefs';
import { introPatch, PIP_INTRO } from '../../lib/pipIntroCopy';
import { useOtherThingOpen } from './useOtherThingOpen';
import PipIntroCard from './PipIntroCard';

// Shows Pip's hello once, to someone already using the app, on the first tab-bar screen they reach with nothing else
// open. New people get it in onboarding and never see this. Until it has been answered, Pip shows nothing anywhere else.
export default function PipIntroGate() {
  const { user } = useAuth();
  const { pipOn, introduced, save } = usePipPrefs();
  const otherOpen = useOtherThingOpen();
  const [latched, setLatched] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const eligible = !!user && pipOn && !introduced && !done;
  // Latch once it is allowed to show, so the card's own dialog does not count as "something else open" and hide it again.
  useEffect(() => { if (eligible && !otherOpen) setLatched(true); }, [eligible, otherOpen]);

  if (!eligible || !latched) return null;

  const choose = async (turnOff) => {
    setBusy(true);
    setError('');
    try {
      await save(introPatch(turnOff));
      setDone(true);
    } catch {
      setError(PIP_INTRO.error);
    } finally {
      setBusy(false);
    }
  };
  return <PipIntroCard onChoose={choose} error={error} busy={busy} />;
}
