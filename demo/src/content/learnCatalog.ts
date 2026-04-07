import type {
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
  lessonIds: string[];
}

export const THEME_PRESETS: ThemePresetDefinition[] = Object.values(ORDER_FLOW_THEME_PRESETS);

const ORDER_FLOW_DEFAULT_VIEW_STATE: ChartViewStateSnapshot = {
  version: 1,
  timeRange: {
    from: 5.881740674502705,
    to: 17.823465623398526,
  },
  panes: [
    {
      paneIndex: 0,
      priceScaleId: 'right',
      priceRange: {
        from: 400.50911854099513,
        to: 403.72815706271814,
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
    lessonIds: ['inside-the-footprint'],
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
    lessonIds: ['inside-the-footprint'],
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
    lessonIds: ['delta-vs-location', 'cumulative-delta-context'],
  },
  {
    id: 'absorption',
    label: 'Absorption',
    summary: 'Watch heavy volume clusters that fail to move price very far.',
    defaultThemeId: 'depth-heat',
    defaultSymbol: 'TSLA',
    defaultDate: '2026-03-03',
    defaultInterval: '5m',
    defaultMintick: 0.1,
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
    lessonIds: ['absorption'],
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
    lessonIds: ['stacked-imbalances'],
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
    lessonIds: ['volume-profile-shape'],
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
    seriesMode: 'footprint',
    showVisibleProfile: true,
    showSessionProfiles: true,
    showVwap: true,
    showReferenceCandles: true,
    showVolumePane: true,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
    lessonIds: ['sessions-and-vwap'],
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
    lessonIds: ['when-to-use-volume-footprint'],
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
    lessonIds: ['volume-delta-pivot'],
  },
];

export function getThemePreset(themeId: string): ThemePresetDefinition {
  return THEME_PRESETS.find((entry) => entry.id === themeId) ?? THEME_PRESETS[0];
}

export function getConceptPreset(presetId: string): ConceptPresetDefinition {
  return CONCEPT_PRESETS.find((entry) => entry.id === presetId) ?? CONCEPT_PRESETS[0];
}
