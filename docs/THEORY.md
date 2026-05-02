# Theory Notes

This package is opinionated about a few order-flow visuals, and those opinions come from recurring
research articles and expert commentary about order-flow interpretation.

The distributed library includes only the distilled guidance below, not the source articles
themselves.

The notes below are not a trading system. They are a rendering guide for choosing what deserves
visual emphasis and what should remain secondary.

## What the research articles emphasize

### Stacked imbalances are structure

Experts often treat stacked imbalances as consecutive aggressive cells that behave like support or
resistance. That is why this library renders them inside the ladder instead of as arbitrary A/B
rectangle annotations.

Recommended visualization:

- keep the imbalance styling on the affected cells or rows
- use a stronger border or fill for stacked zones than for single imbalances
- avoid free-floating overlays that disconnect the signal from the exact price levels

Relevant options:

- `ladder.imbalanceRatio`
- `ladder.stackedImbalanceLength`
- `style.buyImbalanceFillColor`
- `style.sellImbalanceFillColor`
- `style.stackedBuyImbalanceFillColor`
- `style.stackedSellImbalanceFillColor`
- `style.stackedImbalanceOutline`

### Absorption is high volume with limited price progress

Absorption is often described as heavy two-sided trade occurring without much price movement. The
important visual message is not just "big volume", but "big volume with small net displacement".

Recommended visualization:

- let per-level shading communicate that volume was heavy
- keep delta visible, but do not let delta color dominate if net difference is small
- highlight the local point of control because absorption often forms around price acceptance
- preserve the OHLC lane so the reader can judge how little price actually moved

Relevant options:

- `shading.bidAskMetric`
- `shading.bidScale`
- `shading.askScale`
- `pointOfControl`
- `summary.items`

### Cumulative delta belongs in its own aligned pane

Experts repeatedly use delta and cumulative delta around support and resistance, especially for
divergence reads. The best rendering implication is alignment, not decoration.

Recommended visualization:

- put delta-derived context in a synchronized sub-chart
- keep the time scale shared with the main footprint
- let the footprint carry price-level detail and let the summary pane carry cross-bar context

Relevant options:

- `createDeltaSummarySeries()`
- `rows`
- `rowLabels`
- `rowStyles`
- `columnWidth`

### Volume Delta Pivot should stay zero-anchored

The most useful quality of a Volume Delta Pivot pane is that every candle starts at zero and then
shows how aggressive pressure developed inside the bar.

Recommended visualization:

- keep the zero line visually clear
- let green candles rise from zero and red candles fall from zero
- preserve the wick because the wick explains intrabar reversals in pressure
- derive the candle from lower-timeframe bars when possible so the path is informative

Relevant options and APIs:

- `buildVolumeDeltaPivotSeriesData()`
- `volumeDeltaPivotSeriesOptions`

### Volume profile shape matters as much as raw size

Volume Profile articles often stress D / P / b / thin profile interpretation and the importance of
POC, high or low edges, and volume clusters. That means profile rendering needs both flexible
placement and clean POC emphasis.

Recommended visualization:

- keep profile alignment configurable because host layouts differ
- emphasize POC separately from the rest of the profile
- use fixed-range or flexible-range profiles when a daily profile hides the specific area of
  interest

Relevant options:

- `align`
- `widthRatio`
- `scope`
- `pointOfControl`

## How to visualize absorption vs exhaustion

### Absorption

The signal is "a lot traded here and price did not go far."

Useful visual combination:

- medium-to-strong ladder shading on both sides near the same prices
- relatively small candle body or follow-through relative to the printed volume
- a clear footprint-bar POC marker
- metric badges for delta and volume, or delta and average level volume

Good defaults:

- balanced bid and ask scales
- muted background fills with a stronger POC border
- delta badge below the bar and one contextual metric above it

### Exhaustion

The signal is "the move reached an extreme with weakening participation."

Useful visual combination:

- edge rows with weaker follow-through or thin participation
- rejection wick on the OHLC lane
- lighter heatmap near the edge if participation actually faded

Good defaults:

- keep wicks visible
- avoid overly heavy fills at the extreme unless the data really supports it
- use top or bottom badges to print one extra contextual value without crowding the ladder

## Practical guidance for preset authors

When adding a new public preset or demo fixture:

- decide first whether the chart is emphasizing absorption, trend aggression, rejection, or
  profile structure
- tune the heatmap scale range before changing the color palette
- keep point-of-control styling explicit
- add only the metric badges that support the intended read
- prefer inline imbalance styling to detached annotations

## Related files

- Public option types and defaults: `src/models/options.ts`
- Public preset packs: `src/presets/orderFlowStylePresets.ts`
- Footprint renderer: `src/renderers/footprint-series/FootprintSeriesRenderer.ts`
- Delta summary renderer: `src/renderers/delta-summary-series/DeltaSummarySeriesRenderer.ts`
