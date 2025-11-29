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
        <Link to="/learn" className="back">← Back to Learn</Link>
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
                  <button className="copy-btn" onClick={() => navigator.clipboard && navigator.clipboard.writeText(`${name} — ${arohanaText} / ${avarohanaText}`)}>Copy</button>
                </div>
              </>
            ) : (
              <p>Metadata not available for this raga yet. You can add arohana/avarohana in <code>src/data/melakarta_meta.json</code> or <code>src/data/janya_meta.json</code>.</p>
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

          <div className="detail-card">
            <h3 className="card-heading">Practice Tips</h3>
            <ul>
              <li>Start slow: play arohana and avarohana with a metronome at 60 BPM.</li>
              <li>Sing each swara clearly; focus on gamakas for the raga.</li>
              <li>Practice common prayogas (short phrases) from compositions.</li>
            </ul>
          </div>
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

          <div className="detail-card">
            <h3 className="card-heading">Composer Notes</h3>
            <p className="small muted">Add composer notes, origin stories, and key prayogas to help learners.</p>
          </div>

          <div className="detail-card">
            <h3 className="card-heading">Quick Facts</h3>
            <ul>
              <li><strong>Notes:</strong> {(notesList && notesList.length ? notesList.join(', ') : '—')}</li>
              <li><strong>Type:</strong> {(meta && meta.type) || '—'}</li>
              {parentProvided && (
                <li><strong>Parent:</strong> {parentKey ? <Link to={`/raga/${encodeURIComponent(parentKey)}`}>{parentKey}</Link> : parentProvided}</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
