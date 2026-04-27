import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ORDER_FLOW_STYLE_PRESETS,
  buildVolumeDeltaPivotSeriesData,
  mergeCandleHeatmapOptions,
  type CandleHeatmapShader,
  type VolumeDeltaSourceBar,
} from 'lightweight-orderflow-charts';

import { getStoryFixture, describeStoryFixture, type StoryInterval } from './lib/fixtures';
import { StoryChartCanvas } from './lib/StoryChartCanvas';
import {
  STORY_THEME_PRESET_IDS,
  resolveStoryThemePreset,
  type StoryThemePresetId,
} from './lib/themePresets';
import {
  STORY_DEFAULT_MINTICK_INDEX,
  STORY_INTERVAL_OPTIONS,
  STORY_MAX_MINTICK_INDEX,
  formatStoryMintick,
  resolveStoryMintick,
} from './lib/storyControls';

type FootprintStylePresetId = 'classicReference' | 'shadedReference';

interface BaseStoryArgs {
  themePresetId: StoryThemePresetId;
  interval: StoryInterval;
  mintickIndex: number;
}

interface FootprintStoryArgs extends BaseStoryArgs {
  stylePresetId: FootprintStylePresetId;
}

interface HeatmapStoryArgs extends BaseStoryArgs {
  shader: CandleHeatmapShader;
  noOfShades: number;
  shadeWicks: boolean;
}

function toVolumeDeltaSourceBars(
  bars: ReturnType<typeof getStoryFixture>['orderFlowBars'],
): VolumeDeltaSourceBar[] {
  return bars.map((bar) => ({
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume:
      typeof bar.totalVolume === 'number'
        ? bar.totalVolume
        : bar.levels.reduce(
            (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
            0,
          ),
    delta:
      typeof bar.delta === 'number'
        ? bar.delta
        : bar.levels.reduce(
            (total, level) => total + (level.delta ?? level.askVolume - level.bidVolume),
            0,
          ),
  }));
}

const meta = {
  title: 'Full Charts',
  parameters: {
    layout: 'fullscreen',
    controls: { sort: 'alpha' },
  },
  args: {
    themePresetId: 'chart-dark-pro',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
  },
  argTypes: {
    themePresetId: {
      control: 'select',
      options: STORY_THEME_PRESET_IDS,
    },
    interval: {
      control: 'inline-radio',
      options: STORY_INTERVAL_OPTIONS,
    },
    mintickIndex: {
      name: 'mintick',
      control: {
        type: 'range',
        min: 0,
        max: STORY_MAX_MINTICK_INDEX,
        step: 1,
      },
    },
  },
} satisfies Meta<BaseStoryArgs>;

export default meta;

type BaseStory = StoryObj<BaseStoryArgs>;
type FootprintStory = StoryObj<FootprintStoryArgs>;
type HeatmapStory = StoryObj<HeatmapStoryArgs>;

export const FootprintLadder: FootprintStory = {
  name: 'Footprint Ladder',
  args: {
    themePresetId: 'paper-classic',
    interval: '5m',
    stylePresetId: 'classicReference',
  } as FootprintStoryArgs,
  argTypes: {
    stylePresetId: {
      control: 'inline-radio',
      options: ['classicReference', 'shadedReference'],
    },
  },
  render: (storyArgs) => {
    const args = storyArgs as FootprintStoryArgs;
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('footprint-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset =
      args.stylePresetId === 'classicReference'
        ? ORDER_FLOW_STYLE_PRESETS.classicReference
        : ORDER_FLOW_STYLE_PRESETS.shadedReference;

    return (
      <StoryChartCanvas
        title="Footprint Ladder"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • React custom series + delta summary`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showFootprint
        showDeltaSummary
        footprintOptions={{
          ...stylePreset.footprint,
          ...themePreset.footprint,
        }}
        deltaSummaryOptions={{
          ...stylePreset.deltaSummary,
          ...themePreset.deltaSummary,
        }}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};

export const VolumeFootprintProfile: BaseStory = {
  name: 'Volume Footprint Profile',
  args: {
    themePresetId: 'depth-heat',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
  },
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('volume-footprint-nvda', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset = ORDER_FLOW_STYLE_PRESETS.volumeFootprintReference;

    return (
      <StoryChartCanvas
        title="Volume Footprint Profile"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Volume-at-price without aggressor split`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showVolumeFootprint
        showVolumeProfile
        volumeFootprintOptions={{
          ...stylePreset.volumeFootprint,
          ...themePreset.volumeFootprint,
        }}
        volumeProfileOptions={{
          ...stylePreset.volumeProfile,
          ...themePreset.volumeProfile,
        }}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};

export const SessionContext: FootprintStory = {
  name: 'Session Context',
  args: {
    themePresetId: 'chart-dark-pro',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
    stylePresetId: 'shadedReference',
  } as FootprintStoryArgs,
  argTypes: {
    stylePresetId: {
      control: 'inline-radio',
      options: ['classicReference', 'shadedReference'],
    },
  },
  render: (storyArgs) => {
    const args = storyArgs as FootprintStoryArgs;
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('session-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset =
      args.stylePresetId === 'classicReference'
        ? ORDER_FLOW_STYLE_PRESETS.classicReference
        : ORDER_FLOW_STYLE_PRESETS.shadedReference;

    return (
      <StoryChartCanvas
        title="Session Context"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Session profiles and VWAP on the main pane`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showFootprint
        showVolumeProfile
        showSessionProfiles
        showVwap
        footprintOptions={{
          ...stylePreset.footprint,
          ...themePreset.footprint,
        }}
        volumeProfileOptions={{
          ...ORDER_FLOW_STYLE_PRESETS.shadedReference.volumeProfile,
          ...themePreset.volumeProfile,
        }}
        sessionVolumeProfileOptions={themePreset.sessionVolumeProfile}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};

export const CandleHeatmap: HeatmapStory = {
  name: 'Candle Heatmap',
  args: {
    themePresetId: 'depth-heat',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
    shader: 'alpha',
    noOfShades: 10,
    shadeWicks: false,
  } as HeatmapStoryArgs,
  argTypes: {
    shader: {
      control: 'inline-radio',
      options: ['alpha', 'hue'],
    },
    noOfShades: {
      control: { type: 'range', min: 0, max: 12, step: 1 },
    },
    shadeWicks: {
      control: 'boolean',
    },
  },
  render: (storyArgs) => {
    const args = storyArgs as HeatmapStoryArgs;
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('footprint-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const heatmapOptions = mergeCandleHeatmapOptions({
      ...themePreset.candleHeatmap,
      shader: args.shader,
      noOfShades: args.noOfShades,
      shadeWicks: args.shadeWicks,
    });

    return (
      <StoryChartCanvas
        title="Candle Heatmap"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Metric-driven candlestick coloring`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showVolumePane
        volumePaneLabel="Volume pane"
        candleHeatmapOptions={heatmapOptions}
        candleHeatmapAccessor={fixture.getHeatmapValue}
        candleSeriesOptions={themePreset.candleSeries}
        volumeSeriesOptions={themePreset.volumeSeries}
      />
    );
  },
};

export const VolumeDeltaPivot: BaseStory = {
  name: 'Volume Delta Pivot',
  args: {
    themePresetId: 'chart-dark-pro',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
  },
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const chartFixture = getStoryFixture('delta-nvda', args.interval, mintick);
    const lowerFixture = getStoryFixture('delta-nvda', '1m', mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const intervalSeconds = args.interval === '1m' ? 60 : args.interval === '5m' ? 300 : 900;
    const pivotData = buildVolumeDeltaPivotSeriesData(
      toVolumeDeltaSourceBars(chartFixture.orderFlowBars),
      toVolumeDeltaSourceBars(lowerFixture.orderFlowBars),
      { intervalSeconds },
    );

    return (
      <StoryChartCanvas
        title="Volume Delta Pivot"
        subtitle={`${describeStoryFixture(chartFixture)} • Mintick ${formatStoryMintick(mintick)} • Zero-anchored intrabar pressure candles`}
        orderFlowBars={chartFixture.orderFlowBars}
        marketBars={chartFixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showVolumeDeltaPivot
        volumeDeltaPivotData={pivotData}
        candleSeriesOptions={themePreset.candleSeries}
        volumeDeltaPivotSeriesOptions={themePreset.volumeDeltaPivotSeries}
        volumeDeltaPivotBaselineOptions={themePreset.volumeDeltaPivotBaseline}
      />
    );
  },
};
