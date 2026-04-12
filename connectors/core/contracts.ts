import type {
  AggregatedMarketBar,
  InstrumentContext,
  OrderFlowAggregationMode,
  OrderFlowPatch,
  OrderFlowTickStreamUpdate,
  OrderFlowBar,
} from 'lightweight-orderflow-charts';

export type ConnectorVendorId = 'ibkr-tws';
export type ConnectorConfigValue = string | number | boolean;
export type ConnectorConnectionStatus =
  | 'disconnected'
  | 'testing'
  | 'test-passed'
  | 'test-failed'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'paused'
  | 'saving'
  | 'error';
export type ConnectorLogLevel = 'info' | 'warn' | 'error';

export interface ConnectorConfigFieldDefinition {
  id: string;
  label: string;
  description?: string;
  kind: 'text' | 'number';
  required: boolean;
  placeholder?: string;
  defaultValue?: ConnectorConfigValue;
  min?: number;
  step?: number;
}

export interface MarketDataConnectorDescriptor {
  id: ConnectorVendorId;
  label: string;
  summary: string;
  configFields: ConnectorConfigFieldDefinition[];
  supportsDirectTicks: boolean;
  supportsHistoricalTicks: boolean;
  supportsQuotes: boolean;
  supportsPersistence: boolean;
}

export interface ConnectorTestResult {
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface ConnectorStoredSessionSummary {
  symbol: string;
  sessionDate: string;
  marketBarsLoaded: number;
  orderFlowBarsLoaded: number;
  lastBarTime: number | null;
  footprintAvailable: boolean;
  complete: boolean;
  manifest: AggregatedSessionManifest | null;
}

export interface AggregatedSessionFileDescriptor {
  file: string;
  kind: 'market-bars' | 'order-flow-bars';
  intervalSeconds: number;
  barCount: number;
  complete: boolean;
}

export interface AggregatedSessionManifest {
  symbol: string;
  sessionDate: string;
  timezone: string;
  sourceMode: OrderFlowAggregationMode;
  baseIntervalSeconds: number;
  candlesAvailable: boolean;
  orderFlowAvailable: boolean;
  complete: boolean;
  rawTicksStored: boolean;
  capture?: {
    vendorId?: ConnectorVendorId;
    includeTicks: boolean;
    lastCompleteBarTime: number | null;
    updatedAt: string;
  };
  files: AggregatedSessionFileDescriptor[];
  notes?: string[];
}

export interface ConnectorHistoricalBarsRequest {
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  abortSignal?: AbortSignal;
  onRuntimeStatus?: (status: ConnectorRuntimeStatus) => void;
}

export type ConnectorRuntimePhase =
  | 'loading-cache'
  | 'fetching-bars'
  | 'fetching-trades'
  | 'fetching-quotes'
  | 'waiting-pacing'
  | 'awaiting-response'
  | 'persisting'
  | 'interrupted';

export type ConnectorRuntimeWaitReason =
  | 'historical-window'
  | 'identical-request'
  | 'inter-request-gap';

export interface ConnectorRuntimeStatus {
  symbol: string;
  sessionDate: string;
  phase: ConnectorRuntimePhase;
  label: string;
  requestKind?: 'bars' | 'trades' | 'quotes';
  waitReason?: ConnectorRuntimeWaitReason;
  waitRemainingMs?: number;
  responseRemainingMs?: number;
  requestWeightInWindow?: number;
}

export interface ConnectorGrabRequest {
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks?: boolean;
  includeQuotes?: boolean;
  startTradeTime?: number | null;
  startQuoteTime?: number | null;
  maxRequests?: number;
  abortSignal?: AbortSignal;
  onRuntimeStatus?: (status: ConnectorRuntimeStatus) => void;
}

export interface ConnectorGrabCursor {
  tradeNextTime: number | null;
  quoteNextTime: number | null;
}

export interface ConnectorGrabProgress {
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks: boolean;
  includeQuotes: boolean;
  status: 'idle' | 'loading-cache' | 'loading-vendor' | 'paused' | 'completed' | 'error';
  cacheHit: boolean;
  cachedOrderFlowBars: number;
  loadedOrderFlowBars: number;
  loadedMarketBars: number;
  requestCount: number;
  lastObservedTime: number | null;
  cursor: ConnectorGrabCursor;
  progressPct: number | null;
  complete: boolean;
  dirty: boolean;
  rawTicksFetchedCurrentRun: number;
  rawTradeTicksFetchedCurrentRun: number;
  rawQuoteTicksFetchedCurrentRun: number;
  completedMinutes: number;
  currentMinutePriceLevels: number;
  message?: string;
}

export interface ConnectorSaveResult {
  ok: boolean;
  symbol: string;
  sessionDate: string;
  complete: boolean;
  tradesSaved: number;
  quotesSaved: number;
  outputDirectory: string;
  manifestPath: string;
  message: string;
}

export interface ConnectorBridgeConnectionState {
  vendorId: ConnectorVendorId | null;
  vendorLabel: string | null;
  status: ConnectorConnectionStatus;
  message: string | null;
  testedAt: string | null;
  connectedAt: string | null;
}

export interface ConnectorBridgeState {
  bridgeAvailable: boolean;
  bridgeLabel: string;
  vendors: MarketDataConnectorDescriptor[];
  connection: ConnectorBridgeConnectionState;
  activeGrab: ConnectorGrabProgress | null;
  storedSummary: ConnectorStoredSessionSummary | null;
  lastSave: ConnectorSaveResult | null;
  dataRoot: string;
}

export interface ConnectorLogEvent {
  level: ConnectorLogLevel;
  message: string;
  at: string;
}

export type ConnectorBridgeEvent =
  | {
      type: 'state';
      payload: ConnectorBridgeState;
    }
  | {
      type: 'session-data';
      payload: {
        orderFlowBars: OrderFlowBar[];
        marketBars: AggregatedMarketBar[];
        progress: ConnectorGrabProgress;
        instrument: InstrumentContext | null;
        source: 'cache' | 'vendor' | 'cache+vendor';
      };
    }
  | {
      type: 'order-flow-patch';
      payload: {
        patches: OrderFlowPatch[];
        progress: ConnectorGrabProgress;
        instrument: InstrumentContext | null;
      };
    }
  | {
      type: 'log';
      payload: ConnectorLogEvent;
    };

export interface VendorHistoricalTickChunk {
  update: OrderFlowTickStreamUpdate;
  tradeNextTime: number | null;
  quoteNextTime: number | null;
  requestCount: number;
  lastTradeTime: number | null;
  lastQuoteTime: number | null;
  complete: boolean;
}

export interface MarketDataConnectorSession {
  getInstrumentContext(symbol: string): Promise<InstrumentContext>;
  fetchHistoricalBars(request: ConnectorHistoricalBarsRequest): Promise<AggregatedMarketBar[]>;
  streamHistoricalTicks(request: ConnectorGrabRequest): AsyncGenerator<VendorHistoricalTickChunk>;
  disconnect(): Promise<void>;
}

export interface MarketDataConnectorDefinition<
  TConfig extends Record<string, ConnectorConfigValue> = Record<string, ConnectorConfigValue>,
> {
  descriptor: MarketDataConnectorDescriptor;
  sanitizeConfig(config: Record<string, ConnectorConfigValue>): TConfig;
  testConnection(config: TConfig): Promise<ConnectorTestResult>;
  connect(config: TConfig): Promise<MarketDataConnectorSession>;
}
