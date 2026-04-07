import { describe, expect, it } from 'vitest';

import {
  mergeDeltaSummarySeriesOptions,
  mergeFootprintSeriesOptions,
} from '../../src/models/options';
import { resolveColorScale } from '../../src/utils/color';

describe('color scales and option presets', () => {
  it('supports threshold-based color ranges with clamping', () => {
    const scale = {
      range: {
        from: 0.5,
        to: 1,
        clamp: true,
        invert: false,
      },
      stops: [
        { offset: 0, color: 'rgba(0, 0, 0, 0)' },
        { offset: 1, color: 'rgba(0, 255, 0, 1)' },
      ],
    };

    expect(resolveColorScale(scale, 0.25)).toBe('rgba(0, 0, 0, 0)');
    expect(resolveColorScale(scale, 1)).toBe('rgba(0, 255, 0, 1)');
  });

  it('supports inverted color ranges', () => {
    const scale = {
      range: {
        from: 0,
        to: 1,
        clamp: true,
        invert: true,
      },
      stops: [
        { offset: 0, color: 'rgba(0, 0, 0, 1)' },
        { offset: 1, color: 'rgba(255, 255, 255, 1)' },
      ],
    };

    expect(resolveColorScale(scale, 0)).toBe('rgba(255, 255, 255, 1)');
    expect(resolveColorScale(scale, 1)).toBe('rgba(0, 0, 0, 1)');
  });

  it('merges footprint metric presets by item id', () => {
    const options = mergeFootprintSeriesOptions({
      summary: {
        items: [
          {
            id: 'delta',
            placement: 'top',
            style: {
              backgroundColor: '#020617',
              paddingX: 4,
              paddingY: 2,
            },
          },
        ],
      },
    });

    expect(options.summary.items).toHaveLength(1);
    expect(options.summary.items[0]).toMatchObject({
      id: 'delta',
      label: 'D',
      placement: 'top',
      valueKey: 'delta',
    });
    expect(options.summary.items[0]?.style.backgroundColor).toBe('#020617');
    expect(options.summary.items[0]?.style.paddingX).toBe(4);
    expect(options.summary.items[0]?.style.paddingY).toBe(2);
  });

  it('merges delta summary fill scales with custom input ranges', () => {
    const options = mergeDeltaSummarySeriesOptions({
      rowStyles: {
        delta: {
          positiveFillScale: {
            range: {
              from: 0.5,
              to: 1,
            },
          },
        },
      },
    });

    expect(options.rowStyles.delta.positiveFillScale.range.from).toBe(0.5);
    expect(options.rowStyles.delta.positiveFillScale.range.to).toBe(1);
    expect(options.rowStyles.delta.positiveFillScale.stops).toHaveLength(2);
  });
});
