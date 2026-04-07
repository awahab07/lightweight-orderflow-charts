import type { IChartApi } from 'lightweight-charts';

export interface AutoFitPriceScaleOptions {
  paneIndex?: number;
  priceScaleId?: string;
  topInsetRatio?: number;
  bottomInsetRatio?: number;
}

export interface AutoFitPriceScaleResult {
  enabled: boolean;
  paneIndex: number;
  priceScaleId: string;
  topInsetRatio: number;
  bottomInsetRatio: number;
}

function clampInsetRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.05;
  }

  return Math.min(Math.max(value, 0), 0.49);
}

export function setPriceScaleAutoFit(
  chart: IChartApi,
  enabled: boolean,
  options: AutoFitPriceScaleOptions = {},
): AutoFitPriceScaleResult {
  const paneIndex = options.paneIndex ?? 0;
  const priceScaleId = options.priceScaleId ?? 'right';
  const topInsetRatio = clampInsetRatio(options.topInsetRatio ?? 0.05);
  const bottomInsetRatio = clampInsetRatio(options.bottomInsetRatio ?? 0.05);
  const priceScale = chart.priceScale(priceScaleId, paneIndex);

  priceScale.applyOptions({
    autoScale: enabled,
    scaleMargins: {
      top: topInsetRatio,
      bottom: bottomInsetRatio,
    },
  });
  priceScale.setAutoScale(enabled);

  return {
    enabled,
    paneIndex,
    priceScaleId,
    topInsetRatio,
    bottomInsetRatio,
  };
}
