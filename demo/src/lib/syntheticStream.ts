import type { OrderFlowBar } from 'lightweight-orderflow-charts';

export const STREAM_BAR_DURATION_MS = 10_000;
export const STREAM_STEP_INTERVAL_MS = 250;
export const STREAM_FRAMES_PER_BAR = Math.max(
  1,
  Math.floor(STREAM_BAR_DURATION_MS / STREAM_STEP_INTERVAL_MS),
);

function scaleNumber(value: number | undefined, progress: number, decimals = 2): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Number((value * progress).toFixed(decimals));
}

function buildPartialBar(bar: OrderFlowBar, progress: number): OrderFlowBar {
  const boundedProgress = Math.min(Math.max(progress, 0), 1);

  return {
    ...bar,
    levels: bar.levels
      .map((level) => {
        const bidVolume = scaleNumber(level.bidVolume, boundedProgress) ?? 0;
        const askVolume = scaleNumber(level.askVolume, boundedProgress) ?? 0;
        const totalVolume =
          scaleNumber(level.totalVolume ?? level.bidVolume + level.askVolume, boundedProgress) ??
          bidVolume + askVolume;
        const delta = scaleNumber(level.delta ?? level.askVolume - level.bidVolume, boundedProgress);

        return {
          ...level,
          bidVolume,
          askVolume,
          totalVolume,
          delta,
          tradeCount: scaleNumber(level.tradeCount, boundedProgress, 0),
        };
      })
      .filter((level) => (level.totalVolume ?? level.bidVolume + level.askVolume) > 0),
    totalVolume: scaleNumber(bar.totalVolume, boundedProgress),
    bidVolume: scaleNumber(bar.bidVolume, boundedProgress),
    askVolume: scaleNumber(bar.askVolume, boundedProgress),
    delta: scaleNumber(bar.delta, boundedProgress),
    tradeCount: scaleNumber(bar.tradeCount, boundedProgress, 0),
    pocVolume: scaleNumber(bar.pocVolume, boundedProgress),
    deltaMin: scaleNumber(bar.deltaMin, boundedProgress),
    deltaMax: scaleNumber(bar.deltaMax, boundedProgress),
    metadata: {
      ...(bar.metadata ?? {}),
      syntheticStream: true,
      syntheticStreamProgress: Number(boundedProgress.toFixed(4)),
    },
  };
}

export function buildSyntheticStreamBars(
  bars: readonly OrderFlowBar[],
  frameIndex: number,
): OrderFlowBar[] {
  if (!bars.length) {
    return [];
  }

  const boundedFrameIndex = Math.max(frameIndex, 0);
  const completedBars = Math.min(Math.floor(boundedFrameIndex / STREAM_FRAMES_PER_BAR), bars.length);
  const partialBarIndex = completedBars;
  const partialFrameProgress =
    partialBarIndex < bars.length
      ? ((boundedFrameIndex % STREAM_FRAMES_PER_BAR) + 1) / STREAM_FRAMES_PER_BAR
      : 1;

  const visibleBars = bars.slice(0, completedBars);
  if (partialBarIndex < bars.length) {
    visibleBars.push(buildPartialBar(bars[partialBarIndex], partialFrameProgress));
  }

  return visibleBars;
}

export function resolveSyntheticStreamFrameCount(bars: readonly OrderFlowBar[]): number {
  return bars.length * STREAM_FRAMES_PER_BAR;
}
