import type { ResponsiveWidthValue, WidthRangeOptions } from '../models/options';

function normalizePercentage(value: string): number {
  const numeric = Number.parseFloat(value.slice(0, -1));

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return numeric / 100;
}

export function resolveResponsiveWidth(
  value: ResponsiveWidthValue,
  availableWidth: number,
): number {
  if (typeof value === 'number') {
    return value;
  }

  return availableWidth * normalizePercentage(value);
}

export function resolveWidthRange(
  availableWidth: number,
  range: WidthRangeOptions,
): { min: number; max: number } {
  const min = Math.max(resolveResponsiveWidth(range.min, availableWidth), 0);
  const max = Math.max(resolveResponsiveWidth(range.max, availableWidth), min);

  return {
    min,
    max,
  };
}
