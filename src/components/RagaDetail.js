import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import melakartaMeta from '../data/melakarta_meta.json';
import janyaMeta from '../data/janya_meta.json';
import curated from '../data/ragas';

// Import locally added audio assets (bundler will emit URLs)
import kalyani_swara from '../assets/ragas/kalyani_swara.mp3';

export default function RagaDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || 'Unknown');
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const progressRef = useRef(null);

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

  // Simple mapping for local audio files; keys are normalized raga names
  const AUDIO_MAP = {
    kalyani: kalyani_swara,
  };

  const ensureAudio = (src) => {
    if (!src) return null;
    // Create audio element once and reuse it; if src changes, update src but keep listeners
    if (!audioRef.current) {
      const a = new Audio(src);
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => {
        setDuration(a.duration || 0);
      });
      a.addEventListener('play', () => setIsPlaying(true));
      a.addEventListener('pause', () => setIsPlaying(false));
      a.addEventListener('ended', () => setIsPlaying(false));
      a.addEventListener('timeupdate', () => {
        setCurrentTime(a.currentTime || 0);
      });
      audioRef.current = a;
      return audioRef.current;
    }

    // if audio exists but source changed, update src without recreating element
    if (audioRef.current.src !== src) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current.src = src;
      // reset duration/currentTime until metadata loads
      setDuration(null);
      setCurrentTime(0);
      // let the existing loadedmetadata listener update duration
    }
    return audioRef.current;
  };

  const togglePlay = async (e) => {
    if (e && e.stopPropagation) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
    const key = normalize(name);
    const src = AUDIO_MAP[key];
    if (!src) {
      alert('No Arohana audio available for this raga.');
      return;
    }
    // Use existing audio element if present to avoid resetting src/currentTime unexpectedly
    if (!audioRef.current) {
      ensureAudio(src);
    }
    const a = audioRef.current;
    if (!a) return;
    // if the audio element points to a different source, update it but preserve playback position only when appropriate
    if (a.src && a.src !== src) {
      // if different source, reset to new src (safe to restart)
      const getFileName = (u) => {
        try { return (u || '').toString().split('/').pop().split('?')[0]; } catch (e) { return u; }
      };
      const curName = getFileName(a.src || '');
      const newName = getFileName(src || '');
      if (curName && newName && curName !== newName) {
        // if different source file, reset to new src (safe to restart)
        try { a.pause(); } catch (err) {}
        a.src = src;
        setDuration(null);
        setCurrentTime(0);
      }
    }
    try {
      // debug logs to help diagnose unexpected restarts
      // eslint-disable-next-line no-console
      console.log('togglePlay before: paused=', a.paused, 'currentTime=', a.currentTime, 'src=', a.src);
      if (a.paused) {
        await a.play();
      } else {
        a.pause();
      }
      // eslint-disable-next-line no-console
      console.log('togglePlay after: paused=', a.paused, 'currentTime=', a.currentTime);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Playback toggle failed:', err);
    }
  };

  const playFromStart = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (e && e.stopPropagation) { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); }
    // eslint-disable-next-line no-console
    console.log('playFromStart clicked for', name);
    const key = normalize(name);
    const src = AUDIO_MAP[key];
    if (!src) {
      alert('No Arohana audio available for this raga.');
      return;
    }
    const a = ensureAudio(src);
    if (!a) return;
    try {
      a.currentTime = 0;
      await a.play();
    } catch (e) {
      console.warn('Playback failed:', e);
    }
  };

  const formatTime = (t) => {
    if (!t && t !== 0) return '—';
    const sec = Math.floor(t || 0);
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleProgressClick = (e) => {
    const el = progressRef.current;
    if (!el || !audioRef.current || !duration) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newTime = pct * duration;
    try { audioRef.current.currentTime = newTime; } catch (err) { console.warn(err); }
    setCurrentTime(newTime);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
        audioRef.current = null;
      }
    };
  }, []);

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
                  <button type="button" className="play-btn" aria-label={`Play arohana of ${name}`} onClick={playFromStart}>Play Arohana</button>
                  <button type="button" className="play-btn play-toggle" aria-label={isPlaying ? `Pause ${name}` : `Play ${name}`} onClick={togglePlay}>
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                        <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                  <div className="audio-meta">
                    <span className="time-elapsed">{formatTime(currentTime)}</span>
                    <div className="progress" ref={progressRef} onClick={handleProgressClick} role="progressbar" aria-valuemin={0} aria-valuemax={duration || 0} aria-valuenow={currentTime} tabIndex={0}>
                      <div className="progress-bar" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                      <div className="progress-thumb" style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                    </div>
                    <span className="time-duration">{formatTime(duration)}</span>
                  </div>
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

          {/* Popular Keerthanas removed per user request */}

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
