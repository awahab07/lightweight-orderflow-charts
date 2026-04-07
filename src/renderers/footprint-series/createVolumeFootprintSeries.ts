import type { ICustomSeriesPaneView } from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { VolumeFootprintOptions, VolumeFootprintPartialOptions } from '../../models/options';
import { DEFAULT_VOLUME_FOOTPRINT_OPTIONS } from '../../models/options';
import { createFootprintSeries } from './createFootprintSeries';

export function createVolumeFootprintSeries(
  options?: VolumeFootprintPartialOptions,
): ICustomSeriesPaneView<TimeValue, OrderFlowBar, VolumeFootprintOptions> {
  return createFootprintSeries({
    ...DEFAULT_VOLUME_FOOTPRINT_OPTIONS,
    ...options,
    ladder: {
      ...DEFAULT_VOLUME_FOOTPRINT_OPTIONS.ladder,
      ...options?.ladder,
      textMode: options?.ladder?.textMode ?? 'total',
    },
  }) as ICustomSeriesPaneView<TimeValue, OrderFlowBar, VolumeFootprintOptions>;
}
