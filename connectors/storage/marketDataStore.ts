import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import type {
  InstrumentContext,
  QuoteTick,
  TickSessionManifest,
  TickSessionChunk,
  TradeTick,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorSaveResult,
  ConnectorStoredSessionSummary,
} from '../core/contracts';

export interface StoredTickSessionData {
  trades: TradeTick[];
  quotes: QuoteTick[];
  summary: ConnectorStoredSessionSummary;
  sessionDirectory: string;
}

export interface PersistStoredTickSessionInput {
  symbol: string;
  sessionDate: string;
  trades: TradeTick[];
  quotes?: QuoteTick[];
  complete: boolean;
  dataRoot?: string;
  instrument?: InstrumentContext | null;
}

const DEFAULT_TIMEZONE = 'US/Eastern';

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

function serializeNdjson<T>(rows: T[]): string {
  if (!rows.length) {
    return '';
  }

  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

function parseNdjson<T>(rawText: string): T[] {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function readText(pathname: string): string {
  if (!fs.existsSync(pathname)) {
    return '';
  }

  if (pathname.endsWith('.gz')) {
    return zlib.gunzipSync(fs.readFileSync(pathname)).toString('utf8');
  }

  return fs.readFileSync(pathname, 'utf8');
}

function writePlainText(pathname: string, value: string): void {
  ensureDir(path.dirname(pathname));
  fs.writeFileSync(pathname, value, 'utf8');
}

function writeGzipText(pathname: string, value: string): void {
  ensureDir(path.dirname(pathname));
  fs.writeFileSync(pathname, zlib.gzipSync(Buffer.from(value, 'utf8'), { level: 9 }));
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
  return path.join(resolveSessionDirectory(dataRoot, symbol, sessionDate), 'ticks-manifest.json');
}

function resolveTickFilePath(
  dataRoot: string,
  symbol: string,
  sessionDate: string,
  kind: 'trades' | 'quotes',
  complete: boolean,
): string {
  return path.join(
    resolveSessionDirectory(dataRoot, symbol, sessionDate),
    complete ? `${kind}.ndjson.gz` : `${kind}.ndjson.gz.partial`,
  );
}

function resolveTickMetaPath(
  dataRoot: string,
  symbol: string,
  sessionDate: string,
  kind: 'trades' | 'quotes',
): string {
  return path.join(resolveSessionDirectory(dataRoot, symbol, sessionDate), `${kind}-meta.json`);
}

function resolveExistingTickFilePath(
  dataRoot: string,
  symbol: string,
  sessionDate: string,
  kind: 'trades' | 'quotes',
): string | null {
  const finalPath = resolveTickFilePath(dataRoot, symbol, sessionDate, kind, true);
  if (fs.existsSync(finalPath)) {
    return finalPath;
  }

  const partialPath = resolveTickFilePath(dataRoot, symbol, sessionDate, kind, false);
  if (fs.existsSync(partialPath)) {
    return partialPath;
  }

  return null;
}

function buildChunk(
  file: string,
  kind: 'trades' | 'quotes',
  tickCount: number,
  timeFrom: number | null,
  timeTo: number | null,
  complete: boolean,
): TickSessionChunk | null {
  if (!tickCount || timeFrom == null || timeTo == null) {
    return null;
  }

  return {
    file,
    kind,
    compression: complete ? 'gzip' : 'none',
    timeFrom,
    timeTo,
    tickCount,
    complete,
  };
}

function summarizeTicks(
  symbol: string,
  sessionDate: string,
  trades: TradeTick[],
  quotes: QuoteTick[],
  manifest: TickSessionManifest | null,
): ConnectorStoredSessionSummary {
  return {
    symbol,
    sessionDate,
    marketBarsLoaded: 0,
    orderFlowBarsLoaded: 0,
    lastBarTime:
      trades.length > 0
        ? trades[trades.length - 1].time
        : quotes.length > 0
          ? quotes[quotes.length - 1].time
          : null,
    footprintAvailable: trades.length > 0,
    complete: Boolean(manifest?.complete),
    manifest: null,
  };
}

export function resolveMarketDataRoot(): string {
  return process.env.CONNECTOR_MARKET_DATA_ROOT || path.join(process.cwd(), 'data', 'market');
}

export function loadStoredTickSession(
  symbol: string,
  sessionDate: string,
  dataRoot = resolveMarketDataRoot(),
): StoredTickSessionData {
  const tradesPath = resolveExistingTickFilePath(dataRoot, symbol, sessionDate, 'trades');
  const quotesPath = resolveExistingTickFilePath(dataRoot, symbol, sessionDate, 'quotes');
  const manifestPath = resolveManifestPath(dataRoot, symbol, sessionDate);
  const manifest = readJson<TickSessionManifest | null>(manifestPath, null);
  const trades = tradesPath ? parseNdjson<TradeTick>(readText(tradesPath)) : [];
  const quotes = quotesPath ? parseNdjson<QuoteTick>(readText(quotesPath)) : [];

  return {
    trades,
    quotes,
    summary: summarizeTicks(symbol, sessionDate, trades, quotes, manifest),
    sessionDirectory: resolveSessionDirectory(dataRoot, symbol, sessionDate),
  };
}

export function persistStoredTickSession(
  input: PersistStoredTickSessionInput,
): ConnectorSaveResult {
  const dataRoot = input.dataRoot || resolveMarketDataRoot();
  const quotes = input.quotes ?? [];
  const sessionDirectory = resolveSessionDirectory(dataRoot, input.symbol, input.sessionDate);
  const manifestPath = resolveManifestPath(dataRoot, input.symbol, input.sessionDate);
  const tradesPath = resolveTickFilePath(dataRoot, input.symbol, input.sessionDate, 'trades', input.complete);
  const quotesPath =
    quotes.length > 0
      ? resolveTickFilePath(dataRoot, input.symbol, input.sessionDate, 'quotes', input.complete)
      : null;
  const staleTradePath = resolveTickFilePath(dataRoot, input.symbol, input.sessionDate, 'trades', !input.complete);
  const staleQuotePath =
    quotes.length > 0
      ? resolveTickFilePath(dataRoot, input.symbol, input.sessionDate, 'quotes', !input.complete)
      : null;

  ensureDir(sessionDirectory);

  const tradeText = serializeNdjson(input.trades);
  if (input.complete) {
    writeGzipText(tradesPath, tradeText);
  } else {
    writePlainText(tradesPath, tradeText);
  }
  if (staleTradePath !== tradesPath && fs.existsSync(staleTradePath)) {
    fs.rmSync(staleTradePath, { force: true });
  }

  if (quotesPath) {
    const quoteText = serializeNdjson(quotes);
    if (input.complete) {
      writeGzipText(quotesPath, quoteText);
    } else {
      writePlainText(quotesPath, quoteText);
    }

    if (staleQuotePath && staleQuotePath !== quotesPath && fs.existsSync(staleQuotePath)) {
      fs.rmSync(staleQuotePath, { force: true });
    }
  }

  if (input.instrument) {
    writeJson(resolveInstrumentPath(dataRoot, input.symbol), {
      symbol: input.instrument.symbol,
      timezone: input.instrument.timezone,
      minTick: input.instrument.tickSize,
      conId: input.instrument.instrumentId,
    });
  }

  const tradeFirst = input.trades.length ? input.trades[0].time : null;
  const tradeLast = input.trades.length ? input.trades[input.trades.length - 1].time : null;
  const quoteFirst = quotes.length ? quotes[0].time : null;
  const quoteLast = quotes.length ? quotes[quotes.length - 1].time : null;
  const chunks = [
    buildChunk(path.basename(tradesPath), 'trades', input.trades.length, tradeFirst, tradeLast, input.complete),
    buildChunk(
      quotesPath ? path.basename(quotesPath) : '',
      'quotes',
      quotes.length,
      quoteFirst,
      quoteLast,
      input.complete,
    ),
  ].filter(Boolean) as TickSessionChunk[];

  const manifest: TickSessionManifest = {
    symbol: input.symbol,
    sessionDate: input.sessionDate,
    timezone: DEFAULT_TIMEZONE,
    sourceMode: 'tick-derived',
    tradesAvailable: input.trades.length > 0,
    quotesAvailable: quotes.length > 0,
    complete: input.complete,
    chunks,
    notes: [
      input.complete
        ? 'Complete tick session persisted by the connector bridge.'
        : 'Partial tick session persisted by the connector bridge.',
    ],
  };
  writeJson(manifestPath, manifest);

  writeJson(resolveTickMetaPath(dataRoot, input.symbol, input.sessionDate, 'trades'), {
    symbol: input.symbol,
    sessionDate: input.sessionDate,
    kind: 'trades',
    complete: input.complete,
    ticks: input.trades.length,
    firstTickTime: tradeFirst,
    lastTickTime: tradeLast,
    file: path.basename(tradesPath),
    compression: input.complete ? 'gzip' : 'none',
    updatedAt: new Date().toISOString(),
  });

  if (quotes.length > 0 && quotesPath) {
    writeJson(resolveTickMetaPath(dataRoot, input.symbol, input.sessionDate, 'quotes'), {
      symbol: input.symbol,
      sessionDate: input.sessionDate,
      kind: 'quotes',
      complete: input.complete,
      ticks: quotes.length,
      firstTickTime: quoteFirst,
      lastTickTime: quoteLast,
      file: path.basename(quotesPath),
      compression: input.complete ? 'gzip' : 'none',
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    ok: true,
    symbol: input.symbol,
    sessionDate: input.sessionDate,
    complete: input.complete,
    tradesSaved: input.trades.length,
    quotesSaved: quotes.length,
    outputDirectory: sessionDirectory,
    manifestPath,
    message: input.complete
      ? 'Stored a complete connector-driven tick session.'
      : 'Stored a partial connector-driven tick session.',
  };
}
