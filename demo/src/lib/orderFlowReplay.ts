import type { OrderFlowBar, OrderFlowPatch, PriceLevelVolume } from 'lightweight-orderflow-charts';

export const STREAM_BAR_DURATION_MS = 10_000;
export const STREAM_STEPS_PER_BAR = 5;
export const STREAM_STEP_INTERVAL_MS = Math.max(
  250,
  Math.floor(STREAM_BAR_DURATION_MS / STREAM_STEPS_PER_BAR),
);

function roundVolume(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Number(value.toFixed(2));
}

function nearestLevelIndex(levels: PriceLevelVolume[], price: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < levels.length; index += 1) {
    const distance = Math.abs(levels[index].price - price);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function buildReplayBar(sourceBar: OrderFlowBar, progress: number): OrderFlowBar {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const revealCount = Math.max(1, Math.ceil(sourceBar.levels.length * clampedProgress));
  const openIndex = nearestLevelIndex(sourceBar.levels, sourceBar.open);
  const halfWindow = Math.floor(revealCount / 2);
  let start = Math.max(0, openIndex - halfWindow);
  let end = Math.min(sourceBar.levels.length, start + revealCount);
  start = Math.max(0, end - revealCount);

  const visibleLevels = sourceBar.levels.slice(start, end).map((level) => {
    const bidVolume = level.bidVolume * clampedProgress;
    const askVolume = level.askVolume * clampedProgress;
    const totalVolume =
      level.totalVolume !== undefined ? level.totalVolume * clampedProgress : bidVolume + askVolume;
    const delta = level.delta !== undefined ? level.delta * clampedProgress : askVolume - bidVolume;

    return {
      ...level,
      bidVolume: roundVolume(bidVolume) ?? 0,
      askVolume: roundVolume(askVolume) ?? 0,
      totalVolume: roundVolume(totalVolume),
      delta: roundVolume(delta),
    } satisfies PriceLevelVolume;
  });

  const interpolatedClose = sourceBar.open + (sourceBar.close - sourceBar.open) * clampedProgress;
  const levelLow = visibleLevels[0]?.price ?? sourceBar.open;
  const levelHigh = visibleLevels[visibleLevels.length - 1]?.price ?? sourceBar.open;
  const totalVolume =
    sourceBar.totalVolume !== undefined
      ? roundVolume(sourceBar.totalVolume * clampedProgress)
      : roundVolume(
          visibleLevels.reduce(
            (sum, level) => sum + (level.totalVolume ?? level.bidVolume + level.askVolume),
            0,
          ),
        );
  const delta =
    sourceBar.delta !== undefined
      ? roundVolume(sourceBar.delta * clampedProgress)
      : roundVolume(
          visibleLevels.reduce(
            (sum, level) => sum + (level.delta ?? level.askVolume - level.bidVolume),
            0,
          ),
        );

  return {
    ...sourceBar,
    high: Math.max(sourceBar.open, interpolatedClose, levelHigh),
    low: Math.min(sourceBar.open, interpolatedClose, levelLow),
    close: interpolatedClose,
    levels: visibleLevels,
    totalVolume: totalVolume ?? undefined,
    delta: delta ?? undefined,
    metadata: {
      ...sourceBar.metadata,
      replayProgress: clampedProgress,
    },
  };
}

export function buildReplayPatch(
  sourceBar: OrderFlowBar,
  stageIndex: number,
  stageCount = STREAM_STEPS_PER_BAR,
): OrderFlowPatch {
  const clampedStageCount = Math.max(stageCount, 1);
  const progress = Math.min(Math.max((stageIndex + 1) / clampedStageCount, 0), 1);

  return {
    operation: stageIndex === 0 ? 'append' : 'upsert',
    bars: [buildReplayBar(sourceBar, progress)],
    metadata: {
      replayProgress: progress,
      sourceMode: sourceBar.metadata?.aggregation ?? 'ohlc-synthetic',
    },
  };
}
