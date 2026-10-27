import React, { useEffect, useState } from 'react';
import LoadError from '../components/LoadError';
import { Check } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';
import { AppLink } from '../components/AppLink';
import PhotoBand from '../components/PhotoBand';
import { PageHeader } from '../components/PageHeader';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

export default function LessonsPage() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    lessonAPI
      .queue()
      .then((res) => setData(res.data))
      .catch(() => setFailed(true));
  };

  useEffect(() => { load(); }, []);

  const completed = new Set(data?.completed || []);
  const next = data?.queue?.[0];
  const then = data?.queue?.[1];

  return (
    <div>
      <PageHeader back title="Lessons" />
      <div className="max-w-sheet mx-auto px-4 py-4 space-y-4">
        {failed && (
          <LoadError compact what="your lesson progress" note="The lessons themselves are fine." onRetry={load} testId="lessons-progress-failed" />
        )}

        {next && (
          <section className="overflow-hidden rounded-card border-hairline border-grove-moss bg-grove-moss" data-testid="lessons-up-next">
            <PhotoBand src={LESSON_META[next].photo} ratio="band" className="rounded-none" eager />
            <div className="p-5">
            <p className="font-ui text-sm text-grove-sage">Up next</p>
            <h2 className="font-plant text-base font-semibold text-grove-cream">{LESSON_META[next].title}</h2>
            <p className="text-sm text-grove-cream mb-3">{LESSON_META[next].blurb}</p>
            <AppLink
              to={lessonPath(next)}
              className={buttonVariants()}
              data-testid="lessons-start"
            >
              Start lesson
            </AppLink>
            </div>
          </section>
        )}

        {then && (
          <p className="text-sm font-ui text-grove-cream" data-testid="lessons-then">
            After that: {LESSON_META[then].title}
          </p>
        )}

        {data && !next && (
          <p className="text-sm font-ui text-grove-cream" data-testid="lessons-all-done">
            You&apos;ve finished your first lessons. The rest are below whenever you want them.
          </p>
        )}

        <section>
          <h2 className="font-plant text-grove-cream text-xl font-semibold mb-2">All lessons</h2>
          <ul className="space-y-2">
            {(data?.library || Object.keys(LESSON_META)).map((id) => (
              <li key={id}>
                <AppLink
                 
                  to={lessonPath(id)}
                  className="w-full flex items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 text-left hover:border-grove-fernLine"
                  data-testid={`lesson-row-${id}`}
                >
                  <PhotoBand src={LESSON_META[id].thumb} aspect="thumb" className="h-14 w-14" testId="lesson-thumb" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-ui text-sm font-medium text-grove-cream">{LESSON_META[id].title}</span>
                    <span className="block font-ui text-sm text-grove-sage">{LESSON_META[id].blurb}</span>
                  </span>
                  {data?.up_next === id && !completed.has(id) && (
                    <span className="font-ui text-sm text-grove-sprout" data-testid={`lesson-up-next-${id}`}>
                      Up next
                    </span>
                  )}
                  {completed.has(id) && (
                    <span className="flex items-center gap-1 font-ui text-sm text-grove-sprout">
                      <Check className="h-4 w-4" aria-hidden="true" /> Done
                    </span>
                  )}
                </AppLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
