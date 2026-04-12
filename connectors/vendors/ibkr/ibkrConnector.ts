import { IBApiNext, ConnectionState, WhatToShow } from '@stoqey/ib';
import { lastValueFrom } from 'rxjs';

import type {
  AggregatedMarketBar,
  InstrumentContext,
  QuoteTick,
  TradeTick,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorConfigFieldDefinition,
  ConnectorConfigValue,
  ConnectorHistoricalBarsRequest,
  ConnectorGrabRequest,
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
  formatEasternParts,
  ibTimestampFromSessionDate,
  ibTimestampFromUnix,
} from '../../core/time';

const REQUEST_TIMEOUT_MS = Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS || 120000);
const REQUEST_WINDOW_MS = Number(process.env.CONNECTOR_REQUEST_WINDOW_MS || 10 * 60 * 1000);
const MAX_REQUEST_WEIGHT_PER_WINDOW = Number(
  process.env.CONNECTOR_MAX_REQUEST_WEIGHT_PER_WINDOW || 58,
);
const MIN_INTER_REQUEST_GAP_MS = Number(process.env.CONNECTOR_MIN_INTER_REQUEST_GAP_MS || 800);
const IDENTICAL_REQUEST_COOLDOWN_MS = Number(
  process.env.CONNECTOR_IDENTICAL_REQUEST_COOLDOWN_MS || 16000,
);
const CONNECTION_TIMEOUT_MS = Number(process.env.CONNECTOR_CONNECTION_TIMEOUT_MS || 15000);
const DEFAULT_CHUNK_SIZE = Number(process.env.CONNECTOR_DEFAULT_CHUNK_SIZE || 1000);
const QUOTE_LEAD_TARGET_SECONDS = Number(process.env.CONNECTOR_QUOTE_LEAD_TARGET_SECONDS || 60);
const PRIMARY_EXCHANGES: Record<string, string> = {
  NVDA: 'NASDAQ',
  TSLA: 'NASDAQ',
};

let nextClientId = Number(process.env.CONNECTOR_CLIENT_ID_BASE || 131);

export interface IbkrConnectorConfig extends Record<string, ConnectorConfigValue> {
  host: string;
  port: number;
  clientId: number;
}

type IbkrContract = Parameters<IBApiNext['getHistoricalTicksLast']>[0];

interface RequestLogEntry {
  at: number;
  signature: string;
  cost: number;
}

interface TickFetchResult<TTick> {
  rows: TTick[];
  nextTime: number | null;
  lastTime: number | null;
  complete: boolean;
}

interface RuntimeRequestContext {
  symbol: string;
  sessionDate: string;
  requestKind: 'bars' | 'trades' | 'quotes';
  label: string;
  onRuntimeStatus?: (status: ConnectorRuntimeStatus) => void;
  abortSignal?: AbortSignal;
}

const IBKR_CONFIG_FIELDS: ConnectorConfigFieldDefinition[] = [
  {
    id: 'host',
    label: 'Host',
    description: 'IBKR TWS or Gateway host address.',
    kind: 'text',
    required: true,
    placeholder: '192.168.2.178',
    defaultValue: '127.0.0.1',
  },
  {
    id: 'port',
    label: 'Port',
    description: 'IBKR TWS or Gateway API port.',
    kind: 'number',
    required: true,
    placeholder: '7000',
    defaultValue: 7497,
    min: 1,
    step: 1,
  },
  {
    id: 'clientId',
    label: 'Client ID',
    description: 'Optional IBKR API client id. Leave blank to auto-allocate.',
    kind: 'number',
    required: false,
    placeholder: '131',
    min: 0,
    step: 1,
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

function resolveHistoricalBarSize(intervalSeconds: number): string {
  switch (Math.floor(intervalSeconds)) {
    case 60:
      return '1 min';
    case 300:
      return '5 mins';
    default:
      throw new Error(`Unsupported IBKR historical bar interval: ${intervalSeconds} seconds.`);
  }
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

function sanitizeHost(value: ConnectorConfigValue | undefined): string {
  return String(value ?? '').trim();
}

function sanitizePort(value: ConnectorConfigValue | undefined): number {
  const port = Number(value);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('A valid IBKR port is required.');
  }

  return port;
}

function sanitizeOptionalClientId(value: ConnectorConfigValue | undefined): number {
  if (value == null || String(value).trim() === '') {
    return Number.NaN;
  }

  const clientId = Number(value);
  if (!Number.isFinite(clientId) || clientId < 0) {
    throw new Error('IBKR client id must be a non-negative integer.');
  }

  return Math.floor(clientId);
}

function allocateClientId(): number {
  nextClientId += 1;
  return nextClientId;
}

function formatEtTime(value: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value * 1000));
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

function quoteCursorHasLead(
  quoteNextTime: number | null,
  tradeNextTime: number | null,
  leadSeconds = QUOTE_LEAD_TARGET_SECONDS,
): boolean {
  if (quoteNextTime == null || tradeNextTime == null) {
    return false;
  }

  return quoteNextTime > tradeNextTime + Math.max(leadSeconds, 0);
}

async function connectIbkrApi(config: IbkrConnectorConfig): Promise<IBApiNext> {
  const api = new IBApiNext({
    host: config.host,
    port: config.port,
    reconnectInterval: 0,
    connectionWatchdogInterval: 0,
  });

  api.connect(Number.isFinite(config.clientId) ? config.clientId : allocateClientId());
  await waitForConnected(api, CONNECTION_TIMEOUT_MS);
  return api;
}

function waitForConnected(api: IBApiNext, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback: (value?: any) => void, value?: any) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      stateSubscription.unsubscribe();
      errorSubscription.unsubscribe();
      callback(value);
    };

    const timer = setTimeout(() => {
      finish(reject, new Error(`Connection timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    const stateSubscription = api.connectionState.subscribe((state) => {
      if (state === ConnectionState.Connected) {
        finish(resolve);
      }
    });

    const errorSubscription = api.error.subscribe((error) => {
      const message = error?.error?.message || error?.message || 'Connection failed.';
      finish(reject, new Error(message));
    });
  });
}

class IbkrConnectorSession implements MarketDataConnectorSession {
  private readonly requestLog: RequestLogEntry[] = [];
  private readonly contractCache = new Map<string, Promise<{ contract: IbkrContract; instrument: InstrumentContext }>>();

  constructor(
    private readonly api: IBApiNext,
    private readonly config: IbkrConnectorConfig,
  ) {}

  async disconnect(): Promise<void> {
    this.api.disconnect();
  }

  async getInstrumentContext(symbol: string): Promise<InstrumentContext> {
    const resolved = await this.resolveContract(symbol);
    return resolved.instrument;
  }

  async fetchHistoricalBars(
    request: ConnectorHistoricalBarsRequest,
  ): Promise<AggregatedMarketBar[]> {
    const resolved = await this.resolveContract(request.symbol);
    const barSize = resolveHistoricalBarSize(
      request.intervalSeconds,
    ) as Parameters<IBApiNext['getHistoricalData']>[3];
    const endDateTime = ibTimestampFromSessionDate(request.sessionDate, DEFAULT_SESSION_END);
    const bars = await this.requestWithPacing(
      `${request.symbol}:bars:${request.sessionDate}:${barSize}`,
      1,
      `${request.symbol} ${request.sessionDate} ${barSize} bars`,
      {
        symbol: request.symbol,
        sessionDate: request.sessionDate,
        requestKind: 'bars',
        label: `Fetching ${barSize} TRADES bars.`,
        onRuntimeStatus: request.onRuntimeStatus,
        abortSignal: request.abortSignal,
      },
      () =>
        this.api.getHistoricalData(
          resolved.contract,
          endDateTime,
          '1 D',
          barSize,
          WhatToShow.TRADES,
          1,
          2,
        ),
    );

    return (bars || [])
      .filter(
        (bar) =>
          typeof bar.open === 'number' &&
          typeof bar.high === 'number' &&
          typeof bar.low === 'number' &&
          typeof bar.close === 'number',
      )
      .map((bar) => ({
        time: Number(bar.time) as AggregatedMarketBar['time'],
        open: Number(bar.open),
        high: Number(bar.high),
        low: Number(bar.low),
        close: Number(bar.close),
        volume: Number(bar.volume ?? 0),
        vwap:
          typeof bar.WAP === 'number' && Number.isFinite(bar.WAP) ? Number(bar.WAP) : undefined,
        tradeCount:
          typeof bar.count === 'number' && Number.isFinite(bar.count) ? Number(bar.count) : undefined,
      }))
      .filter((bar) => formatEasternParts(Number(bar.time)).date === request.sessionDate);
  }

  async *streamHistoricalTicks(
    request: ConnectorGrabRequest,
  ): AsyncGenerator<VendorHistoricalTickChunk> {
    const resolved = await this.resolveContract(request.symbol);
    let requestCount = 0;
    let tradeNextTime = request.startTradeTime ?? null;
    let quoteNextTime = request.startQuoteTime ?? null;
    let tradeComplete = false;
    let quoteComplete = !request.includeQuotes;
    let lastTradeTime: number | null = null;
    let lastQuoteTime: number | null = null;

    while (!tradeComplete || !quoteComplete) {
      throwIfAborted(request.abortSignal);
      if (request.maxRequests && requestCount >= request.maxRequests) {
        break;
      }

      if (!tradeComplete) {
        const tradeStartTime = tradeNextTime ?? null;
        const tradeChunk = await this.fetchTradeChunk(
          resolved.contract,
          request.symbol,
          request.sessionDate,
          tradeStartTime == null
            ? ibTimestampFromSessionDate(request.sessionDate, DEFAULT_SESSION_START)
            : ibTimestampFromUnix(tradeStartTime),
          tradeStartTime,
          {
            symbol: request.symbol,
            sessionDate: request.sessionDate,
            requestKind: 'trades',
            label:
              tradeStartTime == null
                ? 'Fetching trade ticks from 09:30:00 ET.'
                : `Fetching trade ticks from ${formatEtTime(tradeStartTime)} ET.`,
            onRuntimeStatus: request.onRuntimeStatus,
            abortSignal: request.abortSignal,
          },
        );
        requestCount += 1;
        tradeNextTime = tradeChunk.nextTime;
        lastTradeTime = tradeChunk.lastTime;
        tradeComplete = tradeChunk.complete;

        if (tradeChunk.rows.length || tradeChunk.complete) {
          yield {
            update: { trades: tradeChunk.rows },
            tradeNextTime: tradeChunk.nextTime,
            quoteNextTime: quoteComplete ? null : quoteNextTime,
            requestCount,
            lastTradeTime,
            lastQuoteTime,
            complete: tradeComplete && quoteComplete,
          };
        }

        if (tradeComplete && quoteComplete) {
          break;
        }
      }

      if (request.includeQuotes && !quoteComplete) {
        if (tradeComplete && lastTradeTime != null && quoteNextTime != null && quoteNextTime > lastTradeTime) {
          quoteComplete = true;
          continue;
        }

        if (!tradeComplete && quoteCursorHasLead(quoteNextTime, tradeNextTime)) {
          emitRuntimeStatus(
            {
              symbol: request.symbol,
              sessionDate: request.sessionDate,
              requestKind: 'trades',
              label: `Quote coverage already leads trades through ${formatEtTime(Math.max((quoteNextTime ?? 0) - 1, 0))} ET. Prioritizing trade retrieval.`,
              onRuntimeStatus: request.onRuntimeStatus,
              abortSignal: request.abortSignal,
            },
            {
              phase: 'fetching-trades',
              requestKind: 'trades',
              label: `Quote coverage already leads trades through ${formatEtTime(Math.max((quoteNextTime ?? 0) - 1, 0))} ET. Prioritizing trade retrieval.`,
            },
          );
          continue;
        }

        if (request.maxRequests && requestCount >= request.maxRequests) {
          break;
        }

        const quoteStartTime = quoteNextTime ?? null;
        const quoteChunk = await this.fetchQuoteChunk(
          resolved.contract,
          request.symbol,
          request.sessionDate,
          quoteStartTime == null
            ? ibTimestampFromSessionDate(request.sessionDate, DEFAULT_SESSION_START)
            : ibTimestampFromUnix(quoteStartTime),
          quoteStartTime,
          {
            symbol: request.symbol,
            sessionDate: request.sessionDate,
            requestKind: 'quotes',
            label:
              quoteStartTime == null
                ? 'Fetching quote ticks from 09:30:00 ET.'
                : `Fetching quote ticks from ${formatEtTime(quoteStartTime)} ET.`,
            onRuntimeStatus: request.onRuntimeStatus,
            abortSignal: request.abortSignal,
          },
        );
        requestCount += 1;
        quoteNextTime = quoteChunk.nextTime;
        lastQuoteTime = quoteChunk.lastTime;
        quoteComplete = quoteChunk.complete;

        if (quoteChunk.rows.length || quoteChunk.complete) {
          yield {
            update: { quotes: quoteChunk.rows },
            tradeNextTime: tradeComplete ? null : tradeNextTime,
            quoteNextTime: quoteChunk.nextTime,
            requestCount,
            lastTradeTime,
            lastQuoteTime,
            complete: tradeComplete && quoteComplete,
          };
        }
      }
    }
  }

  private async resolveContract(symbol: string): Promise<{
    contract: IbkrContract;
    instrument: InstrumentContext;
  }> {
    const cacheKey = symbol.toUpperCase();
    const cached = this.contractCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const pending = (async () => {
      const primaryExch = PRIMARY_EXCHANGES[cacheKey] || 'NASDAQ';
      const request: IbkrContract = {
        symbol: cacheKey,
        secType: 'STK' as IbkrContract['secType'],
        exchange: 'SMART',
        currency: 'USD',
        primaryExch,
      };
      const details = await this.requestWithPacing(
        `${cacheKey}:contract`,
        1,
        `${cacheKey} contract details`,
        {
          symbol: cacheKey,
          sessionDate: 'contract-resolution',
          requestKind: 'bars',
          label: `Resolving IBKR contract details for ${cacheKey}.`,
        },
        () => this.api.getContractDetails(request),
      );
      const selected = details?.[0];

      if (!selected) {
        throw new Error(`No IBKR contract details returned for ${cacheKey}.`);
      }

      const tickSize =
        selected.minTick && Number.isFinite(selected.minTick) && selected.minTick > 0
          ? selected.minTick
          : 0.01;
      const pricePrecision = inferPricePrecision(tickSize);

      return {
        contract: selected.contract,
        instrument: {
          instrumentId:
            selected.contract?.conId != null
              ? String(selected.contract.conId)
              : `${cacheKey}-STK-SMART`,
          symbol: cacheKey,
          tickSize,
          pricePrecision,
          timezone: selected.timeZoneId || 'America/New_York',
          volumePrecision: 0,
        },
      };
    })();

    this.contractCache.set(cacheKey, pending);
    return pending;
  }

  private async fetchTradeChunk(
    contract: IbkrContract,
    symbol: string,
    sessionDate: string,
    startTime: string,
    startLowerBoundUnix: number | null,
    runtimeContext: RuntimeRequestContext,
  ): Promise<TickFetchResult<TradeTick>> {
    const ticks = await this.requestWithPacing(
      `${symbol}:trades:${startTime}`,
      1,
      `${symbol} trades ${startTime}`,
      runtimeContext,
      () =>
        lastValueFrom(
          this.api.getHistoricalTicksLast(
            contract,
            startTime,
            '',
            DEFAULT_CHUNK_SIZE,
            true,
          ),
        ),
    );

    if (!Array.isArray(ticks) || ticks.length === 0) {
      return {
        rows: [],
        nextTime: null,
        lastTime: null,
        complete: true,
      };
    }

    const rows: TradeTick[] = [];
    let lastTime: number | null = null;

    for (const tick of ticks) {
      if (
        typeof tick.time !== 'number' ||
        typeof tick.price !== 'number' ||
        !Number.isFinite(Number(tick.size)) ||
        tick.tickAttribLast?.unreported === true
      ) {
        continue;
      }

      const parts = formatEasternParts(tick.time);
      if (
        parts.date !== sessionDate ||
        parts.time < DEFAULT_SESSION_START ||
        parts.time > DEFAULT_SESSION_END ||
        (startLowerBoundUnix != null && tick.time < startLowerBoundUnix)
      ) {
        continue;
      }

      rows.push({
        time: tick.time,
        price: tick.price,
        size: Number(tick.size),
        exchange: tick.exchange,
        attributes: {
          tickAttribLast: tick.tickAttribLast ?? null,
          specialConditions: tick.specialConditions ?? null,
        },
      });
      lastTime = tick.time;
    }

    if (lastTime == null) {
      return {
        rows: [],
        nextTime: null,
        lastTime: null,
        complete: true,
      };
    }

    const parts = formatEasternParts(lastTime);
    const complete = parts.date !== sessionDate || parts.time >= DEFAULT_SESSION_END;

    return {
      rows,
      nextTime: complete ? null : lastTime + 1,
      lastTime,
      complete,
    };
  }

  private async fetchQuoteChunk(
    contract: IbkrContract,
    symbol: string,
    sessionDate: string,
    startTime: string,
    startLowerBoundUnix: number | null,
    runtimeContext: RuntimeRequestContext,
  ): Promise<TickFetchResult<QuoteTick>> {
    const ticks = await this.requestWithPacing(
      `${symbol}:quotes:${startTime}`,
      2,
      `${symbol} quotes ${startTime}`,
      runtimeContext,
      () =>
        lastValueFrom(
          this.api.getHistoricalTicksBidAsk(
            contract,
            startTime,
            '',
            DEFAULT_CHUNK_SIZE,
            true,
            true,
          ),
        ),
    );

    if (!Array.isArray(ticks) || ticks.length === 0) {
      return {
        rows: [],
        nextTime: null,
        lastTime: null,
        complete: true,
      };
    }

    const rows: QuoteTick[] = [];
    let lastTime: number | null = null;

    for (const tick of ticks) {
      if (
        typeof tick.time !== 'number' ||
        typeof tick.priceBid !== 'number' ||
        typeof tick.priceAsk !== 'number' ||
        !Number.isFinite(Number(tick.sizeBid)) ||
        !Number.isFinite(Number(tick.sizeAsk))
      ) {
        continue;
      }

      const parts = formatEasternParts(tick.time);
      if (
        parts.date !== sessionDate ||
        parts.time < DEFAULT_SESSION_START ||
        parts.time > DEFAULT_SESSION_END ||
        (startLowerBoundUnix != null && tick.time < startLowerBoundUnix)
      ) {
        continue;
      }

      rows.push({
        time: tick.time,
        bidPrice: tick.priceBid,
        askPrice: tick.priceAsk,
        bidSize: Number(tick.sizeBid),
        askSize: Number(tick.sizeAsk),
        attributes: {
          tickAttribBidAsk: tick.tickAttribBidAsk ?? null,
        },
      });
      lastTime = tick.time;
    }

    if (lastTime == null) {
      return {
        rows: [],
        nextTime: null,
        lastTime: null,
        complete: true,
      };
    }

    const parts = formatEasternParts(lastTime);
    const complete = parts.date !== sessionDate || parts.time >= DEFAULT_SESSION_END;

    return {
      rows,
      nextTime: complete ? null : lastTime + 1,
      lastTime,
      complete,
    };
  }

  private async requestWithPacing<T>(
    signature: string,
    cost: number,
    label: string,
    runtimeContext: RuntimeRequestContext,
    executor: () => Promise<T>,
  ): Promise<T> {
    const fetchPhase =
      runtimeContext.requestKind === 'trades'
        ? 'fetching-trades'
        : runtimeContext.requestKind === 'quotes'
          ? 'fetching-quotes'
          : 'fetching-bars';
    emitRuntimeStatus(runtimeContext, {
      phase: fetchPhase,
      requestKind: runtimeContext.requestKind,
      label: runtimeContext.label,
    });
    await this.waitForPacingSlot(signature, cost, runtimeContext);
    throwIfAborted(runtimeContext.abortSignal);
    this.requestLog.push({
      at: Date.now(),
      signature,
      cost,
    });
    this.pruneRequestLog();
    const responseDeadline = Date.now() + REQUEST_TIMEOUT_MS;
    emitRuntimeStatus(runtimeContext, {
      phase: 'awaiting-response',
      requestKind: runtimeContext.requestKind,
      label: `Awaiting IBKR ${runtimeContext.requestKind} response.`,
      responseRemainingMs: REQUEST_TIMEOUT_MS,
    });
    const responseInterval = setInterval(() => {
      emitRuntimeStatus(runtimeContext, {
        phase: 'awaiting-response',
        requestKind: runtimeContext.requestKind,
        label: `Awaiting IBKR ${runtimeContext.requestKind} response.`,
        responseRemainingMs: Math.max(responseDeadline - Date.now(), 0),
      });
    }, 1000);

    try {
      return await withTimeout(executor(), REQUEST_TIMEOUT_MS, label, runtimeContext.abortSignal);
    } finally {
      clearInterval(responseInterval);
    }
  }

  private pruneRequestLog(): void {
    const windowStart = Date.now() - REQUEST_WINDOW_MS;
    let index = 0;
    while (index < this.requestLog.length && this.requestLog[index].at < windowStart) {
      index += 1;
    }
    if (index > 0) {
      this.requestLog.splice(0, index);
    }
  }

  private async waitForPacingSlot(
    signature: string,
    cost: number,
    runtimeContext: RuntimeRequestContext,
  ): Promise<void> {
    while (true) {
      throwIfAborted(runtimeContext.abortSignal);
      this.pruneRequestLog();
      const now = Date.now();
      const totalWeight = this.requestLog.reduce((sum, entry) => sum + entry.cost, 0);
      let waitMs = 0;
      let waitReason: ConnectorRuntimeWaitReason | undefined;
      let waitLabel = '';

      if (totalWeight + cost > MAX_REQUEST_WEIGHT_PER_WINDOW && this.requestLog.length > 0) {
        const candidateWait =
          this.requestLog[0].at + REQUEST_WINDOW_MS - now + MIN_INTER_REQUEST_GAP_MS;
        if (candidateWait > waitMs) {
          waitMs = candidateWait;
          waitReason = 'historical-window';
          waitLabel =
            'Waiting for the IBKR 10-minute historical pacing window to free capacity. BID_ASK requests count twice.';
        }
      }

      for (const entry of this.requestLog) {
        if (entry.signature === signature) {
          const candidateWait =
            entry.at + IDENTICAL_REQUEST_COOLDOWN_MS - now + MIN_INTER_REQUEST_GAP_MS;
          if (candidateWait > waitMs) {
            waitMs = candidateWait;
            waitReason = 'identical-request';
            waitLabel =
              'Waiting for the IBKR identical-request cooldown before issuing the same historical request again.';
          }
        }
      }

      if (waitMs <= MIN_INTER_REQUEST_GAP_MS) {
        break;
      }

      emitRuntimeStatus(runtimeContext, {
        phase: 'waiting-pacing',
        requestKind: runtimeContext.requestKind,
        waitReason,
        waitRemainingMs: waitMs,
        requestWeightInWindow: totalWeight,
        label: waitLabel,
      });
      await sleep(Math.min(waitMs, 1000), runtimeContext.abortSignal);
    }
  }
}

function inferPricePrecision(tickSize: number): number {
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

export const IBKR_TWS_CONNECTOR: MarketDataConnectorDefinition<IbkrConnectorConfig> = {
  descriptor: {
    id: 'ibkr-tws',
    label: 'IBKR TWS',
    summary: 'Connect through a local Interactive Brokers TWS or Gateway API session.',
    configFields: IBKR_CONFIG_FIELDS,
    supportsDirectTicks: true,
    supportsHistoricalTicks: true,
    supportsQuotes: true,
    supportsPersistence: true,
  },
  sanitizeConfig(config: Record<string, ConnectorConfigValue>): IbkrConnectorConfig {
    const host = sanitizeHost(config.host);
    if (!host) {
      throw new Error('An IBKR host is required.');
    }

    return {
      host,
      port: sanitizePort(config.port),
      clientId: sanitizeOptionalClientId(config.clientId),
    };
  },
  async testConnection(config: IbkrConnectorConfig): Promise<ConnectorTestResult> {
    const api = await connectIbkrApi(config);

    try {
      return {
        ok: true,
        message: `Connected to IBKR at ${config.host}:${config.port}.`,
      };
    } finally {
      api.disconnect();
    }
  },
  async connect(config: IbkrConnectorConfig): Promise<MarketDataConnectorSession> {
    const api = await connectIbkrApi(config);
    return new IbkrConnectorSession(api, config);
  },
};
