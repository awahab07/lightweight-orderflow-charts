import type { StoryInterval } from './fixtures';

export const STORY_INTERVAL_OPTIONS: StoryInterval[] = ['1m', '5m', '15m'];
export const STORY_MINTICK_VALUES = [
  0.01, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8,
  0.85, 0.9, 0.95, 1,
] as const;
export const STORY_DEFAULT_MINTICK_INDEX = 2;
export const STORY_MAX_MINTICK_INDEX = STORY_MINTICK_VALUES.length - 1;

export function resolveStoryMintick(index: number | undefined): number {
  const numericIndex =
    typeof index === 'number' && Number.isFinite(index) ? index : STORY_DEFAULT_MINTICK_INDEX;
  const clampedIndex = Math.max(
    0,
    Math.min(STORY_MINTICK_VALUES.length - 1, Math.round(numericIndex)),
  );

  return STORY_MINTICK_VALUES[clampedIndex] ?? STORY_MINTICK_VALUES[STORY_DEFAULT_MINTICK_INDEX];
}

export function formatStoryMintick(mintick: number): string {
  return mintick.toFixed(2);
}
