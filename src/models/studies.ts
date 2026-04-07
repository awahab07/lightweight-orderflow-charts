import type { TimeValue } from './contracts';

export type ImbalanceSide = 'buy' | 'sell' | 'none';

export interface FootprintLevelModel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  imbalanceSide: ImbalanceSide;
  isStackedImbalance: boolean;
  isPointOfControl: boolean;
  volumeRatioToMax: number;
  volumeRatioToAverage: number;
  deltaRatioToMaxAbs: number;
  absoluteDeltaRatioToMaxAbs: number;
  heat: number;
}

export interface FootprintBarModel {
  time: TimeValue;
  open: number;
  high: number;
  low: number;
  close: number;
  priceStep: number | null;
  totalVolume: number;
  delta: number;
  sessionId?: string;
  levels: FootprintLevelModel[];
  maxLevelVolume: number;
  maxAbsDelta: number;
  averageLevelVolume: number;
}

export interface ProfileLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
  ratio: number;
}

export interface ProfileValueArea {
  high: number;
  low: number;
}

export interface ProfileModel {
  scopeId: string;
  levels: ProfileLevel[];
  maxVolume: number;
  pointOfControl: number | null;
  valueArea: ProfileValueArea | null;
  fromTime?: TimeValue;
  toTime?: TimeValue;
  label?: string;
}

export interface DeltaSummaryColumnModel {
  time: TimeValue;
  delta: number;
  maxDelta: number;
  minDelta: number;
  cumulativeDelta: number;
  cumulativeDeltaToVolumeRatio: number;
  volume: number;
}
