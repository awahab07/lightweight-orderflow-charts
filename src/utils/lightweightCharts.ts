import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

export function safeRemoveSeries(
  chart: IChartApi,
  series: ISeriesApi<any, Time> | null | undefined,
): void {
  if (!series) {
    return;
  }

  try {
    chart.removeSeries(series);
  } catch {
    // Ignore stale-series removals during chart teardown.
  }
}
