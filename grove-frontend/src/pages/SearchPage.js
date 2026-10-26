import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoadError from '../components/LoadError';
import { AppLink } from '../components/AppLink';
import { PageHeader } from '../components/PageHeader';
import { plantAPI, speciesAPI } from '../lib/api';
import { LESSON_META } from '../lessons/lessonMeta';
import { matchPlants, matchLessons } from '../lib/search';
import { Search } from 'lucide-react';

function Row({ title, sub, to, testId }) {
  return (
    <li>
      <AppLink to={to} data-testid={testId}
        className="block min-h-row w-full rounded-small border-hairline border-grove-moss bg-grove-canopy px-4 py-3 text-left hover:border-grove-fernLine">
        <span className="block font-plant text-base font-semibold text-grove-cream">{title}</span>
        {sub && <span className="block font-ui text-sm text-grove-sage">{sub}</span>}
      </AppLink>
    </li>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  // Opened on purpose from the Search tab, so the user is here to type.
  useEffect(() => { inputRef.current?.focus(); }, []);
  const [plants, setPlants] = useState([]);
  const [species, setSpecies] = useState([]);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    let live = true;
    plantAPI.getAll().then((r) => { if (live) setPlants(r.data.plants || r.data || []); }).catch(() => { if (live) setSearchFailed(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setSpecies([]); return undefined; }
    let live = true;
    const t = setTimeout(() => {
      speciesAPI.search(query).then((r) => { if (live) setSpecies((r.data || []).slice(0, 8)); }).catch(() => { if (live) { setSpecies([]); setSearchFailed(true); } });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  const myPlants = useMemo(() => matchPlants(plants, q), [plants, q]);
  const lessons = useMemo(() => matchLessons(LESSON_META, q), [q]);
  const empty = !searchFailed && q.trim().length >= 2 && !myPlants.length && !species.length && !lessons.length;

  return (
    <div className="pb-24">
      <PageHeader back title="Search" />
      <div className="max-w-column mx-auto px-4 py-4 space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grove-sage" aria-hidden="true" />
          <input
            type="search"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search your plants, plant guides and lessons"
            placeholder="Search plants, guides and lessons"
            data-testid="search-input"
            className="h-touch w-full rounded-control border-hairline bg-grove-canopy pl-10 pr-4 font-ui text-base text-grove-cream placeholder:text-grove-lichen focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
          />
        </div>

        <div aria-live="polite">
          {searchFailed && (
            <LoadError compact what="plant and guide results" note="Lessons still work." testId="search-failed" />
          )}
          {myPlants.length > 0 && (
            <section aria-labelledby="s-plants" className="space-y-2">
              <h2 id="s-plants" className="font-plant text-xl font-semibold text-grove-cream">Your plants</h2>
              <ul className="space-y-2">
                {myPlants.map((p) => <Row key={p.id} testId="search-plant" title={p.nickname || p.common_name} sub={[p.latin_name, p.room].filter(Boolean).join(' · ')} to={`/plants/${p.id}`} />)}
              </ul>
            </section>
          )}
          {species.length > 0 && (
            <section aria-labelledby="s-guides" className="mt-5 space-y-2">
              <h2 id="s-guides" className="font-plant text-xl font-semibold text-grove-cream">Plant guides</h2>
              <ul className="space-y-2">
                {species.map((s) => <Row key={s.id} testId="search-species" title={s.common_name} sub={s.latin_name} to={`/greenhouse/${s.id}`} />)}
              </ul>
            </section>
          )}
          {lessons.length > 0 && (
            <section aria-labelledby="s-lessons" className="mt-5 space-y-2">
              <h2 id="s-lessons" className="font-plant text-xl font-semibold text-grove-cream">Lessons</h2>
              <ul className="space-y-2">
                {lessons.map((l) => <Row key={l.id} testId="search-lesson" title={l.title} sub={l.blurb} to="/lessons" />)}
              </ul>
            </section>
          )}
          {q.trim().length < 2 && (
            <section aria-labelledby="s-start" data-testid="search-start" className="space-y-2">
              <h2 id="s-start" className="font-plant text-xl font-semibold text-grove-cream">Try one of these</h2>
              <p className="font-ui text-sm text-grove-sage">Type a plant&rsquo;s name, or start with a short lesson.</p>
              <ul className="space-y-2">
                {Object.keys(LESSON_META).slice(0, 3).map((id) => (
                  <Row key={id} testId="search-suggested-lesson" title={LESSON_META[id].title} sub={LESSON_META[id].blurb} to="/lessons" />
                ))}
              </ul>
            </section>
          )}
          {empty && <p className="font-ui text-sm text-grove-sage" data-testid="search-empty">Nothing matches &ldquo;{q.trim()}&rdquo;. Try a plant&rsquo;s common name.</p>}
        </div>
      </div>
    </div>
  );
}
