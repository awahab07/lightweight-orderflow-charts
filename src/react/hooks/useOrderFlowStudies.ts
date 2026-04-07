import { useEffect, useMemo, useRef } from 'react';
import type { IChartApi, ISeriesApi, LineSeriesPartialOptions } from 'lightweight-charts';

import type { OrderFlowBar, OrderFlowPatch, TimeValue } from '../../models/contracts';
import type {
  SessionVolumeProfilePartialOptions,
  VolumeProfilePartialOptions,
  VwapOptions,
} from '../../models/options';
import {
  createVwapController,
  type VwapController,
} from '../../renderers/primitives/createVwapController';
import { createSessionVolumeProfilePrimitive } from '../../renderers/primitives/createSessionVolumeProfilePrimitive';
import { createVolumeProfilePrimitive } from '../../renderers/primitives/createVolumeProfilePrimitive';
import { usePrimitiveLifecycle } from './usePrimitiveLifecycle';

export interface UseOrderFlowStudiesProps {
  chart?: IChartApi | null;
  series: ISeriesApi<'Custom', TimeValue> | null;
  data: OrderFlowBar[];
  patch?: OrderFlowPatch;
  volumeProfileOptions?: VolumeProfilePartialOptions;
  sessionVolumeProfileOptions?: SessionVolumeProfilePartialOptions;
  vwapOptions?: Partial<VwapOptions>;
  vwapLineOptions?: LineSeriesPartialOptions;
}

export function useOrderFlowStudies({
  chart,
  series,
  data,
  patch,
  volumeProfileOptions,
  sessionVolumeProfileOptions,
  vwapOptions,
  vwapLineOptions,
}: UseOrderFlowStudiesProps) {
  const vwapControllerRef = useRef<VwapController | null>(null);
  const volumeProfilePrimitive = useMemo(
    () =>
      createVolumeProfilePrimitive({
        bars: data,
        options: volumeProfileOptions,
      }),
    [volumeProfileOptions],
  );
  const sessionProfilePrimitive = useMemo(
    () =>
      createSessionVolumeProfilePrimitive({
        bars: data,
        options: sessionVolumeProfileOptions,
      }),
    [sessionVolumeProfileOptions],
  );

  usePrimitiveLifecycle(series, volumeProfilePrimitive, data);
  usePrimitiveLifecycle(series, sessionProfilePrimitive, data);

  useEffect(() => {
    if (!chart) {
      return;
    }

    vwapControllerRef.current = createVwapController({
      chart,
      bars: data,
      options: vwapOptions,
      lineOptions: vwapLineOptions,
    });

    return () => {
      vwapControllerRef.current?.destroy();
      vwapControllerRef.current = null;
    };
  }, [chart, vwapLineOptions, vwapOptions]);

  useEffect(() => {
    vwapControllerRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    if (patch) {
      vwapControllerRef.current?.applyPatch(patch);
    }
  }, [patch]);

  return {
    volumeProfilePrimitive,
    sessionProfilePrimitive,
    vwapController: vwapControllerRef.current,
  };
}
