# API Reference

This page is auto-generated from the public barrel exports in `src/index.ts` and `src/react.ts`.

It is intended to stay aligned with the shipped package surface. To add richer descriptions for a symbol, add a JSDoc block to the exported declaration in source. The generator will include it here and in the docs-site search index.

## Summary

- Total public exports: 211
- Exports with JSDoc descriptions: 4
- Core entry point: `lightweight-orderflow-charts`
- React entry point: `lightweight-orderflow-charts/react`
- Generated at: `2026-04-29T23:31:38.138Z`

## Data Contracts

Normalized market-data, session, and patch contracts.

- `AggregatedMarketBar` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface AggregatedMarketBar`

- `InstrumentContext` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface InstrumentContext`

- `NormalizationOptions` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface NormalizationOptions`

- `OrderFlowAggregationMode` (`type alias`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `type OrderFlowAggregationMode`

- `OrderFlowBar` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowBar`

- `OrderFlowBatch` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowBatch`

- `OrderFlowPatch` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowPatch`

- `OrderFlowTickStreamUpdate` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowTickStreamUpdate`

- `PatchOperation` (`type alias`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `type PatchOperation`

- `PriceLevelVolume` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface PriceLevelVolume`

- `QuoteTick` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface QuoteTick`

- `SessionDefinition` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface SessionDefinition`

- `SessionSegment` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface SessionSegment`

- `TickSessionChunk` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface TickSessionChunk`

- `TickSessionManifest` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface TickSessionManifest`

- `TimeValue` (`type alias`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `type TimeValue`

- `TradeTick` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface TradeTick`

- `VwapPoint` (`interface`) from `src/models/contracts.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VwapPoint`

## Options And Configuration

Public option types, partials, defaults, and merge helpers.

- `CandleHeatmapOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CandleHeatmapOptions`
  - Description: Configures metric-driven candle coloring for a standard candlestick series. `noOfShades: 1` collapses the mapping to two solid colors split by `threshold`. `noOfShades: 0` uses a continuous mapping with 256 internal steps.

- `CandleHeatmapPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type CandleHeatmapPartialOptions`

- `CandleHeatmapRangeOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CandleHeatmapRangeOptions`
  - Description: Diverging range used by the candle heatmap helper. The range is split around `threshold`. Values near `min` resolve toward `downColor`, while values near `max` resolve toward `upColor`.

- `CandleHeatmapShader` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type CandleHeatmapShader`

- `ColorScaleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ColorScaleOptions`

- `ColorScalePartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type ColorScalePartialOptions`

- `ColorScaleRangeOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ColorScaleRangeOptions`

- `ColorScaleStop` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ColorScaleStop`

- `createFootprintMetricPresets` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function createFootprintMetricPresets(style?: FootprintStyleOptions): Record<"delta" | "volume", FootprintMetricItemOptions>`

- `DEFAULT_CANDLE_HEATMAP_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_CANDLE_HEATMAP_OPTIONS`

- `DEFAULT_DELTA_SUMMARY_ROW_STYLES` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_DELTA_SUMMARY_ROW_STYLES`

- `DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_DELTA_SUMMARY_SERIES_OPTIONS`

- `DEFAULT_FOOTPRINT_CANDLE_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_CANDLE_OPTIONS`

- `DEFAULT_FOOTPRINT_LADDER_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_LADDER_OPTIONS`

- `DEFAULT_FOOTPRINT_LAYOUT_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_LAYOUT_OPTIONS`

- `DEFAULT_FOOTPRINT_METRIC_PRESETS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_METRIC_PRESETS`

- `DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_POINT_OF_CONTROL_OPTIONS`

- `DEFAULT_FOOTPRINT_SERIES_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_SERIES_OPTIONS`

- `DEFAULT_FOOTPRINT_SHADING_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_SHADING_OPTIONS`

- `DEFAULT_FOOTPRINT_STYLE` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_STYLE`

- `DEFAULT_FOOTPRINT_SUMMARY_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_FOOTPRINT_SUMMARY_OPTIONS`

- `DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_SESSION_VOLUME_PROFILE_OPTIONS`

- `DEFAULT_VOLUME_FOOTPRINT_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_VOLUME_FOOTPRINT_OPTIONS`

- `DEFAULT_VOLUME_PROFILE_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_VOLUME_PROFILE_OPTIONS`

- `DEFAULT_VWAP_OPTIONS` (`const`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_VWAP_OPTIONS`

- `DeltaSummaryColumnKey` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type DeltaSummaryColumnKey`

- `DeltaSummaryMetric` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type DeltaSummaryMetric`

- `DeltaSummaryRowStyleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface DeltaSummaryRowStyleOptions`

- `DeltaSummarySeriesOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface DeltaSummarySeriesOptions`

- `DeltaSummarySeriesPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type DeltaSummarySeriesPartialOptions`

- `FootprintBidAskShadingMetric` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintBidAskShadingMetric`

- `FootprintCandleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintCandleOptions`

- `FootprintCandlePosition` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintCandlePosition`

- `FootprintLayoutOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintLayoutOptions`

- `FootprintMetricAlignment` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintMetricAlignment`

- `FootprintMetricItemOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintMetricItemOptions`

- `FootprintMetricItemPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintMetricItemPartialOptions`

- `FootprintMetricPlacement` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintMetricPlacement`

- `FootprintMetricRenderContext` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintMetricRenderContext`

- `FootprintMetricStyleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintMetricStyleOptions`

- `FootprintMetricStyleResolverResult` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintMetricStyleResolverResult`

- `FootprintMetricValueKey` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintMetricValueKey`

- `FootprintPointOfControlOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintPointOfControlOptions`

- `FootprintSeriesOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintSeriesOptions`

- `FootprintSeriesPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintSeriesPartialOptions`

- `FootprintShadingOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintShadingOptions`

- `FootprintShadingPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintShadingPartialOptions`

- `FootprintSingleCellShadingMetric` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type FootprintSingleCellShadingMetric`

- `FootprintStyleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintStyleOptions`

- `HorizontalAlignment` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type HorizontalAlignment`

- `mergeCandleHeatmapOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeCandleHeatmapOptions(options?: CandleHeatmapPartialOptions): CandleHeatmapOptions`

- `mergeDeltaSummarySeriesOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeDeltaSummarySeriesOptions(options?: DeltaSummarySeriesPartialOptions): DeltaSummarySeriesOptions`

- `mergeFootprintSeriesOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeFootprintSeriesOptions(options?: FootprintSeriesPartialOptions): FootprintSeriesOptions`

- `mergeSessionVolumeProfileOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeSessionVolumeProfileOptions(options?: SessionVolumeProfilePartialOptions): SessionVolumeProfileOptions`

- `mergeVolumeProfileOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeVolumeProfileOptions(options?: VolumeProfilePartialOptions): VolumeProfileOptions`

- `mergeVwapOptions` (`function`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `function mergeVwapOptions(options?: Partial<VwapOptions>): VwapOptions`

- `MetricStyleKey` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type MetricStyleKey`

- `MetricStylePalette` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type MetricStylePalette`

- `MetricStylePaletteEntry` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface MetricStylePaletteEntry`

- `MetricStyleToken` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface MetricStyleToken`

- `MetricStyleVariant` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type MetricStyleVariant`

- `MetricStyleVariantMode` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type MetricStyleVariantMode`

- `PointOfControlOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface PointOfControlOptions`

- `ProfileScope` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type ProfileScope`

- `ResponsiveWidthValue` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type ResponsiveWidthValue`
  - Description: Width values accept either device pixels or a percentage of the current bar spacing.

- `SessionVolumeProfileOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface SessionVolumeProfileOptions`

- `SessionVolumeProfilePartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type SessionVolumeProfilePartialOptions`

- `VolumeFootprintOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VolumeFootprintOptions`

- `VolumeFootprintPartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type VolumeFootprintPartialOptions`

- `VolumeProfileOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VolumeProfileOptions`

- `VolumeProfilePartialOptions` (`type alias`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `type VolumeProfilePartialOptions`

- `VolumeProfileStyleOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VolumeProfileStyleOptions`

- `VwapOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VwapOptions`

- `WidthRangeOptions` (`interface`) from `src/models/options.ts` via `lightweight-orderflow-charts`
  - Preview: `interface WidthRangeOptions`
  - Description: Width constraints used by footprint bars and delta-summary columns.

## Study Models

Derived view-model types emitted by the study calculations.

- `DeltaSummaryColumnModel` (`interface`) from `src/models/studies.ts` via `lightweight-orderflow-charts`
  - Preview: `interface DeltaSummaryColumnModel`

- `FootprintBarModel` (`interface`) from `src/models/studies.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintBarModel`

- `FootprintLevelModel` (`interface`) from `src/models/studies.ts` via `lightweight-orderflow-charts`
  - Preview: `interface FootprintLevelModel`

- `ProfileLevel` (`interface`) from `src/models/studies.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ProfileLevel`

- `ProfileModel` (`interface`) from `src/models/studies.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ProfileModel`

## Presets And Themes

Published style packs, theme packs, and related preset helpers.

- `CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS`

- `CLASSIC_REFERENCE_FOOTPRINT_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const CLASSIC_REFERENCE_FOOTPRINT_OPTIONS`

- `CORN_REFERENCE_FOOTPRINT_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const CORN_REFERENCE_FOOTPRINT_OPTIONS`

- `DARK_REFERENCE_DELTA_SUMMARY_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const DARK_REFERENCE_DELTA_SUMMARY_OPTIONS`

- `DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS`

- `LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS`

- `ORDER_FLOW_DELTA_FOOTPRINT_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const ORDER_FLOW_DELTA_FOOTPRINT_OPTIONS`

- `ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS`

- `ORDER_FLOW_STYLE_PRESETS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const ORDER_FLOW_STYLE_PRESETS`

- `ORDER_FLOW_THEME_PRESETS` (`const`) from `src/presets/orderFlowThemePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const ORDER_FLOW_THEME_PRESETS`

- `OrderFlowStylePresetPack` (`interface`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowStylePresetPack`

- `OrderFlowSurfaceTheme` (`interface`) from `src/presets/orderFlowThemePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowSurfaceTheme`

- `OrderFlowThemePresetPack` (`interface`) from `src/presets/orderFlowThemePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowThemePresetPack`

- `SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS`

- `SHADED_REFERENCE_FOOTPRINT_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const SHADED_REFERENCE_FOOTPRINT_OPTIONS`

- `SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS`

- `VOLUME_FOOTPRINT_REFERENCE_OPTIONS` (`const`) from `src/presets/orderFlowStylePresets.ts` via `lightweight-orderflow-charts`
  - Preview: `const VOLUME_FOOTPRINT_REFERENCE_OPTIONS`

## Normalization And Sessions

Adapters for moving upstream data into the public contracts.

- `applyOrderFlowPatch` (`function`) from `src/adapters/normalize/applyOrderFlowPatch.ts` via `lightweight-orderflow-charts`
  - Preview: `function applyOrderFlowPatch(currentBars: OrderFlowBar[], patch: OrderFlowPatch): OrderFlowBar[]`

- `normalizeBars` (`function`) from `src/adapters/normalize/normalizeBatch.ts` via `lightweight-orderflow-charts`
  - Preview: `function normalizeBars(bars: OrderFlowBar[], options?: Pick<NormalizationOptions, "sessions" | "deriveSessions">): OrderFlowBar[]`

- `normalizeOrderFlowBatch` (`function`) from `src/adapters/normalize/normalizeBatch.ts` via `lightweight-orderflow-charts`
  - Preview: `function normalizeOrderFlowBatch(batch: OrderFlowBatch, options?: NormalizationOptions): OrderFlowBatch`

- `normalizeOrderFlowPatch` (`function`) from `src/adapters/normalize/normalizePatch.ts` via `lightweight-orderflow-charts`
  - Preview: `function normalizeOrderFlowPatch(patch: OrderFlowPatch, options?: NormalizationOptions): OrderFlowPatch`

- `resolveSessionId` (`function`) from `src/adapters/sessions/resolveSessions.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveSessionId(bar: OrderFlowBar, sessions: SessionDefinition[]): string | undefined`

- `resolveSessions` (`function`) from `src/adapters/sessions/resolveSessions.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveSessions(bars: OrderFlowBar[], sessions?: SessionDefinition[]): OrderFlowBar[]`

## Calculations

Pure helpers for footprint, profile, heatmap, pivot, and VWAP derivation.

- `buildCandleHeatmapSeriesData` (`function`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildCandleHeatmapSeriesData<TBar extends CandleHeatmapBarLike>(input: BuildCandleHeatmapSeriesDataInput<TBar>): CandlestickData<TimeValue>[]`

- `BuildCandleHeatmapSeriesDataInput` (`interface`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface BuildCandleHeatmapSeriesDataInput<TBar>`

- `buildDeltaSummaryColumns` (`function`) from `src/calculations/footprint/buildDeltaSummaryColumns.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildDeltaSummaryColumns(bars: OrderFlowBar[]): DeltaSummaryColumnModel[]`

- `buildFootprintBarModel` (`function`) from `src/calculations/footprint/buildFootprintBarModel.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildFootprintBarModel(bar: OrderFlowBar, options: FootprintSeriesOptions): FootprintBarModel`

- `buildProfile` (`function`) from `src/calculations/profile/buildProfile.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildProfile(bars: OrderFlowBar[], scopeId: string, valueAreaPercent?: number, label?: string): ProfileModel`

- `buildSessionProfiles` (`function`) from `src/calculations/profile/buildSessionProfiles.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildSessionProfiles(bars: OrderFlowBar[], valueAreaPercent?: number): ProfileModel[]`

- `buildVisibleRangeProfile` (`function`) from `src/calculations/profile/buildVisibleRangeProfile.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildVisibleRangeProfile(bars: OrderFlowBar[], from?: TimeValue, to?: TimeValue, valueAreaPercent?: number): { fromTime: import("lightweight-charts").Time | undefined; to…`

- `buildVolumeDeltaPivotSeriesData` (`function`) from `src/calculations/volume-delta/buildVolumeDeltaPivotSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildVolumeDeltaPivotSeriesData(chartBars: VolumeDeltaSourceBar[], lowerTimeframeBars: VolumeDeltaSourceBar[], options?: BuildVolumeDeltaPivotSeriesDataOptions): VolumeDe…`

- `BuildVolumeDeltaPivotSeriesDataOptions` (`interface`) from `src/calculations/volume-delta/buildVolumeDeltaPivotSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface BuildVolumeDeltaPivotSeriesDataOptions`

- `CandleHeatmapBarLike` (`interface`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CandleHeatmapBarLike`

- `CandleHeatmapColorResolution` (`interface`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CandleHeatmapColorResolution`

- `CandleHeatmapSide` (`type alias`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `type CandleHeatmapSide`

- `computeVwapSeriesData` (`function`) from `src/calculations/vwap/computeVwapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `function computeVwapSeriesData(bars: OrderFlowBar[], options?: Partial<VwapOptions>): VwapPoint[]`

- `deriveFootprintMetrics` (`function`) from `src/calculations/footprint/deriveFootprintMetrics.ts` via `lightweight-orderflow-charts`
  - Preview: `function deriveFootprintMetrics(bar: OrderFlowBar, options: DeriveFootprintMetricOptions): DerivedFootprintMetrics`

- `resolveCandleHeatmapColor` (`function`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveCandleHeatmapColor(input: ResolveCandleHeatmapColorInput): CandleHeatmapColorResolution | null`

- `ResolveCandleHeatmapColorInput` (`interface`) from `src/calculations/candle-heatmap/buildCandleHeatmapSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ResolveCandleHeatmapColorInput`

- `VolumeDeltaPivotPoint` (`interface`) from `src/calculations/volume-delta/buildVolumeDeltaPivotSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VolumeDeltaPivotPoint`

- `VolumeDeltaSourceBar` (`interface`) from `src/calculations/volume-delta/buildVolumeDeltaPivotSeriesData.ts` via `lightweight-orderflow-charts`
  - Preview: `interface VolumeDeltaSourceBar`

## Renderers And Primitives

Series and primitive factories for chart rendering.

- `createDeltaSummarySeries` (`function`) from `src/renderers/delta-summary-series/createDeltaSummarySeries.ts` via `lightweight-orderflow-charts`
  - Preview: `function createDeltaSummarySeries(options?: DeltaSummarySeriesPartialOptions): ICustomSeriesPaneView<TimeValue, OrderFlowBar, DeltaSummarySeriesOptions>`

- `createFootprintSeries` (`function`) from `src/renderers/footprint-series/createFootprintSeries.ts` via `lightweight-orderflow-charts`
  - Preview: `function createFootprintSeries(options?: FootprintSeriesPartialOptions): ICustomSeriesPaneView<TimeValue, OrderFlowBar, FootprintSeriesOptions>`

- `createSeriesMetricPrimitive` (`function`) from `src/renderers/primitives/createSeriesMetricPrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `function createSeriesMetricPrimitive(config: SeriesMetricPrimitiveConfig): SeriesMetricPrimitive`

- `createSessionVolumeProfilePrimitive` (`function`) from `src/renderers/primitives/createSessionVolumeProfilePrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `function createSessionVolumeProfilePrimitive(config: SessionProfilePrimitiveConfig): SessionVolumeProfilePrimitive`

- `createVolumeFootprintSeries` (`function`) from `src/renderers/footprint-series/createVolumeFootprintSeries.ts` via `lightweight-orderflow-charts`
  - Preview: `function createVolumeFootprintSeries(options?: VolumeFootprintPartialOptions): ICustomSeriesPaneView<TimeValue, OrderFlowBar, VolumeFootprintOptions>`

- `createVolumeProfilePrimitive` (`function`) from `src/renderers/primitives/createVolumeProfilePrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `function createVolumeProfilePrimitive(config: VolumeProfilePrimitiveConfig): VolumeProfilePrimitive`

- `createVwapController` (`function`) from `src/renderers/primitives/createVwapController.ts` via `lightweight-orderflow-charts`
  - Preview: `function createVwapController(config: CreateVwapControllerConfig): VwapController`

- `SeriesMetricPrimitive` (`class`) from `src/renderers/primitives/createSeriesMetricPrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `class SeriesMetricPrimitive`

- `SeriesMetricPrimitiveDatum` (`interface`) from `src/renderers/primitives/createSeriesMetricPrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `interface SeriesMetricPrimitiveDatum`

- `SeriesMetricPrimitiveItem` (`interface`) from `src/renderers/primitives/createSeriesMetricPrimitive.ts` via `lightweight-orderflow-charts`
  - Preview: `interface SeriesMetricPrimitiveItem`

## Controllers

Controller-style helpers for tick streams and live updates.

- `buildOrderFlowBarsFromTicks` (`function`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildOrderFlowBarsFromTicks(input: BuildOrderFlowBarsFromTicksInput): OrderFlowBar[]`

- `BuildOrderFlowBarsFromTicksInput` (`interface`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `interface BuildOrderFlowBarsFromTicksInput`

- `createOrderFlowTickStreamController` (`function`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `function createOrderFlowTickStreamController(config: CreateOrderFlowTickStreamControllerConfig): OrderFlowTickStreamController`

- `CreateOrderFlowTickStreamControllerConfig` (`interface`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CreateOrderFlowTickStreamControllerConfig`

- `OrderFlowTickStreamController` (`interface`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowTickStreamController`

- `OrderFlowTickStreamResult` (`interface`) from `src/controllers/createOrderFlowTickStreamController.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OrderFlowTickStreamResult`

## Utilities

General-purpose helpers for color, chart state, auto-fit, aggregation, and formatting.

- `aggregateMarketBarsByInterval` (`function`) from `src/utils/aggregateBars.ts` via `lightweight-orderflow-charts`
  - Preview: `function aggregateMarketBarsByInterval(bars: readonly AggregatedMarketBar[], intervalSeconds: number): AggregatedMarketBar[]`

- `aggregateOrderFlowBarsByInterval` (`function`) from `src/utils/aggregateBars.ts` via `lightweight-orderflow-charts`
  - Preview: `function aggregateOrderFlowBarsByInterval(bars: readonly OrderFlowBar[], intervalSeconds: number): OrderFlowBar[]`

- `AutoFitPriceScaleOptions` (`interface`) from `src/utils/autoFitPriceScale.ts` via `lightweight-orderflow-charts`
  - Preview: `interface AutoFitPriceScaleOptions`

- `AutoFitPriceScaleResult` (`interface`) from `src/utils/autoFitPriceScale.ts` via `lightweight-orderflow-charts`
  - Preview: `interface AutoFitPriceScaleResult`

- `bucketPriceToMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function bucketPriceToMintick(value: number, mintick: number, sourceTickSize?: number): number`

- `buildAggregatedMarketBarFromOrderFlowBar` (`function`) from `src/utils/aggregateBars.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildAggregatedMarketBarFromOrderFlowBar(bar: OrderFlowBar): AggregatedMarketBar`

- `buildAggregatedMarketBarsFromOrderFlowBars` (`function`) from `src/utils/aggregateBars.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildAggregatedMarketBarsFromOrderFlowBars(bars: readonly OrderFlowBar[]): AggregatedMarketBar[]`

- `buildPriceGrid` (`function`) from `src/utils/priceStep.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildPriceGrid(low: number, high: number, step: number, precision?: number): number[]`

- `buildSupportedMinticks` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function buildSupportedMinticks(sourceTickSize: number, candidates?: readonly number[]): number[]`

- `captureChartViewState` (`function`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `function captureChartViewState(chart: IChartApi, options?: CaptureChartViewStateOptions): ChartViewStateSnapshot`

- `CaptureChartViewStateOptions` (`interface`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CaptureChartViewStateOptions`

- `ChartViewPaneStateSnapshot` (`interface`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ChartViewPaneStateSnapshot`

- `ChartViewStateSnapshot` (`interface`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `interface ChartViewStateSnapshot`

- `clampDecimalDigits` (`function`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `function clampDecimalDigits(digits: number): number`

- `clampIntegerDigits` (`function`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `function clampIntegerDigits(digits: number): number`

- `clusterOhlcBarByMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function clusterOhlcBarByMintick<T extends OhlcLike>(bar: T, mintick: number, sourceTickSize?: number): T`

- `clusterOhlcBarsByMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function clusterOhlcBarsByMintick<T extends OhlcLike>(bars: readonly T[], mintick: number, sourceTickSize?: number): T[]`

- `clusterOrderFlowBarByMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function clusterOrderFlowBarByMintick(bar: OrderFlowBar, mintick: number, sourceTickSize?: number): OrderFlowBar`

- `clusterOrderFlowBarsByMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function clusterOrderFlowBarsByMintick(bars: readonly OrderFlowBar[], mintick: number, sourceTickSize?: number): OrderFlowBar[]`

- `clusterPriceLevelsByMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function clusterPriceLevelsByMintick(levels: PriceLevelVolume[], mintick: number, sourceTickSize?: number): PriceLevelVolume[]`

- `CompactNumericFormatOptions` (`interface`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `interface CompactNumericFormatOptions`

- `createAlphaColorScale` (`function`) from `src/utils/color.ts` via `lightweight-orderflow-charts`
  - Preview: `function createAlphaColorScale(color: string, minAlpha: number, maxAlpha: number, range?: Partial<ColorScaleRangeOptions>): ColorScaleOptions`

- `DEFAULT_MINTICK_CANDIDATES` (`const`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `const DEFAULT_MINTICK_CANDIDATES`

- `formatCompactNumericValue` (`function`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `function formatCompactNumericValue(value: number, options: CompactNumericFormatOptions): string`

- `formatNumericValue` (`function`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `function formatNumericValue(value: number, options: NumericTextFormatOptions): string`

- `inferPricePrecision` (`function`) from `src/utils/priceStep.ts` via `lightweight-orderflow-charts`
  - Preview: `function inferPricePrecision(step: number): number`

- `inferPriceStep` (`function`) from `src/utils/priceStep.ts` via `lightweight-orderflow-charts`
  - Preview: `function inferPriceStep(levels: PriceLike[]): number | null`

- `isChartViewStateSnapshot` (`function`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `function isChartViewStateSnapshot(value: unknown): value is ChartViewStateSnapshot`

- `MAX_MINTICK` (`const`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `const MAX_MINTICK`

- `METRIC_STYLE_KEYS` (`const`) from `src/utils/metricStylePalette.ts` via `lightweight-orderflow-charts`
  - Preview: `const METRIC_STYLE_KEYS`

- `MIN_MINTICK` (`const`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `const MIN_MINTICK`

- `normalizeMintick` (`function`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `function normalizeMintick(mintick: number | null | undefined, sourceTickSize?: number): number | null`

- `NumericRange` (`interface`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `interface NumericRange`

- `NumericRoundingMode` (`type alias`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `type NumericRoundingMode`

- `NumericTextFormatOptions` (`interface`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `interface NumericTextFormatOptions`

- `OhlcLike` (`interface`) from `src/utils/mintick.ts` via `lightweight-orderflow-charts`
  - Preview: `interface OhlcLike`

- `parseMetricBorderShorthand` (`function`) from `src/utils/metricStylePalette.ts` via `lightweight-orderflow-charts`
  - Preview: `function parseMetricBorderShorthand(border?: string): { color: string | null; width: number; }`

- `resolveColorScale` (`function`) from `src/utils/color.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveColorScale(scale: ColorScaleOptions, value: number): string`

- `resolveMetricStyleToken` (`function`) from `src/utils/metricStylePalette.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveMetricStyleToken(palette: MetricStylePalette, key: MetricStyleKey, variant?: MetricStyleVariant): MetricStyleToken`

- `resolveMetricStyleVariant` (`function`) from `src/utils/metricStylePalette.ts` via `lightweight-orderflow-charts`
  - Preview: `function resolveMetricStyleVariant(rawValue: number | null, mode?: MetricStyleVariantMode): MetricStyleVariant`

- `restoreChartViewState` (`function`) from `src/utils/chartState.ts` via `lightweight-orderflow-charts`
  - Preview: `function restoreChartViewState(chart: IChartApi, snapshot: ChartViewStateSnapshot | null | undefined): void`

- `roundToDigits` (`function`) from `src/utils/numberFormat.ts` via `lightweight-orderflow-charts`
  - Preview: `function roundToDigits(value: number, digits: number, rounding?: NumericRoundingMode): number`

- `roundToPriceStep` (`function`) from `src/utils/priceStep.ts` via `lightweight-orderflow-charts`
  - Preview: `function roundToPriceStep(value: number, step: number, precision?: number): number`

- `setPriceScaleAutoFit` (`function`) from `src/utils/autoFitPriceScale.ts` via `lightweight-orderflow-charts`
  - Preview: `function setPriceScaleAutoFit(chart: IChartApi, enabled: boolean, options?: AutoFitPriceScaleOptions): AutoFitPriceScaleResult`

- `withAlpha` (`function`) from `src/utils/color.ts` via `lightweight-orderflow-charts`
  - Preview: `function withAlpha(color: string, alpha: number): string`

## React Context

React chart-context exports for sharing the chart instance.

- `ChartProvider` (`function`) from `src/react/context/ChartContext.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function ChartProvider({ chart, children }: ChartProviderProps): import("react/jsx-runtime").JSX.Element`

- `useChartApi` (`function`) from `src/react/context/ChartContext.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function useChartApi(): IChartApi | null`

## React Components

React components that mount studies and primitives into a chart.

- `DeltaSummarySeries` (`function`) from `src/react/components/DeltaSummarySeries.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function DeltaSummarySeries(props: DeltaSummarySeriesProps): null`

- `FootprintSeries` (`function`) from `src/react/components/FootprintSeries.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function FootprintSeries(props: FootprintSeriesProps): null`

- `SessionVolumeProfiles` (`function`) from `src/react/components/SessionVolumeProfiles.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function SessionVolumeProfiles({ series, data, options }: SessionVolumeProfilesProps): null`

- `VolumeFootprint` (`function`) from `src/react/components/VolumeFootprint.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function VolumeFootprint(props: VolumeFootprintProps): null`

- `VolumeProfile` (`function`) from `src/react/components/VolumeProfile.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function VolumeProfile({ series, data, options }: VolumeProfileProps): null`

- `VwapSeries` (`function`) from `src/react/components/VwapSeries.tsx` via `lightweight-orderflow-charts/react`
  - Preview: `function VwapSeries({ chart, data, options, lineOptions, patch, paneIndex, }: VwapSeriesProps): null`

## React Hooks

Hooks for lifecycle wiring around studies and primitives.

- `useDeltaSummarySeries` (`function`) from `src/react/hooks/useDeltaSummarySeries.ts` via `lightweight-orderflow-charts/react`
  - Preview: `function useDeltaSummarySeries({ chart, data, options, paneIndex, onReady, }: UseDeltaSummarySeriesProps): ISeriesApi<"Custom", import("lightweight-charts").Time, import("lightwei…`

- `useFootprintSeries` (`function`) from `src/react/hooks/useFootprintSeries.ts` via `lightweight-orderflow-charts/react`
  - Preview: `function useFootprintSeries({ chart, data, options, paneIndex, variant, onReady, }: UseFootprintSeriesProps): ISeriesApi<"Custom", import("lightweight-charts").Time, import("light…`

- `useOrderFlowStudies` (`function`) from `src/react/hooks/useOrderFlowStudies.ts` via `lightweight-orderflow-charts/react`
  - Preview: `function useOrderFlowStudies({ chart, series, data, patch, volumeProfileOptions, sessionVolumeProfileOptions, vwapOptions, vwapLineOptions, }: UseOrderFlowStudiesProps): { volumeP…`

- `usePrimitiveLifecycle` (`function`) from `src/react/hooks/usePrimitiveLifecycle.ts` via `lightweight-orderflow-charts/react`
  - Preview: `function usePrimitiveLifecycle(series: ISeriesApi<"Custom", TimeValue> | null, primitive: UpdatablePrimitive | null, bars?: OrderFlowBar[]): void`
