import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '../../contexts/AuthContext';
import { usePipPrefs } from '../../lib/pipPrefs';
import { usePipForm } from '../../nook/usePipForm';
import PipPanel from '../../nook/PipPanel';
import SymptomHelp, { SafetyNote } from './SymptomHelp';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';
import { HelpSheetContext } from './helpSheetContext';

export { useHelpSheet } from './helpSheetContext';

// One help sheet for the whole app. The Help button in every header and Pip both open it, over whatever screen the person
// is on, so they keep their place. It holds the same quick checks as the Help my plant page, with the pet and child
// safety line first because that one is urgent.

export function HelpSheetProvider({ children }) {
  const [open, setOpen] = useState(false);
  // Whatever had focus when the sheet opened (the Help button, or Pip), so closing can give focus back to it.
  const opener = useRef(null);
  const value = useMemo(() => ({ open: () => { opener.current = document.activeElement; setOpen(true); } }), []);
  return (
    <HelpSheetContext.Provider value={value}>
      {children}
      <HelpSheet open={open} onClose={() => setOpen(false)} opener={opener} />
    </HelpSheetContext.Provider>
  );
}

function HelpSheet({ open, onClose, opener }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shows } = usePipPrefs();
  const pipForm = usePipForm(!!(user && user.nook_enabled));
  const titleRef = useRef(null);
  const safetyRef = useRef(null);
  const [showSafety, setShowSafety] = useState(false);

  useEffect(() => { if (!open) setShowSafety(false); }, [open]);
  useEffect(() => { if (showSafety && safetyRef.current) safetyRef.current.focus(); }, [showSafety]);

  if (!open) return null;

  const fullPage = () => { onClose(); navigate('/help-my-plant'); };

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-sheet bg-scrim" />
        <DialogPrimitive.Content
          data-testid="help-sheet"
          className="fixed inset-x-0 bottom-0 z-sheet mx-auto max-h-sheet w-full max-w-dialog overflow-y-auto rounded-t-card border-hairline border-grove-lime/40 bg-grove-canopy px-4 pb-6 pt-4 text-grove-cream"
          onOpenAutoFocus={(e) => { e.preventDefault(); if (titleRef.current) titleRef.current.focus(); }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const back = opener && opener.current;
            if (back && document.contains(back) && back.focus) back.focus();
          }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0" aria-hidden="true" data-testid="help-sheet-mark">
              {shows ? <PipPanel form={pipForm} scale={2} label="" /> : <Leaf className="h-8 w-8 text-grove-sprout" />}
            </div>
            <DialogPrimitive.Title ref={titleRef} tabIndex={-1} className="min-w-0 flex-1 self-center font-plant text-2xl text-grove-cream focus:outline-none">
              What are you seeing?
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close help"
              data-testid="help-sheet-close"
              className="flex h-touch w-touch shrink-0 items-center justify-center rounded-pill text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">Quick checks for a plant that looks wrong. These are common causes, not a diagnosis.</DialogPrimitive.Description>

          <button
            type="button"
            onClick={() => setShowSafety((v) => !v)}
            aria-expanded={showSafety}
            data-testid="help-sheet-urgent"
            className="mt-4 flex min-h-touch w-full items-center rounded-small border-hairline border-destructive bg-grove-moss px-4 py-3 text-left font-ui text-sm text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
          >
            A pet or child ate a plant. Get help now.
          </button>
          {showSafety && <div className="mt-3"><SafetyNote headingRef={safetyRef} /></div>}

          <div className="mt-5">
            <SymptomHelp withSafety={false} onLeave={onClose} />
          </div>

          <button
            type="button"
            onClick={fullPage}
            data-testid="help-sheet-full-page"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 w-full')}
          >
            Open the full page
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
