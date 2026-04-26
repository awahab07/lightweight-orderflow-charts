import { createLogUpdate } from 'log-update';

import type { ConnectorRuntimeStatus } from '../../core/contracts';
import type { CaptureHistoricalSessionSnapshot } from './captureHistoricalSession';

const FRAMES = ['-', '\\', '|', '/'] as const;
const RENDER_INTERVAL_MS = 125;
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

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function formatRemaining(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) {
    return 'n/a';
  }

  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPercent(value: number | null): string {
  return value == null ? 'n/a' : `${value.toFixed(2)}%`;
}

function formatSessionTime(value: number | null, timezone: string): string {
  if (value == null || !Number.isFinite(value)) {
    return '--:--:--';
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value * 1000));
}

function formatSource(source: CaptureHistoricalSessionSnapshot['source'] | null): string {
  if (source === 'cache+vendor') {
    return 'Cache + vendor';
  }

  if (source === 'cache') {
    return 'Cache';
  }

  if (source === 'vendor') {
    return 'Vendor';
  }

  return 'n/a';
}

function formatHeadline(
  snapshot: CaptureHistoricalSessionSnapshot | null,
  runtimeStatus: ConnectorRuntimeStatus | null,
): string {
  if (runtimeStatus?.phase === 'waiting-pacing') {
    return 'Waiting for vendor rate-limit window';
  }

  if (runtimeStatus?.phase === 'awaiting-response') {
    return 'Waiting for vendor response';
  }

  if (runtimeStatus?.phase === 'fetching-trades') {
    return 'Fetching trade ticks and building order flow';
  }

  if (runtimeStatus?.phase === 'fetching-quotes') {
    return 'Fetching quote ticks for aggressor classification';
  }

  if (runtimeStatus?.phase === 'fetching-bars') {
    return 'Fetching vendor 1m bars';
  }

  if (runtimeStatus?.phase === 'persisting') {
    return 'Persisting aggregated session data';
  }

  if (runtimeStatus?.phase === 'interrupted') {
    return 'Interrupt received';
  }

  if (snapshot?.progress.complete) {
    return 'Capture complete';
  }

  if (snapshot?.progress.status === 'loading-cache') {
    return 'Scanning existing cache';
  }

  return 'Running capture';
}

function formatCurrentStep(
  snapshot: CaptureHistoricalSessionSnapshot | null,
  runtimeStatus: ConnectorRuntimeStatus | null,
): string {
  if (runtimeStatus?.phase === 'waiting-pacing') {
    const countdown = formatRemaining(runtimeStatus.waitRemainingMs);
    return `${runtimeStatus.label} Next request in ${countdown}.`;
  }

  if (runtimeStatus?.phase === 'awaiting-response') {
    return `${runtimeStatus.label} Timeout in ${formatRemaining(runtimeStatus.responseRemainingMs)}.`;
  }

  if (runtimeStatus?.label) {
    return runtimeStatus.label;
  }

  return snapshot?.progress.message || 'Working.';
}

function renderSnapshot(
  snapshot: CaptureHistoricalSessionSnapshot | null,
  runtimeStatus: ConnectorRuntimeStatus | null,
  frameIndex: number,
  startedAt: number,
): string {
  const frame = FRAMES[frameIndex % FRAMES.length];
  const symbol = snapshot?.progress.symbol ?? runtimeStatus?.symbol ?? '--';
  const sessionDate = snapshot?.progress.sessionDate ?? runtimeStatus?.sessionDate ?? '--';
  const timezone = snapshot?.instrument.timezone || 'America/New_York';
  const coverage = snapshot?.coverage ?? EMPTY_COVERAGE;
  const progress = snapshot?.progress;
  const footprintEnabled = progress?.includeTicks !== false;
  const completedMinutes =
    snapshot == null || progress == null
      ? 0
      : progress.complete
        ? coverage.contiguousCoveredMinuteCount
        : Math.max(
            coverage.contiguousCoveredMinuteCount - (snapshot.orderFlowBars.length > 0 ? 1 : 0),
            0,
          );

  return [
    `${frame} ${symbol} ${sessionDate} | ${formatHeadline(snapshot, runtimeStatus)}`,
    `Current step: ${formatCurrentStep(snapshot, runtimeStatus)}`,
    `Source: ${formatSource(snapshot?.source ?? null)} | Requests issued: ${progress?.requestCount ?? 0} | Trade ticks fetched: ${formatCount(progress?.rawTradeTicksFetchedCurrentRun ?? 0)} | Quote ticks fetched: ${formatCount(progress?.rawQuoteTicksFetchedCurrentRun ?? 0)} | Elapsed: ${formatElapsed(Date.now() - startedAt)}`,
    footprintEnabled
      ? `Footprint minutes covered: ${coverage.coveredMinuteCount}/${coverage.requiredMinuteCount} | Contiguous from open: ${coverage.contiguousCoveredMinuteCount}/${coverage.requiredMinuteCount} | Stable completed minutes: ${completedMinutes} | Price levels in active minute: ${
          progress?.complete ? 0 : (progress?.currentMinutePriceLevels ?? 0)
        }`
      : `Market bars loaded: ${progress?.loadedMarketBars ?? 0} | Footprint capture: unavailable or disabled for this run | Cached order-flow bars: ${progress?.loadedOrderFlowBars ?? 0}`,
    footprintEnabled
      ? `Coverage: ${formatPercent(coverage.coverageRatio * 100)} | Session clock progress: ${formatPercent(progress?.progressPct ?? null)} | Last observed time: ${formatSessionTime(progress?.lastObservedTime ?? null, timezone)} | Next trade cursor: ${formatSessionTime(progress?.cursor.tradeNextTime ?? null, timezone)} | Next quote cursor: ${formatSessionTime(progress?.cursor.quoteNextTime ?? null, timezone)}`
      : `Session clock progress: ${formatPercent(progress?.progressPct ?? null)} | Last observed time: ${formatSessionTime(progress?.lastObservedTime ?? null, timezone)} | Next trade cursor: --:--:-- | Next quote cursor: --:--:--`,
  ].join('\n');
}

export class CaptureProgressReporter {
  private readonly log = createLogUpdate(process.stdout, {
    showCursor: true,
  });

  private readonly startedAt = Date.now();
  private frameIndex = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private latestSnapshot: CaptureHistoricalSessionSnapshot | null = null;
  private latestRuntimeStatus: ConnectorRuntimeStatus | null = null;

  update(snapshot: CaptureHistoricalSessionSnapshot): void {
    this.latestSnapshot = snapshot;
    this.latestRuntimeStatus = null;
    this.ensureRunning();
    this.render();
  }

  updateRuntime(status: ConnectorRuntimeStatus): void {
    this.latestRuntimeStatus = status;
    this.ensureRunning();
    this.render();
  }

  finish(finalText?: string): void {
    this.stopTicker();
    if (this.latestSnapshot) {
      this.log.clear();
    }
    if (finalText) {
      // `persist` keeps the final line in scrollback without duplicating the animated ticker.
      this.log.persist(finalText);
    }
  }

  clear(): void {
    this.stopTicker();
    this.log.clear();
  }

  private ensureRunning(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      this.render();
    }, RENDER_INTERVAL_MS);
  }

  private stopTicker(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private render(): void {
    if (!this.latestSnapshot && !this.latestRuntimeStatus) {
      return;
    }

    this.log(
      renderSnapshot(
        this.latestSnapshot,
        this.latestRuntimeStatus,
        this.frameIndex,
        this.startedAt,
      ),
    );
  }
}
