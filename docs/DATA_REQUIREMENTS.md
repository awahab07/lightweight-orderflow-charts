# Data Requirements

This package is intentionally broker-neutral. It does not assume a specific market-data vendor,
gateway, or transport. The host application is responsible for translating upstream payloads into
the public contracts exported by `lightweight-orderflow-charts`.

The preferred fixture and ingestion model is now `1m`-based:

- `OrderFlowBar[]`
  Footprint-capable minute bars with per-price bid/ask participation
- `AggregatedMarketBar[]`
  Minute candle summaries with required OHLCV and optional order-flow extras

Higher intervals such as `5m` should be derived from stored `1m` data instead of stored as
independent canonical files. See [`TICK_DATA.md`](./TICK_DATA.md) for the minute-storage and cache
layout.

## Canonical Inputs

The library expects a normalized `OrderFlowBar[]` as the primary input for most studies:

```ts
type OrderFlowBar = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  sessionId?: string;
  totalVolume?: number;
  delta?: number;
  levels: Array<{
    price: number;
    bidVolume: number;
    askVolume: number;
    totalVolume?: number;
    delta?: number;
  }>;
};
```

Supporting contracts:

- `InstrumentContext`
  Symbol, tick size, precision, and timezone metadata
- `AggregatedMarketBar`
  Broker-neutral candle summaries with required `time`, `open`, `high`, `low`, `close`, and
  `volume`, plus optional `vwap`, `tradeCount`, `bidVolume`, `askVolume`, `delta`, `deltaMin`,
  `deltaMax`, `pocPrice`, and `pocVolume`
- `SessionDefinition`
  Session templates for study resets and per-session overlays
- `OrderFlowPatch`
  Incremental updates for append, upsert, replace, and remove flows

## Study Matrix

| Study                        | Minimum Input                                              | Recommended Input                                                                              | Why                                                                                |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Candle Heatmap               | OHLC bars plus one metric value per bar                    | `AggregatedMarketBar[]` or equivalent OHLC bars with a normalized score accessor               | It keeps the candle geometry and uses color to carry a second bar-level variable   |
| Footprint                    | `OrderFlowBar[]` with `levels`                             | Price-level bid/ask volume derived from ticks or exchange ladder data                          | The ladder needs per-price participation, not just OHLCV                           |
| Volume Footprint             | `OrderFlowBar[]` with `levels` and `totalVolume`           | Price-level total volume with optional bid/ask split                                           | The chart can ignore side attribution, but it still needs price-level distribution |
| Visible-Range Volume Profile | `OrderFlowBar[]` with `levels`                             | Same bars used by the footprint                                                                | The profile aggregates volume by price across a chosen scope                       |
| Session Volume Profile       | `OrderFlowBar[]` plus `sessionId` or `SessionDefinition[]` | Session-aware normalized bars                                                                  | Session boundaries control profile resets and labeling                             |
| Delta Summary                | Same bars used by the footprint                            | Bars with explicit `delta` and `totalVolume` values                                            | The subchart is aligned context, not a separate feed                               |
| VWAP                         | Bars with price-at-volume detail                           | Tick-level trade data or per-level price-volume                                                | Execution-quality VWAP depends on higher-resolution pricing and volume             |
| Volume Delta Pivot           | Display bars plus lower-timeframe bars                     | Lower-timeframe intrabars that already carry delta, with OHLC-volume fallback only when needed | The zero-anchored candle shape depends on intrabar delta path                      |

## Practical Guidance

### Footprint and volume footprint

Use real price-level aggregation whenever possible. If the host only has OHLCV bars, you can still
build an educational or placeholder rendering by synthesizing ladder levels, but it should be
treated as an approximation instead of a trading-grade feed.

When footprint coverage is partial, keep the chart visible and degrade gracefully:

- use completed price-level minute bars where available
- keep the active bar partial with `OrderFlowPatch` upserts
- fall back to `ohlc-synthetic` bars when footprint levels are missing for a session

This degraded path is also the correct behavior for vendors that only expose minute aggregates. For
example, Polygon.io / Massive REST on the current Basic plan can provide `OHLCV`, `VWAP`, and
transaction counts, but it cannot provide historical stock trades or quotes needed for true
aggressor-side footprint reconstruction.

When the provided ladder levels are sparse, aggregated, or synthesized, pass the instrument tick
size through `footprintOptions.ladder.priceStep` so the renderer can preserve a constant price grid
while zooming.

If the host wants a different visualization grid, preprocess the bars with the public `mintick`
helpers and then set `footprintOptions.ladder.priceStep` to that same `mintick` value. Larger
values cluster multiple source levels together. Smaller values preserve the original source levels
and allow zero-volume intermediate rows to be rendered between them.

### Profiles

Profiles are derived from the same normalized bars used by the footprint. If your bars already
contain accurate level totals, no separate profile feed is required.

### VWAP

The library can compute VWAP from normalized bars, including per-level totals when present. That is
useful for demo flows and general chart context.

If the host application needs execution-grade VWAP semantics, prefer:

- trade ticks
- one-second bars with price-at-volume detail
- upstream VWAP values produced from the original trade stream

### Candle Heatmap

The candle heatmap is the lightest-weight public charting surface in the package. It only needs:

- `time`
- `open`
- `high`
- `low`
- `close`
- one metric accessor that returns a normalized bar score

Typical inputs include:

- probability scores in the range `0..1`
- percentile ranks in the range `0..1`
- normalized factor scores remapped into a bounded domain

Use `buildCandleHeatmapSeriesData()` when you want to keep ordinary candles but encode the second
variable into the candle color.

### Volume Delta Pivot

`buildVolumeDeltaPivotSeriesData()` accepts:

- `chartBars`
  The bars visible on the primary chart. If they include an explicit `delta`, that value is used
  directly.
- `lowerTimeframeBars`
  Bars inside each displayed bar, used to trace the intrabar delta path. Explicit per-bar `delta`
  is preferred over classifying total volume by candle direction.

For a 5-minute chart, 1-minute intrabars are the recommended baseline. If no lower-timeframe bars
are available, the function falls back to the displayed bars and still returns a zero-anchored
series, but the candle path becomes less informative. If no explicit delta is present, the builder
falls back to classifying signed volume from OHLC direction.

## Normalization Helpers

Use these helpers to move feed-specific payloads into the public contracts:

- `normalizeOrderFlowBatch()`
  Sorts and normalizes a full dataset
- `normalizeOrderFlowPatch()`
  Normalizes an incremental update
- `applyOrderFlowPatch()`
  Applies a patch to an existing bar set
- `aggregateOrderFlowBarsByInterval()`
  Derives higher-interval footprint bars from lower-interval normalized bars
- `aggregateMarketBarsByInterval()`
  Derives higher-interval candle summaries from lower-interval summaries
- `buildAggregatedMarketBarsFromOrderFlowBars()`
  Converts footprint-capable bars into candle summaries when a separate OHLCV file is not available
- `buildOrderFlowBarsFromTicks()`
  Materializes tick-derived bars from a batch of trades and optional quotes
- `createOrderFlowTickStreamController()`
  Accepts live or replay tick pushes and emits append or upsert bar patches
- `resolveSessions()`
  Maps timestamps into session identifiers

## What To Keep Out Of This Package

The package should not own:

- broker SDK payloads
- gateway connection logic
- exchange-specific contract resolution
- credentials or transport retries
- raw vendor licensing concerns

Those belong in the host application or in local-only tooling that prepares source-managed fixtures.
