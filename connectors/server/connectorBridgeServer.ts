import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type {
  AggregatedMarketBar,
  OrderFlowBar,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorBridgeEvent,
  ConnectorBridgeState,
  ConnectorBridgeConnectionState,
  ConnectorConfigValue,
  ConnectorGrabProgress,
  ConnectorLogLevel,
  ConnectorSaveResult,
  ConnectorStoredSessionSummary,
  MarketDataConnectorDefinition,
  MarketDataConnectorSession,
} from '../core/contracts';
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

export function createConnectorBridgeServer(options: ConnectorBridgeServerOptions = {}) {
  const host = options.host || process.env.CONNECTOR_BRIDGE_HOST || '127.0.0.1';
  const port = options.port ?? Number(process.env.CONNECTOR_BRIDGE_PORT || 8791);
  const dataRoot = options.dataRoot || resolveVendorCacheRoot('ibkr');
  const bridgeLabel = options.bridgeLabel || 'Local Market Connector Bridge';
  const eventClients = new Set<ServerResponse>();

  let connectionState = createDisconnectedConnectionState();
  let activeConnector: MarketDataConnectorDefinition | null = null;
  let activeSession: MarketDataConnectorSession | null = null;
  let activeGrab: ActiveGrabState | null = null;
  let storedSummary: ConnectorStoredSessionSummary | null = null;
  let lastSave: ConnectorSaveResult | null = null;

  const buildState = (): ConnectorBridgeState => ({
    bridgeAvailable: true,
    bridgeLabel,
    vendors: CONNECTOR_DEFINITIONS.map((entry) => entry.descriptor),
    connection: connectionState,
    activeGrab: activeGrab?.progress ?? null,
    storedSummary,
    lastSave,
    dataRoot,
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

  const runGrabLoop = async (control: ActiveGrabState): Promise<void> => {
    if (!activeSession) {
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
        vendorId: 'ibkr',
      })) {
        control.orderFlowBars = snapshot.orderFlowBars;
        control.marketBars = snapshot.marketBars;
        control.progress = snapshot.progress;
        storedSummary = snapshot.storedSummary;

        emitEvent({
          type: 'session-data',
          payload: {
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
        symbol: string;
        sessionDate: string;
        intervalSeconds: number;
        includeTicks?: boolean;
        includeQuotes?: boolean;
        maxRequests?: number;
      }>(request);

      const symbol = String(body.symbol || '').trim().toUpperCase();
      const sessionDate = String(body.sessionDate || '').trim();
      if (!symbol || !sessionDate || !Number.isFinite(body.intervalSeconds)) {
        writeJson(response, 400, {
          ok: false,
          message: 'symbol, sessionDate, and intervalSeconds are required.',
        } satisfies BridgeCommandResponse);
        return;
      }

      const stored = loadAggregatedSession(symbol, sessionDate, dataRoot);
      storedSummary = stored.summary;

      if (!activeSession || !activeConnector) {
        if (stored.marketBars.length || stored.orderFlowBars.length) {
          const progress: ConnectorGrabProgress = {
            symbol,
            sessionDate,
            intervalSeconds: Number(body.intervalSeconds),
            includeTicks: Boolean(body.includeTicks ?? true),
            includeQuotes: Boolean(body.includeQuotes),
            status: stored.summary.complete ? 'completed' : 'paused',
            cacheHit: true,
            cachedOrderFlowBars: stored.orderFlowBars.length,
            loadedOrderFlowBars: stored.orderFlowBars.length,
            loadedMarketBars: stored.marketBars.length,
            requestCount: 0,
            lastObservedTime: stored.summary.lastBarTime,
            cursor: {
              tradeNextTime: null,
              quoteNextTime: null,
            },
            progressPct: null,
            complete: stored.summary.complete,
            dirty: false,
            rawTicksFetchedCurrentRun: 0,
            rawTradeTicksFetchedCurrentRun: 0,
            rawQuoteTicksFetchedCurrentRun: 0,
            completedMinutes: stored.orderFlowBars.length,
            currentMinutePriceLevels:
              stored.orderFlowBars.length > 0
                ? stored.orderFlowBars[stored.orderFlowBars.length - 1].levels.length
                : 0,
            message: stored.summary.complete
              ? 'Loaded a complete cached session without opening a vendor connection.'
              : 'Loaded cached progress. Connect the vendor to refresh or complete the session.',
          };

          activeGrab = {
            symbol,
            sessionDate,
            intervalSeconds: Number(body.intervalSeconds),
            includeTicks: Boolean(body.includeTicks ?? true),
            includeQuotes: Boolean(body.includeQuotes),
            maxRequests: body.maxRequests,
            orderFlowBars: stored.orderFlowBars,
            marketBars: stored.marketBars,
            progress,
            runPromise: null,
          };

          emitEvent({
            type: 'session-data',
            payload: {
              orderFlowBars: stored.orderFlowBars,
              marketBars: stored.marketBars,
              progress,
              instrument: null,
              source: 'cache',
            },
          });
          emitState();

          writeJson(response, 200, {
            ok: true,
            message: progress.message ?? 'Loaded the cached session.',
            payload: buildState(),
          } satisfies BridgeCommandResponse<ConnectorBridgeState>);
          return;
        }

        writeJson(response, 409, {
          ok: false,
          message: 'Connect a vendor session before loading uncached market data.',
        } satisfies BridgeCommandResponse);
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
        symbol,
        sessionDate,
        intervalSeconds: Number(body.intervalSeconds),
        includeTicks: Boolean(body.includeTicks ?? true),
        includeQuotes: Boolean(body.includeQuotes),
        maxRequests: body.maxRequests,
        orderFlowBars: stored.orderFlowBars,
        marketBars: stored.marketBars,
        progress: {
          symbol,
          sessionDate,
          intervalSeconds: Number(body.intervalSeconds),
          includeTicks: Boolean(body.includeTicks ?? true),
          includeQuotes: Boolean(body.includeQuotes),
          status: 'loading-cache',
          cacheHit: stored.orderFlowBars.length > 0 || stored.marketBars.length > 0,
          cachedOrderFlowBars: stored.orderFlowBars.length,
          loadedOrderFlowBars: stored.orderFlowBars.length,
          loadedMarketBars: stored.marketBars.length,
          requestCount: 0,
          lastObservedTime: stored.summary.lastBarTime,
          cursor: {
            tradeNextTime: null,
            quoteNextTime: null,
          },
          progressPct: null,
          complete: false,
          dirty: false,
          rawTicksFetchedCurrentRun: 0,
          rawTradeTicksFetchedCurrentRun: 0,
          rawQuoteTicksFetchedCurrentRun: 0,
          completedMinutes: stored.orderFlowBars.length,
          currentMinutePriceLevels:
            stored.orderFlowBars.length > 0
              ? stored.orderFlowBars[stored.orderFlowBars.length - 1].levels.length
              : 0,
          message:
            stored.orderFlowBars.length > 0 || stored.marketBars.length > 0
              ? 'Loaded cached data and refreshing from the vendor.'
              : 'No vendor cache was found. Starting a fresh vendor load.',
        },
        runPromise: null,
      };
      activeGrab.runPromise = runGrabLoop(activeGrab);
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
