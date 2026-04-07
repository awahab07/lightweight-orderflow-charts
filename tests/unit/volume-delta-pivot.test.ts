import { describe, expect, it } from 'vitest';

import { buildVolumeDeltaPivotSeriesData, type TimeValue } from '../../src';

describe('buildVolumeDeltaPivotSeriesData', () => {
  it('prefers explicit delta values when building zero-anchored candles', () => {
    const chartBars = [
      {
        time: 0 as TimeValue,
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        delta: 5,
      },
      {
        time: 180 as TimeValue,
        open: 100.5,
        high: 101,
        low: 100,
        close: 100.25,
        delta: -3,
      },
    ];
    const lowerBars = [
      { time: 0 as TimeValue, open: 100, high: 100.4, low: 99.9, close: 100.3, delta: 2 },
      { time: 60 as TimeValue, open: 100.3, high: 100.5, low: 100.1, close: 100.2, delta: -1 },
      { time: 120 as TimeValue, open: 100.2, high: 100.6, low: 100.1, close: 100.5, delta: 4 },
      { time: 180 as TimeValue, open: 100.5, high: 100.6, low: 100.2, close: 100.4, delta: -1 },
      { time: 240 as TimeValue, open: 100.4, high: 100.5, low: 100.1, close: 100.2, delta: -2 },
    ];

    const result = buildVolumeDeltaPivotSeriesData(chartBars, lowerBars, {
      intervalSeconds: 180,
    });

    expect(result).toEqual([
      {
        time: 0,
        open: 0,
        high: 5,
        low: 0,
        close: 5,
        delta: 5,
      },
      {
        time: 180,
        open: 0,
        high: 0,
        low: -3,
        close: -3,
        delta: -3,
      },
    ]);
  });
});
