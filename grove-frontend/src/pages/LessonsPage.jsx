import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

export default function LessonsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setData(res.data);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const completed = new Set(data?.completed || []);
  const next = data?.queue?.[0];
  const then = data?.queue?.[1];

  return (
    <div>
      <PageHeader title="Lessons" />
      <div className="max-w-[640px] mx-auto px-4 py-4 space-y-4">
        {failed && (
          <p role="alert" className="text-sm font-ui text-red-700">
            Could not load your lessons. Try again in a moment.
          </p>
        )}

        {next && (
          <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4" data-testid="lessons-up-next">
            <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Up next</p>
            <p className="font-plant text-[#1C2E10] text-xl">{LESSON_META[next].title}</p>
            <p className="text-sm text-[#1A1A17] mb-3">{LESSON_META[next].blurb}</p>
            <button
              type="button"
              onClick={() => navigate(lessonPath(next))}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
              data-testid="lessons-start"
            >
              Start lesson
            </button>
          </section>
        )}

        {then && (
          <p className="text-sm font-ui text-[#2B2B26]" data-testid="lessons-then">
            After that: {LESSON_META[then].title}
          </p>
        )}

        {data && !next && (
          <p className="text-sm font-ui text-[#1C2E10]" data-testid="lessons-all-done">
            You&apos;ve finished your first lessons. The rest are below whenever you want them.
          </p>
        )}

        <section>
          <h2 className="font-plant text-[#1C2E10] text-lg mb-2">All lessons</h2>
          <ul className="space-y-2">
            {(data?.library || Object.keys(LESSON_META)).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => navigate(lessonPath(id))}
                  className="w-full flex items-center justify-between gap-3 rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3 py-3 text-left hover:border-[#2D5016]"
                  data-testid={`lesson-row-${id}`}
                >
                  <span>
                    <span className="block text-sm font-ui text-[#1C2E10]">{LESSON_META[id].title}</span>
                    <span className="block text-xs font-ui text-[#2B2B26]">{LESSON_META[id].blurb}</span>
                  </span>
                  {data?.up_next === id && !completed.has(id) && (
                    <span className="text-xs font-ui text-[#2D5016]" data-testid={`lesson-up-next-${id}`}>
                      Up next
                    </span>
                  )}
                  {completed.has(id) && (
                    <span className="flex items-center gap-1 text-xs font-ui text-[#3B6D11]">
                      <Check className="h-4 w-4" aria-hidden="true" /> Done
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
