import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Phone, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { verificationAPI, userAPI } from '../lib/api';
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
      toast.error('Could not confirm email — try again.');
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
      const msg = e?.response?.data?.detail || 'Could not save phone — try again.';
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
      toast.error('Could not skip — try again.');
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
        || 'Could not complete verification — try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="verify-loading">
        <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24" data-testid="verify-page">
      <div className="max-w-[720px] mx-auto px-5 pt-10">
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
          className={`h-1.5 rounded-full transition-all duration-200 ${
            i <= idx ? 'bg-[#3B6D11] w-6' : 'bg-[#D3C9B8] w-3'
          }`}
        />
      ))}
    </div>
  );
}

function StepCard({ children, testid }) {
  return (
    <div
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-6 sm:p-8 shadow-[0_1px_2px_rgba(28,46,16,0.04)]"
      data-testid={testid}
    >
      {children}
    </div>
  );
}

function WelcomeStep({ onContinue, onCancel }) {
  return (
    <StepCard testid="verify-step-welcome">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3B6D11]/10 mb-4">
        <ShieldCheck className="h-6 w-6 text-[#3B6D11]" />
      </span>
      <h1 className="font-plant text-[#1C2E10] text-2xl leading-tight mb-4">
        {WELCOME_COPY.heading}
      </h1>
      <div className="space-y-3 font-ui text-[14px] text-[#2B2B26] leading-relaxed">
        {WELCOME_COPY.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onContinue}
          data-testid="verify-welcome-continue"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150"
        >
          {WELCOME_COPY.cta}
        </button>
        <button
          type="button"
          onClick={onCancel}
          data-testid="verify-welcome-cancel"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
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
      <h2 className="font-plant text-[#1C2E10] text-xl mb-2">{IDENTITY_COPY.heading}</h2>
      <p className="font-ui text-[13px] text-[#5F5E5A] mb-5">{IDENTITY_COPY.intro}</p>

      <div className="space-y-3">
        {/* Email row */}
        <div
          className={`rounded-[10px] border-[0.5px] p-4 ${
            emailConfirmed ? 'bg-[#EAF3DE] border-[#3B6D11]' : 'bg-[#FDFAF6] border-[#D3C9B8]'
          }`}
          data-testid="verify-email-row"
        >
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-plant text-[13px] text-[#1C2E10]">
                <strong>{IDENTITY_COPY.emailLabel}</strong> — {IDENTITY_COPY.emailDescription}
              </p>
              {user?.email && (
                <p className="font-mono text-[12px] text-[#5F5E5A] mt-1 break-all">{user.email}</p>
              )}
            </div>
            {emailConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[#3B6D11] font-plant uppercase tracking-[0.08em] text-[10px]">
                <CheckCircle2 className="h-4 w-4" /> Confirmed
              </span>
            ) : (
              <button
                type="button"
                onClick={onConfirmEmail}
                disabled={submitting}
                data-testid="verify-confirm-email-btn"
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150 disabled:opacity-50"
              >
                Verify email
              </button>
            )}
          </div>
        </div>

        {/* Phone row */}
        <div
          className={`rounded-[10px] border-[0.5px] p-4 ${
            phoneSavedOrSkipped ? 'bg-[#EAF3DE] border-[#3B6D11]' : 'bg-[#FDFAF6] border-[#D3C9B8]'
          }`}
          data-testid="verify-phone-row"
        >
          <div className="flex items-start gap-3 mb-3">
            <Phone className="h-4 w-4 text-[#3B6D11] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-plant text-[13px] text-[#1C2E10]">
                <strong>{IDENTITY_COPY.phoneLabel}</strong>{' '}
                <span className="font-latin italic text-[#888780]">{IDENTITY_COPY.phoneOptional}</span>{' '}
                — {IDENTITY_COPY.phoneDescription}
              </p>
            </div>
            {phoneSavedOrSkipped && (
              <span className="inline-flex items-center gap-1 text-[#3B6D11] font-plant uppercase tracking-[0.08em] text-[10px]">
                <CheckCircle2 className="h-4 w-4" /> Done
              </span>
            )}
          </div>
          {!phoneSavedOrSkipped && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                autoComplete="tel"
                data-testid="verify-phone-input"
                className="flex-1 rounded-[6px] border-[0.5px] border-[#D3C9B8] bg-white px-3 py-2 font-ui text-[13px] text-[#1C2E10] placeholder:text-[#888780] focus:outline-none focus:border-[#3B6D11]"
              />
              <button
                type="button"
                onClick={onAddPhone}
                disabled={submitting}
                data-testid="verify-add-phone-btn"
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150 disabled:opacity-50"
              >
                Add phone
              </button>
              <button
                type="button"
                onClick={onSkipPhone}
                disabled={submitting}
                data-testid="verify-skip-phone-btn"
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150 disabled:opacity-50"
              >
                Skip phone
              </button>
            </div>
          )}
          {phoneSavedOrSkipped && verification?.verification_phone && (
            <p className="font-mono text-[12px] text-[#5F5E5A] ml-7">{verification.verification_phone}</p>
          )}
          {phoneSavedOrSkipped && verification?.verification_phone_skipped && !verification?.verification_phone && (
            <p className="font-latin italic text-[12px] text-[#888780] ml-7">Skipped — you can add this later from Profile.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          data-testid="verify-identity-continue"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150 disabled:bg-[#D3C9B8] disabled:text-[#888780] disabled:cursor-not-allowed"
        >
          Continue to pact
        </button>
        <button
          type="button"
          onClick={onBack}
          data-testid="verify-identity-back"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
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
      <h2 className="font-plant text-[#1C2E10] text-xl mb-2">{PACT_INTRO.heading}</h2>
      <p className="font-ui text-[13px] text-[#5F5E5A] mb-5">{PACT_INTRO.body}</p>

      <div className="rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-3 mb-4 flex items-center gap-2">
        <span className="font-plant uppercase tracking-[0.08em] text-[10px] text-[#1C2E10]">
          Acknowledged
        </span>
        <span
          className="font-mono text-[12px] text-[#1C2E10]"
          data-testid="verify-pact-ack-count"
        >
          {ackedCount} of 8
        </span>
        <span className="ml-auto font-latin italic text-[11px] text-[#888780]">
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
              className={`rounded-[10px] border-[0.5px] overflow-hidden transition-colors duration-150 ${
                isAcked ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-[#D3C9B8] bg-[#FDFAF6]'
              }`}
              data-testid={`pact-section-${s.number}`}
            >
              <button
                type="button"
                onClick={() => toggleSection(s.number)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-black/[0.02] transition-colors duration-150"
                aria-expanded={isOpen}
                data-testid={`pact-section-${s.number}-toggle`}
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3B6D11]/10 text-[#3B6D11] font-plant text-[13px] flex items-center justify-center">
                  {s.number}
                </span>
                <span className="flex-1 min-w-0 font-plant text-[14px] text-[#1C2E10]">
                  {s.title}
                </span>
                {isAcked && (
                  <CheckCircle2 className="h-4 w-4 text-[#3B6D11] flex-shrink-0" />
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#5F5E5A] flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#5F5E5A] flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t-[0.5px] border-[#D3C9B8]">
                  {s.bodyAsList ? (
                    <ul className="space-y-1.5 font-ui text-[13px] text-[#2B2B26] leading-relaxed mt-3 ml-1">
                      {s.body.map((line, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#3B6D11] flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2 font-ui text-[13px] text-[#2B2B26] leading-relaxed mt-3">
                      {s.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                  <label
                    className={`mt-4 flex items-start gap-3 cursor-pointer rounded-[8px] border-[0.5px] p-3 transition-colors duration-150 ${
                      isAcked ? 'border-[#3B6D11] bg-white' : 'border-[#D3C9B8] bg-white hover:border-[#3B6D11]'
                    }`}
                    data-testid={`pact-section-${s.number}-ack-label`}
                  >
                    <input
                      type="checkbox"
                      checked={isAcked}
                      onChange={() => toggleAck(s.number)}
                      className="mt-0.5 h-4 w-4 accent-[#3B6D11] cursor-pointer flex-shrink-0"
                      data-testid={`pact-section-${s.number}-checkbox`}
                    />
                    <span className="font-plant italic text-[13px] text-[#1C2E10] leading-snug">
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
                    className="flex items-center gap-1.5 font-ui text-[12px] text-[#5F5E5A] hover:text-[#1C2E10] transition-colors duration-150"
                    data-testid={`pact-section-${s.number}-mini-state`}
                  >
                    {isAcked ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#3B6D11]" />
                        <span>Acknowledged</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5 text-[#888780]" />
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
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150 disabled:bg-[#D3C9B8] disabled:text-[#888780] disabled:cursor-not-allowed"
        >
          {allAcksTrue ? 'Continue to final agreement' : `Acknowledge all 8 (${ackedCount}/8)`}
        </button>
        <button
          type="button"
          onClick={onBack}
          data-testid="verify-pact-back"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
        >
          Back
        </button>
      </div>
    </StepCard>
  );
}

function FinalStep({ allAcksTrue, submitting, onAgree, onDecline, onBack }) {
  return (
    <StepCard testid="verify-step-final">
      <h2 className="font-plant text-[#1C2E10] text-xl mb-2">{FINAL_COPY.heading}</h2>
      <p className="font-ui text-[13px] text-[#5F5E5A] mb-4">{FINAL_COPY.intro}</p>

      <blockquote className="rounded-[10px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] p-5 my-4">
        <p className="font-plant italic text-[15px] text-[#1C2E10] leading-relaxed">
          “{FINAL_COPY.oath}”
        </p>
      </blockquote>

      <p className="font-ui text-[13px] text-[#2B2B26] leading-relaxed">{FINAL_COPY.outro}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-8">
        <button
          type="button"
          onClick={onAgree}
          disabled={!allAcksTrue || submitting}
          data-testid="verify-final-agree"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150 disabled:bg-[#D3C9B8] disabled:text-[#888780] disabled:cursor-not-allowed"
        >
          {submitting ? 'Verifying…' : FINAL_COPY.ctaAgree}
        </button>
        <button
          type="button"
          onClick={onDecline}
          data-testid="verify-final-decline"
          className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
        >
          {FINAL_COPY.ctaDecline}
        </button>
      </div>
      {!allAcksTrue && (
        <p className="font-latin italic text-[12px] text-[#BA7517] mt-3" data-testid="verify-final-warning">
          Go back and acknowledge each of the 8 sections before agreeing.
        </p>
      )}
    </StepCard>
  );
}

function SuccessStep({ onBrowseSwaps }) {
  return (
    <StepCard testid="verify-step-success">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#3B6D11]/15 mb-4">
        <ShieldCheck className="h-7 w-7 text-[#3B6D11]" />
      </span>
      <h2 className="font-plant text-[#1C2E10] text-2xl mb-2 flex items-center gap-2">
        {SUCCESS_COPY.heading}
        <CheckCircle2 className="h-5 w-5 text-[#3B6D11]" />
      </h2>
      <p className="font-ui text-[14px] text-[#2B2B26] leading-relaxed mb-6">{SUCCESS_COPY.body}</p>

      <div
        className="rounded-[10px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] p-4 flex items-center gap-3 mb-6"
        data-testid="verify-success-badge-card"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#3B6D11] text-[#FDFAF6]">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-plant uppercase tracking-[0.08em] text-[10px] text-[#5F5E5A]">
            {SUCCESS_COPY.badgeLabel}
          </p>
          <p className="font-plant text-[15px] text-[#1C2E10]">{SUCCESS_COPY.badgeName}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onBrowseSwaps}
        data-testid="verify-success-browse"
        className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[12px] px-5 py-3 bg-[#3B6D11] text-[#FDFAF6] hover:bg-[#2D5016] transition-colors duration-150"
      >
        {SUCCESS_COPY.cta}
      </button>
    </StepCard>
  );
}
