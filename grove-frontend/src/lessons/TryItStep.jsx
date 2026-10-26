import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

// The last card for a lesson with a natural action. The main button saves the lesson as done and
// goes to the place where the action happens. Without a plant it offers Add a plant instead, and
// saves nothing.
export default function TryItStep({ action, hasPlant, onStart, onNotYet }) {
  const navigate = useNavigate();
  const needsPlant = action.to === '/plants' && !hasPlant;
  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="try-it-step">
      <p className="font-plant text-grove-cream text-lg mb-1">Try it on your plant</p>
      <p className="text-sm text-grove-cream mb-3">
        {needsPlant ? 'You will need a plant for this step. Add one and this lesson will be waiting.' : action.text}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNotYet}
          className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
          data-testid="try-it-not-yet"
        >
          Not yet
        </button>
        {needsPlant ? (
          <button
            type="button"
            onClick={() => navigate('/add-plant')}
            className={cn(buttonVariants(), 'flex-1')}
            data-testid="try-it-add-plant"
          >
            Add a plant
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStart(action.to)}
            className={cn(buttonVariants(), 'flex-1')}
            data-testid="try-it-go"
          >
            {action.cta}
          </button>
        )}
      </div>
    </div>
  );
}
