import { describe, expect, it } from 'vitest';

import { resolveMetricStyleToken, resolveMetricStyleVariant } from '../../src';

describe('metric style palette', () => {
  it('resolves secondary variants by merging onto the slot primary', () => {
    const token = resolveMetricStyleToken(
      {
        metric0: {
          primary: {
            color: '#2563eb',
            font: '700 11px Inter',
            border: '1px solid rgba(37, 99, 235, 0.2)',
          },
          secondary: {
            color: '#dc2626',
          },
        },
      },
      'metric0',
      'secondary',
    );

    expect(token).toEqual({
      color: '#dc2626',
      font: '700 11px Inter',
      border: '1px solid rgba(37, 99, 235, 0.2)',
    });
  });

  it('falls back to the nearest lower primary slot when a higher slot is missing', () => {
    const token = resolveMetricStyleToken(
      {
        metric0: {
          primary: {
            color: '#2563eb',
            font: '700 11px Inter',
          },
        },
        metric2: {
          primary: {
            color: '#16a34a',
            font: '700 11px Inter',
          },
        },
      },
      'metric5',
      'primary',
    );

    expect(token).toEqual({
      color: '#16a34a',
      font: '700 11px Inter',
    });
  });

  it('maps auto variants from numeric sign', () => {
    expect(resolveMetricStyleVariant(5, 'auto')).toBe('primary');
    expect(resolveMetricStyleVariant(-5, 'auto')).toBe('secondary');
    expect(resolveMetricStyleVariant(0, 'auto')).toBe('primary');
  });

  it('throws when metric0.primary is missing', () => {
    expect(() => resolveMetricStyleToken({}, 'metric0', 'primary')).toThrow(
      'Metric style palette requires "metric0.primary" with both color and font.',
    );
  });
});
