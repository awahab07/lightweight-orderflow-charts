import type { CustomData, LineData, Time } from 'lightweight-charts';

export type TimeValue = Time;
export type PatchOperation = 'append' | 'upsert' | 'replace' | 'remove';

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

export interface NormalizationOptions {
  instrument?: InstrumentContext;
  sessions?: SessionDefinition[];
  deriveSessions?: boolean;
}

export interface VwapPoint extends LineData<TimeValue> {
  sessionId?: string;
}
