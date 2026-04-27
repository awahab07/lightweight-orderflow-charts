import type {
  Coordinate,
  CustomBarItemData,
  ICustomSeriesPaneRenderer,
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type {
  FootprintBidAskShadingMetric,
  FootprintMetricItemOptions,
  FootprintSeriesOptions,
  FootprintSingleCellShadingMetric,
} from '../../models/options';
import type { FootprintBarModel, FootprintLevelModel } from '../../models/studies';
import { resolveColorScale, withAlpha } from '../../utils/color';
import {
  parseMetricBorderShorthand,
  resolveMetricStyleToken,
  resolveMetricStyleVariant,
} from '../../utils/metricStylePalette';
import { formatNumericValue } from '../../utils/numberFormat';
import { fillCenteredText } from '../shared/canvas';
import {
  formatCompactFootprintValue,
  formatFootprintCellText,
  resolveBarWidth,
  resolveFootprintBarLayout,
  resolveFootprintDensity,
  resolveFootprintFontSize,
  type FootprintDensity,
  type FootprintRegion,
} from '../shared/renderModel';

export interface RenderableFootprintBar {
  item: CustomBarItemData<TimeValue, OrderFlowBar>;
  model: FootprintBarModel;
}

export interface FootprintRendererState {
  bars: RenderableFootprintBar[];
  barSpacing: number;
  options: FootprintSeriesOptions;
}

interface ResolvedMetricItem {
  item: FootprintMetricItemOptions;
  text: string;
  rawValue: number | null;
  textColor: string;
  width: number;
  height: number;
  style: FootprintMetricItemOptions['style'];
}

function resolveBidAskShadingValue(
  level: FootprintLevelModel,
  metric: FootprintBidAskShadingMetric,
): number {
  return metric === 'volume/average' ? level.volumeRatioToAverage : level.volumeRatioToMax;
}

function resolveSingleCellShadingValue(
  level: FootprintLevelModel,
  metric: FootprintSingleCellShadingMetric,
): number {
  switch (metric) {
    case 'volume/average':
      return level.volumeRatioToAverage;
    case 'absolute-delta/max-abs':
      return level.absoluteDeltaRatioToMaxAbs;
    case 'volume/max':
    default:
      return level.volumeRatioToMax;
  }
}

function resolveSingleCellFillColor(
  level: FootprintLevelModel,
  options: FootprintSeriesOptions,
): string {
  const shadingValue = resolveSingleCellShadingValue(level, options.shading.singleCellMetric);

  if (options.shading.singleCellMetric === 'absolute-delta/max-abs') {
    return resolveColorScale(
      level.delta >= 0 ? options.shading.positiveDeltaScale : options.shading.negativeDeltaScale,
      shadingValue,
    );
  }

  return resolveColorScale(options.shading.neutralScale, shadingValue);
}

function resolveBidAskFillColors(
  level: FootprintLevelModel,
  options: FootprintSeriesOptions,
): { bidColor: string; askColor: string } {
  if (options.ladder.bidAskFillMode === 'by-delta') {
    const fillColor =
      level.delta > 0
        ? resolveColorScale(options.shading.positiveDeltaScale, level.absoluteDeltaRatioToMaxAbs)
        : level.delta < 0
          ? resolveColorScale(options.shading.negativeDeltaScale, level.absoluteDeltaRatioToMaxAbs)
          : resolveColorScale(options.shading.neutralScale, level.absoluteDeltaRatioToMaxAbs);

    return {
      bidColor: fillColor,
      askColor: fillColor,
    };
  }

  const shadingValue = resolveBidAskShadingValue(level, options.shading.bidAskMetric);

  if (options.ladder.bidAskFillMode === 'by-total-volume') {
    const fillColor = resolveColorScale(options.shading.neutralScale, shadingValue);

    return {
      bidColor: fillColor,
      askColor: fillColor,
    };
  }

  return {
    bidColor: resolveColorScale(options.shading.bidScale, shadingValue),
    askColor: resolveColorScale(options.shading.askScale, shadingValue),
  };
}

function resolveImbalanceTextDirection(
  level: FootprintLevelModel,
  options: FootprintSeriesOptions,
  side: 'bid' | 'ask',
): 'positive' | 'negative' | null {
  if (!options.ladder.highlightImbalanceText && !options.ladder.highlightDiagonalDominance) {
    return null;
  }

  if (side === 'ask' && level.imbalanceSide === 'buy') {
    return 'positive';
  }

  if (side === 'bid' && level.imbalanceSide === 'sell') {
    return 'negative';
  }

  return null;
}

function resolveBidAskTextAppearance(
  level: FootprintLevelModel,
  options: FootprintSeriesOptions,
  side: 'bid' | 'ask',
  fontSize: number,
): { color: string; font: string } {
  const defaultFont = `${fontSize}px ${options.style.fontFamily}`;
  const defaultColor = side === 'bid' ? options.style.bidTextColor : options.style.askTextColor;
  const direction = resolveImbalanceTextDirection(level, options, side);

  if (!direction) {
    return {
      color: defaultColor,
      font: defaultFont,
    };
  }

  if (options.style.imbalanceMetricStyleKey) {
    const token = resolveMetricStyleToken(
      options.style.metricStyles,
      options.style.imbalanceMetricStyleKey,
      direction === 'positive' ? 'primary' : 'secondary',
    );
    return {
      color: token.color,
      font: token.font,
    };
  }

  return {
    color:
      direction === 'positive'
        ? options.style.positiveImbalanceTextColor
        : options.style.negativeImbalanceTextColor,
    font:
      direction === 'positive'
        ? options.style.positiveImbalanceTextFont
        : options.style.negativeImbalanceTextFont,
  };
}

function pointOfControlRegions(
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  options: FootprintSeriesOptions,
): FootprintRegion[] {
  if (options.ladder.textMode === 'bid-ask' && layout.bidArea && layout.askArea) {
    return [layout.bidArea, layout.separator, layout.askArea].filter(
      (value): value is FootprintRegion => Boolean(value),
    );
  }

  if (layout.singleCellSegments.length > 0) {
    return layout.singleCellSegments;
  }

  return [layout.bidArea, layout.askArea].filter((value): value is FootprintRegion =>
    Boolean(value),
  );
}

function strokeHorizontalEdge(
  context: CanvasRenderingContext2D,
  left: number,
  right: number,
  y: number,
): void {
  context.beginPath();
  context.moveTo(left, y);
  context.lineTo(right, y);
  context.stroke();
}

function strokeVerticalEdge(
  context: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
): void {
  context.beginPath();
  context.moveTo(x, top);
  context.lineTo(x, bottom);
  context.stroke();
}

function drawBidAskSeparator(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  options: FootprintSeriesOptions,
  backgroundColor: string,
): void {
  if (
    options.ladder.separatorMode !== 'letter' ||
    !layout.separator ||
    !options.ladder.separatorLabel.trim()
  ) {
    return;
  }

  context.save();
  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor;
    context.fillRect(layout.separator.left, top, layout.separator.width, height);
  }
  context.font = options.style.separatorFont;
  context.fillStyle = options.style.separatorColor;
  fillCenteredText(
    context,
    options.ladder.separatorLabel,
    layout.separator.centerX,
    top + height / 2,
    options.style.separatorColor,
  );
  context.restore();
}

function buildFont(style: FootprintMetricItemOptions['style']): string {
  if (style.fontShorthand) {
    return style.fontShorthand;
  }

  return `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`.trim();
}

function applyMetricPaletteToken(
  style: FootprintMetricItemOptions['style'],
  token: ReturnType<typeof resolveMetricStyleToken>,
): FootprintMetricItemOptions['style'] {
  return {
    ...style,
    fontShorthand: token.font,
    borderShorthand: token.border ?? style.borderShorthand,
    textColor: token.color,
    positiveTextColor: token.color,
    negativeTextColor: token.color,
    neutralTextColor: token.color,
    backgroundColor: token.backgroundColor ?? style.backgroundColor,
    paddingX: token.paddingX ?? style.paddingX,
    paddingY: token.paddingY ?? style.paddingY,
  };
}

function isPriceMetricValueKey(
  valueKey: FootprintMetricItemOptions['valueKey'],
): valueKey is 'open' | 'high' | 'low' | 'close' {
  return valueKey === 'open' || valueKey === 'high' || valueKey === 'low' || valueKey === 'close';
}

function formatMetricValue(
  value: number,
  options: FootprintSeriesOptions,
  item: FootprintMetricItemOptions,
): string {
  if (isPriceMetricValueKey(item.valueKey)) {
    return formatNumericValue(value, {
      digits: options.style.priceDecimalDigits,
      rounding: options.style.priceRounding,
    });
  }

  return formatCompactFootprintValue(value, options.style);
}

function metricTextColor(
  style: FootprintMetricItemOptions['style'],
  rawValue: number | null,
): string {
  if (rawValue === null) {
    return style.textColor;
  }

  if (rawValue > 0) {
    return style.positiveTextColor;
  }

  if (rawValue < 0) {
    return style.negativeTextColor;
  }

  return style.neutralTextColor;
}

function metricLeft(
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  width: number,
  align: FootprintMetricItemOptions['align'],
): number {
  if (align === 'left') {
    return layout.left;
  }

  if (align === 'right') {
    return layout.right - width;
  }

  return layout.left + (layout.width - width) / 2;
}

function metricRawValue(bar: FootprintBarModel, item: FootprintMetricItemOptions): number | null {
  if (!item.valueKey) {
    return null;
  }

  return bar[item.valueKey];
}

function resolveMetricItem(
  context: CanvasRenderingContext2D,
  bar: FootprintBarModel,
  item: FootprintMetricItemOptions,
  options: FootprintSeriesOptions,
): ResolvedMetricItem | null {
  if (!item.visible) {
    return null;
  }

  const rawValue = metricRawValue(bar, item);
  const renderContext = {
    bar,
    item,
    placement: item.placement,
    rawValue,
  };
  const styleOverride = item.styleResolver?.(renderContext);

  if (styleOverride === null || styleOverride?.visible === false) {
    return null;
  }

  let style = {
    ...item.style,
    ...styleOverride,
  };
  if (item.metricStyleKey) {
    const token = resolveMetricStyleToken(
      options.style.metricStyles,
      item.metricStyleKey,
      resolveMetricStyleVariant(rawValue, item.metricStyleVariant),
    );
    style = applyMetricPaletteToken(style, token);
  }
  const formattedValue =
    item.formatter?.(renderContext) ??
    (rawValue === null ? (item.label ?? null) : formatMetricValue(rawValue, options, item));

  if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
    return null;
  }

  const valueText =
    typeof formattedValue === 'number'
      ? formatMetricValue(formattedValue, options, item)
      : formattedValue;
  const text =
    item.label && item.formatter === undefined && rawValue !== null
      ? `${item.label} ${valueText}`
      : valueText;

  context.save();
  context.font = buildFont(style);
  const textWidth = context.measureText(text).width;
  context.restore();

  return {
    item,
    text,
    rawValue,
    textColor: metricTextColor(style, rawValue),
    width: Math.ceil(textWidth + style.paddingX * 2),
    height: Math.ceil(style.fontSize + style.paddingY * 2),
    style,
  };
}

function drawMetricItem(
  context: CanvasRenderingContext2D,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  metric: ResolvedMetricItem,
  top: number,
): void {
  const left = metricLeft(layout, metric.width, metric.item.align);
  const centerX = left + metric.width / 2;
  const centerY = top + metric.height / 2;

  context.save();
  context.font = buildFont(metric.style);

  if (metric.style.backgroundColor !== 'transparent') {
    context.fillStyle = metric.style.backgroundColor;
    context.fillRect(left, top, metric.width, metric.height);
  }

  const shorthandBorder = parseMetricBorderShorthand(metric.style.borderShorthand);
  const borderWidth = shorthandBorder.width > 0 ? shorthandBorder.width : metric.style.borderWidth;
  const borderColor = shorthandBorder.color ?? metric.style.borderColor;

  if (borderWidth > 0) {
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(left, top, metric.width, metric.height);
  }

  fillCenteredText(context, metric.text, centerX, centerY, metric.textColor);
  context.restore();
}

function drawSummaryMetrics(
  context: CanvasRenderingContext2D,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  bar: FootprintBarModel,
  barTop: number,
  barBottom: number,
  options: FootprintSeriesOptions,
): void {
  const metrics = options.summary.items
    .map((item) => resolveMetricItem(context, bar, item, options))
    .filter((item): item is ResolvedMetricItem => Boolean(item));
  const topMetrics = metrics.filter((item) => item.item.placement === 'top');
  const bottomMetrics = metrics.filter((item) => item.item.placement === 'bottom');

  let topCursor = barTop;

  for (const metric of topMetrics) {
    topCursor -= metric.item.offset + metric.height;
    drawMetricItem(context, layout, metric, topCursor);
    topCursor -= options.summary.stackGap + metric.item.minSpacing;
  }

  let bottomCursor = barBottom;

  for (const metric of bottomMetrics) {
    bottomCursor += metric.item.offset;
    drawMetricItem(context, layout, metric, bottomCursor);
    bottomCursor += metric.height + options.summary.stackGap + metric.item.minSpacing;
  }
}

function drawBidAskCell(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  bar: FootprintBarModel,
  level: FootprintBarModel['levels'][number],
  options: FootprintSeriesOptions,
  density: FootprintDensity,
  fontSize: number,
): void {
  const bidArea = layout.bidArea;
  const askArea = layout.askArea;

  if (!bidArea || !askArea) {
    return;
  }

  const { bidColor, askColor } = resolveBidAskFillColors(level, options);
  const separatorBackgroundColor =
    options.ladder.bidAskFillMode === 'by-delta' || bidColor === askColor
      ? askColor
      : level.delta >= 0
        ? askColor
        : bidColor;

  if (options.ladder.showHeatmap) {
    context.fillStyle = bidColor;
    context.fillRect(bidArea.left, top, bidArea.width, height);
    context.fillStyle = askColor;
    context.fillRect(askArea.left, top, askArea.width, height);
  }

  drawImbalanceHighlights(context, top, height, layout, level, options, 'bid-ask');
  fillPointOfControlRow(context, top, height, layout, level, options);
  drawRegionBorders(context, top, height, [bidArea, askArea], options);
  strokePointOfControlRow(context, top, height, layout, level, options);
  drawBidAskSeparator(context, top, height, layout, options, separatorBackgroundColor);

  const centerY = top + height / 2;

  if (density === 'full') {
    const bidText = resolveBidAskTextAppearance(level, options, 'bid', fontSize);
    const askText = resolveBidAskTextAppearance(level, options, 'ask', fontSize);

    context.font = bidText.font;
    fillCenteredText(
      context,
      formatCompactFootprintValue(level.bidVolume, options.style),
      bidArea.centerX,
      centerY,
      bidText.color,
    );

    context.font = askText.font;
    fillCenteredText(
      context,
      formatCompactFootprintValue(level.askVolume, options.style),
      askArea.centerX,
      centerY,
      askText.color,
    );
  } else if (density === 'compact') {
    context.font = `${fontSize}px ${options.style.fontFamily}`;
    fillCenteredText(
      context,
      formatCompactFootprintValue(level.totalVolume, options.style),
      layout.singleCellTextCenterX,
      centerY,
      options.style.neutralTextColor,
    );
  }
}

function drawSingleCell(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  level: FootprintBarModel['levels'][number],
  options: FootprintSeriesOptions,
  density: FootprintDensity,
  fontSize: number,
): void {
  const regions = layout.singleCellSegments;
  let fillColor = resolveSingleCellFillColor(level, options);
  let textColor = options.style.textColor;

  if (options.ladder.textMode === 'delta') {
    textColor =
      level.delta >= 0 ? options.style.positiveDeltaColor : options.style.negativeDeltaColor;
  } else if (options.ladder.textMode === 'total') {
    textColor = options.style.neutralTextColor;
  }

  if (options.ladder.showHeatmap) {
    context.fillStyle = fillColor;

    for (const region of regions) {
      context.fillRect(region.left, top, region.width, height);
    }
  }

  drawImbalanceHighlights(context, top, height, layout, level, options, 'single');
  fillPointOfControlRow(context, top, height, layout, level, options);
  drawRegionBorders(context, top, height, regions, options);
  strokePointOfControlRow(context, top, height, layout, level, options);

  if (density !== 'heatmap') {
    context.font = `${fontSize}px ${options.style.fontFamily}`;
    fillCenteredText(
      context,
      formatFootprintCellText(level, options.ladder.textMode, options.style),
      layout.singleCellTextCenterX,
      top + height / 2,
      textColor,
    );
  }
}

function drawPriceCandle(
  context: CanvasRenderingContext2D,
  candle: FootprintRegion | null,
  model: FootprintBarModel,
  options: FootprintSeriesOptions,
  density: FootprintDensity,
  priceConverter: PriceToCoordinateConverter,
): void {
  if (!candle || !options.candle.visible) {
    return;
  }

  const openY = priceConverter(model.open);
  const highY = priceConverter(model.high);
  const lowY = priceConverter(model.low);
  const closeY = priceConverter(model.close);

  if (openY === null || highY === null || lowY === null || closeY === null) {
    return;
  }

  const candleCenterX = candle.centerX;
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  const bodyWidth = Math.max(Math.min(Math.floor(candle.width * 0.78), candle.width), 1);
  const bodyLeft = candleCenterX - bodyWidth / 2;
  const candleColor =
    model.close >= model.open ? options.style.bullishCandleColor : options.style.bearishCandleColor;
  const bodyFill =
    density === 'heatmap' ? withAlpha(candleColor, 0.75) : withAlpha(candleColor, 0.9);

  context.save();
  if (options.candle.showWicks) {
    context.strokeStyle = options.style.candleWickColor;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(candleCenterX, highY);
    context.lineTo(candleCenterX, lowY);
    context.stroke();
  }

  context.strokeStyle = options.style.candleBorderColor;

  if (bodyHeight <= 1) {
    context.beginPath();
    context.moveTo(bodyLeft, bodyTop);
    context.lineTo(bodyLeft + bodyWidth, bodyTop);
    context.stroke();
  } else {
    context.fillStyle = bodyFill;
    context.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
    context.strokeRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
  }

  context.restore();
}

function drawRegionBorders(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  regions: FootprintRegion[],
  options: FootprintSeriesOptions,
): void {
  if (options.ladder.cellBorderWidth <= 0) {
    return;
  }

  context.save();
  context.strokeStyle = options.style.cellBorderColor;
  context.lineWidth = options.ladder.cellBorderWidth;

  for (const region of regions) {
    context.strokeRect(region.left, top, region.width, height);
  }

  context.restore();
}

function drawImbalanceHighlights(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  level: FootprintBarModel['levels'][number],
  options: FootprintSeriesOptions,
  mode: 'bid-ask' | 'single',
): void {
  if (options.ladder.highlightImbalances && level.imbalanceSide !== 'none') {
    context.save();
    context.fillStyle =
      level.imbalanceSide === 'buy'
        ? options.style.buyImbalanceFillColor
        : options.style.sellImbalanceFillColor;

    if (mode === 'bid-ask') {
      const region = level.imbalanceSide === 'buy' ? layout.askArea : layout.bidArea;

      if (region) {
        context.fillRect(region.left, top, region.width, height);
      }
    } else {
      for (const region of layout.singleCellSegments) {
        context.fillRect(region.left, top, region.width, height);
      }
    }

    context.restore();
  }

  if (options.ladder.highlightStackedImbalances && level.isStackedImbalance) {
    context.save();
    context.fillStyle =
      level.imbalanceSide === 'buy'
        ? options.style.stackedBuyImbalanceFillColor
        : options.style.stackedSellImbalanceFillColor;
    context.fillRect(layout.left, top, layout.width, height);

    if (options.ladder.stackedImbalanceBorderWidth > 0) {
      context.strokeStyle = options.style.stackedImbalanceOutline;
      context.lineWidth = options.ladder.stackedImbalanceBorderWidth;
      context.strokeRect(layout.left, top, layout.width, height);
    }

    context.restore();
  }
}

function fillPointOfControlRow(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  level: FootprintBarModel['levels'][number],
  options: FootprintSeriesOptions,
): void {
  if (!options.pointOfControl.visible || !level.isPointOfControl) {
    return;
  }

  const regions = pointOfControlRegions(layout, options);

  context.save();
  context.fillStyle = options.pointOfControl.backgroundColor;

  for (const region of regions) {
    context.fillRect(region.left, top, region.width, height);
  }

  context.restore();
}

function strokePointOfControlRow(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  level: FootprintBarModel['levels'][number],
  options: FootprintSeriesOptions,
): void {
  if (
    !options.pointOfControl.visible ||
    !level.isPointOfControl ||
    options.pointOfControl.borderWidth <= 0
  ) {
    return;
  }

  const regions = pointOfControlRegions(layout, options);
  const bottom = top + height;

  context.save();
  context.strokeStyle = options.pointOfControl.borderColor;
  context.lineWidth = options.pointOfControl.borderWidth;

  if (options.ladder.textMode === 'bid-ask' && layout.bidArea && layout.askArea) {
    const left = layout.bidArea.left;
    const right = layout.askArea.left + layout.askArea.width;
    strokeHorizontalEdge(context, left, right, top);
    strokeHorizontalEdge(context, left, right, bottom);
    strokeVerticalEdge(context, left, top, bottom);
    strokeVerticalEdge(context, right, top, bottom);
  } else {
    for (const region of regions) {
      context.strokeRect(region.left, top, region.width, height);
    }
  }

  context.restore();
}

function drawBarOutline(
  context: CanvasRenderingContext2D,
  top: number,
  height: number,
  layout: ReturnType<typeof resolveFootprintBarLayout>,
  options: FootprintSeriesOptions,
): void {
  if (options.ladder.borderWidth <= 0) {
    return;
  }

  context.save();
  context.strokeStyle = options.style.ladderBorderColor;
  context.lineWidth = options.ladder.borderWidth;
  context.strokeRect(layout.left, top, layout.width, height);
  context.restore();
}

function resolveRowBounds(
  model: FootprintBarModel,
  level: FootprintBarModel['levels'][number],
  index: number,
  currentY: number,
  priceConverter: PriceToCoordinateConverter,
  fallbackRowHeight: number,
): { top: number; bottom: number } {
  if (model.priceStep && model.priceStep > 0) {
    let upperY = priceConverter(level.price + model.priceStep / 2);
    let lowerY = priceConverter(level.price - model.priceStep / 2);

    if (upperY === null && lowerY !== null) {
      upperY = (currentY - (lowerY - currentY)) as Coordinate;
    }

    if (lowerY === null && upperY !== null) {
      lowerY = (currentY + (currentY - upperY)) as Coordinate;
    }

    if (upperY !== null && lowerY !== null) {
      return {
        top: Math.min(upperY, lowerY),
        bottom: Math.max(upperY, lowerY),
      };
    }
  }

  const previousY =
    index > 0
      ? (priceConverter(model.levels[index - 1].price) ?? currentY + fallbackRowHeight)
      : currentY + fallbackRowHeight;
  const nextY =
    index < model.levels.length - 1
      ? (priceConverter(model.levels[index + 1].price) ?? currentY - fallbackRowHeight)
      : currentY - fallbackRowHeight;

  return {
    top: Math.min((currentY + nextY) / 2, (currentY + previousY) / 2),
    bottom: Math.max((currentY + nextY) / 2, (currentY + previousY) / 2),
  };
}

export class FootprintSeriesRenderer implements ICustomSeriesPaneRenderer {
  public state: FootprintRendererState = {
    bars: [],
    barSpacing: 0,
    options: {} as FootprintSeriesOptions,
  };

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace(({ context, bitmapSize }) => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
      context.restore();
    });

    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      context.save();
      context.beginPath();
      context.rect(0, 0, mediaSize.width, mediaSize.height);
      context.clip();
      const barWidth = resolveBarWidth(this.state.barSpacing, this.state.options);
      const barLayout = resolveFootprintBarLayout(0, barWidth, this.state.options);
      const density = resolveFootprintDensity(this.state.barSpacing);
      const fontTargetWidth = Math.max(
        barLayout.bidArea?.width ?? 0,
        barLayout.askArea?.width ?? 0,
        ...barLayout.singleCellSegments.map((segment) => segment.width),
      );
      const fontSize = resolveFootprintFontSize(this.state.options.style.fontSize, fontTargetWidth);

      for (const entry of this.state.bars) {
        const { model } = entry;
        if (!model.levels.length) {
          continue;
        }

        const layout = resolveFootprintBarLayout(entry.item.x, barWidth, this.state.options);
        if (layout.right <= 0 || layout.left >= mediaSize.width) {
          continue;
        }
        let barTop = Number.POSITIVE_INFINITY;
        let barBottom = Number.NEGATIVE_INFINITY;

        for (let index = 0; index < model.levels.length; index += 1) {
          const level = model.levels[index];
          const currentY = priceConverter(level.price);

          if (currentY === null) {
            continue;
          }

          const { top, bottom } = resolveRowBounds(
            model,
            level,
            index,
            currentY,
            priceConverter,
            optionsRowHeight(this.state.options),
          );
          const height = Math.max(bottom - top, 1);
          barTop = Math.min(barTop, top);
          barBottom = Math.max(barBottom, bottom);

          if (this.state.options.ladder.textMode === 'bid-ask') {
            drawBidAskCell(
              context,
              top,
              height,
              layout,
              model,
              level,
              this.state.options,
              density,
              fontSize,
            );
          } else {
            drawSingleCell(
              context,
              top,
              height,
              layout,
              level,
              this.state.options,
              density,
              fontSize,
            );
          }
        }

        if (Number.isFinite(barTop) && Number.isFinite(barBottom)) {
          drawBarOutline(
            context,
            barTop,
            Math.max(barBottom - barTop, 1),
            layout,
            this.state.options,
          );
        }

        drawPriceCandle(context, layout.candle, model, this.state.options, density, priceConverter);

        if (density !== 'heatmap' && Number.isFinite(barTop) && Number.isFinite(barBottom)) {
          drawSummaryMetrics(context, layout, model, barTop, barBottom, this.state.options);
        }
      }

      context.restore();
    });
  }
}

function optionsRowHeight(options: FootprintSeriesOptions): number {
  return options.ladder.rowHeight;
}
