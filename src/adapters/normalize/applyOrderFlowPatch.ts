import type { OrderFlowBar, OrderFlowPatch } from '../../models/contracts';
import { compareTimeValues, timeValueToKey } from '../../utils/time';

function sortBars(bars: OrderFlowBar[]): OrderFlowBar[] {
  return [...bars].sort((left, right) => compareTimeValues(left.time, right.time));
}

export function applyOrderFlowPatch(
  currentBars: OrderFlowBar[],
  patch: OrderFlowPatch,
): OrderFlowBar[] {
  if (patch.operation === 'replace') {
    return sortBars(patch.bars ?? []);
  }

  const byTime = new Map(currentBars.map((bar) => [timeValueToKey(bar.time), bar]));

  if (patch.operation === 'remove') {
    for (const correctedTime of patch.correctedTimes ?? []) {
      byTime.delete(timeValueToKey(correctedTime));
    }
  } else {
    for (const bar of patch.bars ?? []) {
      byTime.set(timeValueToKey(bar.time), bar);
    }
  }

  return sortBars([...byTime.values()]);
}
