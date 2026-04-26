export const DEFAULT_SESSION_START = '09:30:00';
export const DEFAULT_SESSION_END = '16:00:00';
export const DEFAULT_TIMEZONE = 'America/New_York';

export function formatEasternParts(unixSeconds: number): {
  date: string;
  dateCompact: string;
  time: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(unixSeconds * 1000));
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${lookup.year}-${lookup.month}-${lookup.day}`,
    dateCompact: `${lookup.year}${lookup.month}${lookup.day}`,
    time: `${lookup.hour}:${lookup.minute}:${lookup.second}`,
  };
}

export function ibTimestampFromUnix(unixSeconds: number): string {
  const parts = formatEasternParts(unixSeconds);
  return `${parts.dateCompact} ${parts.time} US/Eastern`;
}

export function ibTimestampFromSessionDate(sessionDate: string, time: string): string {
  return `${sessionDate.replaceAll('-', '')} ${time} US/Eastern`;
}

export function secondsFromClock(value: string): number {
  const [hours, minutes, seconds] = value.split(':').map((part) => Number(part));
  return hours * 3600 + minutes * 60 + seconds;
}

export function sessionProgressPct(
  lastObservedTime: number | null,
  sessionStart = DEFAULT_SESSION_START,
  sessionEnd = DEFAULT_SESSION_END,
): number | null {
  if (lastObservedTime == null) {
    return 0;
  }

  const parts = formatEasternParts(lastObservedTime);
  const totalSpan = secondsFromClock(sessionEnd) - secondsFromClock(sessionStart);
  if (totalSpan <= 0) {
    return null;
  }

  const elapsed = Math.min(
    Math.max(secondsFromClock(parts.time) - secondsFromClock(sessionStart), 0),
    totalSpan,
  );

  return Number(((elapsed / totalSpan) * 100).toFixed(2));
}
