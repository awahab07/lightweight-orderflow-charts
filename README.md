# Lightweight Order Flow Charts

Reusable order-flow charts, studies, and React bindings for applications built on
`lightweight-charts`.

This package is designed for host apps that already own chart creation, market-data ingestion, and
layout orchestration, but need a clean, broker-neutral rendering layer for footprint charts,
profiles, VWAP, and aligned order-flow subcharts.

## Highlights

- Footprint and volume-footprint custom series built on the same renderer pipeline
- Visible-range and session volume profile primitives with configurable left/right alignment
- Footprint-level point-of-control highlighting plus inline imbalance and stacked-imbalance styling
- Metric badges that can be stacked above or below each footprint bar with custom formatters and
  per-bar styling
- Theme-level metric style palettes so imbalance text, candle-side metrics, and summary badges can
  share consistent positive/negative styling
- Scale-driven shading for footprint cells and delta-summary tables
- Delta-summary subchart with selectable row keys and configurable row color scales
- Volume Delta Pivot data builder for zero-anchored delta candles
- Public style presets and public theme presets so consumers can start from working baselines
- Backend-neutral contracts plus normalization and patch helpers for feed adapters

## Package Entry Points

- Core API: `lightweight-orderflow-charts`
- React API: `lightweight-orderflow-charts/react`

## Installation

```bash
npm install lightweight-orderflow-charts lightweight-charts react react-dom
```

`lightweight-charts` is required. `react` and `react-dom` are optional peers for the React
bindings.

Review `docs/ATTRIBUTION.md` before shipping a user-facing application. `lightweight-charts`
requires TradingView attribution for deployed charts.

## Development

```bash
npm ci
npm run check
npm run demo:build
```

Common local commands:

- `npm run demo`
  Starts the demo application from `demo/`
- `npm run demo:connect-bridge`
  Starts the local connector bridge used by the repo-side `Connect` demo page
- `npm run connector:ibkr:capture -- --help`
  Runs the resumable IBKR historical capture CLI that writes aggregated minute data into the local vendor cache
- `npm run connector:polygon:capture -- --help`
  Runs the Polygon.io / Massive REST capture CLI for minute aggregates using an environment-provided API key
- `npm run format`
  Applies the shared Prettier formatting rules
- `npm run format:check`
  Verifies formatting without writing changes
- `npm run ci`
  Runs the full repository verification flow used by CI

See `CONTRIBUTING.md` for the short contributor workflow.

## Documentation Map

- `docs/index.md`
  Publishable docs entry point for GitHub Pages or a static docs generator
- `docs/DATA_REQUIREMENTS.md`
  What each chart or study needs from the host data pipeline
- `docs/TICK_DATA.md`
  Aggregated minute storage, local vendor cache layout, and replay guidance
- `docs/MINTICK.md`
  Price clustering, bucketing semantics, and public `mintick` helpers
- `docs/FORMATTING.md`
  Price, compact value, and metric-style palette controls for footprint text
- `docs/AUTO_FIT.md`
  Price-scale auto-fit helper for TradingView-style `Auto (fits data to screen)` behavior
- `docs/FEATURE_INVENTORY.md`
  Concise label-and-description inventory of the public charting features and presets
- `docs/THEORY.md`
  Rendering guidance derived from the order-flow research material maintained in the outer SDD
  workspace
- `docs/ARCHITECTURE.md`
  Source-tree responsibilities, extension points, and contributor guidance
- `docs/CHART_STATE.md`
  Reusable viewport snapshot and restore helpers for URL sync or other persistence layers
- `docs/ATTRIBUTION.md`
  TradingView attribution and notice guidance inherited from `lightweight-charts`

## Core Data Contract

The package works with normalized order-flow bars rather than raw broker payloads:

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
  }>;
};
```

The key idea is that the host application owns feed-specific translation and hands the library a
clean, stable contract.

Useful helpers when your upstream feed is not already normalized:

- `normalizeOrderFlowBatch()`
- `normalizeOrderFlowPatch()`
- `applyOrderFlowPatch()`
- `aggregateOrderFlowBarsByInterval()`
- `aggregateMarketBarsByInterval()`
- `buildAggregatedMarketBarsFromOrderFlowBars()`
- `buildOrderFlowBarsFromTicks()`
- `createOrderFlowTickStreamController()`
- `resolveSessions()`

The preferred canonical demo layout is now `1m`-based:

- `bars-1m.json`
  Candle summaries with required OHLCV plus optional `vwap`, `tradeCount`, `bidVolume`,
  `askVolume`, `delta`, `deltaMin`, `deltaMax`, `pocPrice`, and `pocVolume`
- `orderflow-1m.json`
  Footprint-capable `OrderFlowBar[]` with per-price bid/ask participation

The demo derives higher intervals such as `5m` from those `1m` files instead of storing separate
canonical interval files. Local vendor capture now writes into `connectors/vendors/<vendor>/data/`
as a cache-first source, while checked-in demo fixtures stay under `data/market/`.

Not every vendor cache is footprint-capable. IBKR can produce `orderflow-1m.json` when historical
ticks are requested, while Polygon.io / Massive REST on the current Basic plan only provides
`bars-1m.json` plus a manifest with `orderFlowAvailable: false`.

## Choose The Right Study

| Study                            | Best Input                           | Notes                                                                                                            |
| -------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Footprint                        | Price-level bid/ask volume per bar   | Primary view for ladder-level order-flow analysis                                                                |
| Volume Footprint                 | Price-level total volume per bar     | Useful when total participation matters more than aggressor side                                                 |
| Visible / Session Volume Profile | Price-level volume across a scope    | Built from normalized bars and aggregated by price                                                               |
| VWAP                             | Tick-level or price-at-volume data   | Can fall back to bar aggregates, but execution-quality VWAP should come from higher-resolution data              |
| Delta Summary                    | Same bars used by the footprint      | Keeps delta context aligned to the chart time axis                                                               |
| Volume Delta Pivot               | Chart bars plus lower-timeframe bars | Best results come from lower-timeframe bars that already carry delta, with OHLC-volume fallback only when needed |

See `docs/DATA_REQUIREMENTS.md` for the full integration guidance.

## Public Presets

Two preset layers are published:

- `ORDER_FLOW_STYLE_PRESETS`
  Study-level defaults for footprint, volume-footprint, profiles, and delta summary
- `ORDER_FLOW_THEME_PRESETS`
  10 theme packs with 5 dark and 5 light variants, each combining chart-surface colors with study
  styling overrides

The published presets now include:

- `ORDER_FLOW_STYLE_PRESETS.orderFlowReference`
  A letter-delimited order-flow ladder baseline with thin candle strips, delta-colored row fills,
  diagonal-dominance text emphasis, and edge-only POC outlines
- `ORDER_FLOW_THEME_PRESETS.smoothLight`
  The light order-flow surface used by the demo default, with red/green row shading and blue
  diagonal-dominance text

Use style presets when you want a strong starting point for a specific study configuration. Use
theme presets when you want to re-skin an existing chart composition without changing the study
layout itself.

```ts
import { ORDER_FLOW_STYLE_PRESETS, ORDER_FLOW_THEME_PRESETS } from 'lightweight-orderflow-charts';

const shaded = ORDER_FLOW_STYLE_PRESETS.shadedReference;
const midnight = ORDER_FLOW_THEME_PRESETS.midnightTerminal;
```

## Price Grid Integrity And Mintick

If the host application provides sparse or aggregated ladder levels, set `ladder.priceStep` to the
instrument tick size so row geometry remains deterministic while zooming:

```ts
const options = {
  ladder: {
    priceStep: 0.01,
  },
};
```

This is especially important when:

- ladder levels were synthesized from OHLCV bars
- the upstream feed omits zero-volume prices
- the host wants every rendered row to respect a constant tick grid

When the host wants a different visual ladder, use the public `mintick` helpers and keep
`priceStep` aligned to the same value:

```ts
import {
  clusterOhlcBarsByMintick,
  clusterOrderFlowBarsByMintick,
} from 'lightweight-orderflow-charts';

const mintick = 0.05;

const clusteredOrderFlowBars = clusterOrderFlowBarsByMintick(
  orderFlowBars,
  mintick,
  instrument.tickSize,
);
const clusteredChartBars = clusterOhlcBarsByMintick(chartBars, mintick, instrument.tickSize);
```

Larger `mintick` values cluster multiple source levels into broader buckets. Smaller positive values
such as `0.005` preserve the source levels and let the renderer show zero-volume intermediate rows.

See `docs/MINTICK.md` for the full bucketing rules and integration guidance.

## Footprint Text Formatting

Footprint text formatting is split into two surfaces so a host can keep prices precise while
abbreviating large ladder quantities:

```ts
const footprintOptions = {
  style: {
    priceDecimalDigits: 2,
    priceRounding: 'ceil',
    valueIntegerDigits: 2,
    valueDecimalDigits: 1,
    valueRounding: 'ceil',
    valueUnitVisible: true,
  },
};
```

- `priceDecimalDigits` and `priceRounding`
  Used for price-oriented values such as `open`, `high`, `low`, and `close`
- `valueIntegerDigits`, `valueDecimalDigits`, `valueRounding`, and `valueUnitVisible`
  Used for compact ladder values such as `12.3k`

For order-flow ladder presentation, the same public option surface also exposes:

- `ladder.bidAskFillMode`
- `ladder.separatorMode`, `ladder.separatorLabel`, and `ladder.separatorGap`
- `ladder.highlightImbalanceText`
- `ladder.imbalanceRatio`
- `pointOfControl.visible`, `pointOfControl.borderColor`, and `pointOfControl.borderWidth`
- `style.separatorColor` and `style.separatorFont`
- `style.positiveImbalanceTextColor`, `style.positiveImbalanceTextFont`,
  `style.negativeImbalanceTextColor`, and `style.negativeImbalanceTextFont`

These controls let a consumer reproduce layouts such as a letter-delimited `bid x ask` ladder,
delta-driven row shading, a separator gutter that inherits the row background, and positive/negative
imbalance text emphasis derived from the same diagonal comparison used by the footprint metrics.

See `docs/FORMATTING.md` for the full formatting surface.

## Chart View State

The package exposes viewport snapshot helpers for persistence:

```ts
import { captureChartViewState, restoreChartViewState } from 'lightweight-orderflow-charts';

const snapshot = captureChartViewState(chart);
restoreChartViewState(chart, snapshot);
```

The returned snapshot is JSON-safe, so a consuming application can store it in a URL, local
storage, or another persistence layer without the library directly owning those policies.

For hosts that want TradingView-style vertical autoscaling after restore or a data swap, the package
also exposes an auto-fit helper:

```ts
import { setPriceScaleAutoFit } from 'lightweight-orderflow-charts';

setPriceScaleAutoFit(chart, true, {
  paneIndex: 0,
  topInsetRatio: 0.05,
  bottomInsetRatio: 0.05,
});
```

The helper turns on the chart library's built-in price autoscaling with explicit top and bottom
insets, so the visible data stays fitted while the user pans until they switch back to manual
scaling.

## Vanilla Quick Start

```ts
import { ColorType, createChart } from 'lightweight-charts';
import {
  ORDER_FLOW_STYLE_PRESETS,
  ORDER_FLOW_THEME_PRESETS,
  createDeltaSummarySeries,
  createFootprintSeries,
  createVolumeProfilePrimitive,
} from 'lightweight-orderflow-charts';

const chart = createChart(container, {
  layout: {
    background: {
      color: ORDER_FLOW_THEME_PRESETS.chartDarkPro.surface.backgroundColor,
      type: ColorType.Solid,
    },
    textColor: ORDER_FLOW_THEME_PRESETS.chartDarkPro.surface.textColor,
    attributionLogo: true,
  },
});

const footprint = chart.addCustomSeries(
  createFootprintSeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
    ...ORDER_FLOW_THEME_PRESETS.chartDarkPro.footprint,
  }),
  undefined,
  0,
);

footprint.setData(orderFlowBars);

footprint.attachPrimitive(
  createVolumeProfilePrimitive({
    bars: orderFlowBars,
    options: {
      ...ORDER_FLOW_STYLE_PRESETS.shadedReference.volumeProfile,
      ...ORDER_FLOW_THEME_PRESETS.chartDarkPro.volumeProfile,
    },
  }),
);

const deltaSummary = chart.addCustomSeries(
  createDeltaSummarySeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.deltaSummary,
    ...ORDER_FLOW_THEME_PRESETS.chartDarkPro.deltaSummary,
  }),
  undefined,
  1,
);

deltaSummary.setData(orderFlowBars);
```

## React Quick Start

```tsx
import {
  ChartProvider,
  DeltaSummarySeries,
  FootprintSeries,
  VolumeProfile,
} from 'lightweight-orderflow-charts/react';
import {
  ORDER_FLOW_THEME_PRESETS,
  ORDER_FLOW_STYLE_PRESETS,
  type OrderFlowBar,
  type TimeValue,
} from 'lightweight-orderflow-charts';

function OrderFlowPane({ bars, chart }: { bars: OrderFlowBar[]; chart: IChartApi | null }) {
  return (
    <ChartProvider chart={chart}>
      <FootprintSeries
        chart={chart}
        data={bars}
        paneIndex={0}
        options={{
          ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
          ...ORDER_FLOW_THEME_PRESETS.depthHeat.footprint,
        }}
      />

      <VolumeProfile
        data={bars}
        options={{
          ...ORDER_FLOW_STYLE_PRESETS.shadedReference.volumeProfile,
          ...ORDER_FLOW_THEME_PRESETS.depthHeat.volumeProfile,
        }}
      />

      <DeltaSummarySeries
        chart={chart}
        data={bars}
        paneIndex={1}
        options={{
          ...ORDER_FLOW_STYLE_PRESETS.shadedReference.deltaSummary,
          ...ORDER_FLOW_THEME_PRESETS.depthHeat.deltaSummary,
        }}
      />
    </ChartProvider>
  );
}
```

## Demo

The repo contains three demo entry points:

- Learn mode at `#/`
  Educational kitchen sink with six controls: `Preset`, `Theme`, `Date`, `Symbol`, `Interval`,
  and `Lessons`
- Connect at `#/connect`
  Demo-only direct vendor flow with `Preset`, `Theme`, `Date`, `Symbol`, `Interval`, `Mintick`,
  plus icon actions for save, direct retrieval, and connector status
- Playground at `#/playground`
  Advanced view for trying lower-level fixtures and renderer combinations

Learn mode is built around conceptual presets such as:

- `Ladder Fundamentals`
- `Delta-First Read`
- `Absorption`
- `Stacked Imbalances`
- `Volume Profile Shape`
- `Session Map`
- `Volume Footprint`
- `Volume Delta Pivot`

The theme selector applies one of the published `ORDER_FLOW_THEME_PRESETS`, so the same concept can
be re-skinned without changing the underlying study composition.

## Source Layout

- `src/models`
  Public contracts, option types, defaults, and merge helpers
- `src/presets`
  Published style packs and theme packs
- `src/adapters`
  Normalization and patch/session helpers
- `src/calculations`
  Footprint, profile, VWAP, and volume-delta derivations
- `src/renderers/footprint-series`
  Footprint and volume-footprint custom-series implementation
- `src/renderers/primitives`
  Volume profile, session profile, annotation, and VWAP primitives
- `src/renderers/delta-summary-series`
  Table-style custom-series implementation
- `src/react`
  Thin lifecycle wrappers around the core renderers
- `demo/src/content`
  Learn-mode concept presets, lessons, and educational mappings
- `demo/src/fixtures`
  Playground and test-oriented fixture data
- `connectors/`
  Repo-side, non-dist connector bridge, vendor adapters, and persistence helpers used by the
  `Connect` demo surface
- `data/market`
  Source-managed market fixtures used by the demo and verification flows, not by the published dist

## Repo-Side Connectors

The `connectors/` tree is intentionally a repo-side integration layer rather than part of the
published npm surface.

- The browser demo never talks to vendor sockets directly.
- The `Connect` page uses a local HTTP plus SSE bridge started with `npm run demo:connect-bridge`.
- Vendor adapters such as IBKR live under `connectors/vendors/`.
- The bridge writes to `data/market` by default, but `CONNECTOR_MARKET_DATA_ROOT` can point it at an
  alternate location for safe experimentation.

See `connectors/README.md` for the connector protocol, bridge workflow, and extension guidance.

## Extension Guide

When adding a new study or enhancing an existing one:

1. Add or refine public option types in `src/models/options.ts`
2. Add the calculation or aggregation logic under `src/calculations`
3. Thread the new behavior into the renderer or primitive layer
4. Publish a reusable preset under `src/presets`
5. Expose the API from `src/index.ts` and `src/react.ts` when needed
6. Add a focused test under `tests/unit` or `tests/integration`
7. Add a learn-mode concept or lesson only when it meaningfully teaches the feature

## Development

```bash
npm run typecheck
npm run test
npm run build
npm run demo
npm run demo:connect-bridge
npm run demo:build
```
