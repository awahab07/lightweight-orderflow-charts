import type { OrderFlowBar, PriceLevelVolume } from '../../models/contracts';
import type { ImbalanceSide } from '../../models/studies';

export interface DerivedFootprintLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  imbalanceSide: ImbalanceSide;
  isStackedImbalance: boolean;
}

export interface DerivedFootprintMetrics {
  totalVolume: number;
  delta: number;
  maxLevelVolume: number;
  maxAbsDelta: number;
  levels: DerivedFootprintLevel[];
}

export interface DeriveFootprintMetricOptions {
  imbalanceRatio: number;
  stackedImbalanceLength: number;
}

function getTotalVolume(level: PriceLevelVolume): number {
  return level.totalVolume ?? level.bidVolume + level.askVolume;
}

function getDelta(level: PriceLevelVolume): number {
  return level.delta ?? level.askVolume - level.bidVolume;
}

function resolveImbalanceSide(
  levels: PriceLevelVolume[],
  index: number,
  ratio: number,
): ImbalanceSide {
  const current = levels[index];
  const previous = levels[index - 1];
  const next = levels[index + 1];

  if (previous && previous.bidVolume > 0 && current.askVolume / previous.bidVolume >= ratio) {
    return 'buy';
  }

  if (next && next.askVolume > 0 && current.bidVolume / next.askVolume >= ratio) {
    return 'sell';
  }

  return 'none';
}

function applyStackedImbalance(
  levels: DerivedFootprintLevel[],
  minimumLength: number,
): DerivedFootprintLevel[] {
  const updated = levels.map((level) => ({ ...level }));
  let start = 0;

  while (start < updated.length) {
    const side = updated[start].imbalanceSide;
    let end = start;

    while (end + 1 < updated.length && updated[end + 1].imbalanceSide === side && side !== 'none') {
      end += 1;
    }

    if (side !== 'none' && end - start + 1 >= minimumLength) {
      for (let index = start; index <= end; index += 1) {
        updated[index].isStackedImbalance = true;
      }
    }

    start = end + 1;
  }

  return updated;
}

export function deriveFootprintMetrics(
  bar: OrderFlowBar,
  options: DeriveFootprintMetricOptions,
): DerivedFootprintMetrics {
  const levels = bar.levels.map((level, index) => ({
    price: level.price,
    bidVolume: level.bidVolume,
    askVolume: level.askVolume,
    totalVolume: getTotalVolume(level),
    delta: getDelta(level),
    imbalanceSide: resolveImbalanceSide(bar.levels, index, options.imbalanceRatio),
    isStackedImbalance: false,
  }));
  const stackedLevels = applyStackedImbalance(levels, options.stackedImbalanceLength);
  const totalVolume =
    bar.totalVolume ?? stackedLevels.reduce((sum, level) => sum + level.totalVolume, 0);
  const delta = bar.delta ?? stackedLevels.reduce((sum, level) => sum + level.delta, 0);
  const maxLevelVolume = stackedLevels.reduce(
    (maximum, level) => Math.max(maximum, level.totalVolume),
    0,
  );
  const maxAbsDelta = stackedLevels.reduce(
    (maximum, level) => Math.max(maximum, Math.abs(level.delta)),
    0,
  );

  return {
    totalVolume,
    delta,
    maxLevelVolume,
    maxAbsDelta,
    levels: stackedLevels,
  };
}
