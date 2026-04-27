import type { Meta, StoryObj } from '@storybook/react-vite';
import { ORDER_FLOW_STYLE_PRESETS } from 'lightweight-orderflow-charts';

import { describeStoryFixture, getStoryFixture, type StoryInterval } from './lib/fixtures';
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

interface StudyStoryArgs {
  themePresetId: StoryThemePresetId;
  interval: StoryInterval;
  mintickIndex: number;
  stylePresetId: FootprintStylePresetId;
}

const meta = {
  title: 'Study Components',
  parameters: {
    layout: 'fullscreen',
    controls: { sort: 'alpha' },
  },
  args: {
    themePresetId: 'chart-dark-pro',
    interval: '5m',
    mintickIndex: STORY_DEFAULT_MINTICK_INDEX,
    stylePresetId: 'shadedReference',
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
    stylePresetId: {
      control: 'inline-radio',
      options: ['classicReference', 'shadedReference'],
    },
  },
} satisfies Meta<StudyStoryArgs>;

export default meta;

type Story = StoryObj<StudyStoryArgs>;

function resolveStylePreset(stylePresetId: FootprintStylePresetId) {
  return stylePresetId === 'classicReference'
    ? ORDER_FLOW_STYLE_PRESETS.classicReference
    : ORDER_FLOW_STYLE_PRESETS.shadedReference;
}

export const DeltaSummary: Story = {
  name: 'Delta Summary',
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('delta-nvda', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset = resolveStylePreset(args.stylePresetId);

    return (
      <StoryChartCanvas
        title="Delta Summary"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Standalone delta summary pane`}
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

export const VolumeProfilePrimitive: Story = {
  name: 'Volume Profile Primitive',
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('footprint-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset = resolveStylePreset(args.stylePresetId);

    return (
      <StoryChartCanvas
        title="Volume Profile Primitive"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Visible-range profile attached to a footprint series`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showFootprint
        showVolumeProfile
        footprintOptions={{
          ...stylePreset.footprint,
          ...themePreset.footprint,
        }}
        volumeProfileOptions={{
          ...ORDER_FLOW_STYLE_PRESETS.shadedReference.volumeProfile,
          ...themePreset.volumeProfile,
        }}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};

export const SessionProfiles: Story = {
  name: 'Session Profiles',
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('session-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset = resolveStylePreset(args.stylePresetId);

    return (
      <StoryChartCanvas
        title="Session Profiles"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Session-by-session distribution overlays`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showFootprint
        showSessionProfiles
        footprintOptions={{
          ...stylePreset.footprint,
          ...themePreset.footprint,
        }}
        sessionVolumeProfileOptions={themePreset.sessionVolumeProfile}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};

export const VwapOverlay: Story = {
  name: 'VWAP Overlay',
  render: (args) => {
    const mintick = resolveStoryMintick(args.mintickIndex);
    const fixture = getStoryFixture('session-tsla', args.interval, mintick);
    const themePreset = resolveStoryThemePreset(args.themePresetId);
    const stylePreset = resolveStylePreset(args.stylePresetId);

    return (
      <StoryChartCanvas
        title="VWAP Overlay"
        subtitle={`${describeStoryFixture(fixture)} • Mintick ${formatStoryMintick(mintick)} • Session-reset VWAP rendered over price action`}
        orderFlowBars={fixture.orderFlowBars}
        marketBars={fixture.marketBars}
        theme={themePreset.surface}
        showCandles
        showFootprint
        showVwap
        footprintOptions={{
          ...stylePreset.footprint,
          ...themePreset.footprint,
        }}
        candleSeriesOptions={themePreset.candleSeries}
      />
    );
  },
};
