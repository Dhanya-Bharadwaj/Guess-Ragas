import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function RagaDetail() {
  const { id } = useParams();
  const name = decodeURIComponent(id || 'Unknown');

  return (
    <div className="raga-detail">
      <div className="detail-header">
        <Link to="/learn" className="back">← Back to Learn</Link>
        <h1>{name}</h1>
      </div>

      <div className="detail-body">
        <div className="detail-left">
          <div className="detail-card">
            <h3>Overview</h3>
            <p>Short description about <strong>{name}</strong>. You can replace this with curated content, notation, and audio examples.</p>
          </div>

          <div className="detail-card">
            <h3>Quick facts</h3>
            <ul>
              <li>Type: Melakarta / Janya</li>
              <li>Common Time: Morning / Evening</li>
              <li>Popular Compositions: —</li>
            </ul>
          </div>
        </div>

        <aside className="detail-right">
          <div className="detail-card">
            <h3>Audio Sample</h3>
            <p>Upload samples to <code>src/assets</code> and I can wire them here.</p>
          </div>

          <div className="detail-card">
            <h3>Practice</h3>
            <p>Include arohana/avarohana, phrases, and exercises here.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
