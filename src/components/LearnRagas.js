import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { curated } from '../data/ragas';
import janyaMeta from '../data/janya_meta.json';

export default function LearnRagas() {
  const [search, setSearch] = useState('');

  const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  // produce sorted lists (lexicographical by name) and remove numeric prefixes for melakarta
  const melNames = curated.melakarta.map((r) => r.replace(/^\d+\s+/, ''));
  const melSorted = [...melNames].sort((a, b) => a.localeCompare(b));
  // small mapping to fix concatenated names and improve readability
  const nameFixes = {
    'Dheerasankarabharanam': 'Dheera Shankarabharanam'
  };
  // Prefer authoritative janya list from `janya_meta.json`; fall back to curated list
  const janyaList = janyaMeta && Object.keys(janyaMeta).length > 0
    ? Object.keys(janyaMeta)
    : curated.janya || [];
  const janyaSorted = [...janyaList].sort((a, b) => a.localeCompare(b));

  const melFiltered = useMemo(() => {
    if (!search) return melSorted;
    const q = normalize(search);
    return melSorted.filter((r) => normalize(r).includes(q));
  }, [melSorted, search]);

  const janyaFiltered = useMemo(() => {
    if (!search) return janyaSorted;
    const q = normalize(search);
    return janyaSorted.filter((r) => normalize(r).includes(q));
  }, [janyaSorted, search]);

  return (
    <div className="learn-page">
      <header className="learn-header">
        <h1>Learn Ragas</h1>
        <p className="lead">Explore Carnatic ragas. Click any raga to learn more.</p>
      </header>

      <section className="raga-section">
        <div className="raga-section-header">
          <h2>Melakarta (72)</h2>
          <div className="raga-search raga-search-inline">
            <label className="sr-only" htmlFor="raga-search-input">Search ragas</label>
            <input
              id="raga-search-input"
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search ragas"
            />
            {search ? (
              <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
            ) : (
              <span className="search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        </div>
        <div className="raga-grid">
          {melFiltered.map((r, idx) => {
            const display = nameFixes[r] || r;
            return (
              <Link key={r} to={`/raga/${encodeURIComponent(display)}`} className="raga-card" style={{ '--i': `${idx * 0.02}s` }}>
                <span className="raga-name">{display}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="raga-section">
        <h2>Common Janya Ragas</h2>
        <div className="raga-grid">
          {janyaFiltered.map((r, idx) => (
            <Link key={r} to={`/raga/${encodeURIComponent(r)}`} className="raga-card" style={{ '--i': `${(idx + melFiltered.length) * 0.02}s` }}>
              <span className="raga-name">{r}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
