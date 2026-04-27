import type {
  DeltaSummarySeriesPartialOptions,
  FootprintSeriesPartialOptions,
  SessionVolumeProfilePartialOptions,
  VolumeFootprintPartialOptions,
  VolumeProfilePartialOptions,
} from '../models/options';
import { DEFAULT_FOOTPRINT_STYLE, createFootprintMetricPresets } from '../models/options';

export interface OrderFlowStylePresetPack {
  id: string;
  label: string;
  footprint?: FootprintSeriesPartialOptions;
  volumeFootprint?: VolumeFootprintPartialOptions;
  volumeProfile?: VolumeProfilePartialOptions;
  sessionVolumeProfile?: SessionVolumeProfilePartialOptions;
  deltaSummary?: DeltaSummarySeriesPartialOptions;
}

const classicFootprintStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  textColor: '#111827',
  neutralTextColor: '#111827',
  bidTextColor: '#dc2626',
  askTextColor: '#1d4ed8',
  positiveDeltaColor: '#16a34a',
  negativeDeltaColor: '#dc2626',
  bullishCandleColor: '#16a34a',
  bearishCandleColor: '#dc2626',
  candleWickColor: '#111827',
  candleBorderColor: '#111827',
  separatorColor: '#111827',
  separatorFont: '600 12px Arial, sans-serif',
  bidFillColor: 'rgba(255, 255, 255, 0.01)',
  askFillColor: 'rgba(255, 255, 255, 0.01)',
  buyImbalanceColor: '#1d4ed8',
  sellImbalanceColor: '#dc2626',
  metricStyles: {
    metric0: {
      primary: {
        color: '#2563eb',
        font: '700 12px Arial, sans-serif',
      },
      secondary: {
        color: '#dc2626',
      },
    },
    metric1: {
      primary: {
        color: '#16a34a',
        font: '700 12px Arial, sans-serif',
      },
      secondary: {
        color: '#dc2626',
      },
    },
  },
  imbalanceMetricStyleKey: 'metric0' as const,
  positiveImbalanceTextColor: '#2563eb',
  positiveImbalanceTextFont: '700 12px Arial, sans-serif',
  negativeImbalanceTextColor: '#dc2626',
  negativeImbalanceTextFont: '700 12px Arial, sans-serif',
  diagonalDominanceColor: '#2563eb',
  diagonalDominanceFont: '700 12px Arial, sans-serif',
  buyImbalanceFillColor: 'rgba(255, 255, 255, 0)',
  sellImbalanceFillColor: 'rgba(255, 255, 255, 0)',
  stackedBuyImbalanceFillColor: 'rgba(255, 255, 255, 0)',
  stackedSellImbalanceFillColor: 'rgba(255, 255, 255, 0)',
  stackedImbalanceOutline: '#111827',
  ladderBorderColor: '#111827',
  cellBorderColor: '#111827',
};

const darkReferenceStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 11,
  textColor: '#e5e7eb',
  neutralTextColor: '#cbd5e1',
  bidTextColor: '#f87171',
  askTextColor: '#e5e7eb',
  positiveDeltaColor: '#22c55e',
  negativeDeltaColor: '#f87171',
  bullishCandleColor: '#22c55e',
  bearishCandleColor: '#ef4444',
  candleWickColor: '#f8fafc',
  candleBorderColor: '#e5e7eb',
  separatorColor: '#e5e7eb',
  separatorFont: '400 11px Arial, sans-serif',
  bidFillColor: 'rgba(148, 163, 184, 0.1)',
  askFillColor: 'rgba(226, 232, 240, 0.08)',
  buyImbalanceColor: '#38bdf8',
  sellImbalanceColor: '#f87171',
  metricStyles: {
    metric0: {
      primary: {
        color: '#60a5fa',
        font: '700 11px Arial, sans-serif',
      },
      secondary: {
        color: '#f87171',
      },
    },
    metric1: {
      primary: {
        color: '#22c55e',
        font: '700 11px Arial, sans-serif',
      },
      secondary: {
        color: '#f87171',
      },
    },
  },
  imbalanceMetricStyleKey: 'metric0' as const,
  positiveImbalanceTextColor: '#60a5fa',
  positiveImbalanceTextFont: '700 11px Arial, sans-serif',
  negativeImbalanceTextColor: '#f87171',
  negativeImbalanceTextFont: '700 11px Arial, sans-serif',
  diagonalDominanceColor: '#60a5fa',
  diagonalDominanceFont: '700 11px Arial, sans-serif',
  buyImbalanceFillColor: 'rgba(34, 197, 94, 0.12)',
  sellImbalanceFillColor: 'rgba(239, 68, 68, 0.12)',
  stackedBuyImbalanceFillColor: 'rgba(34, 197, 94, 0.2)',
  stackedSellImbalanceFillColor: 'rgba(239, 68, 68, 0.2)',
  stackedImbalanceOutline: 'rgba(248, 250, 252, 0.8)',
  ladderBorderColor: 'rgba(148, 163, 184, 0.45)',
  cellBorderColor: 'rgba(148, 163, 184, 0.42)',
};

const classicMetrics = createFootprintMetricPresets({
  ...DEFAULT_FOOTPRINT_STYLE,
  ...classicFootprintStyle,
});
const darkMetrics = createFootprintMetricPresets({
  ...DEFAULT_FOOTPRINT_STYLE,
  ...darkReferenceStyle,
});
const classicDeltaBadge = {
  ...classicMetrics.delta,
  style: {
    ...classicMetrics.delta.style,
    paddingX: 6,
    paddingY: 2,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
};
const darkDeltaBadge = {
  ...darkMetrics.delta,
  style: {
    ...darkMetrics.delta.style,
    paddingX: 6,
    paddingY: 2,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
};

function createOrderFlowDeltaMetric(baseMetric: typeof classicDeltaBadge) {
  return {
    ...baseMetric,
    label: undefined,
    metricStyleKey: 'metric0' as const,
    formatter: ({ rawValue }: { rawValue: number | null }) => rawValue ?? null,
    style: {
      ...baseMetric.style,
      paddingX: 0,
      paddingY: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      textColor: '#111827',
      neutralTextColor: '#111827',
      fontWeight: '700',
    },
  };
}

export const CLASSIC_REFERENCE_FOOTPRINT_OPTIONS: FootprintSeriesPartialOptions = {
  layout: {
    barWidth: {
      min: 22,
      max: '100%',
    },
  },
  candle: {
    widthRatio: 0.08,
    minWidth: 3,
    maxWidth: 8,
    gap: 0,
  },
  ladder: {
    showHeatmap: false,
    borderWidth: 1,
    cellBorderWidth: 1,
    highlightImbalances: false,
    highlightStackedImbalances: false,
    minOpacity: 0,
    maxOpacity: 0,
  },
  pointOfControl: {
    visible: false,
  },
  summary: {
    stackGap: 4,
    items: [classicDeltaBadge],
  },
  style: classicFootprintStyle,
};

export const ORDER_FLOW_DELTA_FOOTPRINT_OPTIONS: FootprintSeriesPartialOptions = {
  ...CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
  ladder: {
    ...CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.ladder,
    showHeatmap: true,
    bidAskFillMode: 'by-total-volume',
    minOpacity: 0.08,
    maxOpacity: 0.28,
  },
  shading: {
    bidAskMetric: 'volume/max',
    neutralScale: {
      range: {
        from: 0.12,
        to: 1,
        clamp: true,
        invert: false,
      },
      stops: [
        { offset: 0, color: 'rgba(148, 163, 184, 0.03)' },
        { offset: 1, color: 'rgba(148, 163, 184, 0.16)' },
      ],
    },
  },
};

export const DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS: FootprintSeriesPartialOptions = {
  layout: {
    barWidth: {
      min: 26,
      max: '100%',
    },
  },
  candle: {
    widthRatio: 0.1,
    minWidth: 3,
    maxWidth: 10,
    gap: 0,
  },
  ladder: {
    showHeatmap: false,
    highlightImbalances: true,
    highlightStackedImbalances: true,
    borderWidth: 1,
    cellBorderWidth: 1,
    stackedImbalanceBorderWidth: 1.25,
    minOpacity: 0.1,
    maxOpacity: 0.9,
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
  },
  summary: {
    stackGap: 4,
    items: [darkDeltaBadge],
  },
  style: darkReferenceStyle,
};

export const DARK_REFERENCE_DELTA_SUMMARY_OPTIONS: DeltaSummarySeriesPartialOptions = {
  columnWidth: {
    min: 24,
    max: '100%',
  },
  labelWidth: 112,
  fontFamily: 'Arial, sans-serif',
  fontSize: 11,
  labelBackgroundColor: 'rgba(30, 41, 59, 0.9)',
  labelTextColor: '#e5e7eb',
  cellBorderColor: 'rgba(15, 23, 42, 0.72)',
  cellBorderWidth: 1,
  minOpacity: 0.28,
  maxOpacity: 0.94,
  rowStyles: {
    delta: {
      positiveFillColor: '#22c55e',
      negativeFillColor: '#ef4444',
      neutralFillColor: '#64748b',
      textColor: '#0f172a',
    },
    maxDelta: {
      positiveFillColor: '#86efac',
      negativeFillColor: '#fca5a5',
      neutralFillColor: '#cbd5e1',
      textColor: '#0f172a',
    },
    minDelta: {
      positiveFillColor: '#86efac',
      negativeFillColor: '#fca5a5',
      neutralFillColor: '#cbd5e1',
      textColor: '#0f172a',
    },
    cumulativeDelta: {
      positiveFillColor: '#22c55e',
      negativeFillColor: '#ef4444',
      neutralFillColor: '#64748b',
      textColor: '#0f172a',
    },
    cumulativeDeltaToVolumeRatio: {
      positiveFillColor: '#bbf7d0',
      negativeFillColor: '#fecaca',
      neutralFillColor: '#e2e8f0',
      textColor: '#0f172a',
    },
    volume: {
      positiveFillColor: '#2563eb',
      negativeFillColor: '#2563eb',
      neutralFillColor: '#2563eb',
      textColor: '#eff6ff',
    },
  },
};

export const CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS: DeltaSummarySeriesPartialOptions = {
  ...DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  labelBackgroundColor: 'rgba(156, 163, 175, 0.5)',
  labelTextColor: '#111827',
  cellBorderColor: '#111827',
  rowStyles: {
    delta: {
      positiveFillColor: '#86efac',
      negativeFillColor: '#fca5a5',
      neutralFillColor: '#e5e7eb',
      textColor: '#111827',
    },
    maxDelta: {
      positiveFillColor: '#86efac',
      negativeFillColor: '#fca5a5',
      neutralFillColor: '#e5e7eb',
      textColor: '#111827',
    },
    minDelta: {
      positiveFillColor: '#86efac',
      negativeFillColor: '#fca5a5',
      neutralFillColor: '#e5e7eb',
      textColor: '#111827',
    },
    cumulativeDelta: {
      positiveFillColor: '#4ade80',
      negativeFillColor: '#f87171',
      neutralFillColor: '#e5e7eb',
      textColor: '#111827',
    },
    cumulativeDeltaToVolumeRatio: {
      positiveFillColor: '#bbf7d0',
      negativeFillColor: '#fecaca',
      neutralFillColor: '#e5e7eb',
      textColor: '#111827',
    },
    volume: {
      positiveFillColor: '#60a5fa',
      negativeFillColor: '#60a5fa',
      neutralFillColor: '#60a5fa',
      textColor: '#eff6ff',
    },
  },
};

export const CORN_REFERENCE_FOOTPRINT_OPTIONS: FootprintSeriesPartialOptions = {
  ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
  candle: {
    ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.candle,
    widthRatio: 0.08,
    maxWidth: 8,
  },
  ladder: {
    ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.ladder,
    showHeatmap: false,
    minOpacity: 0,
    maxOpacity: 0,
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: '#111827',
    borderWidth: 1.25,
  },
  style: {
    ...darkReferenceStyle,
    bidFillColor: 'rgba(255, 255, 255, 0.02)',
    askFillColor: 'rgba(255, 255, 255, 0.02)',
    candleBorderColor: '#e5e7eb',
  },
};

export const VOLUME_FOOTPRINT_REFERENCE_OPTIONS: VolumeFootprintPartialOptions = {
  ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
  candle: {
    visible: false,
  },
  layout: {
    barWidth: {
      min: 30,
      max: '100%',
    },
  },
  ladder: {
    ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.ladder,
    showHeatmap: true,
    minOpacity: 0.18,
    maxOpacity: 0.52,
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    borderColor: '#111827',
    borderWidth: 1.25,
  },
  style: {
    ...darkReferenceStyle,
    textColor: '#111827',
    neutralTextColor: '#111827',
    askFillColor: 'rgba(226, 232, 240, 0.46)',
    bidFillColor: 'rgba(203, 213, 225, 0.36)',
    buyImbalanceFillColor: 'rgba(34, 197, 94, 0.12)',
    sellImbalanceFillColor: 'rgba(239, 68, 68, 0.12)',
    candleBorderColor: '#16a34a',
  },
};

export const LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS: VolumeProfilePartialOptions = {
  align: 'left',
  widthRatio: 0.12,
  pointOfControl: {
    backgroundColor: 'rgba(17, 24, 39, 0.18)',
    borderColor: '#111827',
    lineWidth: 1.25,
  },
  style: {
    profileBidColor: 'rgba(45, 212, 191, 0.68)',
    profileAskColor: 'rgba(255, 0, 0, 0.85)',
    valueAreaColor: 'rgba(255, 255, 255, 0.04)',
    sessionLabelColor: '#e5e7eb',
  },
};

export const SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS: VolumeProfilePartialOptions = {
  align: 'left',
  widthRatio: 0.12,
  pointOfControl: {
    backgroundColor: 'rgba(17, 24, 39, 0.2)',
    borderColor: '#111827',
    lineWidth: 1.2,
  },
  style: {
    profileBidColor: 'rgba(45, 212, 191, 0.68)',
    profileAskColor: 'rgba(255, 0, 0, 0.85)',
    valueAreaColor: 'rgba(255, 255, 255, 0.05)',
    sessionLabelColor: '#e5e7eb',
  },
};

export const SHADED_REFERENCE_FOOTPRINT_OPTIONS: FootprintSeriesPartialOptions = {
  ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
  candle: {
    ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.candle,
    widthRatio: 0.06,
    maxWidth: 6,
  },
  ladder: {
    ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.ladder,
    showHeatmap: true,
    minOpacity: 0.14,
    maxOpacity: 0.48,
  },
  shading: {
    bidAskMetric: 'volume/max',
    bidScale: {
      range: {
        from: 0.15,
        to: 1,
        clamp: true,
        invert: false,
      },
      stops: [
        { offset: 0, color: 'rgba(248, 113, 113, 0)' },
        { offset: 1, color: 'rgba(248, 113, 113, 0.32)' },
      ],
    },
    askScale: {
      range: {
        from: 0.15,
        to: 1,
        clamp: true,
        invert: false,
      },
      stops: [
        { offset: 0, color: 'rgba(187, 247, 208, 0)' },
        { offset: 1, color: 'rgba(187, 247, 208, 0.34)' },
      ],
    },
    neutralScale: {
      range: {
        from: 0.15,
        to: 1,
        clamp: true,
        invert: false,
      },
      stops: [
        { offset: 0, color: 'rgba(255, 255, 255, 0)' },
        { offset: 1, color: 'rgba(255, 255, 255, 0.18)' },
      ],
    },
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'rgba(17, 24, 39, 0.14)',
    borderColor: '#111827',
    borderWidth: 1.1,
  },
  style: {
    ...darkReferenceStyle,
    bidTextColor: '#111827',
    askTextColor: '#111827',
    neutralTextColor: '#111827',
    bidFillColor: 'rgba(248, 113, 113, 0.32)',
    askFillColor: 'rgba(187, 247, 208, 0.34)',
    buyImbalanceFillColor: 'rgba(34, 197, 94, 0.18)',
    sellImbalanceFillColor: 'rgba(239, 68, 68, 0.18)',
    stackedBuyImbalanceFillColor: 'rgba(34, 197, 94, 0.26)',
    stackedSellImbalanceFillColor: 'rgba(239, 68, 68, 0.26)',
    stackedImbalanceOutline: 'rgba(15, 23, 42, 0.72)',
  },
};

export const SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS: DeltaSummarySeriesPartialOptions = {
  ...DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  rows: ['delta', 'cumulativeDelta', 'volume'],
  rowLabels: {
    delta: 'Delta',
    cumulativeDelta: 'Cum. Delta',
    volume: 'Volume',
  },
};

export const ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS: FootprintSeriesPartialOptions = {
  layout: {
    barWidth: {
      min: 24,
      max: '100%',
    },
  },
  candle: {
    visible: true,
    position: 'left',
    widthRatio: 0.06,
    minWidth: 2,
    maxWidth: 4,
    gap: 0,
    showWicks: false,
  },
  ladder: {
    textMode: 'bid-ask',
    showHeatmap: true,
    bidAskFillMode: 'by-delta',
    highlightImbalances: false,
    highlightStackedImbalances: false,
    highlightImbalanceText: true,
    highlightDiagonalDominance: false,
    diagonalDominanceFactor: 3,
    separatorMode: 'letter',
    separatorLabel: 'x',
    separatorGap: 10,
    borderWidth: 0,
    cellBorderWidth: 0,
    minOpacity: 0.16,
    maxOpacity: 0.84,
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'transparent',
    borderColor: '#111827',
    borderWidth: 1.1,
  },
  summary: {
    items: [createOrderFlowDeltaMetric(classicDeltaBadge)],
  },
  style: {
    ...classicFootprintStyle,
    textColor: '#111827',
    neutralTextColor: '#111827',
    bidTextColor: '#111827',
    askTextColor: '#111827',
    bullishCandleColor: '#22c55e',
    bearishCandleColor: '#ef4444',
    candleWickColor: 'rgba(0, 0, 0, 0)',
    candleBorderColor: 'rgba(0, 0, 0, 0)',
    bidFillColor: 'rgba(239, 68, 68, 0.14)',
    askFillColor: 'rgba(34, 197, 94, 0.14)',
    separatorColor: '#111827',
    separatorFont: '400 12px Arial, sans-serif',
    metricStyles: {
      ...classicFootprintStyle.metricStyles,
      metric0: {
        primary: {
          color: '#2f6dd0',
          font: '700 12px Arial, sans-serif',
        },
        secondary: {
          color: '#dc2626',
        },
      },
    },
    imbalanceMetricStyleKey: 'metric0',
    positiveImbalanceTextColor: '#2f6dd0',
    positiveImbalanceTextFont: '700 12px Arial, sans-serif',
    negativeImbalanceTextColor: '#dc2626',
    negativeImbalanceTextFont: '700 12px Arial, sans-serif',
    diagonalDominanceColor: '#2f6dd0',
    diagonalDominanceFont: '700 12px Arial, sans-serif',
    ladderBorderColor: 'transparent',
    cellBorderColor: 'transparent',
  },
};

export const ORDER_FLOW_STYLE_PRESETS = {
  modernDark: {
    id: 'modernDark',
    label: 'Modern Dark',
    footprint: {
      pointOfControl: {
        visible: false,
      },
    },
  },
  classicReference: {
    id: 'classicReference',
    label: 'Classic Reference',
    footprint: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
    deltaSummary: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  darkReferenceBase: {
    id: 'darkReferenceBase',
    label: 'Dark Reference Base',
    footprint: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
    deltaSummary: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  cornReference: {
    id: 'cornReference',
    label: 'Corn Reference',
    footprint: CORN_REFERENCE_FOOTPRINT_OPTIONS,
    deltaSummary: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  volumeFootprintReference: {
    id: 'volumeFootprintReference',
    label: 'Volume Footprint Reference',
    volumeFootprint: VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
    volumeProfile: LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  },
  shadedReference: {
    id: 'shadedReference',
    label: 'Shaded Reference',
    footprint: SHADED_REFERENCE_FOOTPRINT_OPTIONS,
    volumeProfile: SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
    deltaSummary: SHADED_REFERENCE_DELTA_SUMMARY_OPTIONS,
  },
  orderFlowReference: {
    id: 'orderFlowReference',
    label: 'Order Flow Reference',
    footprint: ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS,
  },
} satisfies Record<string, OrderFlowStylePresetPack>;
