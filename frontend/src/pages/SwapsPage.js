import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { swapsAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Repeat, Lock, CheckCircle2, Circle, Calendar, Crown, Shield } from 'lucide-react';

/**
 * Phase 14C — Swaps page.
 *
 * For users meeting all 3 conditions (≥90 days · Pro · verified) this is the
 * full Swap feed (placeholder content for now — actual swap listings ship
 * later). For everyone else, this page shows the gating message + a 3-checkbox
 * progress card explaining exactly what's still required.
 *
 * Gating message verbatim from Phase 14 v2 § 7.6:
 *   "Swaps unlock at 3 months on Grove with a Pro subscription, after a
 *    one-time verification."
 */
export default function SwapsPage() {
  const navigate = useNavigate();
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await swapsAPI.eligibility();
        if (alive) setEligibility(res.data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const eligible = eligibility?.eligible;
  const ageDays = eligibility?.account_age_days || 0;
  const ageDaysCompleted = ageDays >= 90;
  const proCompleted = !!eligibility?.pro_active;
  const verifiedCompleted = !!eligibility?.is_verified;

  return (
    <div className="pb-24" data-testid="swaps-page">
      <PageHeader title="Swaps" subtitle="Trade cuttings, divisions, and seeds with growers nearby" />

      <div className="max-w-[1100px] mx-auto px-4 pt-4 space-y-4">
        {!eligible && (
          <div
            className="rounded-[14px] border-[0.5px] border-[#BA7517] bg-[#FBF1E1] p-5"
            data-testid="swaps-locked-card"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="w-10 h-10 rounded-full bg-[#BA7517]/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-[#7A4F0E]" />
              </span>
              <div className="flex-1">
                <h2 className="font-plant text-[#1C2E10] text-lg leading-tight">
                  Swaps unlock at 3 months on Grove with a Pro subscription, after a one-time verification.
                </h2>
                <p className="font-ui text-xs text-[#5F5E5A] leading-relaxed mt-2">
                  The friction is intentional. We want growers who are committed before they trade plants — too many free communities have learned this the hard way.
                </p>
              </div>
            </div>

            <ul className="space-y-2 mt-4" data-testid="swaps-progress-checklist">
              <ProgressItem
                done={ageDaysCompleted}
                icon={Calendar}
                title="Use Grove for at least 3 months"
                detail={
                  ageDaysCompleted
                    ? `You've been on Grove for ${ageDays} days.`
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
                    ? "You're verified."
                    : 'Sign the 8-section Grove community pact.'
                }
                cta={!verifiedCompleted ? { label: 'Start verification', onClick: () => navigate('/verify') } : null}
                testid="swap-condition-verified"
              />
            </ul>
          </div>
        )}

        {eligible && (
          <div
            className="rounded-[14px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] p-5 text-center"
            data-testid="swaps-eligible-card"
          >
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3B6D11]/15 mb-3">
              <Repeat className="h-6 w-6 text-[#3B6D11]" />
            </span>
            <h2 className="font-plant text-[#1C2E10] text-lg">You're cleared to swap</h2>
            <p className="font-ui text-xs text-[#5F5E5A] mt-1 leading-relaxed">
              Swap listings ship next — for now this is your verified-grower lounge. Browse, want-list, and stay tuned.
            </p>
          </div>
        )}

        {/* Discovery surface — visible to everyone, transactable only by eligible users */}
        <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-5">
          <h3 className="font-plant text-[#1C2E10] text-sm uppercase tracking-[0.08em]">What you'll trade</h3>
          <ul className="mt-2 space-y-1.5 font-ui text-xs text-[#2B2B26] leading-relaxed">
            <li>• Cuttings from your established plants — Pothos, Monstera, String of Pearls.</li>
            <li>• Divisions of clumping perennials — Snake Plant pups, Spider Plant runners.</li>
            <li>• Seeds you saved — Black-eyed Susan and Coneflower for native pollinator beds.</li>
            <li>• Bulbs and corms in season — Anemone, Dahlia tubers in autumn.</li>
          </ul>
          <p className="font-latin italic text-[10px] text-[#888780] mt-3 leading-snug">
            All trades are between verified growers. Grove never handles money or shipping.
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
      className={`rounded-[10px] border-[0.5px] p-3 flex items-start gap-3 ${
        done ? 'bg-[#EAF3DE] border-[#3B6D11]' : 'bg-[#FDFAF6] border-[#D3C9B8]'
      }`}
    >
      <span className="flex-shrink-0 mt-0.5">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-[#3B6D11]" />
        ) : (
          <Circle className="h-4 w-4 text-[#5F5E5A]" />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <p className="font-plant text-xs text-[#1C2E10] flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {title}
        </p>
        <p className="font-ui text-[11px] text-[#5F5E5A] mt-0.5">{detail}</p>
      </span>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          className="flex-shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
        >
          {cta.label}
        </button>
      )}
    </li>
  );
}
