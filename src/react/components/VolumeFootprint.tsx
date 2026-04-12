import type { IChartApi, ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { VolumeFootprintPartialOptions } from '../../models/options';
import { useFootprintSeries } from '../hooks/useFootprintSeries';

export interface VolumeFootprintProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: VolumeFootprintPartialOptions;
  paneIndex?: number;
  onReady?: (series: ISeriesApi<'Custom', TimeValue> | null) => void;
}

export function VolumeFootprint(props: VolumeFootprintProps) {
  useFootprintSeries({
    chart: props.chart,
    data: props.data,
    options: props.options,
    paneIndex: props.paneIndex,
    variant: 'volume-footprint',
    onReady: props.onReady as never,
  });

  return null;
}
