# Tick-Derived Minute Aggregation

This package remains broker-neutral, but real order-flow systems still need an opinionated answer for
how to store, describe, and consume tick-derived market data. The preferred answer is no longer raw
tick archives in source-managed fixtures. Instead, capture tooling should aggregate vendor ticks into
broker-neutral `1m` artifacts that can drive both footprint charts and bar-based studies.

## Preferred Storage Layout

Canonical checked-in fixtures:

- `data/market/instruments.json`
- `data/market/<symbol>/<session-date>/bars-1m.json`
- `data/market/<symbol>/<session-date>/orderflow-1m.json`
- `data/market/<symbol>/<session-date>/session-manifest.json`

Local vendor cache:

- `connectors/vendors/<vendor>/data/<symbol>/instrument.json`
- `connectors/vendors/<vendor>/data/<symbol>/<session-date>/bars-1m.json`
- `connectors/vendors/<vendor>/data/<symbol>/<session-date>/orderflow-1m.json`
- `connectors/vendors/<vendor>/data/<symbol>/<session-date>/session-manifest.json`

Legacy raw tick files may still exist during migration, but they are no longer the preferred
canonical contract.

The source-managed `data/` tree intentionally ignores per-session raw metadata such as
`instrument.json`, `quotes-meta.json`, `quotes.ndjson.gz`, `ticks-manifest.json`, and
`trades-meta.json`. Those files remain valid local cache artifacts under connector-owned vendor
directories, but they are not part of the checked-in demo dataset.

For candle-summary-only vendors, `orderflow-1m.json` is intentionally absent and the manifest records
`orderFlowAvailable: false`.

## Minute Candle Contract

`bars-1m.json` stores broker-neutral candle summaries:

```ts
type AggregatedMarketBar = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  tradeCount?: number;
  bidVolume?: number;
  askVolume?: number;
  delta?: number;
  deltaMin?: number;
  deltaMax?: number;
  pocPrice?: number;
  pocVolume?: number;
};
```

Required fields:

- `time`
- `open`
- `high`
- `low`
- `close`
- `volume`

Optional fields should be populated when the upstream feed or tick-derived aggregation can support
them. For IBKR `TRADES` bars, `vwap` and `tradeCount` are available directly from the vendor. When
tick-derived price levels are present, `bidVolume`, `askVolume`, `delta`, `pocPrice`, and
`pocVolume` can also be written.

Polygon.io / Massive REST on the current Basic plan is an example of a candle-summary-only source:
it can supply `OHLCV`, `VWAP`, and trade counts through minute aggregates, but not the historical
trades or quotes needed to derive true bid-side and ask-side participation.

## Footprint-Capable Minute Contract

`orderflow-1m.json` stores the primary footprint input:

```ts
type OrderFlowBar = {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume?: number;
  delta?: number;
  bidVolume?: number;
  askVolume?: number;
  tradeCount?: number;
  vwap?: number;
  pocPrice?: number;
  pocVolume?: number;
  deltaMin?: number;
  deltaMax?: number;
  levels: Array<{
    price: number;
    bidVolume: number;
    askVolume: number;
    totalVolume?: number;
    delta?: number;
    tradeCount?: number;
  }>;
};
```

The essential information is minute + price + bid-volume + ask-volume. The nested level array is the
compact representation used by the library and is sufficient to derive accurate `5m` footprint bars
from stored `1m` data.

## Session Manifest Contract

`session-manifest.json` is the stable entry point for repo-managed or vendor-cached sessions:

```ts
type AggregatedSessionManifest = {
  symbol: string;
  sessionDate: string;
  timezone: string;
  sourceMode: 'tick-derived' | 'price-level-bars' | 'ohlc-synthetic';
  baseIntervalSeconds: 60;
  candlesAvailable: boolean;
  orderFlowAvailable: boolean;
  complete: boolean;
  rawTicksStored: false;
  capture?: {
    includeTicks: boolean;
    lastCompleteBarTime: number | null;
    updatedAt: string;
  };
  files: Array<{
    file: string;
    kind: 'market-bars' | 'order-flow-bars';
    intervalSeconds: 60;
    barCount: number;
    complete: boolean;
  }>;
};
```

Recommended semantics:

- `complete: true`
  The stored minute session covers the intended historical range for that session
- `complete: false`
  The cache can be resumed and the trailing minute should be rewritten on the next run
- `orderFlowAvailable: false`
  Only candle summaries are available, so footprint rendering should degrade to `ohlc-synthetic`
- `rawTicksStored: false`
  Raw vendor ticks are transient capture inputs, not the canonical stored fixture

## Higher Interval Derivation

Higher intervals such as `5m` should be derived from `1m` files:

- `aggregateOrderFlowBarsByInterval()`
  Use when footprint-capable `1m` levels are available
- `aggregateMarketBarsByInterval()`
  Use when only candle summaries are available
- `buildAggregatedMarketBarsFromOrderFlowBars()`
  Use when you need candle summaries but only `OrderFlowBar[]` is present

This keeps the canonical storage surface small while preserving accurate footprint reconstruction.

## Replay And Live Updates

The public replay or live streaming surface remains controller-based:

Typical host flow:

```ts
import {
  applyOrderFlowPatch,
  createOrderFlowTickStreamController,
  type OrderFlowBar,
} from 'lightweight-orderflow-charts';

let bars: OrderFlowBar[] = [];
const controller = createOrderFlowTickStreamController({
  instrument,
  intervalSeconds: 300,
});

function onTickUpdate(update) {
  const result = controller.push(update);

  for (const patch of result.patches) {
    bars = applyOrderFlowPatch(bars, patch);
  }

  render(bars);
}
```

The controller owns:

- interval bucketing
- active-bar rollover
- quote-aware or tick-rule trade classification
- `append` versus `upsert` patch emission

Consumers only need to push normalized `TradeTick` or `QuoteTick` updates in timestamp order.

The playground `Stream` toggle still demonstrates this pattern when legacy raw tick fixtures are
available. The preferred storage contract, however, is the aggregated `1m` output rather than the raw
tick archive.

## Capture Guidance

Historical tick feeds are commonly rate-limited and chunk-limited. Capture tooling should therefore:

- request vendor bars and historical ticks with pacing-aware delays
- rewrite the trailing stored minute before resuming
- treat raw ticks as transient inputs used to build `orderflow-1m.json`
- keep vendor-specific caches under `connectors/vendors/<vendor>/data`
- promote only curated sessions into checked-in `data/market/`

That capture logic stays local-only. The library contract is the normalized minute output, not the
broker SDK.
