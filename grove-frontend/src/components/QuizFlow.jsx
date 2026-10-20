import React, { useEffect, useRef, useState } from 'react';
import { lessonAPI } from '../lib/api';
import { QUIZ_OPTIONS } from '../lessons/lessonMeta';

// One screen, multi-select. It only picks the first lesson, and says so.
export default function QuizFlow({ onDone }) {
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const headingRef = useRef(null);

  // Move focus into the dialog so keyboard and screen reader users land on it.
  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  const toggle = (id) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const submit = async (answers) => {
    // A double tap must not send the quiz twice.
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await lessonAPI.submitQuiz(answers);
      onDone(res.data);
    } catch (_e) {
      setError('Could not save that. Try again.');
      submitting.current = false;
      setSaving(false);
    }
  };

  const start = () => {
    if (picked.length === 0) {
      setError('Pick at least one, or skip for now.');
      return;
    }
    submit(picked);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#F5F0E8] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
      data-testid="quiz-flow"
    >
      <div className="w-full max-w-md">
        <h1 id="quiz-title" ref={headingRef} tabIndex={-1} className="font-plant text-[#1C2E10] text-3xl mb-2 focus:outline-none">
          What&apos;s going on with your plants?
        </h1>
        <p className="text-sm text-[#2B2B26] mb-4">
          Pick everything that fits. This only chooses your first lesson, and you can change it any time.
        </p>

        <div className="space-y-2" role="group" aria-label="Your plant situation">
          {QUIZ_OPTIONS.map((option) => {
            const on = picked.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(option.id)}
                className={`w-full text-left rounded-[8px] border-[0.5px] px-4 py-3 text-sm font-ui text-[#1A1A17] ${
                  on ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20' : 'border-[#D3C9B8] bg-[#FDFAF6] hover:border-[#2D5016]'
                }`}
                data-testid={`quiz-option-${option.id}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-ui text-red-700" data-testid="quiz-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={start}
          aria-busy={saving}
          className="mt-4 w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016]"
          data-testid="quiz-start"
        >
          {saving ? 'Saving…' : 'Start my first lesson'}
        </button>
        <button
          type="button"
          onClick={() => submit([])}
          className="mt-3 w-full text-center text-xs font-ui text-[#2B2B26] underline underline-offset-2"
          data-testid="quiz-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
