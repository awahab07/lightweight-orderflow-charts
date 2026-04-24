import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FOOTPRINT_STYLE,
  buildCandleHeatmapSeriesData,
  resolveCandleHeatmapColor,
  type TimeValue,
} from '../../src';

describe('resolveCandleHeatmapColor', () => {
  it('collapses to two solid edge colors when shadeCount is 1', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.2,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 1,
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.8,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 1,
      },
    });

    expect(low).toMatchObject({
      variant: 'secondary',
      intensity: 1,
      color: 'rgba(220, 38, 38, 1)',
    });
    expect(high).toMatchObject({
      variant: 'primary',
      intensity: 1,
      color: 'rgba(37, 99, 235, 1)',
    });
  });

  it('quantizes alpha shading around the threshold', () => {
    const result = resolveCandleHeatmapColor({
      value: 0.5,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 10,
        shader: 'alpha',
      },
      backgroundColor: '#020617',
    });

    expect(result).toMatchObject({
      variant: 'primary',
      intensity: 0.1,
      color: 'rgba(37, 99, 235, 0.442)',
    });
  });

  it('short-circuits to the solid edge colors at threshold boundaries', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.08,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 10,
        domain: {
          min: 0,
          minThreshold: 0.1,
          threshold: 0.5,
          maxThreshold: 0.9,
          max: 1,
        },
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.94,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 10,
        domain: {
          min: 0,
          minThreshold: 0.1,
          threshold: 0.5,
          maxThreshold: 0.9,
          max: 1,
        },
      },
    });

    expect(low).toMatchObject({
      variant: 'secondary',
      intensity: 1,
      color: 'rgba(220, 38, 38, 1)',
    });
    expect(high).toMatchObject({
      variant: 'primary',
      intensity: 1,
      color: 'rgba(37, 99, 235, 1)',
    });
  });

  it('keeps hue shading opaque and theme-aware', () => {
    const dark = resolveCandleHeatmapColor({
      value: 0.6,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 0,
        shader: 'hue',
      },
      backgroundColor: '#020617',
    });
    const light = resolveCandleHeatmapColor({
      value: 0.6,
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 0,
        shader: 'hue',
      },
      backgroundColor: '#ffffff',
    });

    expect(dark?.color.endsWith(', 1)')).toBe(true);
    expect(light?.color.endsWith(', 1)')).toBe(true);
    expect(dark?.color).not.toBe(light?.color);
  });
});

describe('buildCandleHeatmapSeriesData', () => {
  it('preserves candle geometry and applies per-bar colors', () => {
    const data = buildCandleHeatmapSeriesData({
      bars: [
        {
          time: 1_700_000_400 as TimeValue,
          open: 100,
          high: 101,
          low: 99,
          close: 100.5,
        },
      ],
      metricStyles: DEFAULT_FOOTPRINT_STYLE.metricStyles,
      options: {
        metricStyleKey: 'metric0',
        shadeCount: 1,
      },
      getValue: () => 0.9,
    });

    expect(data).toEqual([
      {
        time: 1_700_000_400,
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        color: 'rgba(37, 99, 235, 1)',
        borderColor: 'rgba(37, 99, 235, 1)',
        wickColor: 'rgba(37, 99, 235, 1)',
      },
    ]);
  });
});
