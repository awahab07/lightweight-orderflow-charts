import type {
  AggregatedMarketBar,
  InstrumentContext,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorConfigFieldDefinition,
  ConnectorConfigValue,
  ConnectorGrabRequest,
  ConnectorHistoricalBarsRequest,
  ConnectorRuntimeStatus,
  ConnectorRuntimeWaitReason,
  ConnectorTestResult,
  MarketDataConnectorDefinition,
  MarketDataConnectorSession,
  VendorHistoricalTickChunk,
} from '../../core/contracts';
import {
  DEFAULT_SESSION_END,
  DEFAULT_SESSION_START,
  DEFAULT_TIMEZONE,
  formatEasternParts,
  secondsFromClock,
} from '../../core/time';

const DEFAULT_BASE_URL = 'https://api.massive.com';
const REQUEST_TIMEOUT_MS = Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS || 30000);
const REQUEST_WINDOW_MS = Number(process.env.POLYGON_REQUEST_WINDOW_MS || 60 * 1000);
const MAX_REQUESTS_PER_WINDOW = Number(process.env.POLYGON_MAX_REQUESTS_PER_WINDOW || 5);
const RATE_LIMIT_POLL_MS = Number(process.env.POLYGON_RATE_LIMIT_POLL_MS || 250);
const MAX_LIMIT = 50000;

export interface PolygonRestConnectorConfig extends Record<string, ConnectorConfigValue> {
  apiKey: string;
  baseUrl: string;
}

interface PolygonAggregateResponse {
  status?: string;
  results?: Array<{
    t?: number;
    o?: number;
    h?: number;
    l?: number;
    c?: number;
    v?: number;
    vw?: number;
    n?: number;
  }>;
  error?: string;
  message?: string;
}

interface RuntimeRequestContext {
  symbol: string;
  sessionDate: string;
  label: string;
  requestKind: 'bars';
  onRuntimeStatus?: (status: ConnectorRuntimeStatus) => void;
  abortSignal?: AbortSignal;
}

const POLYGON_CONFIG_FIELDS: ConnectorConfigFieldDefinition[] = [
  {
    id: 'apiKey',
    label: 'API key',
    description:
      'Runtime-only Massive / Polygon.io REST API key. This is kept in memory and is not stored.',
    kind: 'password',
    required: true,
    placeholder: 'Enter your Massive API key',
  },
  {
    id: 'baseUrl',
    label: 'Base URL',
    description: 'Polygon.io / Massive REST API base URL.',
    kind: 'text',
    required: false,
    placeholder: DEFAULT_BASE_URL,
    defaultValue: DEFAULT_BASE_URL,
  },
];

function createAbortError(reason = 'Capture interrupted by signal.'): Error {
  const error = new Error(reason);
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return;
  }

  throw createAbortError(
    typeof signal.reason === 'string' && signal.reason.trim().length > 0
      ? signal.reason
      : 'Capture interrupted by signal.',
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(createAbortError());
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}

function sanitizeApiKey(value: ConnectorConfigValue | undefined): string {
  return String(value ?? '').trim();
}

function sanitizeBaseUrl(value: ConnectorConfigValue | undefined): string {
  const baseUrl = String(value ?? DEFAULT_BASE_URL).trim();
  if (!baseUrl) {
    return DEFAULT_BASE_URL;
  }

  return baseUrl.replace(/\/+$/, '');
}

function resolveIntervalMultiplier(intervalSeconds: number): number {
  switch (Math.floor(intervalSeconds)) {
    case 60:
      return 1;
    case 300:
      return 5;
    default:
      throw new Error(`Unsupported Polygon historical bar interval: ${intervalSeconds} seconds.`);
  }
}

function emitRuntimeStatus(
  context: RuntimeRequestContext,
  status: Omit<ConnectorRuntimeStatus, 'symbol' | 'sessionDate'>,
): void {
  context.onRuntimeStatus?.({
    symbol: context.symbol,
    sessionDate: context.sessionDate,
    ...status,
  });
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const objectPayload = payload as { error?: unknown; message?: unknown; status?: unknown };
  return String(objectPayload.error || objectPayload.message || objectPayload.status || fallback);
}

function buildInstrument(symbol: string): InstrumentContext {
  return {
    instrumentId: `${symbol}-STK-POLYGON`,
    symbol,
    tickSize: 0.01,
    pricePrecision: 2,
    timezone: DEFAULT_TIMEZONE,
    volumePrecision: 0,
  };
}

function buildRecentMarketDate(): string {
  const candidate = new Date();
  candidate.setUTCHours(0, 0, 0, 0);
  candidate.setUTCDate(candidate.getUTCDate() - 1);

  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
    candidate.setUTCDate(candidate.getUTCDate() - 1);
  }

  return candidate.toISOString().slice(0, 10);
}

function isRegularSessionBar(timestampMs: number, sessionDate: string): boolean {
  const parts = formatEasternParts(Math.floor(timestampMs / 1000));
  if (parts.date !== sessionDate) {
    return false;
  }

  const clock = secondsFromClock(parts.time);
  return clock >= secondsFromClock(DEFAULT_SESSION_START) && clock < secondsFromClock(DEFAULT_SESSION_END);
}

class PolygonRestConnectorSession implements MarketDataConnectorSession {
  private readonly requestLog: number[] = [];

  constructor(private readonly config: PolygonRestConnectorConfig) {}

  async disconnect(): Promise<void> {
    // REST-only session, nothing to tear down.
  }

  async getInstrumentContext(symbol: string): Promise<InstrumentContext> {
    return buildInstrument(symbol);
  }

  async fetchHistoricalBars(
    request: ConnectorHistoricalBarsRequest,
  ): Promise<AggregatedMarketBar[]> {
    const multiplier = resolveIntervalMultiplier(request.intervalSeconds);
    const runtimeContext: RuntimeRequestContext = {
      symbol: request.symbol,
      sessionDate: request.sessionDate,
      requestKind: 'bars',
      label: `Fetching ${multiplier}m aggregate bars from Polygon REST.`,
      onRuntimeStatus: request.onRuntimeStatus,
      abortSignal: request.abortSignal,
    };

    await this.waitForRateLimitSlot(runtimeContext);
    throwIfAborted(request.abortSignal);

    emitRuntimeStatus(runtimeContext, {
      phase: 'fetching-bars',
      requestKind: 'bars',
      label: runtimeContext.label,
    });

    const url = new URL(
      `${this.config.baseUrl}/v2/aggs/ticker/${encodeURIComponent(request.symbol)}/range/${multiplier}/minute/${request.sessionDate}/${request.sessionDate}`,
    );
    url.searchParams.set('adjusted', 'true');
    url.searchParams.set('sort', 'asc');
    url.searchParams.set('limit', String(MAX_LIMIT));
    url.searchParams.set('apiKey', this.config.apiKey);

    emitRuntimeStatus(runtimeContext, {
      phase: 'awaiting-response',
      requestKind: 'bars',
      label: `Waiting for Polygon REST ${multiplier}m aggregate response.`,
      responseRemainingMs: REQUEST_TIMEOUT_MS,
    });

    const response = await withTimeout(
      fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: request.abortSignal,
      }),
      REQUEST_TIMEOUT_MS,
      'Polygon REST aggregate request',
      request.abortSignal,
    );
    const payload = (await response.json()) as PolygonAggregateResponse;

    if (!response.ok) {
      throw new Error(
        `Polygon REST aggregate request failed: ${extractErrorMessage(payload, response.statusText)}.`,
      );
    }

    if (payload.status && payload.status !== 'OK') {
      throw new Error(`Polygon REST aggregate request failed: ${extractErrorMessage(payload, payload.status)}.`);
    }

    const bars: AggregatedMarketBar[] = [];

    for (const bar of payload.results ?? []) {
      const timestampMs = Number(bar.t);
      const open = Number(bar.o);
      const high = Number(bar.h);
      const low = Number(bar.l);
      const close = Number(bar.c);
      const volume = Number(bar.v);

      if (
        !Number.isFinite(timestampMs) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        !Number.isFinite(volume) ||
        !isRegularSessionBar(timestampMs, request.sessionDate)
      ) {
        continue;
      }

      bars.push({
        time: Math.floor(timestampMs / 1000) as AggregatedMarketBar['time'],
        open,
        high,
        low,
        close,
        volume,
        vwap: Number.isFinite(Number(bar.vw)) ? Number(bar.vw) : undefined,
        tradeCount: Number.isFinite(Number(bar.n)) ? Number(bar.n) : undefined,
      });
    }

    return bars;
  }

  async *streamHistoricalTicks(_request: ConnectorGrabRequest): AsyncGenerator<VendorHistoricalTickChunk> {
    throw new Error(
      'Polygon REST Basic plan does not expose historical stock trades or quotes for true order-flow capture.',
    );
  }

  private pruneRequestLog(now: number): void {
    while (this.requestLog.length > 0 && now - this.requestLog[0] >= REQUEST_WINDOW_MS) {
      this.requestLog.shift();
    }
  }

  private async waitForRateLimitSlot(context: RuntimeRequestContext): Promise<void> {
    while (true) {
      throwIfAborted(context.abortSignal);
      const now = Date.now();
      this.pruneRequestLog(now);

      if (this.requestLog.length < MAX_REQUESTS_PER_WINDOW) {
        this.requestLog.push(now);
        return;
      }

      const waitReason: ConnectorRuntimeWaitReason = 'historical-window';
      const earliest = this.requestLog[0];
      const waitMs = Math.max(earliest + REQUEST_WINDOW_MS - now, RATE_LIMIT_POLL_MS);
      emitRuntimeStatus(context, {
        phase: 'waiting-pacing',
        requestKind: 'bars',
        waitReason,
        waitRemainingMs: waitMs,
        requestWeightInWindow: this.requestLog.length,
        label:
          'Waiting for the Polygon Basic-plan rate-limit window before issuing the next REST request.',
      });
      await sleep(Math.min(waitMs, RATE_LIMIT_POLL_MS), context.abortSignal);
    }
  }
}

export const POLYGON_REST_CONNECTOR: MarketDataConnectorDefinition<PolygonRestConnectorConfig> = {
  cacheDirectory: 'polygon',
  descriptor: {
    id: 'polygon-rest',
    label: 'Polygon.io / Massive REST',
    summary:
      'Historical stock minute aggregates through Massive REST. The current Basic plan is candle-summary-only and does not provide historical trades, quotes, or websocket order flow.',
    configFields: POLYGON_CONFIG_FIELDS,
    supportsDirectTicks: false,
    supportsHistoricalTicks: false,
    supportsQuotes: false,
    supportsPersistence: true,
  },
  sanitizeConfig(config: Record<string, ConnectorConfigValue>): PolygonRestConnectorConfig {
    const apiKey = sanitizeApiKey(config.apiKey);
    if (!apiKey) {
      throw new Error('A Massive / Polygon API key is required.');
    }

    return {
      apiKey,
      baseUrl: sanitizeBaseUrl(config.baseUrl),
    };
  },
  async testConnection(config: PolygonRestConnectorConfig): Promise<ConnectorTestResult> {
    const session = new PolygonRestConnectorSession(config);
    const probeDate = buildRecentMarketDate();
    const bars = await session.fetchHistoricalBars({
      symbol: 'AAPL',
      sessionDate: probeDate,
      intervalSeconds: 60,
    });

    return {
      ok: true,
      message:
        bars.length > 0
          ? `Connected to Polygon REST and retrieved ${bars.length} minute bars for AAPL ${probeDate}.`
          : `Connected to Polygon REST. The probe request for AAPL ${probeDate} returned no regular-session minute bars.`,
    };
  },
  async connect(config: PolygonRestConnectorConfig): Promise<MarketDataConnectorSession> {
    return new PolygonRestConnectorSession(config);
  },
};
