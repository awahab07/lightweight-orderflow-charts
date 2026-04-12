import { describe, expect, it } from 'vitest';

import type { AggregatedMarketBar, OrderFlowBar } from '../../src';
import { assessMinuteCoverage } from '../../connectors/core/minuteCoverage';

function marketBar(time: number, volume = 100): AggregatedMarketBar {
  return {
    time: time as AggregatedMarketBar['time'],
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume,
  };
}

function orderFlowBar(time: number, totalVolume = 100): OrderFlowBar {
  return {
    time: time as OrderFlowBar['time'],
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    totalVolume,
    levels: [
      {
        price: 100,
        bidVolume: totalVolume * 0.4,
        askVolume: totalVolume * 0.6,
        totalVolume,
        delta: totalVolume * 0.2,
      },
    ],
  };
}

describe('assessMinuteCoverage', () => {
  it('marks a session complete when all required minutes are covered', () => {
    const marketBars = [marketBar(60), marketBar(120), marketBar(180)];
    const orderFlowBars = [orderFlowBar(60), orderFlowBar(120), orderFlowBar(180)];

    const result = assessMinuteCoverage(marketBars, orderFlowBars);

    expect(result).toMatchObject({
      requiredMinuteCount: 3,
      coveredMinuteCount: 3,
      contiguousCoveredMinuteCount: 3,
      resumeRewriteTime: 180,
      isComplete: true,
    });
  });

  it('forces a full restart when only a late stray minute is present', () => {
    const marketBars = [marketBar(60), marketBar(120), marketBar(180)];
    const orderFlowBars = [orderFlowBar(180)];

    const result = assessMinuteCoverage(marketBars, orderFlowBars);

    expect(result).toMatchObject({
      requiredMinuteCount: 3,
      coveredMinuteCount: 1,
      contiguousCoveredMinuteCount: 0,
      resumeRewriteTime: null,
      isComplete: false,
    });
  });

  it('resumes from the last contiguous covered minute when a gap exists', () => {
    const marketBars = [marketBar(60), marketBar(120), marketBar(180), marketBar(240)];
    const orderFlowBars = [orderFlowBar(60), orderFlowBar(120), orderFlowBar(240)];

    const result = assessMinuteCoverage(marketBars, orderFlowBars);

    expect(result).toMatchObject({
      requiredMinuteCount: 4,
      coveredMinuteCount: 3,
      contiguousCoveredMinuteCount: 2,
      resumeRewriteTime: 120,
      isComplete: false,
    });
  });

  it('treats mismatched minute bars as uncovered so they are rebuilt', () => {
    const marketBars = [marketBar(60), marketBar(120)];
    const orderFlowBars = [
      {
        ...orderFlowBar(60),
        open: 100.25,
      },
      orderFlowBar(120),
    ];

    const result = assessMinuteCoverage(marketBars, orderFlowBars, {
      priceTolerance: 0.01,
      volumeTolerance: 0,
    });

    expect(result).toMatchObject({
      requiredMinuteCount: 2,
      coveredMinuteCount: 1,
      contiguousCoveredMinuteCount: 0,
      resumeRewriteTime: null,
      isComplete: false,
    });
  });

  it('ignores zero-volume market minutes when deciding required tick coverage', () => {
    const marketBars = [marketBar(60, 100), marketBar(120, 0), marketBar(180, 120)];
    const orderFlowBars = [orderFlowBar(60, 100), orderFlowBar(180, 120)];

    const result = assessMinuteCoverage(marketBars, orderFlowBars);

    expect(result).toMatchObject({
      requiredMinuteCount: 2,
      coveredMinuteCount: 2,
      contiguousCoveredMinuteCount: 2,
      resumeRewriteTime: 180,
      isComplete: true,
    });
  });
});
