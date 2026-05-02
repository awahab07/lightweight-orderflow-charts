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
[`TradingView lightweight-charts`](https://github.com/tradingview/lightweight-charts) candlestick
data with per-bar colors.

```ts
import { buildCandleHeatmapSeriesData } from 'lightweight-orderflow-charts';

const candleData = buildCandleHeatmapSeriesData({
  bars,
  options: {
    range: {
      min: 0,
      minShadeThreshold: 0.1,
      threshold: 0.5,
      maxShadeThreshold: 0.9,
      max: 1,
    },
    downColor: '#f23645',
    upColor: '#089981',
    wickDownColor: '#c9cdd4',
    wickUpColor: '#c9cdd4',
    borderDownColor: '#f23645',
    borderUpColor: '#089981',
    borderVisible: true,
    shadeWicks: false,
    noOfShades: 10,
    shader: 'alpha',
  },
  backgroundColor: '#020617',
  getValue: (bar) => Number(bar.metadata?.probabilityScore ?? null),
});
```

## Options

### `range`

The heatmap uses a diverging range:

- `min`
  Lowest supported metric value. This edge resolves to `downColor`.
- `threshold`
  Split between the low and high halves of the range. Values below it use the down side, and values
  at or above it use the up side.
- `max`
  Highest supported metric value. This edge resolves to `upColor`.
- `minShadeThreshold`
  Optional lower solid zone. Values from `min` through this threshold render as the exact `downColor`
  without shading.
- `maxShadeThreshold`
  Optional upper solid zone. Values from this threshold through `max` render as the exact `upColor`
  without shading.

### `downColor` and `upColor`

These accept RGBA strings or HEXA colors. That means the caller can use:

- fully opaque colors such as `#dc2626`
- partially transparent colors such as `rgba(220, 38, 38, 0.18)`
- fully transparent colors such as `#00000000`

### Series-style colors

`downColor` and `upColor` control the shaded candle fill colors. `wickDownColor`/`wickUpColor` and
`borderDownColor`/`borderUpColor` control wick and border colors for the lower and upper sides of
the heatmap range.

Set `shadeWicks: false` to keep wicks at their configured colors while only the candle body and
border carry the metric shade. Set `borderVisible: false` to emit transparent per-bar borders.

### `noOfShades`

- `1`
  Two solid colors split at the threshold
- `n > 1`
  `n` discrete shades per side
- `0`
  Continuous shading using 256 internal steps

### `shader`

- `alpha`
  Keeps the edge hue fixed and varies opacity toward the threshold. The helper preserves the input
  color's alpha ceiling and still raises the minimum visibility floor on dark surfaces.
- `hue`
  Keeps the configured alpha and blends each edge hue back toward a theme-aware neutral tone.

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
- If the caller temporarily supplies an invalid required range while editing a UI, the helper leaves
  per-bar candle colors unset instead of throwing.
