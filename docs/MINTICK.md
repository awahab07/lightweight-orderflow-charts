# Mintick Clustering

`mintick` is a visualization and preprocessing control that remaps price levels onto a deterministic
grid without changing the underlying market-data source.

## What It Means

If the exchange tick size is `0.01` and the consumer selects `mintick = 0.05`, then prices are
grouped into `0.05` blocks:

- `50.01`, `50.02`, and `50.04` cluster into `50.00`
- `50.05` and `50.08` cluster into `50.05`
- `50.10` stays `50.10`

The library then aggregates per-level values inside each block:

- `bidVolume`
- `askVolume`
- `totalVolume`
- `delta`
- `tradeCount`

If `mintick` is finer than the source ladder spacing, the original prices remain on their own
buckets and the renderer fills the intermediate buckets with zero-volume rows. That is useful when a
consumer wants a visually finer ladder than the source feed provides.

## What It Changes

- footprint ladder rows
- footprint candle OHLC placement
- derived chart bars when the host chooses to preprocess them through the clustering utilities
- studies that consume the clustered bars, such as reference candles or bar-derived VWAP in the demo

## What It Does Not Change

- the instrument's actual exchange tick size
- raw source data stored by the host application
- the semantics of independent calculations that the host intentionally keeps on raw ticks

## Public Utilities

```ts
import {
  buildSupportedMinticks,
  bucketPriceToMintick,
  clusterOrderFlowBarsByMintick,
  clusterOhlcBarsByMintick,
  normalizeMintick,
} from 'lightweight-orderflow-charts';
```

## Example

```ts
const mintick = 0.05;

const clusteredBars = clusterOrderFlowBarsByMintick(orderFlowBars, mintick, instrument.tickSize);
const clusteredChartBars = clusterOhlcBarsByMintick(chartBars, mintick, instrument.tickSize);

const footprintOptions = {
  ladder: {
    priceStep: mintick,
  },
};
```

## Choosing A Value

- Use the native instrument tick size when you need the source ladder exactly as provided.
- Use a larger `mintick` when a dense ladder becomes too noisy to read.
- Use a smaller `mintick` when you want a finer visual grid and are comfortable with zero-volume
  intermediate rows.
- Any positive value is allowed. The host should still choose values that make sense for the
  instrument and viewport.

## Relationship To `priceStep`

`priceStep` controls the rendered ladder row spacing. When a host also preprocesses its bars through
the clustering utilities, `priceStep` should usually match the selected `mintick` so both the data
and the renderer agree on the price grid.
