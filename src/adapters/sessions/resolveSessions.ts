import type { OrderFlowBar, SessionDefinition, SessionSegment } from '../../models/contracts';
import { getTimeParts } from '../../utils/time';

function matchesSegment(bar: OrderFlowBar, segment: SessionSegment, timezone: string): boolean {
  const { dayOfWeek, hhmm } = getTimeParts(bar.time, timezone);

  if (segment.start <= segment.end) {
    return dayOfWeek === segment.dayOfWeek && hhmm >= segment.start && hhmm <= segment.end;
  }

  const nextDay = (segment.dayOfWeek + 1) % 7;
  return (
    (dayOfWeek === segment.dayOfWeek && hhmm >= segment.start) ||
    (dayOfWeek === nextDay && hhmm <= segment.end)
  );
}

export function resolveSessionId(
  bar: OrderFlowBar,
  sessions: SessionDefinition[],
): string | undefined {
  for (const session of sessions) {
    const timezone = session.timezone ?? 'UTC';
    if (session.segments.some((segment) => matchesSegment(bar, segment, timezone))) {
      return session.sessionId;
    }
  }

  return bar.sessionId;
}

export function resolveSessions(
  bars: OrderFlowBar[],
  sessions?: SessionDefinition[],
): OrderFlowBar[] {
  if (!sessions?.length) {
    return bars;
  }

  return bars.map((bar) => ({
    ...bar,
    sessionId: resolveSessionId(bar, sessions),
  }));
}
