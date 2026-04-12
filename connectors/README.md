# Repo-Side Connectors

This directory contains repo-only market-data connector infrastructure used by the demo and
maintainer workflows.

It is intentionally **not** part of the published npm dist.

## Why this exists

The published `lightweight-orderflow-charts` package stays broker-neutral and browser-safe. A browser
demo cannot connect directly to vendor sockets such as IBKR TWS, yet the repo still needs a realistic
way to demonstrate direct retrieval, live-like chart formation, and partial tick persistence.

This directory provides that repo-side layer.

## Architecture

The connector stack is split into four parts:

1. `connectors/core`
   Shared connector descriptors, config-field definitions, bridge events, and server-side session
   contracts.
2. `connectors/vendors`
   Vendor-specific adapters that implement the shared connector contract. The initial adapter is
   `ibkr-tws`.
3. `connectors/storage`
   Deterministic tick-session loading and persistence helpers that follow the repo market-data layout.
4. `connectors/server`
   A local HTTP plus SSE bridge that the browser demo can talk to safely.

The flow is:

`Connect demo page` -> `local bridge` -> `vendor adapter` -> `data source`

## Running the bridge

From the inner repo root:

```bash
npm run demo:connect-bridge
```

The bridge defaults to `http://127.0.0.1:8791`.

## Alternate data root

The bridge writes to `data/market` by default so saved direct-retrieval sessions match the same
layout used by the repo fixtures.

When you need a safe scratch location, override the root:

```bash
CONNECTOR_MARKET_DATA_ROOT="/absolute/path/to/scratch-market-data" npm run demo:connect-bridge
```

That is the recommended mode while another long-running capture process is already writing into the
main repo market-data tree.

## Current bridge endpoints

- `GET /api/connectors/state`
  Current bridge, connection, and active-grab state
- `GET /api/connectors/events`
  SSE stream for state, tick batches, save events, and log messages
- `POST /api/connectors/test`
  Validate a vendor configuration without keeping the session open
- `POST /api/connectors/connect`
  Open a connector session
- `POST /api/connectors/disconnect`
  Close the connector session
- `POST /api/connectors/grab/start`
  Start or resume a direct historical tick grab
- `POST /api/connectors/grab/stop`
  Pause the current direct grab
- `POST /api/connectors/save`
  Persist the ticks loaded so far

## Extending to another vendor

To add another vendor:

1. Implement the shared `MarketDataConnectorDefinition` contract under `connectors/vendors/`.
2. Expose the adapter from `connectors/vendors/index.ts`.
3. Return the vendor descriptor fields needed by the connect dialog.
4. Ensure the adapter can provide an `InstrumentContext` plus direct tick batches.
5. Reuse the storage helpers or add a vendor-specific persistence strategy only if the standard
   market-data layout is insufficient.

The browser-side `Connect` page should not need vendor-specific UI changes beyond the descriptor
fields exposed by the adapter.
