import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '../styles/App.css';
import { curated } from '../data/ragas';
import LearnRagas from './LearnRagas';
import RagaDetail from './RagaDetail';

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
    <BrowserRouter>
      <div className="app-root">
        <div className="morning-sky" />

        <nav className="nav">
          <div className="brand"><Link to="/" className="brand-link">Raga Detector</Link></div>
          <div className="nav-right">
            <Link to="/learn" className="ragas-btn">Learn Ragas</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
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
          } />

          <Route path="/learn" element={<LearnRagas />} />
          <Route path="/raga/:id" element={<RagaDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
