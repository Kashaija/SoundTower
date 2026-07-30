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
        // Map DB results to frontend variant shape
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
        // direct LLM return shape
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
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">SoundTower</h1>

      {crisis && (
        <div className="fixed top-4 left-0 right-0 bg-red-600 text-white p-4 z-50">
          <strong>Immediate help:</strong> {crisis.text}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">I am feeling...</label>
        <div className="flex">
          <span className="inline-flex items-center bg-gray-100 px-3 rounded-l">I am feeling...</span>
          <input
            className="flex-1 border px-3 py-2 rounded-r"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="type how you feel..."
          />
          <button className="ml-2 bg-blue-600 text-white px-4 rounded" onClick={() => doSearch(query)} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        {CHIPS.map(c => (
          <button key={c.value} onClick={() => onChipClick(c.value)} className="p-2 bg-gray-100 rounded">
            {c.label}
          </button>
        ))}
      </div>

      {current ? (
        <article className="space-y-6">
          <section className="bg-gray-50 p-6 rounded">
            <h2 className="text-2xl font-semibold">{current.first_person_affirmation}</h2>
            <div className="mt-2 text-sm text-gray-600">Get this reminder printed on a premium canvas or journal</div>
            <div className="mt-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded">Get this reminder printed on a premium canvas or journal</button>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold">{current.canonical_scriptures["1_gospel"].reference}</h3>
              <p>{current.canonical_scriptures["1_gospel"].text}</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold">{current.canonical_scriptures["2_psalm"].reference}</h3>
              <p>{current.canonical_scriptures["2_psalm"].text}</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold">{current.canonical_scriptures["3_epistle"].reference}</h3>
              <p>{current.canonical_scriptures["3_epistle"].text}</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-semibold">{current.canonical_scriptures["4_old_testament"].reference}</h3>
              <p>{current.canonical_scriptures["4_old_testament"].text}</p>
            </div>
          </section>

          <section className="bg-gray-50 p-4 rounded">
            <blockquote>
              <p className="italic">"{current.theological_quote.quote}"</p>
              <footer>{current.theological_quote.author} — {current.theological_quote.credentials}</footer>
            </blockquote>
            <blockquote className="mt-3">
              <p className="italic">"{current.pastoral_quote.quote}"</p>
              <footer>{current.pastoral_quote.author} — {current.pastoral_quote.credentials}</footer>
            </blockquote>
          </section>

          <section className="p-4 rounded border">
            <h4 className="font-semibold">Guided Prayer</h4>
            <p>{current.guided_prayer}</p>
            <div className="mt-3">
              <button className="bg-yellow-600 text-white px-3 py-1 rounded">Play 60s preview</button>
            </div>
          </section>

          <div className="flex gap-2">
            <button onClick={regenerate} className="px-4 py-2 bg-indigo-600 text-white rounded">🔄 Show a different promise</button>
            <div className="ml-auto text-sm text-gray-500">Variant {index + 1} of {variants.length}</div>
          </div>
        </article>
      ) : (
        <div className="text-gray-500">No results yet. Try a chip or type how you feel.</div>
      )}
    </main>
  );
}
