import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { LESSON_META } from '../lessons/lessonMeta';

// The lessons on the Profile page, so they can be found and reopened from there. `seen` is the user's
// tutorials_seen list, where a finished lesson is stored as `lesson:<id>`. A finished lesson starts again
// from its first card.
export default function ProfileLessons({ seen = [], onOpen }) {
  return (
    <div data-testid="profile-lessons">
      <p className="font-ui text-grove-cream text-xs font-medium mb-2">Lessons</p>
      <ul className="space-y-1.5">
        {Object.values(LESSON_META).map((lesson) => {
          const done = seen.includes(`lesson:${lesson.id}`);
          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => onOpen(lesson.id)}
                data-testid={`profile-lesson-${lesson.id}`}
                className="w-full flex min-h-touch items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 hover:border-grove-fernLine transition-colors duration-150"
              >
                <span className="flex-1 min-w-0 text-left">
                  <span className="font-ui text-xs font-medium text-grove-cream block">{lesson.title}</span>
                  <span className="font-ui text-xs text-grove-sage block">{done ? 'Done. Tap to read again.' : lesson.blurb}</span>
                </span>
                {done && <Check className="h-4 w-4 flex-shrink-0 text-grove-sprout" aria-hidden="true" />}
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-grove-sage" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
