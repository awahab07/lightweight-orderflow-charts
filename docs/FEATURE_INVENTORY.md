# Feature Inventory

This page is a concise review list for the currently shipped public charting surface and demo
presets.

## Core Studies

- `Footprint`
  Bid/ask ladder chart with per-price volume, delta, OHLC lane, and configurable ladder rendering.
- `Volume Footprint`
  Footprint variant that emphasizes total volume at price instead of bid/ask split.
- `Visible-Range Volume Profile`
  Profile aggregated from the currently visible bars with configurable alignment and POC/value area.
- `Session Volume Profile`
  Session-scoped profile primitive with optional session labels.
- `Delta Summary`
  Row-based subchart for aligned delta, cumulative delta, volume, and other summary columns.
- `VWAP`
  Session or continuous VWAP series for higher-level context.
- `Candle Heatmap`
  Standard OHLC candles colored by a per-bar metric using a diverging primary/secondary palette.
- `Volume Delta Pivot`
  Zero-anchored delta candle subchart that traces intrabar pressure inside each displayed bar.

## Footprint Rendering Features

- `Point Of Control`
  Highlights the busiest price row inside a bar with configurable edge styling.
- `Imbalance Highlighting`
  Marks buy/sell imbalances and stacked imbalances directly in the ladder.
- `Letter Separator`
  Replaces the bid/ask divider line with a configurable label such as `x`.
- `Delta-Based Row Shading`
  Lets both cells share red/green shading driven by the row delta instead of side-only fills.
- `Configurable Candle Lane`
  Supports left, middle, or right OHLC placement with width and wick controls.
- `Responsive Width Constraints`
  Lets footprint bars and delta-summary columns clamp by pixels or percentage of bar spacing.
- `Metric Badges`
  Stacks custom metrics above or below each footprint bar with value-key or formatter-based content.
- `Metric Style Palette`
  Provides reusable `metric0`-`metric9` positive/negative style slots for metrics and imbalance text.
- `Compact Value Formatting`
  Controls main digits, decimal digits, rounding, and suffix visibility for ladder quantities.
- `Price Formatting Controls`
  Controls decimal digits and rounding mode for price-oriented metric text.

## Viewport And Data Features

- `Chart View Snapshot And Restore`
  Captures logical time range and pane price ranges for URL sync or other persistence.
- `Price-Scale Auto Fit`
  Toggles TradingView-style vertical autoscaling with configurable top and bottom insets.
- `Mintick Clustering`
  Re-buckets order-flow and OHLC data to a visualization tick size such as `0.10` or `0.005`.
- `Uniform Price Grid`
  Preserves a constant ladder step so price rows do not visually compress or stretch unevenly.

## Demo Surfaces

- `Explore`
  Preset-driven education surface for comparing concepts, themes, intervals, mintick, and saved view state.
- `Playground`
  Fixture-oriented lab for toggling studies, chart modes, and layout controls with low-level access.
- `Theming`
  Fixed chart composition for editing surface, candle, footprint, profile, and delta-summary theme tokens live.
- `Connect`
  Local-only connector workflow for cache-first vendor loading and bridge-backed status visibility.

## Demo Presets

- `Order Flow`
  Letter-delimited ladder with smooth-light styling and delta-colored rows.
- `Order Flow Delta`
  Minimal bid/ask ladder with delta summary and shared volume concentration shading.
- `Delta-First Read`
  Footprint plus aligned delta summary to compare aggression with location.
- `Absorption`
  Volume-heavy ladder view with profile support for stalled price movement.
- `Stacked Imbalances`
  Focuses on consecutive imbalance structure inside the ladder.
- `Volume Profile Shape`
  Emphasizes visible-range profile shape and POC migration.
- `Session Map`
  Combines candles, VWAP, profiles, and footprint context across the session.
- `Volume Footprint`
  Switches to total volume at price when shape matters more than aggressor side.
- `Candle Heatmap`
  Standard candles with theme-aware diverging shading driven by a deterministic per-bar demo score.
- `Volume Delta Pivot`
  Standard price candles plus a smaller zero-anchored delta pane styled with the dark-default theme.
