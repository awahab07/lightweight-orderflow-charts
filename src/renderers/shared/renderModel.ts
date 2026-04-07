import type { FootprintLevelModel, ProfileModel } from '../../models/studies';
import type { FootprintSeriesOptions, FootprintTextMode } from '../../models/options';
import {
  formatCompactNumericValue,
  formatNumericValue,
  type NumericRoundingMode,
} from '../../utils/numberFormat';
import { clamp } from '../../utils/math';
import { resolveWidthRange } from '../../utils/width';

export function resolveBarWidth(
  barSpacing: number,
  options: Pick<FootprintSeriesOptions, 'layout'>,
): number {
  const widthRange = resolveWidthRange(barSpacing, options.layout.barWidth);

  return clamp(Math.floor(barSpacing), Math.floor(widthRange.min), Math.floor(widthRange.max));
}

export type FootprintDensity = 'full' | 'compact' | 'heatmap';

export function resolveFootprintDensity(barSpacing: number): FootprintDensity {
  if (barSpacing >= 38) {
    return 'full';
  }

  if (barSpacing >= 20) {
    return 'compact';
  }

  return 'heatmap';
}

export function resolveFootprintFontSize(baseFontSize: number, barWidth: number): number {
  return clamp(Math.floor(Math.min(baseFontSize, barWidth * 0.28)), 7, baseFontSize);
}

export interface FootprintRegion {
  left: number;
  width: number;
  centerX: number;
}

export interface FootprintBarLayout {
  left: number;
  width: number;
  right: number;
  candle: FootprintRegion | null;
  bidArea: FootprintRegion | null;
  askArea: FootprintRegion | null;
  separator: FootprintRegion | null;
  singleCellSegments: FootprintRegion[];
  singleCellTextCenterX: number;
}

function createRegion(left: number, width: number): FootprintRegion | null {
  if (width <= 0) {
    return null;
  }

  return {
    left,
    width,
    centerX: left + width / 2,
  };
}

export function resolveFootprintBarLayout(
  centerX: number,
  barWidth: number,
  options: Pick<FootprintSeriesOptions, 'candle' | 'ladder'>,
): FootprintBarLayout {
  const left = centerX - barWidth / 2;
  const right = left + barWidth;
  const separatorGap =
    options.ladder.separatorMode === 'letter'
      ? clamp(options.ladder.separatorGap, 0, Math.max(Math.floor(barWidth / 3), 0))
      : 0;

  if (!options.candle.visible) {
    const splitWidth = Math.max(barWidth - separatorGap, 2);
    const bidWidth = Math.max(Math.floor(splitWidth / 2), 1);
    const askWidth = Math.max(splitWidth - bidWidth, 1);

    return {
      left,
      width: barWidth,
      right,
      candle: null,
      bidArea: createRegion(left, bidWidth),
      askArea: createRegion(left + bidWidth + separatorGap, askWidth),
      separator: createRegion(left + bidWidth, separatorGap),
      singleCellSegments: [createRegion(left, barWidth)].filter((value): value is FootprintRegion =>
        Boolean(value),
      ),
      singleCellTextCenterX: centerX,
    };
  }

  const candleWidth = clamp(
    Math.floor(barWidth * options.candle.widthRatio),
    options.candle.minWidth,
    Math.min(options.candle.maxWidth, Math.max(barWidth - 2, options.candle.minWidth)),
  );
  const gap = clamp(options.candle.gap, 0, Math.max(Math.floor(barWidth / 4), 0));
  const candleSpan = candleWidth + gap * 2;

  if (options.candle.position === 'middle') {
    const leftWidth = Math.max(Math.floor((barWidth - candleSpan) / 2), 1);
    const rightWidth = Math.max(barWidth - leftWidth - candleSpan, 1);
    const bidArea = createRegion(left, leftWidth);
    const candle = createRegion(left + leftWidth + gap, candleWidth);
    const askArea = createRegion((candle?.left ?? left) + candleWidth + gap, rightWidth);
    const singleCellSegments = [bidArea, askArea].filter((value): value is FootprintRegion =>
      Boolean(value),
    );

    return {
      left,
      width: barWidth,
      right,
      candle,
      bidArea,
      askArea,
      separator: null,
      singleCellSegments,
      singleCellTextCenterX: askArea?.centerX ?? bidArea?.centerX ?? centerX,
    };
  }

  const candleLeft = options.candle.position === 'left' ? left : right - candleWidth;
  const candle = createRegion(candleLeft, candleWidth);
  const ladderLeft = options.candle.position === 'left' ? candleLeft + candleWidth + gap : left;
  const ladderRight =
    options.candle.position === 'left' ? right : Math.max(candleLeft - gap, ladderLeft + 1);
  const ladderWidth = Math.max(ladderRight - ladderLeft, 1);
  const splitWidth = Math.max(ladderWidth - separatorGap, 2);
  const bidWidth = Math.max(Math.floor(splitWidth / 2), 1);
  const askWidth = Math.max(splitWidth - bidWidth, 1);
  const bidArea = createRegion(ladderLeft, bidWidth);
  const separator = createRegion(ladderLeft + bidWidth, separatorGap);
  const askArea = createRegion(ladderLeft + bidWidth + separatorGap, askWidth);
  const singleCellSegment = createRegion(ladderLeft, ladderWidth);

  return {
    left,
    width: barWidth,
    right,
    candle,
    bidArea,
    askArea,
    separator,
    singleCellSegments: singleCellSegment ? [singleCellSegment] : [],
    singleCellTextCenterX: singleCellSegment?.centerX ?? centerX,
  };
}

export function formatFootprintValue(
  value: number,
  digits: number,
  rounding: NumericRoundingMode,
): string {
  return Number.isInteger(value)
    ? `${value}`
    : formatNumericValue(value, {
        digits,
        rounding,
      });
}

export function formatCompactFootprintValue(
  value: number,
  options: Pick<
    FootprintSeriesOptions['style'],
    'valueIntegerDigits' | 'valueDecimalDigits' | 'valueRounding' | 'valueUnitVisible'
  >,
): string {
  return formatCompactNumericValue(value, {
    integerDigits: options.valueIntegerDigits,
    decimalDigits: options.valueDecimalDigits,
    rounding: options.valueRounding,
    suffixVisible: options.valueUnitVisible,
  });
}

export function formatFootprintCellText(
  level: FootprintLevelModel,
  mode: FootprintTextMode,
  style: Pick<
    FootprintSeriesOptions['style'],
    'valueIntegerDigits' | 'valueDecimalDigits' | 'valueRounding' | 'valueUnitVisible'
  >,
): string {
  switch (mode) {
    case 'none':
      return '';
    case 'delta':
      return formatCompactFootprintValue(level.delta, style);
    case 'total':
      return formatCompactFootprintValue(level.totalVolume, style);
    case 'bid-ask':
    default:
      return `${formatCompactFootprintValue(level.bidVolume, style)} x ${formatCompactFootprintValue(level.askVolume, style)}`;
  }
}

export function resolveProfileLevelWidth(
  profile: ProfileModel,
  totalWidth: number,
  totalVolume: number,
): number {
  if (!profile.maxVolume) {
    return 0;
  }

  return (totalVolume / profile.maxVolume) * totalWidth;
}
