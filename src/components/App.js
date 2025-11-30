import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '../styles/App.css';
import { curated } from '../data/ragas';
import LearnRagas from './LearnRagas';
import RagaDetail from './RagaDetail';
import Tanpura from './Tanpura';

function App() {
  const [showRagas, setShowRagas] = useState(false);
  const [file, setFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    return () => {
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  useEffect(() => {
    // Check if already installed (standalone display-mode) or iOS standalone
    try {
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const iOS = window.navigator && window.navigator.standalone;
      if (standalone || iOS) setIsInstalled(true);
    } catch (e) {}

    function beforeInstallPrompt(e) {
      // Prevent the automatic prompt
      e.preventDefault();
      // save the event for later triggering
      setDeferredPrompt(e);
      // show our custom install UI unless already installed
      setShowInstall(true);
    }

    function onAppInstalled() {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', beforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // iOS or unsupported — show basic hint
      setShowInstall(false);
      return;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // userChoice.outcome is 'accepted' or 'dismissed'
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (e) {
      // ignore
    }
    setShowInstall(false);
    setDeferredPrompt(null);
  };

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
          <div className="brand">
            <Link to="/" className="brand-link">
              <span className="brand-badge">RD</span>
              <span className="brand-text">Raga Detector</span>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/learn" className="ragas-btn">Learn Ragas</Link>
            <Link to="/tanpura" className="ragas-btn">Tanpura</Link>
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
          <Route path="/tanpura" element={<Tanpura />} />
        </Routes>
        {/* Install prompt banner shown when browser fires beforeinstallprompt */}
        {showInstall && !isInstalled && (
          <div className="install-banner" role="dialog" aria-live="polite">
            <div className="install-msg">Add Raga Detector to your Home screen for quick access.</div>
            <div className="install-actions">
              <button className="install-add" onClick={handleInstall}>Add to Home Screen</button>
              <button className="install-close" onClick={() => setShowInstall(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
