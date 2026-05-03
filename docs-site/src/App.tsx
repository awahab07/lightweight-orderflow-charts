import { marked } from 'marked';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import {
  DOCS_INDEX_MARKDOWN,
  DOCS_PAGE_GROUPS,
  getDocsPage,
  getDocsPagesForGroup,
} from './content/docsPages';
import {
  API_REFERENCE_DOCUMENTED_COUNT,
  API_REFERENCE_ENTRIES,
  API_REFERENCE_GENERATED_AT,
  API_REFERENCE_GROUPS,
  API_REFERENCE_TOTAL_COUNT,
} from './generated/apiReference.generated';
import homeLogoUrl from '../../docs/images/branding/product-icon.png';

marked.setOptions({
  gfm: true,
});

const UPSTREAM_LIGHTWEIGHT_CHARTS_URL = 'https://github.com/tradingview/lightweight-charts';
const FOOTPRINT_PREVIEW_VIEW =
  'eyJ2ZXJzaW9uIjoxLCJ0aW1lUmFuZ2UiOnsiZnJvbSI6MTEuNTE5MjAyMTIxOTg1ODU2LCJ0byI6MTYuMTI2MDM2NTM3MTQ1MzE4fSwicGFuZXMiOlt7InBhbmVJbmRleCI6MCwicHJpY2VTY2FsZUlkIjoicmlnaHQiLCJwcmljZVJhbmdlIjp7ImZyb20iOjQwMS4xMTgwMDE1OTMzNjM2LCJ0byI6NDAyLjQ0NjIxOTYxNDE2Mzk3fX1dfQ';

type AppRoute =
  | { page: 'home' }
  | { page: 'documentation' }
  | { page: 'getting-started' }
  | { page: 'api-reference' }
  | { page: 'doc'; slug: string };

type VisualSurfaceId =
  | 'demo'
  | 'playground'
  | 'theming'
  | 'storybook'
  | 'data'
  | 'getting-started'
  | 'documentation'
  | 'api-reference';

interface DestinationDefinition {
  id: VisualSurfaceId;
  title: string;
  href: string;
  body: string;
  accent: string;
  accentSoft: string;
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  margin: 0,
  padding: '24px 24px 64px',
  background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
  color: '#e2e8f0',
  fontFamily: 'Inter, Arial, sans-serif',
};

const shellStyle: CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  display: 'grid',
  gap: 24,
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
  overflowWrap: 'anywhere',
};

const resourceCardStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  minWidth: 0,
  minHeight: 210,
  padding: 20,
  borderRadius: 20,
  boxSizing: 'border-box',
  background: 'rgba(2, 6, 23, 0.36)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  textDecoration: 'none',
  color: 'inherit',
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

const docsLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
  gap: 20,
  alignItems: 'start',
};

const sidebarStyle: CSSProperties = {
  position: 'sticky',
  top: 24,
  display: 'grid',
  gap: 18,
  padding: 18,
  borderRadius: 20,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
};

const sidebarGroupStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const sidebarLinkStyle: CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  borderRadius: 10,
  color: '#cbd5e1',
  textDecoration: 'none',
  fontSize: 14,
  lineHeight: 1.45,
};

const docsMainStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
};

const docsPanelStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: 24,
  borderRadius: 22,
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 14px',
  borderRadius: 12,
  boxSizing: 'border-box',
  background: '#020617',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const markdownCss = `
  .markdown-article {
    color: #cbd5e1;
    line-height: 1.75;
    font-size: 16px;
  }

  .markdown-article > :first-child {
    margin-top: 0;
  }

  .markdown-article > :last-child {
    margin-bottom: 0;
  }

  .markdown-article h1,
  .markdown-article h2,
  .markdown-article h3,
  .markdown-article h4 {
    color: #f8fafc;
    line-height: 1.2;
  }

  .markdown-article h1 {
    font-size: 34px;
  }

  .markdown-article h2 {
    margin-top: 28px;
    font-size: 26px;
  }

  .markdown-article h3 {
    margin-top: 22px;
    font-size: 20px;
  }

  .markdown-article a {
    color: #93c5fd;
  }

  .markdown-article code {
    padding: 0.12rem 0.36rem;
    border-radius: 8px;
    background: rgba(2, 6, 23, 0.65);
    color: #dbeafe;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.92em;
  }

  .markdown-article pre {
    margin: 0;
    padding: 18px;
    overflow-x: auto;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    background: #020617;
  }

  .markdown-article pre code {
    padding: 0;
    background: transparent;
  }

  .markdown-article blockquote {
    margin: 0;
    padding: 0 0 0 16px;
    border-left: 3px solid rgba(96, 165, 250, 0.42);
    color: #bfdbfe;
  }

  .markdown-article table {
    width: 100%;
    border-collapse: collapse;
    overflow: hidden;
    display: block;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  .markdown-article thead,
  .markdown-article tbody,
  .markdown-article tr {
    width: 100%;
    display: table;
    table-layout: fixed;
  }

  .markdown-article th,
  .markdown-article td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    text-align: left;
    vertical-align: top;
  }

  .markdown-article th {
    color: #f8fafc;
    background: rgba(2, 6, 23, 0.46);
  }

  .markdown-article img {
    display: block;
    width: 100%;
    max-width: 720px;
    margin: 18px 0;
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(2, 6, 23, 0.42);
  }

  @media (max-width: 980px) {
    .docs-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .docs-sidebar {
      position: static;
    }
  }
`;

const QUICK_START_EXAMPLES = [
  {
    id: 'footprint',
    label: 'Footprint',
    href: `../demo/#/explore?preset=order-flow&theme=smooth-light&symbol=TSLA&date=2026-03-10&interval=5m&mintick=0.1&view=${FOOTPRINT_PREVIEW_VIEW}`,
    embedHref: `../demo/#/explore?preset=order-flow&theme=smooth-light&showHeader=false&showLinks=false&showToolbar=false&symbol=TSLA&date=2026-03-10&interval=5m&mintick=0.1&view=${FOOTPRINT_PREVIEW_VIEW}`,
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

const SURFACE_DESTINATIONS: DestinationDefinition[] = [
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
] as const;

const HOME_GUIDE_DESTINATIONS: DestinationDefinition[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    href: '#/getting-started',
    body: 'Walk through installation, normalized data, and the first rendered footprint chart step by step.',
    accent: '#93c5fd',
    accentSoft: 'rgba(59, 130, 246, 0.22)',
  },
  {
    id: 'documentation',
    title: 'Documentation',
    href: '#/documentation',
    body: 'Browse the repo markdown guides in a grouped sidebar-style documentation surface.',
    accent: '#67e8f9',
    accentSoft: 'rgba(34, 211, 238, 0.2)',
  },
] as const;

const HOME_CARD_DESTINATIONS: DestinationDefinition[] = [
  ...SURFACE_DESTINATIONS.filter((destination) => destination.id !== 'data'),
  ...HOME_GUIDE_DESTINATIONS,
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

function parseRoute(hash: string): AppRoute {
  const normalized = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
  if (!normalized) {
    return { page: 'home' };
  }

  const segments = normalized.split('/').filter(Boolean);
  const [firstSegment, secondSegment] = segments;

  if (firstSegment === 'getting-started') {
    return { page: 'getting-started' };
  }

  if (firstSegment === 'api-reference') {
    return { page: 'api-reference' };
  }

  if (firstSegment === 'documentation' || firstSegment === 'docs') {
    if (!secondSegment) {
      return { page: 'documentation' };
    }

    if (secondSegment === 'getting-started') {
      return { page: 'getting-started' };
    }

    if (secondSegment === 'api-reference') {
      return { page: 'api-reference' };
    }

    return { page: 'doc', slug: secondSegment };
  }

  return { page: 'home' };
}

function getDocsPageHref(slug: string): string {
  if (slug === 'getting-started') {
    return '#/getting-started';
  }

  if (slug === 'api-reference') {
    return '#/api-reference';
  }

  return `#/docs/${slug}`;
}

function isDocsPageActive(route: AppRoute, slug: string): boolean {
  if (slug === 'getting-started') {
    return route.page === 'getting-started';
  }

  if (slug === 'api-reference') {
    return route.page === 'api-reference';
  }

  return route.page === 'doc' && route.slug === slug;
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

function SurfaceIcon({ id, size = 20 }: { id: VisualSurfaceId; size?: number }) {
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
    case 'getting-started':
      return (
        <svg {...commonProps}>
          <path d="M6 5h12" />
          <path d="M6 12h12" />
          <path d="M6 19h12" />
          <circle cx="4" cy="5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="4" cy="19" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'documentation':
      return (
        <svg {...commonProps}>
          <path d="M7 4h10a2 2 0 0 1 2 2v12H9a2 2 0 0 0-2 2Z" />
          <path d="M7 4v16a2 2 0 0 1 2-2h10" />
          <path d="M11 8h5" />
          <path d="M11 12h5" />
        </svg>
      );
    case 'api-reference':
      return (
        <svg {...commonProps}>
          <path d="M9 6 5 12l4 6" />
          <path d="M15 6l4 6-4 6" />
          <path d="M12 4 10.5 20" />
        </svg>
      );
  }
}

function QuickLink({ destination }: { destination: DestinationDefinition }) {
  return (
    <a href={destination.href} style={heroLinkStyle}>
      <span
        style={{
          ...heroLinkIconWrapStyle,
          color: destination.accent,
          background: destination.accentSoft,
        }}
      >
        <SurfaceIcon id={destination.id} size={15} />
      </span>
      <span>{destination.title}</span>
    </a>
  );
}

function ExternalSurfaceCard({ destination }: { destination: DestinationDefinition }) {
  return (
    <a href={destination.href} style={surfaceCardStyle}>
      <div
        style={{
          fontSize: 'clamp(24px, 5vw, 30px)',
          fontWeight: 800,
          lineHeight: 1.05,
          color: '#f8fafc',
          minWidth: 0,
          maxWidth: '100%',
          overflowWrap: 'anywhere',
        }}
      >
        {destination.title}
      </div>
      <div
        style={{
          ...surfaceCardGraphicStyle,
          background: `linear-gradient(145deg, ${destination.accentSoft} 0%, rgba(15, 23, 42, 0.4) 100%)`,
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
        <div style={{ ...surfaceCardGraphicBadgeStyle, color: destination.accent }}>
          <SurfaceIcon id={destination.id} size={44} />
        </div>
      </div>
      <div style={surfaceCardDescriptionStyle}>{destination.body}</div>
    </a>
  );
}

function MarkdownArticle({ markdown }: { markdown: string }) {
  const html = useMemo(() => marked.parse(markdown) as string, [markdown]);

  return <article className="markdown-article" dangerouslySetInnerHTML={{ __html: html }} />;
}

function DocsSidebar({ route }: { route: AppRoute }) {
  return (
    <aside className="docs-sidebar" style={sidebarStyle}>
      <div style={sidebarGroupStyle}>
        <div
          style={{
            margin: 0,
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Overview
        </div>
        <a
          href="#/"
          style={{
            ...sidebarLinkStyle,
            background: route.page === 'home' ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
            color: route.page === 'home' ? '#dbeafe' : '#cbd5e1',
          }}
        >
          Home
        </a>
        <a
          href="#/documentation"
          style={{
            ...sidebarLinkStyle,
            background: route.page === 'documentation' ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
            color: route.page === 'documentation' ? '#dbeafe' : '#cbd5e1',
          }}
        >
          Documentation
        </a>
      </div>

      {DOCS_PAGE_GROUPS.map((group) => {
        const pages = getDocsPagesForGroup(group.id);
        if (!pages.length) {
          return null;
        }

        return (
          <div key={group.id} style={sidebarGroupStyle}>
            <div
              style={{
                margin: 0,
                color: '#94a3b8',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {group.title}
            </div>
            {pages.map((page) => {
              const isActive = isDocsPageActive(route, page.slug);
              return (
                <a
                  key={page.slug}
                  href={getDocsPageHref(page.slug)}
                  style={{
                    ...sidebarLinkStyle,
                    background: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    color: isActive ? '#dbeafe' : '#cbd5e1',
                  }}
                >
                  {page.title}
                </a>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}

function DocsShell({
  route,
  title,
  body,
  children,
}: {
  route: AppRoute;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
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
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.05, color: '#f8fafc' }}>{title}</h1>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7, maxWidth: 820 }}>{body}</p>
        </div>
      </section>

      <div className="docs-layout" style={docsLayoutStyle}>
        <DocsSidebar route={route} />
        <div style={docsMainStyle}>{children}</div>
      </div>
    </div>
  );
}

function DocumentationMapPage({ route }: { route: AppRoute }) {
  return (
    <DocsShell
      route={route}
      title="Documentation"
      body="Browse the repo markdown guides grouped like a left-nav docs surface. Each entry corresponds to a page in the docs site and maps back to the source markdown file in `docs/`."
    >
      <section style={docsPanelStyle}>
        <MarkdownArticle markdown={DOCS_INDEX_MARKDOWN} />
      </section>

      {DOCS_PAGE_GROUPS.map((group) => {
        const pages = getDocsPagesForGroup(group.id);
        if (!pages.length) {
          return null;
        }

        return (
          <section key={group.id} style={docsPanelStyle}>
            <div style={{ display: 'grid', gap: 6 }}>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>{group.title}</h2>
              <div style={{ color: '#94a3b8', lineHeight: 1.6 }}>{group.description}</div>
            </div>
            <div style={cardGridStyle}>
              {pages.map((page) => (
                <a key={page.slug} href={getDocsPageHref(page.slug)} style={resourceCardStyle}>
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: '#f8fafc' }}>
                    {page.title}
                  </div>
                  <div style={{ color: '#cbd5e1', lineHeight: 1.65 }}>{page.summary}</div>
                  <code
                    style={{
                      width: 'fit-content',
                      padding: '0.18rem 0.45rem',
                      borderRadius: 8,
                      background: 'rgba(2, 6, 23, 0.65)',
                      color: '#dbeafe',
                      fontSize: 12,
                    }}
                  >
                    {page.sourcePath}
                  </code>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </DocsShell>
  );
}

function DocsMarkdownPage({ route, slug }: { route: AppRoute; slug: string }) {
  const page = getDocsPage(slug);

  if (!page) {
    return (
      <DocsShell
        route={route}
        title="Docs Page Not Found"
        body="The requested documentation page was not found. Use the sidebar to browse the published docs."
      >
        <section style={docsPanelStyle}>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
            The requested docs page does not exist.
          </p>
        </section>
      </DocsShell>
    );
  }

  return (
    <DocsShell route={route} title={page.title} body={page.summary}>
      <section style={docsPanelStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(2, 6, 23, 0.42)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {page.sourcePath}
          </span>
        </div>
        <MarkdownArticle markdown={page.markdown} />
      </section>
    </DocsShell>
  );
}

function ApiReferencePage({ route }: { route: AppRoute }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) {
      return [...API_REFERENCE_ENTRIES];
    }

    return API_REFERENCE_ENTRIES.filter((entry) =>
      [
        entry.name,
        entry.kind,
        entry.entrypoint,
        entry.groupTitle,
        entry.sourcePath,
        entry.preview,
        entry.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredGroups = useMemo(
    () =>
      API_REFERENCE_GROUPS.map((group) => ({
        ...group,
        entries: filteredEntries.filter((entry) => entry.groupId === group.id),
      })).filter((group) => group.entries.length > 0),
    [filteredEntries],
  );

  return (
    <DocsShell
      route={route}
      title="API Reference"
      body="Search the public exports for the core and React entry points. This page is generated from the package barrel files so it stays aligned with the published surface."
    >
      <section style={docsPanelStyle}>
        <div style={cardGridStyle}>
          <div style={resourceCardStyle}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#f8fafc' }}>
              {API_REFERENCE_TOTAL_COUNT}
            </div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.65 }}>Total public exports</div>
          </div>
          <div style={resourceCardStyle}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#f8fafc' }}>
              {API_REFERENCE_DOCUMENTED_COUNT}
            </div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.65 }}>
              Exports with inline JSDoc descriptions
            </div>
          </div>
          <div style={resourceCardStyle}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>Auto-maintained</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.65 }}>
              Generated from `src/index.ts` and `src/react.ts` by `npm run
              docs:generate-api-reference`.
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: 'rgba(2, 6, 23, 0.34)',
            border: '1px solid rgba(148, 163, 184, 0.14)',
            color: '#cbd5e1',
            lineHeight: 1.7,
          }}
        >
          Richer descriptions on this page come from JSDoc on the exported declarations themselves.
          Today only a few symbols have that extra inline documentation, so the fastest way to make
          this reference more descriptive is to add JSDoc blocks to the high-value public types and
          factories in source.
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label htmlFor="api-search" style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
            Search exports
          </label>
          <input
            id="api-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by symbol, source file, group, description, or entry point"
            style={searchInputStyle}
          />
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            Generated at <code>{API_REFERENCE_GENERATED_AT}</code> and showing{' '}
            {filteredEntries.length.toLocaleString()} matching exports.
          </div>
        </div>
      </section>

      {filteredGroups.length ? (
        filteredGroups.map((group) => (
          <section key={group.id} style={docsPanelStyle}>
            <div style={{ display: 'grid', gap: 4 }}>
              <h2 style={{ margin: 0, color: '#f8fafc' }}>{group.title}</h2>
              <div style={{ color: '#94a3b8', lineHeight: 1.6 }}>{group.description}</div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {group.entries.map((entry) => (
                <div
                  key={`${entry.entrypoint}:${entry.name}`}
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: 16,
                    borderRadius: 16,
                    background: 'rgba(2, 6, 23, 0.34)',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                      {entry.name}
                    </div>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: 'rgba(37, 99, 235, 0.18)',
                        color: '#dbeafe',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {entry.kind}
                    </span>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {entry.entrypoint}
                    </span>
                  </div>
                  <code
                    style={{
                      width: 'fit-content',
                      padding: '0.18rem 0.45rem',
                      borderRadius: 8,
                      background: 'rgba(2, 6, 23, 0.65)',
                      color: '#dbeafe',
                      fontSize: 12,
                    }}
                  >
                    {entry.sourcePath}
                  </code>
                  <pre style={codeStyle}>
                    <code>{entry.preview}</code>
                  </pre>
                  <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
                    {entry.description ??
                      'No inline JSDoc description yet. Add JSDoc to the exported declaration to enrich this entry automatically.'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <section style={docsPanelStyle}>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
            No exports matched the current search.
          </p>
        </section>
      )}
    </DocsShell>
  );
}

function HomePage() {
  const [activeExampleId, setActiveExampleId] =
    useState<(typeof QUICK_START_EXAMPLES)[number]['id']>('footprint');
  const activeExample =
    QUICK_START_EXAMPLES.find((example) => example.id === activeExampleId) ??
    QUICK_START_EXAMPLES[0];

  return (
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

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ display: 'grid', gap: 10, flex: '1 1 520px', minWidth: 0, maxWidth: 780 }}>
            <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.05, color: '#f8fafc' }}>
              Lightweight Order Flow Charts
            </h1>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
              A package-first collection of order-flow renderers, studies, aggregation helpers, and
              React bindings built on top of{' '}
              <a href={UPSTREAM_LIGHTWEIGHT_CHARTS_URL} style={linkStyle}>
                TradingView lightweight-charts
              </a>
              .
            </p>
          </div>

          <img
            src={homeLogoUrl}
            alt="Lightweight Order Flow Charts logo"
            style={{
              width: 'min(100%, 260px)',
              maxWidth: 260,
              height: 'auto',
              objectFit: 'contain',
              flex: '0 0 auto',
              justifySelf: 'end',
              margin: '0 auto',
            }}
          />
        </div>

        <div style={heroLinksStyle}>
          {SURFACE_DESTINATIONS.map((destination) => (
            <QuickLink key={destination.id} destination={destination} />
          ))}
        </div>
      </section>

      <section style={cardGridStyle}>
        {HOME_CARD_DESTINATIONS.map((destination) => (
          <ExternalSurfaceCard key={destination.id} destination={destination} />
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
              Utility helpers for minute aggregation, chart-state capture or restore, and candle
              heatmaps.
            </>,
            <>React bindings for custom series, primitives, and chart-context wiring.</>,
          ]}
        />
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>Quick Start</h2>
        <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>
          The live preview embeds the served demo so the example stays synchronized with the public
          surface and preset URLs.
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
            <a key={chartType.title} href={chartType.href} style={resourceCardStyle}>
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
              Storybook is MIT licensed, which is compatible with this project&apos;s documentation
              and development tooling usage.
            </>,
            <>
              <a href={UPSTREAM_LIGHTWEIGHT_CHARTS_URL} style={linkStyle}>
                TradingView lightweight-charts
              </a>{' '}
              is Apache-2.0 licensed. Public integrations still need to preserve the upstream
              attribution and link requirements noted in `NOTICE` and `docs/ATTRIBUTION.md`.
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
  );
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? { page: 'home' } : parseRoute(window.location.hash),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const title =
      route.page === 'home'
        ? 'Lightweight Order Flow Charts | Docs'
        : route.page === 'documentation'
          ? 'Lightweight Order Flow Charts | Documentation'
          : route.page === 'getting-started'
            ? 'Lightweight Order Flow Charts | Getting Started'
            : route.page === 'api-reference'
              ? 'Lightweight Order Flow Charts | API Reference'
              : `Lightweight Order Flow Charts | ${getDocsPage(route.slug)?.title ?? 'Docs'}`;

    document.title = title;
  }, [route]);

  return (
    <main style={pageStyle}>
      <style>{markdownCss}</style>
      {route.page === 'home' ? (
        <HomePage />
      ) : route.page === 'documentation' ? (
        <DocumentationMapPage route={route} />
      ) : route.page === 'getting-started' ? (
        <DocsMarkdownPage route={route} slug="getting-started" />
      ) : route.page === 'api-reference' ? (
        <ApiReferencePage route={route} />
      ) : (
        <DocsMarkdownPage route={route} slug={route.slug} />
      )}
    </main>
  );
}
