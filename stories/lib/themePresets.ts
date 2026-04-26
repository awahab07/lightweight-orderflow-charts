import {
  ORDER_FLOW_THEME_PRESETS,
  type OrderFlowThemePresetPack,
} from 'lightweight-orderflow-charts';

export type StoryThemePresetId = OrderFlowThemePresetPack['id'];

export const STORY_THEME_PRESETS = Object.values(ORDER_FLOW_THEME_PRESETS);
export const STORY_THEME_PRESET_IDS = STORY_THEME_PRESETS.map((preset) => preset.id);

export function resolveStoryThemePreset(themePresetId: string): OrderFlowThemePresetPack {
  return (
    STORY_THEME_PRESETS.find((preset) => preset.id === themePresetId) ?? STORY_THEME_PRESETS[0]
  );
}
