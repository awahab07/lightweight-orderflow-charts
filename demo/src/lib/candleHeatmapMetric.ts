import type { OrderFlowBar, TimeValue } from 'lightweight-orderflow-charts';
import { clamp } from '../../../src/utils/math';

function timeKey(time: TimeValue): string {
  return typeof time === 'object' ? JSON.stringify(time) : String(time);
}

function resolveBarVolume(bar: OrderFlowBar): number {
  if (typeof bar.totalVolume === 'number' && Number.isFinite(bar.totalVolume)) {
    return bar.totalVolume;
  }

  return bar.levels.reduce(
    (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
    0,
  );
}

function resolveBarDelta(bar: OrderFlowBar): number {
  if (typeof bar.delta === 'number' && Number.isFinite(bar.delta)) {
    return bar.delta;
  }

  return bar.levels.reduce(
    (total, level) => total + (level.delta ?? level.askVolume - level.bidVolume),
    0,
  );
}

export function buildDemoCandleHeatmapScores(bars: readonly OrderFlowBar[]): Map<string, number> {
  const scores = new Map<string, number>();

  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index];
    const previousBar = index > 0 ? bars[index - 1] : null;
    const range = Math.max(bar.high - bar.low, 0);
    const volume = resolveBarVolume(bar);
    const delta = resolveBarDelta(bar);
    const closeLocation = range > 0 ? clamp((bar.close - bar.low) / range, 0, 1) : 0.5;
    const deltaScore = volume > 0 ? clamp((delta / volume + 1) / 2, 0, 1) : closeLocation;
    const momentumRange = Math.max(
      range,
      previousBar ? Math.max(previousBar.high - previousBar.low, 0) : 0,
      0.01,
    );
    const momentumScore = previousBar
      ? clamp((bar.close - previousBar.close) / momentumRange / 2 + 0.5, 0, 1)
      : 0.5;
    const score = clamp(0.45 * deltaScore + 0.35 * closeLocation + 0.2 * momentumScore, 0, 1);

    scores.set(timeKey(bar.time), score);
  }

  return scores;
}

export function resolveDemoCandleHeatmapScore(
  bar: OrderFlowBar,
  scores: ReadonlyMap<string, number>,
): number | null {
  return scores.get(timeKey(bar.time)) ?? null;
}
