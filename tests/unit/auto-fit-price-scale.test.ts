import type { IChartApi } from 'lightweight-charts';
import { describe, expect, it, vi } from 'vitest';

import { setPriceScaleAutoFit } from '../../src';

function createMockChart() {
  const applyOptions = vi.fn();
  const setAutoScale = vi.fn();

  const chart = {
    priceScale: vi.fn(() => ({
      applyOptions,
      setAutoScale,
    })),
  } as unknown as IChartApi;

  return {
    chart,
    applyOptions,
    setAutoScale,
  };
}

describe('setPriceScaleAutoFit', () => {
  it('enables autoscale with the requested inset ratios', () => {
    const { chart, applyOptions, setAutoScale } = createMockChart();

    const result = setPriceScaleAutoFit(chart, true, {
      paneIndex: 1,
      priceScaleId: 'left',
      topInsetRatio: 0.08,
      bottomInsetRatio: 0.12,
    });

    expect(result).toEqual({
      enabled: true,
      paneIndex: 1,
      priceScaleId: 'left',
      topInsetRatio: 0.08,
      bottomInsetRatio: 0.12,
    });
    expect(applyOptions).toHaveBeenCalledWith({
      autoScale: true,
      scaleMargins: {
        top: 0.08,
        bottom: 0.12,
      },
    });
    expect(setAutoScale).toHaveBeenCalledWith(true);
  });

  it('disables autoscale and clamps invalid inset ratios', () => {
    const { chart, applyOptions, setAutoScale } = createMockChart();

    const result = setPriceScaleAutoFit(chart, false, {
      topInsetRatio: -2,
      bottomInsetRatio: 7,
    });

    expect(result).toEqual({
      enabled: false,
      paneIndex: 0,
      priceScaleId: 'right',
      topInsetRatio: 0,
      bottomInsetRatio: 0.49,
    });
    expect(applyOptions).toHaveBeenCalledWith({
      autoScale: false,
      scaleMargins: {
        top: 0,
        bottom: 0.49,
      },
    });
    expect(setAutoScale).toHaveBeenCalledWith(false);
  });
});
