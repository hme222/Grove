import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { plantAPI, speciesAPI } from '../lib/api';
import { LESSON_META } from '../lessons/lessonMeta';
import { matchPlants, matchLessons } from '../lib/search';
import { Search } from 'lucide-react';

function Row({ title, sub, onClick, testId }) {
  return (
    <li>
      <button type="button" onClick={onClick} data-testid={testId}
        className="block min-h-[56px] w-full rounded-[14px] border-[0.5px] border-grove-moss bg-grove-canopy px-4 py-3 text-left hover:border-grove-fernLine">
        <span className="block font-plant text-lg text-grove-cream">{title}</span>
        {sub && <span className="block font-ui text-sm text-grove-sage">{sub}</span>}
      </button>
    </li>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [plants, setPlants] = useState([]);
  const [species, setSpecies] = useState([]);

  useEffect(() => {
    let live = true;
    plantAPI.getAll().then((r) => { if (live) setPlants(r.data.plants || r.data || []); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setSpecies([]); return undefined; }
    let live = true;
    const t = setTimeout(() => {
      speciesAPI.search(query).then((r) => { if (live) setSpecies((r.data || []).slice(0, 8)); }).catch(() => { if (live) setSpecies([]); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  const myPlants = useMemo(() => matchPlants(plants, q), [plants, q]);
  const lessons = useMemo(() => matchLessons(LESSON_META, q), [q]);
  const empty = q.trim().length >= 2 && !myPlants.length && !species.length && !lessons.length;

  return (
    <div className="pb-24">
      <PageHeader title="Search" />
      <div className="max-w-[600px] mx-auto px-4 py-4 space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grove-sage" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search your plants, plant guides and lessons"
            placeholder="Search plants, guides and lessons"
            data-testid="search-input"
            className="h-12 w-full rounded-[12px] border-[0.5px] bg-grove-canopy pl-11 pr-4 font-ui text-base text-grove-cream placeholder:text-grove-lichen focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
          />
        </div>

        <div aria-live="polite">
          {myPlants.length > 0 && (
            <section aria-labelledby="s-plants" className="space-y-2">
              <h2 id="s-plants" className="font-plant text-xl text-grove-cream">Your plants</h2>
              <ul className="space-y-2">
                {myPlants.map((p) => <Row key={p.id} testId="search-plant" title={p.nickname || p.common_name} sub={[p.latin_name, p.room].filter(Boolean).join(' · ')} onClick={() => navigate(`/plants/${p.id}`)} />)}
              </ul>
            </section>
          )}
          {species.length > 0 && (
            <section aria-labelledby="s-guides" className="mt-5 space-y-2">
              <h2 id="s-guides" className="font-plant text-xl text-grove-cream">Plant guides</h2>
              <ul className="space-y-2">
                {species.map((s) => <Row key={s.id} testId="search-species" title={s.common_name} sub={s.latin_name} onClick={() => navigate(`/greenhouse/${s.id}`)} />)}
              </ul>
            </section>
          )}
          {lessons.length > 0 && (
            <section aria-labelledby="s-lessons" className="mt-5 space-y-2">
              <h2 id="s-lessons" className="font-plant text-xl text-grove-cream">Lessons</h2>
              <ul className="space-y-2">
                {lessons.map((l) => <Row key={l.id} testId="search-lesson" title={l.title} sub={l.blurb} onClick={() => navigate('/lessons')} />)}
              </ul>
            </section>
          )}
          {empty && <p className="font-ui text-sm text-grove-sage" data-testid="search-empty">Nothing matches &ldquo;{q.trim()}&rdquo;. Try a plant&rsquo;s common name.</p>}
        </div>
      </div>
    </div>
  );
}
