import type {
  InstrumentContext,
  OrderFlowBar,
  OrderFlowBatch,
  PriceLevelVolume,
  SessionDefinition,
  TimeValue,
} from 'lightweight-orderflow-charts';

export const demoInstrument: InstrumentContext = {
  instrumentId: 'demo-es',
  symbol: 'ESM6',
  tickSize: 1,
  pricePrecision: 0,
  timezone: 'UTC',
};

export const demoSessions: SessionDefinition[] = [
  {
    sessionId: 'rth-am',
    label: 'RTH AM',
    timezone: 'UTC',
    segments: [{ dayOfWeek: 1, start: '13:30', end: '16:00' }],
    resetsStudies: true,
  },
  {
    sessionId: 'rth-pm',
    label: 'RTH PM',
    timezone: 'UTC',
    segments: [{ dayOfWeek: 1, start: '16:05', end: '20:00' }],
    resetsStudies: true,
  },
];

function createLevel(price: number, bidVolume: number, askVolume: number): PriceLevelVolume {
  return {
    price,
    bidVolume,
    askVolume,
  };
}

function createBar(
  time: number,
  anchorPrice: number,
  offset: number,
  sessionId: string,
): OrderFlowBar {
  const low = anchorPrice - 2;
  const high = anchorPrice + 2;
  const levels = [
    createLevel(low, 42 + offset, 18 + offset),
    createLevel(low + 1, 31 + offset, 24 + offset),
    createLevel(anchorPrice, 18 + offset, 36 + offset),
    createLevel(high - 1, 14 + offset, 44 + offset),
    createLevel(high, 4 + offset, 38 + offset),
  ];

  return {
    time: time as TimeValue,
    open: anchorPrice - 1,
    high,
    low,
    close: anchorPrice + 1,
    levels,
    sessionId,
  };
}

const start = 1711978200;

export const demoBars: OrderFlowBar[] = Array.from({ length: 12 }, (_, index) => {
  const sessionId = index < 6 ? 'rth-am' : 'rth-pm';
  const anchorPrice = 5300 + (index % 6) * 2 + (index >= 6 ? 3 : 0);
  return createBar(start + index * 300, anchorPrice, index * 2, sessionId);
});

export const demoOrderFlowBatch: OrderFlowBatch = {
  instrument: demoInstrument,
  sessions: demoSessions,
  bars: demoBars,
};

export const classicInstrument: InstrumentContext = {
  instrumentId: 'classic-zc',
  symbol: 'ZC 12-15',
  tickSize: 0.5,
  pricePrecision: 2,
  timezone: 'UTC',
};

export const classicSessions: SessionDefinition[] = [
  {
    sessionId: 'classic-rth',
    label: 'RTH',
    timezone: 'UTC',
    segments: [{ dayOfWeek: 1, start: '09:00', end: '14:00' }],
    resetsStudies: true,
  },
];

function createClassicBar(
  time: number,
  prices: number[],
  bidVolumes: number[],
  askVolumes: number[],
  open: number,
  high: number,
  low: number,
  close: number,
): OrderFlowBar {
  return {
    time: time as TimeValue,
    open,
    high,
    low,
    close,
    sessionId: 'classic-rth',
    levels: prices.map((price, index) => ({
      price,
      bidVolume: bidVolumes[index],
      askVolume: askVolumes[index],
    })),
  };
}

const classicStart = 1711962720;

export const classicBars: OrderFlowBar[] = [
  createClassicBar(
    classicStart,
    [377, 377.5, 378, 378.5, 379, 379.5],
    [70, 80, 18, 26, 1, 0],
    [13, 47, 385, 638, 832, 588],
    377,
    379.5,
    377,
    379,
  ),
  createClassicBar(
    classicStart + 18 * 60,
    [377, 377.5, 378, 378.5, 379, 379.5, 380],
    [0, 0, 5, 214, 1, 26, 18],
    [24, 147, 938, 252, 439, 351, 904],
    379,
    380,
    377,
    377.5,
  ),
  createClassicBar(
    classicStart + 35 * 60,
    [377.5, 378, 378.5, 379, 379.5, 380],
    [280, 360, 70, 124, 647, 1219],
    [486, 47, 61, 303, 1230, 1540],
    377.5,
    380,
    377.5,
    378,
  ),
  createClassicBar(
    classicStart + 56 * 60,
    [376.5, 377, 377.5, 378, 378.5],
    [96, 442, 593, 664, 819],
    [0, 271, 513, 444, 727],
    378,
    378.5,
    376.5,
    377,
  ),
  createClassicBar(
    classicStart + 118 * 60,
    [374, 374.5, 375, 375.5, 376, 376.5],
    [311, 237, 479, 393, 1567, 1460],
    [19, 468, 7, 27, 1132, 1495],
    376.5,
    376.5,
    374,
    374.5,
  ),
  createClassicBar(
    classicStart + 156 * 60,
    [374, 374.5, 375, 375.5, 376, 376.5],
    [173, 1115, 353, 244, 219, 137],
    [115, 0, 437, 266, 81, 0],
    374.5,
    376.5,
    374,
    375.5,
  ),
  createClassicBar(
    classicStart + 197 * 60,
    [374, 374.5, 375, 375.5, 376, 376.5],
    [2, 189, 287, 731, 390, 353],
    [0, 0, 133, 161, 284, 211],
    375.5,
    376.5,
    374,
    374.5,
  ),
];

export const classicOrderFlowBatch: OrderFlowBatch = {
  instrument: classicInstrument,
  sessions: classicSessions,
  bars: classicBars,
};

function createReferenceBar(
  time: number,
  sessionId: string,
  open: number,
  high: number,
  low: number,
  close: number,
  levels: Array<[price: number, bidVolume: number, askVolume: number]>,
): OrderFlowBar {
  return {
    time: time as TimeValue,
    open,
    high,
    low,
    close,
    sessionId,
    levels: levels.map(([price, bidVolume, askVolume]) => ({
      price,
      bidVolume,
      askVolume,
    })),
  };
}

const cornStart = 1711960560;

export const cornBars: OrderFlowBar[] = [
  createReferenceBar(cornStart, 'corn-rth', 435.0, 436.5, 434.5, 436.0, [
    [434.5, 18, 8],
    [435.0, 30, 33],
    [435.5, 25, 325],
    [436.0, 18, 167],
    [436.5, 0, 30],
  ]),
  createReferenceBar(cornStart + 54 * 60, 'corn-rth', 436.0, 437.5, 435.0, 437.0, [
    [435.0, 18, 30],
    [435.5, 108, 39],
    [436.0, 30, 51],
    [436.5, 167, 329],
    [437.0, 18, 294],
    [437.5, 0, 70],
  ]),
  createReferenceBar(cornStart + 62 * 60, 'corn-rth', 437.0, 438.0, 435.5, 436.5, [
    [435.5, 38, 31],
    [436.0, 51, 33],
    [436.5, 229, 133],
    [437.0, 185, 345],
    [437.5, 245, 542],
    [438.0, 0, 159],
  ]),
  createReferenceBar(cornStart + 97 * 60, 'corn-rth', 436.5, 439.0, 436.0, 438.5, [
    [436.0, 52, 0],
    [436.5, 608, 65],
    [437.0, 650, 534],
    [437.5, 420, 274],
    [438.0, 331, 274],
    [438.5, 81, 241],
    [439.0, 0, 22],
  ]),
  createReferenceBar(cornStart + 115 * 60, 'corn-rth', 438.5, 439.0, 436.5, 437.0, [
    [436.5, 865, 679],
    [437.0, 516, 83],
    [437.5, 203, 0],
    [438.0, 319, 4],
    [438.5, 189, 434],
    [439.0, 290, 0],
  ]),
  createReferenceBar(cornStart + 146 * 60, 'corn-rth', 437.0, 437.5, 435.0, 435.5, [
    [435.0, 189, 0],
    [435.5, 203, 0],
    [436.0, 516, 83],
    [436.5, 653, 152],
    [437.0, 0, 419],
    [437.5, 2, 12],
  ]),
  createReferenceBar(cornStart + 171 * 60, 'corn-rth', 435.5, 436.5, 434.0, 434.5, [
    [434.0, 51, 0],
    [434.5, 279, 41],
    [435.0, 280, 345],
    [435.5, 121, 137],
    [436.0, 0, 95],
    [436.5, 0, 95],
  ]),
];

export const cornInstrument: InstrumentContext = {
  instrumentId: 'corn-zc-09-15',
  symbol: 'ZC 09-15',
  tickSize: 0.5,
  pricePrecision: 2,
  timezone: 'UTC',
};

const volumeFootprintStart = 1711970400;

export const volumeFootprintBars: OrderFlowBar[] = [
  createReferenceBar(volumeFootprintStart, 'vf-rth', 74.5, 79.0, 73.5, 78.5, [
    [73.5, 55, 5],
    [74.0, 270, 17],
    [74.5, 612, 38],
    [75.0, 841, 135],
    [75.5, 692, 304],
    [76.0, 511, 285],
    [76.5, 198, 40],
    [77.0, 657, 91],
    [77.5, 320, 112],
    [78.0, 412, 20],
    [78.5, 86, 8],
    [79.0, 20, 0],
  ]),
  createReferenceBar(volumeFootprintStart + 30 * 60, 'vf-rth', 78.5, 79.0, 76.0, 76.5, [
    [76.0, 319, 63],
    [76.5, 206, 113],
    [77.0, 112, 107],
    [77.5, 94, 225],
    [78.0, 141, 233],
    [78.5, 112, 6],
    [79.0, 12, 0],
  ]),
  createReferenceBar(volumeFootprintStart + 60 * 60, 'vf-rth', 76.5, 77.5, 75.5, 76.0, [
    [75.5, 97, 32],
    [76.0, 84, 374],
    [76.5, 128, 214],
    [77.0, 154, 95],
    [77.5, 233, 149],
  ]),
  createReferenceBar(volumeFootprintStart + 90 * 60, 'vf-rth', 76.0, 79.0, 75.5, 78.5, [
    [75.5, 37, 0],
    [76.0, 114, 0],
    [76.5, 216, 0],
    [77.0, 733, 0],
    [77.5, 374, 129],
    [78.0, 166, 90],
    [78.5, 618, 73],
    [79.0, 313, 97],
  ]),
  createReferenceBar(volumeFootprintStart + 120 * 60, 'vf-rth', 78.5, 80.0, 76.0, 76.5, [
    [76.0, 933, 563],
    [76.5, 1141, 526],
    [77.0, 624, 227],
    [77.5, 756, 226],
    [78.0, 737, 245],
    [78.5, 825, 148],
    [79.0, 259, 0],
    [79.5, 17, 0],
    [80.0, 56, 0],
  ]),
  createReferenceBar(volumeFootprintStart + 150 * 60, 'vf-rth', 76.5, 78.0, 74.5, 75.0, [
    [74.5, 111, 12],
    [75.0, 103, 236],
    [75.5, 245, 381],
    [76.0, 171, 334],
    [76.5, 301, 13],
    [77.0, 304, 421],
    [77.5, 267, 610],
    [78.0, 39, 51],
  ]),
  createReferenceBar(volumeFootprintStart + 180 * 60, 'vf-rth', 75.0, 79.0, 74.0, 78.5, [
    [74.0, 109, 0],
    [74.5, 205, 0],
    [75.0, 326, 0],
    [75.5, 111, 0],
    [76.0, 205, 211],
    [76.5, 307, 87],
    [77.0, 379, 112],
    [77.5, 147, 418],
    [78.0, 459, 6],
    [78.5, 112, 13],
    [79.0, 7, 0],
  ]),
];

export const volumeFootprintInstrument: InstrumentContext = {
  instrumentId: 'orderflow-06-20',
  symbol: 'OrderFlow 06-20',
  tickSize: 0.5,
  pricePrecision: 1,
  timezone: 'UTC',
};

const shadesStart = 1711960200;

export const shadesBars: OrderFlowBar[] = [
  createReferenceBar(shadesStart, 'shades-rth', 1.0868, 1.0868, 1.0858, 1.086, [
    [1.0858, 12, 0],
    [1.086, 14, 11],
    [1.0862, 35, 28],
    [1.0864, 37, 5],
    [1.0866, 6, 20],
    [1.0868, 0, 1],
  ]),
  createReferenceBar(shadesStart + 10 * 60, 'shades-rth', 1.086, 1.0868, 1.0858, 1.0866, [
    [1.0858, 43, 19],
    [1.086, 17, 4],
    [1.0862, 18, 9],
    [1.0864, 6, 20],
    [1.0866, 8, 43],
    [1.0868, 0, 10],
  ]),
  createReferenceBar(shadesStart + 20 * 60, 'shades-rth', 1.0866, 1.0868, 1.0858, 1.086, [
    [1.0858, 2, 0],
    [1.086, 12, 0],
    [1.0862, 13, 10],
    [1.0864, 8, 32],
    [1.0866, 37, 26],
    [1.0868, 0, 7],
  ]),
  createReferenceBar(shadesStart + 35 * 60, 'shades-rth', 1.086, 1.0862, 1.085, 1.0852, [
    [1.085, 32, 15],
    [1.0852, 38, 10],
    [1.0854, 21, 57],
    [1.0856, 95, 94],
    [1.0858, 38, 50],
    [1.086, 7, 11],
    [1.0862, 0, 17],
  ]),
  createReferenceBar(shadesStart + 50 * 60, 'shades-rth', 1.0852, 1.0854, 1.0846, 1.0848, [
    [1.0846, 76, 4],
    [1.0848, 52, 14],
    [1.085, 32, 4],
    [1.0852, 28, 15],
    [1.0854, 33, 32],
  ]),
  createReferenceBar(shadesStart + 65 * 60, 'shades-rth', 1.0848, 1.0856, 1.0846, 1.0854, [
    [1.0846, 4, 7],
    [1.0848, 16, 17],
    [1.085, 9, 17],
    [1.0852, 3, 7],
    [1.0854, 23, 27],
    [1.0856, 0, 11],
  ]),
  createReferenceBar(shadesStart + 80 * 60, 'shades-rth', 1.0854, 1.0858, 1.0848, 1.085, [
    [1.0848, 12, 14],
    [1.085, 53, 36],
    [1.0852, 31, 20],
    [1.0854, 45, 19],
    [1.0856, 0, 10],
    [1.0858, 0, 1],
  ]),
  createReferenceBar(shadesStart + 95 * 60, 'shades-rth', 1.085, 1.0854, 1.0842, 1.0844, [
    [1.0842, 40, 21],
    [1.0844, 25, 60],
    [1.0846, 62, 21],
    [1.0848, 15, 42],
    [1.085, 24, 15],
    [1.0852, 7, 30],
    [1.0854, 0, 11],
  ]),
  createReferenceBar(shadesStart + 110 * 60, 'shades-rth', 1.0844, 1.0856, 1.0842, 1.0854, [
    [1.0842, 36, 0],
    [1.0844, 16, 34],
    [1.0846, 27, 21],
    [1.0848, 8, 16],
    [1.085, 9, 20],
    [1.0852, 19, 21],
    [1.0854, 17, 27],
    [1.0856, 0, 22],
  ]),
  createReferenceBar(shadesStart + 125 * 60, 'shades-rth', 1.0854, 1.0858, 1.085, 1.0852, [
    [1.085, 8, 0],
    [1.0852, 25, 12],
    [1.0854, 9, 21],
    [1.0856, 12, 36],
    [1.0858, 5, 17],
  ]),
];

export const shadesInstrument: InstrumentContext = {
  instrumentId: '6e-06-20',
  symbol: '6E 06-20',
  tickSize: 0.0002,
  pricePrecision: 4,
  timezone: 'UTC',
};
