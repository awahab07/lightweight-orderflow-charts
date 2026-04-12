import type { AggregatedMarketBar, OrderFlowBar } from 'lightweight-orderflow-charts';

export interface MinuteCoverageAssessment {
  requiredMinuteCount: number;
  coveredMinuteCount: number;
  contiguousCoveredMinuteCount: number;
  coverageRatio: number;
  firstRequiredTime: number | null;
  lastRequiredTime: number | null;
  firstCoveredTime: number | null;
  lastCoveredTime: number | null;
  resumeRewriteTime: number | null;
  isComplete: boolean;
}

export interface MinuteCoverageOptions {
  priceTolerance?: number;
  volumeTolerance?: number;
}

function normalizeTime(value: AggregatedMarketBar['time'] | OrderFlowBar['time']): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function uniqueSortedTimes(times: number[]): number[] {
  return Array.from(new Set(times)).sort((left, right) => left - right);
}

function resolveRequiredMinuteTimes(marketBars: readonly AggregatedMarketBar[]): number[] {
  const requiredTimes = marketBars
    .filter((bar) => bar.volume > 0)
    .map((bar) => normalizeTime(bar.time))
    .filter((time): time is number => time != null);

  if (requiredTimes.length > 0) {
    return uniqueSortedTimes(requiredTimes);
  }

  return uniqueSortedTimes(
    marketBars
      .map((bar) => normalizeTime(bar.time))
      .filter((time): time is number => time != null),
  );
}

function resolveOrderFlowVolume(bar: OrderFlowBar): number {
  if (typeof bar.totalVolume === 'number' && Number.isFinite(bar.totalVolume)) {
    return bar.totalVolume;
  }

  return bar.levels.reduce(
    (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
    0,
  );
}

function approximatelyEqual(left: number, right: number, tolerance: number): boolean {
  return Math.abs(left - right) <= tolerance;
}

function isCoveredMinute(
  marketBar: AggregatedMarketBar | undefined,
  orderFlowBar: OrderFlowBar | undefined,
  options?: MinuteCoverageOptions,
): boolean {
  if (!marketBar || !orderFlowBar) {
    return false;
  }

  const priceTolerance = Math.max(options?.priceTolerance ?? 0, 0);
  const volumeTolerance = Math.max(options?.volumeTolerance ?? 0, 0);

  return (
    approximatelyEqual(orderFlowBar.open, marketBar.open, priceTolerance) &&
    approximatelyEqual(orderFlowBar.high, marketBar.high, priceTolerance) &&
    approximatelyEqual(orderFlowBar.low, marketBar.low, priceTolerance) &&
    approximatelyEqual(orderFlowBar.close, marketBar.close, priceTolerance) &&
    approximatelyEqual(resolveOrderFlowVolume(orderFlowBar), marketBar.volume, volumeTolerance)
  );
}

export function assessMinuteCoverage(
  marketBars: readonly AggregatedMarketBar[],
  orderFlowBars: readonly OrderFlowBar[],
  options?: MinuteCoverageOptions,
): MinuteCoverageAssessment {
  const requiredMinuteTimes = resolveRequiredMinuteTimes(marketBars);
  const marketBarByTime = new Map(
    marketBars
      .map((bar) => {
        const time = normalizeTime(bar.time);
        return time == null ? null : [time, bar];
      })
      .filter((entry): entry is [number, AggregatedMarketBar] => entry != null),
  );
  const orderFlowBarByTime = new Map(
    orderFlowBars
      .map((bar) => {
        const time = normalizeTime(bar.time);
        return time == null ? null : [time, bar];
      })
      .filter((entry): entry is [number, OrderFlowBar] => entry != null),
  );
  const coveredRequiredMinuteTimes = requiredMinuteTimes.filter((time) =>
    isCoveredMinute(marketBarByTime.get(time), orderFlowBarByTime.get(time), options),
  );
  const coveredRequiredMinuteSet = new Set(coveredRequiredMinuteTimes);
  let contiguousCoveredMinuteCount = 0;

  for (const time of requiredMinuteTimes) {
    if (!coveredRequiredMinuteSet.has(time)) {
      break;
    }
    contiguousCoveredMinuteCount += 1;
  }

  const requiredMinuteCount = requiredMinuteTimes.length;
  const coveredMinuteCount = coveredRequiredMinuteTimes.length;
  const firstRequiredTime = requiredMinuteTimes[0] ?? null;
  const lastRequiredTime = requiredMinuteTimes.at(-1) ?? null;
  const firstCoveredTime = coveredRequiredMinuteTimes[0] ?? null;
  const lastCoveredTime = coveredRequiredMinuteTimes.at(-1) ?? null;

  return {
    requiredMinuteCount,
    coveredMinuteCount,
    contiguousCoveredMinuteCount,
    coverageRatio: requiredMinuteCount > 0 ? coveredMinuteCount / requiredMinuteCount : 1,
    firstRequiredTime,
    lastRequiredTime,
    firstCoveredTime,
    lastCoveredTime,
    resumeRewriteTime:
      contiguousCoveredMinuteCount > 0
        ? requiredMinuteTimes[Math.max(contiguousCoveredMinuteCount - 1, 0)] ?? null
        : null,
    isComplete:
      requiredMinuteCount === 0 ||
      (coveredMinuteCount === requiredMinuteCount &&
        contiguousCoveredMinuteCount === requiredMinuteCount &&
        firstCoveredTime === firstRequiredTime &&
        lastCoveredTime === lastRequiredTime),
  };
}
