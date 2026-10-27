import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

// A short situational quiz. One question at a time, one correct answer each. Picking an option
// answers at once and says why, in a calm voice. A wrong pick can be followed by another pick as
// often as needed: no hearts, no score. The quiz is done when each question has been answered right.
// The right and wrong marks are an icon and a word, never color alone.
export default function LessonQuiz({ questions, onComplete }) {
  const [index, setIndex] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const promptRef = useRef(null);
  const shownIndex = useRef(index);

  const question = questions[index];
  const picked = question.options.find((o) => o.id === pickedId) || null;
  const solved = !!picked?.correct;
  const isLast = index === questions.length - 1;

  // The feedback is a polite live region, so a screen reader reads it once without focus moving: a wrong pick
  // keeps focus on the option. Focus moves only to the next question after Next, and to the finish button
  // when the last question is solved.
  const nextRef = useRef(null);
  useEffect(() => {
    if (solved && isLast && nextRef.current) nextRef.current.focus();
  }, [solved, isLast]);
  useEffect(() => {
    if (shownIndex.current !== index && promptRef.current) promptRef.current.focus();
    shownIndex.current = index;
  }, [index]);

  const pick = (option) => {
    if (solved) return;
    setPickedId(option.id);
  };

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setPickedId(null);
    setIndex((i) => i + 1);
  };

  return (
    <section
      aria-labelledby="lesson-quiz-title"
      className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5"
      data-testid="lesson-quiz"
    >
      <p className="font-ui text-sm text-grove-sage" data-testid="lesson-quiz-progress">
        Question {index + 1} of {questions.length}
      </p>
      <h2 id="lesson-quiz-title" className="sr-only">Quick check</h2>
      <p
        ref={promptRef}
        tabIndex={-1}
        className="mt-1 font-plant text-lg text-grove-cream focus:outline-none"
        data-testid="lesson-quiz-prompt"
      >
        {question.prompt}
      </p>

      <div className="mt-3 space-y-2" role="group" aria-label="Answers">
        {question.options.map((option) => {
          const isPicked = option.id === pickedId;
          const mark = isPicked ? (option.correct ? 'Correct' : 'Not quite') : null;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => pick(option)}
              aria-pressed={isPicked}
              aria-disabled={solved && !isPicked ? true : undefined}
              data-testid={`lesson-quiz-option-${option.id}`}
              className={cn(
                'flex min-h-touch w-full items-center justify-between gap-3 rounded-control border-hairline px-4 py-3 text-left font-ui text-sm text-grove-cream',
                isPicked ? 'border-grove-fernLine bg-grove-canopy ring-1 ring-grove-lime/25' : 'border-grove-fernLine/25 bg-grove-canopy hover:border-grove-fernLine',
                solved && !isPicked && 'opacity-60'
              )}
            >
              <span>{option.label}</span>
              {mark && (
                <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium" data-testid="lesson-quiz-mark">
                  {option.correct ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                  {mark}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="mt-3 font-ui text-sm leading-snug text-grove-cream focus:outline-none"
        data-testid="lesson-quiz-feedback"
      >
        {picked && (
          <p>
            <span className="font-medium">{picked.correct ? 'Yes. ' : 'Not quite. '}</span>
            {picked.why}
            {!picked.correct && ' Pick another answer whenever you like.'}
          </p>
        )}
      </div>

      {solved && (
        <button
          ref={nextRef}
          type="button"
          onClick={next}
          className={cn(buttonVariants(), 'mt-3 w-full')}
          data-testid="lesson-quiz-next"
        >
          {isLast ? 'Finish quick check' : 'Next question'}
        </button>
      )}
    </section>
  );
}
