import React, { useEffect, useRef, useState } from 'react';
import { lessonAPI } from '../lib/api';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
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
      className="fixed inset-0 z-celebration flex items-center justify-center bg-grove-forest px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
      data-testid="quiz-flow"
    >
      <div className="w-full max-w-md">
        <h1 id="quiz-title" ref={headingRef} tabIndex={-1} className="font-plant text-grove-cream text-3xl mb-2 focus:outline-none">
          What&apos;s going on with your plants?
        </h1>
        <p className="text-sm text-grove-cream mb-4">
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
                className={`w-full text-left rounded-inset border-hairline px-4 py-3 text-sm font-ui text-grove-cream ${
                  on ? 'border-grove-fernLine bg-grove-moss ring-1 ring-grove-lime/25' : 'border-grove-moss bg-grove-canopy hover:border-grove-fernLine'
                }`}
                data-testid={`quiz-option-${option.id}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-ui text-destructive" data-testid="quiz-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={start}
          aria-busy={saving}
          className={cn(buttonVariants(), "mt-4 w-full")}
          data-testid="quiz-start"
        >
          {saving ? 'Saving…' : 'Start my first lesson'}
        </button>
        <button
          type="button"
          onClick={() => submit([])}
          className="mt-3 w-full text-center text-xs font-ui text-grove-cream underline underline-offset-2"
          data-testid="quiz-skip"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
