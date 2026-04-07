import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import { compareTimeValues } from '../../utils/time';
import { buildProfile } from './buildProfile';

export function buildVisibleRangeProfile(
  bars: OrderFlowBar[],
  from?: TimeValue,
  to?: TimeValue,
  valueAreaPercent = 0.7,
) {
  const scopedBars = bars.filter((bar) => {
    if (from && compareTimeValues(bar.time, from) < 0) {
      return false;
    }

    if (to && compareTimeValues(bar.time, to) > 0) {
      return false;
    }

    return true;
  });

  const model = buildProfile(scopedBars, 'visible-range', valueAreaPercent, 'Visible Range');

  return {
    ...model,
    fromTime: from,
    toTime: to,
  };
}
