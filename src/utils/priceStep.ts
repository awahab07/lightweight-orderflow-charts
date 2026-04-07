export interface PriceLike {
  price: number;
}

export function inferPricePrecision(step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 2;
  }

  const notation = step.toString();
  const exponentMatch = notation.match(/e-(\d+)$/i);
  if (exponentMatch) {
    return Number(exponentMatch[1]);
  }

  const [, decimals = ''] = notation.split('.');
  return decimals.length;
}

export function roundToPriceStep(
  value: number,
  step: number,
  precision = inferPricePrecision(step),
): number {
  if (!Number.isFinite(step) || step <= 0) {
    return Number(value.toFixed(Math.max(precision, 0)));
  }

  return Number((Math.round(value / step) * step).toFixed(Math.max(precision, 0)));
}

export function inferPriceStep(levels: PriceLike[]): number | null {
  const prices = Array.from(
    new Set(levels.map((level) => level.price).filter((price) => Number.isFinite(price))),
  ).sort((left, right) => left - right);

  let minimumStep = Number.POSITIVE_INFINITY;

  for (let index = 1; index < prices.length; index += 1) {
    const difference = prices[index] - prices[index - 1];
    if (difference > 0 && difference < minimumStep) {
      minimumStep = difference;
    }
  }

  return Number.isFinite(minimumStep) ? minimumStep : null;
}

export function buildPriceGrid(
  low: number,
  high: number,
  step: number,
  precision = inferPricePrecision(step),
): number[] {
  if (!Number.isFinite(step) || step <= 0) {
    return [];
  }

  const start = roundToPriceStep(Math.min(low, high), step, precision);
  const end = roundToPriceStep(Math.max(low, high), step, precision);
  const startIndex = Math.round(start / step);
  const endIndex = Math.round(end / step);
  const prices: number[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    prices.push(Number((index * step).toFixed(Math.max(precision, 0))));
  }

  return prices;
}
