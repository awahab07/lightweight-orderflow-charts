# Market Data Fixtures

This directory stores source-managed market data used by the demo, Explore presets, Storybook
stories, and automated tests.

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

- `instruments.json`
- `orderflow-1m.json`
- `bars-1m.json`
- `session-manifest.json`

Current committed status:

- `instruments.json` is the stable checked-in instrument catalog for demo consumers
- `bars-1m.json` remains the minimum required checked-in fixture
- `orderflow-1m.json` is the preferred checked-in footprint source when true bid/ask volume is
  available
- local vendor capture should write to `connectors/vendors/<vendor>/data/` first and only curated
  sessions should be promoted here

## Layout

The checked-in surface contains:

- `instruments.json`
- `bars-1m.json`
- `orderflow-1m.json`
- `session-manifest.json`

Local-only cache artifacts may exist outside git, but should not be source-managed here:

- `instrument.json`
- `ticks-manifest.json`
- `quotes.ndjson.gz`
- `quotes-meta.json`
- `trades-meta.json`

## Notes

- These files are intended for source-level demo, Storybook, docs, and test usage.
- They are not part of the distributed npm package output.
- Use `session-manifest.json` as the stable entry point for aggregated minute fixtures.
- Demo data is locally crafted for visualization and validation and may not represent live or
  complete market conditions.
