import { StrictMode, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  padding: '32px 24px 64px',
  background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
  color: '#e2e8f0',
  fontFamily: 'Inter, Arial, sans-serif',
};

const shellStyle: CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  display: 'grid',
  gap: 28,
};

const heroStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: 28,
  borderRadius: 24,
  background: 'rgba(15, 23, 42, 0.84)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 24px 56px rgba(2, 6, 23, 0.38)',
};

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: 16,
  alignItems: 'stretch',
};

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 20,
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const clickableCardStyle: CSSProperties = {
  ...cardStyle,
  minWidth: 0,
  minHeight: 180,
  boxSizing: 'border-box',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
};

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 24,
  borderRadius: 20,
  background: 'rgba(15, 23, 42, 0.7)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const codeStyle: CSSProperties = {
  margin: 0,
  padding: 18,
  borderRadius: 16,
  background: '#020617',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  color: '#dbeafe',
  overflowX: 'auto',
  fontSize: 13,
  lineHeight: 1.6,
};

const linkStyle: CSSProperties = {
  color: '#93c5fd',
  textDecoration: 'none',
};

const heroLinksStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
};

const heroLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 42,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'rgba(2, 6, 23, 0.34)',
  color: '#e2e8f0',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  boxSizing: 'border-box',
};

const heroLinkIconWrapStyle: CSSProperties = {
  width: 24,
  height: 24,
  display: 'inline-grid',
  placeItems: 'center',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.72)',
  flex: '0 0 auto',
};

const surfaceCardStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  minWidth: 0,
  minHeight: 320,
  padding: 22,
  borderRadius: 22,
  boxSizing: 'border-box',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
};

const surfaceCardGraphicStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  minHeight: 164,
  padding: 24,
  borderRadius: 20,
  overflow: 'hidden',
  border: '1px solid rgba(148, 163, 184, 0.14)',
};

const surfaceCardGraphicBadgeStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: 88,
  height: 88,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 28,
  background: 'rgba(2, 6, 23, 0.24)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 18px 36px rgba(2, 6, 23, 0.22)',
};

const surfaceCardDescriptionStyle: CSSProperties = {
  color: '#cbd5e1',
  lineHeight: 1.65,
  fontSize: 16,
};

const quickStartLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
  gap: 18,
  alignItems: 'start',
};

const tabRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(110px, 100%), 1fr))',
  gap: 10,
};

const iframeCardStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  minWidth: 0,
  padding: 16,
  borderRadius: 18,
  background: '#020617',
  border: '1px solid rgba(148, 163, 184, 0.16)',
};

const galleryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: 16,
};

const chartImageStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.12)',
  background: '#020617',
};

type SurfaceId = 'demo' | 'playground' | 'theming' | 'storybook' | 'data';

interface SurfaceDestination {
  id: SurfaceId;
  title: string;
  href: string;
  body: string;
  accent: string;
  accentSoft: string;
}

const QUICK_START_EXAMPLES = [
  {
    id: 'footprint',
    label: 'Footprint',
    href: '../demo/#/explore?preset=order-flow&theme=smooth-light',
    embedHref:
      '../demo/#/explore?preset=order-flow&theme=smooth-light&showHeader=false&showLinks=false&showToolbar=false',
    code: `import {
  ORDER_FLOW_THEME_PRESETS,
  ORDER_FLOW_STYLE_PRESETS,
  createFootprintSeries,
} from 'lightweight-orderflow-charts';

const series = chart.addCustomSeries(
  createFootprintSeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
    ...ORDER_FLOW_THEME_PRESETS.smoothLight.footprint,
  }),
);

series.setData(orderFlowBars);`,
  },
  {
    id: 'delta',
    label: 'Delta',
    href: '../demo/#/explore?preset=ladder-fundamentals&theme=midnight-terminal',
    embedHref:
      '../demo/#/explore?preset=ladder-fundamentals&theme=midnight-terminal&showHeader=false&showLinks=false&showToolbar=false',
    code: `import {
  ORDER_FLOW_THEME_PRESETS,
  ORDER_FLOW_STYLE_PRESETS,
  createDeltaSummarySeries,
} from 'lightweight-orderflow-charts';

const summary = chart.addCustomSeries(
  createDeltaSummarySeries({
    ...ORDER_FLOW_STYLE_PRESETS.classicReference.deltaSummary,
    ...ORDER_FLOW_THEME_PRESETS.midnightTerminal.deltaSummary,
  }),
  1,
);

summary.setData(orderFlowBars);`,
  },
  {
    id: 'volume-profile',
    label: 'Volume Profile',
    href: '../demo/#/explore?preset=session-map&theme=cobalt-workstation',
    embedHref:
      '../demo/#/explore?preset=session-map&theme=cobalt-workstation&showHeader=false&showLinks=false&showToolbar=false',
    code: `import {
  ORDER_FLOW_THEME_PRESETS,
  ORDER_FLOW_STYLE_PRESETS,
} from 'lightweight-orderflow-charts';
import { VolumeProfile } from 'lightweight-orderflow-charts/react';

const profileOptions = {
  ...ORDER_FLOW_STYLE_PRESETS.shadedReference.volumeProfile,
  ...ORDER_FLOW_THEME_PRESETS.cobaltWorkstation.volumeProfile,
};

<VolumeProfile series={footprintSeries} data={orderFlowBars} options={profileOptions} />;`,
  },
] as const;

const SURFACE_DESTINATIONS: SurfaceDestination[] = [
  {
    id: 'demo',
    title: 'Demo',
    href: '../demo/',
    body: 'A richer exploration surface with Explore and Playground routes for fixture-backed chart validation.',
    accent: '#7dd3fc',
    accentSoft: 'rgba(14, 165, 233, 0.22)',
  },
  {
    id: 'playground',
    title: 'Playground',
    href: '../demo/#/playground',
    body: 'Preset-driven fixture controls for changing display, studies, and chart composition in one place.',
    accent: '#c4b5fd',
    accentSoft: 'rgba(139, 92, 246, 0.22)',
  },
  {
    id: 'theming',
    title: 'Theming',
    href: '../demo/#/theming',
    body: 'A fixed chart composition with a right-sidebar theme editor for the visible surface, studies, and candles.',
    accent: '#f9a8d4',
    accentSoft: 'rgba(236, 72, 153, 0.22)',
  },
  {
    id: 'storybook',
    title: 'Storybook',
    href: '../storybook/',
    body: 'Interactive stories for full chart compositions, isolated study components, and theme tuning.',
    accent: '#fcd34d',
    accentSoft: 'rgba(245, 158, 11, 0.22)',
  },
  {
    id: 'data',
    title: 'Data',
    href: '../data/',
    body: 'Publicly served aggregated market fixtures that docs, stories, and the demo can reference.',
    accent: '#86efac',
    accentSoft: 'rgba(34, 197, 94, 0.22)',
  },
];

const CHART_TYPE_GALLERY = [
  {
    title: 'Basic Footprint Chart',
    href: '../demo/#/explore?preset=order-flow&theme=smooth-light',
    image: './images/chart-types/basic-footprint-chart.png',
  },
  {
    title: 'Delta Stats',
    href: '../demo/#/explore?preset=order-flow-delta&theme=ivory-terminal',
    image: './images/chart-types/delta-stats.png',
  },
  {
    title: 'Volume Nodes',
    href: '../demo/#/explore?preset=session-map&theme=depth-heat',
    image: './images/chart-types/volume-nodes.png',
  },
  {
    title: 'Session Profile',
    href: '../demo/#/explore?preset=absorption&theme=depth-heat',
    image: './images/chart-types/session-profile.png',
  },
  {
    title: 'Price Point of Control',
    href: '../demo/#/explore?preset=volume-profile-shape&theme=obsidian-minimal',
    image: './images/chart-types/price-point-of-control.png',
  },
  {
    title: 'Heatmap Candles',
    href: '../demo/#/explore?preset=candle-heatmap&theme=paper-classic',
    image: './images/chart-types/heatmap-candles.png',
  },
  {
    title: 'Delta Pivots',
    href: '../demo/#/explore?preset=volume-delta-pivot&theme=obsidian-minimal',
    image: './images/chart-types/delta-pivots.png',
  },
] as const;

function SurfaceIcon({ id, size = 20 }: { id: SurfaceId; size?: number }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (id) {
    case 'demo':
      return (
        <svg {...commonProps}>
          <path d="M4 19V6" />
          <path d="M12 19V10" />
          <path d="M20 19V4" />
          <rect x="2.5" y="10" width="3" height="5" rx="1" fill="currentColor" stroke="none" />
          <rect x="10.5" y="7" width="3" height="7" rx="1" fill="currentColor" stroke="none" />
          <rect x="18.5" y="8" width="3" height="6" rx="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'playground':
      return (
        <svg {...commonProps}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
          <circle cx="9" cy="7" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="11" cy="17" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'theming':
      return (
        <svg {...commonProps}>
          <path d="M12 4c4.42 0 8 3.13 8 7 0 2.13-1.74 3.5-3.56 3.5h-1.08a1.35 1.35 0 0 0-1.36 1.36A2.62 2.62 0 0 1 11.38 18C7.3 18 4 15.1 4 11.5S7.58 4 12 4Z" />
          <circle cx="8.4" cy="10.2" r="1" fill="currentColor" stroke="none" />
          <circle cx="11.7" cy="8.2" r="1" fill="currentColor" stroke="none" />
          <circle cx="15.1" cy="10.1" r="1" fill="currentColor" stroke="none" />
          <circle cx="9.9" cy="13.4" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'storybook':
      return (
        <svg {...commonProps}>
          <path d="M5 6.5a2.5 2.5 0 0 1 2.5-2.5H18v15H7.5A2.5 2.5 0 0 0 5 21.5Z" />
          <path d="M7.5 4v15" />
          <path d="M18 19H7.5A2.5 2.5 0 0 0 5 21.5" />
          <path d="M11 8h4" />
          <path d="M11 12h4" />
        </svg>
      );
    case 'data':
      return (
        <svg {...commonProps}>
          <ellipse cx="12" cy="6" rx="6.5" ry="2.5" />
          <path d="M5.5 6v5c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5V6" />
          <path d="M5.5 11v5c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5v-5" />
        </svg>
      );
  }
}

function SurfaceQuickLink({ surface }: { surface: SurfaceDestination }) {
  return (
    <a href={surface.href} style={heroLinkStyle}>
      <span
        style={{
          ...heroLinkIconWrapStyle,
          color: surface.accent,
          background: surface.accentSoft,
        }}
      >
        <SurfaceIcon id={surface.id} size={15} />
      </span>
      <span>{surface.title}</span>
    </a>
  );
}

function SurfaceCard({ surface }: { surface: SurfaceDestination }) {
  return (
    <a href={surface.href} style={surfaceCardStyle}>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, color: '#f8fafc' }}>
        {surface.title}
      </div>
      <div
        style={{
          ...surfaceCardGraphicStyle,
          background: `linear-gradient(145deg, ${surface.accentSoft} 0%, rgba(15, 23, 42, 0.4) 100%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 45%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 64,
            height: 64,
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 18,
            bottom: 18,
            width: 96,
            height: 28,
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        <div style={{ ...surfaceCardGraphicBadgeStyle, color: surface.accent }}>
          <SurfaceIcon id={surface.id} size={44} />
        </div>
      </div>
      <div style={surfaceCardDescriptionStyle}>{surface.body}</div>
    </a>
  );
}

function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: '#cbd5e1' }}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function App() {
  const [activeExampleId, setActiveExampleId] =
    useState<(typeof QUICK_START_EXAMPLES)[number]['id']>('footprint');
  const activeExample =
    QUICK_START_EXAMPLES.find((example) => example.id === activeExampleId) ??
    QUICK_START_EXAMPLES[0];

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <div
            style={{
              display: 'inline-flex',
              width: 'fit-content',
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid rgba(96, 165, 250, 0.28)',
              color: '#bfdbfe',
              background: 'rgba(37, 99, 235, 0.12)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Public Docs
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.05, color: '#f8fafc' }}>
              Lightweight Order Flow Charts
            </h1>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7, maxWidth: 780 }}>
              A package-first collection of order-flow renderers, studies, aggregation helpers, and
              React bindings built on top of TradingView&apos;s `lightweight-charts`.
            </p>
          </div>

          <div style={heroLinksStyle}>
            {SURFACE_DESTINATIONS.map((surface) => (
              <SurfaceQuickLink key={surface.id} surface={surface} />
            ))}
          </div>
        </section>

        <section style={cardGridStyle}>
          {SURFACE_DESTINATIONS.filter((surface) => surface.id !== 'data').map((surface) => (
            <SurfaceCard key={surface.id} surface={surface} />
          ))}
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Install</h2>
          <pre style={codeStyle}>
            <code>{`npm install lightweight-orderflow-charts lightweight-charts

# Optional React bindings
npm install react react-dom`}</code>
          </pre>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Library Surface</h2>
          <InfoList
            items={[
              <>Custom series builders for footprint and delta-summary rendering.</>,
              <>Primitives for visible-range volume profiles, session profiles, and VWAP.</>,
              <>
                Utility helpers for minute aggregation, chart-state capture/restore, and candle
                heatmaps.
              </>,
              <>React bindings for custom series, primitives, and chart-context wiring.</>,
            ]}
          />
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Quick Start</h2>
          <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
            The live preview embeds the served demo so the example stays synchronized with the
            public surface and preset URLs.
          </div>
          <div style={quickStartLayoutStyle}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={tabRowStyle}>
                {QUICK_START_EXAMPLES.map((example) => {
                  const isActive = example.id === activeExample.id;
                  return (
                    <button
                      key={example.id}
                      type="button"
                      onClick={() => setActiveExampleId(example.id)}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        minHeight: 48,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        border: isActive
                          ? '1px solid rgba(147, 197, 253, 0.42)'
                          : '1px solid rgba(148, 163, 184, 0.18)',
                        background: isActive ? 'rgba(37, 99, 235, 0.18)' : 'rgba(15, 23, 42, 0.72)',
                        color: isActive ? '#dbeafe' : '#cbd5e1',
                      }}
                    >
                      {example.label}
                    </button>
                  );
                })}
              </div>
              <pre style={codeStyle}>
                <code>{activeExample.code}</code>
              </pre>
            </div>

            <div style={iframeCardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>
                  {activeExample.label} preview
                </div>
                <a href={activeExample.href} style={linkStyle}>
                  Open in demo
                </a>
              </div>
              <iframe
                key={activeExample.id}
                title={`${activeExample.label} demo preview`}
                src={activeExample.embedHref}
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: 540,
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 14,
                  background: '#020617',
                }}
              />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Chart Types</h2>
          <div style={galleryGridStyle}>
            {CHART_TYPE_GALLERY.map((chartType) => (
              <a key={chartType.title} href={chartType.href} style={clickableCardStyle}>
                <img src={chartType.image} alt={chartType.title} style={chartImageStyle} />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                  {chartType.title}
                </div>
              </a>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Licensing and Attribution</h2>
          <InfoList
            items={[
              <>This repository is MIT licensed.</>,
              <>
                Storybook is MIT licensed, which is compatible with this project&apos;s
                documentation and development tooling usage.
              </>,
              <>
                TradingView&apos;s `lightweight-charts` is Apache-2.0 licensed. Public integrations
                still need to preserve the upstream attribution and link requirements noted in
                `NOTICE` and `docs/ATTRIBUTION.md`.
              </>,
            ]}
          />
        </section>

        <section style={sectionStyle}>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Data Disclaimer</h2>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
            The served fixture data is locally crafted for demonstration, validation, and design
            review. It is not a live feed, it may omit raw market metadata, and it should not be
            treated as a complete representation of true market conditions.
          </p>
        </section>
      </div>
    </main>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Docs root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
