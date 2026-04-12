import type {
  AggregatedMarketBar,
  InstrumentContext,
  OrderFlowBar,
  QuoteTick,
  TradeTick,
} from 'lightweight-orderflow-charts';
import {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
  buildAggregatedMarketBarsFromOrderFlowBars,
  buildOrderFlowBarsFromTicks,
} from 'lightweight-orderflow-charts';

import {
  buildSyntheticOrderFlowFromBars,
  type MarketBarRecord,
} from './buildSyntheticOrderFlowFromBars';

type BarInterval = '1m' | '5m';
type SymbolCode = 'NVDA' | 'TSLA';

interface MarketInstrumentRecord {
  symbol: string;
  conId?: number;
  exchange?: string;
  primaryExch?: string;
  localSymbol?: string;
  timezone?: string;
  minTick?: number | null;
  marketName?: string;
  longName?: string;
}

const instrumentModules = import.meta.glob('../../../data/market/*/instrument.json', {
  eager: true,
});
const minuteBarModules = import.meta.glob('../../../data/market/*/*/bars-1m.json', {
  eager: true,
});
const minuteOrderFlowModules = import.meta.glob('../../../data/market/*/*/orderflow-1m.json', {
  eager: true,
});
const legacyTradeTickModules = import.meta.glob('../../../data/market/*/*/trades.ndjson.gz.partial', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const legacyQuoteTickModules = import.meta.glob('../../../data/market/*/*/quotes.ndjson.gz.partial', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const instruments = new Map<SymbolCode, MarketInstrumentRecord>();
const marketBars1mByKey = new Map<string, AggregatedMarketBar[]>();
const orderFlowBars1mByKey = new Map<string, OrderFlowBar[]>();
const legacyTradesByKey = new Map<string, TradeTick[]>();
const legacyQuotesByKey = new Map<string, QuoteTick[]>();
const datesBySymbol = new Map<SymbolCode, Set<string>>();

function parseNdjson<T>(rawText: string): T[] {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

export function intervalToSeconds(interval: BarInterval): number {
  switch (interval) {
    case '1m':
      return 60;
    case '5m':
      return 300;
  }
}

function derivePricePrecision(tickSize: number): number {
  if (!Number.isFinite(tickSize) || tickSize <= 0) {
    return 2;
  }

  const notation = tickSize.toString();
  const exponentMatch = notation.match(/e-(\d+)$/i);
  if (exponentMatch) {
    return Number(exponentMatch[1]);
  }

  const [, decimals = ''] = notation.split('.');
  return decimals.length;
}

for (const [pathname, moduleValue] of Object.entries(instrumentModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/instrument\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  instruments.set(symbol, (moduleValue as { default: MarketInstrumentRecord }).default);
}

for (const [pathname, moduleValue] of Object.entries(minuteBarModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/bars-1m\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  marketBars1mByKey.set(
    `${symbol}:${sessionDate}`,
    (moduleValue as { default: AggregatedMarketBar[] }).default,
  );

  if (!datesBySymbol.has(symbol)) {
    datesBySymbol.set(symbol, new Set());
  }
  datesBySymbol.get(symbol)?.add(sessionDate);
}

for (const [pathname, moduleValue] of Object.entries(minuteOrderFlowModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/orderflow-1m\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  orderFlowBars1mByKey.set(
    `${symbol}:${sessionDate}`,
    (moduleValue as { default: OrderFlowBar[] }).default,
  );

  if (!datesBySymbol.has(symbol)) {
    datesBySymbol.set(symbol, new Set());
  }
  datesBySymbol.get(symbol)?.add(sessionDate);
}

for (const [pathname, moduleValue] of Object.entries(legacyTradeTickModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/trades\.ndjson\.gz\.partial$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  legacyTradesByKey.set(
    `${symbol}:${sessionDate}`,
    parseNdjson<TradeTick>((moduleValue as string) || ''),
  );

  if (!datesBySymbol.has(symbol)) {
    datesBySymbol.set(symbol, new Set());
  }
  datesBySymbol.get(symbol)?.add(sessionDate);
}

for (const [pathname, moduleValue] of Object.entries(legacyQuoteTickModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/quotes\.ndjson\.gz\.partial$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  legacyQuotesByKey.set(
    `${symbol}:${sessionDate}`,
    parseNdjson<QuoteTick>((moduleValue as string) || ''),
  );

  if (!datesBySymbol.has(symbol)) {
    datesBySymbol.set(symbol, new Set());
  }
  datesBySymbol.get(symbol)?.add(sessionDate);
}

export type { BarInterval, SymbolCode, MarketBarRecord, MarketInstrumentRecord };

export const AVAILABLE_SYMBOLS = Array.from(instruments.keys()).sort() as SymbolCode[];
export const AVAILABLE_INTERVALS: BarInterval[] = ['1m', '5m'];

export function availableDatesForSymbol(symbol: SymbolCode): string[] {
  return Array.from(datesBySymbol.get(symbol) ?? []).sort();
}

export function preferredTickDateForSymbol(symbol: SymbolCode): string | null {
  let bestDate: string | null = null;
  let bestBarCount = -1;

  for (const [key, orderFlowBars] of orderFlowBars1mByKey.entries()) {
    const [entrySymbol, sessionDate] = key.split(':');
    if (entrySymbol !== symbol) {
      continue;
    }

    if (orderFlowBars.length > bestBarCount) {
      bestBarCount = orderFlowBars.length;
      bestDate = sessionDate;
    }
  }

  if (bestDate) {
    return bestDate;
  }

  let bestTimeSpan = -1;
  let bestTradeCount = -1;

  for (const [key, trades] of legacyTradesByKey.entries()) {
    const [entrySymbol, sessionDate] = key.split(':');
    if (entrySymbol !== symbol) {
      continue;
    }

    const timeSpan =
      trades.length > 1 ? trades[trades.length - 1].time - trades[0].time : trades.length ? 1 : 0;

    if (
      timeSpan > bestTimeSpan ||
      (timeSpan === bestTimeSpan && trades.length > bestTradeCount)
    ) {
      bestTimeSpan = timeSpan;
      bestTradeCount = trades.length;
      bestDate = sessionDate;
    }
  }

  return bestDate ?? availableDatesForSymbol(symbol).at(-1) ?? null;
}

export function loadInstrument(symbol: SymbolCode): InstrumentContext {
  const instrument = instruments.get(symbol);
  const tickSize = instrument?.minTick && instrument.minTick > 0 ? instrument.minTick : 0.01;

  return {
    instrumentId: instrument?.conId != null ? String(instrument.conId) : `${symbol}-STK-SMART`,
    symbol,
    tickSize,
    pricePrecision: derivePricePrecision(tickSize),
    timezone: instrument?.timezone || 'America/New_York',
    volumePrecision: 0,
  };
}

export function loadMarketBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): AggregatedMarketBar[] {
  const sessionKey = `${symbol}:${sessionDate}`;
  const intervalSeconds = intervalToSeconds(interval);
  const storedBars1m = marketBars1mByKey.get(sessionKey);
  if (storedBars1m?.length) {
    return interval === '1m'
      ? storedBars1m.slice()
      : aggregateMarketBarsByInterval(storedBars1m, intervalSeconds);
  }

  const storedOrderFlow1m = orderFlowBars1mByKey.get(sessionKey);
  if (storedOrderFlow1m?.length) {
    const derivedBars1m = buildAggregatedMarketBarsFromOrderFlowBars(storedOrderFlow1m);
    return interval === '1m'
      ? derivedBars1m
      : aggregateMarketBarsByInterval(derivedBars1m, intervalSeconds);
  }

  return [];
}

export function loadOrderFlowBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): OrderFlowBar[] {
  const sessionKey = `${symbol}:${sessionDate}`;
  const intervalSeconds = intervalToSeconds(interval);
  const storedOrderFlow1m = orderFlowBars1mByKey.get(sessionKey);
  if (storedOrderFlow1m?.length) {
    return interval === '1m'
      ? storedOrderFlow1m.slice()
      : aggregateOrderFlowBarsByInterval(storedOrderFlow1m, intervalSeconds);
  }

  const legacyTickDerived = loadLegacyTickDerivedOrderFlowBars(symbol, sessionDate, interval);
  if (legacyTickDerived.length) {
    return legacyTickDerived;
  }

  return buildSyntheticOrderFlowFromBars({
    bars: loadMarketBars(symbol, sessionDate, interval).map((bar) => ({
      time: Number(bar.time),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      count: bar.tradeCount,
      vwap: bar.vwap,
    })),
    instrument: loadInstrument(symbol),
  });
}

export function hasStoredTradeTicks(symbol: SymbolCode, sessionDate: string): boolean {
  return legacyTradesByKey.has(`${symbol}:${sessionDate}`);
}

export function loadTradeTicks(symbol: SymbolCode, sessionDate: string): TradeTick[] {
  return legacyTradesByKey.get(`${symbol}:${sessionDate}`) ?? [];
}

export function loadQuoteTicks(symbol: SymbolCode, sessionDate: string): QuoteTick[] {
  return legacyQuotesByKey.get(`${symbol}:${sessionDate}`) ?? [];
}

function loadLegacyTickDerivedOrderFlowBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): OrderFlowBar[] {
  const sessionKey = `${symbol}:${sessionDate}`;
  if (!legacyTradesByKey.has(sessionKey)) {
    return [];
  }

  return buildOrderFlowBarsFromTicks({
    instrument: loadInstrument(symbol),
    intervalSeconds: intervalToSeconds(interval),
    trades: legacyTradesByKey.get(sessionKey) ?? [],
    quotes: legacyQuotesByKey.get(sessionKey) ?? [],
  });
}

export function loadTickDerivedOrderFlowBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): OrderFlowBar[] {
  const sessionKey = `${symbol}:${sessionDate}`;
  const intervalSeconds = intervalToSeconds(interval);
  const storedOrderFlow1m = orderFlowBars1mByKey.get(sessionKey);
  if (storedOrderFlow1m?.length) {
    return interval === '1m'
      ? storedOrderFlow1m.slice()
      : aggregateOrderFlowBarsByInterval(storedOrderFlow1m, intervalSeconds);
  }

  return loadLegacyTickDerivedOrderFlowBars(symbol, sessionDate, interval);
}
