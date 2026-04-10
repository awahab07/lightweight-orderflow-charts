# Tick Data And Replay

This package remains broker-neutral, but real order-flow systems still need an opinionated answer for
how to store, describe, and consume tick data. This document defines that contract without making the
core renderer own gateway or broker logic.

## Current Demo Status

Today, the committed demo fixtures in `data/market/` contain:

- `instrument.json`
- `bars-1m.json`
- `bars-5m.json`
- `bars-15m.json`

The learn page and playground therefore reconstruct `OrderFlowBar[]` from stored OHLC bars via the
demo-only synthetic builder in `demo/src/lib/buildSyntheticOrderFlowFromBars.ts`.

That means the current shipped demo mode is:

- `sourceMode: 'ohlc-synthetic'`

The public charts and studies are already compatible with tick-derived bars. The missing piece is the
fixture layer, not the renderers.

## Recommended Storage Layout

Per symbol:

- `data/market/<symbol>/instrument.json`

Per session:

- `data/market/<symbol>/<session-date>/bars-1m.json`
- `data/market/<symbol>/<session-date>/bars-5m.json`
- `data/market/<symbol>/<session-date>/bars-15m.json`
- `data/market/<symbol>/<session-date>/ticks-manifest.json`
- `data/market/<symbol>/<session-date>/trades.ndjson.gz`
- `data/market/<symbol>/<session-date>/quotes.ndjson.gz`

If a session is too large for one compressed file, shard it:

- `trades-0001.ndjson.gz`
- `trades-0002.ndjson.gz`
- `quotes-0001.ndjson.gz`

The manifest remains the stable entry point even when the payload is sharded.

## Manifest Contract

The package now exports `TickSessionManifest` and `TickSessionChunk` to document the expected shape:

```ts
type TickSessionManifest = {
  symbol: string;
  sessionDate: string;
  timezone: string;
  sourceMode: 'tick-derived' | 'price-level-bars' | 'ohlc-synthetic';
  tradesAvailable: boolean;
  quotesAvailable?: boolean;
  complete: boolean;
  chunks?: Array<{
    file: string;
    kind: 'trades' | 'quotes';
    compression?: 'gzip' | 'none';
    timeFrom: number;
    timeTo: number;
    tickCount: number;
    complete?: boolean;
  }>;
  notes?: string[];
};
```

Recommended semantics:

- `complete: true`
  The session is closed and all intended chunks are present
- `complete: false`
  The host may still request more history or continue a live stream
- `sourceMode: 'tick-derived'`
  `OrderFlowBar[]` can be reconstructed from trade and optional quote ticks
- `sourceMode: 'price-level-bars'`
  The host has already aggregated ladder detail per bar
- `sourceMode: 'ohlc-synthetic'`
  The host only has bars and the ladder is approximate

## Tick Payload Contract

The package exports these additive contracts:

```ts
type TradeTick = {
  time: number;
  price: number;
  size: number;
  exchange?: string;
  side?: 'buy' | 'sell' | 'unknown';
  attributes?: Record<string, unknown>;
};

type QuoteTick = {
  time: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  attributes?: Record<string, unknown>;
};
```

Hosts can enrich those payloads, but these fields are enough to:

- classify aggressor side when the feed supports it
- aggregate price-level bid/ask participation
- derive partial bars during historical replay or live streaming

## Partial And Missing Tick Coverage

Consumer apps should not block the entire chart when ticks are missing or incomplete.

Recommended behavior:

- If `ticks-manifest.json` is missing, fall back to `bars-*.json` and mark the result as
  `sourceMode: 'ohlc-synthetic'`
- If tick files exist but `complete: false`, render completed bars plus the best partial bar available
- If only trades exist, derive footprint and delta from trades and treat quote-based aggressor
  classification as optional
- If a study needs more fidelity than the available source supports, keep the chart visible and reduce
  confidence rather than going blank

## Replay And Live Updates

The public streaming surface is already `OrderFlowPatch` plus `applyOrderFlowPatch()`.

Typical host flow:

```ts
import { applyOrderFlowPatch, type OrderFlowBar, type OrderFlowPatch } from 'lightweight-orderflow-charts';

let bars: OrderFlowBar[] = [];

function onReplayPatch(patch: OrderFlowPatch) {
  bars = applyOrderFlowPatch(bars, patch);
  render(bars);
}
```

Recommended patch semantics:

- `append`
  First appearance of a newly opened bar
- `upsert`
  Partial updates while the active bar is still forming
- `replace`
  Full reload after a jump, gap-fill, or historical refresh
- `remove`
  Correction or rollback for one or more times

The playground `Stream` toggle demonstrates this pattern by replaying progressive bar updates every
10 seconds against real selected TSLA/NVDA fixture data.

## Capture Guidance

Historical tick feeds are commonly rate-limited and chunk-limited. For example, the local IBKR capture
tool in the outer workspace already uses:

- 1000 ticks per historical request
- pacing-aware delays between requests
- resumable session state
- gzip compression after a session completes

That capture logic stays local-only. The library contract is the normalized output, not the broker SDK.
