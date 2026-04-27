import type {
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  LineSeriesPartialOptions,
} from 'lightweight-charts';

import type {
  CandleHeatmapPartialOptions,
  DeltaSummarySeriesPartialOptions,
  FootprintSeriesPartialOptions,
  SessionVolumeProfilePartialOptions,
  VolumeFootprintPartialOptions,
  VolumeProfilePartialOptions,
} from '../models/options';
import type { OrderFlowStylePresetPack } from './orderFlowStylePresets';
import {
  CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS,
  CLASSIC_REFERENCE_FOOTPRINT_OPTIONS,
  CORN_REFERENCE_FOOTPRINT_OPTIONS,
  DARK_REFERENCE_DELTA_SUMMARY_OPTIONS,
  DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS,
  LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS,
  SHADED_REFERENCE_FOOTPRINT_OPTIONS,
  SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS,
  VOLUME_FOOTPRINT_REFERENCE_OPTIONS,
} from './orderFlowStylePresets';

export interface OrderFlowSurfaceTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  borderColor: string;
  crosshairColor: string;
  panelBackground: string;
  panelBorder: string;
}

export interface OrderFlowThemePresetPack extends OrderFlowStylePresetPack {
  mode: 'dark' | 'light';
  description: string;
  surface: OrderFlowSurfaceTheme;
  candleSeries?: CandlestickSeriesPartialOptions;
  candleHeatmap?: CandleHeatmapPartialOptions;
  volumeSeries?: HistogramSeriesPartialOptions;
  volumeDeltaPivotSeries?: CandlestickSeriesPartialOptions;
  volumeDeltaPivotBaseline?: LineSeriesPartialOptions;
}

type CandleSeriesStyleOverrides = Pick<
  CandlestickSeriesPartialOptions,
  'borderDownColor' | 'borderUpColor' | 'borderVisible' | 'wickDownColor' | 'wickUpColor'
>;

function createCandleSeriesOptions(
  upColor: string,
  downColor: string,
  borderVisibleOrOverrides: boolean | CandleSeriesStyleOverrides = false,
): CandlestickSeriesPartialOptions {
  const overrides =
    typeof borderVisibleOrOverrides === 'boolean'
      ? { borderVisible: borderVisibleOrOverrides }
      : borderVisibleOrOverrides;

  return {
    upColor,
    downColor,
    wickUpColor: overrides.wickUpColor ?? upColor,
    wickDownColor: overrides.wickDownColor ?? downColor,
    borderUpColor: overrides.borderUpColor ?? upColor,
    borderDownColor: overrides.borderDownColor ?? downColor,
    borderVisible: overrides.borderVisible ?? false,
    lastValueVisible: false,
    priceLineVisible: false,
  };
}

function createVolumeSeriesOptions(
  upColor: string,
  _downColor: string,
): HistogramSeriesPartialOptions {
  return {
    priceFormat: { type: 'volume' },
    lastValueVisible: false,
    priceLineVisible: false,
    color: upColor,
    base: 0,
  };
}

function createCandleHeatmapOptions(
  upColor: string,
  downColor: string,
  overrides: CandleHeatmapPartialOptions = {},
): CandleHeatmapPartialOptions {
  return {
    downColor,
    upColor,
    wickDownColor: overrides.wickDownColor ?? downColor,
    wickUpColor: overrides.wickUpColor ?? upColor,
    borderDownColor: overrides.borderDownColor ?? downColor,
    borderUpColor: overrides.borderUpColor ?? upColor,
    borderVisible: overrides.borderVisible ?? true,
    shadeWicks: overrides.shadeWicks ?? false,
    ...overrides,
  };
}

function createVolumeDeltaPivotSeriesOptions(
  upColor: string,
  downColor: string,
): CandlestickSeriesPartialOptions {
  return createCandleSeriesOptions(upColor, downColor, {
    borderVisible: true,
    borderUpColor: 'rgba(148, 163, 184, 0.42)',
    borderDownColor: 'rgba(148, 163, 184, 0.42)',
  });
}

function createDarkVolumeFootprintTheme(
  bidFillColor: string,
  askFillColor: string,
  textColor: string,
  pocBorderColor: string,
): VolumeFootprintPartialOptions {
  return {
    style: {
      ...VOLUME_FOOTPRINT_REFERENCE_OPTIONS.style,
      textColor,
      neutralTextColor: textColor,
      bidFillColor,
      askFillColor,
      candleBorderColor: pocBorderColor,
      ladderBorderColor: pocBorderColor,
      cellBorderColor: pocBorderColor,
    },
    pointOfControl: {
      ...VOLUME_FOOTPRINT_REFERENCE_OPTIONS.pointOfControl,
      borderColor: pocBorderColor,
    },
    summary: {
      items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
    },
  };
}

function createLightVolumeFootprintTheme(
  bidFillColor: string,
  askFillColor: string,
  textColor: string,
  pocBorderColor: string,
): VolumeFootprintPartialOptions {
  return {
    style: {
      ...VOLUME_FOOTPRINT_REFERENCE_OPTIONS.style,
      textColor,
      neutralTextColor: textColor,
      bidFillColor,
      askFillColor,
      candleBorderColor: pocBorderColor,
      ladderBorderColor: pocBorderColor,
      cellBorderColor: pocBorderColor,
    },
    pointOfControl: {
      ...VOLUME_FOOTPRINT_REFERENCE_OPTIONS.pointOfControl,
      borderColor: pocBorderColor,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    summary: {
      items: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.summary?.items,
    },
  };
}

function createSessionProfileTheme(
  profile: VolumeProfilePartialOptions,
): SessionVolumeProfilePartialOptions {
  return {
    pointOfControl: profile.pointOfControl,
    style: profile.style,
  };
}

const DARK_POINT_OF_CONTROL = {
  borderColor: 'rgba(248, 250, 252, 0.88)',
  backgroundColor: 'rgba(248, 250, 252, 0.08)',
};

const LIGHT_POINT_OF_CONTROL = {
  borderColor: 'rgba(15, 23, 42, 0.82)',
  backgroundColor: 'rgba(15, 23, 42, 0.06)',
};

const DARK_DELTA_SUMMARY_LABEL = 'rgba(2, 6, 23, 0.98)';
const LIGHT_DELTA_SUMMARY_LABEL = 'rgba(255, 255, 255, 0.98)';

const midnightTerminalSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#050816',
  textColor: '#e2e8f0',
  gridColor: 'rgba(71, 85, 105, 0.18)',
  borderColor: 'rgba(71, 85, 105, 0.32)',
  crosshairColor: 'rgba(248, 250, 252, 0.22)',
  panelBackground: 'rgba(5, 8, 22, 0.9)',
  panelBorder: '1px solid rgba(71, 85, 105, 0.28)',
};

const chartDarkProSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#131722',
  textColor: '#d1d4dc',
  gridColor: 'rgba(42, 46, 57, 0.8)',
  borderColor: 'rgba(42, 46, 57, 1)',
  crosshairColor: 'rgba(120, 123, 134, 0.55)',
  panelBackground: 'rgba(19, 23, 34, 0.96)',
  panelBorder: '1px solid rgba(42, 46, 57, 1)',
};

const depthHeatSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#06111f',
  textColor: '#dbeafe',
  gridColor: 'rgba(56, 189, 248, 0.08)',
  borderColor: 'rgba(56, 189, 248, 0.18)',
  crosshairColor: 'rgba(125, 211, 252, 0.22)',
  panelBackground: 'rgba(7, 24, 39, 0.82)',
  panelBorder: '1px solid rgba(56, 189, 248, 0.16)',
};

const cobaltWorkstationSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#0b1220',
  textColor: '#e5e7eb',
  gridColor: 'rgba(96, 165, 250, 0.1)',
  borderColor: 'rgba(96, 165, 250, 0.2)',
  crosshairColor: 'rgba(191, 219, 254, 0.22)',
  panelBackground: 'rgba(11, 18, 32, 0.82)',
  panelBorder: '1px solid rgba(96, 165, 250, 0.16)',
};

const obsidianMinimalSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#020617',
  textColor: '#e2e8f0',
  gridColor: 'rgba(148, 163, 184, 0.08)',
  borderColor: 'rgba(148, 163, 184, 0.16)',
  crosshairColor: 'rgba(226, 232, 240, 0.2)',
  panelBackground: 'rgba(2, 6, 23, 0.9)',
  panelBorder: '1px solid rgba(148, 163, 184, 0.12)',
};

const paperClassicSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#ffffff',
  textColor: '#111827',
  gridColor: 'rgba(15, 23, 42, 0.08)',
  borderColor: 'rgba(15, 23, 42, 0.2)',
  crosshairColor: 'rgba(15, 23, 42, 0.18)',
  panelBackground: '#ffffff',
  panelBorder: '1px solid rgba(15, 23, 42, 0.14)',
};

const daylightCleanSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#fcfcfb',
  textColor: '#111827',
  gridColor: 'rgba(100, 116, 139, 0.18)',
  borderColor: 'rgba(100, 116, 139, 0.22)',
  crosshairColor: 'rgba(15, 23, 42, 0.22)',
  panelBackground: '#ffffff',
  panelBorder: '1px solid rgba(100, 116, 139, 0.14)',
};

const clinicalHighContrastSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  gridColor: 'rgba(0, 0, 0, 0.1)',
  borderColor: 'rgba(0, 0, 0, 0.24)',
  crosshairColor: 'rgba(0, 0, 0, 0.22)',
  panelBackground: '#ffffff',
  panelBorder: '1px solid rgba(0, 0, 0, 0.2)',
};

const ivoryTerminalSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#fffaf0',
  textColor: '#1f2937',
  gridColor: 'rgba(120, 113, 108, 0.12)',
  borderColor: 'rgba(120, 113, 108, 0.22)',
  crosshairColor: 'rgba(68, 64, 60, 0.18)',
  panelBackground: '#fffdf8',
  panelBorder: '1px solid rgba(120, 113, 108, 0.16)',
};

const frostUiSurface: OrderFlowSurfaceTheme = {
  backgroundColor: '#f1f5f9',
  textColor: '#0f172a',
  gridColor: 'rgba(148, 163, 184, 0.14)',
  borderColor: 'rgba(148, 163, 184, 0.24)',
  crosshairColor: 'rgba(30, 41, 59, 0.18)',
  panelBackground: '#ffffff',
  panelBorder: '1px solid rgba(148, 163, 184, 0.16)',
};

const midnightTerminalVolumeProfile: VolumeProfilePartialOptions = {
  style: {
    ...SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
    profileBidColor: 'rgba(248, 113, 113, 0.72)',
    profileAskColor: 'rgba(96, 165, 250, 0.78)',
    valueAreaColor: 'rgba(59, 130, 246, 0.08)',
    sessionLabelColor: '#dbeafe',
  },
  pointOfControl: {
    ...SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
    borderColor: '#93c5fd',
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
};

const chartDarkProVolumeProfile: VolumeProfilePartialOptions = {
  style: SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
  pointOfControl: SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
};

const depthHeatVolumeProfile: VolumeProfilePartialOptions = {
  style: {
    ...SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
    profileBidColor: 'rgba(248, 113, 113, 0.76)',
    profileAskColor: 'rgba(34, 211, 238, 0.78)',
    valueAreaColor: 'rgba(34, 211, 238, 0.08)',
    sessionLabelColor: '#bae6fd',
  },
  pointOfControl: {
    ...SHADED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.18)',
  },
};

const cobaltWorkstationVolumeProfile: VolumeProfilePartialOptions = {
  style: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
    profileBidColor: 'rgba(248, 113, 113, 0.72)',
    profileAskColor: 'rgba(96, 165, 250, 0.76)',
    valueAreaColor: 'rgba(96, 165, 250, 0.08)',
    sessionLabelColor: '#dbeafe',
  },
  pointOfControl: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
  },
};

const obsidianMinimalVolumeProfile: VolumeProfilePartialOptions = {
  style: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
    profileBidColor: 'rgba(248, 113, 113, 0.58)',
    profileAskColor: 'rgba(203, 213, 225, 0.56)',
    valueAreaColor: 'rgba(255, 255, 255, 0.04)',
    sessionLabelColor: '#e2e8f0',
  },
  pointOfControl: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
};

const paperClassicVolumeProfile: VolumeProfilePartialOptions = {
  style: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.style,
    profileBidColor: 'rgba(220, 38, 38, 0.6)',
    profileAskColor: 'rgba(29, 78, 216, 0.64)',
    valueAreaColor: 'rgba(148, 163, 184, 0.12)',
    sessionLabelColor: '#111827',
  },
  pointOfControl: {
    ...LEFT_ALIGNED_REFERENCE_VOLUME_PROFILE_OPTIONS.pointOfControl,
    borderColor: '#111827',
    backgroundColor: 'rgba(17, 24, 39, 0.1)',
  },
};

const daylightCleanVolumeProfile: VolumeProfilePartialOptions = {
  ...paperClassicVolumeProfile,
  style: {
    ...paperClassicVolumeProfile.style,
    profileBidColor: 'rgba(239, 68, 68, 0.42)',
    profileAskColor: 'rgba(34, 197, 94, 0.42)',
    valueAreaColor: 'rgba(148, 163, 184, 0.08)',
    sessionLabelColor: '#111827',
  },
};

const clinicalHighContrastVolumeProfile: VolumeProfilePartialOptions = {
  ...paperClassicVolumeProfile,
  style: {
    ...paperClassicVolumeProfile.style,
    profileBidColor: 'rgba(0, 0, 0, 0.82)',
    profileAskColor: 'rgba(0, 0, 0, 0.62)',
    valueAreaColor: 'rgba(0, 0, 0, 0.08)',
    sessionLabelColor: '#000000',
  },
  pointOfControl: {
    ...paperClassicVolumeProfile.pointOfControl,
    borderColor: '#000000',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
};

const ivoryTerminalVolumeProfile: VolumeProfilePartialOptions = {
  ...paperClassicVolumeProfile,
  style: {
    ...paperClassicVolumeProfile.style,
    profileBidColor: 'rgba(180, 83, 9, 0.56)',
    profileAskColor: 'rgba(14, 116, 144, 0.58)',
    valueAreaColor: 'rgba(180, 83, 9, 0.08)',
    sessionLabelColor: '#44403c',
  },
  pointOfControl: {
    ...paperClassicVolumeProfile.pointOfControl,
    borderColor: '#92400e',
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
  },
};

const frostUiVolumeProfile: VolumeProfilePartialOptions = {
  ...paperClassicVolumeProfile,
  style: {
    ...paperClassicVolumeProfile.style,
    profileBidColor: 'rgba(239, 68, 68, 0.52)',
    profileAskColor: 'rgba(14, 165, 233, 0.56)',
    valueAreaColor: 'rgba(14, 165, 233, 0.08)',
    sessionLabelColor: '#0f172a',
  },
  pointOfControl: {
    ...paperClassicVolumeProfile.pointOfControl,
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
};

export const ORDER_FLOW_THEME_PRESETS = {
  smoothLight: {
    id: 'smooth-light',
    label: 'Smooth Light',
    mode: 'light',
    description: 'Soft order-flow canvas inspired by clean, letter-delimited ladder layouts.',
    surface: daylightCleanSurface,
    footprint: {
      ladder: {
        ...(ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS.ladder ?? {}),
      },
      candle: {
        ...(ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS.candle ?? {}),
      },
      style: {
        ...(ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS.style ?? {}),
        separatorColor: '#111827',
        separatorFont: '400 12px Arial, sans-serif',
        positiveImbalanceTextColor: '#2f6dd0',
        positiveImbalanceTextFont: '700 12px Arial, sans-serif',
        negativeImbalanceTextColor: '#dc2626',
        negativeImbalanceTextFont: '700 12px Arial, sans-serif',
        diagonalDominanceColor: '#2f6dd0',
        diagonalDominanceFont: '700 12px Arial, sans-serif',
        bidFillColor: 'rgba(239, 68, 68, 0.14)',
        askFillColor: 'rgba(34, 197, 94, 0.14)',
      },
      shading: {
        positiveDeltaScale: {
          range: {
            from: 0,
            to: 1,
            clamp: true,
            invert: false,
          },
          stops: [
            { offset: 0, color: 'rgba(34, 197, 94, 0.06)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.28)' },
          ],
        },
        negativeDeltaScale: {
          range: {
            from: 0,
            to: 1,
            clamp: true,
            invert: false,
          },
          stops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.06)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.28)' },
          ],
        },
        neutralScale: {
          range: {
            from: 0,
            to: 1,
            clamp: true,
            invert: false,
          },
          stops: [
            { offset: 0, color: 'rgba(148, 163, 184, 0.02)' },
            { offset: 1, color: 'rgba(148, 163, 184, 0.1)' },
          ],
        },
      },
      pointOfControl: {
        visible: true,
        ...LIGHT_POINT_OF_CONTROL,
        borderWidth: ORDER_FLOW_REFERENCE_FOOTPRINT_OPTIONS.pointOfControl?.borderWidth,
        backgroundColor: 'transparent',
      },
    },
    volumeFootprint: createLightVolumeFootprintTheme(
      'rgba(239, 68, 68, 0.14)',
      'rgba(34, 197, 94, 0.16)',
      '#111827',
      LIGHT_POINT_OF_CONTROL.borderColor,
    ),
    volumeProfile: daylightCleanVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(daylightCleanVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: 'rgba(248, 250, 252, 1)',
      cellBorderColor: 'rgba(100, 116, 139, 0.22)',
      labelTextColor: '#111827',
      rowStyles: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#16a34a', '#ef4444'),
    candleHeatmap: createCandleHeatmapOptions('#16a34a', '#ef4444', {
      wickUpColor: '#15803d',
      wickDownColor: '#b91c1c',
      borderUpColor: '#15803d',
      borderDownColor: '#b91c1c',
    }),
    volumeSeries: createVolumeSeriesOptions('rgba(22, 163, 74, 0.46)', 'rgba(239, 68, 68, 0.46)'),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#16a34a', '#ef4444'),
  },
  midnightTerminal: {
    id: 'midnight-terminal',
    label: 'Midnight Terminal',
    mode: 'dark',
    description: 'Dense dark terminal with high-contrast grid lines.',
    surface: midnightTerminalSurface,
    footprint: {
      style: {
        ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.style,
        bidTextColor: '#fca5a5',
        askTextColor: '#bfdbfe',
        candleBorderColor: '#93c5fd',
        ladderBorderColor: 'rgba(96, 165, 250, 0.36)',
        cellBorderColor: 'rgba(59, 130, 246, 0.28)',
      },
      pointOfControl: {
        ...DARK_POINT_OF_CONTROL,
        borderWidth: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.pointOfControl?.borderWidth,
      },
      summary: {
        items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createDarkVolumeFootprintTheme(
      'rgba(248, 113, 113, 0.36)',
      'rgba(96, 165, 250, 0.4)',
      '#dbeafe',
      '#93c5fd',
    ),
    volumeProfile: midnightTerminalVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(midnightTerminalVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: DARK_DELTA_SUMMARY_LABEL,
      labelTextColor: '#dbeafe',
      cellBorderColor: 'rgba(59, 130, 246, 0.26)',
      rowStyles: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#34d399', '#f87171'),
    candleHeatmap: createCandleHeatmapOptions('#34d399', '#fb7185', {
      wickUpColor: '#bfdbfe',
      wickDownColor: '#fecaca',
      borderUpColor: '#34d399',
      borderDownColor: '#fb7185',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 8,
      shader: 'alpha',
    }),
    volumeSeries: createVolumeSeriesOptions(
      'rgba(52, 211, 153, 0.55)',
      'rgba(248, 113, 113, 0.55)',
    ),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#34d399', '#f87171'),
  },
  chartDarkPro: {
    id: 'chart-dark-pro',
    label: 'Dark Default',
    mode: 'dark',
    description:
      'Dark default market layout with blue/red price candles and green/red delta panes.',
    surface: chartDarkProSurface,
    footprint: {
      style: SHADED_REFERENCE_FOOTPRINT_OPTIONS.style,
      shading: SHADED_REFERENCE_FOOTPRINT_OPTIONS.shading,
      pointOfControl: {
        ...DARK_POINT_OF_CONTROL,
        borderWidth: SHADED_REFERENCE_FOOTPRINT_OPTIONS.pointOfControl?.borderWidth,
      },
      summary: {
        items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createDarkVolumeFootprintTheme(
      'rgba(203, 213, 225, 0.36)',
      'rgba(187, 247, 208, 0.42)',
      '#e5e7eb',
      '#cbd5e1',
    ),
    volumeProfile: chartDarkProVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(chartDarkProVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: DARK_DELTA_SUMMARY_LABEL,
      labelTextColor: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      cellBorderColor: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.cellBorderColor,
      rowStyles: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#2962ff', '#f23645', {
      borderVisible: true,
      wickUpColor: '#c9cdd4',
      wickDownColor: '#c9cdd4',
    }),
    volumeSeries: createVolumeSeriesOptions('rgba(8, 153, 129, 0.55)', 'rgba(242, 54, 69, 0.55)'),
    candleHeatmap: createCandleHeatmapOptions('#2962ff', '#111827', {
      wickUpColor: '#c9cdd4',
      wickDownColor: '#c9cdd4',
      borderUpColor: '#2962ff',
      borderDownColor: '#111827',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 10,
      shader: 'alpha',
    }),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#089981', '#f23645'),
    volumeDeltaPivotBaseline: {
      color: 'rgba(120, 123, 134, 0.72)',
      lineWidth: 1,
      lineStyle: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    },
  },
  depthHeat: {
    id: 'depth-heat',
    label: 'Depth Heat',
    mode: 'dark',
    description: 'Cool blue emphasis for depth and heatmap-style studies.',
    surface: depthHeatSurface,
    footprint: {
      style: {
        ...SHADED_REFERENCE_FOOTPRINT_OPTIONS.style,
        askFillColor: 'rgba(34, 211, 238, 0.36)',
        buyImbalanceColor: '#22d3ee',
        candleBorderColor: '#67e8f9',
      },
      pointOfControl: {
        ...DARK_POINT_OF_CONTROL,
        borderWidth: SHADED_REFERENCE_FOOTPRINT_OPTIONS.pointOfControl?.borderWidth,
      },
      shading: {
        askScale: {
          ...SHADED_REFERENCE_FOOTPRINT_OPTIONS.shading?.askScale,
          stops: [
            { offset: 0, color: 'rgba(34, 211, 238, 0)' },
            { offset: 1, color: 'rgba(34, 211, 238, 0.36)' },
          ],
        },
      },
      summary: {
        items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createDarkVolumeFootprintTheme(
      'rgba(248, 113, 113, 0.3)',
      'rgba(34, 211, 238, 0.42)',
      '#dbeafe',
      '#22d3ee',
    ),
    volumeProfile: depthHeatVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(depthHeatVolumeProfile),
    deltaSummary: {
      cellBorderColor: 'rgba(34, 211, 238, 0.22)',
      labelBackgroundColor: DARK_DELTA_SUMMARY_LABEL,
      labelTextColor: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      rowStyles: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#22d3ee', '#f87171'),
    volumeSeries: createVolumeSeriesOptions(
      'rgba(34, 211, 238, 0.55)',
      'rgba(248, 113, 113, 0.52)',
    ),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#22d3ee', '#f87171'),
  },
  cobaltWorkstation: {
    id: 'cobalt-workstation',
    label: 'Cobalt Workstation',
    mode: 'dark',
    description: 'Control-room dark palette inspired by workstation layouts.',
    surface: cobaltWorkstationSurface,
    footprint: {
      style: {
        ...DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.style,
        askTextColor: '#bfdbfe',
        candleBorderColor: '#60a5fa',
        ladderBorderColor: 'rgba(96, 165, 250, 0.38)',
        cellBorderColor: 'rgba(96, 165, 250, 0.3)',
      },
      pointOfControl: {
        ...DARK_POINT_OF_CONTROL,
        borderWidth: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.pointOfControl?.borderWidth,
      },
      summary: {
        items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createDarkVolumeFootprintTheme(
      'rgba(248, 113, 113, 0.28)',
      'rgba(96, 165, 250, 0.4)',
      '#dbeafe',
      '#60a5fa',
    ),
    volumeProfile: cobaltWorkstationVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(cobaltWorkstationVolumeProfile),
    deltaSummary: {
      cellBorderColor: 'rgba(96, 165, 250, 0.22)',
      labelBackgroundColor: DARK_DELTA_SUMMARY_LABEL,
      labelTextColor: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      rowStyles: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#60a5fa', '#f87171'),
    candleHeatmap: createCandleHeatmapOptions('#60a5fa', '#f59e0b', {
      wickUpColor: '#bfdbfe',
      wickDownColor: '#fcd34d',
      borderUpColor: '#60a5fa',
      borderDownColor: '#f59e0b',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 8,
      shader: 'hue',
    }),
    volumeSeries: createVolumeSeriesOptions(
      'rgba(96, 165, 250, 0.55)',
      'rgba(248, 113, 113, 0.52)',
    ),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#60a5fa', '#f87171'),
  },
  obsidianMinimal: {
    id: 'obsidian-minimal',
    label: 'Obsidian Minimal',
    mode: 'dark',
    description: 'Low-noise dark palette with subdued chrome.',
    surface: obsidianMinimalSurface,
    footprint: {
      style: {
        ...CORN_REFERENCE_FOOTPRINT_OPTIONS.style,
        bidFillColor: 'rgba(255, 255, 255, 0.01)',
        askFillColor: 'rgba(255, 255, 255, 0.01)',
        candleBorderColor: '#cbd5e1',
        ladderBorderColor: 'rgba(148, 163, 184, 0.22)',
        cellBorderColor: 'rgba(148, 163, 184, 0.2)',
      },
      pointOfControl: {
        ...DARK_POINT_OF_CONTROL,
        borderWidth: CORN_REFERENCE_FOOTPRINT_OPTIONS.pointOfControl?.borderWidth,
      },
      summary: {
        items: DARK_REFERENCE_FOOTPRINT_BASE_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createDarkVolumeFootprintTheme(
      'rgba(148, 163, 184, 0.22)',
      'rgba(226, 232, 240, 0.28)',
      '#e2e8f0',
      'rgba(226, 232, 240, 0.72)',
    ),
    volumeProfile: obsidianMinimalVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(obsidianMinimalVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: DARK_DELTA_SUMMARY_LABEL,
      cellBorderColor: 'rgba(148, 163, 184, 0.18)',
      labelTextColor: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      rowStyles: DARK_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#cbd5e1', '#f87171'),
    candleHeatmap: createCandleHeatmapOptions('#e5e7eb', 'transparent', {
      wickDownColor: '#f87171',
      borderDownColor: '#f87171',
      wickUpColor: '#e5e7eb',
      borderUpColor: '#e5e7eb',
      borderVisible: true,
      shadeWicks: false,
    }),
    volumeSeries: createVolumeSeriesOptions(
      'rgba(203, 213, 225, 0.48)',
      'rgba(248, 113, 113, 0.44)',
    ),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#cbd5e1', '#f87171'),
  },
  paperClassic: {
    id: 'paper-classic',
    label: 'Paper Classic',
    mode: 'light',
    description: 'Classic white chart surface for reference-style views.',
    surface: paperClassicSurface,
    footprint: {
      style: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.style,
      pointOfControl: {
        visible: true,
        ...LIGHT_POINT_OF_CONTROL,
      },
      summary: {
        items: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createLightVolumeFootprintTheme(
      'rgba(248, 113, 113, 0.18)',
      'rgba(96, 165, 250, 0.18)',
      '#111827',
      '#111827',
    ),
    volumeProfile: paperClassicVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(paperClassicVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: LIGHT_DELTA_SUMMARY_LABEL,
      labelTextColor: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      cellBorderColor: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.cellBorderColor,
      rowStyles: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#16a34a', '#dc2626'),
    candleHeatmap: createCandleHeatmapOptions('#2f2a24', '#ffffff', {
      wickUpColor: '#6b7280',
      wickDownColor: '#6b7280',
      borderUpColor: '#1f2937',
      borderDownColor: '#d6b7b7',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 8,
      shader: 'alpha',
    }),
    volumeSeries: createVolumeSeriesOptions('rgba(22, 163, 74, 0.48)', 'rgba(220, 38, 38, 0.48)'),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#16a34a', '#dc2626'),
  },
  clinicalHighContrast: {
    id: 'clinical-high-contrast',
    label: 'Clinical High Contrast',
    mode: 'light',
    description: 'Black-on-white palette for maximum legibility.',
    surface: clinicalHighContrastSurface,
    footprint: {
      style: {
        ...CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.style,
        textColor: '#000000',
        neutralTextColor: '#000000',
        bidTextColor: '#000000',
        askTextColor: '#000000',
        positiveDeltaColor: '#000000',
        negativeDeltaColor: '#000000',
        bullishCandleColor: '#000000',
        bearishCandleColor: '#000000',
        candleWickColor: '#000000',
        candleBorderColor: '#000000',
        ladderBorderColor: '#000000',
        cellBorderColor: '#000000',
      },
      pointOfControl: {
        visible: true,
        ...LIGHT_POINT_OF_CONTROL,
        borderWidth: 1.25,
      },
      summary: {
        items: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createLightVolumeFootprintTheme(
      'rgba(0, 0, 0, 0.14)',
      'rgba(0, 0, 0, 0.22)',
      '#000000',
      '#000000',
    ),
    volumeProfile: clinicalHighContrastVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(clinicalHighContrastVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: LIGHT_DELTA_SUMMARY_LABEL,
      labelTextColor: '#000000',
      cellBorderColor: '#000000',
      rowStyles: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#000000', '#000000', true),
    volumeSeries: createVolumeSeriesOptions('rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.45)'),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#000000', '#000000'),
  },
  ivoryTerminal: {
    id: 'ivory-terminal',
    label: 'Ivory Terminal',
    mode: 'light',
    description: 'Warm light palette designed for long-session reading.',
    surface: ivoryTerminalSurface,
    footprint: {
      style: {
        ...CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.style,
        bidTextColor: '#b45309',
        askTextColor: '#0f766e',
        positiveDeltaColor: '#0f766e',
        negativeDeltaColor: '#b45309',
        bullishCandleColor: '#0f766e',
        bearishCandleColor: '#b45309',
        candleBorderColor: '#92400e',
        ladderBorderColor: 'rgba(146, 64, 14, 0.24)',
        cellBorderColor: 'rgba(146, 64, 14, 0.18)',
      },
      shading: {
        neutralScale: {
          range: {
            from: 0.12,
            to: 1,
            clamp: true,
            invert: false,
          },
          stops: [
            { offset: 0, color: 'rgba(146, 64, 14, 0.02)' },
            { offset: 1, color: 'rgba(146, 64, 14, 0.18)' },
          ],
        },
      },
      pointOfControl: {
        visible: true,
        ...LIGHT_POINT_OF_CONTROL,
        borderWidth: 1.15,
      },
      summary: {
        items: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createLightVolumeFootprintTheme(
      'rgba(180, 83, 9, 0.16)',
      'rgba(15, 118, 110, 0.18)',
      '#44403c',
      '#92400e',
    ),
    volumeProfile: ivoryTerminalVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(ivoryTerminalVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: 'rgba(255, 251, 235, 0.98)',
      labelTextColor: '#44403c',
      cellBorderColor: 'rgba(146, 64, 14, 0.2)',
      rowStyles: {
        delta: {
          positiveFillColor: '#14b8a6',
          negativeFillColor: '#d97706',
          neutralFillColor: '#d6d3d1',
          textColor: '#44403c',
        },
        maxDelta: {
          positiveFillColor: '#5eead4',
          negativeFillColor: '#fbbf24',
          neutralFillColor: '#e7e5e4',
          textColor: '#44403c',
        },
        minDelta: {
          positiveFillColor: '#5eead4',
          negativeFillColor: '#fbbf24',
          neutralFillColor: '#e7e5e4',
          textColor: '#44403c',
        },
        cumulativeDelta: {
          positiveFillColor: '#0f766e',
          negativeFillColor: '#b45309',
          neutralFillColor: '#d6d3d1',
          textColor: '#44403c',
        },
        cumulativeDeltaToVolumeRatio: {
          positiveFillColor: '#99f6e4',
          negativeFillColor: '#fde68a',
          neutralFillColor: '#e7e5e4',
          textColor: '#44403c',
        },
        volume: {
          positiveFillColor: '#a16207',
          negativeFillColor: '#a16207',
          neutralFillColor: '#a16207',
          textColor: '#fffbeb',
        },
      },
    },
    candleSeries: createCandleSeriesOptions('#0f766e', '#b45309'),
    candleHeatmap: createCandleHeatmapOptions('#d4a73b', '#94a3b8', {
      wickUpColor: '#a16207',
      wickDownColor: '#64748b',
      borderUpColor: '#b45309',
      borderDownColor: '#64748b',
      borderVisible: true,
      shadeWicks: false,
      noOfShades: 3,
      shader: 'hue',
      range: {
        minShadeThreshold: 0.04,
        maxShadeThreshold: 0.92,
      },
    }),
    volumeSeries: createVolumeSeriesOptions('rgba(15, 118, 110, 0.44)', 'rgba(180, 83, 9, 0.44)'),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#0f766e', '#b45309'),
  },
  frostUi: {
    id: 'frost-ui',
    label: 'Frost UI',
    mode: 'light',
    description: 'Cool, light-gray interface with modern spacing.',
    surface: frostUiSurface,
    footprint: {
      style: {
        ...CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.style,
        bidTextColor: '#ef4444',
        askTextColor: '#0284c7',
        positiveDeltaColor: '#0284c7',
        negativeDeltaColor: '#ef4444',
        bullishCandleColor: '#0284c7',
        bearishCandleColor: '#ef4444',
        candleBorderColor: '#0f172a',
        ladderBorderColor: 'rgba(148, 163, 184, 0.26)',
        cellBorderColor: 'rgba(148, 163, 184, 0.2)',
      },
      pointOfControl: {
        visible: true,
        ...LIGHT_POINT_OF_CONTROL,
        borderWidth: 1.1,
      },
      summary: {
        items: CLASSIC_REFERENCE_FOOTPRINT_OPTIONS.summary?.items,
      },
    },
    volumeFootprint: createLightVolumeFootprintTheme(
      'rgba(239, 68, 68, 0.14)',
      'rgba(14, 165, 233, 0.18)',
      '#0f172a',
      '#0284c7',
    ),
    volumeProfile: frostUiVolumeProfile,
    sessionVolumeProfile: createSessionProfileTheme(frostUiVolumeProfile),
    deltaSummary: {
      labelBackgroundColor: LIGHT_DELTA_SUMMARY_LABEL,
      cellBorderColor: 'rgba(148, 163, 184, 0.24)',
      labelTextColor: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.labelTextColor,
      rowStyles: CLASSIC_REFERENCE_DELTA_SUMMARY_OPTIONS.rowStyles,
    },
    candleSeries: createCandleSeriesOptions('#0284c7', '#ef4444'),
    volumeSeries: createVolumeSeriesOptions('rgba(2, 132, 199, 0.44)', 'rgba(239, 68, 68, 0.44)'),
    volumeDeltaPivotSeries: createVolumeDeltaPivotSeriesOptions('#0284c7', '#ef4444'),
  },
} satisfies Record<string, OrderFlowThemePresetPack>;
