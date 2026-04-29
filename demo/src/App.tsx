import { useEffect, useState } from 'react';

import { ConnectPage } from './components/ConnectPage';
import { ExploreDemoPage } from './components/LearnDemoPage';
import { PlaygroundPage } from './components/PlaygroundPage';
import { ThemingDemoPage } from './components/ThemingDemoPage';

type DemoRoute = 'explore' | 'playground' | 'theming' | 'connect';
const CONNECT_ROUTE_ENABLED = import.meta.env.VITE_DEMO_ENABLE_CONNECT !== 'false';

interface DemoChromeOptions {
  showHeader: boolean;
  showLinks: boolean;
  showToolbar: boolean;
}

function readHashSearchParams(hash: string): URLSearchParams {
  const normalized = hash.replace(/^#/, '');
  const [, search = ''] = normalized.split('?');
  return new URLSearchParams(search);
}

function readBooleanFlag(params: URLSearchParams, key: string, fallback = true): boolean {
  const value = params.get(key);
  if (value == null) {
    return fallback;
  }

  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}

function readDemoChromeOptions(hash: string): DemoChromeOptions {
  const params = readHashSearchParams(hash);
  return {
    showHeader: readBooleanFlag(params, 'showHeader'),
    showLinks: readBooleanFlag(params, 'showLinks'),
    showToolbar: readBooleanFlag(params, 'showToolbar'),
  };
}

function parseRoute(hash: string): DemoRoute {
  const normalized = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  if (normalized === 'playground') {
    return 'playground';
  }

  if (normalized === 'theming') {
    return 'theming';
  }

  if (normalized === 'connect' && CONNECT_ROUTE_ENABLED) {
    return 'connect';
  }

  return 'explore';
}

export function App() {
  const [locationHash, setLocationHash] = useState<string>(() =>
    typeof window === 'undefined' ? '#/explore' : window.location.hash || '#/explore',
  );
  const route = parseRoute(locationHash);
  const chromeOptions = readDemoChromeOptions(locationHash);
  const showHeaderBlock = chromeOptions.showHeader || chromeOptions.showLinks;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.location.hash) {
      window.location.hash = '/explore';
      setLocationHash(window.location.hash);
    }

    const handleHashChange = () => {
      setLocationHash(window.location.hash || '#/explore');
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
        padding: showHeaderBlock ? 24 : 0,
        color: '#e2e8f0',
        fontFamily: 'Inter, Arial, sans-serif',
        background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 1))',
      }}
    >
      <div style={{ maxWidth: showHeaderBlock ? 1280 : 'none', margin: '0 auto' }}>
        {showHeaderBlock ? (
          <header style={{ marginBottom: 24 }}>
            {chromeOptions.showHeader ? (
              <>
                <h1 style={{ margin: 0, fontSize: 32 }}>Lightweight Order Flow Charts</h1>
                <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
                  Reusable order-flow charts and studies for React and lightweight-charts.
                </p>
              </>
            ) : null}
            {chromeOptions.showLinks ? (
              <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                <a
                  href="#/explore"
                  style={{
                    color: route === 'explore' ? '#f8fafc' : '#93c5fd',
                    textDecoration: 'none',
                  }}
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
                <a
                  href="#/theming"
                  style={{
                    color: route === 'theming' ? '#f8fafc' : '#93c5fd',
                    textDecoration: 'none',
                  }}
                >
                  Theming
                </a>
              </nav>
            ) : null}
          </header>
        ) : null}

        {route === 'playground' ? (
          <PlaygroundPage
            key={`playground:${locationHash}`}
            showToolbar={chromeOptions.showToolbar}
          />
        ) : route === 'theming' ? (
          <ThemingDemoPage
            key={`theming:${locationHash}`}
            showToolbar={chromeOptions.showToolbar}
          />
        ) : route === 'connect' ? (
          <ConnectPage key={`connect:${locationHash}`} />
        ) : (
          <ExploreDemoPage
            key={`explore:${locationHash}`}
            showToolbar={chromeOptions.showToolbar}
          />
        )}
      </div>
    </div>
  );
}
