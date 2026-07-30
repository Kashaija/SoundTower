'use client';
import React, { useState } from 'react';

type ResultShape = {
  first_person_affirmation: string;
  canonical_scriptures: {
    "1_gospel": { reference: string; text: string };
    "2_psalm": { reference: string; text: string };
    "3_epistle": { reference: string; text: string };
    "4_old_testament": { reference: string; text: string };
  };
  theological_quote: { author: string; credentials: string; quote: string };
  pastoral_quote: { author: string; credentials: string; quote: string };
  guided_prayer: string;
};

const CHIPS = [
  { label: '😞 Overwhelmed', value: 'overwhelmed' },
  { label: '😰 Anxious', value: 'anxious' },
  { label: '💔 A Toxic Relationship', value: 'toxic relationship' },
  { label: '⏳ Impatient', value: 'impatient' }
];

export default function Page() {
  const [query, setQuery] = useState('');
  const [variants, setVariants] = useState<ResultShape[]>([]);
  const [index, setIndex] = useState(0);
  const [crisis, setCrisis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function doSearch(q: string) {
    setLoading(true);
    setCrisis(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data?.crisis) {
        setCrisis(data.hotline);
        setVariants([]);
      } else if (data?.results?.length) {
        const mapped = data.results.map((r: any) => ({
          first_person_affirmation: r.first_person_affirmation,
          canonical_scriptures: {
            "1_gospel": { reference: r.gospel_reference, text: r.gospel_text },
            "2_psalm": { reference: r.psalm_reference, text: r.psalm_text },
            "3_epistle": { reference: r.epistle_reference, text: r.epistle_text },
            "4_old_testament": { reference: r.old_testament_reference, text: r.old_testament_text }
          },
          theological_quote: { author: r.theological_author, credentials: r.theological_credentials, quote: r.theological_quote },
          pastoral_quote: { author: r.pastoral_author, credentials: r.pastoral_credentials, quote: r.pastoral_quote },
          guided_prayer: r.guided_prayer
        }));
        setVariants(mapped);
        setIndex(0);
      } else if (data?.generated) {
        setVariants([data.generated]);
        setIndex(0);
      } else if (data?.generated === undefined && data?.first_person_affirmation) {
        setVariants([data]);
        setIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }

  function onChipClick(val: string) {
    setQuery(val);
    doSearch(val);
  }

  function regenerate() {
    if (variants.length <= 1) return;
    setIndex((i) => (i + 1) % variants.length);
  }

  const current = variants[index];

  return (
    <main className="main-container">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="header-brand">SoundTower</h1>
          <div className="text-sm text-slate-500">A gentle, scripture-based comfort engine</div>
        </div>
      </header>

      {crisis && (
        <div className="crisis-banner">
          <strong className="mr-2">Immediate help:</strong>
          <span>{crisis.text}</span>
        </div>
      )}

      <section className="card mb-6">
        <label className="block text-sm text-slate-600 mb-3">I am feeling...</label>
        <div className="search-wrap">
          <span className="input-prefix">I am feeling...</span>
          <input
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type how you feel..."
          />
          <button className="action-btn" onClick={() => doSearch(query)} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHIPS.map(c => (
            <button key={c.value} onClick={() => onChipClick(c.value)} className="chip" aria-label={c.label}>
              <span className="text-sm">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {current ? (
        <article className="space-y-6">
          <section className="card">
            <h2 className="text-2xl font-semibold leading-relaxed">{current.first_person_affirmation}</h2>
            <div className="mt-3 text-sm text-slate-600">Placed beneath this affirmation: print-on-demand button and subtle CTA</div>
            <div className="mt-4">
              <button className="secondary-btn">Get this reminder printed on a premium canvas or journal</button>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="verse-card">
              <h3 className="font-semibold mb-1">{current.canonical_scriptures["1_gospel"].reference}</h3>
              <p className="text-sm text-slate-700">{current.canonical_scriptures["1_gospel"].text}</p>
            </div>
            <div className="verse-card">
              <h3 className="font-semibold mb-1">{current.canonical_scriptures["2_psalm"].reference}</h3>
              <p className="text-sm text-slate-700">{current.canonical_scriptures["2_psalm"].text}</p>
            </div>
            <div className="verse-card">
              <h3 className="font-semibold mb-1">{current.canonical_scriptures["3_epistle"].reference}</h3>
              <p className="text-sm text-slate-700">{current.canonical_scriptures["3_epistle"].text}</p>
            </div>
            <div className="verse-card">
              <h3 className="font-semibold mb-1">{current.canonical_scriptures["4_old_testament"].reference}</h3>
              <p className="text-sm text-slate-700">{current.canonical_scriptures["4_old_testament"].text}</p>
            </div>
          </section>

          <section className="card">
            <blockquote className="italic text-slate-700">"{current.theological_quote.quote}"</blockquote>
            <div className="mt-2 text-sm text-slate-500">{current.theological_quote.author} — {current.theological_quote.credentials}</div>
            <hr className="my-4" />
            <blockquote className="italic text-slate-700">"{current.pastoral_quote.quote}"</blockquote>
            <div className="mt-2 text-sm text-slate-500">{current.pastoral_quote.author} — {current.pastoral_quote.credentials}</div>
          </section>

          <section className="card">
            <h4 className="font-semibold mb-2">Guided Prayer</h4>
            <p className="text-slate-700">{current.guided_prayer}</p>

            <div className="mt-4 flex items-center gap-3">
              <button className="secondary-btn">Play 60s preview</button>
              <button className="action-btn" onClick={regenerate}>🔄 Show a different promise</button>
              <div className="ml-auto text-sm text-slate-500">Variant {index + 1} of {variants.length}</div>
            </div>
          </section>
        </article>
      ) : (
        <div className="text-slate-500">No results yet. Try a chip or type how you feel.</div>
      )}
    </main>
  );
}
