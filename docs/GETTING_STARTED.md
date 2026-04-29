# Getting Started

This guide is for a developer who already knows the basics of `lightweight-charts`, but is new to
`lightweight-orderflow-charts` and wants to reach a first working footprint chart as quickly as
possible.

## What This Library Does

`lightweight-orderflow-charts` does **not** replace `lightweight-charts`. You still create and own
the host chart yourself.

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

If you do not already have normalized order-flow bars, read `DATA_REQUIREMENTS.md` first.

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

Minimal example:

```ts
import type { OrderFlowBar } from 'lightweight-orderflow-charts';

const orderFlowBars: OrderFlowBar[] = [
  {
    time: 1741626900,
    open: 402.35,
    high: 402.62,
    low: 402.18,
    close: 402.54,
    totalVolume: 48210,
    delta: 3610,
    levels: [
      { price: 402.2, bidVolume: 1200, askVolume: 1640, totalVolume: 2840, delta: 440 },
      { price: 402.21, bidVolume: 980, askVolume: 1320, totalVolume: 2300, delta: 340 },
      { price: 402.22, bidVolume: 1440, askVolume: 1180, totalVolume: 2620, delta: -260 },
    ],
  },
];
```

For full guidance, continue with:

- `DATA_REQUIREMENTS.md`
- `TICK_DATA.md`
- `MINTICK.md`

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
      visible: true,
      style: 0,
    },
    horzLines: {
      color: ORDER_FLOW_THEME_PRESETS.smoothLight.surface.gridColor,
      visible: true,
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

const tickSize = 0.01;

const footprint = chart.addCustomSeries(
  createFootprintSeries({
    ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
    ...ORDER_FLOW_THEME_PRESETS.smoothLight.footprint,
    ladder: {
      ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint.ladder,
      priceStep: tickSize,
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

- `DATA_REQUIREMENTS.md`
  Understand what each study needs from your host data pipeline
- `API_REFERENCE.md`
  Review the public exports available from the core and React entry points
- `FORMATTING.md`
  Tune price formatting, compact values, imbalance text, and ladder presentation
- `CHART_STATE.md`
  Persist viewport state in URLs or other storage
