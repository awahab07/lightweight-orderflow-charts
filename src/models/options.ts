import {
  customSeriesDefaultOptions,
  type CustomSeriesOptions,
  type LineWidth,
} from 'lightweight-charts';

import { createAlphaColorScale } from '../utils/color';
import type { NumericRoundingMode } from '../utils/numberFormat';
import type { SessionDefinition, TimeValue } from './contracts';
import type { DeltaSummaryColumnModel, FootprintBarModel } from './studies';

export type FootprintTextMode = 'bid-ask' | 'total' | 'delta' | 'none';
export type FootprintCandlePosition = 'left' | 'middle' | 'right';
/**
 * Width values accept either device pixels or a percentage of the current bar spacing.
 */
export type ResponsiveWidthValue = number | `${number}%`;
export type HorizontalAlignment = 'left' | 'right';
export type ProfileScope =
  | { kind: 'visible-range' }
  | { kind: 'session'; sessionIds?: string[] }
  | { kind: 'fixed-range'; from: TimeValue; to: TimeValue };
export type VwapResetMode = 'session' | 'continuous';
export type DeltaSummaryColumnKey = Exclude<keyof DeltaSummaryColumnModel, 'time'>;
export type DeltaSummaryMetric = DeltaSummaryColumnKey;
export type FootprintMetricPlacement = 'top' | 'bottom';
export type FootprintMetricAlignment = 'left' | 'center' | 'right';
export type FootprintBidAskShadingMetric = 'volume/max' | 'volume/average';
export type FootprintBidAskFillMode = 'by-side' | 'by-delta';
export type FootprintBidAskSeparatorMode = 'line' | 'letter' | 'none';
export type FootprintSingleCellShadingMetric =
  | 'volume/max'
  | 'volume/average'
  | 'absolute-delta/max-abs';
export type FootprintMetricValueKey = keyof Pick<
  FootprintBarModel,
  | 'open'
  | 'high'
  | 'low'
  | 'close'
  | 'delta'
  | 'totalVolume'
  | 'maxLevelVolume'
  | 'maxAbsDelta'
  | 'averageLevelVolume'
>;
export type MetricStyleKey =
  | 'metric0'
  | 'metric1'
  | 'metric2'
  | 'metric3'
  | 'metric4'
  | 'metric5'
  | 'metric6'
  | 'metric7'
  | 'metric8'
  | 'metric9';
export type MetricStyleVariant = 'primary' | 'secondary';
export type MetricStyleVariantMode = MetricStyleVariant | 'auto';

export interface MetricStyleToken {
  color: string;
  font: string;
  border?: string;
  backgroundColor?: string;
  paddingX?: number;
  paddingY?: number;
}

export interface MetricStylePaletteEntry {
  primary: MetricStyleToken;
  secondary?: Partial<MetricStyleToken>;
}

export type MetricStylePalette = Partial<Record<MetricStyleKey, MetricStylePaletteEntry>>;

/**
 * Width constraints used by footprint bars and delta-summary columns.
 */
export interface WidthRangeOptions {
  min: ResponsiveWidthValue;
  max: ResponsiveWidthValue;
}

export interface ColorScaleStop {
  /**
   * Stop offsets are normalized between 0 and 1.
   */
  offset: number;
  color: string;
}

export interface ColorScaleRangeOptions {
  /**
   * Raw metric value that maps to stop offset `0`.
   */
  from: number;
  /**
   * Raw metric value that maps to stop offset `1`.
   */
  to: number;
  clamp: boolean;
  invert: boolean;
}

export interface ColorScaleOptions {
  range: ColorScaleRangeOptions;
  stops: ColorScaleStop[];
}

export type ColorScalePartialOptions = Omit<Partial<ColorScaleOptions>, 'range' | 'stops'> & {
  range?: Partial<ColorScaleRangeOptions>;
  stops?: ColorScaleStop[];
};

/**
 * Diverging range used by the candle heatmap helper.
 *
 * The range is split around `threshold`. Values near `min` resolve toward `minColor`, while values
 * near `max` resolve toward `maxColor`.
 */
export interface CandleHeatmapRangeOptions {
  min: number;
  minShadeThreshold?: number;
  threshold: number;
  maxShadeThreshold?: number;
  max: number;
}

export type CandleHeatmapShader = 'alpha' | 'hue';

/**
 * Configures metric-driven candle coloring for a standard candlestick series.
 *
 * `noOfShades: 1` collapses the mapping to two solid colors split by `threshold`.
 * `noOfShades: 0` uses a continuous mapping with 256 internal steps.
 */
export interface CandleHeatmapOptions {
  range: CandleHeatmapRangeOptions;
  minColor: string;
  maxColor: string;
  noOfShades: number;
  shader: CandleHeatmapShader;
}

export type CandleHeatmapPartialOptions = Omit<Partial<CandleHeatmapOptions>, 'range'> & {
  range?: Partial<CandleHeatmapRangeOptions>;
};

export interface FootprintStyleOptions {
  fontFamily: string;
  fontSize: number;
  priceDecimalDigits: number;
  priceRounding: NumericRoundingMode;
  valueIntegerDigits: number;
  valueDecimalDigits: number;
  valueRounding: NumericRoundingMode;
  valueUnitVisible: boolean;
  textColor: string;
  bidTextColor: string;
  askTextColor: string;
  neutralTextColor: string;
  positiveDeltaColor: string;
  negativeDeltaColor: string;
  bullishCandleColor: string;
  bearishCandleColor: string;
  candleWickColor: string;
  candleBorderColor: string;
  separatorColor: string;
  separatorFont: string;
  bidFillColor: string;
  askFillColor: string;
  buyImbalanceColor: string;
  sellImbalanceColor: string;
  metricStyles: MetricStylePalette;
  imbalanceMetricStyleKey: MetricStyleKey | null;
  positiveImbalanceTextColor: string;
  positiveImbalanceTextFont: string;
  negativeImbalanceTextColor: string;
  negativeImbalanceTextFont: string;
  diagonalDominanceColor: string;
  diagonalDominanceFont: string;
  buyImbalanceFillColor: string;
  sellImbalanceFillColor: string;
  stackedBuyImbalanceFillColor: string;
  stackedSellImbalanceFillColor: string;
  stackedImbalanceOutline: string;
  ladderBorderColor: string;
  cellBorderColor: string;
  profileBidColor: string;
  profileAskColor: string;
  valueAreaColor: string;
  sessionLabelColor: string;
}

export interface FootprintLadderOptions {
  textMode: FootprintTextMode;
  rowHeight: number;
  /**
   * Explicit price step used to place ladder rows. Set this to the instrument tick size when the
   * provided levels are sparse or aggregated.
   */
  priceStep: number;
  showHeatmap: boolean;
  bidAskFillMode: FootprintBidAskFillMode;
  imbalanceRatio: number;
  stackedImbalanceLength: number;
  highlightImbalances: boolean;
  highlightStackedImbalances: boolean;
  highlightImbalanceText: boolean;
  highlightDiagonalDominance: boolean;
  diagonalDominanceFactor: number;
  separatorMode: FootprintBidAskSeparatorMode;
  separatorLabel: string;
  separatorGap: number;
  cellPadding: number;
  borderWidth: number;
  cellBorderWidth: number;
  stackedImbalanceBorderWidth: number;
  minOpacity: number;
  maxOpacity: number;
}

export interface FootprintCandleOptions {
  visible: boolean;
  position: FootprintCandlePosition;
  widthRatio: number;
  minWidth: number;
  maxWidth: number;
  gap: number;
  showWicks: boolean;
}

export interface FootprintLayoutOptions {
  barWidth: WidthRangeOptions;
}

export interface FootprintMetricStyleOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontShorthand?: string;
  textColor: string;
  positiveTextColor: string;
  negativeTextColor: string;
  neutralTextColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderShorthand?: string;
  paddingX: number;
  paddingY: number;
}

export interface FootprintMetricRenderContext {
  bar: FootprintBarModel;
  item: FootprintMetricItemOptions;
  placement: FootprintMetricPlacement;
  rawValue: number | null;
}

export type FootprintMetricStyleResolverResult = Partial<FootprintMetricStyleOptions> & {
  visible?: boolean;
};

export interface FootprintMetricItemOptions {
  id: string;
  visible: boolean;
  placement: FootprintMetricPlacement;
  metricStyleKey?: MetricStyleKey | null;
  metricStyleVariant?: MetricStyleVariantMode;
  valueKey?: FootprintMetricValueKey;
  label?: string;
  formatter?: (context: FootprintMetricRenderContext) => string | number | null;
  styleResolver?: (
    context: FootprintMetricRenderContext,
  ) => FootprintMetricStyleResolverResult | null;
  offset: number;
  align: FootprintMetricAlignment;
  minSpacing: number;
  style: FootprintMetricStyleOptions;
}

export type FootprintMetricItemPartialOptions = Omit<
  Partial<FootprintMetricItemOptions>,
  'id' | 'style'
> & {
  id: string;
  style?: Partial<FootprintMetricStyleOptions>;
};

export interface FootprintSummaryOptions {
  stackGap: number;
  items: FootprintMetricItemOptions[];
}

export type FootprintSummaryPartialOptions = Omit<Partial<FootprintSummaryOptions>, 'items'> & {
  items?: FootprintMetricItemPartialOptions[];
};

export interface FootprintPointOfControlOptions {
  visible: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface FootprintShadingOptions {
  bidAskMetric: FootprintBidAskShadingMetric;
  singleCellMetric: FootprintSingleCellShadingMetric;
  bidScale: ColorScaleOptions;
  askScale: ColorScaleOptions;
  positiveDeltaScale: ColorScaleOptions;
  negativeDeltaScale: ColorScaleOptions;
  neutralScale: ColorScaleOptions;
}

export type FootprintShadingPartialOptions = Omit<
  Partial<FootprintShadingOptions>,
  'bidScale' | 'askScale' | 'positiveDeltaScale' | 'negativeDeltaScale' | 'neutralScale'
> & {
  bidScale?: ColorScalePartialOptions;
  askScale?: ColorScalePartialOptions;
  positiveDeltaScale?: ColorScalePartialOptions;
  negativeDeltaScale?: ColorScalePartialOptions;
  neutralScale?: ColorScalePartialOptions;
};

export interface FootprintSeriesOptions extends CustomSeriesOptions {
  layout: FootprintLayoutOptions;
  candle: FootprintCandleOptions;
  ladder: FootprintLadderOptions;
  shading: FootprintShadingOptions;
  pointOfControl: FootprintPointOfControlOptions;
  summary: FootprintSummaryOptions;
  style: FootprintStyleOptions;
}

export type FootprintSeriesPartialOptions = Omit<
  Partial<FootprintSeriesOptions>,
  'layout' | 'candle' | 'ladder' | 'shading' | 'pointOfControl' | 'summary' | 'style'
> & {
  layout?: Partial<FootprintLayoutOptions>;
  candle?: Partial<FootprintCandleOptions>;
  ladder?: Partial<FootprintLadderOptions>;
  shading?: FootprintShadingPartialOptions;
  pointOfControl?: Partial<FootprintPointOfControlOptions>;
  summary?: FootprintSummaryPartialOptions;
  style?: Partial<FootprintStyleOptions>;
};

export interface PointOfControlOptions {
  backgroundColor: string;
  borderColor: string;
  lineWidth: number;
}

export interface VolumeProfileStyleOptions {
  profileBidColor: string;
  profileAskColor: string;
  valueAreaColor: string;
  sessionLabelColor: string;
}

export interface VolumeProfileOptions {
  widthRatio: number;
  align: HorizontalAlignment;
  scope: ProfileScope;
  valueAreaPercent: number;
  showPointOfControl: boolean;
  showValueArea: boolean;
  opacity: number;
  pointOfControl: PointOfControlOptions;
  style: VolumeProfileStyleOptions;
}

export interface SessionVolumeProfileOptions extends VolumeProfileOptions {
  sessions?: SessionDefinition[];
  showSessionLabels: boolean;
}

export interface VolumeFootprintOptions extends FootprintSeriesOptions {}
export type VolumeFootprintPartialOptions = FootprintSeriesPartialOptions;

export type VolumeProfilePartialOptions = Omit<
  Partial<VolumeProfileOptions>,
  'pointOfControl' | 'style'
> & {
  pointOfControl?: Partial<PointOfControlOptions>;
  style?: Partial<VolumeProfileStyleOptions>;
};

export type SessionVolumeProfilePartialOptions = Omit<
  Partial<SessionVolumeProfileOptions>,
  'pointOfControl' | 'style'
> & {
  pointOfControl?: Partial<PointOfControlOptions>;
  style?: Partial<VolumeProfileStyleOptions>;
};

export interface DeltaSummaryRowStyleOptions {
  positiveFillColor: string;
  negativeFillColor: string;
  neutralFillColor: string;
  positiveFillScale: ColorScaleOptions;
  negativeFillScale: ColorScaleOptions;
  neutralFillScale: ColorScaleOptions;
  textColor: string;
}

export type DeltaSummaryRowStylePartialOptions = Omit<
  Partial<DeltaSummaryRowStyleOptions>,
  'positiveFillScale' | 'negativeFillScale' | 'neutralFillScale'
> & {
  positiveFillScale?: ColorScalePartialOptions;
  negativeFillScale?: ColorScalePartialOptions;
  neutralFillScale?: ColorScalePartialOptions;
};

export interface DeltaSummarySeriesOptions extends CustomSeriesOptions {
  /**
   * The rendered summary rows, selected by `DeltaSummaryColumnModel` keys.
   */
  rows: DeltaSummaryColumnKey[];
  rowLabels: Partial<Record<DeltaSummaryColumnKey, string>>;
  rowHeight: number;
  columnWidth: WidthRangeOptions;
  labelWidth: number;
  showLabels: boolean;
  fontFamily: string;
  fontSize: number;
  labelBackgroundColor: string;
  labelTextColor: string;
  cellBorderColor: string;
  cellBorderWidth: number;
  minOpacity: number;
  maxOpacity: number;
  rowStyles: Record<DeltaSummaryColumnKey, DeltaSummaryRowStyleOptions>;
}

export type DeltaSummarySeriesPartialOptions = Omit<
  Partial<DeltaSummarySeriesOptions>,
  'columnWidth' | 'rowLabels' | 'rowStyles'
> & {
  columnWidth?: Partial<WidthRangeOptions>;
  rowLabels?: Partial<Record<DeltaSummaryColumnKey, string>>;
  rowStyles?: Partial<Record<DeltaSummaryColumnKey, DeltaSummaryRowStylePartialOptions>>;
};

export interface VwapOptions {
  color: string;
  lineWidth: LineWidth;
  resetMode: VwapResetMode;
  sessions?: SessionDefinition[];
}

function mergeColorScaleOptions(
  defaults: ColorScaleOptions,
  options?: ColorScalePartialOptions,
): ColorScaleOptions {
  return {
    ...defaults,
    ...options,
    range: {
      ...defaults.range,
      ...options?.range,
    },
    stops: options?.stops ?? defaults.stops,
  };
}

function createDefaultMetricStyle(style: FootprintStyleOptions): FootprintMetricStyleOptions {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: '600',
    fontShorthand: undefined,
    textColor: style.textColor,
    positiveTextColor: style.positiveDeltaColor,
    negativeTextColor: style.negativeDeltaColor,
    neutralTextColor: style.neutralTextColor,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    borderShorthand: undefined,
    paddingX: 0,
    paddingY: 0,
  };
}

function createGenericMetricItem(
  style: FootprintStyleOptions,
  id: string,
): FootprintMetricItemOptions {
  return {
    id,
    visible: true,
    placement: 'bottom',
    metricStyleVariant: 'auto',
    offset: 2,
    align: 'center',
    minSpacing: 0,
    style: createDefaultMetricStyle(style),
  };
}

export function createFootprintMetricPresets(
  style: FootprintStyleOptions = DEFAULT_FOOTPRINT_STYLE,
): Record<'delta' | 'volume', FootprintMetricItemOptions> {
  const delta = createGenericMetricItem(style, 'delta');
  const volume = createGenericMetricItem(style, 'volume');

  return {
    delta: {
      ...delta,
      metricStyleKey: 'metric1',
      valueKey: 'delta',
      label: 'D',
    },
    volume: {
      ...volume,
      valueKey: 'totalVolume',
      label: 'V',
      style: {
        ...volume.style,
        textColor: style.textColor,
        positiveTextColor: style.textColor,
        negativeTextColor: style.textColor,
        neutralTextColor: style.textColor,
      },
    },
  };
}

function createDefaultFootprintSummaryOptions(
  style: FootprintStyleOptions,
): FootprintSummaryOptions {
  const metricPresets = createFootprintMetricPresets(style);

  return {
    stackGap: 2,
    items: [metricPresets.delta, metricPresets.volume],
  };
}

function createDefaultFootprintShadingOptions(
  style: FootprintStyleOptions,
  ladder: FootprintLadderOptions,
): FootprintShadingOptions {
  return {
    bidAskMetric: 'volume/max',
    singleCellMetric: 'volume/max',
    bidScale: createAlphaColorScale(style.bidFillColor, ladder.minOpacity, ladder.maxOpacity),
    askScale: createAlphaColorScale(style.askFillColor, ladder.minOpacity, ladder.maxOpacity),
    positiveDeltaScale: createAlphaColorScale(
      style.positiveDeltaColor,
      ladder.minOpacity,
      ladder.maxOpacity,
    ),
    negativeDeltaScale: createAlphaColorScale(
      style.negativeDeltaColor,
      ladder.minOpacity,
      ladder.maxOpacity,
    ),
    neutralScale: createAlphaColorScale(style.askFillColor, ladder.minOpacity, ladder.maxOpacity),
  };
}

function mergeFootprintMetricItem(
  style: FootprintStyleOptions,
  item: FootprintMetricItemPartialOptions,
): FootprintMetricItemOptions {
  const presets = createFootprintMetricPresets(style);
  const defaultItem =
    presets[item.id as keyof typeof presets] ?? createGenericMetricItem(style, item.id);

  return {
    ...defaultItem,
    ...item,
    style: {
      ...defaultItem.style,
      ...item.style,
    },
  };
}

function createDeltaSummaryRowStyle(
  positiveFillColor: string,
  negativeFillColor: string,
  neutralFillColor: string,
  textColor: string,
  minOpacity: number,
  maxOpacity: number,
): DeltaSummaryRowStyleOptions {
  return {
    positiveFillColor,
    negativeFillColor,
    neutralFillColor,
    positiveFillScale: createAlphaColorScale(positiveFillColor, minOpacity, maxOpacity),
    negativeFillScale: createAlphaColorScale(negativeFillColor, minOpacity, maxOpacity),
    neutralFillScale: createAlphaColorScale(neutralFillColor, minOpacity, maxOpacity),
    textColor,
  };
}

function createDefaultDeltaSummaryRowStyles(
  minOpacity: number,
  maxOpacity: number,
): Record<DeltaSummaryColumnKey, DeltaSummaryRowStyleOptions> {
  return {
    delta: createDeltaSummaryRowStyle(
      'rgba(34, 197, 94, 0.42)',
      'rgba(239, 68, 68, 0.42)',
      'rgba(148, 163, 184, 0.24)',
      '#0f172a',
      minOpacity,
      maxOpacity,
    ),
    maxDelta: createDeltaSummaryRowStyle(
      'rgba(134, 239, 172, 0.6)',
      'rgba(254, 202, 202, 0.6)',
      'rgba(226, 232, 240, 0.5)',
      '#0f172a',
      minOpacity,
      maxOpacity,
    ),
    minDelta: createDeltaSummaryRowStyle(
      'rgba(134, 239, 172, 0.6)',
      'rgba(254, 202, 202, 0.6)',
      'rgba(226, 232, 240, 0.5)',
      '#0f172a',
      minOpacity,
      maxOpacity,
    ),
    cumulativeDelta: createDeltaSummaryRowStyle(
      'rgba(74, 222, 128, 0.55)',
      'rgba(248, 113, 113, 0.55)',
      'rgba(148, 163, 184, 0.24)',
      '#0f172a',
      minOpacity,
      maxOpacity,
    ),
    cumulativeDeltaToVolumeRatio: createDeltaSummaryRowStyle(
      'rgba(187, 247, 208, 0.72)',
      'rgba(254, 202, 202, 0.72)',
      'rgba(226, 232, 240, 0.5)',
      '#0f172a',
      minOpacity,
      maxOpacity,
    ),
    volume: createDeltaSummaryRowStyle(
      'rgba(59, 130, 246, 0.75)',
      'rgba(59, 130, 246, 0.75)',
      'rgba(59, 130, 246, 0.75)',
      '#eff6ff',
      minOpacity,
      maxOpacity,
    ),
  };
}

export const DEFAULT_FOOTPRINT_STYLE: FootprintStyleOptions = {
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 11,
  priceDecimalDigits: 2,
  priceRounding: 'ceil',
  valueIntegerDigits: 2,
  valueDecimalDigits: 1,
  valueRounding: 'ceil',
  valueUnitVisible: true,
  textColor: '#e2e8f0',
  bidTextColor: '#fda4af',
  askTextColor: '#93c5fd',
  neutralTextColor: '#cbd5e1',
  positiveDeltaColor: '#22c55e',
  negativeDeltaColor: '#ef4444',
  bullishCandleColor: '#22c55e',
  bearishCandleColor: '#ef4444',
  candleWickColor: '#e2e8f0',
  candleBorderColor: '#0f172a',
  separatorColor: '#94a3b8',
  separatorFont: '400 10px Inter, Arial, sans-serif',
  bidFillColor: 'rgba(239, 68, 68, 0.28)',
  askFillColor: 'rgba(59, 130, 246, 0.28)',
  buyImbalanceColor: '#38bdf8',
  sellImbalanceColor: '#fb7185',
  metricStyles: {
    metric0: {
      primary: {
        color: '#2563eb',
        font: '700 11px Inter, Arial, sans-serif',
      },
      secondary: {
        color: '#dc2626',
      },
    },
    metric1: {
      primary: {
        color: '#22c55e',
        font: '700 11px Inter, Arial, sans-serif',
      },
      secondary: {
        color: '#ef4444',
      },
    },
  },
  imbalanceMetricStyleKey: 'metric0',
  positiveImbalanceTextColor: '#2563eb',
  positiveImbalanceTextFont: '700 11px Inter, Arial, sans-serif',
  negativeImbalanceTextColor: '#dc2626',
  negativeImbalanceTextFont: '700 11px Inter, Arial, sans-serif',
  diagonalDominanceColor: '#2563eb',
  diagonalDominanceFont: '700 11px Inter, Arial, sans-serif',
  buyImbalanceFillColor: 'rgba(56, 189, 248, 0.18)',
  sellImbalanceFillColor: 'rgba(251, 113, 133, 0.18)',
  stackedBuyImbalanceFillColor: 'rgba(56, 189, 248, 0.26)',
  stackedSellImbalanceFillColor: 'rgba(251, 113, 133, 0.26)',
  stackedImbalanceOutline: '#fde047',
  ladderBorderColor: '#1e293b',
  cellBorderColor: 'rgba(15, 23, 42, 0.24)',
  profileBidColor: 'rgba(248, 113, 113, 0.45)',
  profileAskColor: 'rgba(96, 165, 250, 0.45)',
  valueAreaColor: 'rgba(148, 163, 184, 0.18)',
  sessionLabelColor: '#f8fafc',
};

export const DEFAULT_FOOTPRINT_LAYOUT_OPTIONS: FootprintLayoutOptions = {
  barWidth: {
    min: 4,
    max: '88%',
  },
};

export const DEFAULT_FOOTPRINT_CANDLE_OPTIONS: FootprintCandleOptions = {
  visible: true,
  position: 'left',
  widthRatio: 0.24,
  minWidth: 2,
  maxWidth: 16,
  gap: 1,
  showWicks: true,
};

export const DEFAULT_FOOTPRINT_LADDER_OPTIONS: FootprintLadderOptions = {
  textMode: 'bid-ask',
  rowHeight: 16,
  priceStep: 0,
  showHeatmap: true,
  bidAskFillMode: 'by-side',
  imbalanceRatio: 3,
  stackedImbalanceLength: 3,
  highlightImbalances: true,
  highlightStackedImbalances: true,
  highlightImbalanceText: false,
  highlightDiagonalDominance: true,
  diagonalDominanceFactor: 3,
  separatorMode: 'line',
  separatorLabel: 'x',
  separatorGap: 0,
  cellPadding: 2,
  borderWidth: 1,
  cellBorderWidth: 1,
  stackedImbalanceBorderWidth: 1,
  minOpacity: 0.1,
  maxOpacity: 0.92,
};

export const DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS: FootprintPointOfControlOptions = {
  visible: true,
  backgroundColor: 'rgba(226, 232, 240, 0.06)',
  borderColor: 'rgba(226, 232, 240, 0.65)',
  borderWidth: 1,
};

export const DEFAULT_FOOTPRINT_METRIC_PRESETS = createFootprintMetricPresets();
export const DEFAULT_FOOTPRINT_SUMMARY_OPTIONS =
  createDefaultFootprintSummaryOptions(DEFAULT_FOOTPRINT_STYLE);
export const DEFAULT_FOOTPRINT_SHADING_OPTIONS = createDefaultFootprintShadingOptions(
  DEFAULT_FOOTPRINT_STYLE,
  DEFAULT_FOOTPRINT_LADDER_OPTIONS,
);

export const DEFAULT_FOOTPRINT_SERIES_OPTIONS: FootprintSeriesOptions = {
  ...customSeriesDefaultOptions,
  color: '#38bdf8',
  priceLineVisible: false,
  lastValueVisible: false,
  title: 'Footprint',
  layout: DEFAULT_FOOTPRINT_LAYOUT_OPTIONS,
  candle: DEFAULT_FOOTPRINT_CANDLE_OPTIONS,
  ladder: DEFAULT_FOOTPRINT_LADDER_OPTIONS,
  shading: DEFAULT_FOOTPRINT_SHADING_OPTIONS,
  pointOfControl: DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS,
  summary: DEFAULT_FOOTPRINT_SUMMARY_OPTIONS,
  style: DEFAULT_FOOTPRINT_STYLE,
};

export const DEFAULT_VOLUME_PROFILE_OPTIONS: VolumeProfileOptions = {
  widthRatio: 0.2,
  align: 'right',
  scope: { kind: 'visible-range' },
  valueAreaPercent: 0.7,
  showPointOfControl: true,
  showValueArea: true,
  opacity: 0.8,
  pointOfControl: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316',
    lineWidth: 1.5,
  },
  style: {
    profileBidColor: DEFAULT_FOOTPRINT_STYLE.profileBidColor,
    profileAskColor: DEFAULT_FOOTPRINT_STYLE.profileAskColor,
    valueAreaColor: DEFAULT_FOOTPRINT_STYLE.valueAreaColor,
    sessionLabelColor: DEFAULT_FOOTPRINT_STYLE.sessionLabelColor,
  },
};

export const DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS: SessionVolumeProfileOptions = {
  ...DEFAULT_VOLUME_PROFILE_OPTIONS,
  scope: { kind: 'session' },
  showSessionLabels: true,
};

export const DEFAULT_VOLUME_FOOTPRINT_OPTIONS: VolumeFootprintOptions = {
  ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
  title: 'Volume Footprint',
  ladder: {
    ...DEFAULT_FOOTPRINT_SERIES_OPTIONS.ladder,
    textMode: 'total',
  },
};

export const DEFAULT_DELTA_SUMMARY_ROW_STYLES = createDefaultDeltaSummaryRowStyles(0.28, 0.9);

export const DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS: DeltaSummarySeriesOptions = {
  ...customSeriesDefaultOptions,
  color: '#64748b',
  priceLineVisible: false,
  lastValueVisible: false,
  title: 'Delta Summary',
  rows: [
    'delta',
    'maxDelta',
    'minDelta',
    'cumulativeDelta',
    'cumulativeDeltaToVolumeRatio',
    'volume',
  ],
  rowLabels: {
    delta: 'Delta',
    maxDelta: 'Max. Delta',
    minDelta: 'Min. Delta',
    cumulativeDelta: 'Cum. Delta',
    cumulativeDeltaToVolumeRatio: 'Cum. Delta / Vol',
    volume: 'Volume',
  },
  rowHeight: 22,
  columnWidth: {
    min: 8,
    max: '88%',
  },
  labelWidth: 120,
  showLabels: true,
  fontFamily: DEFAULT_FOOTPRINT_STYLE.fontFamily,
  fontSize: 11,
  labelBackgroundColor: 'rgba(148, 163, 184, 0.18)',
  labelTextColor: '#e2e8f0',
  cellBorderColor: 'rgba(15, 23, 42, 0.24)',
  cellBorderWidth: 1,
  minOpacity: 0.28,
  maxOpacity: 0.9,
  rowStyles: DEFAULT_DELTA_SUMMARY_ROW_STYLES,
};

export const DEFAULT_VWAP_OPTIONS: VwapOptions = {
  color: '#f59e0b',
  lineWidth: 2,
  resetMode: 'session',
};

export const DEFAULT_CANDLE_HEATMAP_OPTIONS: CandleHeatmapOptions = {
  range: {
    min: 0,
    minShadeThreshold: 0.1,
    threshold: 0.5,
    maxShadeThreshold: 0.9,
    max: 1,
  },
  minColor: '#dc2626',
  maxColor: '#2563eb',
  noOfShades: 1,
  shader: 'alpha',
};

export function mergeFootprintSeriesOptions(
  options?: FootprintSeriesPartialOptions,
): FootprintSeriesOptions {
  const style: FootprintStyleOptions = {
    ...DEFAULT_FOOTPRINT_STYLE,
    ...options?.style,
    metricStyles: {
      ...DEFAULT_FOOTPRINT_STYLE.metricStyles,
      ...options?.style?.metricStyles,
    },
  };
  const layout: FootprintLayoutOptions = {
    ...DEFAULT_FOOTPRINT_LAYOUT_OPTIONS,
    ...options?.layout,
    barWidth: {
      ...DEFAULT_FOOTPRINT_LAYOUT_OPTIONS.barWidth,
      ...options?.layout?.barWidth,
    },
  };
  const candle: FootprintCandleOptions = {
    ...DEFAULT_FOOTPRINT_CANDLE_OPTIONS,
    ...options?.candle,
  };
  const ladder: FootprintLadderOptions = {
    ...DEFAULT_FOOTPRINT_LADDER_OPTIONS,
    ...options?.ladder,
  };
  const pointOfControl: FootprintPointOfControlOptions = {
    ...DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS,
    ...options?.pointOfControl,
  };
  const shadingDefaults = createDefaultFootprintShadingOptions(style, ladder);
  const summaryDefaults = createDefaultFootprintSummaryOptions(style);

  return {
    ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
    ...options,
    layout,
    candle,
    ladder,
    shading: {
      ...shadingDefaults,
      ...options?.shading,
      bidScale: mergeColorScaleOptions(shadingDefaults.bidScale, options?.shading?.bidScale),
      askScale: mergeColorScaleOptions(shadingDefaults.askScale, options?.shading?.askScale),
      positiveDeltaScale: mergeColorScaleOptions(
        shadingDefaults.positiveDeltaScale,
        options?.shading?.positiveDeltaScale,
      ),
      negativeDeltaScale: mergeColorScaleOptions(
        shadingDefaults.negativeDeltaScale,
        options?.shading?.negativeDeltaScale,
      ),
      neutralScale: mergeColorScaleOptions(
        shadingDefaults.neutralScale,
        options?.shading?.neutralScale,
      ),
    },
    pointOfControl,
    summary: {
      ...summaryDefaults,
      ...options?.summary,
      items: options?.summary?.items
        ? options.summary.items.map((item) => mergeFootprintMetricItem(style, item))
        : summaryDefaults.items,
    },
    style,
  };
}

export function mergeVolumeProfileOptions(
  options?: VolumeProfilePartialOptions,
): VolumeProfileOptions {
  return {
    ...DEFAULT_VOLUME_PROFILE_OPTIONS,
    ...options,
    pointOfControl: {
      ...DEFAULT_VOLUME_PROFILE_OPTIONS.pointOfControl,
      ...options?.pointOfControl,
    },
    style: {
      ...DEFAULT_VOLUME_PROFILE_OPTIONS.style,
      ...options?.style,
    },
  };
}

export function mergeSessionVolumeProfileOptions(
  options?: SessionVolumeProfilePartialOptions,
): SessionVolumeProfileOptions {
  return {
    ...DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS,
    ...options,
    pointOfControl: {
      ...DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS.pointOfControl,
      ...options?.pointOfControl,
    },
    style: {
      ...DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS.style,
      ...options?.style,
    },
  };
}

export function mergeDeltaSummarySeriesOptions(
  options?: DeltaSummarySeriesPartialOptions,
): DeltaSummarySeriesOptions {
  const merged: DeltaSummarySeriesOptions = {
    ...DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS,
    ...options,
    rows: options?.rows ?? DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS.rows,
    rowLabels: {
      ...DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS.rowLabels,
      ...options?.rowLabels,
    },
    columnWidth: {
      ...DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS.columnWidth,
      ...options?.columnWidth,
    },
    rowStyles: DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS.rowStyles,
  };
  const defaultRowStyles = createDefaultDeltaSummaryRowStyles(merged.minOpacity, merged.maxOpacity);
  const keys = Object.keys(defaultRowStyles) as DeltaSummaryColumnKey[];

  merged.rowStyles = keys.reduce<Record<DeltaSummaryColumnKey, DeltaSummaryRowStyleOptions>>(
    (collection, key) => {
      const override = options?.rowStyles?.[key];
      const base = defaultRowStyles[key];
      const next = {
        ...base,
        ...override,
      };

      collection[key] = {
        ...next,
        positiveFillScale: mergeColorScaleOptions(
          createAlphaColorScale(next.positiveFillColor, merged.minOpacity, merged.maxOpacity),
          override?.positiveFillScale,
        ),
        negativeFillScale: mergeColorScaleOptions(
          createAlphaColorScale(next.negativeFillColor, merged.minOpacity, merged.maxOpacity),
          override?.negativeFillScale,
        ),
        neutralFillScale: mergeColorScaleOptions(
          createAlphaColorScale(next.neutralFillColor, merged.minOpacity, merged.maxOpacity),
          override?.neutralFillScale,
        ),
      };

      return collection;
    },
    {} as Record<DeltaSummaryColumnKey, DeltaSummaryRowStyleOptions>,
  );

  return merged;
}

export function mergeVwapOptions(options?: Partial<VwapOptions>): VwapOptions {
  return {
    ...DEFAULT_VWAP_OPTIONS,
    ...options,
  };
}

export function mergeCandleHeatmapOptions(
  options?: CandleHeatmapPartialOptions,
): CandleHeatmapOptions {
  return {
    ...DEFAULT_CANDLE_HEATMAP_OPTIONS,
    ...options,
    range: {
      ...DEFAULT_CANDLE_HEATMAP_OPTIONS.range,
      ...options?.range,
    },
  };
}
