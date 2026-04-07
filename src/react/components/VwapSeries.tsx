import { useEffect, useRef } from 'react';
import type { IChartApi, LineSeriesPartialOptions } from 'lightweight-charts';

import type { OrderFlowBar, OrderFlowPatch, TimeValue } from '../../models/contracts';
import type { VwapOptions } from '../../models/options';
import {
  createVwapController,
  type VwapController,
} from '../../renderers/primitives/createVwapController';
import { useChartApi } from '../context/ChartContext';

export interface VwapSeriesProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: Partial<VwapOptions>;
  lineOptions?: LineSeriesPartialOptions;
  patch?: OrderFlowPatch;
  paneIndex?: number;
}

export function VwapSeries({
  chart,
  data,
  options,
  lineOptions,
  patch,
  paneIndex,
}: VwapSeriesProps) {
  const contextChart = useChartApi();
  const resolvedChart = chart ?? contextChart;
  const controllerRef = useRef<VwapController | null>(null);

  useEffect(() => {
    if (!resolvedChart) {
      return;
    }

    controllerRef.current = createVwapController({
      chart: resolvedChart,
      bars: data,
      options,
      lineOptions,
      paneIndex,
    });

    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [lineOptions, options, paneIndex, resolvedChart]);

  useEffect(() => {
    controllerRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    if (patch) {
      controllerRef.current?.applyPatch(patch);
    }
  }, [patch]);

  return null;
}
