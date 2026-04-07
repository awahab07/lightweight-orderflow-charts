import type { IChartApi, ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { DeltaSummarySeriesPartialOptions } from '../../models/options';
import { useDeltaSummarySeries } from '../hooks/useDeltaSummarySeries';

export interface DeltaSummarySeriesProps {
  chart?: IChartApi | null;
  data: OrderFlowBar[];
  options?: DeltaSummarySeriesPartialOptions;
  paneIndex?: number;
  onReady?: (series: ISeriesApi<'Custom', TimeValue>) => void;
}

export function DeltaSummarySeries(props: DeltaSummarySeriesProps) {
  useDeltaSummarySeries(props);

  return null;
}
