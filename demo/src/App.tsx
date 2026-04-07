import { useEffect, useState } from 'react';

import { LearnDemoPage } from './components/LearnDemoPage';
import { PlaygroundPage } from './components/PlaygroundPage';

type DemoRoute = 'learn' | 'playground';

function parseRoute(hash: string): DemoRoute {
  const normalized = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  return normalized === 'playground' ? 'playground' : 'learn';
}

export function App() {
  const [route, setRoute] = useState<DemoRoute>(() =>
    typeof window === 'undefined' ? 'learn' : parseRoute(window.location.hash),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = '/';
    }

    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        color: '#e2e8f0',
        fontFamily: 'Inter, Arial, sans-serif',
        background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 1))',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Lightweight Order Flow Charts</h1>
          <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
            Reusable order-flow charts and studies for React and lightweight-charts.
          </p>
        </header>

        {route === 'playground' ? <PlaygroundPage /> : <LearnDemoPage />}
      </div>
    </div>
  );
}
