# Candle Heatmap

The candle heatmap helper renders ordinary OHLC candles while mapping a second per-bar metric into a
diverging candle color scale.

This is useful when each candle already has a normalized score such as:

- probability from a model
- percentile rank
- confidence score
- normalized factor value

## Public API

Use `buildCandleHeatmapSeriesData()` to transform any OHLC-like bars plus a metric accessor into
`lightweight-charts` candlestick data with per-bar colors.

```ts
import {
  DEFAULT_FOOTPRINT_STYLE,
  buildCandleHeatmapSeriesData,
} from 'lightweight-orderflow-charts';

const candleData = buildCandleHeatmapSeriesData({
  bars,
  metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
  options: {
    domain: {
      min: 0,
      minThreshold: 0.1,
      threshold: 0.5,
      maxThreshold: 0.9,
      max: 1,
    },
    metricStyleKey: 'metric0',
    shadeCount: 10,
    shader: 'alpha',
  },
  backgroundColor: '#020617',
  getValue: (bar) => Number(bar.metadata?.probabilityScore ?? null),
});
```

## Options

### `domain`

The heatmap uses a diverging domain:

- `min`
  Lowest supported metric value. This edge resolves to the selected metric style's secondary color.
- `threshold`
  Split between the low and high halves of the domain. Values below it use the secondary side, and
  values at or above it use the primary side.
- `max`
  Highest supported metric value. This edge resolves to the selected metric style's primary color.
- `minThreshold`
  Optional lower solid zone. Values from `min` through this threshold render as the fully saturated
  secondary color.
- `maxThreshold`
  Optional upper solid zone. Values from this threshold through `max` render as the fully saturated
  primary color.

### `metricStyleKey`

Selects the diverging palette from the existing metric-style slots such as `metric0` or `metric1`.
The helper resolves:

- `metricX.secondary.color` for the low side
- `metricX.primary.color` for the high side

### `shadeCount`

- `1`
  Two solid colors split at the threshold
- `n > 1`
  `n` discrete shades per side
- `0`
  Continuous shading using 256 internal steps

### `shader`

- `alpha`
  Keeps the edge hue fixed and varies opacity toward the threshold. The helper raises the minimum
  alpha on dark surfaces so low-intensity candles stay visible.
- `hue`
  Keeps candles opaque and blends each edge hue back toward a theme-aware neutral tone.

## Data Requirements

The helper only needs:

- `time`
- `open`
- `high`
- `low`
- `close`
- a metric accessor

It does not require footprint levels. That makes it a good fit for hosts that have standardized bar
data plus a strategy output but do not need ladder-level rendering for that view.

## Notes

- The helper only changes candle colors. Candle geometry still comes from the original OHLC values.
- When a metric value is `null` or not finite, the helper leaves per-bar candle colors unset so the
  series-level up/down defaults can render normally.
