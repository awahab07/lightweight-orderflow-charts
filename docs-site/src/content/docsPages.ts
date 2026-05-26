import apiReferenceMarkdown from '../../../docs/API_REFERENCE.md?raw';
import architectureMarkdown from '../../../docs/ARCHITECTURE.md?raw';
import attributionMarkdown from '../../../docs/ATTRIBUTION.md?raw';
import autoFitMarkdown from '../../../docs/AUTO_FIT.md?raw';
import candleHeatmapMarkdown from '../../../docs/CANDLE_HEATMAP.md?raw';
import chartStateMarkdown from '../../../docs/CHART_STATE.md?raw';
import connectorsMarkdown from '../../../docs/CONNECTORS.md?raw';
import dataRequirementsMarkdown from '../../../docs/DATA_REQUIREMENTS.md?raw';
import extensionGuideMarkdown from '../../../docs/EXTENSION_GUIDE.md?raw';
import featureInventoryMarkdown from '../../../docs/FEATURE_INVENTORY.md?raw';
import formattingMarkdown from '../../../docs/FORMATTING.md?raw';
import gettingStartedMarkdown from '../../../docs/GETTING_STARTED.md?raw';
import docsIndexMarkdown from '../../../docs/index.md?raw';
import mintickMarkdown from '../../../docs/MINTICK.md?raw';
import releasingMarkdown from '../../../docs/RELEASING.md?raw';
import theoryMarkdown from '../../../docs/THEORY.md?raw';
import tickDataMarkdown from '../../../docs/TICK_DATA.md?raw';

export interface DocsPageGroupDefinition {
  id: string;
  title: string;
  description: string;
}

export interface DocsPageDefinition {
  slug: string;
  title: string;
  summary: string;
  groupId: string;
  sourcePath: string;
  markdown: string;
}

export const DOCS_PAGE_GROUPS: DocsPageGroupDefinition[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'First steps for reaching a working chart quickly.',
  },
  {
    id: 'guides',
    title: 'Guides',
    description: 'Task-oriented usage guides for common rendering flows.',
  },
  {
    id: 'data-and-integration',
    title: 'Data & Integration',
    description: 'Input contracts, minute-storage guidance, and feed-preparation notes.',
  },
  {
    id: 'styling-and-presentation',
    title: 'Styling & Presentation',
    description: 'Formatting, visual inventory, and presentation-oriented references.',
  },
  {
    id: 'reference',
    title: 'Reference',
    description: 'Public export listings and compact product reference pages.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Architecture, release workflow, and deeper implementation notes.',
  },
  {
    id: 'miscellaneous',
    title: 'Miscellaneous',
    description: 'Supporting notes that still matter for production usage.',
  },
];

export const DOCS_PAGES: DocsPageDefinition[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    summary: 'Install the package, prepare normalized bars, and render a first footprint chart.',
    groupId: 'getting-started',
    sourcePath: 'docs/GETTING_STARTED.md',
    markdown: gettingStartedMarkdown,
  },
  {
    slug: 'data-requirements',
    title: 'Data Requirements',
    summary: 'Understand what each study needs from your host data pipeline.',
    groupId: 'data-and-integration',
    sourcePath: 'docs/DATA_REQUIREMENTS.md',
    markdown: dataRequirementsMarkdown,
  },
  {
    slug: 'tick-data',
    title: 'Tick-Derived Minute Aggregation',
    summary: 'Store and derive canonical 1-minute artifacts for charts and studies.',
    groupId: 'data-and-integration',
    sourcePath: 'docs/TICK_DATA.md',
    markdown: tickDataMarkdown,
  },
  {
    slug: 'mintick',
    title: 'Mintick',
    summary: 'Control price clustering and keep the ladder aligned to a consistent visual grid.',
    groupId: 'data-and-integration',
    sourcePath: 'docs/MINTICK.md',
    markdown: mintickMarkdown,
  },
  {
    slug: 'candle-heatmap',
    title: 'Candle Heatmap',
    summary: 'Apply metric-driven diverging color scales to standard candlesticks.',
    groupId: 'guides',
    sourcePath: 'docs/CANDLE_HEATMAP.md',
    markdown: candleHeatmapMarkdown,
  },
  {
    slug: 'auto-fit',
    title: 'Auto Fit',
    summary: 'Use TradingView-style vertical autoscaling with explicit chart insets.',
    groupId: 'guides',
    sourcePath: 'docs/AUTO_FIT.md',
    markdown: autoFitMarkdown,
  },
  {
    slug: 'chart-state',
    title: 'Chart State',
    summary: 'Capture and restore viewport state for URLs, reloads, or persistence layers.',
    groupId: 'guides',
    sourcePath: 'docs/CHART_STATE.md',
    markdown: chartStateMarkdown,
  },
  {
    slug: 'extension-guide',
    title: 'Extension Guide',
    summary:
      'Start by composing the public API into reusable host-side helpers before changing internals.',
    groupId: 'guides',
    sourcePath: 'docs/EXTENSION_GUIDE.md',
    markdown: extensionGuideMarkdown,
  },
  {
    slug: 'formatting',
    title: 'Formatting',
    summary: 'Tune ladder text, compact numeric output, imbalance styling, and separators.',
    groupId: 'styling-and-presentation',
    sourcePath: 'docs/FORMATTING.md',
    markdown: formattingMarkdown,
  },
  {
    slug: 'feature-inventory',
    title: 'Feature Inventory',
    summary: 'Review the shipped studies, demo surfaces, and preset inventory at a glance.',
    groupId: 'styling-and-presentation',
    sourcePath: 'docs/FEATURE_INVENTORY.md',
    markdown: featureInventoryMarkdown,
  },
  {
    slug: 'api-reference',
    title: 'API Reference',
    summary: 'Browse the public core and React exports generated from the barrel entry points.',
    groupId: 'reference',
    sourcePath: 'docs/API_REFERENCE.md',
    markdown: apiReferenceMarkdown,
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    summary: 'Understand source-tree responsibilities and extension boundaries.',
    groupId: 'advanced',
    sourcePath: 'docs/ARCHITECTURE.md',
    markdown: architectureMarkdown,
  },
  {
    slug: 'theory',
    title: 'Theory',
    summary: 'Read the higher-level order-flow and rendering notes that guide the package.',
    groupId: 'advanced',
    sourcePath: 'docs/THEORY.md',
    markdown: theoryMarkdown,
  },
  {
    slug: 'releasing',
    title: 'Releasing',
    summary: 'Review GitHub Pages, npm provenance, semver tagging, and release checks.',
    groupId: 'advanced',
    sourcePath: 'docs/RELEASING.md',
    markdown: releasingMarkdown,
  },
  {
    slug: 'connectors',
    title: 'Repo-Side Connectors',
    summary:
      'Understand the local bridge, vendor adapters, and why they stay outside the published dist.',
    groupId: 'advanced',
    sourcePath: 'docs/CONNECTORS.md',
    markdown: connectorsMarkdown,
  },
  {
    slug: 'attribution',
    title: 'Attribution',
    summary: 'Keep the upstream TradingView attribution requirements intact in deployed products.',
    groupId: 'miscellaneous',
    sourcePath: 'docs/ATTRIBUTION.md',
    markdown: attributionMarkdown,
  },
];

export const DOCS_INDEX_MARKDOWN = docsIndexMarkdown;

export function getDocsPage(slug: string): DocsPageDefinition | null {
  return DOCS_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getDocsPagesForGroup(groupId: string): DocsPageDefinition[] {
  return DOCS_PAGES.filter((page) => page.groupId === groupId);
}
