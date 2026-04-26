# Market Data Fixtures

This directory stores source-managed market data used by the demo, Explore presets, and automated tests.

## Coverage

Symbols:

- `NVDA`
- `TSLA`

Date window:

- `2026-03-01` through `2026-03-10`
- only open-market sessions are stored

Canonical interval:

- `1m`

Higher interval behavior:

- `5m` is derived from stored `1m` data
- separate canonical `5m` or `15m` files are not the preferred long-term contract

Footprint-capable content:

- `orderflow-1m.json`
- `bars-1m.json`
- `session-manifest.json`

Current committed status:

- `bars-1m.json` remains the minimum required checked-in fixture
- `orderflow-1m.json` is the preferred checked-in footprint source
- some sessions may still contain legacy interval or raw-tick artifacts while the canonical dataset is
  refreshed
- local vendor capture should write to `connectors/vendors/<vendor>/data/` first and only curated
  sessions should be promoted here

## Layout

Each symbol/session partition can contain:

- `bars-1m.json`
- `orderflow-1m.json`
- `session-manifest.json`

Legacy migration artifacts may still exist for older sessions:

- `bars-5m.json`
- `bars-15m.json`
- `ticks-manifest.json`
- `trades.ndjson.gz`
- `quotes.ndjson.gz`
- `trades.ndjson.gz.partial`
- `quotes.ndjson.gz.partial`

## Notes

- These files are intended for source-level demo and test usage.
- They are not part of the distributed npm package output.
- Use `session-manifest.json` as the stable entry point for aggregated minute fixtures.
