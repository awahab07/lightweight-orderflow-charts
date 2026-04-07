import { describe, expect, it } from 'vitest';

import {
  formatCompactNumericValue,
  formatNumericValue,
  roundToDigits,
} from 'lightweight-orderflow-charts';

describe('number formatting utilities', () => {
  it('formats values with ceil rounding by default-friendly settings', () => {
    expect(formatNumericValue(405.03000000000003, { digits: 2, rounding: 'ceil' })).toBe('405.03');
    expect(formatNumericValue(405.031, { digits: 2, rounding: 'ceil' })).toBe('405.04');
  });

  it('supports floor and round modes', () => {
    expect(roundToDigits(405.039, 2, 'floor')).toBe(405.03);
    expect(roundToDigits(405.035, 2, 'round')).toBe(405.04);
  });

  it('supports zero or higher decimal digits', () => {
    expect(formatNumericValue(405.99, { digits: 0, rounding: 'floor' })).toBe('405');
    expect(formatNumericValue(0.005, { digits: 3, rounding: 'ceil' })).toBe('0.005');
  });

  it('formats compact values with integer digits and optional suffixes', () => {
    expect(
      formatCompactNumericValue(12345, {
        integerDigits: 2,
        decimalDigits: 1,
        rounding: 'ceil',
        suffixVisible: true,
      }),
    ).toBe('12.4k');
    expect(
      formatCompactNumericValue(12345, {
        integerDigits: 2,
        decimalDigits: 1,
        rounding: 'ceil',
        suffixVisible: false,
      }),
    ).toBe('12.4');
    expect(
      formatCompactNumericValue(184509.37, {
        integerDigits: 2,
        decimalDigits: 1,
        rounding: 'ceil',
        suffixVisible: true,
      }),
    ).toBe('0.2M');
  });
});
