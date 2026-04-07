import { describe, expect, it } from 'vitest';

import {
  applyOrderFlowPatch,
  buildSessionProfiles,
  computeVwapSeriesData,
  deriveFootprintMetrics,
  normalizeOrderFlowBatch,
  type TimeValue,
} from 'lightweight-orderflow-charts';
import { demoOrderFlowBatch } from '../../demo/src/fixtures/orderFlow';
import { demoPatches } from '../../demo/src/fixtures/mockStream';
import { buildDeltaSummaryColumns } from '../../src/calculations/footprint/buildDeltaSummaryColumns';
import { buildFootprintBarModel } from '../../src/calculations/footprint/buildFootprintBarModel';
import { DEFAULT_FOOTPRINT_SERIES_OPTIONS } from '../../src/models/options';

describe('order-flow calculations', () => {
  it('derives imbalance metrics', () => {
    const normalized = normalizeOrderFlowBatch(demoOrderFlowBatch);
    const metrics = deriveFootprintMetrics(normalized.bars[0], {
      imbalanceRatio: 2.5,
      stackedImbalanceLength: 2,
    });

    expect(metrics.totalVolume).toBeGreaterThan(0);
    expect(metrics.levels.some((level) => level.imbalanceSide !== 'none')).toBe(true);
    expect(metrics.maxAbsDelta).toBeGreaterThan(0);
  });

  it('builds session profiles with point of control data', () => {
    const profiles = buildSessionProfiles(demoOrderFlowBatch.bars, 0.7);

    expect(profiles).toHaveLength(2);
    expect(profiles[0].levels.length).toBeGreaterThan(0);
    expect(profiles[0].pointOfControl).not.toBeNull();
    expect(profiles[0].valueArea).not.toBeNull();
  });

  it('computes VWAP points for every bar', () => {
    const vwap = computeVwapSeriesData(demoOrderFlowBatch.bars, {
      resetMode: 'session',
    });

    expect(vwap).toHaveLength(demoOrderFlowBatch.bars.length);
    expect(vwap[0].value).toBeGreaterThan(0);
    expect(vwap.at(-1)?.value).toBeGreaterThan(0);
  });

  it('applies upsert and append patches without losing sort order', () => {
    const [firstPatch, secondPatch] = demoPatches;
    const afterUpsert = applyOrderFlowPatch(demoOrderFlowBatch.bars, firstPatch);
    const afterAppend = applyOrderFlowPatch(afterUpsert, secondPatch);

    expect(afterUpsert).toHaveLength(demoOrderFlowBatch.bars.length);
    expect(afterAppend).toHaveLength(demoOrderFlowBatch.bars.length + 1);
    expect(Number(afterAppend[0].time)).toBeLessThan(Number(afterAppend.at(-1)?.time));
  });

  it('builds cumulative delta summary columns', () => {
    const columns = buildDeltaSummaryColumns(demoOrderFlowBatch.bars);

    expect(columns).toHaveLength(demoOrderFlowBatch.bars.length);
    expect(columns[0]?.volume).toBeGreaterThan(0);
    expect(columns[0]?.maxDelta).toBeGreaterThanOrEqual(columns[0]?.minDelta ?? 0);
    expect(columns.at(-1)?.cumulativeDelta).not.toBe(0);
    expect(columns.at(-1)?.cumulativeDeltaToVolumeRatio).toBeTypeOf('number');
  });

  it('flags the highest-volume footprint row as point of control', () => {
    const model = buildFootprintBarModel(
      demoOrderFlowBatch.bars[0],
      DEFAULT_FOOTPRINT_SERIES_OPTIONS,
    );

    expect(model.levels.some((level) => level.isPointOfControl)).toBe(true);
    expect(
      model.levels
        .filter((level) => level.isPointOfControl)
        .every((level) => level.totalVolume === model.maxLevelVolume),
    ).toBe(true);
  });

  it('computes normalized footprint shading ratios', () => {
    const model = buildFootprintBarModel(
      demoOrderFlowBatch.bars[0],
      DEFAULT_FOOTPRINT_SERIES_OPTIONS,
    );
    const pointOfControl = model.levels.find((level) => level.isPointOfControl);

    expect(model.averageLevelVolume).toBeGreaterThan(0);
    expect(pointOfControl?.volumeRatioToMax).toBe(1);
    expect(
      model.levels.every(
        (level) =>
          level.volumeRatioToMax >= 0 &&
          level.volumeRatioToAverage >= 0 &&
          level.absoluteDeltaRatioToMaxAbs >= 0,
      ),
    ).toBe(true);
  });

  it('fills missing footprint rows on a constant price step', () => {
    const sparseBar = {
      time: 1 as TimeValue,
      open: 10,
      high: 10.03,
      low: 10,
      close: 10.02,
      levels: [
        { price: 10, bidVolume: 5, askVolume: 7 },
        { price: 10.03, bidVolume: 4, askVolume: 6 },
      ],
    };

    const model = buildFootprintBarModel(sparseBar, {
      ...DEFAULT_FOOTPRINT_SERIES_OPTIONS,
      ladder: {
        ...DEFAULT_FOOTPRINT_SERIES_OPTIONS.ladder,
        priceStep: 0.01,
      },
    });

    expect(model.priceStep).toBe(0.01);
    expect(model.levels.map((level) => level.price)).toEqual([10, 10.01, 10.02, 10.03]);
    expect(model.levels[1]?.totalVolume).toBe(0);
    expect(model.levels[2]?.totalVolume).toBe(0);
  });
});
