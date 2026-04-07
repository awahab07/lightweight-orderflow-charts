# Chart Focus

The package exposes a lightweight viewport helper for cases where a restored or newly loaded data
source leaves the active order-flow bar off-screen or too compressed to read.

## Export

```ts
import { focusOrderFlowChart } from 'lightweight-orderflow-charts';
```

## What It Does

`focusOrderFlowChart()` inspects the bar nearest the center of the current visible logical range and
then:

- recenters the price range when that bar is vertically off-screen
- zooms vertically when that bar occupies too little of the visible price span
- preserves the current horizontal zoom level instead of rewriting the logical time span

It does not own routing, URL persistence, or React state. It only reads the current chart viewport
and writes a better-focused one.

## Example

```ts
const result = focusOrderFlowChart(chart, orderFlowBars, {
  paneIndex: 0,
  minVisibleHeightRatio: 0.1,
  targetVisibleHeightRatio: 0.2,
});
```

## Recommended Usage

- call it after chart restore has settled when the host swaps symbol, session, or interval data
- expose it as an explicit "Focus" or "Refocus" action when the user wants to rescue the view
- keep it separate from chart-state capture so deep-link persistence and focus policy remain
  independently controllable
