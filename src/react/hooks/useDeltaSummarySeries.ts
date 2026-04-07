import { useEffect, useMemo, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { DeltaSummarySeriesPartialOptions } from '../../models/options';
import { createDeltaSummarySeries } from '../../renderers/delta-summary-series/createDeltaSummarySeries';
import { safeRemoveSeries } from '../../utils/lightweightCharts';
import { useChartApi } from '../context/ChartContext';

export interface UseDeltaSummarySeriesProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: DeltaSummarySeriesPartialOptions;
  paneIndex?: number;
  onReady?: (series: ISeriesApi<'Custom', TimeValue>) => void;
}

export function useDeltaSummarySeries({
  chart,
  data,
  options,
  paneIndex,
  onReady,
}: UseDeltaSummarySeriesProps) {
  const contextChart = useChartApi();
  const resolvedChart = chart ?? contextChart;
  const [series, setSeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(null);
  const seriesView = useMemo(() => createDeltaSummarySeries(), []);

  useEffect(() => {
    if (!resolvedChart) {
      return;
    }

    const nextSeries = resolvedChart.addCustomSeries(seriesView, options, paneIndex);
    nextSeries.setData(data);
    setSeries(nextSeries);
    onReady?.(nextSeries);

    return () => {
      safeRemoveSeries(resolvedChart, nextSeries);
      setSeries(null);
    };
  }, [onReady, paneIndex, resolvedChart, seriesView]);

  useEffect(() => {
    if (!series) {
      return;
    }

    if (options) {
      series.applyOptions(options);
    }
  }, [options, series]);

  useEffect(() => {
    if (!series) {
      return;
    }

    series.setData(data);
  }, [data, series]);

  return series;
}
