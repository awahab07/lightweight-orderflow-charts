import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { AggregatedMarketBar, OrderFlowBar } from 'lightweight-orderflow-charts';

import type {
  ConnectorBridgeEvent,
  ConnectorBridgeState,
  ConnectorBridgeConnectionState,
  ConnectorConfigValue,
  ConnectorGrabProgress,
  ConnectorLogLevel,
  ConnectorSaveResult,
  ConnectorSessionDataPayload,
  ConnectorStoredSessionSummary,
  ConnectorVendorId,
  MarketDataConnectorDefinition,
  MarketDataConnectorSession,
} from '../core/contracts';
import { assessMinuteCoverage } from '../core/minuteCoverage';
import { sessionProgressPct } from '../core/time';
import {
  loadAggregatedSession,
  resolveVendorCacheRoot,
} from '../storage/aggregatedMarketDataStore';
import { CONNECTOR_DEFINITIONS, getConnectorDefinition } from '../vendors';
import { captureHistoricalSession } from '../vendors/ibkr/captureHistoricalSession';

interface BridgeCommandResponse<TPayload = unknown> {
  ok: boolean;
  message: string;
  payload?: TPayload;
}

interface ActiveGrabState {
  vendorId: string;
  vendorLabel: string;
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks: boolean;
  includeQuotes: boolean;
  maxRequests?: number;
  orderFlowBars: OrderFlowBar[];
  marketBars: AggregatedMarketBar[];
  progress: ConnectorGrabProgress;
  runPromise: Promise<void> | null;
}

export interface ConnectorBridgeServerOptions {
  host?: string;
  port?: number;
  dataRoot?: string;
  bridgeLabel?: string;
}

function createDisconnectedConnectionState(): ConnectorBridgeConnectionState {
  return {
    vendorId: null,
    vendorLabel: null,
    status: 'disconnected',
    message: null,
    testedAt: null,
    connectedAt: null,
  };
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function writeCorsHeaders(response: ServerResponse): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  writeCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function writeSse(response: ServerResponse, event: ConnectorBridgeEvent): void {
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

function buildStoredSummary(
  symbol: string,
  sessionDate: string,
  includeTicks: boolean,
  stored: ReturnType<typeof loadAggregatedSession>,
): ConnectorStoredSessionSummary {
  const coverage = assessMinuteCoverage(stored.marketBars, stored.orderFlowBars);
  const complete = includeTicks
    ? stored.summary.complete && stored.summary.footprintAvailable && coverage.isComplete
    : stored.summary.complete && stored.marketBars.length > 0;
  const coveragePct = includeTicks
    ? coverage.coverageRatio * 100
    : complete
      ? 100
      : sessionProgressPct(stored.summary.lastBarTime);

  return {
    ...stored.summary,
    symbol,
    sessionDate,
    complete,
    requiredMinutes: includeTicks ? coverage.requiredMinuteCount : null,
    coveredMinutes: includeTicks ? coverage.coveredMinuteCount : stored.marketBars.length,
    contiguousCoveredMinutes: includeTicks
      ? coverage.contiguousCoveredMinuteCount
      : stored.marketBars.length,
    coveragePct,
  };
}

function buildStoredSessionPayload(input: {
  vendorId: ConnectorVendorId;
  vendorLabel: string;
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks: boolean;
  includeQuotes: boolean;
  stored: ReturnType<typeof loadAggregatedSession>;
  message: string;
}): ConnectorSessionDataPayload {
  const summary = buildStoredSummary(
    input.symbol,
    input.sessionDate,
    input.includeTicks,
    input.stored,
  );
  const currentBar =
    input.stored.orderFlowBars.length > 0
      ? input.stored.orderFlowBars[input.stored.orderFlowBars.length - 1]
      : null;
  const completedMinutes = input.includeTicks
    ? summary.complete
      ? (summary.contiguousCoveredMinutes ?? 0)
      : Math.max((summary.contiguousCoveredMinutes ?? 0) - (currentBar ? 1 : 0), 0)
    : input.stored.marketBars.length;

  return {
    vendorId: input.vendorId,
    vendorLabel: input.vendorLabel,
    orderFlowBars: input.stored.orderFlowBars,
    marketBars: input.stored.marketBars,
    progress: {
      vendorId: input.vendorId as ConnectorGrabProgress['vendorId'],
      vendorLabel: input.vendorLabel,
      symbol: input.symbol,
      sessionDate: input.sessionDate,
      intervalSeconds: input.intervalSeconds,
      includeTicks: input.includeTicks,
      includeQuotes: input.includeQuotes,
      status: summary.complete
        ? 'completed'
        : input.stored.marketBars.length || input.stored.orderFlowBars.length
          ? 'paused'
          : 'idle',
      cacheHit: input.stored.marketBars.length > 0 || input.stored.orderFlowBars.length > 0,
      cachedOrderFlowBars: input.stored.orderFlowBars.length,
      loadedOrderFlowBars: input.stored.orderFlowBars.length,
      loadedMarketBars: input.stored.marketBars.length,
      requestCount: 0,
      lastObservedTime: summary.lastBarTime,
      cursor: {
        tradeNextTime: null,
        quoteNextTime: null,
      },
      progressPct: sessionProgressPct(summary.lastBarTime),
      requiredMinutes: summary.requiredMinutes,
      coveredMinutes: summary.coveredMinutes,
      contiguousCoveredMinutes: summary.contiguousCoveredMinutes,
      coveragePct: summary.coveragePct,
      complete: summary.complete,
      dirty: false,
      rawTicksFetchedCurrentRun: 0,
      rawTradeTicksFetchedCurrentRun: 0,
      rawQuoteTicksFetchedCurrentRun: 0,
      completedMinutes,
      currentMinutePriceLevels: currentBar?.levels.length ?? 0,
      message: input.message,
    },
    instrument: null,
    source: 'cache',
  };
}

export function createConnectorBridgeServer(options: ConnectorBridgeServerOptions = {}) {
  const host = options.host || process.env.CONNECTOR_BRIDGE_HOST || '127.0.0.1';
  const port = options.port ?? Number(process.env.CONNECTOR_BRIDGE_PORT || 8791);
  const bridgeLabel = options.bridgeLabel || 'Local Market Connector Bridge';
  const eventClients = new Set<ServerResponse>();

  let connectionState = createDisconnectedConnectionState();
  let activeConnector: MarketDataConnectorDefinition | null = null;
  let activeSession: MarketDataConnectorSession | null = null;
  let activeGrab: ActiveGrabState | null = null;
  let storedSummary: ConnectorStoredSessionSummary | null = null;
  let lastSave: ConnectorSaveResult | null = null;

  const resolveConnectorDataRoot = (connector: MarketDataConnectorDefinition | null): string =>
    options.dataRoot || resolveVendorCacheRoot(connector?.cacheDirectory || 'ibkr');

  const buildState = (): ConnectorBridgeState => ({
    bridgeAvailable: true,
    bridgeLabel,
    vendors: CONNECTOR_DEFINITIONS.map((entry) => entry.descriptor),
    connection: connectionState,
    activeGrab: activeGrab?.progress ?? null,
    storedSummary,
    lastSave,
    dataRoot: resolveConnectorDataRoot(
      (activeGrab?.vendorId ? getConnectorDefinition(activeGrab.vendorId) : null) ||
        activeConnector ||
        (connectionState.vendorId ? getConnectorDefinition(connectionState.vendorId) : null),
    ),
  });

  const emitEvent = (event: ConnectorBridgeEvent): void => {
    for (const client of eventClients) {
      writeSse(client, event);
    }
  };

  const emitState = (): void => {
    emitEvent({
      type: 'state',
      payload: buildState(),
    });
  };

  const emitLog = (level: ConnectorLogLevel, message: string): void => {
    emitEvent({
      type: 'log',
      payload: {
        level,
        message,
        at: new Date().toISOString(),
      },
    });
  };

  const disconnectSession = async (): Promise<void> => {
    if (activeSession) {
      await activeSession.disconnect();
    }

    activeSession = null;
    activeConnector = null;
    connectionState = createDisconnectedConnectionState();
    emitState();
  };

  const runGrabLoop = async (control: ActiveGrabState, dataRoot: string): Promise<void> => {
    if (!activeSession || !activeConnector) {
      return;
    }

    connectionState = {
      ...connectionState,
      status: 'streaming',
      message: `Loading ${control.symbol} ${control.sessionDate} from cache or vendor.`,
    };
    emitState();

    try {
      for await (const snapshot of captureHistoricalSession({
        session: activeSession,
        symbol: control.symbol,
        sessionDate: control.sessionDate,
        dataRoot,
        includeTicks: control.includeTicks,
        includeQuotes: control.includeQuotes,
        maxRequests: control.maxRequests,
        vendorId: activeConnector.descriptor.id,
      })) {
        control.orderFlowBars = snapshot.orderFlowBars;
        control.marketBars = snapshot.marketBars;
        control.progress = snapshot.progress;
        storedSummary = snapshot.storedSummary;

        emitEvent({
          type: 'session-data',
          payload: {
            vendorId: control.vendorId as ConnectorSessionDataPayload['vendorId'],
            vendorLabel: control.vendorLabel,
            orderFlowBars: snapshot.orderFlowBars,
            marketBars: snapshot.marketBars,
            progress: snapshot.progress,
            instrument: snapshot.instrument,
            source: snapshot.source,
          },
        });
        emitState();
      }

      connectionState = {
        ...connectionState,
        status: 'connected',
        message: control.progress.complete
          ? 'Connected. The selected cache-first load is complete.'
          : 'Connected. The selected session is loaded.',
      };
      emitState();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      control.progress = {
        ...control.progress,
        status: 'error',
        message,
      };
      connectionState = {
        ...connectionState,
        status: 'error',
        message,
      };
      emitLog('error', message);
      emitState();
    } finally {
      control.runPromise = null;
      emitState();
    }
  };

  const server = createServer(async (request, response) => {
    const method = request.method || 'GET';
    const url = new URL(request.url || '/', `http://${request.headers.host || `${host}:${port}`}`);

    if (method === 'OPTIONS') {
      writeCorsHeaders(response);
      response.statusCode = 204;
      response.end();
      return;
    }

    if (method === 'GET' && url.pathname === '/api/connectors/events') {
      writeCorsHeaders(response);
      response.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      response.write('\n');
      eventClients.add(response);
      writeSse(response, {
        type: 'state',
        payload: buildState(),
      });

      request.on('close', () => {
        eventClients.delete(response);
      });
      return;
    }

    if (method === 'GET' && url.pathname === '/api/connectors/state') {
      writeJson(response, 200, buildState());
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/cache/session') {
      const body = await readJsonBody<{
        vendorId: string;
        symbol: string;
        sessionDate: string;
        intervalSeconds: number;
        includeTicks?: boolean;
        includeQuotes?: boolean;
      }>(request);
      const connector = getConnectorDefinition(body.vendorId);
      if (!connector) {
        writeJson(response, 404, {
          ok: false,
          message: `Unknown connector vendor '${body.vendorId}'.`,
        } satisfies BridgeCommandResponse);
        return;
      }

      const symbol = String(body.symbol || '')
        .trim()
        .toUpperCase();
      const sessionDate = String(body.sessionDate || '').trim();
      if (!symbol || !sessionDate || !Number.isFinite(body.intervalSeconds)) {
        writeJson(response, 400, {
          ok: false,
          message: 'vendorId, symbol, sessionDate, and intervalSeconds are required.',
        } satisfies BridgeCommandResponse);
        return;
      }

      const includeTicks =
        Boolean(body.includeTicks ?? connector.descriptor.supportsHistoricalTicks) &&
        connector.descriptor.supportsHistoricalTicks;
      const includeQuotes =
        Boolean(body.includeQuotes ?? connector.descriptor.supportsQuotes) &&
        connector.descriptor.supportsQuotes;
      const stored = loadAggregatedSession(
        symbol,
        sessionDate,
        resolveConnectorDataRoot(connector),
      );
      const payload = buildStoredSessionPayload({
        vendorId: connector.descriptor.id,
        vendorLabel: connector.descriptor.label,
        symbol,
        sessionDate,
        intervalSeconds: Number(body.intervalSeconds),
        includeTicks,
        includeQuotes,
        stored,
        message:
          stored.marketBars.length || stored.orderFlowBars.length
            ? buildStoredSummary(symbol, sessionDate, includeTicks, stored).complete
              ? 'Loaded the cached session for the current selection.'
              : `Loaded cached progress. Connect ${connector.descriptor.label} and stream to continue from the first incomplete minute.`
            : `No cached ${connector.descriptor.label} session exists for this selection yet.`,
      });

      writeJson(response, 200, {
        ok: true,
        message: payload.progress.message ?? 'Loaded cached session data.',
        payload,
      } satisfies BridgeCommandResponse<ConnectorSessionDataPayload>);
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/test') {
      const body = await readJsonBody<{
        vendorId: string;
        config: Record<string, ConnectorConfigValue>;
      }>(request);
      const connector = getConnectorDefinition(body.vendorId);
      if (!connector) {
        writeJson(response, 404, {
          ok: false,
          message: `Unknown connector vendor '${body.vendorId}'.`,
        } satisfies BridgeCommandResponse);
        return;
      }

      try {
        const config = connector.sanitizeConfig(body.config || {});
        connectionState = {
          ...connectionState,
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: 'testing',
          message: `Testing ${connector.descriptor.label}.`,
        };
        emitState();

        const result = await connector.testConnection(config);
        connectionState = {
          ...connectionState,
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: result.ok ? 'test-passed' : 'test-failed',
          message: result.message,
          testedAt: new Date().toISOString(),
        };
        emitState();

        writeJson(response, 200, {
          ok: result.ok,
          message: result.message,
          payload: result,
        } satisfies BridgeCommandResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        connectionState = {
          ...connectionState,
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: 'test-failed',
          message,
          testedAt: new Date().toISOString(),
        };
        emitState();

        writeJson(response, 400, {
          ok: false,
          message,
        } satisfies BridgeCommandResponse);
      }
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/connect') {
      const body = await readJsonBody<{
        vendorId: string;
        config: Record<string, ConnectorConfigValue>;
      }>(request);
      const connector = getConnectorDefinition(body.vendorId);
      if (!connector) {
        writeJson(response, 404, {
          ok: false,
          message: `Unknown connector vendor '${body.vendorId}'.`,
        } satisfies BridgeCommandResponse);
        return;
      }

      try {
        await disconnectSession();
        const config = connector.sanitizeConfig(body.config || {});
        connectionState = {
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: 'connecting',
          message: `Connecting to ${connector.descriptor.label}.`,
          testedAt: connectionState.testedAt,
          connectedAt: null,
        };
        emitState();

        activeSession = await connector.connect(config);
        activeConnector = connector;
        connectionState = {
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: 'connected',
          message: `Connected to ${connector.descriptor.label}.`,
          testedAt: connectionState.testedAt,
          connectedAt: new Date().toISOString(),
        };
        emitState();

        writeJson(response, 200, {
          ok: true,
          message: connectionState.message ?? 'Connected to the selected connector.',
          payload: buildState(),
        } satisfies BridgeCommandResponse<ConnectorBridgeState>);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        connectionState = {
          vendorId: connector.descriptor.id,
          vendorLabel: connector.descriptor.label,
          status: 'error',
          message,
          testedAt: connectionState.testedAt,
          connectedAt: null,
        };
        emitState();

        writeJson(response, 400, {
          ok: false,
          message,
        } satisfies BridgeCommandResponse);
      }
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/disconnect') {
      await disconnectSession();
      writeJson(response, 200, {
        ok: true,
        message: 'Connector session disconnected.',
        payload: buildState(),
      } satisfies BridgeCommandResponse<ConnectorBridgeState>);
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/grab/start') {
      const body = await readJsonBody<{
        vendorId?: string;
        symbol: string;
        sessionDate: string;
        intervalSeconds: number;
        includeTicks?: boolean;
        includeQuotes?: boolean;
        maxRequests?: number;
      }>(request);

      const requestedConnector =
        (body.vendorId ? getConnectorDefinition(body.vendorId) : null) ??
        activeConnector ??
        (connectionState.vendorId ? getConnectorDefinition(connectionState.vendorId) : null);
      const symbol = String(body.symbol || '')
        .trim()
        .toUpperCase();
      const sessionDate = String(body.sessionDate || '').trim();
      if (!symbol || !sessionDate || !Number.isFinite(body.intervalSeconds)) {
        writeJson(response, 400, {
          ok: false,
          message: 'symbol, sessionDate, and intervalSeconds are required.',
        } satisfies BridgeCommandResponse);
        return;
      }

      if (body.vendorId && !requestedConnector) {
        writeJson(response, 404, {
          ok: false,
          message: `Unknown connector vendor '${body.vendorId}'.`,
        } satisfies BridgeCommandResponse);
        return;
      }

      if (!requestedConnector) {
        writeJson(response, 409, {
          ok: false,
          message: 'No connector vendor is selected. Connect or choose a vendor before loading.',
        } satisfies BridgeCommandResponse);
        return;
      }

      const dataRoot = resolveConnectorDataRoot(requestedConnector);
      const includeTicks =
        Boolean(body.includeTicks ?? requestedConnector.descriptor.supportsHistoricalTicks) &&
        requestedConnector.descriptor.supportsHistoricalTicks;
      const includeQuotes =
        Boolean(body.includeQuotes ?? requestedConnector.descriptor.supportsQuotes) &&
        requestedConnector.descriptor.supportsQuotes;
      const vendorReadyForFetch =
        Boolean(activeSession && activeConnector) &&
        activeConnector?.descriptor.id === requestedConnector.descriptor.id;
      const stored = loadAggregatedSession(symbol, sessionDate, dataRoot);
      const cachedPayload = buildStoredSessionPayload({
        vendorId: requestedConnector.descriptor.id,
        vendorLabel: requestedConnector.descriptor.label,
        symbol,
        sessionDate,
        intervalSeconds: Number(body.intervalSeconds),
        includeTicks,
        includeQuotes,
        stored,
        message:
          stored.marketBars.length || stored.orderFlowBars.length
            ? 'Loaded cached progress for the selected session.'
            : `No cached ${requestedConnector.descriptor.label} session exists for this selection yet.`,
      });
      storedSummary = buildStoredSummary(symbol, sessionDate, includeTicks, stored);

      if (!vendorReadyForFetch) {
        if (stored.marketBars.length || stored.orderFlowBars.length) {
          activeGrab = {
            vendorId: requestedConnector.descriptor.id,
            vendorLabel: requestedConnector.descriptor.label,
            symbol,
            sessionDate,
            intervalSeconds: Number(body.intervalSeconds),
            includeTicks,
            includeQuotes,
            maxRequests: body.maxRequests,
            orderFlowBars: cachedPayload.orderFlowBars,
            marketBars: cachedPayload.marketBars,
            progress: {
              ...cachedPayload.progress,
              status: cachedPayload.progress.complete ? 'completed' : 'paused',
              message: cachedPayload.progress.complete
                ? 'Loaded a complete cached session without opening a vendor connection.'
                : `Loaded cached progress. Connect ${requestedConnector.descriptor.label} to refresh or complete the session.`,
            },
            runPromise: null,
          };

          emitEvent({
            type: 'session-data',
            payload: {
              ...cachedPayload,
              progress: activeGrab.progress,
            },
          });
          emitState();

          writeJson(response, 200, {
            ok: true,
            message: activeGrab.progress.message ?? 'Loaded the cached session.',
            payload: buildState(),
          } satisfies BridgeCommandResponse<ConnectorBridgeState>);
          return;
        }

        writeJson(response, 409, {
          ok: false,
          message: `Connect ${requestedConnector.descriptor.label} before loading uncached market data.`,
        } satisfies BridgeCommandResponse);
        return;
      }

      if (cachedPayload.progress.complete) {
        activeGrab = {
          vendorId: requestedConnector.descriptor.id,
          vendorLabel: requestedConnector.descriptor.label,
          symbol,
          sessionDate,
          intervalSeconds: Number(body.intervalSeconds),
          includeTicks,
          includeQuotes,
          maxRequests: body.maxRequests,
          orderFlowBars: cachedPayload.orderFlowBars,
          marketBars: cachedPayload.marketBars,
          progress: {
            ...cachedPayload.progress,
            status: 'completed',
            message: 'Loaded a complete cached session. No vendor re-stream was required.',
          },
          runPromise: null,
        };
        emitEvent({
          type: 'session-data',
          payload: {
            ...cachedPayload,
            progress: activeGrab.progress,
          },
        });
        emitState();
        writeJson(response, 200, {
          ok: true,
          message: activeGrab.progress.message ?? 'Loaded the cached session.',
          payload: buildState(),
        } satisfies BridgeCommandResponse<ConnectorBridgeState>);
        return;
      }

      if (activeGrab?.runPromise) {
        writeJson(response, 409, {
          ok: false,
          message: 'A cache-first load is already in progress.',
        } satisfies BridgeCommandResponse);
        return;
      }

      activeGrab = {
        vendorId: requestedConnector.descriptor.id,
        vendorLabel: requestedConnector.descriptor.label,
        symbol,
        sessionDate,
        intervalSeconds: Number(body.intervalSeconds),
        includeTicks,
        includeQuotes,
        maxRequests: body.maxRequests,
        orderFlowBars: stored.orderFlowBars,
        marketBars: stored.marketBars,
        progress: {
          ...cachedPayload.progress,
          status: 'loading-cache',
          complete: false,
          message:
            stored.orderFlowBars.length > 0 || stored.marketBars.length > 0
              ? `Loaded cached data and refreshing it from ${requestedConnector.descriptor.label}.`
              : `No vendor cache was found. Starting a fresh ${requestedConnector.descriptor.label} load.`,
        },
        runPromise: null,
      };
      activeGrab.runPromise = runGrabLoop(activeGrab, dataRoot);
      emitState();

      writeJson(response, 200, {
        ok: true,
        message: 'Cache-first load started.',
        payload: buildState(),
      } satisfies BridgeCommandResponse<ConnectorBridgeState>);
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/grab/stop') {
      writeJson(response, 200, {
        ok: true,
        message: 'Stop is not supported by the aggregated cache loader.',
        payload: buildState(),
      } satisfies BridgeCommandResponse<ConnectorBridgeState>);
      return;
    }

    if (method === 'POST' && url.pathname === '/api/connectors/save') {
      writeJson(response, 410, {
        ok: false,
        message: 'Manual save is no longer supported. Cache writes happen during load.',
      } satisfies BridgeCommandResponse<ConnectorSaveResult>);
      return;
    }

    writeJson(response, 404, {
      ok: false,
      message: `Unknown connector bridge route '${url.pathname}'.`,
    } satisfies BridgeCommandResponse);
  });

  return {
    host,
    port,
    server,
    start() {
      server.listen(port, host, () => {
        // eslint-disable-next-line no-console
        console.log(`${bridgeLabel} listening on http://${host}:${port}`);
      });
      return server;
    },
    async stop() {
      await disconnectSession();
      for (const client of eventClients) {
        client.end();
      }
      eventClients.clear();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
