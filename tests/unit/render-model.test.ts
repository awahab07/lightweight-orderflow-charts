import { describe, expect, it } from 'vitest';

import { DEFAULT_FOOTPRINT_SERIES_OPTIONS } from '../../src/models/options';
import {
  formatFootprintCellText,
  resolveBarWidth,
  resolveFootprintBarLayout,
} from '../../src/renderers/shared/renderModel';

describe('footprint render model', () => {
  it('reserves a left-side candle lane by default', () => {
    const layout = resolveFootprintBarLayout(100, 40, DEFAULT_FOOTPRINT_SERIES_OPTIONS);

    expect(layout.candle?.width ?? 0).toBeGreaterThan(0);
    expect(layout.candle?.left ?? 0).toBe(80);
    expect(layout.bidArea?.left).toBeGreaterThan(layout.candle?.left ?? 0);
    expect(layout.askArea?.centerX).toBeGreaterThan(layout.bidArea?.centerX ?? 0);
  });

  it('can place the candle lane in the middle', () => {
    const layout = resolveFootprintBarLayout(100, 40, {
      ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
      candle: {
        ...DEFAULT_FOOTPRINT_SERIES_OPTIONS.candle,
        position: 'middle',
      },
    });

    expect(Math.abs((layout.candle?.centerX ?? 0) - 100)).toBeLessThanOrEqual(0.5);
    expect(layout.bidArea?.centerX).toBeLessThan(100);
    expect(layout.askArea?.centerX).toBeGreaterThan(100);
  });

  it('uses the full bar width when the candle lane is disabled', () => {
    const layout = resolveFootprintBarLayout(100, 40, {
      ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
      candle: {
        ...DEFAULT_FOOTPRINT_SERIES_OPTIONS.candle,
        visible: false,
      },
    });

    expect(layout.candle).toBeNull();
    expect(layout.singleCellSegments[0]?.width).toBe(40);
    expect(layout.singleCellTextCenterX).toBe(100);
  });

  it('reserves a separator gutter for letter-delimited bid and ask ladders', () => {
    const layout = resolveFootprintBarLayout(100, 40, {
      ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
      ladder: {
        ...DEFAULT_FOOTPRINT_SERIES_OPTIONS.ladder,
        separatorMode: 'letter',
        separatorGap: 8,
      },
    });

    expect(layout.separator?.width).toBe(8);
    expect(layout.askArea?.left).toBe(
      (layout.bidArea?.left ?? 0) + (layout.bidArea?.width ?? 0) + 8,
    );
  });

  it('supports percentage-based bar width limits', () => {
    const width = resolveBarWidth(40, {
      layout: {
        barWidth: {
          min: 12,
          max: '50%',
        },
      },
    });

    expect(width).toBe(20);
  });

  it('formats non-integer ladder values with deterministic decimals', () => {
    const text = formatFootprintCellText(
      {
        price: 405.03,
        bidVolume: 12.341000000000001,
        askVolume: 13.299999999999999,
        totalVolume: 25.640999999999998,
        delta: 0.9589999999999996,
        imbalanceSide: 'none',
        isStackedImbalance: false,
        isPointOfControl: false,
        volumeRatioToMax: 0,
        volumeRatioToAverage: 0,
        deltaRatioToMaxAbs: 0,
        absoluteDeltaRatioToMaxAbs: 0,
        heat: 0,
      },
      'bid-ask',
      {
        valueIntegerDigits: 2,
        valueDecimalDigits: 1,
        valueRounding: 'ceil',
        valueUnitVisible: true,
      },
    );

    expect(text).toBe('12.4 x 13.3');
  });
});
