# Footprint Formatting

The footprint exposes two related text-formatting surfaces:

- price formatting for price-oriented values such as `open`, `high`, `low`, and `close`
- compact value formatting for ladder quantities such as bid, ask, total volume, and non-price
  summary metrics

## Price Formatting

Price values use:

- `style.priceDecimalDigits`
- `style.priceRounding`

Example:

```ts
const footprintOptions = {
  style: {
    priceDecimalDigits: 2,
    priceRounding: 'ceil',
  },
};
```

## Compact Value Formatting

Ladder values and other non-price footprint numbers use:

- `style.valueIntegerDigits`
- `style.valueDecimalDigits`
- `style.valueRounding`
- `style.valueUnitVisible`

Default behavior:

- `valueIntegerDigits: 2`
- `valueDecimalDigits: 1`
- `valueRounding: 'ceil'`
- `valueUnitVisible: true`

That produces compact values such as:

- `12.3k`
- `0.2M`
- `56.8k`

If the consumer disables `valueUnitVisible`, the same scaled values render without the suffix:

- `12.3`
- `0.2`
- `56.8`

## Example

```ts
const footprintOptions = {
  style: {
    priceDecimalDigits: 2,
    priceRounding: 'ceil',
    valueIntegerDigits: 2,
    valueDecimalDigits: 1,
    valueRounding: 'ceil',
    valueUnitVisible: true,
  },
};
```

## Bid/Ask Presentation

The footprint also exposes presentation controls for how bid and ask cells are separated and
emphasized:

- `ladder.bidAskFillMode`
- `ladder.separatorMode`
- `ladder.separatorLabel`
- `ladder.separatorGap`
- `ladder.highlightImbalanceText`
- `ladder.imbalanceRatio`
- `pointOfControl.visible`
- `pointOfControl.borderColor`
- `pointOfControl.borderWidth`
- `style.separatorColor`
- `style.separatorFont`
- `style.metricStyles`
- `style.imbalanceMetricStyleKey`
- `style.positiveImbalanceTextColor`
- `style.positiveImbalanceTextFont`
- `style.negativeImbalanceTextColor`
- `style.negativeImbalanceTextFont`

Use these options when the host wants to reproduce cleaner order-flow layouts where:

- both cells in a row share the same red/green shading based on row delta
- bid and ask are divided by a letter such as `x` instead of a vertical border
- the separator gutter inherits the same row background as the surrounding bid/ask cells
- positive and negative imbalance text can use different colors and fonts
- point-of-control rows are outlined without forcing a full-row candle border

Example:

```ts
const footprintOptions = {
  ladder: {
    bidAskFillMode: 'by-delta',
    separatorMode: 'letter',
    separatorLabel: 'x',
    separatorGap: 10,
    highlightImbalanceText: true,
    imbalanceRatio: 3,
  },
  pointOfControl: {
    visible: true,
    backgroundColor: 'transparent',
    borderColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1.1,
  },
  style: {
    separatorColor: '#111827',
    separatorFont: '400 12px Arial, sans-serif',
    positiveImbalanceTextColor: '#2f6dd0',
    positiveImbalanceTextFont: '700 12px Arial, sans-serif',
    negativeImbalanceTextColor: '#dc2626',
    negativeImbalanceTextFont: '700 12px Arial, sans-serif',
  },
};
```

## Metric Style Palette

Metric-heavy layouts can route their text styling through a shared palette instead of repeating raw
colors and fonts on every metric item:

- `style.metricStyles.metric0` to `style.metricStyles.metric9`
- `primary` is the positive/default variant for a slot
- `secondary` is the negative variant for a slot and falls back to the slot primary when omitted
- a missing higher slot falls back to the nearest lower-numbered primary slot
- `metric0.primary` must exist whenever a consumer references the palette

The built-in presets use this palette for imbalance text and candle-side delta metrics so the same
positive/negative colors can be reused consistently.

Example:

```ts
const footprintOptions = {
  style: {
    metricStyles: {
      metric0: {
        primary: {
          color: '#2f6dd0',
          font: '700 12px Arial, sans-serif',
        },
        secondary: {
          color: '#dc2626',
        },
      },
      metric1: {
        primary: {
          color: '#16a34a',
          font: '700 12px Arial, sans-serif',
          border: '1px solid rgba(22, 163, 74, 0.2)',
        },
        secondary: {
          color: '#dc2626',
        },
      },
    },
    imbalanceMetricStyleKey: 'metric0',
  },
  summary: {
    items: [
      {
        id: 'delta',
        metricStyleKey: 'metric1',
      },
    ],
  },
};
```

## Notes

- compact formatting is intended for footprint value text, not for price-scale labels
- price formatting and value formatting are intentionally separate so a consumer can keep precise
  prices while abbreviating large quantities
