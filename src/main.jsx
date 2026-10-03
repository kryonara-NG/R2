import React from 'react';
import { createRoot } from 'react-dom/client';
import './shell.css';

window.RH_TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY?.trim() || '';

const pages = new Set([
  'index','home','search','library','series','player','people','person','settings',
  'share','soon','stats','genre','me','notifs'
]);

function pageForPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const first = clean.split('/')[0];
  return pages.has(first) ? first : 'index';
}

function App() {
  const page = pageForPath(window.location.pathname);
  const params = window.location.search;
  const src = `/legacy/${page}.html${params}`;

  return (
    <main className="reelhouse-react-shell" aria-label="Reelhouse">
      <iframe
        key={src}
        title="Reelhouse"
        src={src}
        className="reelhouse-frame"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
