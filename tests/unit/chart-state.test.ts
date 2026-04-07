import { describe, expect, it, vi } from 'vitest';
import type { IChartApi } from 'lightweight-charts';

import { captureChartViewState, isChartViewStateSnapshot, restoreChartViewState } from '../../src';

function createMockChart(): IChartApi {
  const timeScale = {
    getVisibleLogicalRange: vi.fn(() => ({ from: 120.5, to: 145.25 })),
    setVisibleLogicalRange: vi.fn(),
  };
  const rightPriceScale = {
    getVisibleRange: vi.fn(() => ({ from: 210.12, to: 180.45 })),
    setVisibleRange: vi.fn(),
    setAutoScale: vi.fn(),
  };
  const lowerPriceScale = {
    getVisibleRange: vi.fn(() => ({ from: 5000, to: 0 })),
    setVisibleRange: vi.fn(),
    setAutoScale: vi.fn(),
  };

  return {
    panes: vi.fn(() => [{}, {}]),
    timeScale: vi.fn(() => timeScale),
    priceScale: vi.fn((priceScaleId: string, paneIndex?: number) => {
      if (priceScaleId !== 'right') {
        throw new Error('Unexpected price scale');
      }

      return paneIndex === 1 ? lowerPriceScale : rightPriceScale;
    }),
  } as unknown as IChartApi;
}

describe('chart state utilities', () => {
  it('captures a serializable chart view snapshot', () => {
    const chart = createMockChart();
    const snapshot = captureChartViewState(chart);

    expect(isChartViewStateSnapshot(snapshot)).toBe(true);
    expect(snapshot.timeRange).toEqual({ from: 120.5, to: 145.25 });
    expect(snapshot.panes).toEqual([
      { paneIndex: 0, priceScaleId: 'right', priceRange: { from: 210.12, to: 180.45 } },
      { paneIndex: 1, priceScaleId: 'right', priceRange: { from: 5000, to: 0 } },
    ]);
  });

  it('restores time and price ranges back onto the chart', () => {
    const chart = createMockChart();
    const snapshot = captureChartViewState(chart);

    restoreChartViewState(chart, snapshot);

    expect(chart.timeScale().setVisibleLogicalRange).toHaveBeenCalledWith(snapshot.timeRange);
    expect(chart.priceScale('right', 0).setAutoScale).toHaveBeenCalledWith(false);
    expect(chart.priceScale('right', 0).setVisibleRange).toHaveBeenCalledWith(
      snapshot.panes[0]?.priceRange,
    );
    expect(chart.priceScale('right', 1).setVisibleRange).toHaveBeenCalledWith(
      snapshot.panes[1]?.priceRange,
    );
  });
});
