import type { IChartApi } from 'lightweight-charts';
import { describe, expect, it, vi } from 'vitest';

import { focusOrderFlowChart } from '../../src';

function createMockChart({
  timeRange = { from: 10, to: 20 },
  priceRange = { from: 390, to: 410 },
}: {
  timeRange?: { from: number; to: number };
  priceRange?: { from: number; to: number };
} = {}): IChartApi {
  const timeScale = {
    getVisibleLogicalRange: vi.fn(() => timeRange),
    setVisibleLogicalRange: vi.fn(),
  };
  const rightPriceScale = {
    getVisibleRange: vi.fn(() => priceRange),
    setVisibleRange: vi.fn(),
    setAutoScale: vi.fn(),
  };

  return {
    timeScale: vi.fn(() => timeScale),
    priceScale: vi.fn(() => rightPriceScale),
  } as unknown as IChartApi;
}

describe('focusOrderFlowChart', () => {
  it('leaves the viewport untouched when the middle bar is already visible enough', () => {
    const chart = createMockChart();
    const bars = Array.from({ length: 40 }, () => ({ high: 402, low: 398 }));

    const result = focusOrderFlowChart(chart, bars);

    expect(result).toEqual({
      applied: false,
      targetIndex: 15,
      scaleFactor: 1,
      reason: 'already-focused',
    });
    expect(chart.priceScale('right', 0).setVisibleRange).not.toHaveBeenCalled();
    expect(chart.timeScale().setVisibleLogicalRange).not.toHaveBeenCalled();
  });

  it('recenters the viewport when the focus bar is vertically off-screen', () => {
    const chart = createMockChart();
    const bars = Array.from({ length: 40 }, () => ({ high: 402, low: 398 }));
    bars[15] = { high: 430, low: 425 };

    const result = focusOrderFlowChart(chart, bars);

    expect(result.applied).toBe(true);
    expect(result.targetIndex).toBe(15);
    expect(chart.priceScale('right', 0).setAutoScale).toHaveBeenCalledWith(false);
    expect(chart.priceScale('right', 0).setVisibleRange).toHaveBeenCalledWith({
      from: 417.5,
      to: 437.5,
    });
    expect(chart.timeScale().setVisibleLogicalRange).not.toHaveBeenCalled();
  });

  it('zooms vertically while preserving the current horizontal zoom when the focus bar is too small', () => {
    const chart = createMockChart();
    const bars = Array.from({ length: 40 }, () => ({ high: 402, low: 398 }));
    bars[15] = { high: 401, low: 400 };

    const result = focusOrderFlowChart(chart, bars);

    expect(result.applied).toBe(true);
    expect(result.scaleFactor).toBeCloseTo(4, 6);
    expect(chart.priceScale('right', 0).setVisibleRange).toHaveBeenCalledWith({
      from: 398,
      to: 403,
    });
    expect(chart.timeScale().setVisibleLogicalRange).not.toHaveBeenCalled();
  });
});
