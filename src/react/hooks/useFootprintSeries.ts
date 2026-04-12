import { useEffect, useMemo, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type {
  FootprintSeriesPartialOptions,
  VolumeFootprintPartialOptions,
} from '../../models/options';
import { createFootprintSeries } from '../../renderers/footprint-series/createFootprintSeries';
import { createVolumeFootprintSeries } from '../../renderers/footprint-series/createVolumeFootprintSeries';
import { safeRemoveSeries } from '../../utils/lightweightCharts';
import { useChartApi } from '../context/ChartContext';

export interface UseFootprintSeriesProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: FootprintSeriesPartialOptions | VolumeFootprintPartialOptions;
  paneIndex?: number;
  variant?: 'footprint' | 'volume-footprint';
  onReady?: (series: ISeriesApi<'Custom', TimeValue> | null) => void;
}

export function useFootprintSeries({
  chart,
  data,
  options,
  paneIndex,
  variant = 'footprint',
  onReady,
}: UseFootprintSeriesProps) {
  const contextChart = useChartApi();
  const resolvedChart = chart ?? contextChart;
  const [series, setSeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(null);
  const seriesView = useMemo(
    () =>
      variant === 'volume-footprint' ? createVolumeFootprintSeries() : createFootprintSeries(),
    [variant],
  );

  useEffect(() => {
    if (!resolvedChart) {
      return;
    }

    const nextSeries = resolvedChart.addCustomSeries(seriesView, options, paneIndex);
    nextSeries.setData(data);
    setSeries(nextSeries);
    onReady?.(nextSeries);

    return () => {
      onReady?.(null);
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
