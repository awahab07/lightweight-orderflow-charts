import type { OrderFlowBar, PriceLevelVolume } from '../models/contracts';
import { inferPricePrecision } from './priceStep';

export interface OhlcLike {
  open: number;
  high: number;
  low: number;
  close: number;
}

export const MIN_MINTICK = Number.MIN_VALUE;
export const MAX_MINTICK = Number.POSITIVE_INFINITY;
export const DEFAULT_MINTICK_CANDIDATES = [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1] as const;

const FLOAT_EPSILON = 1e-8;

function resolveMintickPrecision(mintick: number, sourceTickSize?: number): number {
  return Math.max(
    inferPricePrecision(mintick),
    sourceTickSize && sourceTickSize > 0 ? inferPricePrecision(sourceTickSize) : 0,
  );
}

export function normalizeMintick(
  mintick: number | null | undefined,
  sourceTickSize?: number,
): number | null {
  if (!Number.isFinite(mintick) || !mintick || mintick <= 0) {
    return null;
  }

  const precision = resolveMintickPrecision(mintick, sourceTickSize);
  const normalized = Number(mintick.toFixed(precision));

  return normalized;
}

export function bucketPriceToMintick(
  value: number,
  mintick: number,
  sourceTickSize?: number,
): number {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);
  if (!normalizedMintick) {
    return value;
  }

  const precision = resolveMintickPrecision(normalizedMintick, sourceTickSize);
  const bucketIndex = Math.floor(value / normalizedMintick + FLOAT_EPSILON);
  return Number((bucketIndex * normalizedMintick).toFixed(precision));
}

export function buildSupportedMinticks(
  sourceTickSize: number,
  candidates: readonly number[] = DEFAULT_MINTICK_CANDIDATES,
): number[] {
  const values = new Set<number>();
  const normalizedSourceTick = normalizeMintick(sourceTickSize, sourceTickSize);

  if (normalizedSourceTick) {
    values.add(normalizedSourceTick);
  }

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeMintick(candidate, sourceTickSize);
    if (normalizedCandidate) {
      values.add(normalizedCandidate);
    }
  }

  return Array.from(values).sort((left, right) => left - right);
}

function mergePriceLevel(
  existing: PriceLevelVolume | undefined,
  level: PriceLevelVolume,
  price: number,
): PriceLevelVolume {
  const totalVolume = level.totalVolume ?? level.bidVolume + level.askVolume;
  const delta = level.delta ?? level.askVolume - level.bidVolume;

  if (!existing) {
    return {
      ...level,
      price,
      totalVolume,
      delta,
    };
  }

  return {
    ...existing,
    price,
    bidVolume: existing.bidVolume + level.bidVolume,
    askVolume: existing.askVolume + level.askVolume,
    totalVolume: (existing.totalVolume ?? existing.bidVolume + existing.askVolume) + totalVolume,
    delta: (existing.delta ?? existing.askVolume - existing.bidVolume) + delta,
    tradeCount: (existing.tradeCount ?? 0) + (level.tradeCount ?? 0) || undefined,
  };
}

export function clusterPriceLevelsByMintick(
  levels: PriceLevelVolume[],
  mintick: number,
  sourceTickSize?: number,
): PriceLevelVolume[] {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);

  if (!normalizedMintick) {
    return levels;
  }

  const clusteredLevels = new Map<number, PriceLevelVolume>();

  for (const level of levels) {
    const price = bucketPriceToMintick(level.price, normalizedMintick, sourceTickSize);
    clusteredLevels.set(price, mergePriceLevel(clusteredLevels.get(price), level, price));
  }

  return Array.from(clusteredLevels.values()).sort((left, right) => left.price - right.price);
}

export function clusterOhlcBarByMintick<T extends OhlcLike>(
  bar: T,
  mintick: number,
  sourceTickSize?: number,
): T {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);

  if (!normalizedMintick) {
    return bar;
  }

  return {
    ...bar,
    open: bucketPriceToMintick(bar.open, normalizedMintick, sourceTickSize),
    high: bucketPriceToMintick(bar.high, normalizedMintick, sourceTickSize),
    low: bucketPriceToMintick(bar.low, normalizedMintick, sourceTickSize),
    close: bucketPriceToMintick(bar.close, normalizedMintick, sourceTickSize),
  };
}

export function clusterOhlcBarsByMintick<T extends OhlcLike>(
  bars: readonly T[],
  mintick: number,
  sourceTickSize?: number,
): T[] {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);

  if (!normalizedMintick) {
    return bars.slice();
  }

  return bars.map((bar) => clusterOhlcBarByMintick(bar, normalizedMintick, sourceTickSize));
}

export function clusterOrderFlowBarByMintick(
  bar: OrderFlowBar,
  mintick: number,
  sourceTickSize?: number,
): OrderFlowBar {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);

  if (!normalizedMintick) {
    return bar;
  }

  const levels = clusterPriceLevelsByMintick(bar.levels, normalizedMintick, sourceTickSize);
  const totalVolume = levels.reduce(
    (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
    0,
  );
  const delta = levels.reduce(
    (total, level) => total + (level.delta ?? level.askVolume - level.bidVolume),
    0,
  );
  const bidVolume = levels.reduce((total, level) => total + level.bidVolume, 0);
  const askVolume = levels.reduce((total, level) => total + level.askVolume, 0);
  const tradeCount = levels.reduce((count, level) => count + (level.tradeCount ?? 0), 0);
  const weightedPriceVolume = levels.reduce(
    (total, level) => total + level.price * (level.totalVolume ?? level.bidVolume + level.askVolume),
    0,
  );
  let pocPrice: number | undefined;
  let pocVolume = -1;

  for (const level of levels) {
    const levelVolume = level.totalVolume ?? level.bidVolume + level.askVolume;
    if (levelVolume > pocVolume) {
      pocPrice = level.price;
      pocVolume = levelVolume;
    }
  }

  return {
    ...clusterOhlcBarByMintick(bar, normalizedMintick, sourceTickSize),
    levels,
    totalVolume,
    delta,
    bidVolume,
    askVolume,
    tradeCount: tradeCount > 0 ? tradeCount : undefined,
    vwap: totalVolume > 0 ? weightedPriceVolume / totalVolume : undefined,
    pocPrice,
    pocVolume: pocVolume >= 0 ? pocVolume : undefined,
  };
}

export function clusterOrderFlowBarsByMintick(
  bars: readonly OrderFlowBar[],
  mintick: number,
  sourceTickSize?: number,
): OrderFlowBar[] {
  const normalizedMintick = normalizeMintick(mintick, sourceTickSize);

  if (!normalizedMintick) {
    return bars.slice();
  }

  return bars.map((bar) => clusterOrderFlowBarByMintick(bar, normalizedMintick, sourceTickSize));
}
