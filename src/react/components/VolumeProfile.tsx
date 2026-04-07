import { useMemo } from 'react';
import type { ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { VolumeProfilePartialOptions } from '../../models/options';
import { createVolumeProfilePrimitive } from '../../renderers/primitives/createVolumeProfilePrimitive';
import { usePrimitiveLifecycle } from '../hooks/usePrimitiveLifecycle';

export interface VolumeProfileProps {
  series: ISeriesApi<'Custom', TimeValue> | null;
  data: OrderFlowBar[];
  options?: VolumeProfilePartialOptions;
}

export function VolumeProfile({ series, data, options }: VolumeProfileProps) {
  const primitive = useMemo(
    () =>
      createVolumeProfilePrimitive({
        bars: data,
        options,
      }),
    [options],
  );

  usePrimitiveLifecycle(series, primitive, data);

  return null;
}
