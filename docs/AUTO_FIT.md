# Auto Fit Price Scale

The package exposes a lightweight helper for toggling TradingView-style price auto-fit on a specific
pane and price scale.

## Export

```ts
import { setPriceScaleAutoFit } from 'lightweight-orderflow-charts';
```

## What It Does

`setPriceScaleAutoFit()` delegates to the chart library's built-in price-scale autoscaling and pairs
it with explicit top and bottom insets.

When enabled it:

- turns `autoScale` on for the target price scale
- applies top and bottom inset ratios such as `0.05`
- immediately lets the chart keep refitting the visible data while the user pans

When disabled it:

- turns `autoScale` off and leaves the current visible price range in place for manual scaling

## Example

```ts
setPriceScaleAutoFit(chart, true, {
  paneIndex: 0,
  topInsetRatio: 0.05,
  bottomInsetRatio: 0.05,
});
```

## Recommended Usage

- use it when a host app wants an explicit `Auto (fits data to screen)` mode
- keep context-menu state and drag-to-disable behavior in the consuming app or demo shell
- pair it with restored chart state only after restore settles, because restoring a visible price
  range will temporarily disable autoscale
