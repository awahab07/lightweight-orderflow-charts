import path from 'node:path';

import type { AggregatedMarketBar } from 'lightweight-orderflow-charts';

import { IBKR_TWS_CONNECTOR } from './ibkrConnector';
import {
  captureHistoricalSession,
  type CaptureHistoricalSessionSnapshot,
  validateDerivedFiveMinuteBars,
  validateDerivedFiveMinuteBarsFromMarketBars,
} from './captureHistoricalSession';
import { CaptureProgressReporter } from './progressReporter';
import { resolveVendorCacheRoot } from '../../storage/aggregatedMarketDataStore';

interface CliOptions {
  host: string;
  port: number;
  clientId?: number;
  symbols: string[];
  dates: string[];
  includeTicks: boolean;
  includeQuotes: boolean;
  dataRoot: string;
  maxRequests?: number;
  validate5m: boolean;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`IBKR historical market-data capture

Usage:
  npm run connector:ibkr:capture -- --symbol TSLA --date 2026-03-10
  npm run connector:ibkr:capture -- --symbols TSLA,NVDA --from-date 2026-03-02 --to-date 2026-03-10

Options:
  --host <value>           IBKR TWS or Gateway host. Default: 127.0.0.1
  --port <value>           IBKR TWS or Gateway API port. Default: 7497
  --client-id <value>      Optional fixed IBKR API client id. Default: auto-allocate
  --symbol <value>         Single symbol to capture.
  --symbols <list>         Comma-separated symbol list.
  --date <value>           Single session date in YYYY-MM-DD.
  --dates <list>           Comma-separated session dates.
  --from-date <value>      Inclusive session start date in YYYY-MM-DD.
  --to-date <value>        Inclusive session end date in YYYY-MM-DD.
  --data-root <path>       Output root. Default: connectors/vendors/ibkr/data
  --no-ticks               Store only 1m candle summaries.
  --no-quotes              Skip BID_ASK requests while capturing ticks.
  --max-requests <value>   Stop each session after the provided request count.
  --validate-5m            Compare derived 5m bars against IBKR 5m TRADES bars after capture.
  --help                   Show this help text.

Behavior:
  - Capture writes broker-neutral 1m files and a session manifest.
  - Resume rewrites the trailing stored minute before continuing.
  - If an older session was captured without footprint levels, a later tick-enabled run re-grabs it.
`);
}

function assertDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  return value;
}

function enumerateDates(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);

  while (current <= end) {
    const weekday = current.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatSessionTime(value: number | null | undefined, timezone: string): string {
  if (value == null || !Number.isFinite(value)) {
    return '--:--:--';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value * 1000));
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const EMPTY_COVERAGE = {
  requiredMinuteCount: 0,
  coveredMinuteCount: 0,
  contiguousCoveredMinuteCount: 0,
  coverageRatio: 0,
  firstRequiredTime: null,
  lastRequiredTime: null,
  firstCoveredTime: null,
  lastCoveredTime: null,
  resumeRewriteTime: null,
  isComplete: false,
} as const;

function buildFinalStatsBlock(params: {
  symbol: string;
  sessionDate: string;
  snapshot: CaptureHistoricalSessionSnapshot | null;
  startedAt: number;
  outputDirectory: string;
  result: 'complete' | 'partial' | 'interrupted' | 'error';
  note: string;
}): string {
  const coverage = params.snapshot?.coverage ?? EMPTY_COVERAGE;
  const progress = params.snapshot?.progress;
  const timezone = params.snapshot?.instrument.timezone || 'America/New_York';
  const stableCompletedMinutes =
    params.snapshot == null || progress == null
      ? 0
      : progress.complete
        ? coverage.contiguousCoveredMinuteCount
        : Math.max(
            coverage.contiguousCoveredMinuteCount - (params.snapshot.orderFlowBars.length > 0 ? 1 : 0),
            0,
          );
  const resultLabel =
    params.result === 'complete'
      ? 'complete'
      : params.result === 'partial'
        ? 'partial'
        : params.result === 'interrupted'
          ? 'interrupted / partial'
          : 'error';

  return [
    `[${params.result}] ${params.symbol} ${params.sessionDate}`,
    `Run result: ${resultLabel}`,
    `Note: ${params.note}`,
    `Elapsed: ${formatElapsed(Date.now() - params.startedAt)} | Requests issued: ${progress?.requestCount ?? 0} | Trade ticks fetched: ${formatCount(progress?.rawTradeTicksFetchedCurrentRun ?? 0)} | Quote ticks fetched: ${formatCount(progress?.rawQuoteTicksFetchedCurrentRun ?? 0)}`,
    `Validated footprint minutes: ${coverage.coveredMinuteCount}/${coverage.requiredMinuteCount} | Contiguous from open: ${coverage.contiguousCoveredMinuteCount}/${coverage.requiredMinuteCount} | Stable completed minutes: ${stableCompletedMinutes}`,
    `Last observed time: ${formatSessionTime(progress?.lastObservedTime ?? null, timezone)} | Next trade cursor: ${formatSessionTime(progress?.cursor.tradeNextTime ?? null, timezone)} | Next quote cursor: ${formatSessionTime(progress?.cursor.quoteNextTime ?? null, timezone)}`,
    `Cache directory: ${params.outputDirectory}`,
  ].join('\n');
}

function parseArgs(argv: string[]): CliOptions | null {
  const defaults: CliOptions = {
    host: '127.0.0.1',
    port: 7497,
    clientId: undefined,
    symbols: [],
    dates: [],
    includeTicks: true,
    includeQuotes: true,
    dataRoot: resolveVendorCacheRoot('ibkr'),
    validate5m: false,
  };

  let fromDate: string | null = null;
  let toDate: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case '--help':
        printHelp();
        return null;
      case '--host':
        defaults.host = String(next || '').trim();
        index += 1;
        break;
      case '--port':
        defaults.port = Number(next);
        index += 1;
        break;
      case '--symbol':
        defaults.symbols.push(String(next || '').trim().toUpperCase());
        index += 1;
        break;
      case '--client-id':
        defaults.clientId = Number(next);
        index += 1;
        break;
      case '--symbols':
        defaults.symbols.push(
          ...String(next || '')
            .split(',')
            .map((value) => value.trim().toUpperCase()),
        );
        index += 1;
        break;
      case '--date':
        defaults.dates.push(assertDate(String(next || '').trim(), '--date'));
        index += 1;
        break;
      case '--dates':
        defaults.dates.push(
          ...String(next || '')
            .split(',')
            .map((value) => assertDate(value.trim(), '--dates')),
        );
        index += 1;
        break;
      case '--from-date':
        fromDate = assertDate(String(next || '').trim(), '--from-date');
        index += 1;
        break;
      case '--to-date':
        toDate = assertDate(String(next || '').trim(), '--to-date');
        index += 1;
        break;
      case '--data-root':
        defaults.dataRoot = path.resolve(String(next || '').trim());
        index += 1;
        break;
      case '--no-ticks':
        defaults.includeTicks = false;
        break;
      case '--no-quotes':
        defaults.includeQuotes = false;
        break;
      case '--max-requests':
        defaults.maxRequests = Number(next);
        index += 1;
        break;
      case '--validate-5m':
        defaults.validate5m = true;
        break;
      default:
        throw new Error(`Unknown argument '${arg}'. Use --help for usage.`);
    }
  }

  if (fromDate || toDate) {
    if (!fromDate || !toDate) {
      throw new Error('--from-date and --to-date must be provided together.');
    }
    defaults.dates.push(...enumerateDates(fromDate, toDate));
  }

  defaults.symbols = unique(defaults.symbols);
  defaults.dates = unique(defaults.dates);

  if (!defaults.symbols.length) {
    throw new Error('At least one symbol is required. Use --symbol or --symbols.');
  }

  if (!defaults.dates.length) {
    throw new Error('At least one session date is required. Use --date, --dates, or a date range.');
  }

  if (!Number.isFinite(defaults.port) || defaults.port <= 0) {
    throw new Error('A valid --port value is required.');
  }

  if (
    defaults.clientId != null &&
    (!Number.isFinite(defaults.clientId) || defaults.clientId < 0 || !Number.isInteger(defaults.clientId))
  ) {
    throw new Error('A valid non-negative integer --client-id value is required.');
  }

  return defaults;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }

  const config = IBKR_TWS_CONNECTOR.sanitizeConfig({
    host: options.host,
    port: options.port,
    ...(options.clientId != null ? { clientId: options.clientId } : {}),
  });
  const session = await IBKR_TWS_CONNECTOR.connect(config);
  const abortController = new AbortController();
  let activeReporter: CaptureProgressReporter | null = null;
  let activeTarget: { symbol: string; sessionDate: string } | null = null;
  let signalHandled = false;
  const handleSignal = (signalName: NodeJS.Signals) => {
    if (signalHandled) {
      return;
    }

    signalHandled = true;
    process.exitCode = 130;
    activeReporter?.updateRuntime({
      symbol: activeTarget?.symbol ?? 'capture',
      sessionDate: activeTarget?.sessionDate ?? 'pending',
      phase: 'interrupted',
      label: `${signalName} received. Closing the IBKR connection and preserving the partial cache.`,
    });
    abortController.abort(`${signalName} received. Capture interrupted by user.`);
    void session.disconnect().catch(() => {
      // Ignore disconnect races during shutdown.
    });
  };
  const onSigint = () => handleSignal('SIGINT');
  const onSigterm = () => handleSignal('SIGTERM');

  process.once('SIGINT', onSigint);
  process.once('SIGTERM', onSigterm);

  try {
    outer: for (const symbol of options.symbols) {
      for (const sessionDate of options.dates) {
        if (abortController.signal.aborted) {
          break outer;
        }

        const reporter = new CaptureProgressReporter();
        const outputDirectory = path.join(options.dataRoot, symbol.toLowerCase(), sessionDate);
        const startedAt = Date.now();
        let latestSnapshot: CaptureHistoricalSessionSnapshot | null = null;
        let lastOrderFlowBars = [] as Parameters<typeof validateDerivedFiveMinuteBars>[3];
        let lastMarketBars: AggregatedMarketBar[] = [];
        activeReporter = reporter;
        activeTarget = { symbol, sessionDate };

        try {
          for await (const snapshot of captureHistoricalSession({
            session,
            symbol,
            sessionDate,
            dataRoot: options.dataRoot,
            includeTicks: options.includeTicks,
            includeQuotes: options.includeQuotes,
            maxRequests: options.maxRequests,
            vendorId: 'ibkr',
            abortSignal: abortController.signal,
            onRuntimeStatus: (status) => {
              reporter.updateRuntime(status);
            },
          })) {
            latestSnapshot = snapshot;
            lastOrderFlowBars = snapshot.orderFlowBars;
            lastMarketBars = snapshot.marketBars;
            reporter.update(snapshot);
          }
        } catch (error) {
          if (isAbortError(error) || abortController.signal.aborted) {
            reporter.finish(
              buildFinalStatsBlock({
                symbol,
                sessionDate,
                snapshot: latestSnapshot,
                startedAt,
                outputDirectory,
                result: 'interrupted',
                note: 'Interrupted by user. The current cache state was kept so the next run can resume.',
              }),
            );
            break outer;
          }

          const message = error instanceof Error ? error.message : String(error);
          reporter.finish(
            buildFinalStatsBlock({
              symbol,
              sessionDate,
              snapshot: latestSnapshot,
              startedAt,
              outputDirectory,
              result: 'error',
              note: message,
            }),
          );
          throw error;
        } finally {
          activeReporter = null;
          activeTarget = null;
        }

        reporter.finish(
          buildFinalStatsBlock({
            symbol,
            sessionDate,
            snapshot: latestSnapshot,
            startedAt,
            outputDirectory,
            result: latestSnapshot?.progress.complete ? 'complete' : 'partial',
            note:
              latestSnapshot?.progress.message ||
              'Capture ended without emitting any progress snapshots.',
          }),
        );

        if (abortController.signal.aborted) {
          break outer;
        }

        if (options.validate5m && lastOrderFlowBars.length > 0) {
          const validation = await validateDerivedFiveMinuteBars(
            session,
            symbol,
            sessionDate,
            lastOrderFlowBars,
          );

          if (validation.mismatches.length === 0) {
            // eslint-disable-next-line no-console
            console.log(`${symbol} ${sessionDate} derived 5m bars match IBKR 5m TRADES bars.`);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `${symbol} ${sessionDate} 5m validation found ${validation.mismatches.length} mismatch(es).`,
            );
            for (const mismatch of validation.mismatches.slice(0, 10)) {
              // eslint-disable-next-line no-console
              console.warn(
                `  ${mismatch.time} ${mismatch.field}: expected=${mismatch.expected} actual=${mismatch.actual}`,
              );
            }
          }
        } else if (options.validate5m && lastMarketBars.length > 0) {
          const validation = await validateDerivedFiveMinuteBarsFromMarketBars(
            session,
            symbol,
            sessionDate,
            lastMarketBars,
          );

          if (validation.mismatches.length === 0) {
            // eslint-disable-next-line no-console
            console.log(`${symbol} ${sessionDate} derived 5m bars match IBKR 5m TRADES bars.`);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              `${symbol} ${sessionDate} 5m validation found ${validation.mismatches.length} mismatch(es).`,
            );
            for (const mismatch of validation.mismatches.slice(0, 10)) {
              // eslint-disable-next-line no-console
              console.warn(
                `  ${mismatch.time} ${mismatch.field}: expected=${mismatch.expected} actual=${mismatch.actual}`,
              );
            }
          }
        }
      }
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    process.removeListener('SIGTERM', onSigterm);
    await session.disconnect().catch(() => {
      // Ignore disconnect races during shutdown.
    });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(message);
  process.exitCode = 1;
});
