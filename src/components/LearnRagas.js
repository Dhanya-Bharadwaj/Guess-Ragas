import React from 'react';
import { Link } from 'react-router-dom';
import { curated } from '../data/ragas';

export default function LearnRagas() {
  // produce sorted lists (lexicographical by name) and remove numeric prefixes for melakarta
  const melNames = curated.melakarta.map((r) => r.replace(/^\d+\s+/, ''));
  const melSorted = [...melNames].sort((a, b) => a.localeCompare(b));
  // small mapping to fix concatenated names and improve readability
  const nameFixes = {
    'Dheerasankarabharanam': 'Dheera Shankarabharanam'
  };
  const janyaSorted = [...curated.janya].sort((a, b) => a.localeCompare(b));

  return (
    <div className="learn-page">
      <header className="learn-header">
        <h1>Learn Ragas</h1>
        <p className="lead">Explore Carnatic ragas. Click any raga to learn more.</p>
      </header>

      <section className="raga-section">
        <h2>Melakarta (72)</h2>
        <div className="raga-grid">
          {melSorted.map((r, idx) => {
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
          {janyaSorted.map((r, idx) => (
            <Link key={r} to={`/raga/${encodeURIComponent(r)}`} className="raga-card" style={{ '--i': `${(idx + melSorted.length) * 0.02}s` }}>
              <span className="raga-name">{r}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
