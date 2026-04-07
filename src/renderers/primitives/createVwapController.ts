import {
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineSeriesPartialOptions,
} from 'lightweight-charts';

import type { OrderFlowBar, OrderFlowPatch, TimeValue } from '../../models/contracts';
import type { VwapOptions } from '../../models/options';
import { mergeVwapOptions } from '../../models/options';
import { applyOrderFlowPatch } from '../../adapters/normalize/applyOrderFlowPatch';
import { computeVwapSeriesData } from '../../calculations/vwap/computeVwapSeriesData';
import { safeRemoveSeries } from '../../utils/lightweightCharts';

export interface VwapController {
  series: ISeriesApi<'Line', TimeValue>;
  setData(bars: OrderFlowBar[]): void;
  applyPatch(patch: OrderFlowPatch): void;
  destroy(): void;
}

export interface CreateVwapControllerConfig {
  chart: IChartApi;
  bars: OrderFlowBar[];
  options?: Partial<VwapOptions>;
  lineOptions?: LineSeriesPartialOptions;
  paneIndex?: number;
}

export function createVwapController(config: CreateVwapControllerConfig): VwapController {
  const options = mergeVwapOptions(config.options);
  let bars = [...config.bars];
  const series = config.chart.addSeries(
    LineSeries,
    {
      color: options.color,
      lineWidth: options.lineWidth,
      ...config.lineOptions,
    },
    config.paneIndex,
  );

  const sync = () => {
    series.setData(computeVwapSeriesData(bars, options));
  };

  sync();

  return {
    series,
    setData(nextBars) {
      bars = [...nextBars];
      sync();
    },
    applyPatch(patch) {
      bars = applyOrderFlowPatch(bars, patch);
      sync();
    },
    destroy() {
      safeRemoveSeries(config.chart, series);
    },
  };
}
