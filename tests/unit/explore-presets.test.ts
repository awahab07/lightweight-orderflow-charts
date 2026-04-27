import { describe, expect, it } from 'vitest';

import {
  CONCEPT_PRESETS,
  DEFAULT_CONCEPT_PRESET_ID,
  getConceptPreset,
  resolveConceptPresetId,
} from '../../demo/src/content/learnCatalog';

describe('explore concept presets', () => {
  it('defaults the Explore catalog to Order Flow Delta', () => {
    const preset = getConceptPreset(DEFAULT_CONCEPT_PRESET_ID);

    expect(CONCEPT_PRESETS[0]?.id).toBe(DEFAULT_CONCEPT_PRESET_ID);
    expect(preset.label).toBe('Order Flow Delta');
    expect(preset.defaultThemeId).toBe('ivory-terminal');
  });

  it('keeps Ladder Fundamentals URLs working through the alias map', () => {
    expect(resolveConceptPresetId('ladder-fundamentals')).toBe(DEFAULT_CONCEPT_PRESET_ID);
    expect(getConceptPreset('ladder-fundamentals').id).toBe(DEFAULT_CONCEPT_PRESET_ID);
  });

  it('configures Order Flow Delta with shared volume row shading and delta context', () => {
    const preset = getConceptPreset(DEFAULT_CONCEPT_PRESET_ID);

    expect(preset.showDeltaSummary).toBe(true);
    expect(preset.footprintOptions?.ladder?.showHeatmap).toBe(true);
    expect(preset.footprintOptions?.ladder?.bidAskFillMode).toBe('by-total-volume');
    expect(preset.footprintOptions?.shading?.bidAskMetric).toBe('volume/max');
  });
});
