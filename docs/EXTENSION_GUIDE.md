# Extension Guide

This page focuses on the most common kind of extension for this package: composing the public API
into a reusable helper for your own application, rather than forking the library or patching
internals immediately.

Runnable companion example:

- [codesandbox.io/p/sandbox/lightweight-orderflow-charts-extension-x7y3dl](https://codesandbox.io/p/sandbox/lightweight-orderflow-charts-extension-x7y3dl)

## Prefer Composition First

Before adding a new renderer or modifying internals, try these extension points first:

1. Wrap a known-good chart composition into your own helper or factory.
2. Start from `ORDER_FLOW_STYLE_PRESETS` and `ORDER_FLOW_THEME_PRESETS` instead of rebuilding every
   option object by hand.
3. Keep your host application's `OrderFlowBar[]` normalization separate from rendering.
4. Add supporting studies such as delta summary or profiles from the same normalized bars.

That path keeps you on the published API surface and makes upgrades much easier.

## Example: Build A Reusable Workspace Helper

The following helper creates a footprint plus delta-summary workspace that your host app can reuse
across screens:

```ts
import type { IChartApi } from 'lightweight-charts';
import type { OrderFlowBar } from 'lightweight-orderflow-charts';
import {
  ORDER_FLOW_STYLE_PRESETS,
  ORDER_FLOW_THEME_PRESETS,
  createDeltaSummarySeries,
  createFootprintSeries,
} from 'lightweight-orderflow-charts';

export function createOrderFlowWorkspace(chart: IChartApi, mintick = 0.1) {
  const stylePreset = ORDER_FLOW_STYLE_PRESETS.shadedReference;
  const themePreset = ORDER_FLOW_THEME_PRESETS.smoothLight;

  const footprint = chart.addCustomSeries(
    createFootprintSeries({
      ...stylePreset.footprint,
      ...themePreset.footprint,
      ladder: {
        ...stylePreset.footprint.ladder,
        priceStep: mintick,
      },
    }),
    undefined,
    0,
  );

  const deltaSummary = chart.addCustomSeries(
    createDeltaSummarySeries({
      ...stylePreset.deltaSummary,
      ...themePreset.deltaSummary,
    }),
    1,
  );

  return {
    setData(bars: OrderFlowBar[]) {
      footprint.setData(bars);
      deltaSummary.setData(bars);
      chart.timeScale().fitContent();
    },
  };
}
```

Then use it from the host chart:

```ts
import { ColorType, createChart } from 'lightweight-charts';
import { ORDER_FLOW_THEME_PRESETS } from 'lightweight-orderflow-charts';

import { createOrderFlowWorkspace } from './createOrderFlowWorkspace';
import { orderFlowBars } from './orderFlowBars';

const container = document.getElementById('chart');

if (!container) {
  throw new Error('Chart container was not found.');
}

const theme = ORDER_FLOW_THEME_PRESETS.smoothLight.surface;
const chart = createChart(container, {
  width: 960,
  height: 680,
  layout: {
    background: { type: ColorType.Solid, color: theme.backgroundColor },
    textColor: theme.textColor,
    attributionLogo: true,
  },
  grid: {
    vertLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
    horzLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
  },
});

const workspace = createOrderFlowWorkspace(chart, 0.1);
workspace.setData(orderFlowBars);
```

## Why This Is A Good First Extension

This style of extension is simple, but it solves real host-application problems:

- it centralizes a known-good composition
- it keeps theming and mintick defaults consistent
- it lets multiple screens share the same rendering contract
- it avoids coupling your app to repo-only demo code

## When To Go Deeper

If composition is no longer enough, the next layer is usually one of these:

1. Add a new calculation helper under `src/calculations/`.
2. Add or refine public option types under `src/models/options.ts`.
3. Add a new renderer or primitive under `src/renderers/`.
4. Expose the new public surface from `src/index.ts` and `src/react.ts`.

For source-tree responsibilities and extension boundaries, continue with
[`ARCHITECTURE.md`](./ARCHITECTURE.md).
