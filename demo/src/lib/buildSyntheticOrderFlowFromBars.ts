import {
  normalizeBars,
  type InstrumentContext,
  type OrderFlowBar,
  type PriceLevelVolume,
  type TimeValue,
} from 'lightweight-orderflow-charts';
import {
  buildPriceGrid as buildUniformPriceGrid,
  roundToPriceStep,
} from '../../../src/utils/priceStep';

export interface MarketBarRecord {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  count?: number;
  vwap?: number;
}

export interface SyntheticOrderFlowInput {
  bars: MarketBarRecord[];
  instrument: InstrumentContext;
  maxLevels?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToPrecision(value: number, precision: number): number {
  return Number(value.toFixed(precision));
}

function roundToTick(value: number, tickSize: number, precision: number): number {
  if (!Number.isFinite(tickSize) || tickSize <= 0) {
    return roundToPrecision(value, precision);
  }

  return roundToPriceStep(value, tickSize, precision);
}

function formatSessionId(time: TimeValue, timezone: string): string {
  const date = new Date(Number(time) * 1000);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildPriceGrid(
  low: number,
  high: number,
  open: number,
  close: number,
  tickSize: number,
  precision: number,
  maxLevels: number,
): number[] {
  const anchors = Array.from(
    new Set([
      roundToTick(low, tickSize, precision),
      roundToTick(high, tickSize, precision),
      roundToTick(open, tickSize, precision),
      roundToTick(close, tickSize, precision),
    ]),
  );

  if (high <= low) {
    return anchors.sort((left, right) => left - right);
  }

  const fullGrid = buildUniformPriceGrid(
    roundToTick(low, tickSize, precision),
    roundToTick(high, tickSize, precision),
    tickSize,
    precision,
  );

  if (!Number.isFinite(maxLevels) || maxLevels <= 0 || fullGrid.length <= maxLevels) {
    return Array.from(new Set([...anchors, ...fullGrid])).sort((left, right) => left - right);
  }

  const spanTicks = Math.max(Math.round((high - low) / tickSize), 0);

  if (spanTicks > 0 && spanTicks <= maxLevels - 1) {
    const fullGrid = new Set<number>(anchors);

    for (let index = 0; index <= spanTicks; index += 1) {
      fullGrid.add(roundToTick(low + index * tickSize, tickSize, precision));
    }

    return Array.from(fullGrid).sort((left, right) => left - right);
  }

  const grid = new Set<number>(anchors);
  const availableSlots = Math.max(maxLevels - anchors.length, 0);

  for (let index = 1; index <= availableSlots; index += 1) {
    const position = index / (availableSlots + 1);
    grid.add(roundToTick(low + (high - low) * position, tickSize, precision));
  }

  return Array.from(grid).sort((left, right) => left - right);
}

function buildSyntheticLevels(
  bar: MarketBarRecord,
  tickSize: number,
  precision: number,
  totalVolume: number,
  maxLevels: number,
): PriceLevelVolume[] {
  const open = roundToTick(bar.open, tickSize, precision);
  const high = roundToTick(bar.high, tickSize, precision);
  const low = roundToTick(bar.low, tickSize, precision);
  const close = roundToTick(bar.close, tickSize, precision);
  const prices = buildPriceGrid(low, high, open, close, tickSize, precision, maxLevels);
  const range = Math.max(high - low, tickSize);
  const bodyLow = Math.min(open, close);
  const bodyHigh = Math.max(open, close);
  const bullish = close >= open;

  const weights = prices.map((price) => {
    const distanceToClose = Math.abs(price - close) / range;
    const insideBodyBonus = price >= bodyLow && price <= bodyHigh ? 0.35 : 0;
    const wickBonus = price === high || price === low ? 0.08 : 0;

    return 0.35 + (1 - Math.min(distanceToClose, 1)) * 0.85 + insideBodyBonus + wickBonus;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

  return prices.map((price, index) => {
    const position = range === 0 ? 0.5 : (price - low) / range;
    const directionalBias = bullish ? position : 1 - position;
    const askShare = clamp(
      0.5 + (directionalBias - 0.5) * 0.34 + (bullish ? 0.08 : -0.08),
      0.15,
      0.85,
    );
    const levelTotal = roundToPrecision((totalVolume * weights[index]) / totalWeight, 2);
    const askVolume = roundToPrecision(levelTotal * askShare, 2);
    const bidVolume = roundToPrecision(Math.max(levelTotal - askVolume, 0), 2);

    return {
      price,
      bidVolume,
      askVolume,
      totalVolume: roundToPrecision(bidVolume + askVolume, 2),
      delta: roundToPrecision(askVolume - bidVolume, 2),
      tradeCount: bar.count,
      attributes: {
        synthetic: true,
        source: 'market-bars',
      },
    };
  });
}

export function buildSyntheticOrderFlowFromBars({
  bars,
  instrument,
  maxLevels = Number.POSITIVE_INFINITY,
}: SyntheticOrderFlowInput): OrderFlowBar[] {
  return normalizeBars(
    bars.map((bar) => {
      const tickSize = instrument.tickSize > 0 ? instrument.tickSize : 0.01;
      const pricePrecision = instrument.pricePrecision >= 0 ? instrument.pricePrecision : 2;
      const totalVolume =
        typeof bar.volume === 'number' && Number.isFinite(bar.volume) && bar.volume > 0
          ? bar.volume
          : typeof bar.count === 'number' && Number.isFinite(bar.count) && bar.count > 0
            ? bar.count
            : 1;

      return {
        time: bar.time as TimeValue,
        open: roundToTick(bar.open, tickSize, pricePrecision),
        high: roundToTick(bar.high, tickSize, pricePrecision),
        low: roundToTick(bar.low, tickSize, pricePrecision),
        close: roundToTick(bar.close, tickSize, pricePrecision),
        levels: buildSyntheticLevels(bar, tickSize, pricePrecision, totalVolume, maxLevels),
        totalVolume,
        sessionId: formatSessionId(bar.time as TimeValue, instrument.timezone),
        metadata: {
          syntheticFootprint: true,
          source: 'market-bars',
          rawTradeCount: bar.count,
          vwap: bar.vwap,
        },
      } satisfies OrderFlowBar;
    }),
  );
}
