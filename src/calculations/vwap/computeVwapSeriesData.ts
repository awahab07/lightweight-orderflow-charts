import type { OrderFlowBar, VwapPoint } from '../../models/contracts';
import type { VwapOptions } from '../../models/options';
import { mergeVwapOptions } from '../../models/options';

function resolveBarContribution(bar: OrderFlowBar): { priceVolume: number; volume: number } {
  if (!bar.levels.length) {
    const volume = bar.totalVolume ?? 0;
    return {
      priceVolume: bar.close * volume,
      volume,
    };
  }

  return bar.levels.reduce(
    (result, level) => {
      const totalVolume = level.totalVolume ?? level.bidVolume + level.askVolume;
      result.priceVolume += level.price * totalVolume;
      result.volume += totalVolume;
      return result;
    },
    { priceVolume: 0, volume: 0 },
  );
}

export function computeVwapSeriesData(
  bars: OrderFlowBar[],
  options?: Partial<VwapOptions>,
): VwapPoint[] {
  const resolvedOptions = mergeVwapOptions(options);
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;
  let currentSessionId: string | undefined;

  return bars.map((bar) => {
    if (
      resolvedOptions.resetMode === 'session' &&
      currentSessionId !== undefined &&
      currentSessionId !== bar.sessionId
    ) {
      cumulativePriceVolume = 0;
      cumulativeVolume = 0;
    }

    currentSessionId = bar.sessionId;

    const contribution = resolveBarContribution(bar);
    cumulativePriceVolume += contribution.priceVolume;
    cumulativeVolume += contribution.volume;

    return {
      time: bar.time,
      value: cumulativeVolume ? cumulativePriceVolume / cumulativeVolume : bar.close,
      sessionId: bar.sessionId,
    };
  });
}
