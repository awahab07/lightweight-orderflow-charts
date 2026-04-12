import type { CustomData, LineData, Time } from 'lightweight-charts';

export type TimeValue = Time;
export type PatchOperation = 'append' | 'upsert' | 'replace' | 'remove';
export type OrderFlowAggregationMode = 'tick-derived' | 'price-level-bars' | 'ohlc-synthetic';

export interface InstrumentContext {
  instrumentId: string;
  symbol: string;
  tickSize: number;
  pricePrecision: number;
  volumePrecision?: number;
  timezone: string;
  defaultSessionTemplateId?: string;
}

export interface SessionSegment {
  dayOfWeek: number;
  start: string;
  end: string;
}

export interface SessionDefinition {
  sessionId: string;
  label: string;
  timezone?: string;
  segments: SessionSegment[];
  resetsStudies?: boolean;
}

export interface PriceLevelVolume {
  price: number;
  bidVolume: number;
  askVolume: number;
  tradeCount?: number;
  totalVolume?: number;
  delta?: number;
  attributes?: Record<string, unknown>;
}

export interface OrderFlowBar extends CustomData<TimeValue> {
  open: number;
  high: number;
  low: number;
  close: number;
  levels: PriceLevelVolume[];
  totalVolume?: number;
  delta?: number;
  bidVolume?: number;
  askVolume?: number;
  tradeCount?: number;
  vwap?: number;
  pocPrice?: number;
  pocVolume?: number;
  deltaMin?: number;
  deltaMax?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AggregatedMarketBar extends CustomData<TimeValue> {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  tradeCount?: number;
  bidVolume?: number;
  askVolume?: number;
  delta?: number;
  deltaMin?: number;
  deltaMax?: number;
  pocPrice?: number;
  pocVolume?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderFlowBatch {
  instrument: InstrumentContext;
  sessions?: SessionDefinition[];
  bars: OrderFlowBar[];
}

export interface OrderFlowPatch {
  operation: PatchOperation;
  bars?: OrderFlowBar[];
  correctedTimes?: TimeValue[];
  metadata?: Record<string, unknown>;
}

export interface TradeTick {
  time: number;
  price: number;
  size: number;
  exchange?: string;
  side?: 'buy' | 'sell' | 'unknown';
  attributes?: Record<string, unknown>;
}

export interface QuoteTick {
  time: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  attributes?: Record<string, unknown>;
}

export interface OrderFlowTickStreamUpdate {
  trades?: TradeTick[];
  quotes?: QuoteTick[];
  metadata?: Record<string, unknown>;
}

export interface TickSessionChunk {
  file: string;
  kind: 'trades' | 'quotes';
  compression?: 'gzip' | 'none';
  timeFrom: number;
  timeTo: number;
  tickCount: number;
  complete?: boolean;
}

export interface TickSessionManifest {
  symbol: string;
  sessionDate: string;
  timezone: string;
  sourceMode: OrderFlowAggregationMode;
  tradesAvailable: boolean;
  quotesAvailable?: boolean;
  complete: boolean;
  chunks?: TickSessionChunk[];
  notes?: string[];
}

export interface NormalizationOptions {
  instrument?: InstrumentContext;
  sessions?: SessionDefinition[];
  deriveSessions?: boolean;
}

export interface VwapPoint extends LineData<TimeValue> {
  sessionId?: string;
}
