import type { IChartApi, ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { FootprintSeriesPartialOptions } from '../../models/options';
import { useFootprintSeries } from '../hooks/useFootprintSeries';

export interface FootprintSeriesProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: FootprintSeriesPartialOptions;
  paneIndex?: number;
  onReady?: (series: ISeriesApi<'Custom', TimeValue>) => void;
}

export function FootprintSeries(props: FootprintSeriesProps) {
  useFootprintSeries({
    ...props,
    variant: 'footprint',
  });

  return null;
}
