# Architecture Guide

This package is organized so that data contracts, calculations, renderers, React bindings, and demo
content remain clearly separated.

## Layer Map

### `src/models`

Owns the public contracts and option surfaces:

- `contracts.ts`
  Normalized data types such as `OrderFlowBar`, `OrderFlowPatch`, and `SessionDefinition`
- `options.ts`
  Public option types, defaults, and merge helpers
- `studies.ts`
  Internal study models used by renderers

This layer should stay broker-neutral and renderer-agnostic.

### `src/presets`

Owns reusable, published starting points:

- `orderFlowStylePresets.ts`
  Study-level defaults for footprint, profiles, and delta summary
- `orderFlowThemePresets.ts`
  Surface-plus-study theme packs for re-skinning existing chart compositions

If a configuration is intended to be copied by consumers, it belongs here instead of only in the
demo.

### `src/adapters`

Owns normalization and patch handling:

- batch normalization
- patch normalization
- session resolution

Keep this layer focused on contract cleanup and incremental application. It should not perform
rendering.

### `src/calculations`

Owns study derivations and reusable aggregations:

- footprint metrics
- profile building
- VWAP computation
- volume-delta pivot derivation

If a result can be tested without a chart instance, it should usually live here first.

### `src/renderers`

Owns `lightweight-charts` integration details:

- `footprint-series`
  Footprint and volume-footprint custom series
- `delta-summary-series`
  Table-style aligned subchart
- `primitives`
  Volume profiles, annotations, and VWAP overlays

This layer should consume normalized inputs and resolved options. Avoid moving feed translation or
trading logic into renderer code. When custom series are rendered, honor the chart's `visibleRange`
so off-screen bars are culled before they can accumulate at a pane edge.

### `src/utils`

Owns small reusable helpers that are still part of the publishable surface or shared implementation:

- color and width helpers
- price-step and price-grid helpers
- chart viewport capture and restore helpers

Utility code should stay stateless and composable so both the core library and the demo can consume
it without creating hidden coupling.

### `src/react`

Owns thin React wrappers and lifecycle helpers around the core renderers.

The React layer should remain deliberately small:

- create or attach renderer instances
- pass updates and patches through
- clean up chart resources on unmount

### `demo`

Owns product education and validation surfaces:

- `demo/src/components`
  Explore, Playground, Theming, and Connect surfaces plus shared demo composition wrappers
- `demo/src/content`
  Explore presets, default themes, and other teaching-oriented route content
- `demo/src/fixtures`
  Playground-oriented fixture data and historical styling references
- `demo/src/lib`
  Demo-only data loading, URL sync, and composition helpers shared across the routes

The demo may showcase the public API, but should not become the place where public defaults are
defined first.

## Extension Workflow

When adding a new study:

1. Start with the data contract.
   Confirm what normalized input shape the study needs.
2. Add or update calculations.
   Keep deterministic derivation logic under `src/calculations`.
3. Thread the options surface.
   Expose only the knobs that materially change behavior or styling.
4. Implement or extend the renderer.
   Keep rendering concerns isolated from data-fetch concerns.
5. Publish a preset if the feature needs a strong starting point.
6. Add tests close to the logic that changed.
7. Add Explore coverage only if the feature benefits from explanation or visual validation.

## Design Principles

### Broker-neutral surface

Anything that mentions a specific broker, gateway, SDK, or transport protocol belongs outside the
publishable package.

### Public presets over demo-only magic numbers

If the demo needs a useful configuration and consumers would benefit from it, publish it from
`src/presets` instead of hiding it inside demo code.

### Calculations before renderers

Try to put business logic into calculation helpers so it can be tested independently of the chart
runtime.

### Theme and concept separation

Concept presets decide what studies are shown and why. Theme presets decide how those studies look.
Keep those responsibilities separate so the same concept can be re-skinned without changing chart
composition.

## Contributor Checklist

- Keep new exports broker-neutral and typed from `src/index.ts`
- Prefer extending existing option types rather than adding parallel ad hoc objects
- Add or update focused tests for calculations and merge behavior
- Validate demo routes visually when renderer behavior changes
- Keep Explore preset content educational and first-party
