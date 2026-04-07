import type { NormalizationOptions, OrderFlowPatch } from '../../models/contracts';
import { normalizeBars } from './normalizeBatch';

export function normalizeOrderFlowPatch(
  patch: OrderFlowPatch,
  options?: NormalizationOptions,
): OrderFlowPatch {
  if (!patch.bars?.length) {
    return patch;
  }

  return {
    ...patch,
    bars: normalizeBars(patch.bars, {
      sessions: options?.sessions,
      deriveSessions: options?.deriveSessions,
    }),
  };
}
