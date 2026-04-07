import type { TimeValue } from '../models/contracts';

function normalizeNumericTime(value: number): number {
  return value > 1e12 ? value : value * 1000;
}

export function timeValueToDate(time: TimeValue): Date {
  if (typeof time === 'number') {
    return new Date(normalizeNumericTime(time));
  }

  if (typeof time === 'string') {
    return new Date(time);
  }

  return new Date(Date.UTC(time.year, time.month - 1, time.day));
}

export function timeValueToKey(time: TimeValue): string {
  if (typeof time === 'number' || typeof time === 'string') {
    return `${time}`;
  }

  return `${time.year}-${time.month}-${time.day}`;
}

export function compareTimeValues(a: TimeValue, b: TimeValue): number {
  return timeValueToDate(a).getTime() - timeValueToDate(b).getTime();
}

export function getTimeParts(
  time: TimeValue,
  timezone = 'UTC',
): {
  dayOfWeek: number;
  hhmm: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(timeValueToDate(time));
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dayOfWeek: dayOfWeekMap[weekday] ?? 0,
    hhmm: `${hour}:${minute}`,
  };
}
