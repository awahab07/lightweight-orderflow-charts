import { StrictMode, type CSSProperties, type ReactNode } from 'react';
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
};

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 20,
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
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
    <article style={cardStyle}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{title}</div>
      <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{body}</div>
      <a href={href} style={linkStyle}>
        {cta}
      </a>
    </article>
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
            <a href="../storybook/" style={linkStyle}>
              Open Storybook
            </a>
            <a href="../demo/" style={linkStyle}>
              Open Demo
            </a>
            <a href="../data/" style={linkStyle}>
              Browse Demo Data
            </a>
          </div>
        </section>

        <section style={cardGridStyle}>
          <SurfaceCard
            title="Storybook"
            body="Interactive stories for full chart compositions, isolated study components, and theme tuning."
            href="../storybook/"
            cta="Go to stories"
          />
          <SurfaceCard
            title="Demo"
            body="A richer exploration surface with Explore and Playground routes for fixture-backed chart validation."
            href="../demo/"
            cta="Open demo"
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
          <pre style={codeStyle}>
            <code>{`import {
  ORDER_FLOW_THEME_PRESETS,
  ORDER_FLOW_STYLE_PRESETS,
  createFootprintSeries,
} from 'lightweight-orderflow-charts';

const series = chart.addCustomSeries(
  createFootprintSeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
    ...ORDER_FLOW_THEME_PRESETS.chartDarkPro.footprint,
  }),
);

series.setData(orderFlowBars);`}</code>
          </pre>
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
