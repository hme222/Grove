import React, { useEffect, useRef } from 'react';
import { Sprout } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { success, impactLight } from '../lib/haptics';
import { tint } from '../lib/color';
import { holdFirstRun } from '../lib/firstRunGate';

// The milestone after someone adds their very first plant. The add screens send the person to /plants with
// `state.firstPlant = { id, name }` only when the grove was empty, so this shows once. It is the same kind of moment
// as the first-care celebration: a card over a dim backdrop, leaves that burst once, one clear next step.
// Closing clears the router state, so going back or reloading never replays it.

export const firstPlantState = (plant) => ({ firstPlant: { id: plant && plant.id, name: (plant && (plant.nickname || plant.common_name)) || 'Your plant' } });

// Is the grove empty right now? Asked before the first plant is saved. A failed check means "not first", so a
// network hiccup never shows a milestone that did not happen.
export async function groveIsEmpty(plantAPI) {
  try {
    const res = await plantAPI.getAll({ limit: 1 });
    const data = res.data;
    const list = Array.isArray(data) ? data : (data && data.plants) || [];
    const total = data && typeof data.total === 'number' ? data.total : list.length;
    return total === 0;
  } catch {
    return false;
  }
}

const BURSTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = 70 + (i % 3) * 12;
  return {
    dx: Math.round(Math.cos(angle) * radius), dy: Math.round(Math.sin(angle) * radius),
    rot: Math.round(((i * 47) % 90) - 45), color: i % 3 === 0 ? 'var(--grove-lime)' : 'var(--grove-sprout)', delay: (i % 6) * 35,
  };
});

export default function FirstPlantCelebration() {
  const location = useLocation();
  const navigate = useNavigate();
  const plant = location.state && location.state.firstPlant;
  const open = !!plant;
  const fired = useRef(false);

  useEffect(() => (open ? holdFirstRun() : undefined), [open]);
  useEffect(() => {
    if (!open || fired.current) return;
    fired.current = true;
    try { success(document.body); } catch { /* no-op */ }
  }, [open]);

  if (!open) return null;

  const close = (e) => {
    impactLight((e && e.currentTarget) || document.body);
    navigate(location.pathname, { replace: true, state: null });
  };
  const meet = () => navigate(`/plants/${plant.id}`, { state: { name: plant.name } });

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-celebration grove-celebrate-fade" style={{ background: tint('var(--grove-root)', 78) }} />
        <div className="pointer-events-none fixed inset-0 z-celebration flex items-center justify-center px-4">
          <DialogPrimitive.Content
            data-testid="first-plant-celebration"
            className="pointer-events-auto w-full max-w-dialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              e.currentTarget?.querySelector('[data-testid="first-plant-celebration-cta"]')?.focus();
            }}
          >
            <div className="grove-celebrate-pop relative w-full rounded-card border-hairline border-grove-lime/40 bg-grove-canopy px-6 py-8">
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center" aria-hidden="true">
                <div className="relative mt-24 h-px w-px">
                  {BURSTS.map((b, i) => (
                    <span
                      key={i}
                      className="grove-leaf-burst"
                      style={{
                        left: 0, top: 0, background: b.color, borderRadius: '50% 0 50% 0', animationDelay: `${b.delay}ms`,
                        '--grove-burst-x': `${b.dx}px`, '--grove-burst-y': `${b.dy}px`, '--grove-burst-r': `${b.rot}deg`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-grove-lime text-grove-root">
                  <Sprout className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="font-ui text-sm font-medium text-grove-sprout">First plant</p>
                <DialogPrimitive.Title className="mt-1 font-plant text-2xl text-grove-cream">
                  You added your first plant!
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 font-ui text-sm leading-relaxed text-grove-cream" data-testid="first-plant-celebration-text">
                  {plant.name} is the start of your grove. Its care schedule and its story begin today.
                </DialogPrimitive.Description>
                <button type="button" onClick={meet} data-testid="first-plant-celebration-cta" className={cn(buttonVariants(), 'mt-5 min-h-touch w-full')}>
                  Meet {plant.name}
                </button>
                <button
                  type="button"
                  onClick={close}
                  data-testid="first-plant-celebration-close"
                  className="mt-2 min-h-touch px-4 font-ui text-sm text-grove-sprout underline underline-offset-4"
                >
                  See my plants
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
