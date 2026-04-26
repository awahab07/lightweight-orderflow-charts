import { useEffect, useMemo, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { ORDER_FLOW_STYLE_PRESETS, type OrderFlowSurfaceTheme } from 'lightweight-orderflow-charts';
import type { CandlestickSeriesPartialOptions } from 'lightweight-charts';

import { describeStoryFixture, getStoryFixture } from './lib/fixtures';
import { StoryChartCanvas } from './lib/StoryChartCanvas';
import {
  STORY_THEME_PRESET_IDS,
  resolveStoryThemePreset,
  type StoryThemePresetId,
} from './lib/themePresets';

type ThemePresetControlId = StoryThemePresetId | 'custom';

interface ThemingStoryArgs {
  themePresetId: ThemePresetControlId;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  borderColor: string;
  crosshairColor: string;
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderVisible: boolean;
  borderUpColor: string;
  borderDownColor: string;
}

const THEME_ARG_KEYS: Array<keyof Omit<ThemingStoryArgs, 'themePresetId'>> = [
  'backgroundColor',
  'textColor',
  'gridColor',
  'borderColor',
  'crosshairColor',
  'upColor',
  'downColor',
  'wickUpColor',
  'wickDownColor',
  'borderVisible',
  'borderUpColor',
  'borderDownColor',
];

function buildThemeArgsFromPreset(themePresetId: StoryThemePresetId): ThemingStoryArgs {
  const preset = resolveStoryThemePreset(themePresetId);
  const candleSeries = preset.candleSeries ?? {};

  return {
    themePresetId,
    backgroundColor: preset.surface.backgroundColor,
    textColor: preset.surface.textColor,
    gridColor: preset.surface.gridColor,
    borderColor: preset.surface.borderColor,
    crosshairColor: preset.surface.crosshairColor,
    upColor: candleSeries.upColor ?? '#22c55e',
    downColor: candleSeries.downColor ?? '#ef4444',
    wickUpColor: candleSeries.wickUpColor ?? candleSeries.upColor ?? '#22c55e',
    wickDownColor: candleSeries.wickDownColor ?? candleSeries.downColor ?? '#ef4444',
    borderVisible: candleSeries.borderVisible ?? false,
    borderUpColor:
      candleSeries.borderUpColor ?? candleSeries.upColor ?? candleSeries.wickUpColor ?? '#22c55e',
    borderDownColor:
      candleSeries.borderDownColor ??
      candleSeries.downColor ??
      candleSeries.wickDownColor ??
      '#ef4444',
  };
}

function themeArgsMatchPreset(args: ThemingStoryArgs, presetArgs: ThemingStoryArgs): boolean {
  return THEME_ARG_KEYS.every((key) => args[key] === presetArgs[key]);
}

function ThemingStoryRenderer() {
  const [args, updateArgs] = useArgs<ThemingStoryArgs>();
  const lastPresetIdRef = useRef<StoryThemePresetId>(
    args.themePresetId === 'custom' ? 'chart-dark-pro' : args.themePresetId,
  );
  const previousThemePresetIdRef = useRef<ThemePresetControlId>(args.themePresetId);
  const fixture = useMemo(() => getStoryFixture('footprint-tsla', '5m'), []);

  useEffect(() => {
    if (args.themePresetId !== 'custom') {
      lastPresetIdRef.current = args.themePresetId;
    }

    if (args.themePresetId !== previousThemePresetIdRef.current) {
      previousThemePresetIdRef.current = args.themePresetId;
      if (args.themePresetId !== 'custom') {
        updateArgs(buildThemeArgsFromPreset(args.themePresetId));
      }
      return;
    }

    if (args.themePresetId === 'custom') {
      return;
    }

    const presetArgs = buildThemeArgsFromPreset(args.themePresetId);
    if (!themeArgsMatchPreset(args, presetArgs)) {
      previousThemePresetIdRef.current = 'custom';
      updateArgs({ themePresetId: 'custom' });
    }
  }, [args, updateArgs]);

  const baseThemePreset = resolveStoryThemePreset(lastPresetIdRef.current);
  const themeSurface: OrderFlowSurfaceTheme = {
    backgroundColor: args.backgroundColor,
    textColor: args.textColor,
    gridColor: args.gridColor,
    borderColor: args.borderColor,
    crosshairColor: args.crosshairColor,
    panelBackground: baseThemePreset.surface.panelBackground,
    panelBorder: baseThemePreset.surface.panelBorder,
  };
  const candleSeriesOptions: CandlestickSeriesPartialOptions = {
    upColor: args.upColor,
    downColor: args.downColor,
    wickUpColor: args.wickUpColor,
    wickDownColor: args.wickDownColor,
    borderVisible: args.borderVisible,
    borderUpColor: args.borderUpColor,
    borderDownColor: args.borderDownColor,
    lastValueVisible: false,
    priceLineVisible: false,
  };
  return (
    <StoryChartCanvas
      title="Theme Surface and Candles"
      subtitle={`${describeStoryFixture(fixture)} • Preset-aware surface and candle color controls`}
      orderFlowBars={fixture.orderFlowBars}
      marketBars={fixture.marketBars}
      theme={themeSurface}
      showCandles
      showFootprint
      showDeltaSummary
      footprintOptions={{
        ...ORDER_FLOW_STYLE_PRESETS.shadedReference.footprint,
        ...baseThemePreset.footprint,
      }}
      deltaSummaryOptions={{
        ...ORDER_FLOW_STYLE_PRESETS.shadedReference.deltaSummary,
        ...baseThemePreset.deltaSummary,
      }}
      candleSeriesOptions={candleSeriesOptions}
    />
  );
}

const defaultArgs = buildThemeArgsFromPreset('depth-heat');

const meta = {
  title: 'Theming and Styling',
  parameters: {
    layout: 'fullscreen',
    controls: { sort: 'alpha' },
  },
  args: defaultArgs,
  argTypes: {
    themePresetId: {
      control: 'select',
      options: [...STORY_THEME_PRESET_IDS, 'custom'],
    },
    borderVisible: {
      control: 'boolean',
    },
  },
} satisfies Meta<ThemingStoryArgs>;

export default meta;

type Story = StoryObj<ThemingStoryArgs>;

export const ThemeSurfaceAndCandles: Story = {
  name: 'Theme Surface and Candles',
  render: () => <ThemingStoryRenderer />,
};
