import type { CandlestickData } from 'lightweight-charts';

import type { TimeValue } from '../../models/contracts';
import type {
  CandleHeatmapOptions,
  CandleHeatmapPartialOptions,
  MetricStylePalette,
  MetricStyleVariant,
} from '../../models/options';
import { mergeCandleHeatmapOptions } from '../../models/options';
import { clamp } from '../../utils/math';
import type { OhlcLike } from '../../utils/mintick';
import { resolveMetricStyleToken } from '../../utils/metricStylePalette';
import { withAlpha } from '../../utils/color';

const DEFAULT_SURFACE_BACKGROUND = '#020617';
const LIGHT_THEME_MIN_ALPHA = 0.24;
const DARK_THEME_MIN_ALPHA = 0.38;
const CONTINUOUS_SHADE_STEPS = 256;
const LIGHT_THEME_NEUTRAL_TARGET = '#0f172a';
const DARK_THEME_NEUTRAL_TARGET = '#e2e8f0';
const LIGHT_THEME_NEUTRAL_MIX = 0.08;
const DARK_THEME_NEUTRAL_MIX = 0.2;

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface CandleHeatmapBarLike extends OhlcLike {
  time: TimeValue;
}

export interface CandleHeatmapColorResolution {
  color: string;
  variant: MetricStyleVariant;
  intensity: number;
}

export interface ResolveCandleHeatmapColorInput {
  value: number | null | undefined;
  metricStyles: MetricStylePalette;
  options?: CandleHeatmapPartialOptions;
  backgroundColor?: string;
}

export interface BuildCandleHeatmapSeriesDataInput<TBar extends CandleHeatmapBarLike> {
  bars: readonly TBar[];
  metricStyles: MetricStylePalette;
  options?: CandleHeatmapPartialOptions;
  backgroundColor?: string;
  getValue: (bar: TBar, index: number, bars: readonly TBar[]) => number | null | undefined;
}

const RGB_REGEX = /^rgba?\(([^)]+)\)$/i;

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
    r: clamp(Number.parseFloat(parts[0] ?? '0'), 0, 255),
    g: clamp(Number.parseFloat(parts[1] ?? '0'), 0, 255),
    b: clamp(Number.parseFloat(parts[2] ?? '0'), 0, 255),
    a: clamp(Number.parseFloat(parts[3] ?? '1'), 0, 1),
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
  return `rgba(${Math.round(clamp(color.r, 0, 255))}, ${Math.round(clamp(color.g, 0, 255))}, ${Math.round(clamp(color.b, 0, 255))}, ${clamp(color.a, 0, 1).toFixed(3).replace(/\.?0+$/, '')})`;
}

function mixRgbColors(from: string, to: string, factor: number): string {
  const start = parseColor(from);
  const end = parseColor(to);

  if (!start || !end) {
    return factor < 0.5 ? from : to;
  }

  const t = clamp(factor, 0, 1);

  return toRgbaString({
    r: start.r + (end.r - start.r) * t,
    g: start.g + (end.g - start.g) * t,
    b: start.b + (end.b - start.b) * t,
    a: 1,
  });
}

function rgbToHsl(color: RgbaColor): { h: number; s: number; l: number } {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return {
    h: hue * 60,
    s: saturation,
    l: lightness,
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;

  if (value < 0) {
    value += 1;
  }
  if (value > 1) {
    value -= 1;
  }
  if (value < 1 / 6) {
    return p + (q - p) * 6 * value;
  }
  if (value < 1 / 2) {
    return q;
  }
  if (value < 2 / 3) {
    return p + (q - p) * (2 / 3 - value) * 6;
  }
  return p;
}

function hslToRgba(h: number, s: number, l: number): RgbaColor {
  if (s === 0) {
    const channel = l * 255;

    return {
      r: channel,
      g: channel,
      b: channel,
      a: 1,
    };
  }

  const normalizedHue = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToRgb(p, q, normalizedHue + 1 / 3) * 255,
    g: hueToRgb(p, q, normalizedHue) * 255,
    b: hueToRgb(p, q, normalizedHue - 1 / 3) * 255,
    a: 1,
  };
}

function mixHslColors(from: string, to: string, factor: number): string {
  const start = parseColor(from);
  const end = parseColor(to);

  if (!start || !end) {
    return factor < 0.5 ? from : to;
  }

  const left = rgbToHsl(start);
  const right = rgbToHsl(end);
  const t = clamp(factor, 0, 1);
  const hueDelta = ((((right.h - left.h) % 360) + 540) % 360) - 180;
  const mixed = hslToRgba(
    left.h + hueDelta * t,
    left.s + (right.s - left.s) * t,
    left.l + (right.l - left.l) * t,
  );

  return toRgbaString(mixed);
}

function relativeLuminance(color: RgbaColor): number {
  const channels = [color.r, color.g, color.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function isDarkSurface(color: string): boolean {
  const parsed = parseColor(color);
  return parsed ? relativeLuminance(parsed) < 0.4 : true;
}

function normalizeShadeCount(shadeCount: number): number {
  if (!Number.isFinite(shadeCount) || shadeCount < 0) {
    return 1;
  }

  return Math.floor(shadeCount);
}

function validateOptions(options: CandleHeatmapOptions): void {
  const {
    min,
    minThreshold,
    midpoint,
    maxThreshold,
    max,
  } = options.domain;

  if (!(min < midpoint && midpoint < max)) {
    throw new Error('Candle heatmap domain must satisfy min < midpoint < max.');
  }

  if (
    minThreshold !== undefined &&
    !(min <= minThreshold && minThreshold <= midpoint)
  ) {
    throw new Error('Candle heatmap minThreshold must satisfy min <= minThreshold <= midpoint.');
  }

  if (
    maxThreshold !== undefined &&
    !(midpoint <= maxThreshold && maxThreshold <= max)
  ) {
    throw new Error('Candle heatmap maxThreshold must satisfy midpoint <= maxThreshold <= max.');
  }
}

function quantizeIntensity(normalizedDistance: number, shadeCount: number): number {
  const clampedDistance = clamp(normalizedDistance, 0, 1);
  const steps = shadeCount === 0 ? CONTINUOUS_SHADE_STEPS : Math.max(shadeCount, 1);

  if (steps === 1) {
    return 1;
  }

  const shadeIndex = Math.min(steps, Math.floor(clampedDistance * steps) + 1);
  return shadeIndex / steps;
}

function resolveNeutralHueBase(backgroundColor: string, darkSurface: boolean): string {
  return mixRgbColors(
    backgroundColor,
    darkSurface ? DARK_THEME_NEUTRAL_TARGET : LIGHT_THEME_NEUTRAL_TARGET,
    darkSurface ? DARK_THEME_NEUTRAL_MIX : LIGHT_THEME_NEUTRAL_MIX,
  );
}

function resolveColorFromEdge(
  edgeColor: string,
  intensity: number,
  shader: CandleHeatmapOptions['shader'],
  backgroundColor: string,
  darkSurface: boolean,
): string {
  if (shader === 'alpha') {
    const minAlpha = darkSurface ? DARK_THEME_MIN_ALPHA : LIGHT_THEME_MIN_ALPHA;
    const alpha = minAlpha + (1 - minAlpha) * clamp(intensity, 0, 1);
    return withAlpha(edgeColor, alpha);
  }

  return mixHslColors(
    resolveNeutralHueBase(backgroundColor, darkSurface),
    edgeColor,
    clamp(intensity, 0, 1),
  );
}

function resolveVariantDistance(
  value: number,
  options: CandleHeatmapOptions,
): { variant: MetricStyleVariant; normalizedDistance: number } {
  const {
    min,
    minThreshold,
    midpoint,
    maxThreshold,
    max,
  } = options.domain;
  const clampedValue = clamp(value, min, max);

  if (clampedValue <= min) {
    return {
      variant: 'secondary',
      normalizedDistance: 1,
    };
  }

  if (clampedValue >= max) {
    return {
      variant: 'primary',
      normalizedDistance: 1,
    };
  }

  if (options.shadeCount === 1) {
    return {
      variant: clampedValue < midpoint ? 'secondary' : 'primary',
      normalizedDistance: 1,
    };
  }

  if (clampedValue < midpoint) {
    if (minThreshold !== undefined && clampedValue <= minThreshold) {
      return {
        variant: 'secondary',
        normalizedDistance: 1,
      };
    }

    const lowerEdge = minThreshold ?? min;
    const span = midpoint - lowerEdge;

    return {
      variant: 'secondary',
      normalizedDistance:
        span <= 0 ? 1 : clamp(1 - (clampedValue - lowerEdge) / span, 0, 1),
    };
  }

  if (maxThreshold !== undefined && clampedValue >= maxThreshold) {
    return {
      variant: 'primary',
      normalizedDistance: 1,
    };
  }

  const upperEdge = maxThreshold ?? max;
  const span = upperEdge - midpoint;

  return {
    variant: 'primary',
    normalizedDistance: span <= 0 ? 1 : clamp((clampedValue - midpoint) / span, 0, 1),
  };
}

export function resolveCandleHeatmapColor(
  input: ResolveCandleHeatmapColorInput,
): CandleHeatmapColorResolution | null {
  if (!Number.isFinite(input.value)) {
    return null;
  }

  const options = mergeCandleHeatmapOptions(input.options);
  validateOptions(options);

  const backgroundColor = input.backgroundColor ?? DEFAULT_SURFACE_BACKGROUND;
  const darkSurface = isDarkSurface(backgroundColor);
  const { variant, normalizedDistance } = resolveVariantDistance(input.value as number, options);
  const intensity = quantizeIntensity(normalizedDistance, normalizeShadeCount(options.shadeCount));
  const edgeColor = resolveMetricStyleToken(
    input.metricStyles,
    options.metricStyleKey,
    variant,
  ).color;

  return {
    color: resolveColorFromEdge(
      edgeColor,
      intensity,
      options.shader,
      backgroundColor,
      darkSurface,
    ),
    variant,
    intensity,
  };
}

export function buildCandleHeatmapSeriesData<TBar extends CandleHeatmapBarLike>(
  input: BuildCandleHeatmapSeriesDataInput<TBar>,
): CandlestickData<TimeValue>[] {
  return input.bars.map((bar, index, bars) => {
    const resolution = resolveCandleHeatmapColor({
      value: input.getValue(bar, index, bars),
      metricStyles: input.metricStyles,
      options: input.options,
      backgroundColor: input.backgroundColor,
    });

    return {
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      ...(resolution
        ? {
            color: resolution.color,
            borderColor: resolution.color,
            wickColor: resolution.color,
          }
        : {}),
    };
  });
}
