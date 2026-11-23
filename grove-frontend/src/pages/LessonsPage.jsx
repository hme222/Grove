import React, { useEffect, useState } from 'react';
import LoadError from '../components/LoadError';
import { Check } from 'lucide-react';
import { buttonVariants } from '../components/ui/button';
import { AppLink } from '../components/AppLink';
import PhotoBand from '../components/PhotoBand';
import Pager from '../components/Pager';
import { PageHeader } from '../components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

// Rows per page in the All and Done lists. The lists are built from the lesson catalog, so they grow with it (100 lessons
// is 20 pages) without the page ever needing to scroll.
export const LESSONS_PER_PAGE = 5;

function LessonRows({ ids, completed, upNext, page, onPage, emptyText, testId }) {
  const start = (page - 1) * LESSONS_PER_PAGE;
  const shown = ids.slice(start, start + LESSONS_PER_PAGE);
  if (ids.length === 0) {
    return <p className="font-ui text-sm text-grove-cream" data-testid={`${testId}-empty`}>{emptyText}</p>;
  }
  return (
    <div className="space-y-2" data-testid={testId}>
      <ul className="space-y-2">
        {shown.map((id) => (
          <li key={id}>
            <AppLink
              to={lessonPath(id)}
              className="flex w-full items-center gap-3 rounded-small border-hairline border-grove-moss bg-grove-canopy px-3 py-2 text-left hover:border-grove-fernLine"
              data-testid={`lesson-row-${id}`}
            >
              <PhotoBand src={LESSON_META[id].thumb} aspect="thumb" className="h-14 w-14" testId="lesson-thumb" />
              <span className="min-w-0 flex-1">
                <span className="block font-ui text-sm font-medium text-grove-cream">{LESSON_META[id].title}</span>
                <span className="block truncate font-ui text-sm text-grove-sage">{LESSON_META[id].blurb}</span>
              </span>
              {upNext === id && !completed.has(id) && (
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
      <Pager page={page} pageSize={LESSONS_PER_PAGE} total={ids.length} onPage={onPage} label="Lesson pages" testId={`${testId}-pager`} />
    </div>
  );
}

export default function LessonsPage() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState('next');
  const [allPage, setAllPage] = useState(1);
  const [donePage, setDonePage] = useState(1);

  const load = () => {
    setFailed(false);
    lessonAPI
      .queue()
      .then((res) => setData(res.data))
      .catch((e) => setFailed(e || true));
  };

  useEffect(() => { load(); }, []);

  const completed = new Set(data?.completed || []);
  const next = data?.queue?.[0];
  const then = data?.queue?.[1];
  // Only lessons the app knows how to show, in catalog order, whatever the server lists.
  const library = (data?.library || Object.keys(LESSON_META)).filter((id) => LESSON_META[id]);
  const done = library.filter((id) => completed.has(id));

  return (
    <div>
      <PageHeader back title="Lessons" />
      <div className="max-w-sheet mx-auto px-4 pb-4 pt-2 space-y-3">
        {failed && (
          <LoadError compact what="your lesson progress" note="The lessons themselves are fine." onRetry={load} error={failed} testId="lessons-progress-failed" />
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Lessons views" data-testid="lessons-tabs">
            <TabsTrigger value="next" data-testid="lessons-tab-next">Up next</TabsTrigger>
            <TabsTrigger value="all" data-testid="lessons-tab-all">All</TabsTrigger>
            <TabsTrigger value="done" data-testid="lessons-tab-done">Done</TabsTrigger>
          </TabsList>

          <TabsContent value="next" className="space-y-3">
            {next && (
              <section className="overflow-hidden rounded-card border-hairline border-grove-moss bg-grove-moss" data-testid="lessons-up-next">
                <PhotoBand src={LESSON_META[next].photo} ratio="band" className="rounded-none" eager />
                <div className="p-5">
                  <p className="font-ui text-sm text-grove-sage">Up next</p>
                  <h2 className="font-plant text-base font-semibold text-grove-cream">{LESSON_META[next].title}</h2>
                  <p className="mb-3 text-sm text-grove-cream">{LESSON_META[next].blurb}</p>
                  <AppLink to={lessonPath(next)} className={buttonVariants()} data-testid="lessons-start">
                    Start lesson
                  </AppLink>
                </div>
              </section>
            )}

            {then && (
              <p className="font-ui text-sm text-grove-cream" data-testid="lessons-then">
                After that: {LESSON_META[then].title}
              </p>
            )}

            {data && !next && (
              <p className="font-ui text-sm text-grove-cream" data-testid="lessons-all-done">
                You&apos;ve finished your first lessons. The rest are under All whenever you want them.
              </p>
            )}
          </TabsContent>

          <TabsContent value="all">
            <LessonRows ids={library} completed={completed} upNext={data?.up_next} page={allPage} onPage={setAllPage} emptyText="No lessons yet." testId="lessons-all" />
          </TabsContent>

          <TabsContent value="done">
            <LessonRows ids={done} completed={completed} upNext={data?.up_next} page={donePage} onPage={setDonePage} emptyText="Nothing finished yet. Lessons you complete show up here." testId="lessons-done" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
