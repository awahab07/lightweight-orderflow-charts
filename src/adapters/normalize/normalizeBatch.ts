import type {
  NormalizationOptions,
  OrderFlowBatch,
  OrderFlowBar,
  PriceLevelVolume,
} from '../../models/contracts';
import { compareTimeValues } from '../../utils/time';
import { resolveSessions } from '../sessions/resolveSessions';

function normalizeLevel(level: PriceLevelVolume): PriceLevelVolume {
  const totalVolume = level.totalVolume ?? level.bidVolume + level.askVolume;
  const delta = level.delta ?? level.askVolume - level.bidVolume;

  return {
    ...level,
    totalVolume,
    delta,
  };
}

function normalizeBar(bar: OrderFlowBar): OrderFlowBar {
  const levels = [...bar.levels]
    .map(normalizeLevel)
    .sort((left, right) => left.price - right.price);
  const totalVolume = bar.totalVolume ?? levels.reduce((sum, level) => sum + level.totalVolume!, 0);
  const delta = bar.delta ?? levels.reduce((sum, level) => sum + level.delta!, 0);

  return {
    ...bar,
    levels,
    totalVolume,
    delta,
  };
}

export function normalizeBars(
  bars: OrderFlowBar[],
  options?: Pick<NormalizationOptions, 'sessions' | 'deriveSessions'>,
): OrderFlowBar[] {
  const normalized = [...bars]
    .map(normalizeBar)
    .sort((left, right) => compareTimeValues(left.time, right.time));

  if (options?.deriveSessions !== false && options?.sessions?.length) {
    return resolveSessions(normalized, options.sessions);
  }

  return normalized;
}

export function normalizeOrderFlowBatch(
  batch: OrderFlowBatch,
  options?: NormalizationOptions,
): OrderFlowBatch {
  const sessions = options?.sessions ?? batch.sessions;

  return {
    ...batch,
    sessions,
    bars: normalizeBars(batch.bars, {
      sessions,
      deriveSessions: options?.deriveSessions,
    }),
  };
}
