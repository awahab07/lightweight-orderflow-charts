import {
  aggregateMarketBarsByInterval,
  aggregateOrderFlowBarsByInterval,
  applyOrderFlowPatch,
  buildAggregatedMarketBarsFromOrderFlowBars,
  createOrderFlowTickStreamController,
  type AggregatedMarketBar,
  type InstrumentContext,
  type OrderFlowBar,
  type OrderFlowPatch,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorGrabProgress,
  ConnectorHistoricalBarsRequest,
  ConnectorRuntimeStatus,
  ConnectorVendorId,
  ConnectorStoredSessionSummary,
  MarketDataConnectorSession,
} from '../../core/contracts';
import {
  assessMinuteCoverage,
  type MinuteCoverageOptions,
  type MinuteCoverageAssessment,
} from '../../core/minuteCoverage';
import { sessionProgressPct } from '../../core/time';
import {
  loadAggregatedSession,
  persistAggregatedSession,
  type StoredAggregatedSessionData,
} from '../../storage/aggregatedMarketDataStore';

export interface CaptureHistoricalSessionOptions {
  session: MarketDataConnectorSession;
  symbol: string;
  sessionDate: string;
  dataRoot: string;
  includeTicks: boolean;
  includeQuotes?: boolean;
  maxRequests?: number;
  vendorId?: ConnectorVendorId;
  persistEachChunk?: boolean;
  abortSignal?: AbortSignal;
  onRuntimeStatus?: (status: ConnectorRuntimeStatus) => void;
}

export interface CaptureHistoricalSessionSnapshot {
  instrument: InstrumentContext;
  marketBars: AggregatedMarketBar[];
  orderFlowBars: OrderFlowBar[];
  patches: OrderFlowPatch[];
  coverage: MinuteCoverageAssessment;
  progress: ConnectorGrabProgress;
  storedSummary: ConnectorStoredSessionSummary;
  source: 'cache' | 'vendor' | 'cache+vendor';
}

export interface FiveMinuteValidationMismatch {
  time: number;
  field: 'open' | 'high' | 'low' | 'close' | 'volume' | 'vwap' | 'tradeCount';
  expected: number;
  actual: number;
}

export interface FiveMinuteValidationResult {
  comparedBars: number;
  mismatches: FiveMinuteValidationMismatch[];
}

function resolveRewriteStart(
  coverage: MinuteCoverageAssessment,
  includeTicks: boolean,
): number | null {
  if (!includeTicks) {
    return null;
  }

  return coverage.resumeRewriteTime;
}

function buildProgress(input: {
  symbol: string;
  sessionDate: string;
  intervalSeconds: number;
  includeTicks: boolean;
  includeQuotes: boolean;
  status: ConnectorGrabProgress['status'];
  cacheHit: boolean;
  cachedOrderFlowBars: number;
  orderFlowBars: OrderFlowBar[];
  marketBars: AggregatedMarketBar[];
  requestCount: number;
  lastObservedTime: number | null;
  tradeNextTime: number | null;
  quoteNextTime: number | null;
  complete: boolean;
  dirty: boolean;
  rawTicksFetchedCurrentRun: number;
  rawTradeTicksFetchedCurrentRun: number;
  rawQuoteTicksFetchedCurrentRun: number;
  message: string;
  coverage: MinuteCoverageAssessment;
}): ConnectorGrabProgress {
  const currentBar = input.orderFlowBars.length ? input.orderFlowBars[input.orderFlowBars.length - 1] : null;
  const completedMinutes =
    input.complete
      ? input.coverage.contiguousCoveredMinuteCount
      : Math.max(input.coverage.contiguousCoveredMinuteCount - (currentBar ? 1 : 0), 0);

  return {
    symbol: input.symbol,
    sessionDate: input.sessionDate,
    intervalSeconds: input.intervalSeconds,
    includeTicks: input.includeTicks,
    includeQuotes: input.includeQuotes,
    status: input.status,
    cacheHit: input.cacheHit,
    cachedOrderFlowBars: input.cachedOrderFlowBars,
    loadedOrderFlowBars: input.orderFlowBars.length,
    loadedMarketBars: input.marketBars.length,
    requestCount: input.requestCount,
    lastObservedTime: input.lastObservedTime,
    cursor: {
      tradeNextTime: input.tradeNextTime,
      quoteNextTime: input.quoteNextTime,
    },
    progressPct: sessionProgressPct(input.lastObservedTime),
    complete: input.complete,
    dirty: input.dirty,
    rawTicksFetchedCurrentRun: input.rawTicksFetchedCurrentRun,
    rawTradeTicksFetchedCurrentRun: input.rawTradeTicksFetchedCurrentRun,
    rawQuoteTicksFetchedCurrentRun: input.rawQuoteTicksFetchedCurrentRun,
    completedMinutes,
    currentMinutePriceLevels: input.complete ? 0 : currentBar?.levels.length ?? 0,
    message: input.message,
  };
}

function resolveCoverageOptions(instrument: InstrumentContext): MinuteCoverageOptions {
  return {
    priceTolerance:
      instrument.tickSize > 0 && Number.isFinite(instrument.tickSize)
        ? instrument.tickSize + 1e-9
        : 0.01,
    volumeTolerance: 0,
  };
}

function emitRuntimeStatus(
  options: CaptureHistoricalSessionOptions,
  status: Omit<ConnectorRuntimeStatus, 'symbol' | 'sessionDate'>,
): void {
  options.onRuntimeStatus?.({
    symbol: options.symbol,
    sessionDate: options.sessionDate,
    ...status,
  });
}

function summaryFromStored(stored: StoredAggregatedSessionData): ConnectorStoredSessionSummary {
  return stored.summary;
}

function toFiveMinuteComparableBar(bar: AggregatedMarketBar): {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  tradeCount?: number;
} {
  return {
    time: Number(bar.time),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    vwap: bar.vwap,
    tradeCount: bar.tradeCount,
  };
}

function compareFiveMinuteBars(
  derivedBars5m: AggregatedMarketBar[],
  vendorBars5m: AggregatedMarketBar[],
): FiveMinuteValidationResult {
  const comparableDerivedBars = derivedBars5m.map((bar) => toFiveMinuteComparableBar(bar));
  const vendorBarsByTime = new Map(
    vendorBars5m.map((bar) => {
      const comparable = toFiveMinuteComparableBar(bar);
      return [comparable.time, comparable];
    }),
  );
  const mismatches: FiveMinuteValidationMismatch[] = [];

  for (const bar of comparableDerivedBars) {
    const vendor = vendorBarsByTime.get(bar.time);
    if (!vendor) {
      mismatches.push({
        time: bar.time,
        field: 'open',
        expected: bar.open,
        actual: Number.NaN,
      });
      continue;
    }

    const comparisons: Array<FiveMinuteValidationMismatch['field']> = [
      'open',
      'high',
      'low',
      'close',
      'volume',
      'vwap',
      'tradeCount',
    ];

    for (const field of comparisons) {
      const expected = bar[field];
      const actual = vendor[field];
      if (typeof expected !== 'number' || typeof actual !== 'number') {
        continue;
      }

      const tolerance =
        field === 'vwap'
          ? 1e-3
          : field === 'tradeCount'
            ? 0
            : field === 'volume'
              ? 1e-6
              : 1e-6;

      if (Math.abs(expected - actual) > tolerance) {
        mismatches.push({
          time: bar.time,
          field,
          expected,
          actual,
        });
      }
    }
  }

  return {
    comparedBars: comparableDerivedBars.length,
    mismatches,
  };
}

export function formatCaptureProgress(progress: ConnectorGrabProgress): string {
  const percent = progress.progressPct == null ? 'n/a' : `${progress.progressPct.toFixed(2)}%`;
  return (
    `${progress.symbol} ${progress.sessionDate} ` +
    `${progress.status} ` +
    `cache=${progress.cacheHit ? 'yes' : 'no'} ` +
    `bars=${progress.loadedOrderFlowBars}/${progress.loadedMarketBars} ` +
    `completedMinutes=${progress.completedMinutes} ` +
    `rawTicks=${progress.rawTicksFetchedCurrentRun} ` +
    `currentLevels=${progress.currentMinutePriceLevels} ` +
    `requests=${progress.requestCount} ` +
    `progress=${percent}`
  );
}

export async function* captureHistoricalSession(
  options: CaptureHistoricalSessionOptions,
): AsyncGenerator<CaptureHistoricalSessionSnapshot> {
  const includeQuotes = options.includeQuotes !== false;
  emitRuntimeStatus(options, {
    phase: 'loading-cache',
    label: 'Loading cached aggregated session data.',
  });
  const stored = loadAggregatedSession(options.symbol, options.sessionDate, options.dataRoot);
  const cacheHit = stored.marketBars.length > 0 || stored.orderFlowBars.length > 0;
  const instrument = await options.session.getInstrumentContext(options.symbol);
  const coverageOptions = resolveCoverageOptions(instrument);
  const storedCoverage = assessMinuteCoverage(stored.marketBars, stored.orderFlowBars, coverageOptions);
  const completeForRequestedMode = options.includeTicks
    ? stored.summary.complete && stored.summary.footprintAvailable && storedCoverage.isComplete
    : stored.summary.complete && stored.marketBars.length > 0;

  if (cacheHit) {
    const cachedProgress = buildProgress({
      symbol: options.symbol,
      sessionDate: options.sessionDate,
      intervalSeconds: 60,
      includeTicks: options.includeTicks,
      includeQuotes,
      status: completeForRequestedMode ? 'completed' : 'loading-cache',
      cacheHit: true,
      cachedOrderFlowBars: stored.orderFlowBars.length,
      orderFlowBars: stored.orderFlowBars,
      marketBars: stored.marketBars,
      requestCount: 0,
      lastObservedTime: stored.summary.lastBarTime,
      tradeNextTime: completeForRequestedMode ? null : storedCoverage.resumeRewriteTime,
      quoteNextTime:
        completeForRequestedMode || storedCoverage.resumeRewriteTime == null
          ? null
          : Math.max(storedCoverage.resumeRewriteTime - 1, 0),
      complete: completeForRequestedMode,
      dirty: false,
      rawTicksFetchedCurrentRun: 0,
      rawTradeTicksFetchedCurrentRun: 0,
      rawQuoteTicksFetchedCurrentRun: 0,
      message: completeForRequestedMode
        ? 'Loaded a complete vendor cache session.'
        : options.includeTicks
          ? stored.summary.complete && stored.summary.footprintAvailable && !storedCoverage.isComplete
            ? 'Stored cache claims completion, but validated minute coverage is incomplete. Rebuilding from the earliest invalid minute.'
            : stored.summary.complete
              ? 'Loaded candle summaries. Refreshing from the vendor because footprint levels are missing.'
              : 'Loaded cached progress and preparing to resume from the trailing minute.'
          : 'Loaded cached candle summaries and preparing to refresh them from the vendor if needed.',
      coverage: storedCoverage,
    });

    yield {
      instrument,
      marketBars: stored.marketBars,
      orderFlowBars: stored.orderFlowBars,
      patches: [],
      coverage: storedCoverage,
      progress: cachedProgress,
      storedSummary: summaryFromStored(stored),
      source: 'cache',
    };

    if (completeForRequestedMode) {
      return;
    }
  }

  const needsVendorBars = options.includeTicks ? stored.marketBars.length === 0 : true;
  const marketBars = needsVendorBars
    ? await (async () => {
        emitRuntimeStatus(options, {
          phase: 'fetching-bars',
          requestKind: 'bars',
          label: 'Fetching vendor 1m bars.',
        });
        return options.session.fetchHistoricalBars({
          symbol: options.symbol,
          sessionDate: options.sessionDate,
          intervalSeconds: 60,
          abortSignal: options.abortSignal,
          onRuntimeStatus: options.onRuntimeStatus,
        } satisfies ConnectorHistoricalBarsRequest);
      })()
    : stored.marketBars;
  const marketCoverage = assessMinuteCoverage(marketBars, stored.orderFlowBars, coverageOptions);
  const rewriteStart = resolveRewriteStart(marketCoverage, options.includeTicks);
  const prefixOrderFlowBars =
    rewriteStart == null
      ? options.includeTicks && stored.summary.footprintAvailable
        ? []
        : stored.orderFlowBars.slice()
      : stored.orderFlowBars.filter((bar) => Number(bar.time) < rewriteStart);
  let mergedOrderFlowBars = prefixOrderFlowBars.slice();
  let rawTicksFetchedCurrentRun = 0;
  let rawTradeTicksFetchedCurrentRun = 0;
  let rawQuoteTicksFetchedCurrentRun = 0;
  let requestCount = 0;
  let lastObservedTime = mergedOrderFlowBars.length
    ? Number(mergedOrderFlowBars[mergedOrderFlowBars.length - 1].time)
    : options.includeTicks
      ? marketCoverage.lastCoveredTime
      : stored.summary.lastBarTime;

  if (!options.includeTicks) {
    const persisted = persistAggregatedSession({
      symbol: options.symbol,
      sessionDate: options.sessionDate,
      marketBars,
      orderFlowBars: stored.summary.footprintAvailable ? stored.orderFlowBars : [],
      complete: marketBars.length > 0,
      includeTicks: stored.summary.footprintAvailable,
      dataRoot: options.dataRoot,
      instrument,
      vendorId: options.vendorId,
    });
    const progress = buildProgress({
      symbol: options.symbol,
      sessionDate: options.sessionDate,
      intervalSeconds: 60,
      includeTicks: false,
      includeQuotes,
      status: 'completed',
      cacheHit,
      cachedOrderFlowBars: stored.orderFlowBars.length,
      orderFlowBars: persisted.orderFlowBars,
      marketBars: persisted.marketBars,
      requestCount: 1,
      lastObservedTime: persisted.summary.lastBarTime,
      tradeNextTime: null,
      quoteNextTime: null,
      complete: true,
      dirty: false,
      rawTicksFetchedCurrentRun: 0,
      rawTradeTicksFetchedCurrentRun: 0,
      rawQuoteTicksFetchedCurrentRun: 0,
      message: 'Stored 1m candle summaries without footprint-capable levels.',
      coverage: assessMinuteCoverage(
        persisted.marketBars,
        persisted.orderFlowBars,
        coverageOptions,
      ),
    });

    yield {
      instrument,
      marketBars: persisted.marketBars,
      orderFlowBars: persisted.orderFlowBars,
      patches: [],
      coverage: assessMinuteCoverage(persisted.marketBars, persisted.orderFlowBars, coverageOptions),
      progress,
      storedSummary: summaryFromStored(persisted),
      source: cacheHit ? 'cache+vendor' : 'vendor',
    };
    return;
  }

  const controller = createOrderFlowTickStreamController({
    instrument,
    intervalSeconds: 60,
  });
  const startTradeTime = rewriteStart;
  const startQuoteTime = rewriteStart == null ? null : Math.max(rewriteStart - 1, 0);

  for await (const chunk of options.session.streamHistoricalTicks({
    symbol: options.symbol,
    sessionDate: options.sessionDate,
    intervalSeconds: 60,
    includeTicks: true,
    includeQuotes,
    startTradeTime,
    startQuoteTime,
    maxRequests: options.maxRequests,
    abortSignal: options.abortSignal,
    onRuntimeStatus: options.onRuntimeStatus,
  })) {
    const result = controller.push(chunk.update);
    const tradeCount = chunk.update.trades?.length ?? 0;
    const quoteCount = chunk.update.quotes?.length ?? 0;
    rawTicksFetchedCurrentRun += tradeCount + quoteCount;
    rawTradeTicksFetchedCurrentRun += tradeCount;
    rawQuoteTicksFetchedCurrentRun += quoteCount;
    requestCount = chunk.requestCount;
    lastObservedTime = chunk.lastTradeTime ?? chunk.lastQuoteTime ?? lastObservedTime;

    for (const patch of result.patches) {
      mergedOrderFlowBars = applyOrderFlowPatch(mergedOrderFlowBars, patch);
    }

    const mergedCoverage = assessMinuteCoverage(marketBars, mergedOrderFlowBars, coverageOptions);
    const captureComplete = chunk.complete && mergedCoverage.isComplete;

    const persisted =
      options.persistEachChunk === false
        ? {
            marketBars,
            orderFlowBars: mergedOrderFlowBars,
            summary: {
              symbol: options.symbol,
              sessionDate: options.sessionDate,
              marketBarsLoaded: marketBars.length,
              orderFlowBarsLoaded: mergedOrderFlowBars.length,
              lastBarTime:
                mergedOrderFlowBars.length > 0
                  ? Number(mergedOrderFlowBars[mergedOrderFlowBars.length - 1].time)
                  : null,
              footprintAvailable: mergedOrderFlowBars.length > 0,
              complete: captureComplete,
              manifest: stored.summary.manifest,
            },
            sessionDirectory: stored.sessionDirectory,
          }
        : persistAggregatedSession({
            symbol: options.symbol,
            sessionDate: options.sessionDate,
            marketBars,
            orderFlowBars: mergedOrderFlowBars,
            complete: captureComplete,
            includeTicks: true,
            dataRoot: options.dataRoot,
            instrument,
            vendorId: options.vendorId,
            lastCompleteBarTime: mergedCoverage.lastCoveredTime,
          });

    emitRuntimeStatus(options, {
      phase: 'persisting',
      label: captureComplete
        ? 'Persisting final aggregated minute data.'
        : 'Persisting partial aggregated minute data so the run can resume safely.',
    });
    const progress = buildProgress({
      symbol: options.symbol,
      sessionDate: options.sessionDate,
      intervalSeconds: 60,
      includeTicks: true,
      includeQuotes,
      status: captureComplete ? 'completed' : 'loading-vendor',
      cacheHit,
      cachedOrderFlowBars: stored.orderFlowBars.length,
      orderFlowBars: mergedOrderFlowBars,
      marketBars,
      requestCount,
      lastObservedTime,
      tradeNextTime: chunk.tradeNextTime,
      quoteNextTime: chunk.quoteNextTime,
      complete: captureComplete,
      dirty: !captureComplete,
      rawTicksFetchedCurrentRun,
      rawTradeTicksFetchedCurrentRun,
      rawQuoteTicksFetchedCurrentRun,
      message: captureComplete
        ? 'Vendor retrieval completed and the aggregated session cache is current.'
        : chunk.complete
          ? 'Vendor retrieval reached the end of the session, but footprint coverage is still incomplete. The next run will resume from the earliest missing minute.'
          : chunk.update.trades?.length
            ? 'Reading trade ticks and building minute order-flow coverage.'
            : 'Reading quote ticks to support aggressor-side classification.',
      coverage: mergedCoverage,
    });

    yield {
      instrument,
      marketBars,
      orderFlowBars: mergedOrderFlowBars,
      patches: result.patches,
      coverage: mergedCoverage,
      progress,
      storedSummary: persisted.summary,
      source: cacheHit ? 'cache+vendor' : 'vendor',
    };
  }
}

export async function validateDerivedFiveMinuteBars(
  session: MarketDataConnectorSession,
  symbol: string,
  sessionDate: string,
  orderFlowBars1m: OrderFlowBar[],
): Promise<FiveMinuteValidationResult> {
  const derivedOrderFlowBars5m = aggregateOrderFlowBarsByInterval(orderFlowBars1m, 300);
  const derivedMarketBars5m = buildAggregatedMarketBarsFromOrderFlowBars(derivedOrderFlowBars5m);
  const vendorBars5m = await session.fetchHistoricalBars({
    symbol,
    sessionDate,
    intervalSeconds: 300,
  });

  return compareFiveMinuteBars(derivedMarketBars5m, vendorBars5m);
}

export async function validateDerivedFiveMinuteBarsFromMarketBars(
  session: MarketDataConnectorSession,
  symbol: string,
  sessionDate: string,
  marketBars1m: AggregatedMarketBar[],
): Promise<FiveMinuteValidationResult> {
  const derivedMarketBars5m = aggregateMarketBarsByInterval(marketBars1m, 300);
  const vendorBars5m = await session.fetchHistoricalBars({
    symbol,
    sessionDate,
    intervalSeconds: 300,
  });

  return compareFiveMinuteBars(derivedMarketBars5m, vendorBars5m);
}
