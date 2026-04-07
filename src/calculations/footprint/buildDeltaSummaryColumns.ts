import type { OrderFlowBar } from '../../models/contracts';
import type { DeltaSummaryColumnModel } from '../../models/studies';

function resolveLevelDelta(bar: OrderFlowBar): number[] {
  return bar.levels.map((level) => level.delta ?? level.askVolume - level.bidVolume);
}

export function buildDeltaSummaryColumns(bars: OrderFlowBar[]): DeltaSummaryColumnModel[] {
  let cumulativeDelta = 0;
  let cumulativeVolume = 0;

  return bars.map((bar) => {
    const levelDeltas = resolveLevelDelta(bar);
    const delta = bar.delta ?? levelDeltas.reduce((sum, value) => sum + value, 0);
    const volume =
      bar.totalVolume ??
      bar.levels.reduce(
        (sum, level) => sum + (level.totalVolume ?? level.bidVolume + level.askVolume),
        0,
      );
    const maxDelta = levelDeltas.length ? Math.max(...levelDeltas) : 0;
    const minDelta = levelDeltas.length ? Math.min(...levelDeltas) : 0;

    cumulativeDelta += delta;
    cumulativeVolume += volume;

    return {
      time: bar.time,
      delta,
      maxDelta,
      minDelta,
      cumulativeDelta,
      cumulativeDeltaToVolumeRatio: cumulativeVolume
        ? (cumulativeDelta / cumulativeVolume) * 100
        : 0,
      volume,
    };
  });
}
