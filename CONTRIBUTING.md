# Contributing

## Prerequisites

- Node.js `>=20`
- npm `>=10`

## Setup

```bash
npm ci
```

## Local Development

- `npm run demo`
  Starts the demo application from `demo/`
- `npm run typecheck`
  Runs the TypeScript compiler in no-emit mode
- `npm run test`
  Runs the Vitest suite
- `npm run build`
  Builds the publishable package with `tsup`
- `npm run demo:build`
  Builds the demo site bundle
- `npm run check`
  Runs formatting, typecheck, tests, and package build

## Project Notes

- Keep the published package broker-neutral and framework-light beyond `lightweight-charts` and
  the optional React bindings.
- Keep source-managed demo assets and market fixtures in the repo, but do not commit generated
  build output or partial capture artifacts.
- Update the Markdown docs in `docs/` when the public API or demo behavior changes.
