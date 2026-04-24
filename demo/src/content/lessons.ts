const ladderFundamentalsImage = new URL(
  '../../screenshots/ladder-fundamentals.png',
  import.meta.url,
).href;
const absorptionImage = new URL('../../screenshots/absorption.png', import.meta.url).href;
const sessionMapImage = new URL('../../screenshots/session-map.png', import.meta.url).href;
const volumeFootprintImage = new URL('../../screenshots/volume-footprint.png', import.meta.url)
  .href;

export interface LessonDefinition {
  id: string;
  title: string;
  shortDescription: string;
  presetId: string;
  markdown: string;
  imageUrl?: string;
}

export const LESSONS: LessonDefinition[] = [
  {
    id: 'inside-the-footprint',
    title: 'Inside the Footprint',
    shortDescription: 'Learn how the price ladder and OHLC lane fit together.',
    presetId: 'ladder-fundamentals',
    imageUrl: ladderFundamentalsImage,
    markdown: `# Inside the footprint

The footprint breaks a bar into price levels so you can compare bid-side and ask-side activity at
each level instead of reading only one candle body.

## What to look for

- the OHLC lane gives you structural context
- the ladder shows where activity concentrated
- the point of control shows the busiest price level inside the bar

## How to use it

Start with price location first, then use the ladder to ask whether activity followed the move or
failed to continue it.`,
  },
  {
    id: 'delta-vs-location',
    title: 'Delta vs Location',
    shortDescription: 'Delta matters more when you know where it happened.',
    presetId: 'delta-first-read',
    imageUrl: ladderFundamentalsImage,
    markdown: `# Delta vs location

Delta tells you whether aggressive volume favored lifting offers or hitting bids, but the same
delta value can mean very different things depending on where it prints.

## What to look for

- strong positive delta at resistance can fail
- negative delta into support can be absorbed
- the ladder and the delta pane must be read together

## How to use it

Use delta as confirmation, not as a standalone signal. Location still decides whether the market is
accepting price or rejecting it.`,
  },
  {
    id: 'cumulative-delta-context',
    title: 'Cumulative Delta Context',
    shortDescription: 'Use the aligned delta pane to read pressure through the session.',
    presetId: 'delta-first-read',
    markdown: `# Cumulative delta context

Cumulative delta is most useful when it stays aligned to the same time axis as the primary chart.

## What to look for

- divergence between price and aggressive pressure
- pressure that accelerates into a breakout
- fading pressure during a stall

## How to use it

Treat cumulative delta as context for the session, then zoom back into the footprint when you need
to see where the pressure actually traded.`,
  },
  {
    id: 'absorption',
    title: 'Absorption',
    shortDescription: 'Large traded volume with limited price travel often marks absorption.',
    presetId: 'absorption',
    imageUrl: absorptionImage,
    markdown: `# Absorption

Absorption happens when heavy trading meets equally strong passive liquidity, so size prints but
price does not travel far.

## What to look for

- dense volume or strong shading near one price area
- repeated attempts that fail to extend
- little net displacement despite clear activity

## How to use it

Absorption is strongest when it appears at an important location such as session extremes, prior
high-volume nodes, or profile edges.`,
  },
  {
    id: 'stacked-imbalances',
    title: 'Stacked Imbalances',
    shortDescription: 'Consecutive imbalances can behave like directional structure.',
    presetId: 'stacked-imbalances',
    markdown: `# Stacked imbalances

One imbalance can be noise. Several adjacent imbalances in the same direction can act as a real
statement about aggressive participation.

## What to look for

- consecutive levels favoring the same side
- clusters that align with breakout or rejection zones
- whether the next bars respect or invalidate the stack

## How to use it

Read stacked imbalances as inline ladder structure, not as hand-drawn rectangles floating over the
chart.`,
  },
  {
    id: 'volume-profile-shape',
    title: 'Volume Profile Shape',
    shortDescription: 'Profile shape shows acceptance, rejection, and migration of value.',
    presetId: 'volume-profile-shape',
    imageUrl: absorptionImage,
    markdown: `# Volume profile shape

The profile explains how the market distributed time and volume across prices, which helps frame
where acceptance formed and where rejection remained thin.

## What to look for

- point of control migration
- thick areas that hold price
- thin areas that travel quickly

## How to use it

Combine the visible profile with the footprint so you know both where the market spent volume and
how it traded inside those zones.`,
  },
  {
    id: 'sessions-and-vwap',
    title: 'Sessions and VWAP',
    shortDescription: 'Session context helps separate rotation from initiative movement.',
    presetId: 'session-map',
    imageUrl: sessionMapImage,
    markdown: `# Sessions and VWAP

Session-aware tools help you distinguish one-timeframe rotation from initiative movement that
changes the day’s character.

## What to look for

- VWAP as a rolling session reference
- session profile shifts from one period to the next
- whether the footprint accepts or rejects price around the session mean

## How to use it

Treat VWAP as a contextual reference, then use the footprint to decide whether the tape is trading
through it cleanly or reacting to it.`,
  },
  {
    id: 'when-to-use-volume-footprint',
    title: 'When to Use Volume Footprint',
    shortDescription: 'Sometimes total volume at price is the clearest story.',
    presetId: 'volume-footprint',
    imageUrl: volumeFootprintImage,
    markdown: `# When to use volume footprint

Not every question needs a bid/ask split. Sometimes the main job is to show where total activity
concentrated.

## What to look for

- dominant price levels
- profile interaction
- volume clusters that align with structure

## How to use it

Use a volume footprint when total participation at price matters more than aggressor-side detail.`,
  },
  {
    id: 'volume-delta-pivot',
    title: 'Volume Delta Pivot',
    shortDescription: 'Zero-anchored delta candles show the path of pressure inside each bar.',
    presetId: 'volume-delta-pivot',
    markdown: `# Volume Delta Pivot

The Volume Delta Pivot subplot starts every candle at zero, then tracks the highest and lowest
running delta reached inside the bar before settling on the final close.

## What to look for

- green candles that build upward from zero
- red candles that build downward from zero
- long wicks that reveal intrabar reversals in pressure

## How to use it

Read it with the primary price chart. Strong price movement with weak delta follow-through is often
more interesting than a large delta candle by itself.`,
  },
  {
    id: 'candle-heatmap',
    title: 'Candle Heatmap',
    shortDescription: 'Standard candles can carry a score without changing their shape.',
    presetId: 'candle-heatmap',
    markdown: `# Candle heatmap

The candle heatmap keeps the standard OHLC candle geometry but replaces simple up/down coloring with
a metric-driven diverging palette.

## What to look for

- low scores clustering into the secondary color
- high scores clustering into the primary color
- whether transitions happen gradually or snap into the solid threshold zones

## How to use it

Use it when every bar already has a normalized score such as probability, percentile rank, or model
confidence. The candle still shows price structure, while the color carries the second variable.`,
  },
];

export function getLesson(lessonId: string): LessonDefinition {
  return LESSONS.find((lesson) => lesson.id === lessonId) ?? LESSONS[0];
}

export function lessonsForPreset(presetId: string): LessonDefinition[] {
  return LESSONS.filter((lesson) => lesson.presetId === presetId);
}
