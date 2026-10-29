import React, { useEffect, useMemo, useState } from 'react';
import Loading from '../components/Loading';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { toast } from 'sonner';
import { Mail, Phone, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { verificationAPI } from '../lib/api';
import {
  PACT_VERSION,
  WELCOME_COPY,
  IDENTITY_COPY,
  PACT_INTRO,
  PACT_SECTIONS,
  FINAL_COPY,
  SUCCESS_COPY,
} from '../lib/pactContent';

/**
 * Phase 14C.3.a — 8-section pact verification flow.
 *
 * Friction is the feature. Each of the 8 community-pact sections has its own
 * required checkbox. There is no "agree to all" shortcut. The "I agree" CTA
 * stays disabled until every section has been individually acknowledged.
 *
 * Steps:
 *   1) welcome     → Welcome screen
 *   2) identity    → Email confirmation (+ optional phone)
 *   3) pact        → 8 expandable sections + 8 individual checkboxes
 *   4) final       → Closing oath + "I agree — verify me" / "Not yet"
 *   5) success     → "You're verified ✓" + Browse swaps CTA
 *
 * Pact text is rendered VERBATIM from `lib/pactContent.js`. If the pact is
 * ever updated, bump PACT_VERSION there and on the backend; previously
 * verified users will be required to re-verify before their next swap.
 */

const STEPS = ['welcome', 'identity', 'pact', 'final', 'success'];

export default function VerifyPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState('welcome');
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // identity-step local state
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneSavedOrSkipped, setPhoneSavedOrSkipped] = useState(false);

  // pact-step local state
  const [acks, setAcks] = useState({}); // { 1: bool, 2: bool, ... 8: bool }
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [vRes] = await Promise.all([verificationAPI.status()]);
        if (!alive) return;
        const v = vRes.data;
        setVerification(v);
        setEmailConfirmed(!!v.verification_email_confirmed);
        setPhone(v.verification_phone || '');
        setPhoneSavedOrSkipped(!!(v.verification_phone || v.verification_phone_skipped));
        // If user is already verified on the current pact, jump straight to
        // a friendly success state — they shouldn't be forced through the
        // flow again unless the pact version has changed.
        if (v.verified_user && v.verification_pact_version === PACT_VERSION && !v.needs_reverification) {
          setStep('success');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const allAcksTrue = useMemo(
    () => PACT_SECTIONS.every((s) => acks[s.number] === true),
    [acks]
  );
  const ackedCount = useMemo(
    () => PACT_SECTIONS.filter((s) => acks[s.number] === true).length,
    [acks]
  );

  const handleStart = async () => {
    try {
      await verificationAPI.start();
    } catch (e) { /* non-fatal */ }
    setStep('identity');
  };

  const handleConfirmEmail = async () => {
    setSubmitting(true);
    try {
      const res = await verificationAPI.confirmEmail();
      setVerification(res.data);
      setEmailConfirmed(true);
      toast.success('Email confirmed');
    } catch (e) {
      toast.error('Could not confirm email. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPhone = async () => {
    if (!phone.trim()) {
      toast.error('Enter a phone number or tap Skip.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await verificationAPI.setPhone({ phone: phone.trim() });
      setVerification(res.data);
      setPhoneSavedOrSkipped(true);
      toast.success('Phone added');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Could not save phone. Try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipPhone = async () => {
    setSubmitting(true);
    try {
      const res = await verificationAPI.setPhone({ skip: true });
      setVerification(res.data);
      setPhoneSavedOrSkipped(true);
    } catch (e) {
      toast.error('Could not skip. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgree = async () => {
    if (!allAcksTrue) {
      toast.error('Please acknowledge all 8 sections.');
      return;
    }
    setSubmitting(true);
    try {
      const ackPayload = {};
      PACT_SECTIONS.forEach((s) => { ackPayload[s.number] = !!acks[s.number]; });
      const res = await verificationAPI.agree({
        acknowledgments: ackPayload,
        pact_version: PACT_VERSION,
      });
      setVerification(res.data);
      // Refresh user so swap eligibility updates app-wide
      try { await refreshUser?.(); } catch (e) { /* non-fatal */ }
      setStep('success');
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = (detail && typeof detail === 'object' && detail.message)
        || (typeof detail === 'string' ? detail : null)
        || 'Could not complete verification. Try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Loading label="Loading" className="min-h-panel" data-testid="verify-loading" />
    );
  }

  // Back leaves the flow from the first step and otherwise steps back inside it. The finished screen has none.
  const PREVIOUS_STEP = { identity: 'welcome', pact: 'identity', final: 'pact' };
  const headerBack = step === 'success' ? undefined
    : step === 'welcome' ? { testId: 'verify-header-back' }
    : { onClick: () => setStep(PREVIOUS_STEP[step]), testId: 'verify-header-back' };

  return (
    <div className="min-h-screen bg-grove-forest pb-24" data-testid="verify-page">
      <PageHeader title="Verify" back={headerBack} />
      <div className="max-w-reading mx-auto px-5 pt-10">
        <ProgressDots step={step} />

        {step === 'welcome' && (
          <WelcomeStep onContinue={handleStart} onCancel={() => navigate(-1)} />
        )}

        {step === 'identity' && (
          <IdentityStep
            user={user}
            verification={verification}
            emailConfirmed={emailConfirmed}
            phone={phone}
            setPhone={setPhone}
            phoneSavedOrSkipped={phoneSavedOrSkipped}
            submitting={submitting}
            onConfirmEmail={handleConfirmEmail}
            onAddPhone={handleAddPhone}
            onSkipPhone={handleSkipPhone}
            onContinue={() => setStep('pact')}
            onBack={() => setStep('welcome')}
          />
        )}

        {step === 'pact' && (
          <PactStep
            acks={acks}
            setAcks={setAcks}
            openSection={openSection}
            setOpenSection={setOpenSection}
            ackedCount={ackedCount}
            allAcksTrue={allAcksTrue}
            onContinue={() => setStep('final')}
            onBack={() => setStep('identity')}
          />
        )}

        {step === 'final' && (
          <FinalStep
            allAcksTrue={allAcksTrue}
            submitting={submitting}
            onAgree={handleAgree}
            onDecline={() => setStep('pact')}
            onBack={() => setStep('pact')}
          />
        )}

        {step === 'success' && (
          <SuccessStep onBrowseSwaps={() => navigate('/swaps')} />
        )}
      </div>
    </div>
  );
}

// -------------------- Steps --------------------

function ProgressDots({ step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8" data-testid="verify-progress-dots">
      {STEPS.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-pill transition-all duration-200 ${
            i <= idx ? 'bg-grove-lime w-6' : 'bg-grove-moss w-3'
          }`}
        />
      ))}
    </div>
  );
}

function StepCard({ children, testid }) {
  return (
    <div
      className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5 sm:p-5 shadow-rest"
      data-testid={testid}
    >
      {children}
    </div>
  );
}

function WelcomeStep({ onContinue, onCancel }) {
  return (
    <StepCard testid="verify-step-welcome">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-pill bg-grove-lime/15 mb-4">
        <ShieldCheck className="h-6 w-6 text-grove-sprout" />
      </span>
      <h2 className="font-plant text-grove-cream text-2xl leading-tight mb-4">
        {WELCOME_COPY.heading}
      </h2>
      <div className="space-y-3 font-ui text-sm text-grove-cream leading-relaxed">
        {WELCOME_COPY.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onContinue}
          data-testid="verify-welcome-continue"
          className={cn(buttonVariants(), "transition-colors duration-150")}
        >
          {WELCOME_COPY.cta}
        </button>
        <button
          type="button"
          onClick={onCancel}
          data-testid="verify-welcome-cancel"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </button>
      </div>
    </StepCard>
  );
}

function IdentityStep({
  user, verification, emailConfirmed, phone, setPhone, phoneSavedOrSkipped,
  submitting, onConfirmEmail, onAddPhone, onSkipPhone, onContinue, onBack,
}) {
  const canContinue = emailConfirmed; // phone is optional
  return (
    <StepCard testid="verify-step-identity">
      <h2 className="font-plant text-grove-cream text-xl mb-2">{IDENTITY_COPY.heading}</h2>
      <p className="font-ui text-xs text-grove-sage mb-5">{IDENTITY_COPY.intro}</p>

      <div className="space-y-3">
        {/* Email row */}
        <div
          className={`rounded-chip border-hairline p-4 ${
            emailConfirmed ? 'bg-grove-moss border-grove-fernLine' : 'bg-grove-canopy border-grove-moss'
          }`}
          data-testid="verify-email-row"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-grove-sprout mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-ui text-xs font-medium text-grove-cream">
                <strong>{IDENTITY_COPY.emailLabel}</strong>: {IDENTITY_COPY.emailDescription}
              </p>
              {user?.email && (
                <p className="font-ui text-xs text-grove-sage mt-1 break-all">{user.email}</p>
              )}
            </div>
            {emailConfirmed ? (
              <span className="inline-flex items-center gap-1 text-grove-sprout font-ui text-xs font-medium">
                <CheckCircle2 className="h-4 w-4" /> Confirmed
              </span>
            ) : (
              <button
                type="button"
                onClick={onConfirmEmail}
                disabled={submitting}
                data-testid="verify-confirm-email-btn"
                className={cn(buttonVariants(), "transition-colors duration-150 disabled:opacity-50")}
              >
                Verify email
              </button>
            )}
          </div>
        </div>

        {/* Phone row */}
        <div
          className={`rounded-chip border-hairline p-4 ${
            phoneSavedOrSkipped ? 'bg-grove-moss border-grove-fernLine' : 'bg-grove-canopy border-grove-moss'
          }`}
          data-testid="verify-phone-row"
        >
          <div className="flex items-start gap-3 mb-3">
            <Phone className="h-4 w-4 text-grove-sprout mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-ui text-xs font-medium text-grove-cream">
                <strong>{IDENTITY_COPY.phoneLabel}</strong>{' '}
                <span className="font-latin italic text-grove-lichen">{IDENTITY_COPY.phoneOptional}</span>: {IDENTITY_COPY.phoneDescription}
              </p>
            </div>
            {phoneSavedOrSkipped && (
              <span className="inline-flex items-center gap-1 text-grove-sprout font-ui text-xs font-medium">
                <CheckCircle2 className="h-4 w-4" /> Done
              </span>
            )}
          </div>
          {!phoneSavedOrSkipped && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input aria-label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                autoComplete="tel"
                data-testid="verify-phone-input"
                className="flex-1 rounded-tag border-hairline border-grove-moss bg-grove-canopy px-3 py-2 font-ui text-xs text-grove-cream placeholder:text-grove-lichen focus:outline-none focus:border-grove-fernLine"
              />
              <button
                type="button"
                onClick={onAddPhone}
                disabled={submitting}
                data-testid="verify-add-phone-btn"
                className={cn(buttonVariants(), "transition-colors duration-150 disabled:opacity-50")}
              >
                Add phone
              </button>
              <button
                type="button"
                onClick={onSkipPhone}
                disabled={submitting}
                data-testid="verify-skip-phone-btn"
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Skip phone
              </button>
            </div>
          )}
          {phoneSavedOrSkipped && verification?.verification_phone && (
            <p className="font-ui text-xs text-grove-sage ml-6">{verification.verification_phone}</p>
          )}
          {phoneSavedOrSkipped && verification?.verification_phone_skipped && !verification?.verification_phone && (
            <p className="font-latin italic text-xs text-grove-lichen ml-6">Skipped. You can add this later from Profile.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          data-testid="verify-identity-continue"
          className={cn(buttonVariants(), "transition-colors duration-150")}
        >
          Continue to pact
        </button>
        <button
          type="button"
          onClick={onBack}
          data-testid="verify-identity-back"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back
        </button>
      </div>
    </StepCard>
  );
}

function PactStep({ acks, setAcks, openSection, setOpenSection, ackedCount, allAcksTrue, onContinue, onBack }) {
  const toggleSection = (n) => setOpenSection((prev) => (prev === n ? null : n));
  const toggleAck = (n) => setAcks((prev) => ({ ...prev, [n]: !prev[n] }));

  return (
    <StepCard testid="verify-step-pact">
      <h2 className="font-plant text-grove-cream text-xl mb-2">{PACT_INTRO.heading}</h2>
      <p className="font-ui text-xs text-grove-sage mb-5">{PACT_INTRO.body}</p>

      <div className="rounded-inset border-hairline border-grove-moss bg-grove-moss p-3 mb-4 flex items-center gap-2">
        <span className="font-ui text-xs font-medium text-grove-cream">
          Acknowledged
        </span>
        <span
          className="font-ui text-xs text-grove-cream"
          data-testid="verify-pact-ack-count"
        >
          {ackedCount} of 8
        </span>
        <span className="ml-auto font-latin italic text-xs text-grove-lichen">
          Each section needs its own checkbox
        </span>
      </div>

      <ul className="space-y-2.5" data-testid="verify-pact-sections">
        {PACT_SECTIONS.map((s) => {
          const isOpen = openSection === s.number;
          const isAcked = !!acks[s.number];
          return (
            <li
              key={s.number}
              className={`rounded-chip border-hairline overflow-hidden transition-colors duration-150 ${
                isAcked ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-canopy'
              }`}
              data-testid={`pact-section-${s.number}`}
            >
              <button
                type="button"
                onClick={() => toggleSection(s.number)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-grove-night/[0.02] transition-colors duration-150"
                aria-expanded={isOpen}
                data-testid={`pact-section-${s.number}-toggle`}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-pill bg-grove-lime/15 text-grove-sprout font-ui text-xs font-medium flex items-center justify-center">
                  {s.number}
                </span>
                <span className="flex-1 min-w-0 font-ui text-sm font-medium text-grove-cream">
                  {s.title}
                </span>
                {isAcked && (
                  <CheckCircle2 className="h-4 w-4 text-grove-sprout flex-shrink-0" />
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-grove-sage flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-grove-sage flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t-hairline border-grove-moss">
                  {s.bodyAsList ? (
                    <ul className="space-y-1.5 font-ui text-xs text-grove-cream leading-relaxed mt-3 ml-1">
                      {s.body.map((line, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-grove-sprout flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2 font-ui text-xs text-grove-cream leading-relaxed mt-3">
                      {s.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                  <label
                    className={`mt-4 flex items-start gap-3 cursor-pointer rounded-inset border-hairline p-3 transition-colors duration-150 ${
                      isAcked ? 'border-grove-fernLine bg-grove-canopy' : 'border-grove-moss bg-grove-canopy hover:border-grove-fernLine'
                    }`}
                    data-testid={`pact-section-${s.number}-ack-label`}
                  >
                    <input
                      type="checkbox"
                      checked={isAcked}
                      onChange={() => toggleAck(s.number)}
                      className="mt-0.5 h-4 w-4 accent-grove-lime cursor-pointer flex-shrink-0"
                      data-testid={`pact-section-${s.number}-checkbox`}
                    />
                    <span className="font-ui italic text-xs font-medium text-grove-cream leading-snug">
                      {s.acknowledgement}
                    </span>
                  </label>
                </div>
              )}
              {!isOpen && (
                <div className="px-4 pb-3 -mt-1 ml-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Tapping the off-state mini-checkbox auto-opens the
                      // section; users still must read & tick inside. We do
                      // not let them ack from outside the expanded view.
                      if (!isAcked) {
                        setOpenSection(s.number);
                      } else {
                        toggleAck(s.number);
                      }
                    }}
                    className="flex items-center gap-1.5 font-ui text-xs text-grove-sage hover:text-grove-cream transition-colors duration-150"
                    data-testid={`pact-section-${s.number}-mini-state`}
                  >
                    {isAcked ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-grove-sprout" />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5 text-grove-lichen" />
                        <span className="font-latin italic">Tap to read &amp; acknowledge</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!allAcksTrue}
          data-testid="verify-pact-continue"
          className={cn(buttonVariants(), "transition-colors duration-150")}
        >
          {allAcksTrue ? 'Continue to final agreement' : `Acknowledge all 8 (${ackedCount}/8)`}
        </button>
        <button
          type="button"
          onClick={onBack}
          data-testid="verify-pact-back"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back
        </button>
      </div>
    </StepCard>
  );
}

function FinalStep({ allAcksTrue, submitting, onAgree, onDecline }) {
  return (
    <StepCard testid="verify-step-final">
      <h2 className="font-plant text-grove-cream text-xl mb-2">{FINAL_COPY.heading}</h2>
      <p className="font-ui text-xs text-grove-sage mb-4">{FINAL_COPY.intro}</p>

      <blockquote className="rounded-chip border-hairline border-grove-fernLine bg-grove-moss p-5 my-4">
        <p className="font-plant italic text-label text-grove-cream leading-relaxed">
          "{FINAL_COPY.oath}"
        </p>
      </blockquote>

      <p className="font-ui text-xs text-grove-cream leading-relaxed">{FINAL_COPY.outro}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onAgree}
          disabled={!allAcksTrue || submitting}
          data-testid="verify-final-agree"
          className={cn(buttonVariants(), "transition-colors duration-150")}
        >
          {submitting ? 'Verifying…' : FINAL_COPY.ctaAgree}
        </button>
        <button
          type="button"
          onClick={onDecline}
          data-testid="verify-final-decline"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          {FINAL_COPY.ctaDecline}
        </button>
      </div>
      {!allAcksTrue && (
        <p className="font-latin italic text-xs text-grove-sun mt-3" data-testid="verify-final-warning">
          Go back and acknowledge each of the 8 sections before agreeing.
        </p>
      )}
    </StepCard>
  );
}

function SuccessStep({ onBrowseSwaps }) {
  return (
    <StepCard testid="verify-step-success">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-pill bg-grove-lime/15 mb-4">
        <ShieldCheck className="h-7 w-7 text-grove-sprout" />
      </span>
      <h2 className="font-plant text-grove-cream text-2xl mb-2 flex items-center gap-2">
        {SUCCESS_COPY.heading}
        <CheckCircle2 className="h-5 w-5 text-grove-sprout" />
      </h2>
      <p className="font-ui text-sm text-grove-cream leading-relaxed mb-6">{SUCCESS_COPY.body}</p>

      <div
        className="rounded-chip border-hairline border-grove-fernLine bg-grove-moss p-4 flex items-center gap-3 mb-6"
        data-testid="verify-success-badge-card"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-pill bg-grove-lime text-grove-root">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-ui text-xs font-medium text-grove-sage">
            {SUCCESS_COPY.badgeLabel}
          </p>
          <p className="font-plant text-label text-grove-cream">{SUCCESS_COPY.badgeName}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBrowseSwaps}
        data-testid="verify-success-browse"
        className={cn(buttonVariants(), "transition-colors duration-150")}
      >
        {SUCCESS_COPY.cta}
      </button>
    </StepCard>
  );
}
