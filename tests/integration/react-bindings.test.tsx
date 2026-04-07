import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IChartApi } from 'lightweight-charts';

import {
  ChartProvider,
  FootprintSeries,
  SessionVolumeProfiles,
  VolumeProfile,
  VwapSeries,
} from 'lightweight-orderflow-charts/react';
import { demoBars } from '../../demo/src/fixtures/orderFlow';

function createMockCustomSeries() {
  return {
    setData: vi.fn(),
    applyOptions: vi.fn(),
    attachPrimitive: vi.fn(),
    detachPrimitive: vi.fn(),
  };
}

function createMockLineSeries() {
  return {
    setData: vi.fn(),
    applyOptions: vi.fn(),
  };
}

function createMockChart() {
  const customSeries = createMockCustomSeries();
  const lineSeries = createMockLineSeries();
  const chart = {
    addCustomSeries: vi.fn(() => customSeries),
    removeSeries: vi.fn(),
    addSeries: vi.fn(() => lineSeries),
  } as unknown as IChartApi;

  return { chart, customSeries, lineSeries };
}

describe('react bindings', () => {
  it('creates the footprint series and attaches primitives', () => {
    const { chart, customSeries, lineSeries } = createMockChart();

    render(
      <ChartProvider chart={chart}>
        <FootprintSeries chart={chart} data={demoBars} />
        <VolumeProfile series={customSeries as never} data={demoBars} />
        <SessionVolumeProfiles series={customSeries as never} data={demoBars} />
        <VwapSeries chart={chart} data={demoBars} />
      </ChartProvider>,
    );

    expect(chart.addCustomSeries as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
    expect(customSeries.setData).toHaveBeenCalledWith(demoBars);
    expect(customSeries.attachPrimitive).toHaveBeenCalledTimes(2);
    expect(chart.addSeries as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
    expect(lineSeries.setData).toHaveBeenCalled();
  });
});
