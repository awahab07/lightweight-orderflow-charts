# Getting Started

This guide is for a developer who already knows the basics of
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts), but is new
to `lightweight-orderflow-charts` and wants to reach a first working footprint chart as quickly as
possible.

## What This Library Does

`lightweight-orderflow-charts` does **not** replace
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts). You still
create and own the host chart yourself.

This package adds:

- footprint and volume-footprint renderers
- aligned delta-summary and volume-delta subcharts
- visible-range and session profile primitives
- theme and style presets for common order-flow layouts
- React wrappers for the same public charting surface

## Before You Start

You need four things:

1. A DOM container for the host chart
2. A `lightweight-charts` chart instance
3. Normalized `OrderFlowBar[]` data
4. A tick size, or a visualization `mintick`, that you can keep aligned with the footprint grid

If you do not already have normalized order-flow bars, read
[`DATA_REQUIREMENTS.md`](./DATA_REQUIREMENTS.md) first.

Runnable companion sandbox:

- [codesandbox.io/p/sandbox/lightweight-orderflow-charts-getting-started-6trsnf](https://codesandbox.io/p/sandbox/lightweight-orderflow-charts-getting-started-6trsnf)

## Step 1. Install The Dependencies

For a vanilla setup:

```bash
npm install lightweight-orderflow-charts lightweight-charts
```

If you plan to use the React bindings as well:

```bash
npm install react react-dom
```

## Step 2. Create A Host Chart Container

The package renders into a chart you already created. Start with a simple container:

```html
<div id="chart" style="width: 960px; height: 640px"></div>
```

Use an explicit height. If the container collapses, the chart will not render correctly.

## Step 3. Prepare Normalized Footprint Data

The primary input for a footprint chart is `OrderFlowBar[]`.

At minimum, each bar needs:

- `time`
- `open`
- `high`
- `low`
- `close`
- `levels`

Each level needs:

- `price`
- `bidVolume`
- `askVolume`

This example uses three 5-minute bars that start at `09:30 EST` on `2026-03-10`, a `0.1`
visualization `mintick`, and a shared point of control aligned at `402.2` across all three bars.

Example dataset:

```ts
import type { OrderFlowBar } from 'lightweight-orderflow-charts';

const orderFlowBars: OrderFlowBar[] = [
  {
    time: 1773153000,
    open: 402.0,
    high: 402.3,
    low: 402.0,
    close: 402.3,
    totalVolume: 7410,
    delta: 1490,
    levels: [
      { price: 402.0, bidVolume: 700, askVolume: 980, totalVolume: 1680, delta: 280 },
      { price: 402.1, bidVolume: 760, askVolume: 1040, totalVolume: 1800, delta: 280 },
      { price: 402.2, bidVolume: 820, askVolume: 1500, totalVolume: 2320, delta: 680 },
      { price: 402.3, bidVolume: 680, askVolume: 930, totalVolume: 1610, delta: 250 },
    ],
  },
  {
    time: 1773153300,
    open: 402.2,
    high: 402.5,
    low: 402.2,
    close: 402.5,
    totalVolume: 8110,
    delta: 1750,
    levels: [
      { price: 402.2, bidVolume: 900, askVolume: 1600, totalVolume: 2500, delta: 700 },
      { price: 402.3, bidVolume: 860, askVolume: 1220, totalVolume: 2080, delta: 360 },
      { price: 402.4, bidVolume: 780, askVolume: 1180, totalVolume: 1960, delta: 400 },
      { price: 402.5, bidVolume: 640, askVolume: 930, totalVolume: 1570, delta: 290 },
    ],
  },
  {
    time: 1773153600,
    open: 402.3,
    high: 402.3,
    low: 402.0,
    close: 402.0,
    totalVolume: 8970,
    delta: -1950,
    levels: [
      { price: 402.0, bidVolume: 1180, askVolume: 760, totalVolume: 1940, delta: -420 },
      { price: 402.1, bidVolume: 1260, askVolume: 880, totalVolume: 2140, delta: -380 },
      { price: 402.2, bidVolume: 1700, askVolume: 980, totalVolume: 2680, delta: -720 },
      { price: 402.3, bidVolume: 1320, askVolume: 890, totalVolume: 2210, delta: -430 },
    ],
  },
];
```

For full guidance, continue with:

- [`DATA_REQUIREMENTS.md`](./DATA_REQUIREMENTS.md)
- [`TICK_DATA.md`](./TICK_DATA.md)
- [`MINTICK.md`](./MINTICK.md)

## Step 4. Create The Host Chart

Create the base chart with `lightweight-charts`, then apply a surface theme from this package:

```ts
import { ColorType, createChart } from 'lightweight-charts';
import { ORDER_FLOW_THEME_PRESETS } from 'lightweight-orderflow-charts';

const container = document.getElementById('chart');

if (!container) {
  throw new Error('Chart container was not found.');
}

const chart = createChart(container, {
  width: container.clientWidth,
  height: 640,
  layout: {
    background: {
      type: ColorType.Solid,
      color: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.backgroundColor,
    },
    textColor: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.textColor,
    attributionLogo: true,
  },
  grid: {
    vertLines: {
      color: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.gridColor,
      visible: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.gridVisible,
      style: 0,
    },
    horzLines: {
      color: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.gridColor,
      visible: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.gridVisible,
      style: 0,
    },
  },
});
```

## Step 5. Add Your First Footprint Series

Start from a style preset and a theme preset so the first chart uses a known-good configuration:

```ts
import {
  ORDER_FLOW_STYLE_PRESETS,
  ORDER_FLOW_THEME_PRESETS,
  createFootprintSeries,
} from 'lightweight-orderflow-charts';

const mintick = 0.1;

const footprint = chart.addCustomSeries(
  createFootprintSeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
    ...ORDER_FLOW_THEME_PRESETS.smoothLight.footprint,
    ladder: {
      ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint.ladder,
      priceStep: mintick,
    },
  }),
  undefined,
  0,
);
```

Two important notes:

1. `priceStep` should match your real tick size or chosen `mintick`
2. If you cluster price levels with the public `mintick` helpers, keep `ladder.priceStep` aligned to
   that same value

## Step 6. Set The Data And Fit The View

Once the series exists, set the normalized bars and fit the visible range:

```ts
footprint.setData(orderFlowBars);
chart.timeScale().fitContent();
```

If your container can resize, also remember to update the chart width on layout changes.

## Expected Result

Your first target is a rendered ladder chart with price rows, bid or ask participation, and candle
context all inside the same bar:

![Basic Footprint Chart](./images/chart-types/basic-footprint-chart.png)

If you do not see a footprint:

- confirm the container has a non-zero height
- confirm `levels` contains per-price bid or ask data
- confirm `ladder.priceStep` matches your intended price grid
- confirm your timestamps use the same shape expected by `lightweight-charts`

## Step 7. Add More Context

After the first footprint works, the next useful additions are:

- `createDeltaSummarySeries()`
  Add a synchronized order-flow summary pane
- `createVolumeProfilePrimitive()`
  Add a visible-range profile derived from the same bars
- `ORDER_FLOW_THEME_PRESETS`
  Re-skin the chart without changing the composition
- `clusterOrderFlowBarsByMintick()`
  Change the visual ladder resolution while keeping the source bars intact

## Explore The Working Surfaces

Use the public demo surfaces to compare known-good setups before integrating them into your own
application:

- Main demo:
  [awahab07.github.io/lightweight-orderflow-charts/latest/demo](https://awahab07.github.io/lightweight-orderflow-charts/latest/demo/)
- Theming:
  [awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/theming](https://awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/theming)
- Storybook:
  [awahab07.github.io/lightweight-orderflow-charts/latest/storybook](https://awahab07.github.io/lightweight-orderflow-charts/latest/storybook/)

## Next Reading

- [`DATA_REQUIREMENTS.md`](./DATA_REQUIREMENTS.md)
  Understand what each study needs from your host data pipeline
- [`API_REFERENCE.md`](./API_REFERENCE.md)
  Review the public exports available from the core and React entry points
- [`FORMATTING.md`](./FORMATTING.md)
  Tune price formatting, compact values, imbalance text, and ladder presentation
- [`CHART_STATE.md`](./CHART_STATE.md)
  Persist viewport state in URLs or other storage
