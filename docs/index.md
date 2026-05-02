# Lightweight Order Flow Charts Docs

This `docs/` tree is intentionally plain Markdown so it can be:

- rendered directly by GitHub Pages from the repository `docs/` directory
- ingested by VitePress, Docusaurus, MkDocs, or another static docs generator without major
  restructuring
- linked from the package README as the canonical long-form documentation surface

## Start Here

- `GETTING_STARTED.md`
  Step-by-step path to a first rendered footprint chart
- `API_REFERENCE.md`
  Auto-generated public export index for the core and React entry points
- `FEATURE_INVENTORY.md`
  Review list of the currently shipped public features, demo surfaces, and presets

## Guides

- `CANDLE_HEATMAP.md`
  Public helper for metric-driven candlestick coloring
- `AUTO_FIT.md`
  Price-scale auto-fit helper for [TradingView lightweight-charts](https://github.com/tradingview/lightweight-charts)-style `Auto (fits data to screen)` behavior
- `CHART_STATE.md`
  Viewport capture and restore helpers for deep linking and persistence

## Data & Integration

- `DATA_REQUIREMENTS.md`
  Input contracts, study expectations, and feed-preparation guidance
- `TICK_DATA.md`
  Tick storage contract, source-mode guidance, and patch-driven replay patterns
- `MINTICK.md`
  Price bucketing, clustering rules, and when to use `mintick`

## Styling & Presentation

- `FORMATTING.md`
  Price and compact value formatting options for the footprint text surface

## Advanced

- `ARCHITECTURE.md`
  Source-tree roles, public surfaces, and extension guidance
- `THEORY.md`
  Concept notes distilled from recurring order-flow research articles and expert practice
- `RELEASING.md`
  GitHub Pages, semver tagging, npm provenance, and first-publish guidance

## Miscellaneous

- `ATTRIBUTION.md`
  TradingView attribution requirements inherited from [TradingView lightweight-charts](https://github.com/tradingview/lightweight-charts)

## Interactive Surfaces

The repository also ships public interactive surfaces for visual validation and package discovery:

- Demo
  [awahab07.github.io/lightweight-orderflow-charts/latest/demo](https://awahab07.github.io/lightweight-orderflow-charts/latest/demo/)
- Playground
  [awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/playground](https://awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/playground)
- Theming
  [awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/theming](https://awahab07.github.io/lightweight-orderflow-charts/latest/demo/#/theming)
- Storybook
  [awahab07.github.io/lightweight-orderflow-charts/latest/storybook](https://awahab07.github.io/lightweight-orderflow-charts/latest/storybook/)
- Demo data
  [awahab07.github.io/lightweight-orderflow-charts/latest/data](https://awahab07.github.io/lightweight-orderflow-charts/latest/data/)

## Publishing Notes

If you later adopt a docs generator, keep this directory as the source of truth and layer the tool's
config around it. That preserves stable links for contributors while still allowing a static site to
be generated for GitHub Pages or another hosting target.
