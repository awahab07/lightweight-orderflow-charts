# Market Data Fixtures

This directory stores source-managed market data used by the demo, lessons, and automated tests.

## Coverage

Symbols:

- `NVDA`
- `TSLA`

Date window:

- `2026-03-01` through `2026-03-10`
- only open-market sessions are stored

Intervals:

- `1m`
- `5m`
- `15m`

Tick-level content:

- trade ticks
- quote ticks when available

## Layout

Each symbol/session partition can contain:

- `bars-1m.json`
- `bars-5m.json`
- `bars-15m.json`
- `trades.ndjson.gz`
- `quotes.ndjson.gz`
- derived order-flow or study fixtures for fast demo loading

## Notes

- These files are intended for source-level demo and test usage.
- They are not part of the distributed npm package output.
