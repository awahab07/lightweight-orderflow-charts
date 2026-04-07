import type { ColorScaleOptions, ColorScaleRangeOptions } from '../models/options';
import { clamp } from './math';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const RGB_REGEX = /^rgba?\(([^)]+)\)$/i;

function clampChannel(value: number): number {
  return clamp(Math.round(value), 0, 255);
}

function clampAlpha(value: number): number {
  return clamp(value, 0, 1);
}

function formatAlpha(value: number): string {
  return clampAlpha(value)
    .toFixed(3)
    .replace(/\.?0+$/, '');
}

function parseRgbComponent(value: string): number {
  return clampChannel(Number.parseFloat(value.trim()));
}

function parseAlphaComponent(value: string | undefined): number {
  if (value === undefined) {
    return 1;
  }

  return clampAlpha(Number.parseFloat(value.trim()));
}

function parseHexColor(color: string): RgbaColor | null {
  const normalized = color.replace('#', '').trim();

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('');

    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: 1,
    };
  }

  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
      a: 1,
    };
  }

  return null;
}

function parseRgbColor(color: string): RgbaColor | null {
  const match = color.match(RGB_REGEX);

  if (!match) {
    return null;
  }

  const parts = match[1]?.split(',').map((part) => part.trim()) ?? [];

  if (parts.length < 3) {
    return null;
  }

  return {
    r: parseRgbComponent(parts[0] ?? '0'),
    g: parseRgbComponent(parts[1] ?? '0'),
    b: parseRgbComponent(parts[2] ?? '0'),
    a: parseAlphaComponent(parts[3]),
  };
}

function parseColor(color: string): RgbaColor | null {
  if (color.startsWith('#')) {
    return parseHexColor(color);
  }

  if (color.startsWith('rgb')) {
    return parseRgbColor(color);
  }

  return null;
}

function toRgbaString(color: RgbaColor): string {
  return `rgba(${clampChannel(color.r)}, ${clampChannel(color.g)}, ${clampChannel(color.b)}, ${formatAlpha(color.a)})`;
}

function interpolateColor(from: RgbaColor, to: RgbaColor, t: number): string {
  const factor = clamp(t, 0, 1);

  return toRgbaString({
    r: from.r + (to.r - from.r) * factor,
    g: from.g + (to.g - from.g) * factor,
    b: from.b + (to.b - from.b) * factor,
    a: from.a + (to.a - from.a) * factor,
  });
}

function normalizeScaleValue(value: number, range: ColorScaleRangeOptions): number {
  const denominator = range.to - range.from;

  if (denominator === 0) {
    return range.invert ? 0 : 1;
  }

  let normalized = (value - range.from) / denominator;

  if (range.invert) {
    normalized = 1 - normalized;
  }

  return range.clamp ? clamp(normalized, 0, 1) : normalized;
}

export function withAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);

  if (!parsed) {
    return color;
  }

  return toRgbaString({
    ...parsed,
    a: alpha,
  });
}

export function createAlphaColorScale(
  color: string,
  minAlpha: number,
  maxAlpha: number,
  range: Partial<ColorScaleRangeOptions> = {},
): ColorScaleOptions {
  return {
    range: {
      from: 0,
      to: 1,
      clamp: true,
      invert: false,
      ...range,
    },
    stops: [
      {
        offset: 0,
        color: withAlpha(color, minAlpha),
      },
      {
        offset: 1,
        color: withAlpha(color, maxAlpha),
      },
    ],
  };
}

export function resolveColorScale(scale: ColorScaleOptions, value: number): string {
  const stops = [...scale.stops]
    .map((stop) => ({
      offset: clamp(stop.offset, 0, 1),
      color: stop.color,
    }))
    .sort((left, right) => left.offset - right.offset);

  if (!stops.length) {
    return 'transparent';
  }

  const normalized = normalizeScaleValue(value, scale.range);

  if (normalized <= stops[0].offset) {
    return stops[0].color;
  }

  if (normalized >= stops.at(-1)!.offset) {
    return stops.at(-1)!.color;
  }

  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const current = stops[index];

    if (normalized > current.offset) {
      continue;
    }

    const span = current.offset - previous.offset;

    if (span <= 0) {
      return current.color;
    }

    const from = parseColor(previous.color);
    const to = parseColor(current.color);

    if (!from || !to) {
      return normalized - previous.offset <= current.offset - normalized
        ? previous.color
        : current.color;
    }

    return interpolateColor(from, to, (normalized - previous.offset) / span);
  }

  return stops.at(-1)!.color;
}
