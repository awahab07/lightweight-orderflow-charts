import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

import type { AggregatedMarketBar, InstrumentContext } from 'lightweight-orderflow-charts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MarketDataConnectorSession } from '../../connectors/core/contracts';
import { persistAggregatedSession } from '../../connectors/storage/aggregatedMarketDataStore';
import { captureHistoricalSession } from '../../connectors/vendors/ibkr/captureHistoricalSession';

describe('captureHistoricalSession', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    while (tempDirectories.length > 0) {
      rmSync(tempDirectories.pop()!, { recursive: true, force: true });
    }
  });

  it('reuses a complete bar-only cache without re-fetching vendor bars', async () => {
    const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'capture-historical-session-'));
    tempDirectories.push(dataRoot);

    const instrument: InstrumentContext = {
      instrumentId: 'TSLA-STK-POLYGON',
      symbol: 'TSLA',
      tickSize: 0.01,
      pricePrecision: 2,
      timezone: 'America/New_York',
      volumePrecision: 0,
    };
    const marketBars: AggregatedMarketBar[] = [
      {
        time: 1_772_819_400 as AggregatedMarketBar['time'],
        open: 250,
        high: 251,
        low: 249.75,
        close: 250.5,
        volume: 10_000,
        vwap: 250.42,
        tradeCount: 120,
      },
      {
        time: 1_772_819_460 as AggregatedMarketBar['time'],
        open: 250.5,
        high: 251.2,
        low: 250.2,
        close: 251,
        volume: 9_500,
        vwap: 250.88,
        tradeCount: 118,
      },
    ];

    persistAggregatedSession({
      symbol: 'TSLA',
      sessionDate: '2026-03-02',
      marketBars,
      orderFlowBars: [],
      complete: true,
      includeTicks: false,
      dataRoot,
      instrument,
      vendorId: 'polygon-rest',
    });

    const fetchHistoricalBars = vi.fn<MarketDataConnectorSession['fetchHistoricalBars']>();
    const session: MarketDataConnectorSession = {
      getInstrumentContext: vi.fn(async () => instrument),
      fetchHistoricalBars,
      async *streamHistoricalTicks() {
        throw new Error('streamHistoricalTicks should not be called for bar-only cache reuse.');
      },
      async disconnect() {
        // No-op for test session.
      },
    };

    const snapshots = [];
    for await (const snapshot of captureHistoricalSession({
      session,
      symbol: 'TSLA',
      sessionDate: '2026-03-02',
      dataRoot,
      includeTicks: false,
      includeQuotes: false,
      vendorId: 'polygon-rest',
    })) {
      snapshots.push(snapshot);
    }

    expect(fetchHistoricalBars).not.toHaveBeenCalled();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.source).toBe('cache');
    expect(snapshots[0]?.progress.complete).toBe(true);
    expect(snapshots[0]?.marketBars).toEqual(marketBars);
  });
});
