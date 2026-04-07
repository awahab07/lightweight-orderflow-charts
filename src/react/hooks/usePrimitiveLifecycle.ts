import { useEffect } from 'react';
import type { ISeriesApi, ISeriesPrimitive } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { FootprintSeriesOptions } from '../../models/options';

type UpdatablePrimitive = ISeriesPrimitive<TimeValue> & {
  setData?: (bars: OrderFlowBar[]) => void;
};

export function usePrimitiveLifecycle(
  series: ISeriesApi<'Custom', TimeValue> | null,
  primitive: UpdatablePrimitive | null,
  bars?: OrderFlowBar[],
): void {
  useEffect(() => {
    if (!series || !primitive) {
      return;
    }

    series.attachPrimitive(primitive);

    return () => {
      series.detachPrimitive(primitive);
    };
  }, [primitive, series]);

  useEffect(() => {
    if (!primitive || !bars) {
      return;
    }

    primitive.setData?.(bars);
  }, [bars, primitive]);
}
