import type { OrderFlowBar } from '../../models/contracts';
import type { ProfileModel, ProfileValueArea } from '../../models/studies';

function buildValueArea(
  volumes: { price: number; totalVolume: number }[],
  pointOfControlIndex: number,
  targetVolume: number,
): ProfileValueArea | null {
  if (!volumes.length) {
    return null;
  }

  let accumulated = volumes[pointOfControlIndex]?.totalVolume ?? 0;
  let lowIndex = pointOfControlIndex;
  let highIndex = pointOfControlIndex;

  while (accumulated < targetVolume) {
    const nextLower = volumes[lowIndex - 1];
    const nextHigher = volumes[highIndex + 1];

    if (!nextLower && !nextHigher) {
      break;
    }

    if ((nextHigher?.totalVolume ?? -1) >= (nextLower?.totalVolume ?? -1)) {
      if (nextHigher) {
        highIndex += 1;
        accumulated += nextHigher.totalVolume;
        continue;
      }
    }

    if (nextLower) {
      lowIndex -= 1;
      accumulated += nextLower.totalVolume;
      continue;
    }
  }

  return {
    low: volumes[lowIndex].price,
    high: volumes[highIndex].price,
  };
}

export function buildProfile(
  bars: OrderFlowBar[],
  scopeId: string,
  valueAreaPercent = 0.7,
  label?: string,
): ProfileModel {
  const byPrice = new Map<
    number,
    {
      bidVolume: number;
      askVolume: number;
      totalVolume: number;
      delta: number;
    }
  >();

  for (const bar of bars) {
    for (const level of bar.levels) {
      const current = byPrice.get(level.price) ?? {
        bidVolume: 0,
        askVolume: 0,
        totalVolume: 0,
        delta: 0,
      };
      current.bidVolume += level.bidVolume;
      current.askVolume += level.askVolume;
      current.totalVolume += level.totalVolume ?? level.bidVolume + level.askVolume;
      current.delta += level.delta ?? level.askVolume - level.bidVolume;
      byPrice.set(level.price, current);
    }
  }

  const levels = [...byPrice.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([price, aggregated]) => ({
      price,
      bidVolume: aggregated.bidVolume,
      askVolume: aggregated.askVolume,
      totalVolume: aggregated.totalVolume,
      delta: aggregated.delta,
      ratio: 0,
    }));
  const maxVolume = levels.reduce((maximum, level) => Math.max(maximum, level.totalVolume), 0);
  const levelsWithRatio = levels.map((level) => ({
    ...level,
    ratio: maxVolume ? level.totalVolume / maxVolume : 0,
  }));
  const pointOfControlIndex = levelsWithRatio.reduce(
    (bestIndex, level, index, collection) =>
      level.totalVolume > (collection[bestIndex]?.totalVolume ?? -1) ? index : bestIndex,
    0,
  );
  const totalProfileVolume = levelsWithRatio.reduce((sum, level) => sum + level.totalVolume, 0);
  const pointOfControl = levelsWithRatio[pointOfControlIndex]?.price ?? null;
  const valueArea =
    totalProfileVolume > 0
      ? buildValueArea(
          levelsWithRatio.map((level) => ({
            price: level.price,
            totalVolume: level.totalVolume,
          })),
          pointOfControlIndex,
          totalProfileVolume * valueAreaPercent,
        )
      : null;

  return {
    scopeId,
    label,
    levels: levelsWithRatio,
    maxVolume,
    pointOfControl,
    valueArea,
  };
}
