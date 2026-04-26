import { useEffect, useState } from 'react';

import { ConnectPage } from './components/ConnectPage';
import { ExploreDemoPage } from './components/LearnDemoPage';
import { PlaygroundPage } from './components/PlaygroundPage';

type DemoRoute = 'explore' | 'playground' | 'connect';
const CONNECT_ROUTE_ENABLED = import.meta.env.VITE_DEMO_ENABLE_CONNECT !== 'false';

function parseRoute(hash: string): DemoRoute {
  const normalized = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  if (normalized === 'playground') {
    return 'playground';
  }

  if (normalized === 'connect' && CONNECT_ROUTE_ENABLED) {
    return 'connect';
  }

  return 'explore';
}

export function App() {
  const [route, setRoute] = useState<DemoRoute>(() =>
    typeof window === 'undefined' ? 'explore' : parseRoute(window.location.hash),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = '/explore';
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
          <nav style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <a
              href="#/explore"
              style={{ color: route === 'explore' ? '#f8fafc' : '#93c5fd', textDecoration: 'none' }}
            >
              Explore
            </a>
            {CONNECT_ROUTE_ENABLED ? (
              <a
                href="#/connect"
                style={{
                  color: route === 'connect' ? '#f8fafc' : '#93c5fd',
                  textDecoration: 'none',
                }}
              >
                Connect
              </a>
            ) : null}
            <a
              href="#/playground"
              style={{
                color: route === 'playground' ? '#f8fafc' : '#93c5fd',
                textDecoration: 'none',
              }}
            >
              Playground
            </a>
          </nav>
        </header>

        {route === 'playground' ? (
          <PlaygroundPage />
        ) : route === 'connect' ? (
          <ConnectPage />
        ) : (
          <ExploreDemoPage />
        )}
      </div>
    </div>
  );
}
