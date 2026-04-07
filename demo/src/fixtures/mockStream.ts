import type { OrderFlowBar, OrderFlowPatch } from 'lightweight-orderflow-charts';

import { demoBars } from './orderFlow';

function cloneBar(bar: OrderFlowBar): OrderFlowBar {
  return {
    ...bar,
    levels: bar.levels.map((level) => ({ ...level })),
  };
}

export const demoPatches: OrderFlowPatch[] = [
  {
    operation: 'upsert',
    bars: [
      {
        ...cloneBar(demoBars[demoBars.length - 1]),
        levels: cloneBar(demoBars[demoBars.length - 1]).levels.map((level, index) => ({
          ...level,
          bidVolume: level.bidVolume + index + 2,
          askVolume: level.askVolume + index + 4,
        })),
      },
    ],
  },
  {
    operation: 'append',
    bars: [
      {
        time: (Number(demoBars[demoBars.length - 1].time) + 300) as OrderFlowBar['time'],
        open: 5315,
        high: 5318,
        low: 5313,
        close: 5317,
        sessionId: 'rth-pm',
        levels: [
          { price: 5313, bidVolume: 36, askVolume: 18 },
          { price: 5314, bidVolume: 28, askVolume: 24 },
          { price: 5315, bidVolume: 21, askVolume: 39 },
          { price: 5316, bidVolume: 15, askVolume: 46 },
          { price: 5317, bidVolume: 5, askVolume: 34 },
          { price: 5318, bidVolume: 0, askVolume: 12 },
        ],
      },
    ],
  },
];
