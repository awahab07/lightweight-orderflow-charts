import { normalizeBars } from '../adapters/normalize/normalizeBatch';
import type {
  AggregatedMarketBar,
  OrderFlowBar,
  PriceLevelVolume,
  TimeValue,
} from '../models/contracts';
import { compareTimeValues } from './time';

interface MutableOrderFlowBarState {
  bar: OrderFlowBar;
  levels: Map<number, PriceLevelVolume>;
  sourceCount: number;
  runningDelta: number;
  deltaMin: number;
  deltaMax: number;
}

interface MutableMarketBarState {
  bar: AggregatedMarketBar;
  sourceCount: number;
  runningDelta: number;
  deltaMin: number;
  deltaMax: number;
  hasDeltaPath: boolean;
  hasVwapGap: boolean;
  vwapNumerator: number;
}

function resolveIntervalSeconds(intervalSeconds: number): number {
  const normalized = Math.floor(intervalSeconds);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`A positive intervalSeconds value is required. Received ${intervalSeconds}.`);
  }

  return normalized;
}

function timeValueToUnixSeconds(time: TimeValue): number {
  if (typeof time !== 'number' || !Number.isFinite(time)) {
    throw new Error('Interval aggregation requires numeric second-based time values.');
  }

  return time > 1e12 ? Math.floor(time / 1000) : Math.floor(time);
}

function bucketTime(time: TimeValue, intervalSeconds: number): number {
  return Math.floor(timeValueToUnixSeconds(time) / intervalSeconds) * intervalSeconds;
}

function resolveLevelTotalVolume(level: PriceLevelVolume): number {
  return level.totalVolume ?? level.bidVolume + level.askVolume;
}

function resolveLevelDelta(level: PriceLevelVolume): number {
  return level.delta ?? level.askVolume - level.bidVolume;
}

function resolveOrderFlowBarTotalVolume(bar: OrderFlowBar): number {
  return (
    bar.totalVolume ??
    bar.levels.reduce((total, level) => total + resolveLevelTotalVolume(level), 0)
  );
}

function resolveOrderFlowBarDelta(bar: OrderFlowBar): number {
  return bar.delta ?? bar.levels.reduce((total, level) => total + resolveLevelDelta(level), 0);
}

function resolveOrderFlowBarBidVolume(bar: OrderFlowBar): number {
  return bar.bidVolume ?? bar.levels.reduce((total, level) => total + level.bidVolume, 0);
}

function resolveOrderFlowBarAskVolume(bar: OrderFlowBar): number {
  return bar.askVolume ?? bar.levels.reduce((total, level) => total + level.askVolume, 0);
}

function resolveOrderFlowBarTradeCount(bar: OrderFlowBar): number | undefined {
  if (typeof bar.tradeCount === 'number' && Number.isFinite(bar.tradeCount)) {
    return bar.tradeCount;
  }

  const total = bar.levels.reduce((count, level) => count + (level.tradeCount ?? 0), 0);
  return total > 0 ? total : undefined;
}

function cloneLevel(level: PriceLevelVolume): PriceLevelVolume {
  return {
    ...level,
    totalVolume: resolveLevelTotalVolume(level),
    delta: resolveLevelDelta(level),
  };
}

function mergeLevel(existing: PriceLevelVolume | undefined, level: PriceLevelVolume): PriceLevelVolume {
  const next = cloneLevel(level);
  if (!existing) {
    return next;
  }

  return {
    ...existing,
    bidVolume: existing.bidVolume + next.bidVolume,
    askVolume: existing.askVolume + next.askVolume,
    totalVolume: resolveLevelTotalVolume(existing) + resolveLevelTotalVolume(next),
    delta: resolveLevelDelta(existing) + resolveLevelDelta(next),
    tradeCount: (existing.tradeCount ?? 0) + (next.tradeCount ?? 0) || undefined,
  };
}

function resolvePoc(
  levels: PriceLevelVolume[],
  referencePrice: number,
): { pocPrice?: number; pocVolume?: number } {
  let selected: PriceLevelVolume | null = null;
  let selectedVolume = -1;
  let selectedDistance = Number.POSITIVE_INFINITY;

  for (const level of levels) {
    const totalVolume = resolveLevelTotalVolume(level);
    const distance = Math.abs(level.price - referencePrice);

    if (
      totalVolume > selectedVolume ||
      (totalVolume === selectedVolume && distance < selectedDistance) ||
      (totalVolume === selectedVolume &&
        distance === selectedDistance &&
        selected &&
        level.price > selected.price)
    ) {
      selected = level;
      selectedVolume = totalVolume;
      selectedDistance = distance;
    }
  }

  return selected
    ? {
        pocPrice: selected.price,
        pocVolume: resolveLevelTotalVolume(selected),
      }
    : {};
}

function resolveLevelWeightedPriceVolume(level: PriceLevelVolume): number {
  return level.price * resolveLevelTotalVolume(level);
}

function resolveDeltaExtrema(delta: number, deltaMin?: number, deltaMax?: number): {
  deltaMin: number;
  deltaMax: number;
} {
  return {
    deltaMin:
      typeof deltaMin === 'number' && Number.isFinite(deltaMin) ? deltaMin : Math.min(0, delta),
    deltaMax:
      typeof deltaMax === 'number' && Number.isFinite(deltaMax) ? deltaMax : Math.max(0, delta),
  };
}

export function buildAggregatedMarketBarFromOrderFlowBar(bar: OrderFlowBar): AggregatedMarketBar {
  const levels = [...bar.levels]
    .map(cloneLevel)
    .sort((left, right) => left.price - right.price);
  const volume = resolveOrderFlowBarTotalVolume(bar);
  const delta = resolveOrderFlowBarDelta(bar);
  const bidVolume = resolveOrderFlowBarBidVolume(bar);
  const askVolume = resolveOrderFlowBarAskVolume(bar);
  const tradeCount = resolveOrderFlowBarTradeCount(bar);
  const levelWeightedPriceVolume = levels.reduce(
    (total, level) => total + resolveLevelWeightedPriceVolume(level),
    0,
  );
  const { pocPrice, pocVolume } =
    typeof bar.pocPrice === 'number' && typeof bar.pocVolume === 'number'
      ? {
          pocPrice: bar.pocPrice,
          pocVolume: bar.pocVolume,
        }
      : resolvePoc(levels, bar.close);
  const extrema = resolveDeltaExtrema(delta, bar.deltaMin, bar.deltaMax);

  return {
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume,
    vwap:
      typeof bar.vwap === 'number' && Number.isFinite(bar.vwap)
        ? bar.vwap
        : volume > 0
          ? levelWeightedPriceVolume / volume
          : undefined,
    tradeCount,
    bidVolume,
    askVolume,
    delta,
    deltaMin: extrema.deltaMin,
    deltaMax: extrema.deltaMax,
    pocPrice,
    pocVolume,
    sessionId: bar.sessionId,
    metadata: bar.metadata ? { ...bar.metadata } : undefined,
  };
}

export function buildAggregatedMarketBarsFromOrderFlowBars(
  bars: readonly OrderFlowBar[],
): AggregatedMarketBar[] {
  return [...bars]
    .sort((left, right) => compareTimeValues(left.time, right.time))
    .map((bar) => buildAggregatedMarketBarFromOrderFlowBar(bar));
}

export function aggregateMarketBarsByInterval(
  bars: readonly AggregatedMarketBar[],
  intervalSeconds: number,
): AggregatedMarketBar[] {
  if (!bars.length) {
    return [];
  }

  const normalizedInterval = resolveIntervalSeconds(intervalSeconds);
  const states = new Map<number, MutableMarketBarState>();
  const sortedBars = [...bars].sort((left, right) => compareTimeValues(left.time, right.time));

  for (const bar of sortedBars) {
    const time = bucketTime(bar.time, normalizedInterval);
    const existing = states.get(time);
    const delta = typeof bar.delta === 'number' && Number.isFinite(bar.delta) ? bar.delta : null;
    const extrema =
      delta == null ? null : resolveDeltaExtrema(delta, bar.deltaMin, bar.deltaMax);
    const state =
      existing ??
      ({
        bar: {
          time: time as TimeValue,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: 0,
          tradeCount: 0,
          bidVolume: 0,
          askVolume: 0,
          delta: 0,
          sessionId: bar.sessionId,
          metadata: {
            ...(bar.metadata ?? {}),
            aggregation: 'interval-derived',
            intervalSeconds: normalizedInterval,
          },
        },
        sourceCount: 0,
        runningDelta: 0,
        deltaMin: 0,
        deltaMax: 0,
        hasDeltaPath: false,
        hasVwapGap: false,
        vwapNumerator: 0,
      } satisfies MutableMarketBarState);

    if (!existing) {
      states.set(time, state);
    }

    state.bar.high = Math.max(state.bar.high, bar.high);
    state.bar.low = Math.min(state.bar.low, bar.low);
    state.bar.close = bar.close;
    state.bar.volume += bar.volume;
    state.bar.tradeCount = (state.bar.tradeCount ?? 0) + (bar.tradeCount ?? 0) || undefined;
    state.bar.bidVolume = (state.bar.bidVolume ?? 0) + (bar.bidVolume ?? 0) || undefined;
    state.bar.askVolume = (state.bar.askVolume ?? 0) + (bar.askVolume ?? 0) || undefined;
    state.bar.delta =
      (state.bar.delta ?? 0) + (typeof bar.delta === 'number' && Number.isFinite(bar.delta) ? bar.delta : 0);
    state.sourceCount += 1;

    if (typeof bar.vwap === 'number' && Number.isFinite(bar.vwap)) {
      state.vwapNumerator += bar.vwap * bar.volume;
    } else if (bar.volume > 0) {
      state.hasVwapGap = true;
    }

    if (extrema) {
      state.hasDeltaPath = true;
      state.deltaMin = Math.min(state.deltaMin, state.runningDelta + extrema.deltaMin);
      state.deltaMax = Math.max(state.deltaMax, state.runningDelta + extrema.deltaMax);
      state.runningDelta += delta ?? 0;
    }
  }

  return Array.from(states.values())
    .map((state) => ({
      ...state.bar,
      vwap:
        !state.hasVwapGap && state.bar.volume > 0 ? state.vwapNumerator / state.bar.volume : undefined,
      deltaMin: state.hasDeltaPath ? state.deltaMin : undefined,
      deltaMax: state.hasDeltaPath ? state.deltaMax : undefined,
      tradeCount: state.bar.tradeCount && state.bar.tradeCount > 0 ? state.bar.tradeCount : undefined,
      bidVolume: state.bar.bidVolume && state.bar.bidVolume > 0 ? state.bar.bidVolume : undefined,
      askVolume: state.bar.askVolume && state.bar.askVolume > 0 ? state.bar.askVolume : undefined,
      pocPrice: state.sourceCount === 1 ? state.bar.pocPrice : undefined,
      pocVolume: state.sourceCount === 1 ? state.bar.pocVolume : undefined,
      metadata: {
        ...(state.bar.metadata ?? {}),
        sourceCount: state.sourceCount,
      },
    }))
    .sort((left, right) => compareTimeValues(left.time, right.time));
}

export function aggregateOrderFlowBarsByInterval(
  bars: readonly OrderFlowBar[],
  intervalSeconds: number,
): OrderFlowBar[] {
  if (!bars.length) {
    return [];
  }

  const normalizedInterval = resolveIntervalSeconds(intervalSeconds);
  const states = new Map<number, MutableOrderFlowBarState>();
  const sortedBars = [...bars].sort((left, right) => compareTimeValues(left.time, right.time));

  for (const bar of sortedBars) {
    const time = bucketTime(bar.time, normalizedInterval);
    const existing = states.get(time);
    const delta = resolveOrderFlowBarDelta(bar);
    const extrema = resolveDeltaExtrema(delta, bar.deltaMin, bar.deltaMax);
    const state =
      existing ??
      ({
        bar: {
          time: time as TimeValue,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          levels: [],
          totalVolume: 0,
          delta: 0,
          bidVolume: 0,
          askVolume: 0,
          tradeCount: 0,
          sessionId: bar.sessionId,
          metadata: {
            ...(bar.metadata ?? {}),
            aggregation: 'interval-derived',
            intervalSeconds: normalizedInterval,
          },
        },
        levels: new Map<number, PriceLevelVolume>(),
        sourceCount: 0,
        runningDelta: 0,
        deltaMin: 0,
        deltaMax: 0,
      } satisfies MutableOrderFlowBarState);

    if (!existing) {
      states.set(time, state);
    }

    state.bar.high = Math.max(state.bar.high, bar.high);
    state.bar.low = Math.min(state.bar.low, bar.low);
    state.bar.close = bar.close;
    state.bar.totalVolume = (state.bar.totalVolume ?? 0) + resolveOrderFlowBarTotalVolume(bar);
    state.bar.delta = (state.bar.delta ?? 0) + delta;
    state.bar.bidVolume = (state.bar.bidVolume ?? 0) + resolveOrderFlowBarBidVolume(bar);
    state.bar.askVolume = (state.bar.askVolume ?? 0) + resolveOrderFlowBarAskVolume(bar);
    state.bar.tradeCount =
      (state.bar.tradeCount ?? 0) + (resolveOrderFlowBarTradeCount(bar) ?? 0) || undefined;
    state.sourceCount += 1;

    for (const level of bar.levels) {
      state.levels.set(level.price, mergeLevel(state.levels.get(level.price), level));
    }

    state.deltaMin = Math.min(state.deltaMin, state.runningDelta + extrema.deltaMin);
    state.deltaMax = Math.max(state.deltaMax, state.runningDelta + extrema.deltaMax);
    state.runningDelta += delta;
  }

  return normalizeBars(
    Array.from(states.values())
      .map((state) => {
        const levels = Array.from(state.levels.values()).sort((left, right) => left.price - right.price);
        const totalVolume = levels.reduce((total, level) => total + resolveLevelTotalVolume(level), 0);
        const delta = levels.reduce((total, level) => total + resolveLevelDelta(level), 0);
        const bidVolume = levels.reduce((total, level) => total + level.bidVolume, 0);
        const askVolume = levels.reduce((total, level) => total + level.askVolume, 0);
        const tradeCount = levels.reduce((count, level) => count + (level.tradeCount ?? 0), 0);
        const weightedPriceVolume = levels.reduce(
          (total, level) => total + resolveLevelWeightedPriceVolume(level),
          0,
        );
        const { pocPrice, pocVolume } = resolvePoc(levels, state.bar.close);

        return {
          ...state.bar,
          levels,
          totalVolume,
          delta,
          bidVolume,
          askVolume,
          tradeCount: tradeCount > 0 ? tradeCount : undefined,
          vwap: totalVolume > 0 ? weightedPriceVolume / totalVolume : undefined,
          pocPrice,
          pocVolume,
          deltaMin: state.deltaMin,
          deltaMax: state.deltaMax,
          metadata: {
            ...(state.bar.metadata ?? {}),
            sourceCount: state.sourceCount,
          },
        } satisfies OrderFlowBar;
      })
      .sort((left, right) => compareTimeValues(left.time, right.time)),
  );
}
