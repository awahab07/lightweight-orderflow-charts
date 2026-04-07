import type { OrderFlowBar } from '../../models/contracts';
import type { ProfileModel } from '../../models/studies';
import { buildProfile } from './buildProfile';

export function buildSessionProfiles(bars: OrderFlowBar[], valueAreaPercent = 0.7): ProfileModel[] {
  const grouped = new Map<string, OrderFlowBar[]>();

  for (const bar of bars) {
    const sessionId = bar.sessionId ?? 'default-session';
    const sessionBars = grouped.get(sessionId) ?? [];
    sessionBars.push(bar);
    grouped.set(sessionId, sessionBars);
  }

  return [...grouped.entries()].map(([sessionId, sessionBars]) => ({
    ...buildProfile(sessionBars, sessionId, valueAreaPercent, sessionId),
    fromTime: sessionBars[0]?.time,
    toTime: sessionBars.at(-1)?.time,
  }));
}
