import { useMemo } from 'react';
import type { ISeriesApi } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { SessionVolumeProfilePartialOptions } from '../../models/options';
import { createSessionVolumeProfilePrimitive } from '../../renderers/primitives/createSessionVolumeProfilePrimitive';
import { usePrimitiveLifecycle } from '../hooks/usePrimitiveLifecycle';

export interface SessionVolumeProfilesProps {
  series: ISeriesApi<'Custom', TimeValue> | null;
  data: OrderFlowBar[];
  options?: SessionVolumeProfilePartialOptions;
}

export function SessionVolumeProfiles({ series, data, options }: SessionVolumeProfilesProps) {
  const primitive = useMemo(
    () =>
      createSessionVolumeProfilePrimitive({
        bars: data,
        options,
      }),
    [options],
  );

  usePrimitiveLifecycle(series, primitive, data);

  return null;
}
