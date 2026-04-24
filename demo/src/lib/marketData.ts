import type { AggregatedMarketBar, InstrumentContext, OrderFlowBar } from 'lightweight-orderflow-charts';
import {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
  buildAggregatedMarketBarsFromOrderFlowBars,
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

const instrumentModules = import.meta.glob('../../../data/market/*/instrument.json', { eager: true });
const minuteBarModules = import.meta.glob('../../../data/market/*/*/bars-1m.json');
const minuteOrderFlowModules = import.meta.glob('../../../data/market/*/*/orderflow-1m.json');

const instruments = new Map<SymbolCode, MarketInstrumentRecord>();
const datesBySymbol = new Map<SymbolCode, Set<string>>();
const minuteBarLoadersByKey = new Map<string, () => Promise<unknown>>();
const minuteOrderFlowLoadersByKey = new Map<string, () => Promise<unknown>>();
const marketBars1mCache = new Map<string, Promise<AggregatedMarketBar[]>>();
const orderFlowBars1mCache = new Map<string, Promise<OrderFlowBar[]>>();

type JsonModule<T> = { default: T } | T;

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

for (const [pathname, moduleLoader] of Object.entries(minuteBarModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/bars-1m\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  minuteBarLoadersByKey.set(`${symbol}:${sessionDate}`, moduleLoader);

  if (!datesBySymbol.has(symbol)) {
    datesBySymbol.set(symbol, new Set());
  }
  datesBySymbol.get(symbol)?.add(sessionDate);
}

for (const [pathname, moduleLoader] of Object.entries(minuteOrderFlowModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/orderflow-1m\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  minuteOrderFlowLoadersByKey.set(`${symbol}:${sessionDate}`, moduleLoader);

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
  const orderFlowDates = Array.from(minuteOrderFlowLoadersByKey.keys())
    .map((key) => key.split(':'))
    .filter(([entrySymbol]) => entrySymbol === symbol)
    .map(([, sessionDate]) => sessionDate)
    .sort();

  if (orderFlowDates.length > 0) {
    return orderFlowDates.at(-1) ?? null;
  }

  return availableDatesForSymbol(symbol).at(-1) ?? null;
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

async function loadJsonModule<T>(loader: () => Promise<unknown>): Promise<T> {
  const moduleValue = (await loader()) as JsonModule<T>;
  if (typeof moduleValue === 'object' && moduleValue && 'default' in moduleValue) {
    return (moduleValue as { default: T }).default;
  }

  return moduleValue as T;
}

async function loadMarketBars1m(symbol: SymbolCode, sessionDate: string): Promise<AggregatedMarketBar[]> {
  const sessionKey = `${symbol}:${sessionDate}`;
  if (!marketBars1mCache.has(sessionKey)) {
    marketBars1mCache.set(
      sessionKey,
      (async () => {
        const directLoader = minuteBarLoadersByKey.get(sessionKey);
        if (directLoader) {
          return loadJsonModule<AggregatedMarketBar[]>(directLoader);
        }

        if (minuteOrderFlowLoadersByKey.has(sessionKey)) {
          const orderFlowBars = await loadOrderFlowBars1m(symbol, sessionDate);
          return buildAggregatedMarketBarsFromOrderFlowBars(orderFlowBars);
        }

        return [];
      })(),
    );
  }

  return (await marketBars1mCache.get(sessionKey)) ?? [];
}

async function loadOrderFlowBars1m(symbol: SymbolCode, sessionDate: string): Promise<OrderFlowBar[]> {
  const sessionKey = `${symbol}:${sessionDate}`;
  if (!orderFlowBars1mCache.has(sessionKey)) {
    orderFlowBars1mCache.set(
      sessionKey,
      (async () => {
        const directLoader = minuteOrderFlowLoadersByKey.get(sessionKey);
        if (directLoader) {
          return loadJsonModule<OrderFlowBar[]>(directLoader);
        }

        const marketBars1m = await loadMarketBars1m(symbol, sessionDate);
        if (!marketBars1m.length) {
          return [];
        }

        return buildSyntheticOrderFlowFromBars({
          bars: marketBars1m.map((bar) => ({
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
      })(),
    );
  }

  return (await orderFlowBars1mCache.get(sessionKey)) ?? [];
}

export async function loadMarketBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): Promise<AggregatedMarketBar[]> {
  const intervalSeconds = intervalToSeconds(interval);
  const storedBars1m = await loadMarketBars1m(symbol, sessionDate);
  return interval === '1m'
    ? storedBars1m.slice()
    : aggregateMarketBarsByInterval(storedBars1m, intervalSeconds);
}

export async function loadOrderFlowBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): Promise<OrderFlowBar[]> {
  const intervalSeconds = intervalToSeconds(interval);
  const storedOrderFlow1m = await loadOrderFlowBars1m(symbol, sessionDate);
  return interval === '1m'
    ? storedOrderFlow1m.slice()
    : aggregateOrderFlowBarsByInterval(storedOrderFlow1m, intervalSeconds);
}
