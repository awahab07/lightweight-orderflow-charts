import type { IChartApi } from 'lightweight-charts';

export interface NumericRange {
  from: number;
  to: number;
}

export interface ChartViewPaneStateSnapshot {
  paneIndex: number;
  priceScaleId: string;
  priceRange: NumericRange | null;
}

export interface ChartViewStateSnapshot {
  version: 1;
  timeRange: NumericRange | null;
  panes: ChartViewPaneStateSnapshot[];
}

export interface CaptureChartViewStateOptions {
  paneIndices?: number[];
  priceScaleId?: string;
}

function normalizeRange(
  range: { from: number; to: number } | null | undefined,
): NumericRange | null {
  if (!range) {
    return null;
  }

  if (!Number.isFinite(range.from) || !Number.isFinite(range.to)) {
    return null;
  }

  return {
    from: range.from,
    to: range.to,
  };
}

export function isChartViewStateSnapshot(value: unknown): value is ChartViewStateSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as Partial<ChartViewStateSnapshot>;
  return snapshot.version === 1 && Array.isArray(snapshot.panes) && 'timeRange' in snapshot;
}

export function captureChartViewState(
  chart: IChartApi,
  options: CaptureChartViewStateOptions = {},
): ChartViewStateSnapshot {
  const priceScaleId = options.priceScaleId ?? 'right';
  const paneIndices = options.paneIndices ?? chart.panes().map((_, index) => index);

  return {
    version: 1,
    timeRange: normalizeRange(chart.timeScale().getVisibleLogicalRange()),
    panes: paneIndices.map((paneIndex) => ({
      paneIndex,
      priceScaleId,
      priceRange: normalizeRange(chart.priceScale(priceScaleId, paneIndex).getVisibleRange()),
    })),
  };
}

export function restoreChartViewState(
  chart: IChartApi,
  snapshot: ChartViewStateSnapshot | null | undefined,
): void {
  if (!snapshot || snapshot.version !== 1) {
    return;
  }

  if (snapshot.timeRange) {
    chart.timeScale().setVisibleLogicalRange(snapshot.timeRange);
  }

  const panes = chart.panes();

  for (const pane of snapshot.panes) {
    if (!panes[pane.paneIndex]) {
      continue;
    }

    const priceScale = chart.priceScale(pane.priceScaleId, pane.paneIndex);

    if (pane.priceRange) {
      priceScale.setAutoScale(false);
      priceScale.setVisibleRange(pane.priceRange);
    } else {
      priceScale.setAutoScale(true);
    }
  }
}
