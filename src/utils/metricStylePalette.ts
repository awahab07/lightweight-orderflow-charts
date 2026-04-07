import type {
  MetricStyleKey,
  MetricStylePalette,
  MetricStyleToken,
  MetricStyleVariant,
  MetricStyleVariantMode,
} from '../models/options';

export const METRIC_STYLE_KEYS: MetricStyleKey[] = [
  'metric0',
  'metric1',
  'metric2',
  'metric3',
  'metric4',
  'metric5',
  'metric6',
  'metric7',
  'metric8',
  'metric9',
];

function metricStyleIndex(key: MetricStyleKey): number {
  return Number(key.replace('metric', ''));
}

export function resolveMetricStyleVariant(
  rawValue: number | null,
  mode: MetricStyleVariantMode = 'auto',
): MetricStyleVariant {
  if (mode === 'primary' || mode === 'secondary') {
    return mode;
  }

  return rawValue !== null && rawValue < 0 ? 'secondary' : 'primary';
}

export function resolveMetricStyleToken(
  palette: MetricStylePalette,
  key: MetricStyleKey,
  variant: MetricStyleVariant = 'primary',
): MetricStyleToken {
  for (let index = metricStyleIndex(key); index >= 0; index -= 1) {
    const entry = palette[METRIC_STYLE_KEYS[index]];

    if (!entry?.primary) {
      continue;
    }

    if (variant === 'secondary' && index === metricStyleIndex(key) && entry.secondary) {
      const merged = {
        ...entry.primary,
        ...entry.secondary,
      };

      if (!merged.color || !merged.font) {
        throw new Error(`Metric style "${key}.secondary" must resolve both color and font.`);
      }

      return merged;
    }

    if (!entry.primary.color || !entry.primary.font) {
      throw new Error(
        `Metric style "${METRIC_STYLE_KEYS[index]}.primary" must include color and font.`,
      );
    }

    return entry.primary;
  }

  throw new Error('Metric style palette requires "metric0.primary" with both color and font.');
}

export function parseMetricBorderShorthand(border?: string): {
  color: string | null;
  width: number;
} {
  if (!border || !border.trim()) {
    return {
      color: null,
      width: 0,
    };
  }

  const trimmed = border.trim();
  const widthMatch = trimmed.match(/(\d+(?:\.\d+)?)px/);
  const width = widthMatch ? Number(widthMatch[1]) : 0;
  const color = trimmed
    .replace(/(\d+(?:\.\d+)?)px/, '')
    .replace(/\b(solid|dashed|dotted|double|none)\b/g, '')
    .trim();

  return {
    color: color || null,
    width,
  };
}
