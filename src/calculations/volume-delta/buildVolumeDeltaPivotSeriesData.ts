import type { CandlestickData } from 'lightweight-charts';

import type { TimeValue } from '../../models/contracts';

export interface VolumeDeltaSourceBar {
  time: TimeValue;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  delta?: number;
}

export interface VolumeDeltaPivotPoint extends CandlestickData<TimeValue> {
  delta: number;
}

export interface BuildVolumeDeltaPivotSeriesDataOptions {
  intervalSeconds?: number;
}

function resolveIntervalSeconds(
  bars: VolumeDeltaSourceBar[],
  options?: BuildVolumeDeltaPivotSeriesDataOptions,
): number {
  if (typeof options?.intervalSeconds === 'number' && options.intervalSeconds > 0) {
    return options.intervalSeconds;
  }

  if (bars.length >= 2) {
    const first = Number(bars[0].time);
    const second = Number(bars[1].time);
    const delta = second - first;

    if (Number.isFinite(delta) && delta > 0) {
      return delta;
    }
  }

  return 60;
}

function classifyVolume(
  bar: VolumeDeltaSourceBar,
  previousClose: number | undefined,
  previousPolarity: number,
): number {
  if (bar.close > bar.open) {
    return 1;
  }

  if (bar.close < bar.open) {
    return -1;
  }

  if (typeof previousClose === 'number') {
    if (bar.close > previousClose) {
      return 1;
    }

    if (bar.close < previousClose) {
      return -1;
    }
  }

  return previousPolarity || (bar.close >= bar.open ? 1 : -1);
}

export function buildVolumeDeltaPivotSeriesData(
  chartBars: VolumeDeltaSourceBar[],
  lowerTimeframeBars: VolumeDeltaSourceBar[],
  options?: BuildVolumeDeltaPivotSeriesDataOptions,
): VolumeDeltaPivotPoint[] {
  if (!chartBars.length) {
    return [];
  }

  const intervalSeconds = resolveIntervalSeconds(chartBars, options);
  const intrabars = lowerTimeframeBars.length ? lowerTimeframeBars : chartBars;

  return chartBars.map((chartBar) => {
    const start = Number(chartBar.time);
    const end = start + intervalSeconds;
    const scopedBars = intrabars.filter((bar) => {
      const time = Number(bar.time);
      return time >= start && time < end;
    });
    const bars = scopedBars.length ? scopedBars : [chartBar];

    let runningDelta = 0;
    let high = 0;
    let low = 0;
    let previousClose: number | undefined;
    let previousPolarity = 0;

    for (const bar of bars) {
      let signedDelta: number;

      if (typeof bar.delta === 'number' && Number.isFinite(bar.delta)) {
        signedDelta = bar.delta;
        previousPolarity = signedDelta > 0 ? 1 : signedDelta < 0 ? -1 : previousPolarity;
      } else {
        const polarity = classifyVolume(bar, previousClose, previousPolarity);
        signedDelta = polarity * (bar.volume ?? 0);
        previousPolarity = polarity;
      }

      runningDelta += signedDelta;
      high = Math.max(high, runningDelta);
      low = Math.min(low, runningDelta);
      previousClose = bar.close;
    }

    return {
      time: chartBar.time,
      open: 0,
      high,
      low,
      close: runningDelta,
      delta: runningDelta,
    };
  });
}
