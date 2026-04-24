export type {
  AggregatedMarketBar,
  InstrumentContext,
  NormalizationOptions,
  OrderFlowAggregationMode,
  OrderFlowBar,
  OrderFlowBatch,
  OrderFlowPatch,
  OrderFlowTickStreamUpdate,
  PatchOperation,
  PriceLevelVolume,
  SessionDefinition,
  SessionSegment,
  TickSessionChunk,
  TickSessionManifest,
  TimeValue,
  TradeTick,
  QuoteTick,
  VwapPoint,
} from './models/contracts';
export type {
  CandleHeatmapDomainOptions,
  CandleHeatmapOptions,
  CandleHeatmapPartialOptions,
  CandleHeatmapShader,
  ColorScaleOptions,
  ColorScalePartialOptions,
  ColorScaleRangeOptions,
  ColorScaleStop,
  DeltaSummaryColumnKey,
  DeltaSummaryMetric,
  DeltaSummarySeriesPartialOptions,
  DeltaSummaryRowStyleOptions,
  DeltaSummarySeriesOptions,
  FootprintBidAskShadingMetric,
  FootprintPointOfControlOptions,
  FootprintSeriesOptions,
  FootprintCandleOptions,
  FootprintCandlePosition,
  FootprintLayoutOptions,
  FootprintMetricAlignment,
  FootprintMetricItemOptions,
  FootprintMetricItemPartialOptions,
  FootprintMetricPlacement,
  FootprintMetricRenderContext,
  FootprintMetricStyleOptions,
  FootprintMetricStyleResolverResult,
  FootprintMetricValueKey,
  MetricStyleKey,
  MetricStylePalette,
  MetricStylePaletteEntry,
  MetricStyleToken,
  MetricStyleVariant,
  MetricStyleVariantMode,
  FootprintShadingOptions,
  FootprintShadingPartialOptions,
  FootprintSeriesPartialOptions,
  FootprintSingleCellShadingMetric,
  FootprintStyleOptions,
  HorizontalAlignment,
  PointOfControlOptions,
  ProfileScope,
  ResponsiveWidthValue,
  SessionVolumeProfilePartialOptions,
  SessionVolumeProfileOptions,
  VolumeFootprintOptions,
  VolumeFootprintPartialOptions,
  VolumeProfilePartialOptions,
  VolumeProfileOptions,
  VolumeProfileStyleOptions,
  VwapOptions,
  WidthRangeOptions,
} from './models/options';
export type {
  DeltaSummaryColumnModel,
  FootprintBarModel,
  FootprintLevelModel,
  ProfileLevel,
  ProfileModel,
} from './models/studies';

export {
  DEFAULT_CANDLE_HEATMAP_OPTIONS,
  DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS,
  DEFAULT_DELTA_SUMMARY_ROW_STYLES,
  DEFAULT_FOOTPRINT_CANDLE_OPTIONS,
  DEFAULT_FOOTPRINT_LADDER_OPTIONS,
  DEFAULT_FOOTPRINT_LAYOUT_OPTIONS,
  DEFAULT_FOOTPRINT_METRIC_PRESETS,
  DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS,
  DEFAULT_FOOTPRINT_SERIES_OPTIONS,
  DEFAULT_FOOTPRINT_SHADING_OPTIONS,
  DEFAULT_FOOTPRINT_SUMMARY_OPTIONS,
  DEFAULT_FOOTPRINT_STYLE,
  DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS,
  DEFAULT_VOLUME_FOOTPRINT_OPTIONS,
  DEFAULT_VOLUME_PROFILE_OPTIONS,
  DEFAULT_VWAP_OPTIONS,
  createFootprintMetricPresets,
  mergeCandleHeatmapOptions,
  mergeDeltaSummarySeriesOptions,
  mergeFootprintSeriesOptions,
  mergeSessionVolumeProfileOptions,
  mergeVolumeProfileOptions,
  mergeVwapOptions,
} from './models/options';

export {
  CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
  CORN_REFERENCE_FOOTPRINT_OPTIONS,
  DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
  LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS,
  ORDER_FLOW_STYLE_PRESETS,
  SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  SHADED_REFERENCE_FOOTPRINT_OPTIONS,
  SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
  type OrderFlowStylePresetPack,
} from './presets/orderFlowStylePresets';
export {
  ORDER_FLOW_THEME_PRESETS,
  type OrderFlowSurfaceTheme,
  type OrderFlowThemePresetPack,
} from './presets/orderFlowThemePresets';

export { normalizeBars, normalizeOrderFlowBatch } from './adapters/normalize/normalizeBatch';
export { normalizeOrderFlowPatch } from './adapters/normalize/normalizePatch';
export { applyOrderFlowPatch } from './adapters/normalize/applyOrderFlowPatch';
export { resolveSessions, resolveSessionId } from './adapters/sessions/resolveSessions';

export { buildDeltaSummaryColumns } from './calculations/footprint/buildDeltaSummaryColumns';
export { deriveFootprintMetrics } from './calculations/footprint/deriveFootprintMetrics';
export { buildFootprintBarModel } from './calculations/footprint/buildFootprintBarModel';
export { buildProfile } from './calculations/profile/buildProfile';
export { buildVisibleRangeProfile } from './calculations/profile/buildVisibleRangeProfile';
export { buildSessionProfiles } from './calculations/profile/buildSessionProfiles';
export type {
  BuildCandleHeatmapSeriesDataInput,
  CandleHeatmapBarLike,
  CandleHeatmapColorResolution,
  ResolveCandleHeatmapColorInput,
} from './calculations/candle-heatmap/buildCandleHeatmapSeriesData';
export {
  buildCandleHeatmapSeriesData,
  resolveCandleHeatmapColor,
} from './calculations/candle-heatmap/buildCandleHeatmapSeriesData';
export type {
  BuildVolumeDeltaPivotSeriesDataOptions,
  VolumeDeltaPivotPoint,
  VolumeDeltaSourceBar,
} from './calculations/volume-delta/buildVolumeDeltaPivotSeriesData';
export { buildVolumeDeltaPivotSeriesData } from './calculations/volume-delta/buildVolumeDeltaPivotSeriesData';
export { computeVwapSeriesData } from './calculations/vwap/computeVwapSeriesData';

export { createDeltaSummarySeries } from './renderers/delta-summary-series/createDeltaSummarySeries';
export { createFootprintSeries } from './renderers/footprint-series/createFootprintSeries';
export { createVolumeFootprintSeries } from './renderers/footprint-series/createVolumeFootprintSeries';
export { createVolumeProfilePrimitive } from './renderers/primitives/createVolumeProfilePrimitive';
export { createSessionVolumeProfilePrimitive } from './renderers/primitives/createSessionVolumeProfilePrimitive';
export type {
  SeriesMetricPrimitiveDatum,
  SeriesMetricPrimitiveItem,
} from './renderers/primitives/createSeriesMetricPrimitive';
export {
  SeriesMetricPrimitive,
  createSeriesMetricPrimitive,
} from './renderers/primitives/createSeriesMetricPrimitive';
export { createVwapController } from './renderers/primitives/createVwapController';
export type {
  BuildOrderFlowBarsFromTicksInput,
  CreateOrderFlowTickStreamControllerConfig,
  OrderFlowTickStreamController,
  OrderFlowTickStreamResult,
} from './controllers/createOrderFlowTickStreamController';
export {
  buildOrderFlowBarsFromTicks,
  createOrderFlowTickStreamController,
} from './controllers/createOrderFlowTickStreamController';

export { createAlphaColorScale, resolveColorScale, withAlpha } from './utils/color';
export type {
  CaptureChartViewStateOptions,
  ChartViewPaneStateSnapshot,
  ChartViewStateSnapshot,
  NumericRange,
} from './utils/chartState';
export {
  captureChartViewState,
  isChartViewStateSnapshot,
  restoreChartViewState,
} from './utils/chartState';
export type { AutoFitPriceScaleOptions, AutoFitPriceScaleResult } from './utils/autoFitPriceScale';
export { setPriceScaleAutoFit } from './utils/autoFitPriceScale';
export {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
  buildAggregatedMarketBarFromOrderFlowBar,
  buildAggregatedMarketBarsFromOrderFlowBars,
} from './utils/aggregateBars';
export {
  buildPriceGrid,
  inferPricePrecision,
  inferPriceStep,
  roundToPriceStep,
} from './utils/priceStep';
export type {
  CompactNumericFormatOptions,
  NumericRoundingMode,
  NumericTextFormatOptions,
} from './utils/numberFormat';
export {
  clampDecimalDigits,
  clampIntegerDigits,
  formatCompactNumericValue,
  formatNumericValue,
  roundToDigits,
} from './utils/numberFormat';
export {
  METRIC_STYLE_KEYS,
  parseMetricBorderShorthand,
  resolveMetricStyleToken,
  resolveMetricStyleVariant,
} from './utils/metricStylePalette';
export type { OhlcLike } from './utils/mintick';
export {
  buildSupportedMinticks,
  bucketPriceToMintick,
  clusterOhlcBarByMintick,
  clusterOhlcBarsByMintick,
  clusterOrderFlowBarByMintick,
  clusterOrderFlowBarsByMintick,
  clusterPriceLevelsByMintick,
  DEFAULT_MINTICK_CANDIDATES,
  MAX_MINTICK,
  MIN_MINTICK,
  normalizeMintick,
} from './utils/mintick';
