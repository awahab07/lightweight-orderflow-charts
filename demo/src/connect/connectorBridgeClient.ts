import type {
  ConnectorBridgeEvent,
  ConnectorBridgeState,
  ConnectorConfigValue,
  ConnectorSessionDataPayload,
  ConnectorSaveResult,
} from '../../../connectors/core/contracts';

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8791';
const bridgeBaseUrl = (import.meta.env.VITE_CONNECTOR_BRIDGE_URL || DEFAULT_BRIDGE_URL).replace(
  /\/+$/,
  '',
);

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    const message =
      typeof parsed === 'object' && parsed && 'message' in parsed
        ? String((parsed as { message?: unknown }).message ?? `HTTP ${response.status}`)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}

async function postJson<T>(pathname: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${bridgeBaseUrl}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return readJsonResponse<T>(response);
}

export function getConnectorBridgeBaseUrl(): string {
  return bridgeBaseUrl;
}

export async function loadConnectorBridgeState(): Promise<ConnectorBridgeState> {
  const response = await fetch(`${bridgeBaseUrl}/api/connectors/state`);
  return readJsonResponse<ConnectorBridgeState>(response);
}

export async function testConnectorConnection(
  vendorId: string,
  config: Record<string, ConnectorConfigValue>,
): Promise<{ ok: boolean; message: string }> {
  return postJson('/api/connectors/test', { vendorId, config });
}

export async function connectConnector(
  vendorId: string,
  config: Record<string, ConnectorConfigValue>,
): Promise<{ ok: boolean; message: string; payload?: ConnectorBridgeState }> {
  return postJson('/api/connectors/connect', { vendorId, config });
}

export async function disconnectConnector(): Promise<{
  ok: boolean;
  message: string;
  payload?: ConnectorBridgeState;
}> {
  return postJson('/api/connectors/disconnect');
}

export async function startConnectorGrab(input: {
  vendorId?: string;
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks?: boolean;
  includeQuotes?: boolean;
  maxRequests?: number;
}): Promise<{ ok: boolean; message: string; payload?: ConnectorBridgeState }> {
  return postJson('/api/connectors/grab/start', input);
}

export async function loadConnectorCacheSession(input: {
  vendorId: string;
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks?: boolean;
  includeQuotes?: boolean;
}): Promise<{ ok: boolean; message: string; payload?: ConnectorSessionDataPayload }> {
  return postJson('/api/connectors/cache/session', input);
}

export async function stopConnectorGrab(): Promise<{
  ok: boolean;
  message: string;
  payload?: ConnectorBridgeState;
}> {
  return postJson('/api/connectors/grab/stop');
}

export async function saveConnectorGrab(): Promise<{
  ok: boolean;
  message: string;
  payload?: ConnectorSaveResult;
}> {
  return postJson('/api/connectors/save');
}

export function subscribeToConnectorBridgeEvents(
  onEvent: (event: ConnectorBridgeEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  const source = new EventSource(`${bridgeBaseUrl}/api/connectors/events`);
  source.onmessage = (event) => {
    if (!event.data) {
      return;
    }

    onEvent(JSON.parse(event.data) as ConnectorBridgeEvent);
  };
  source.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    source.close();
  };
}
