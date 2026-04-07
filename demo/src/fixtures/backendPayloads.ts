export const exampleBackendPayload = {
  instrument: {
    symbol: 'ESM6',
    tick_size: 1,
    price_precision: 0,
    timezone: 'UTC',
  },
  bars: [
    {
      timestamp: 1711978200,
      open: 5299,
      high: 5302,
      low: 5298,
      close: 5301,
      session_id: 'rth-am',
      ladder: [
        { price: 5298, bid: 42, ask: 18 },
        { price: 5299, bid: 31, ask: 24 },
        { price: 5300, bid: 18, ask: 36 },
        { price: 5301, bid: 14, ask: 44 },
        { price: 5302, bid: 4, ask: 38 },
      ],
    },
  ],
};
