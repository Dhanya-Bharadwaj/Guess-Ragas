import React from 'react';
import { useParams, Link } from 'react-router-dom';
import melakartaMeta from '../data/melakarta_meta.json';
import janyaMeta from '../data/janya_meta.json';
import curated from '../data/ragas';

export default function RagaDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || 'Unknown');

  // Normalize helper to match parent names against canonical keys in the dataset
  const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Helper: find metadata entry from a collection that may be an object map or an array
  function findMeta(collection, ragaName) {
    if (!collection) return null;
    if (Array.isArray(collection)) {
      const key = normalize(ragaName);
      return collection.find((item) => normalize(item.raga) === key) || null;
    }
    // object map case
    return collection[ragaName] || collection[Object.keys(collection).find((k) => normalize(k) === normalize(ragaName))] || null;
  }

  // Resolve metadata from melakarta or janya sources (support both array and object forms)
  const meta = findMeta(melakartaMeta, name) || findMeta(janyaMeta, name) || null;

  // Normalize field names: some sources use `arohana`/`avarohana`, others use `arohanam`/`avarohanam`.
  const arohanaText = meta ? (meta.arohana || meta.arohanam || '') : '';
  const avarohanaText = meta ? (meta.avarohana || meta.avarohanam || '') : '';
  const notesList = meta ? (meta.notes || meta.note || []) : [];

  const parentProvided = meta && meta.parent ? meta.parent : null;
  const parentKey = parentProvided ? (
    // find a matching key/name in melakarta metadata
    Array.isArray(melakartaMeta)
      ? (melakartaMeta.find((it) => normalize(it.raga) === normalize(parentProvided)) || {}).raga || null
      : Object.keys(melakartaMeta).find((k) => normalize(k) === normalize(parentProvided))
  ) : null;

  // Try to find melakarta number (if present in curated list like "1 Kanakangi")
  const melIndex = curated && curated.melakarta
    ? curated.melakarta.findIndex((m) => m.replace(/^\d+\s+/, '').toLowerCase() === name.toLowerCase())
    : -1;
  const melNumber = melIndex >= 0 ? melIndex + 1 : null;
  const chakra = melNumber ? Math.floor((melNumber - 1) / 6) + 1 : null;

  const renderNotes = (notes) => {
    if (!notes) return null;
    return (
      <div className="notes-row">
        {notes.map((n) => (
          <span key={n} className="note-pill">{n}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="raga-detail">
      <div className="detail-header">
        <Link to="/learn" className="back">← Back</Link>
        <div className="title-block">
          <h1 className="raga-title">{name}</h1>
          <div className="meta-badges">
            {melNumber && <span className="badge">Melakarta #{melNumber}</span>}
            {chakra && <span className="badge muted">Chakra {chakra}</span>}
            <span className="badge type">{meta ? (meta.type || 'Melakarta / Janya') : 'Unknown'}</span>
            {parentProvided && (
              <span className="badge parent">Parent: {parentKey ? <Link to={`/raga/${encodeURIComponent(parentKey)}`}>{parentKey}</Link> : parentProvided}</span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-left">
          <div className="detail-card notation">
            <h3 className="card-heading">Arohana & Avarohana</h3>
            {meta ? (
              <>
                <div className="notation-box">
                  <div className="notation-row"><strong>Arohana:</strong>
                    <div className="notation-text mono">{arohanaText || '—'}</div>
                  </div>
                  <div className="notation-row"><strong>Avarohana:</strong>
                    <div className="notation-text mono">{avarohanaText || '—'}</div>
                  </div>
                  {renderNotes(notesList)}
                </div>

                <div className="notation-actions">
                  <button className="play-btn" aria-label={`Play arohana of ${name}`}>Play Arohana ▶</button>
                  <button className="play-btn" aria-label={`Play avarohana of ${name}`}>Play Avarohana ▶</button>
                </div>
              </>
            ) : (
              <p>Metadata not available for this raga yet. You can add arohana/avarohana in <code>src/data/melakarta_meta.json</code> or <code>src/data/janya_meta.json</code>.</p>
            )}
          </div>

          {/* Mobile-only Popular Songs placed between notation and keerthanas on small screens */}
          <div className="detail-card popular-songs-mobile" aria-hidden="true">
            <h3 className="card-heading">Popular Songs</h3>
            {meta ? (
              <ol>
                {(meta.songs || []).slice(0,6).map((s) => <li key={s}>{s}</li>)}
              </ol>
            ) : (
              <p>-</p>
            )}
          </div>

          <div className="detail-card">
            <h3 className="card-heading">Popular Keerthanas</h3>
            {meta ? (
              <ol>
                {(meta.keerthanas || []).map((k) => <li key={k}>{k}</li>)}
              </ol>
            ) : (
              <p>-</p>
            )}
          </div>

          {/** Practice Tips removed per user request */}
        </div>

        <aside className="detail-right">
          <div className="detail-card">
            <h3 className="card-heading">Popular Songs</h3>
            {meta ? (
              <ol>
                {(meta.songs || []).slice(0,6).map((s) => <li key={s}>{s}</li>)}
              </ol>
            ) : (
              <p>-</p>
            )}
          </div>

          {/** Composer Notes and Quick Facts removed per user request */}
        </aside>
      </div>
      {/* Bottom navigation: prev / next raga with visible path in corners */}
      <div className="detail-footer" style={{display:'flex', justifyContent:'space-between', marginTop:18}}>
        <div className="prev-wrap">
          {(() => {
            // Use the same ordering as the Learn page: sorted melakarta and janya lists.
            const melNames = curated.melakarta.map((r) => r.replace(/^\d+\s+/, ''));
            const melSorted = [...melNames].sort((a, b) => a.localeCompare(b));
            const janyaList = curated.janya || [];
            const janyaSorted = [...janyaList].sort((a, b) => a.localeCompare(b));

            // If current raga is a melakarta, navigate within melakarta list; otherwise, navigate within janya list
            const list = melNumber ? melSorted : janyaSorted;
            const idx = list.findIndex((r) => r.toLowerCase() === name.toLowerCase());
            const prev = idx > 0 ? list[idx - 1] : null;
            if (!prev) return null;
            const path = `/raga/${encodeURIComponent(prev)}`;
            return (
              <div style={{textAlign:'left'}}>
                <Link to={path} className="btn ghost">← Prev: {prev}</Link>
              </div>
            );
          })()}
        </div>

        <div className="next-wrap">
          {(() => {
            const melNames = curated.melakarta.map((r) => r.replace(/^\d+\s+/, ''));
            const melSorted = [...melNames].sort((a, b) => a.localeCompare(b));
            const janyaList = curated.janya || [];
            const janyaSorted = [...janyaList].sort((a, b) => a.localeCompare(b));

            const list = melNumber ? melSorted : janyaSorted;
            const idx = list.findIndex((r) => r.toLowerCase() === name.toLowerCase());
            const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
            if (!next) return null;
            const path = `/raga/${encodeURIComponent(next)}`;
            return (
              <div style={{textAlign:'right'}}>
                <Link to={path} className="btn ghost">Next: {next} →</Link>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
