import type {
  InstrumentContext,
  OrderFlowBar,
  OrderFlowPatch,
  OrderFlowTickStreamUpdate,
  PriceLevelVolume,
  QuoteTick,
  SessionDefinition,
  TimeValue,
  TradeTick,
} from '../models/contracts';
import { applyOrderFlowPatch } from '../adapters/normalize/applyOrderFlowPatch';
import { normalizeBars } from '../adapters/normalize/normalizeBatch';
import { inferPricePrecision, roundToPriceStep } from '../utils/priceStep';

type ResolvedTradeSide = 'buy' | 'sell';
type TradeClassificationSource = 'explicit-side' | 'quote' | 'tick-rule' | 'carry-forward';

interface MutableBarState {
  bar: OrderFlowBar;
  levels: Map<number, PriceLevelVolume>;
  vwapNumerator: number;
}

export interface CreateOrderFlowTickStreamControllerConfig {
  instrument: InstrumentContext;
  intervalSeconds: number;
  sessions?: SessionDefinition[];
  deriveSessions?: boolean;
}

export interface OrderFlowTickStreamResult {
  bars: OrderFlowBar[];
  patches: OrderFlowPatch[];
  streamActive: boolean;
}

export interface OrderFlowTickStreamController {
  push(update: OrderFlowTickStreamUpdate): OrderFlowTickStreamResult;
  getBars(): OrderFlowBar[];
  reset(): void;
}

export interface BuildOrderFlowBarsFromTicksInput extends CreateOrderFlowTickStreamControllerConfig {
  trades?: TradeTick[];
  quotes?: QuoteTick[];
}

function resolvePricePrecision(instrument: InstrumentContext): number {
  if (Number.isFinite(instrument.pricePrecision) && instrument.pricePrecision >= 0) {
    return instrument.pricePrecision;
  }

  return inferPricePrecision(instrument.tickSize);
}

function bucketTradeTime(unixSeconds: number, intervalSeconds: number): number {
  return Math.floor(unixSeconds / intervalSeconds) * intervalSeconds;
}

function deriveSessionId(unixSeconds: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(unixSeconds * 1000));
}

function buildSortedEvents(update: OrderFlowTickStreamUpdate) {
  return [
    ...(update.quotes ?? []).map((tick) => ({ kind: 'quote' as const, tick })),
    ...(update.trades ?? []).map((tick) => ({ kind: 'trade' as const, tick })),
  ].sort((left, right) => {
    if (left.tick.time !== right.tick.time) {
      return left.tick.time - right.tick.time;
    }

    if (left.kind === right.kind) {
      return 0;
    }

    return left.kind === 'quote' ? -1 : 1;
  });
}

function resolveTradeSide(
  trade: TradeTick,
  latestQuote: QuoteTick | null,
  previousTradePrice: number | null,
  previousResolvedSide: ResolvedTradeSide,
): {
  side: ResolvedTradeSide;
  source: TradeClassificationSource;
} {
  if (trade.side === 'buy' || trade.side === 'sell') {
    return {
      side: trade.side,
      source: 'explicit-side',
    };
  }

  if (latestQuote) {
    if (trade.price >= latestQuote.askPrice) {
      return {
        side: 'buy',
        source: 'quote',
      };
    }

    if (trade.price <= latestQuote.bidPrice) {
      return {
        side: 'sell',
        source: 'quote',
      };
    }
  }

  if (previousTradePrice !== null) {
    if (trade.price > previousTradePrice) {
      return {
        side: 'buy',
        source: 'tick-rule',
      };
    }

    if (trade.price < previousTradePrice) {
      return {
        side: 'sell',
        source: 'tick-rule',
      };
    }
  }

  return {
    side: previousResolvedSide,
    source: 'carry-forward',
  };
}

function finalizeBarState(
  state: MutableBarState,
  sessions?: SessionDefinition[],
  deriveSessions = true,
): OrderFlowBar {
  const totalVolume =
    state.bar.totalVolume ??
    Array.from(state.levels.values()).reduce(
      (sum, level) => sum + (level.totalVolume ?? level.bidVolume + level.askVolume),
      0,
    );
  const delta =
    state.bar.delta ??
    Array.from(state.levels.values()).reduce(
      (sum, level) => sum + (level.delta ?? level.askVolume - level.bidVolume),
      0,
    );
  const bidVolume =
    state.bar.bidVolume ??
    Array.from(state.levels.values()).reduce((sum, level) => sum + level.bidVolume, 0);
  const askVolume =
    state.bar.askVolume ??
    Array.from(state.levels.values()).reduce((sum, level) => sum + level.askVolume, 0);
  const tradeCountRaw =
    state.bar.tradeCount ??
    Array.from(state.levels.values()).reduce((sum, level) => sum + (level.tradeCount ?? 0), 0);
  const tradeCount = tradeCountRaw > 0 ? tradeCountRaw : undefined;
  const sortedLevels = [...state.levels.values()].sort((left, right) => left.price - right.price);
  let pocPrice: number | undefined;
  let pocVolume = -1;

  for (const level of sortedLevels) {
    const levelVolume = level.totalVolume ?? level.bidVolume + level.askVolume;
    if (levelVolume > pocVolume) {
      pocPrice = level.price;
      pocVolume = levelVolume;
    }
  }

  const bar: OrderFlowBar = {
    ...state.bar,
    levels: sortedLevels,
    totalVolume,
    delta,
    bidVolume,
    askVolume,
    tradeCount,
    vwap: totalVolume > 0 ? state.vwapNumerator / totalVolume : undefined,
    pocPrice,
    pocVolume: pocVolume >= 0 ? pocVolume : undefined,
    deltaMin:
      typeof state.bar.deltaMin === 'number' && Number.isFinite(state.bar.deltaMin)
        ? state.bar.deltaMin
        : Math.min(0, delta),
    deltaMax:
      typeof state.bar.deltaMax === 'number' && Number.isFinite(state.bar.deltaMax)
        ? state.bar.deltaMax
        : Math.max(0, delta),
  };

  return normalizeBars([bar], {
    sessions,
    deriveSessions,
  })[0];
}

export function createOrderFlowTickStreamController(
  config: CreateOrderFlowTickStreamControllerConfig,
): OrderFlowTickStreamController {
  const intervalSeconds = Math.max(1, Math.floor(config.intervalSeconds));
  const tickSize = config.instrument.tickSize > 0 ? config.instrument.tickSize : 0.01;
  const pricePrecision = resolvePricePrecision(config.instrument);
  const timezone = config.instrument.timezone || 'UTC';
  const barStates = new Map<string, MutableBarState>();
  let bars: OrderFlowBar[] = [];
  let latestQuote: QuoteTick | null = null;
  let previousTradePrice: number | null = null;
  let previousResolvedSide: ResolvedTradeSide = 'buy';
  let streamActive = false;

  const upsertTrade = (trade: TradeTick) => {
    const bucketTime = bucketTradeTime(trade.time, intervalSeconds);
    const price = roundToPriceStep(trade.price, tickSize, pricePrecision);
    const key = String(bucketTime);
    const existingState = barStates.get(key);
    const { side, source } = resolveTradeSide(
      trade,
      latestQuote,
      previousTradePrice,
      previousResolvedSide,
    );
    previousTradePrice = price;
    previousResolvedSide = side;

    const state =
      existingState ??
      ({
        bar: {
          time: bucketTime as TimeValue,
          open: price,
          high: price,
          low: price,
          close: price,
          levels: [],
          totalVolume: 0,
          delta: 0,
          bidVolume: 0,
          askVolume: 0,
          tradeCount: 0,
          deltaMin: 0,
          deltaMax: 0,
          sessionId: deriveSessionId(trade.time, timezone),
          metadata: {
            aggregation: 'tick-derived',
            classificationMethod: source,
            streamActive: true,
            lastTradeTime: trade.time,
            tradeCount: 0,
          },
        },
        levels: new Map<number, PriceLevelVolume>(),
        vwapNumerator: 0,
      } satisfies MutableBarState);

    if (!existingState) {
      barStates.set(key, state);
    }

    const signedDelta = side === 'buy' ? trade.size : -trade.size;
    state.bar.high = Math.max(state.bar.high, price);
    state.bar.low = Math.min(state.bar.low, price);
    state.bar.close = price;
    state.bar.totalVolume = (state.bar.totalVolume ?? 0) + trade.size;
    state.bar.delta = (state.bar.delta ?? 0) + signedDelta;
    state.bar.deltaMin = Math.min(state.bar.deltaMin ?? 0, state.bar.delta);
    state.bar.deltaMax = Math.max(state.bar.deltaMax ?? 0, state.bar.delta);
    state.bar.tradeCount = (state.bar.tradeCount ?? 0) + 1;
    state.vwapNumerator += price * trade.size;
    if (side === 'buy') {
      state.bar.askVolume = (state.bar.askVolume ?? 0) + trade.size;
    } else {
      state.bar.bidVolume = (state.bar.bidVolume ?? 0) + trade.size;
    }
    state.bar.metadata = {
      ...state.bar.metadata,
      aggregation: 'tick-derived',
      classificationMethod: source,
      streamActive: true,
      lastTradeTime: trade.time,
      tradeCount: Number(state.bar.metadata?.tradeCount ?? 0) + 1,
    };

    const level = state.levels.get(price) ?? {
      price,
      bidVolume: 0,
      askVolume: 0,
      tradeCount: 0,
      totalVolume: 0,
      delta: 0,
    };

    if (side === 'buy') {
      level.askVolume += trade.size;
    } else {
      level.bidVolume += trade.size;
    }

    level.tradeCount = (level.tradeCount ?? 0) + 1;
    level.totalVolume = (level.totalVolume ?? 0) + trade.size;
    level.delta = level.askVolume - level.bidVolume;
    state.levels.set(price, level);

    return {
      key,
      operation: existingState ? ('upsert' as const) : ('append' as const),
      state,
    };
  };

  return {
    push(update) {
      const touched = new Map<
        string,
        {
          operation: 'append' | 'upsert';
          state: MutableBarState;
        }
      >();
      const events = buildSortedEvents(update);

      if (events.length) {
        streamActive = true;
      }

      for (const event of events) {
        if (event.kind === 'quote') {
          latestQuote = event.tick;
          continue;
        }

        const touch = upsertTrade(event.tick);
        if (!touched.has(touch.key)) {
          touched.set(touch.key, touch);
        }
      }

      const patches = [...touched.values()]
        .sort((left, right) => Number(left.state.bar.time) - Number(right.state.bar.time))
        .map((entry) => {
          const bar = finalizeBarState(entry.state, config.sessions, config.deriveSessions);
          const patch: OrderFlowPatch = {
            operation: entry.operation,
            bars: [bar],
            metadata: {
              aggregation: 'tick-derived',
              streamActive,
            },
          };

          bars = applyOrderFlowPatch(bars, patch);
          return patch;
        });

      return {
        bars: [...bars],
        patches,
        streamActive,
      };
    },

    getBars() {
      return [...bars];
    },

    reset() {
      barStates.clear();
      bars = [];
      latestQuote = null;
      previousTradePrice = null;
      previousResolvedSide = 'buy';
      streamActive = false;
    },
  };
}

export function buildOrderFlowBarsFromTicks(
  input: BuildOrderFlowBarsFromTicksInput,
): OrderFlowBar[] {
  const controller = createOrderFlowTickStreamController(input);
  controller.push({
    trades: input.trades,
    quotes: input.quotes,
  });
  return controller.getBars();
}
