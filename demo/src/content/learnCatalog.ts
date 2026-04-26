import type {
  CandleHeatmapPartialOptions,
  ChartViewStateSnapshot,
  DeltaSummarySeriesPartialOptions,
  FootprintCandlePosition,
  FootprintSeriesPartialOptions,
  OrderFlowThemePresetPack,
  SessionVolumeProfilePartialOptions,
  VolumeFootprintPartialOptions,
  VolumeProfilePartialOptions,
} from 'lightweight-orderflow-charts';
import {
  CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
  LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  ORDER_FLOW_STYLE_PRESETS,
  ORDER_FLOW_THEME_PRESETS,
  SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  SHADED_REFERENCE_FOOTPRINT_OPTIONS,
  SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
} from 'lightweight-orderflow-charts';

import type { SeriesMode } from '../components/OrderFlowChart';
import type { BarInterval, SymbolCode } from '../lib/marketData';

export type ThemePresetDefinition = OrderFlowThemePresetPack;

export interface ConceptPresetDefinition {
  id: string;
  label: string;
  summary: string;
  defaultThemeId: string;
  defaultSymbol: SymbolCode;
  defaultDate: string;
  defaultInterval: BarInterval;
  defaultMintick?: number | null;
  defaultViewState?: ChartViewStateSnapshot | null;
  seriesMode: SeriesMode;
  showVisibleProfile: boolean;
  showSessionProfiles: boolean;
  showVwap: boolean;
  showReferenceCandles: boolean;
  referencePanePlacement?: 'top' | 'bottom';
  showOrderFlowPane?: boolean;
  showVolumePane: boolean;
  showDeltaSummary: boolean;
  showVolumeDeltaPivot?: boolean;
  showCandle: boolean;
  showWicks: boolean;
  candlePosition: FootprintCandlePosition;
  footprintOptions?: FootprintSeriesPartialOptions;
  volumeFootprintOptions?: VolumeFootprintPartialOptions;
  volumeProfileOptions?: VolumeProfilePartialOptions;
  sessionVolumeProfileOptions?: SessionVolumeProfilePartialOptions;
  deltaSummaryOptions?: DeltaSummarySeriesPartialOptions;
  candleHeatmapOptions?: CandleHeatmapPartialOptions;
}

export const THEME_PRESETS: ThemePresetDefinition[] = Object.values(ORDER_FLOW_THEME_PRESETS);

const ORDER_FLOW_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 6.555367871144069,
    to: 17.580576133411803,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 400.5289068252881,
        to: 403.52961012639156,
      },
    },
  ],
};

const LADDER_FUNDAMENTALS_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 6.769972763910813,
    to: 18.27318988636536,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 400.8560042868159,
        to: 402.981758960649,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 0,
        to: 6,
      },
    },
  ],
};

const DELTA_FIRST_READ_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 6.996424184715682,
    to: 20.41100230040486,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 179.6944813754079,
        to: 181.1680094516906,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 0,
        to: 6,
      },
    },
  ],
};

const ABSORPTION_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 8.14859578729117,
    to: 20.10644594478292,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 385.3269274207384,
        to: 387.80587874264944,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 0,
        to: 3,
      },
    },
  ],
};

const STACKED_IMBALANCES_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: -1.3390310137809784,
    to: 9.43367756267952,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 180.0476364218891,
        to: 181.9122956928875,
      },
    },
  ],
};

const VOLUME_PROFILE_SHAPE_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 32.94747770561294,
    to: 47.01974483632998,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 180.3324867298039,
        to: 181.7553945179693,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 0,
        to: 3,
      },
    },
  ],
};

const SESSION_MAP_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 5.6236817466998374,
    to: 15.169124959463417,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 382.535136327078,
        to: 384.8847153377899,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 380.67374409009034,
        to: 384.84906845603956,
      },
    },
  ],
};

const VOLUME_FOOTPRINT_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: -0.361550786932888,
    to: 9.105337237445028,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 182.0511887450038,
        to: 183.45814639348762,
      },
    },
  ],
};

const CANDLE_HEATMAP_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: -13.957037647100066,
    to: 65.52646001804331,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 394.2,
        to: 402.3,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: 0,
        to: 1325645.02,
      },
    },
  ],
};

const VOLUME_DELTA_PIVOT_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: -7.1186605408371975,
    to: 58.72388561961506,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 386.52474775593475,
        to: 402.33329046950263,
      },
    },
    {
      paneIndex: 1,
      priceScaleId: 'right',
      priceRange: {
        from: -228122.36280000003,
        to: 228122.36280000003,
      },
    },
  ],
};

export const CONCEPT_PRESETS: ConceptPresetDefinition[] = [
  {
    id: 'order-flow',
    label: 'Order Flow',
    summary:
      'Classic letter-delimited bid/ask ladder with delta-colored rows, POC boxes, and thin candle strips.',
    defaultThemeId: 'smooth-light',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-10',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: ORDER_FLOW_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: false,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.orderFlowReference.footprint,
  },
  {
    id: 'ladder-fundamentals',
    label: 'Ladder Fundamentals',
    summary: 'Read the bid/ask ladder and OHLC lane with minimal distraction.',
    defaultThemeId: 'paper-classic',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-10',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: LADDER_FUNDAMENTALS_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: true,
    showCandle: true,
    showWicks: false,
    candlePosition: 'middle',
    footprintOptions: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
    deltaSummaryOptions: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  {
    id: 'delta-first-read',
    label: 'Delta-First Read',
    summary: 'Pair the ladder with a delta pane to separate aggression from location.',
    defaultThemeId: 'chart-dark-pro',
    defaultSymbol: 'NVDA',
    defaultDate: '2026-03-02',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: DELTA_FIRST_READ_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: true,
    showCandle: true,
    showWicks: false,
    candlePosition: 'middle',
    footprintOptions: SHADED_REFERENCE_FOOTPRINT_OPTIONS,
    deltaSummaryOptions: SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  {
    id: 'absorption',
    label: 'Absorption',
    summary: 'Watch heavy volume clusters that fail to move price very far.',
    defaultThemeId: 'chart-dark-pro',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-03',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: ABSORPTION_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: true,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: true,
    showCandle: true,
    showWicks: false,
    candlePosition: 'middle',
    footprintOptions: SHADED_REFERENCE_FOOTPRINT_OPTIONS,
    volumeProfileOptions: SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
    deltaSummaryOptions: SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  {
    id: 'stacked-imbalances',
    label: 'Stacked Imbalances',
    summary: 'Highlight consecutive imbalances as structure inside the ladder.',
    defaultThemeId: 'midnight-terminal',
    defaultSymbol: 'NVDA',
    defaultDate: '2026-03-04',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: STACKED_IMBALANCES_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
  },
  {
    id: 'volume-profile-shape',
    label: 'Volume Profile Shape',
    summary: 'Use POC and visible-range shape to judge acceptance and rejection.',
    defaultThemeId: 'obsidian-minimal',
    defaultSymbol: 'NVDA',
    defaultDate: '2026-03-06',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: VOLUME_PROFILE_SHAPE_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: true,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: true,
    showCandle: true,
    showWicks: false,
    candlePosition: 'middle',
    footprintOptions: SHADED_REFERENCE_FOOTPRINT_OPTIONS,
    volumeProfileOptions: SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
    deltaSummaryOptions: SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  {
    id: 'session-map',
    label: 'Session Map',
    summary: 'Read session context with VWAP, candles, and supporting panes.',
    defaultThemeId: 'chart-dark-pro',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-09',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: SESSION_MAP_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: true,
    showSessionProfiles: true,
    showVwap: true,
    showReferenceCandles: true,
    referencePanePlacement: 'bottom',
    showVolumePane: false,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
  },
  {
    id: 'volume-footprint',
    label: 'Volume Footprint',
    summary: 'Switch from bid/ask split to total volume at price when shape matters most.',
    defaultThemeId: 'depth-heat',
    defaultSymbol: 'NVDA',
    defaultDate: '2026-03-10',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: VOLUME_FOOTPRINT_DEFAULT_VIEW_STATE,
    seriesMode: 'volume-footprint',
    showVisibleProfile: true,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: false,
    showCandle: false,
    showWicks: false,
    candlePosition: 'left',
    volumeFootprintOptions: VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
    volumeProfileOptions: LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  },
  {
    id: 'candle-heatmap',
    label: 'Candle Heatmap',
    summary:
      'Map a per-bar score onto standard candles with a diverging blue/red heat scale while keeping price geometry intact.',
    defaultThemeId: 'depth-heat',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-06',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: CANDLE_HEATMAP_DEFAULT_VIEW_STATE,
    seriesMode: 'candle-heatmap',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: true,
    showOrderFlowPane: false,
    showVolumePane: true,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
    candleHeatmapOptions: {
      range: {
        min: 0,
        minShadeThreshold: 0.1,
        threshold: 0.5,
        maxShadeThreshold: 0.9,
        max: 1,
      },
      downColor: '#f23645',
      upColor: '#089981',
      wickDownColor: '#c9cdd4',
      wickUpColor: '#c9cdd4',
      borderDownColor: '#f23645',
      borderUpColor: '#089981',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 10,
      shader: 'alpha',
    },
  },
  {
    id: 'volume-delta-pivot',
    label: 'Volume Delta Pivot',
    summary: 'Zero-anchored delta candles reveal intrabar pressure swings around the baseline.',
    defaultThemeId: 'chart-dark-pro',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-02',
    defaultInterval: '5m',
    defaultMintick: 0.1,
    defaultViewState: VOLUME_DELTA_PIVOT_DEFAULT_VIEW_STATE,
    seriesMode: 'footprint',
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: true,
    showVolumePane: false,
    showDeltaSummary: false,
    showVolumeDeltaPivot: true,
    showOrderFlowPane: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
  },
];

export function getThemePreset(themeId: string): ThemePresetDefinition {
  return THEME_PRESETS.find((entry) => entry.id === themeId) ?? THEME_PRESETS[0];
}

export function getConceptPreset(presetId: string): ConceptPresetDefinition {
  return CONCEPT_PRESETS.find((entry) => entry.id === presetId) ?? CONCEPT_PRESETS[0];
}
