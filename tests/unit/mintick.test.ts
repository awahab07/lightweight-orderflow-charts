import { describe, expect, it } from 'vitest';

import {
  buildSupportedMinticks,
  bucketPriceToMintick,
  clusterOhlcBarsByMintick,
  clusterOrderFlowBarsByMintick,
  clusterPriceLevelsByMintick,
  normalizeMintick,
  type OrderFlowBar,
  type TimeValue,
} from 'lightweight-orderflow-charts';

describe('mintick utilities', () => {
  it('accepts arbitrary positive mintick values', () => {
    expect(normalizeMintick(0.05, 0.01)).toBe(0.05);
    expect(normalizeMintick(0.005, 0.01)).toBe(0.005);
    expect(normalizeMintick(0.03, 0.02)).toBe(0.03);
    expect(normalizeMintick(1.5, 0.01)).toBe(1.5);
    expect(normalizeMintick(0, 0.01)).toBeNull();
  });

  it('builds supported mintick choices from the instrument tick size', () => {
    expect(buildSupportedMinticks(0.01)).toEqual([0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1]);
    expect(buildSupportedMinticks(0.5)).toEqual([0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1]);
  });

  it('buckets prices and level volumes into mintick blocks', () => {
    expect(bucketPriceToMintick(50.04, 0.05, 0.01)).toBe(50);
    expect(bucketPriceToMintick(50.08, 0.05, 0.01)).toBe(50.05);

    const clusteredLevels = clusterPriceLevelsByMintick(
      [
        { price: 50.01, bidVolume: 2, askVolume: 1 },
        { price: 50.02, bidVolume: 4, askVolume: 2 },
        { price: 50.04, bidVolume: 3, askVolume: 1 },
        { price: 50.05, bidVolume: 1, askVolume: 5 },
        { price: 50.1, bidVolume: 0, askVolume: 6 },
      ],
      0.05,
      0.01,
    );

    expect(clusteredLevels).toEqual([
      { price: 50, bidVolume: 9, askVolume: 4, totalVolume: 13, delta: -5, tradeCount: undefined },
      { price: 50.05, bidVolume: 1, askVolume: 5, totalVolume: 6, delta: 4 },
      { price: 50.1, bidVolume: 0, askVolume: 6, totalVolume: 6, delta: 6 },
    ]);
  });

  it('clusters OHLC fields and order-flow bars consistently', () => {
    const sourceBar: OrderFlowBar = {
      time: 1 as TimeValue,
      open: 50.04,
      high: 50.1,
      low: 50.01,
      close: 50.08,
      totalVolume: 25,
      delta: 3,
      levels: [
        { price: 50.01, bidVolume: 2, askVolume: 1 },
        { price: 50.02, bidVolume: 4, askVolume: 2 },
        { price: 50.04, bidVolume: 3, askVolume: 1 },
        { price: 50.05, bidVolume: 1, askVolume: 5 },
        { price: 50.1, bidVolume: 0, askVolume: 6 },
      ],
    };

    const clusteredBars = clusterOrderFlowBarsByMintick([sourceBar], 0.05, 0.01);
    const clusteredOhlc = clusterOhlcBarsByMintick([sourceBar], 0.05, 0.01);

    expect(clusteredBars[0]).toMatchObject({
      open: 50,
      high: 50.1,
      low: 50,
      close: 50.05,
      totalVolume: 25,
      delta: 5,
    });
    expect(clusteredBars[0]?.levels.map((level) => level.price)).toEqual([50, 50.05, 50.1]);
    expect(clusteredOhlc[0]).toMatchObject({
      open: 50,
      high: 50.1,
      low: 50,
      close: 50.05,
    });
  });

  it('preserves finer mintick levels so missing rows can be filled later', () => {
    const sourceBar: OrderFlowBar = {
      time: 1 as TimeValue,
      open: 50.04,
      high: 50.1,
      low: 50.01,
      close: 50.08,
      levels: [
        { price: 50.01, bidVolume: 2, askVolume: 1 },
        { price: 50.02, bidVolume: 4, askVolume: 2 },
        { price: 50.04, bidVolume: 3, askVolume: 1 },
        { price: 50.05, bidVolume: 1, askVolume: 5 },
        { price: 50.1, bidVolume: 0, askVolume: 6 },
      ],
    };

    const clusteredBars = clusterOrderFlowBarsByMintick([sourceBar], 0.005, 0.01);

    expect(clusteredBars[0]?.levels.map((level) => level.price)).toEqual([
      50.01, 50.02, 50.04, 50.05, 50.1,
    ]);
    expect(clusteredBars[0]?.close).toBe(50.08);
  });
});
