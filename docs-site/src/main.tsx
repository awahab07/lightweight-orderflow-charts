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

function SurfaceCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <a href={href} style={clickableCardStyle}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{title}</div>
      <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{body}</div>
      <span style={linkStyle}>{cta}</span>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href="../demo/" style={linkStyle}>
              Open Demo
            </a>
            <a href="../demo/#/playground" style={linkStyle}>
              Open Playground
            </a>
            <a href="../demo/#/theming" style={linkStyle}>
              Open Theming
            </a>
            <a href="../storybook/" style={linkStyle}>
              Open Storybook
            </a>
            <a href="../data/" style={linkStyle}>
              Browse Demo Data
            </a>
          </div>
        </section>

        <section style={cardGridStyle}>
          <SurfaceCard
            title="Demo"
            body="A richer exploration surface with Explore and Playground routes for fixture-backed chart validation."
            href="../demo/"
            cta="Open demo"
          />
          <SurfaceCard
            title="Playground"
            body="Preset-driven fixture controls for changing display, studies, and chart composition in one place."
            href="../demo/#/playground"
            cta="Open playground"
          />
          <SurfaceCard
            title="Theming"
            body="A fixed chart composition with a right-sidebar theme editor for the visible surface, studies, and candles."
            href="../demo/#/theming"
            cta="Open theming"
          />
          <SurfaceCard
            title="Storybook"
            body="Interactive stories for full chart compositions, isolated study components, and theme tuning."
            href="../storybook/"
            cta="Go to stories"
          />
          <SurfaceCard
            title="Fixture Data"
            body="Publicly served aggregated market fixtures that docs, stories, and the demo can reference."
            href="../data/"
            cta="Inspect data"
          />
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
