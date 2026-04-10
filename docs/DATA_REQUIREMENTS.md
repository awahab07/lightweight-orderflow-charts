# Data Requirements

This package is intentionally broker-neutral. It does not assume a specific market-data vendor,
gateway, or transport. The host application is responsible for translating upstream payloads into
the public contracts exported by `lightweight-orderflow-charts`.

The current demo fixtures still reconstruct footprint ladders from stored bars when tick data is not
available. Treat that path as `sourceMode: 'ohlc-synthetic'` rather than trading-grade footprint
history. See `TICK_DATA.md` for the recommended storage and replay contract when true trade or quote
ticks are available.

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
- `SessionDefinition`
  Session templates for study resets and per-session overlays
- `OrderFlowPatch`
  Incremental updates for append, upsert, replace, and remove flows

## Study Matrix

| Study                        | Minimum Input                                              | Recommended Input                                                                              | Why                                                                                |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
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

When tick coverage is partial, keep the chart visible and degrade gracefully:

- use completed tick-derived bars where available
- keep the active bar partial with `OrderFlowPatch` upserts
- fall back to `ohlc-synthetic` bars when ticks are missing for a session

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

### Volume Delta Pivot

`buildVolumeDeltaPivotSeriesData()` accepts:

- `chartBars`
  The bars visible on the primary chart. If they include an explicit `delta`, that value is used
  directly.
- `lowerTimeframeBars`
  Bars inside each displayed bar, used to trace the intrabar delta path. Explicit per-bar `delta`
  is preferred over classifying total volume by candle direction.

For a 5-minute chart, 1-minute or 1-second intrabars are better than reusing the 5-minute bars. If
no lower-timeframe bars are available, the function falls back to the displayed bars and still
returns a zero-anchored series, but the candle path becomes less informative. If no explicit delta
is present, the builder falls back to classifying signed volume from OHLC direction.

## Normalization Helpers

Use these helpers to move feed-specific payloads into the public contracts:

- `normalizeOrderFlowBatch()`
  Sorts and normalizes a full dataset
- `normalizeOrderFlowPatch()`
  Normalizes an incremental update
- `applyOrderFlowPatch()`
  Applies a patch to an existing bar set
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
