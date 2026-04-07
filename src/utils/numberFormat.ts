export type NumericRoundingMode = 'round' | 'ceil' | 'floor';

export interface NumericTextFormatOptions {
  digits: number;
  rounding: NumericRoundingMode;
}

export interface CompactNumericFormatOptions {
  integerDigits: number;
  decimalDigits: number;
  rounding: NumericRoundingMode;
  suffixVisible: boolean;
}

const COMPACT_SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Q'] as const;

export function clampDecimalDigits(digits: number): number {
  if (!Number.isFinite(digits)) {
    return 0;
  }

  return Math.max(0, Math.floor(digits));
}

export function clampIntegerDigits(digits: number): number {
  if (!Number.isFinite(digits)) {
    return 1;
  }

  return Math.max(1, Math.floor(digits));
}

export function roundToDigits(
  value: number,
  digits: number,
  rounding: NumericRoundingMode = 'round',
): number {
  const resolvedDigits = clampDecimalDigits(digits);
  const factor = 10 ** resolvedDigits;
  const normalizedValue = Number(value.toFixed(resolvedDigits + 8));
  const scaledValue = normalizedValue * factor;

  let rounded = scaledValue;

  switch (rounding) {
    case 'ceil':
      rounded = Math.ceil(scaledValue - Number.EPSILON);
      break;
    case 'floor':
      rounded = Math.floor(scaledValue + Number.EPSILON);
      break;
    case 'round':
    default:
      rounded = Math.round(scaledValue);
      break;
  }

  return Number((rounded / factor).toFixed(resolvedDigits));
}

export function formatNumericValue(value: number, options: NumericTextFormatOptions): string {
  const resolvedDigits = clampDecimalDigits(options.digits);
  return roundToDigits(value, resolvedDigits, options.rounding).toFixed(resolvedDigits);
}

function resolveIntegerDigits(value: number): number {
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1) {
    return 1;
  }

  return Math.floor(Math.log10(absoluteValue)) + 1;
}

export function formatCompactNumericValue(
  value: number,
  options: CompactNumericFormatOptions,
): string {
  const resolvedIntegerDigits = clampIntegerDigits(options.integerDigits);
  const resolvedDecimalDigits = clampDecimalDigits(options.decimalDigits);
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1000) {
    return formatNumericValue(value, {
      digits: resolvedDecimalDigits,
      rounding: options.rounding,
    });
  }

  let suffixIndex = 0;
  let scaledValue = value;

  while (suffixIndex < COMPACT_SUFFIXES.length - 1) {
    const roundedScaledValue = roundToDigits(scaledValue, resolvedDecimalDigits, options.rounding);
    if (resolveIntegerDigits(roundedScaledValue) <= resolvedIntegerDigits) {
      break;
    }

    suffixIndex += 1;
    scaledValue = value / 1000 ** suffixIndex;
  }

  const numericText = formatNumericValue(scaledValue, {
    digits: resolvedDecimalDigits,
    rounding: options.rounding,
  });
  const suffix = options.suffixVisible ? COMPACT_SUFFIXES[suffixIndex] : '';

  return `${numericText}${suffix}`;
}
