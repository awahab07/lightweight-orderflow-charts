import type {
  AggregatedMarketBar,
  InstrumentContext,
  OrderFlowBar,
} from 'lightweight-orderflow-charts';
import {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
} from 'lightweight-orderflow-charts';

import instruments from '../../data/market/instruments.json';
import nvda20260302Bars from '../../data/market/nvda/2026-03-02/bars-1m.json';
import nvda20260310Bars from '../../data/market/nvda/2026-03-10/bars-1m.json';
import tsla20260309Bars from '../../data/market/tsla/2026-03-09/bars-1m.json';
import tsla20260310Bars from '../../data/market/tsla/2026-03-10/bars-1m.json';
import {
  buildSyntheticOrderFlowFromBars,
  type MarketBarRecord,
} from '../../demo/src/lib/buildSyntheticOrderFlowFromBars';
import {
  buildDemoCandleHeatmapScores,
  resolveDemoCandleHeatmapScore,
} from '../../demo/src/lib/candleHeatmapMetric';

export type StoryInterval = '1m' | '5m';
export type StoryFixtureId =
  | 'footprint-tsla'
  | 'session-tsla'
  | 'volume-footprint-nvda'
  | 'delta-nvda';

interface MarketInstrumentRecord {
  symbol: string;
  conId?: number;
  timezone?: string;
  minTick?: number | null;
}

interface StoryFixtureSource {
  symbol: 'TSLA' | 'NVDA';
  sessionDate: string;
  bars1m: AggregatedMarketBar[];
}

export interface StoryFixture {
  id: StoryFixtureId;
  symbol: StoryFixtureSource['symbol'];
  sessionDate: string;
  instrument: InstrumentContext;
  interval: StoryInterval;
  marketBars: AggregatedMarketBar[];
  orderFlowBars: OrderFlowBar[];
  getHeatmapValue: (bar: OrderFlowBar) => number | null;
}

const MARKET_INSTRUMENTS = new Map(
  (instruments as MarketInstrumentRecord[]).map(
    (entry) => [entry.symbol.toUpperCase(), entry] as const,
  ),
);

const FIXTURE_SOURCES: Record<StoryFixtureId, StoryFixtureSource> = {
  'footprint-tsla': {
    symbol: 'TSLA',
    sessionDate: '2026-03-10',
    bars1m: tsla20260310Bars as unknown as AggregatedMarketBar[],
  },
  'session-tsla': {
    symbol: 'TSLA',
    sessionDate: '2026-03-09',
    bars1m: tsla20260309Bars as unknown as AggregatedMarketBar[],
  },
  'volume-footprint-nvda': {
    symbol: 'NVDA',
    sessionDate: '2026-03-10',
    bars1m: nvda20260310Bars as unknown as AggregatedMarketBar[],
  },
  'delta-nvda': {
    symbol: 'NVDA',
    sessionDate: '2026-03-02',
    bars1m: nvda20260302Bars as unknown as AggregatedMarketBar[],
  },
};

const ORDER_FLOW_1M_CACHE = new Map<StoryFixtureId, OrderFlowBar[]>();
const HEATMAP_SCORE_CACHE = new Map<StoryFixtureId, Map<string, number>>();

function derivePricePrecision(tickSize: number): number {
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

function buildInstrument(symbol: StoryFixtureSource['symbol']): InstrumentContext {
  const instrument = MARKET_INSTRUMENTS.get(symbol) ?? null;
  const tickSize = instrument?.minTick && instrument.minTick > 0 ? instrument.minTick : 0.01;

  return {
    instrumentId: instrument?.conId != null ? String(instrument.conId) : `${symbol}-STK-SMART`,
    symbol,
    tickSize,
    pricePrecision: derivePricePrecision(tickSize),
    timezone: instrument?.timezone ?? 'America/New_York',
    volumePrecision: 0,
  };
}

function timeKey(time: OrderFlowBar['time']): string {
  return typeof time === 'object' ? JSON.stringify(time) : String(time);
}

function loadOrderFlowBars1m(fixtureId: StoryFixtureId): OrderFlowBar[] {
  const cached = ORDER_FLOW_1M_CACHE.get(fixtureId);
  if (cached) {
    return cached;
  }

  const source = FIXTURE_SOURCES[fixtureId];
  const nextBars = buildSyntheticOrderFlowFromBars({
    bars: source.bars1m.map((bar) => ({
      time: Number(bar.time),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      count: bar.tradeCount,
      vwap: bar.vwap,
    })) as MarketBarRecord[],
    instrument: buildInstrument(source.symbol),
  });

  ORDER_FLOW_1M_CACHE.set(fixtureId, nextBars);
  return nextBars;
}

function loadHeatmapScores(fixtureId: StoryFixtureId): Map<string, number> {
  const cached = HEATMAP_SCORE_CACHE.get(fixtureId);
  if (cached) {
    return cached;
  }

  const nextScores = buildDemoCandleHeatmapScores(loadOrderFlowBars1m(fixtureId));
  HEATMAP_SCORE_CACHE.set(fixtureId, nextScores);
  return nextScores;
}

export function getStoryFixture(
  fixtureId: StoryFixtureId,
  interval: StoryInterval = '5m',
): StoryFixture {
  const source = FIXTURE_SOURCES[fixtureId];
  const instrument = buildInstrument(source.symbol);
  const orderFlowBars1m = loadOrderFlowBars1m(fixtureId);
  const marketBars =
    interval === '1m' ? source.bars1m.slice() : aggregateMarketBarsByInterval(source.bars1m, 300);
  const orderFlowBars =
    interval === '1m'
      ? orderFlowBars1m.slice()
      : aggregateOrderFlowBarsByInterval(orderFlowBars1m, 300);
  const heatmapScores = loadHeatmapScores(fixtureId);

  return {
    id: fixtureId,
    symbol: source.symbol,
    sessionDate: source.sessionDate,
    instrument,
    interval,
    marketBars,
    orderFlowBars,
    getHeatmapValue: (bar) => resolveDemoCandleHeatmapScore(bar, heatmapScores) ?? null,
  };
}

export function describeStoryFixture(fixture: StoryFixture): string {
  return `${fixture.symbol} ${fixture.sessionDate} ${fixture.interval}`;
}
