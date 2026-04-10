import { describe, expect, it } from 'vitest';

import type { OrderFlowBar } from '../../src';
import { buildReplayBar, buildReplayPatch, STREAM_STEPS_PER_BAR } from '../../demo/src/lib/orderFlowReplay';

const sourceBar: OrderFlowBar = {
  time: 1712052000,
  open: 100,
  high: 102,
  low: 99,
  close: 101,
  totalVolume: 600,
  delta: 120,
  levels: [
    { price: 99, bidVolume: 90, askVolume: 30, totalVolume: 120, delta: -60 },
    { price: 100, bidVolume: 70, askVolume: 50, totalVolume: 120, delta: -20 },
    { price: 101, bidVolume: 40, askVolume: 120, totalVolume: 160, delta: 80 },
    { price: 102, bidVolume: 30, askVolume: 170, totalVolume: 200, delta: 140 },
  ],
};

describe('orderFlowReplay', () => {
  it('builds a partial bar around the opening level', () => {
    const replayBar = buildReplayBar(sourceBar, 0.4);

    expect(replayBar.time).toBe(sourceBar.time);
    expect(replayBar.levels.length).toBeGreaterThanOrEqual(1);
    expect(replayBar.levels.length).toBeLessThan(sourceBar.levels.length);
    expect(replayBar.totalVolume).toBeLessThan(sourceBar.totalVolume ?? Number.POSITIVE_INFINITY);
    expect(replayBar.high).toBeGreaterThanOrEqual(Math.min(sourceBar.open, replayBar.close));
    expect(replayBar.low).toBeLessThanOrEqual(Math.max(sourceBar.open, replayBar.close));
    expect(replayBar.metadata).toMatchObject({
      replayProgress: 0.4,
    });
  });

  it('emits append then upsert patches as replay advances', () => {
    const firstPatch = buildReplayPatch(sourceBar, 0, STREAM_STEPS_PER_BAR);
    const laterPatch = buildReplayPatch(sourceBar, STREAM_STEPS_PER_BAR - 1, STREAM_STEPS_PER_BAR);

    expect(firstPatch.operation).toBe('append');
    expect(laterPatch.operation).toBe('upsert');
    expect(firstPatch.bars?.[0].levels.length).toBeLessThan(laterPatch.bars?.[0].levels.length ?? 0);
    expect(laterPatch.bars?.[0].metadata).toMatchObject({
      replayProgress: 1,
    });
  });
});
