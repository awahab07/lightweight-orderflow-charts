import type { OrderFlowBar } from '../../models/contracts';
import type { FootprintBarModel } from '../../models/studies';
import type { FootprintSeriesOptions } from '../../models/options';
import { clamp } from '../../utils/math';
import {
  buildPriceGrid,
  inferPricePrecision,
  inferPriceStep,
  roundToPriceStep,
} from '../../utils/priceStep';
import { deriveFootprintMetrics } from './deriveFootprintMetrics';

function resolvePriceStep(bar: OrderFlowBar, options: FootprintSeriesOptions): number | null {
  if (Number.isFinite(options.ladder.priceStep) && options.ladder.priceStep > 0) {
    return options.ladder.priceStep;
  }

  return inferPriceStep(bar.levels);
}

function mergeLevel(
  existing: ReturnType<typeof deriveFootprintMetrics>['levels'][number] | undefined,
  incoming: ReturnType<typeof deriveFootprintMetrics>['levels'][number],
) {
  if (!existing) {
    return { ...incoming };
  }

  return {
    ...existing,
    bidVolume: existing.bidVolume + incoming.bidVolume,
    askVolume: existing.askVolume + incoming.askVolume,
    totalVolume: existing.totalVolume + incoming.totalVolume,
    delta: existing.delta + incoming.delta,
    imbalanceSide:
      existing.imbalanceSide !== 'none' ? existing.imbalanceSide : incoming.imbalanceSide,
    isStackedImbalance: existing.isStackedImbalance || incoming.isStackedImbalance,
  };
}

export function buildFootprintBarModel(
  bar: OrderFlowBar,
  options: FootprintSeriesOptions,
): FootprintBarModel {
  const metrics = deriveFootprintMetrics(bar, {
    imbalanceRatio: options.ladder.imbalanceRatio,
    stackedImbalanceLength: options.ladder.stackedImbalanceLength,
  });
  const range = options.ladder.maxOpacity - options.ladder.minOpacity;
  const averageLevelVolume =
    metrics.levels.length > 0 ? metrics.totalVolume / metrics.levels.length : 0;
  const priceStep = resolvePriceStep(bar, options);
  const precision = priceStep ? inferPricePrecision(priceStep) : 2;
  const normalizedPriceMap = new Map<number, (typeof metrics.levels)[number]>();

  for (const level of metrics.levels) {
    const normalizedPrice = priceStep
      ? roundToPriceStep(level.price, priceStep, precision)
      : level.price;
    normalizedPriceMap.set(
      normalizedPrice,
      mergeLevel(normalizedPriceMap.get(normalizedPrice), level),
    );
  }

  const gridPrices =
    priceStep && Number.isFinite(bar.low) && Number.isFinite(bar.high)
      ? buildPriceGrid(
          roundToPriceStep(bar.low, priceStep, precision),
          roundToPriceStep(bar.high, priceStep, precision),
          priceStep,
          precision,
        )
      : [];
  const normalizedLevels =
    gridPrices.length > 0
      ? gridPrices.map((price) => {
          const level = normalizedPriceMap.get(price);
          return (
            level ?? {
              price,
              bidVolume: 0,
              askVolume: 0,
              totalVolume: 0,
              delta: 0,
              imbalanceSide: 'none' as const,
              isStackedImbalance: false,
            }
          );
        })
      : metrics.levels;

  return {
    time: bar.time,
    open: priceStep ? roundToPriceStep(bar.open, priceStep, precision) : bar.open,
    high: priceStep ? roundToPriceStep(bar.high, priceStep, precision) : bar.high,
    low: priceStep ? roundToPriceStep(bar.low, priceStep, precision) : bar.low,
    close: priceStep ? roundToPriceStep(bar.close, priceStep, precision) : bar.close,
    priceStep,
    totalVolume: metrics.totalVolume,
    delta: metrics.delta,
    sessionId: bar.sessionId,
    levels: normalizedLevels.map((level) => ({
      ...level,
      isPointOfControl: metrics.maxLevelVolume > 0 && level.totalVolume === metrics.maxLevelVolume,
      volumeRatioToMax: metrics.maxLevelVolume > 0 ? level.totalVolume / metrics.maxLevelVolume : 0,
      volumeRatioToAverage: averageLevelVolume > 0 ? level.totalVolume / averageLevelVolume : 0,
      deltaRatioToMaxAbs: metrics.maxAbsDelta > 0 ? level.delta / metrics.maxAbsDelta : 0,
      absoluteDeltaRatioToMaxAbs:
        metrics.maxAbsDelta > 0 ? Math.abs(level.delta) / metrics.maxAbsDelta : 0,
      heat: metrics.maxLevelVolume
        ? clamp(
            options.ladder.minOpacity + (level.totalVolume / metrics.maxLevelVolume) * range,
            options.ladder.minOpacity,
            options.ladder.maxOpacity,
          )
        : 0,
    })),
    maxLevelVolume: metrics.maxLevelVolume,
    maxAbsDelta: metrics.maxAbsDelta,
    averageLevelVolume,
  };
}
