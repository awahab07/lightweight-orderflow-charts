import type { InstrumentContext, OrderFlowBar } from 'lightweight-orderflow-charts';

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
const barModules = import.meta.glob('../../../data/market/*/*/bars-*.json', {
  eager: true,
});

const instruments = new Map<SymbolCode, MarketInstrumentRecord>();
const barsByKey = new Map<string, MarketBarRecord[]>();
const datesBySymbol = new Map<SymbolCode, Set<string>>();

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

for (const [pathname, moduleValue] of Object.entries(barModules)) {
  const match = pathname.match(/data\/market\/([^/]+)\/([^/]+)\/bars-(1m|5m)\.json$/);
  if (!match) {
    continue;
  }

  const symbol = match[1].toUpperCase() as SymbolCode;
  const sessionDate = match[2];
  const interval = match[3] as BarInterval;
  barsByKey.set(
    `${symbol}:${sessionDate}:${interval}`,
    (moduleValue as { default: MarketBarRecord[] }).default,
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
): MarketBarRecord[] {
  return barsByKey.get(`${symbol}:${sessionDate}:${interval}`) ?? [];
}

export function loadOrderFlowBars(
  symbol: SymbolCode,
  sessionDate: string,
  interval: BarInterval,
): OrderFlowBar[] {
  return buildSyntheticOrderFlowFromBars({
    bars: loadMarketBars(symbol, sessionDate, interval),
    instrument: loadInstrument(symbol),
  });
}
