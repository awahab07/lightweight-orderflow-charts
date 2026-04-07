import type { IChartApi } from 'lightweight-charts';

export interface FocusableOrderFlowBar {
  high: number;
  low: number;
}

export interface FocusOrderFlowChartOptions {
  paneIndex?: number;
  priceScaleId?: string;
  minVisibleHeightRatio?: number;
  targetVisibleHeightRatio?: number;
  verticalPaddingRatio?: number;
}

export interface FocusOrderFlowChartResult {
  applied: boolean;
  targetIndex: number | null;
  scaleFactor: number;
  reason: 'applied' | 'no-bars' | 'missing-price-range' | 'already-focused';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function focusOrderFlowChart(
  chart: IChartApi,
  bars: readonly FocusableOrderFlowBar[],
  options: FocusOrderFlowChartOptions = {},
): FocusOrderFlowChartResult {
  if (!bars.length) {
    return {
      applied: false,
      targetIndex: null,
      scaleFactor: 1,
      reason: 'no-bars',
    };
  }

  const paneIndex = options.paneIndex ?? 0;
  const priceScaleId = options.priceScaleId ?? 'right';
  const minVisibleHeightRatio = options.minVisibleHeightRatio ?? 0.1;
  const targetVisibleHeightRatio = options.targetVisibleHeightRatio ?? 0.2;
  const verticalPaddingRatio = options.verticalPaddingRatio ?? 0.06;
  const fallbackTimeRange = {
    from: 0,
    to: Math.max(bars.length - 1, 6),
  };
  const timeRange = chart.timeScale().getVisibleLogicalRange() ?? fallbackTimeRange;
  const priceScale = chart.priceScale(priceScaleId, paneIndex);
  const priceRange = priceScale.getVisibleRange();

  if (!priceRange) {
    return {
      applied: false,
      targetIndex: null,
      scaleFactor: 1,
      reason: 'missing-price-range',
    };
  }

  const clampedLogicalCenter = clamp((timeRange.from + timeRange.to) / 2, 0, bars.length - 1);
  const targetIndex = clamp(Math.round(clampedLogicalCenter), 0, bars.length - 1);
  const targetBar = bars[targetIndex];
  const targetHigh = Math.max(targetBar.high, targetBar.low);
  const targetLow = Math.min(targetBar.high, targetBar.low);
  const targetMid = (targetHigh + targetLow) / 2;
  const targetHeight = Math.max(targetHigh - targetLow, Number.EPSILON);
  const visibleLow = Math.min(priceRange.from, priceRange.to);
  const visibleHigh = Math.max(priceRange.from, priceRange.to);
  const currentPriceSpan = Math.max(visibleHigh - visibleLow, targetHeight);
  const currentHeightRatio = targetHeight / currentPriceSpan;
  const isOffscreen = targetHigh > visibleHigh || targetLow < visibleLow;
  const needsZoom = currentHeightRatio <= minVisibleHeightRatio;

  if (!isOffscreen && !needsZoom) {
    return {
      applied: false,
      targetIndex,
      scaleFactor: 1,
      reason: 'already-focused',
    };
  }

  const paddedTargetHeight = targetHeight * (1 + verticalPaddingRatio * 2);
  const nextPriceSpan = needsZoom
    ? Math.max(paddedTargetHeight, targetHeight / targetVisibleHeightRatio)
    : Math.max(paddedTargetHeight, currentPriceSpan);
  const scaleFactor = currentPriceSpan / nextPriceSpan;

  priceScale.setAutoScale(false);
  priceScale.setVisibleRange({
    from: targetMid - nextPriceSpan / 2,
    to: targetMid + nextPriceSpan / 2,
  });

  return {
    applied: true,
    targetIndex,
    scaleFactor,
    reason: 'applied',
  };
}
