# Repo-Side Connectors

This repository includes a repo-only connector layer for maintainers and demo flows.

It is intentionally **not** part of the published npm package.

## Why It Exists

The public package stays browser-safe and broker-neutral. The repo still needs a practical way to:

- demonstrate vendor-backed data loading in the demo
- capture cached market data locally
- degrade gracefully when a vendor only exposes candle summaries

That is why the connector bridge and vendor adapters live in this repository instead of the
published dist.

## Main Pieces

The repo-side connector stack is split into four parts:

1. `connectors/core`
   Shared connector descriptors, config fields, bridge events, and server-side contracts.
2. `connectors/vendors`
   Vendor-specific adapters such as `ibkr-tws` and `polygon-rest`.
3. `connectors/storage`
   Persistence helpers for tick sessions, derived bars, and cache-first replay.
4. `connectors/server`
   The local HTTP plus SSE bridge used by the browser demo.

## Typical Flow

The browser demo uses this path:

`Connect page` -> `local bridge` -> `vendor adapter` -> `cache or source`

The browser never talks directly to vendor transports.

## Running The Bridge

From the package repo root:

```bash
npm run demo:connect-bridge
```

The bridge listens on `http://127.0.0.1:8791` by default.

## Cache Roots

Vendor cache roots live under:

- `connectors/vendors/ibkr/data`
- `connectors/vendors/polygon/data`

When you need an isolated scratch location, override the default root:

```bash
CONNECTOR_MARKET_DATA_ROOT="/absolute/path/to/scratch-market-data" npm run demo:connect-bridge
```

## Extending To Another Vendor

To add another vendor:

1. Implement the shared connector definition under `connectors/vendors/`.
2. Export it from `connectors/vendors/index.ts`.
3. Return the descriptor fields needed by the browser-side connect dialog.
4. Reuse the storage helpers unless the vendor needs a genuinely different persistence model.

The browser-side demo should not need vendor-specific UI beyond the descriptor fields exposed by the
adapter.

## Related Reading

- [`DATA_REQUIREMENTS.md`](./DATA_REQUIREMENTS.md)
  Understand how normalized bars flow into the package surface.
- [`TICK_DATA.md`](./TICK_DATA.md)
  Review the preferred minute-storage model used by the demo fixtures.
- [`RELEASING.md`](./RELEASING.md)
  See how repo-side assets relate to the public GitHub Pages and npm workflows.
