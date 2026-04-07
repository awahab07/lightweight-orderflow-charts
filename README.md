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
- `docs/MINTICK.md`
  Price clustering, bucketing semantics, and public `mintick` helpers
- `docs/FORMATTING.md`
  Price, compact value, and metric-style palette controls for footprint text
- `docs/FOCUS.md`
  Vertical-only chart focus helper for rescuing off-screen or tiny order-flow views
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
- `resolveSessions()`

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

For data-source changes, the package also exposes a focus helper that can rescue the viewport after a
restore or feed switch:

```ts
import { focusOrderFlowChart } from 'lightweight-orderflow-charts';

focusOrderFlowChart(chart, orderFlowBars, {
  paneIndex: 0,
});
```

The helper recenters the current visible middle bar when it is off-screen and zooms in when that bar
would otherwise occupy too little vertical space.

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

The repo contains two demo entry points:

- Learn mode at `#/`
  Educational kitchen sink with six controls: `Preset`, `Theme`, `Date`, `Symbol`, `Interval`,
  and `Lessons`
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
- `data/market`
  Source-managed market fixtures used by the demo and verification flows, not by the published dist

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
npm run demo:build
```
