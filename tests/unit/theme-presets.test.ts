import { describe, expect, it } from 'vitest';

import { ORDER_FLOW_THEME_PRESETS } from '../../src';

describe('order flow theme presets', () => {
  it('publishes ten theme presets with balanced light and dark coverage', () => {
    const presets = Object.values(ORDER_FLOW_THEME_PRESETS);
    const dark = presets.filter((preset) => preset.mode === 'dark');
    const light = presets.filter((preset) => preset.mode === 'light');

    expect(presets).toHaveLength(10);
    expect(dark).toHaveLength(5);
    expect(light).toHaveLength(5);
  });

  it('ships both surface styling and study styling for each preset', () => {
    for (const preset of Object.values(ORDER_FLOW_THEME_PRESETS)) {
      expect(preset.surface.backgroundColor).toBeTypeOf('string');
      expect(preset.surface.textColor).toBeTypeOf('string');
      expect(preset.footprint).toBeTruthy();
      expect(preset.volumeFootprint).toBeTruthy();
      expect(preset.volumeProfile).toBeTruthy();
      expect(preset.deltaSummary).toBeTruthy();
    }
  });

  it('includes the smooth light order-flow theme surface', () => {
    expect(ORDER_FLOW_THEME_PRESETS.smoothLight.id).toBe('smooth-light');
    expect(ORDER_FLOW_THEME_PRESETS.smoothLight.footprint?.ladder?.separatorMode).toBe('letter');
    expect(ORDER_FLOW_THEME_PRESETS.smoothLight.footprint?.ladder?.bidAskFillMode).toBe('by-delta');
  });

  it('styles Dark Default candles with borders and neutral wicks', () => {
    expect(ORDER_FLOW_THEME_PRESETS.chartDarkPro.label).toBe('Dark Default');
    expect(ORDER_FLOW_THEME_PRESETS.chartDarkPro.candleSeries?.borderVisible).toBe(true);
    expect(ORDER_FLOW_THEME_PRESETS.chartDarkPro.candleSeries?.wickUpColor).toBe('#c9cdd4');
    expect(ORDER_FLOW_THEME_PRESETS.chartDarkPro.candleSeries?.wickDownColor).toBe('#c9cdd4');
  });
});
