import fs from 'node:fs';
import path from 'node:path';

import type {
  AggregatedMarketBar,
  InstrumentContext,
  OrderFlowBar,
} from 'lightweight-orderflow-charts';

import type {
  AggregatedSessionManifest,
  ConnectorVendorId,
  ConnectorStoredSessionSummary,
} from '../core/contracts';

export interface StoredAggregatedSessionData {
  marketBars: AggregatedMarketBar[];
  orderFlowBars: OrderFlowBar[];
  summary: ConnectorStoredSessionSummary;
  sessionDirectory: string;
}

export interface PersistAggregatedSessionInput {
  symbol: string;
  sessionDate: string;
  marketBars: AggregatedMarketBar[];
  orderFlowBars?: OrderFlowBar[];
  complete: boolean;
  includeTicks: boolean;
  dataRoot: string;
  instrument?: InstrumentContext | null;
  vendorId?: ConnectorVendorId;
  timezone?: string;
  lastCompleteBarTime?: number | null;
}

const DEFAULT_TIMEZONE = 'America/New_York';

function ensureDir(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

function readJson<T>(pathname: string, fallback: T): T {
  if (!fs.existsSync(pathname)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(pathname, 'utf8')) as T;
}

function writeJson(pathname: string, value: unknown): void {
  ensureDir(path.dirname(pathname));
  fs.writeFileSync(pathname, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeSymbolDirectory(symbol: string): string {
  return symbol.toLowerCase();
}

function resolveSessionDirectory(dataRoot: string, symbol: string, sessionDate: string): string {
  return path.join(dataRoot, normalizeSymbolDirectory(symbol), sessionDate);
}

function resolveInstrumentPath(dataRoot: string, symbol: string): string {
  return path.join(dataRoot, normalizeSymbolDirectory(symbol), 'instrument.json');
}

function resolveManifestPath(dataRoot: string, symbol: string, sessionDate: string): string {
  return path.join(resolveSessionDirectory(dataRoot, symbol, sessionDate), 'session-manifest.json');
}

function resolveMarketBarsPath(dataRoot: string, symbol: string, sessionDate: string): string {
  return path.join(resolveSessionDirectory(dataRoot, symbol, sessionDate), 'bars-1m.json');
}

function resolveOrderFlowBarsPath(dataRoot: string, symbol: string, sessionDate: string): string {
  return path.join(resolveSessionDirectory(dataRoot, symbol, sessionDate), 'orderflow-1m.json');
}

function resolveLastBarTime(
  marketBars: AggregatedMarketBar[],
  orderFlowBars: OrderFlowBar[],
): number | null {
  const marketBarTime = marketBars.length ? Number(marketBars[marketBars.length - 1].time) : null;
  const orderFlowBarTime = orderFlowBars.length ? Number(orderFlowBars[orderFlowBars.length - 1].time) : null;

  if (marketBarTime == null) {
    return orderFlowBarTime;
  }

  if (orderFlowBarTime == null) {
    return marketBarTime;
  }

  return Math.max(marketBarTime, orderFlowBarTime);
}

function summarizeSession(
  symbol: string,
  sessionDate: string,
  marketBars: AggregatedMarketBar[],
  orderFlowBars: OrderFlowBar[],
  manifest: AggregatedSessionManifest | null,
): ConnectorStoredSessionSummary {
  return {
    symbol,
    sessionDate,
    marketBarsLoaded: marketBars.length,
    orderFlowBarsLoaded: orderFlowBars.length,
    lastBarTime: resolveLastBarTime(marketBars, orderFlowBars),
    footprintAvailable: orderFlowBars.length > 0,
    complete: Boolean(manifest?.complete),
    manifest,
  };
}

export function resolveCanonicalMarketDataRoot(): string {
  return process.env.CANONICAL_MARKET_DATA_ROOT || path.join(process.cwd(), 'data', 'market');
}

export function resolveVendorCacheRoot(vendorDirectory: string): string {
  return (
    process.env.CONNECTOR_MARKET_DATA_ROOT ||
    path.join(process.cwd(), 'connectors', 'vendors', vendorDirectory, 'data')
  );
}

export function loadAggregatedSession(
  symbol: string,
  sessionDate: string,
  dataRoot: string,
): StoredAggregatedSessionData {
  const marketBarsPath = resolveMarketBarsPath(dataRoot, symbol, sessionDate);
  const orderFlowBarsPath = resolveOrderFlowBarsPath(dataRoot, symbol, sessionDate);
  const manifestPath = resolveManifestPath(dataRoot, symbol, sessionDate);
  const manifest = readJson<AggregatedSessionManifest | null>(manifestPath, null);
  const marketBars = readJson<AggregatedMarketBar[]>(marketBarsPath, []);
  const orderFlowBars = readJson<OrderFlowBar[]>(orderFlowBarsPath, []);

  return {
    marketBars,
    orderFlowBars,
    summary: summarizeSession(symbol, sessionDate, marketBars, orderFlowBars, manifest),
    sessionDirectory: resolveSessionDirectory(dataRoot, symbol, sessionDate),
  };
}

export function persistAggregatedSession(
  input: PersistAggregatedSessionInput,
): StoredAggregatedSessionData {
  const sessionDirectory = resolveSessionDirectory(input.dataRoot, input.symbol, input.sessionDate);
  const manifestPath = resolveManifestPath(input.dataRoot, input.symbol, input.sessionDate);
  const marketBarsPath = resolveMarketBarsPath(input.dataRoot, input.symbol, input.sessionDate);
  const orderFlowBarsPath = resolveOrderFlowBarsPath(input.dataRoot, input.symbol, input.sessionDate);
  const orderFlowBars = input.orderFlowBars ?? [];
  const lastBarTime = resolveLastBarTime(input.marketBars, orderFlowBars);

  ensureDir(sessionDirectory);
  writeJson(marketBarsPath, input.marketBars);

  if (orderFlowBars.length > 0) {
    writeJson(orderFlowBarsPath, orderFlowBars);
  } else if (fs.existsSync(orderFlowBarsPath)) {
    fs.rmSync(orderFlowBarsPath, { force: true });
  }

  if (input.instrument) {
    writeJson(resolveInstrumentPath(input.dataRoot, input.symbol), {
      symbol: input.instrument.symbol,
      timezone: input.instrument.timezone,
      minTick: input.instrument.tickSize,
      conId: input.instrument.instrumentId,
    });
  }

  const manifest: AggregatedSessionManifest = {
    symbol: input.symbol,
    sessionDate: input.sessionDate,
    timezone: input.timezone || input.instrument?.timezone || DEFAULT_TIMEZONE,
    sourceMode: orderFlowBars.length > 0 ? 'tick-derived' : 'ohlc-synthetic',
    baseIntervalSeconds: 60,
    candlesAvailable: input.marketBars.length > 0,
    orderFlowAvailable: orderFlowBars.length > 0,
    complete: input.complete,
    rawTicksStored: false,
    capture: {
      vendorId: input.vendorId,
      includeTicks: input.includeTicks,
      lastCompleteBarTime:
        input.lastCompleteBarTime !== undefined ? input.lastCompleteBarTime : lastBarTime,
      updatedAt: new Date().toISOString(),
    },
    files: [
      {
        file: path.basename(marketBarsPath),
        kind: 'market-bars',
        intervalSeconds: 60,
        barCount: input.marketBars.length,
        complete: input.complete,
      },
      ...(orderFlowBars.length > 0
        ? [
            {
              file: path.basename(orderFlowBarsPath),
              kind: 'order-flow-bars' as const,
              intervalSeconds: 60,
              barCount: orderFlowBars.length,
              complete: input.complete,
            },
          ]
        : []),
    ],
    notes: [
      orderFlowBars.length > 0
        ? 'Tick-derived minute aggregation with price-level bid/ask participation.'
        : 'Candle-summary-only minute aggregation without footprint-capable price levels.',
    ],
  };

  writeJson(manifestPath, manifest);

  return {
    marketBars: input.marketBars,
    orderFlowBars,
    summary: summarizeSession(input.symbol, input.sessionDate, input.marketBars, orderFlowBars, manifest),
    sessionDirectory,
  };
}
