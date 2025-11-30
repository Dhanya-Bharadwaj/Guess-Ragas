import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register a simple service worker (public/sw.js) for basic offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // eslint-disable-next-line no-console
      console.log('ServiceWorker registered:', reg.scope);

      // If there's a waiting worker, ask it to activate immediately
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Listen for new installing worker and request it to skipWaiting once installed
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // a new service worker is installed and there's an existing controller
            // request the new SW to take control immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // When the new service worker activates, reload to get the fresh content
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('ServiceWorker registration failed:', err);
    }
  });

  // Poll version.json for updates so we can trigger immediate reloads on deploy
  try {
    const pollInterval = 15000; // 15s
    let currentVersion = null;
    // fetch initial version
    fetch('/version.json', { cache: 'no-store' }).then((r) => r.json()).then((v) => { currentVersion = JSON.stringify(v); }).catch(() => {});

    setInterval(async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const v = await res.json();
        const s = JSON.stringify(v);
        if (currentVersion && s !== currentVersion) {
          // version changed — request service worker activation and reload
          // attempt to activate waiting worker if present
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            // the controllerchange listener above will reload when the new SW takes control
            return;
          }
          // fallback: force a reload with cache-busting param
          window.location.href = window.location.pathname + '?_v=' + encodeURIComponent(new Date().toISOString());
        }
        currentVersion = s;
      } catch (err) {
        // ignore poll errors
      }
    }, pollInterval);
  } catch (e) {
    // ignore
  }
}
