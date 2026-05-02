# Chart State Persistence

The publishable package exposes reusable helpers for capturing and restoring chart viewport state
without taking ownership of URL APIs, local storage, or app-specific routing.

## Exports

```ts
import {
  captureChartViewState,
  restoreChartViewState,
  type ChartViewStateSnapshot,
} from 'lightweight-orderflow-charts';
```

## What Gets Captured

`ChartViewStateSnapshot` includes:

- visible logical time range
- per-pane visible price ranges
- a version field for future compatibility

```ts
type ChartViewStateSnapshot = {
  version: 1;
  timeRange: { from: number; to: number } | null;
  panes: Array<{
    paneIndex: number;
    priceScaleId: string;
    priceRange: { from: number; to: number } | null;
  }>;
};
```

The snapshot is JSON-safe, which means consumers can:

- store it in the URL
- write it to local storage
- persist it in a workspace or server record
- attach it to bug reports or shared Explore links

## Capture Example

```ts
const snapshot = captureChartViewState(chart);
const serialized = JSON.stringify(snapshot);
```

To capture a subset of panes:

```ts
const snapshot = captureChartViewState(chart, {
  paneIndices: [0, 1],
});
```

## Restore Example

```ts
const parsed = JSON.parse(serialized) as ChartViewStateSnapshot;
restoreChartViewState(chart, parsed);
```

The helper ignores panes that do not exist on the current chart, which makes it safer to restore
state after a layout change or when a study pane is temporarily disabled.

## URL Sync Pattern

The library intentionally stops at snapshot capture and restore. URL policy belongs to the
consuming application.

Typical app flow:

1. Capture a snapshot when the viewport changes.
2. Serialize it with `JSON.stringify`.
3. Encode it for URL or storage.
4. Restore it after the chart and its panes have been created.

Practical guidance:

- restore after the custom series and supporting panes are ready, not merely after the outer chart has
  been instantiated
- treat the decoded URL snapshot as an initial restore payload, not the value that is continuously
  fed back into the chart on every interaction
- debounce URL writes so wheel zooming and drag panning stay responsive

If a host wants
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts)-style
vertical refitting after restore, pair restore with `setPriceScaleAutoFit(chart, true, {
paneIndex: 0, topInsetRatio: 0.05, bottomInsetRatio: 0.05 })` after the restore settles. That
keeps the persistence layer reusable while leaving auto-fit policy under the host application's
control.

The Explore demo in this repository keeps chart-state persistence separate from the auto-fit mode
for exactly that reason.
