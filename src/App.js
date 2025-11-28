import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [showRagas, setShowRagas] = useState(false);
  const [file, setFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);

  useEffect(() => {
    return () => {
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setAudioURL(url);
    }
  }

  function handleUpload() {
    if (!file) return;
    // Placeholder: user will connect backend later.
    // For now we just notify the user that the file is ready.
    alert(`File ready to upload: ${file.name}`);
    console.log('File ready to upload:', file);
  }

  return (
    <div className="app-root">
      <div className="morning-sky">
        <svg className="sun" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <radialGradient id="g1" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#fff7c8" />
              <stop offset="60%" stopColor="#ffd07a" />
              <stop offset="100%" stopColor="#ffb36b" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="80" r="36" fill="url(#g1)" />
        </svg>
        <div className="floating-notes" aria-hidden>
          <span className="note n1">♪</span>
          <span className="note n2">♫</span>
          <span className="note n3">♬</span>
          <span className="note n4">♪</span>
          <span className="note n5">♫</span>
        </div>
      </div>

      <nav className="nav">
        <div className="brand">Raga Detector</div>
        <div className="nav-right">
          <button className="ragas-btn" onClick={() => setShowRagas(true)}>
            Ragas /
          </button>
        </div>
      </nav>

      <div className="layout">
        <aside className="left-panel" aria-label="Learn Raga">
          <h3>Learn Raga</h3>
          <p className="lp-desc">Explore raga summaries, moods, and short phrases to get started.</p>
          <ul className="raga-list">
            <li className="raga-item"><strong>Bhairav</strong><span> — Morning, serious</span></li>
            <li className="raga-item"><strong>Yaman</strong><span> — Evening, romantic</span></li>
            <li className="raga-item"><strong>Hamsadhwani</strong><span> — Auspicious, bright</span></li>
          </ul>
          <div className="lp-footer">More lessons coming soon ✨</div>
        </aside>

        <main className="main">
          <div className="card">
          <h1 className="title">Insert audio</h1>

          <label className="dropzone">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <div className="drop-inner">
              <div className="cloud" />
              <p className="drop-text">Click to choose or drag an audio file</p>
              <p className="small">Supported: mp3, wav, m4a (client-side preview)</p>
            </div>
          </label>

          {file && (
            <div className="preview">
              <strong>Selected:</strong> {file.name}
              {audioURL && <audio src={audioURL} controls className="audio-player" />}
            </div>
          )}

          <div className="actions">
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={!file}
            >
              Analyze Raga
            </button>
          </div>
        </div>
      </main>

      {showRagas && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h2>Ragas</h2>
            <p>Add your raga files or manage the library here later.</p>
            <div className="modal-actions">
              <button onClick={() => setShowRagas(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
