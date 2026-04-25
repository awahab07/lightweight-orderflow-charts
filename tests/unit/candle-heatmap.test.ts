import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CANDLE_HEATMAP_OPTIONS,
  buildCandleHeatmapSeriesData,
  resolveCandleHeatmapColor,
  type TimeValue,
} from '../../src';

describe('resolveCandleHeatmapColor', () => {
  it('collapses to two solid edge colors when noOfShades is 1', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.2,
      options: {
        noOfShades: 1,
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.8,
      options: {
        noOfShades: 1,
      },
    });

    expect(low).toMatchObject({
      side: 'min',
      intensity: 1,
      color: '#dc2626',
    });
    expect(high).toMatchObject({
      side: 'max',
      intensity: 1,
      color: '#2563eb',
    });
  });

  it('quantizes alpha shading around the threshold', () => {
    const result = resolveCandleHeatmapColor({
      value: 0.5,
      options: {
        noOfShades: 10,
        shader: 'alpha',
      },
      backgroundColor: '#020617',
    });

    expect(result).toMatchObject({
      side: 'max',
      intensity: 0.1,
      color: 'rgba(37, 99, 235, 0.442)',
    });
  });

  it('short-circuits to the solid edge colors at threshold boundaries', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.08,
      options: {
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.1,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.94,
      options: {
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.1,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
    });

    expect(low).toMatchObject({
      side: 'min',
      intensity: 1,
      color: '#dc2626',
    });
    expect(high).toMatchObject({
      side: 'max',
      intensity: 1,
      color: '#2563eb',
    });
  });

  it('allows one side to stay solid while the other side shades', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.25,
      options: {
        minColor: '#dc2626',
        maxColor: '#16a34a',
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.5,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.7,
      options: {
        minColor: '#dc2626',
        maxColor: '#16a34a',
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.5,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
      backgroundColor: '#020617',
    });

    expect(low).toMatchObject({
      side: 'min',
      intensity: 1,
      color: '#dc2626',
    });
    expect(high).toMatchObject({
      side: 'max',
      intensity: 0.5,
      color: 'rgba(22, 163, 74, 0.69)',
    });
  });

  it('supports a transparent solid lower band with shaded upper colors', () => {
    const low = resolveCandleHeatmapColor({
      value: 0.2,
      options: {
        minColor: '#00000000',
        maxColor: '#2563eb',
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.5,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
    });
    const high = resolveCandleHeatmapColor({
      value: 0.7,
      options: {
        minColor: '#00000000',
        maxColor: '#2563eb',
        noOfShades: 10,
        range: {
          min: 0,
          minShadeThreshold: 0.5,
          threshold: 0.5,
          maxShadeThreshold: 0.9,
          max: 1,
        },
      },
      backgroundColor: '#020617',
    });

    expect(low).toMatchObject({
      side: 'min',
      intensity: 1,
      color: '#00000000',
    });
    expect(high?.color).toBe('rgba(37, 99, 235, 0.69)');
  });

  it('keeps hue shading theme-aware while preserving configured alpha', () => {
    const dark = resolveCandleHeatmapColor({
      value: 0.6,
      options: {
        minColor: '#dc262680',
        maxColor: '#2563eb80',
        noOfShades: 0,
        shader: 'hue',
      },
      backgroundColor: '#020617',
    });
    const light = resolveCandleHeatmapColor({
      value: 0.6,
      options: {
        minColor: '#dc262680',
        maxColor: '#2563eb80',
        noOfShades: 0,
        shader: 'hue',
      },
      backgroundColor: '#ffffff',
    });

    expect(dark?.color.endsWith(', 0.502)')).toBe(true);
    expect(light?.color.endsWith(', 0.502)')).toBe(true);
    expect(dark?.color).not.toBe(light?.color);
  });

  it('returns null instead of throwing when the required range is temporarily invalid', () => {
    expect(
      resolveCandleHeatmapColor({
        value: 0.5,
        options: {
          ...DEFAULT_CANDLE_HEATMAP_OPTIONS,
          range: {
            min: 0.8,
            threshold: 0.5,
            max: 1,
          },
        },
      }),
    ).toBeNull();
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
      options: {
        noOfShades: 1,
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
        color: '#2563eb',
        borderColor: '#2563eb',
        wickColor: '#2563eb',
      },
    ]);
  });
});
