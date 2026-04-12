import { describe, expect, it } from 'vitest';

import type { AggregatedMarketBar, OrderFlowBar } from '../../src';
import {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
  buildAggregatedMarketBarsFromOrderFlowBars,
} from '../../src';

describe('buildAggregatedMarketBarsFromOrderFlowBars', () => {
  it('derives candle-summary fields from 1m order-flow bars', () => {
    const bars: OrderFlowBar[] = [
      {
        time: 1_700_000_400 as OrderFlowBar['time'],
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        totalVolume: 6,
        delta: 0,
        bidVolume: 3,
        askVolume: 3,
        tradeCount: 3,
        levels: [
          {
            price: 99,
            bidVolume: 1,
            askVolume: 0,
            totalVolume: 1,
            delta: -1,
            tradeCount: 1,
          },
          {
            price: 100,
            bidVolume: 2,
            askVolume: 3,
            totalVolume: 5,
            delta: 1,
            tradeCount: 2,
          },
        ],
        deltaMin: -1,
        deltaMax: 2,
      },
    ];

    const result = buildAggregatedMarketBarsFromOrderFlowBars(bars);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      time: 1_700_000_400,
      open: 100,
      high: 101,
      low: 99,
      close: 100.5,
      volume: 6,
      delta: 0,
      bidVolume: 3,
      askVolume: 3,
      tradeCount: 3,
      deltaMin: -1,
      deltaMax: 2,
      pocPrice: 100,
      pocVolume: 5,
    });
    expect(result[0].vwap).toBeCloseTo(99.8333333333, 10);
  });
});

describe('aggregateOrderFlowBarsByInterval', () => {
  it('merges 1m order-flow bars into a 5m bar', () => {
    const bars: OrderFlowBar[] = [
      {
        time: 1_700_000_400 as OrderFlowBar['time'],
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        totalVolume: 6,
        delta: 0,
        bidVolume: 3,
        askVolume: 3,
        tradeCount: 3,
        deltaMin: -1,
        deltaMax: 2,
        levels: [
          {
            price: 99,
            bidVolume: 1,
            askVolume: 0,
            totalVolume: 1,
            delta: -1,
            tradeCount: 1,
          },
          {
            price: 100,
            bidVolume: 2,
            askVolume: 3,
            totalVolume: 5,
            delta: 1,
            tradeCount: 2,
          },
        ],
      },
      {
        time: 1_700_000_460 as OrderFlowBar['time'],
        open: 100.5,
        high: 102,
        low: 100,
        close: 101.5,
        totalVolume: 7,
        delta: 5,
        bidVolume: 1,
        askVolume: 6,
        tradeCount: 4,
        deltaMin: 0,
        deltaMax: 5,
        levels: [
          {
            price: 100,
            bidVolume: 0,
            askVolume: 2,
            totalVolume: 2,
            delta: 2,
            tradeCount: 1,
          },
          {
            price: 101,
            bidVolume: 1,
            askVolume: 4,
            totalVolume: 5,
            delta: 3,
            tradeCount: 3,
          },
        ],
      },
    ];

    const result = aggregateOrderFlowBarsByInterval(bars, 300);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      time: 1_700_000_400,
      open: 100,
      high: 102,
      low: 99,
      close: 101.5,
      totalVolume: 13,
      delta: 5,
      bidVolume: 4,
      askVolume: 9,
      tradeCount: 7,
      pocPrice: 100,
      pocVolume: 7,
      deltaMin: -1,
      deltaMax: 5,
    });
    expect(result[0].vwap).toBeCloseTo(100.3076923077, 10);
    expect(result[0].levels).toHaveLength(3);
    expect(result[0].levels[1]).toMatchObject({
      price: 100,
      bidVolume: 2,
      askVolume: 5,
      totalVolume: 7,
      delta: 3,
      tradeCount: 3,
    });
  });
});

describe('aggregateMarketBarsByInterval', () => {
  it('merges 1m candle summaries into a 5m bar', () => {
    const bars: AggregatedMarketBar[] = [
      {
        time: 1_700_000_400 as AggregatedMarketBar['time'],
        open: 10,
        high: 12,
        low: 9,
        close: 11,
        volume: 100,
        vwap: 10.8,
        delta: 20,
        deltaMin: -10,
        deltaMax: 25,
      },
      {
        time: 1_700_000_460 as AggregatedMarketBar['time'],
        open: 11,
        high: 13,
        low: 10,
        close: 12,
        volume: 50,
        vwap: 11.5,
        delta: -5,
        deltaMin: -8,
        deltaMax: 0,
      },
    ];

    const result = aggregateMarketBarsByInterval(bars, 300);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      time: 1_700_000_400,
      open: 10,
      high: 13,
      low: 9,
      close: 12,
      volume: 150,
      delta: 15,
      deltaMin: -10,
      deltaMax: 25,
    });
    expect(result[0].vwap).toBeCloseTo(11.0333333333, 10);
  });
});
