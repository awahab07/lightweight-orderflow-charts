import { describe, expect, it } from 'vitest';

import {
  buildOrderFlowBarsFromTicks,
  createOrderFlowTickStreamController,
  type InstrumentContext,
} from '../../src';

const instrument: InstrumentContext = {
  instrumentId: 'tsla',
  symbol: 'TSLA',
  tickSize: 0.01,
  pricePrecision: 2,
  timezone: 'America/New_York',
};

describe('createOrderFlowTickStreamController', () => {
  it('builds append then upsert patches within one interval', () => {
    const controller = createOrderFlowTickStreamController({
      instrument,
      intervalSeconds: 60,
    });

    const first = controller.push({
      trades: [
        {
          time: 1_700_000_401,
          price: 100.01,
          size: 5,
          side: 'buy',
        },
      ],
    });

    expect(first.patches).toHaveLength(1);
    expect(first.patches[0].operation).toBe('append');
    expect(first.bars[0].open).toBe(100.01);
    expect(first.bars[0].delta).toBe(5);
    expect(first.bars[0].levels[0]).toMatchObject({
      price: 100.01,
      askVolume: 5,
      bidVolume: 0,
    });

    const second = controller.push({
      trades: [
        {
          time: 1_700_000_420,
          price: 100,
          size: 3,
          side: 'sell',
        },
      ],
    });

    expect(second.patches).toHaveLength(1);
    expect(second.patches[0].operation).toBe('upsert');
    expect(second.bars[0]).toMatchObject({
      open: 100.01,
      high: 100.01,
      low: 100,
      close: 100,
      totalVolume: 8,
      delta: 2,
      bidVolume: 3,
      askVolume: 5,
      tradeCount: 2,
      pocPrice: 100.01,
      pocVolume: 5,
      deltaMin: 0,
      deltaMax: 5,
    });
    expect(second.bars[0].vwap).toBeCloseTo(100.00625, 10);
    expect(second.bars[0].levels).toHaveLength(2);
  });

  it('classifies trades from quotes and rolls into new bars', () => {
    const controller = createOrderFlowTickStreamController({
      instrument,
      intervalSeconds: 60,
    });

    const result = controller.push({
      quotes: [
        {
          time: 1_700_000_460,
          bidPrice: 100,
          askPrice: 100.02,
          bidSize: 20,
          askSize: 20,
        },
      ],
      trades: [
        {
          time: 1_700_000_460,
          price: 100.02,
          size: 4,
        },
        {
          time: 1_700_000_521,
          price: 100,
          size: 2,
        },
      ],
    });

    expect(result.patches).toHaveLength(2);
    expect(result.patches[0].operation).toBe('append');
    expect(result.patches[1].operation).toBe('append');
    expect(result.bars).toHaveLength(2);
    expect(result.bars[0].levels[0]).toMatchObject({
      price: 100.02,
      askVolume: 4,
      bidVolume: 0,
    });
    expect(result.bars[1].levels[0]).toMatchObject({
      price: 100,
      askVolume: 0,
      bidVolume: 2,
    });
    expect(result.bars[0]).toMatchObject({
      askVolume: 4,
      bidVolume: 0,
      tradeCount: 1,
      pocPrice: 100.02,
      pocVolume: 4,
      deltaMin: 0,
      deltaMax: 4,
    });
    expect(result.bars[1]).toMatchObject({
      askVolume: 0,
      bidVolume: 2,
      tradeCount: 1,
      pocPrice: 100,
      pocVolume: 2,
      deltaMin: -2,
      deltaMax: 0,
    });
  });

  it('falls back to tick rule when a trade prints inside the spread', () => {
    const controller = createOrderFlowTickStreamController({
      instrument,
      intervalSeconds: 60,
    });

    const result = controller.push({
      quotes: [
        {
          time: 1_700_000_460,
          bidPrice: 100,
          askPrice: 100.04,
          bidSize: 20,
          askSize: 20,
        },
      ],
      trades: [
        {
          time: 1_700_000_460,
          price: 100.04,
          size: 4,
        },
        {
          time: 1_700_000_461,
          price: 100.02,
          size: 3,
        },
        {
          time: 1_700_000_462,
          price: 100.03,
          size: 2,
        },
      ],
    });

    expect(result.bars).toHaveLength(1);
    expect(result.bars[0]).toMatchObject({
      askVolume: 6,
      bidVolume: 3,
      tradeCount: 3,
      delta: 3,
    });
    expect(result.bars[0].levels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          price: 100.02,
          bidVolume: 3,
          askVolume: 0,
        }),
        expect.objectContaining({
          price: 100.03,
          bidVolume: 0,
          askVolume: 2,
        }),
      ]),
    );
  });
});

describe('buildOrderFlowBarsFromTicks', () => {
  it('materializes tick-derived bars from a static batch', () => {
    const bars = buildOrderFlowBarsFromTicks({
      instrument,
      intervalSeconds: 60,
      trades: [
        {
          time: 1_700_000_401,
          price: 100.01,
          size: 5,
          side: 'buy',
        },
        {
          time: 1_700_000_420,
          price: 100,
          size: 3,
          side: 'sell',
        },
      ],
    });

    expect(bars).toHaveLength(1);
    expect(bars[0]).toMatchObject({
      open: 100.01,
      high: 100.01,
      low: 100,
      close: 100,
      totalVolume: 8,
      delta: 2,
      bidVolume: 3,
      askVolume: 5,
      tradeCount: 2,
      pocPrice: 100.01,
      pocVolume: 5,
      deltaMin: 0,
      deltaMax: 5,
    });
    expect(bars[0].vwap).toBeCloseTo(100.00625, 10);
  });
});
