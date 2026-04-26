import type { OrderFlowTickStreamUpdate, QuoteTick, TradeTick } from 'lightweight-orderflow-charts';

export const STREAM_BAR_DURATION_MS = 10_000;
export const STREAM_STEP_INTERVAL_MS = 250;

interface TickReplayFrameConfig {
  trades: TradeTick[];
  quotes: QuoteTick[];
  intervalSeconds: number;
}

type TickReplayEvent =
  | {
      kind: 'trade';
      tick: TradeTick;
    }
  | {
      kind: 'quote';
      tick: QuoteTick;
    };

function bucketTime(unixSeconds: number, intervalSeconds: number): number {
  return Math.floor(unixSeconds / intervalSeconds) * intervalSeconds;
}

function buildSortedEvents(trades: TradeTick[], quotes: QuoteTick[]): TickReplayEvent[] {
  return [
    ...quotes.map((tick) => ({ kind: 'quote' as const, tick })),
    ...trades.map((tick) => ({ kind: 'trade' as const, tick })),
  ].sort((left, right) => {
    if (left.tick.time !== right.tick.time) {
      return left.tick.time - right.tick.time;
    }

    if (left.kind === right.kind) {
      return 0;
    }

    return left.kind === 'quote' ? -1 : 1;
  });
}

export function buildTickReplayFrames(config: TickReplayFrameConfig): OrderFlowTickStreamUpdate[] {
  const frameCountPerBar = Math.max(
    1,
    Math.floor(STREAM_BAR_DURATION_MS / STREAM_STEP_INTERVAL_MS),
  );
  const events = buildSortedEvents(config.trades, config.quotes);

  if (!events.length) {
    return [];
  }

  const barBuckets = Array.from(
    new Set(
      config.trades
        .map((tick) => bucketTime(tick.time, config.intervalSeconds))
        .sort((left, right) => left - right),
    ),
  );

  const barOffsets = new Map<number, number>();
  barBuckets.forEach((bucket, index) => {
    barOffsets.set(bucket, index * frameCountPerBar);
  });

  const totalFrameCount = barBuckets.length * frameCountPerBar;
  const frames = Array.from({ length: totalFrameCount }, () => ({}) as OrderFlowTickStreamUpdate);

  for (const event of events) {
    const tickTime = event.tick.time;
    const barBucket = bucketTime(tickTime, config.intervalSeconds);
    const baseOffset = barOffsets.get(barBucket);

    if (baseOffset === undefined) {
      continue;
    }

    const relativeSeconds = Math.max(0, tickTime - barBucket);
    const frameOffset = Math.min(
      frameCountPerBar - 1,
      Math.floor((relativeSeconds / Math.max(config.intervalSeconds, 1)) * frameCountPerBar),
    );
    const frame = frames[baseOffset + frameOffset];

    if (event.kind === 'trade') {
      frame.trades = [...(frame.trades ?? []), event.tick];
    } else {
      frame.quotes = [...(frame.quotes ?? []), event.tick];
    }
  }

  return frames;
}
