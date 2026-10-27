import React, { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { useNavigate } from 'react-router-dom';
import { swapsAPI } from '../lib/api';
import { LoadErrorPage } from '../components/LoadError';
import { PageHeader } from '../components/PageHeader';
import { Repeat, Lock, CheckCircle2, Circle, Calendar, Crown, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

/**
 * Phase 14C — Swaps page.
 *
 * For users meeting all 3 conditions (≥90 days · Pro · verified) this is the
 * full Swap feed (placeholder content for now — actual swap listings ship
 * later). For everyone else, this page shows the gating message + a 3-checkbox
 * progress card explaining exactly what's still required.
 *
 * Gating message verbatim from Phase 14 v2 § 7.6:
 *   "Swaps unlock at 3 months on FloraGrove with a Pro subscription, after a
 *    one-time verification."
 */
export default function SwapsPage() {
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const res = await swapsAPI.eligibility();
      setEligibility(res.data);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loadError) {
    return <LoadErrorPage back title="Swaps" what="swaps" onRetry={load} />;
  }
  if (loading) {
    return (
      <Loading label="Loading swaps" className="min-h-panel" />
    );
  }

  const eligible = eligibility?.eligible;
  const ageDays = eligibility?.account_age_days || 0;
  const ageDaysCompleted = ageDays >= 90;
  const proCompleted = !!eligibility?.pro_active;
  const verifiedCompleted = !!eligibility?.is_verified;

  return (
    <div className="pb-24" data-testid="swaps-page">
      <PageHeader title="Swaps" back />

      <div className="max-w-page mx-auto px-4 pt-4 space-y-4">
        {!eligible && (
          <div
            className="rounded-card border-hairline border-grove-moss bg-grove-sun/15 p-5"
            data-testid="swaps-locked-card"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="w-10 h-10 rounded-pill bg-grove-sun/25 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-grove-sun" />
              </span>
              <div className="flex-1">
                <h2 className="font-plant text-grove-cream text-base font-semibold leading-tight">
                  Swaps unlock at 3 months on FloraGrove with a Pro subscription, after a one-time verification.
                </h2>
                <p className="font-ui text-xs text-grove-sage leading-relaxed mt-2">
                  The friction is intentional. We want growers who are committed before they trade plants — too many free communities have learned this the hard way.
                </p>
              </div>
            </div>

            <ul className="space-y-2 mt-4" data-testid="swaps-progress-checklist">
              <ProgressItem
                done={ageDaysCompleted}
                icon={Calendar}
                title="Use FloraGrove for at least 3 months"
                detail={
                  ageDaysCompleted
                    ? `You’ve been on FloraGrove for ${ageDays} days.`
                    : `${ageDays} of 90 days. ${90 - ageDays} more to go.`
                }
                testid="swap-condition-account-age"
              />
              <ProgressItem
                done={proCompleted}
                icon={Crown}
                title="Active Pro subscription"
                detail={proCompleted ? 'Pro is active.' : 'Upgrade to Pro from your Profile.'}
                cta={!proCompleted ? { label: 'Upgrade', onClick: () => navigate('/profile') } : null}
                testid="swap-condition-pro"
              />
              <ProgressItem
                done={verifiedCompleted}
                icon={Shield}
                title="Complete the one-time verification"
                detail={
                  verifiedCompleted
                    ? "You’re verified."
                    : 'Sign the 8-section FloraGrove community pact.'
                }
                cta={!verifiedCompleted ? { label: 'Start verification', onClick: () => navigate('/verify') } : null}
                testid="swap-condition-verified"
              />
            </ul>
          </div>
        )}

        {eligible && (
          <div
            className="rounded-card border-hairline border-grove-fernLine bg-grove-moss p-5 text-center"
            data-testid="swaps-eligible-card"
          >
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-pill bg-grove-lime/15 mb-3">
              <Repeat className="h-6 w-6 text-grove-sprout" />
            </span>
            <h2 className="font-plant text-grove-cream text-xl font-semibold">You’re cleared to swap</h2>
            <p className="font-ui text-xs text-grove-sage mt-1 leading-relaxed">
              Swap listings ship next — for now this is your verified-grower lounge. Browse, want-list, and stay tuned.
            </p>
            <button
              type="button"
              onClick={() => navigate('/swap')}
              data-testid="swaps-offer-button"
              className={cn(buttonVariants(), "mt-4")}
            >
              Browse swaps
            </button>
          </div>
        )}

        {/* Discovery surface — visible to everyone, transactable only by eligible users */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h3 className="font-plant text-grove-cream text-base font-semibold ">What you’ll trade</h3>
          <ul className="mt-2 space-y-1.5 font-ui text-xs text-grove-cream leading-relaxed">
            <li>• Cuttings from your established plants — Pothos, Monstera, String of Pearls.</li>
            <li>• Divisions of clumping perennials — Snake Plant pups, Spider Plant runners.</li>
            <li>• Seeds you saved — Black-eyed Susan and Coneflower for native pollinator beds.</li>
            <li>• Bulbs and corms in season — Anemone, Dahlia tubers in fall.</li>
          </ul>
          <p className="font-latin italic text-xs text-grove-lichen mt-3 leading-snug">
            All trades are between verified growers. FloraGrove never handles money or shipping.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressItem({ done, icon: Icon, title, detail, cta, testid }) {
  return (
    <li
      data-testid={testid}
      className={`rounded-small border-hairline px-4 py-3 flex items-start gap-3 ${
        done ? 'bg-grove-moss border-grove-fernLine' : 'bg-grove-canopy border-grove-moss'
      }`}
    >
      <span className="flex-shrink-0 mt-0.5">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-grove-sprout" />
        ) : (
          <Circle className="h-4 w-4 text-grove-sage" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <p className="font-ui text-xs font-medium text-grove-cream flex items-center gap-1.5">
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {title}
        </p>
        <p className="font-ui text-xs text-grove-sage mt-0.5">{detail}</p>
      </span>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          className={cn(buttonVariants({ variant: 'outline' }), "flex-shrink-0")}
        >
          {cta.label}
        </button>
      )}
    </li>
  );
}
