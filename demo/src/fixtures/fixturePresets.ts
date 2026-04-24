import type {
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
} from 'lightweight-charts';

import {
  CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
  CORN_REFERENCE_FOOTPRINT_OPTIONS,
  DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  ORDER_FLOW_STYLE_PRESETS,
  SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  SHADED_REFERENCE_FOOTPRINT_OPTIONS,
  SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
  type CandleHeatmapPartialOptions,
  type DeltaSummarySeriesPartialOptions,
  type FootprintCandlePosition,
  type FootprintSeriesPartialOptions,
  type OrderFlowBar,
  type SessionVolumeProfilePartialOptions,
  type VolumeFootprintPartialOptions,
  type VolumeProfilePartialOptions,
} from 'lightweight-orderflow-charts';

import type { OrderFlowChartTheme, SeriesMode } from '../components/OrderFlowChart';
import { classicBars, cornBars, demoBars, shadesBars, volumeFootprintBars } from './orderFlow';

export type FixturePresetId =
  | 'modern-dark'
  | 'fp-candle-001'
  | 'footprint-corn-candles'
  | 'volume-footprint-reference'
  | 'footprint-shades'
  | 'candle-heatmap';

export interface FixturePresetDefinition {
  id: FixturePresetId;
  label: string;
  bars: OrderFlowBar[];
  chartHeight: number;
  seriesMode: SeriesMode;
  theme: OrderFlowChartTheme;
  allowsPatches?: boolean;
  showVisibleProfile: boolean;
  showSessionProfiles: boolean;
  showVwap: boolean;
  showReferenceCandles: boolean;
  showVolumePane: boolean;
  showDeltaSummary: boolean;
  showCandle: boolean;
  showWicks: boolean;
  candlePosition: FootprintCandlePosition;
  footprintOptions?: FootprintSeriesPartialOptions;
  volumeFootprintOptions?: VolumeFootprintPartialOptions;
  volumeProfileOptions?: VolumeProfilePartialOptions;
  sessionVolumeProfileOptions?: SessionVolumeProfilePartialOptions;
  deltaSummaryOptions?: DeltaSummarySeriesPartialOptions;
  candleHeatmapOptions?: CandleHeatmapPartialOptions;
  candleSeriesOptions?: CandlestickSeriesPartialOptions;
  volumeSeriesOptions?: HistogramSeriesPartialOptions;
}

export const MODERN_THEME: OrderFlowChartTheme = {
  backgroundColor: '#020617',
  textColor: '#e2e8f0',
  gridColor: 'rgba(148, 163, 184, 0.12)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  crosshairColor: 'rgba(255, 255, 255, 0.24)',
  panelBackground: 'rgba(15, 23, 42, 0.75)',
  panelBorder: '1px solid rgba(148, 163, 184, 0.12)',
};

export const CLASSIC_THEME: OrderFlowChartTheme = {
  backgroundColor: '#ffffff',
  textColor: '#111827',
  gridColor: 'rgba(15, 23, 42, 0.08)',
  borderColor: 'rgba(15, 23, 42, 0.24)',
  crosshairColor: 'rgba(15, 23, 42, 0.22)',
  panelBackground: '#ffffff',
  panelBorder: '1px solid rgba(15, 23, 42, 0.16)',
};

export const DARK_REFERENCE_THEME: OrderFlowChartTheme = {
  backgroundColor: '#0b1220',
  textColor: '#e5e7eb',
  gridColor: 'rgba(148, 163, 184, 0.08)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  crosshairColor: 'rgba(226, 232, 240, 0.18)',
  panelBackground: '#0b1220',
  panelBorder: '1px solid rgba(148, 163, 184, 0.12)',
};

export const FIXTURE_PRESETS: Record<FixturePresetId, FixturePresetDefinition> = {
  'modern-dark': {
    id: 'modern-dark',
    label: 'Modern Dark',
    bars: demoBars,
    chartHeight: 860,
    seriesMode: 'footprint',
    theme: MODERN_THEME,
    allowsPatches: true,
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
  },
  'fp-candle-001': {
    id: 'fp-candle-001',
    label: 'FP Candle 001',
    bars: classicBars,
    chartHeight: 920,
    seriesMode: 'footprint',
    theme: CLASSIC_THEME,
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
    candleSeriesOptions: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      borderVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
      title: 'Classic Candles',
    },
  },
  'footprint-corn-candles': {
    id: 'footprint-corn-candles',
    label: 'Footprint Corn Candles',
    bars: cornBars,
    chartHeight: 900,
    seriesMode: 'footprint',
    theme: DARK_REFERENCE_THEME,
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: false,
    showVolumePane: false,
    showDeltaSummary: true,
    showCandle: true,
    showWicks: true,
    candlePosition: 'middle',
    footprintOptions: CORN_REFERENCE_FOOTPRINT_OPTIONS,
    deltaSummaryOptions: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  'volume-footprint-reference': {
    id: 'volume-footprint-reference',
    label: 'Volume Footprint',
    bars: volumeFootprintBars,
    chartHeight: 820,
    seriesMode: 'volume-footprint',
    theme: DARK_REFERENCE_THEME,
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
  'footprint-shades': {
    id: 'footprint-shades',
    label: 'Footprint Shades',
    bars: shadesBars,
    chartHeight: 860,
    seriesMode: 'footprint',
    theme: DARK_REFERENCE_THEME,
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
  'candle-heatmap': {
    id: 'candle-heatmap',
    label: 'Candle Heatmap',
    bars: demoBars,
    chartHeight: 820,
    seriesMode: 'candle-heatmap',
    theme: DARK_REFERENCE_THEME,
    showVisibleProfile: false,
    showSessionProfiles: false,
    showVwap: false,
    showReferenceCandles: true,
    showVolumePane: false,
    showDeltaSummary: false,
    showCandle: true,
    showWicks: true,
    candlePosition: 'left',
    footprintOptions: ORDER_FLOW_STYLE_PRESETS.modernDark.footprint,
    candleHeatmapOptions: {
      domain: {
        min: 0,
        minThreshold: 0.1,
        midpoint: 0.5,
        maxThreshold: 0.9,
        max: 1,
      },
      metricStyleKey: 'metric0',
      shadeCount: 10,
      shader: 'alpha',
    },
  },
};
