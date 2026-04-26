# Lightweight Order Flow Charts Docs

This `docs/` tree is intentionally plain Markdown so it can be:

- rendered directly by GitHub Pages from the repository `docs/` directory
- ingested by VitePress, Docusaurus, MkDocs, or another static docs generator without major
  restructuring
- linked from the package README as the canonical long-form documentation surface

## Start Here

- `DATA_REQUIREMENTS.md`
  Input contracts, study expectations, and feed-preparation guidance
- `CANDLE_HEATMAP.md`
  Public helper for metric-driven candlestick coloring
- `TICK_DATA.md`
  Tick storage contract, source-mode guidance, and patch-driven replay patterns
- `MINTICK.md`
  Price bucketing, clustering rules, and when to use `mintick`
- `FORMATTING.md`
  Price and compact value formatting options for the footprint text surface
- `CHART_STATE.md`
  Viewport capture and restore helpers for deep linking and persistence
- `AUTO_FIT.md`
  Price-scale auto-fit helper for TradingView-style `Auto (fits data to screen)` behavior
- `FEATURE_INVENTORY.md`
  Review list of the currently shipped public features and demo presets
- `ARCHITECTURE.md`
  Source-tree roles, public surfaces, and extension guidance
- `THEORY.md`
  Concept notes derived from the research material maintained outside the publishable repo
- `ATTRIBUTION.md`
  TradingView attribution requirements inherited from `lightweight-charts`
- `RELEASING.md`
  GitHub Pages, semver tagging, npm provenance, and first-publish guidance

## Publishing Notes

If you later adopt a docs generator, keep this directory as the source of truth and layer the tool's
config around it. That preserves stable links for contributors while still allowing a static site to
be generated for GitHub Pages or another hosting target.
