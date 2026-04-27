import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type CandlestickData,
  CandlestickSeries,
  type CandlestickSeriesPartialOptions,
  ColorType,
  CrosshairMode,
  createChart,
  HistogramSeries,
  type HistogramSeriesPartialOptions,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type LineSeriesPartialOptions,
} from 'lightweight-charts';

import type {
  CandleHeatmapPartialOptions,
  DeltaSummarySeriesPartialOptions,
  FootprintSeriesPartialOptions,
  OrderFlowBar,
  SeriesMetricPrimitiveDatum,
  SessionVolumeProfilePartialOptions,
  TimeValue,
  VolumeFootprintPartialOptions,
  VolumeProfilePartialOptions,
  ChartViewStateSnapshot,
} from 'lightweight-orderflow-charts';
import {
  ChartProvider,
  DeltaSummarySeries,
  FootprintSeries,
  SessionVolumeProfiles,
  VolumeFootprint,
  VolumeProfile,
  VwapSeries,
} from 'lightweight-orderflow-charts/react';
import {
  buildCandleHeatmapSeriesData,
  captureChartViewState,
  createSeriesMetricPrimitive,
  inferPriceStep,
  restoreChartViewState,
  setPriceScaleAutoFit,
  type SeriesMetricPrimitive,
} from 'lightweight-orderflow-charts';
import { safeRemoveSeries } from '../../../src/utils/lightweightCharts';

export type SeriesMode = 'footprint' | 'volume-footprint' | 'candle-heatmap';

export interface OrderFlowChartTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  borderColor: string;
  crosshairColor: string;
  panelBackground: string;
  panelBorder: string;
}

const DEFAULT_THEME: OrderFlowChartTheme = {
  backgroundColor: '#020617',
  textColor: '#e2e8f0',
  gridColor: 'rgba(148, 163, 184, 0.12)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  crosshairColor: 'rgba(255, 255, 255, 0.24)',
  panelBackground: 'rgba(15, 23, 42, 0.75)',
  panelBorder: '1px solid rgba(148, 163, 184, 0.12)',
};

const AUTO_FIT_UPDATE_THROTTLE_MS = 250;
const AUTO_FIT_TOP_INSET_RATIO = 0.05;
const AUTO_FIT_BOTTOM_INSET_RATIO = 0.05;
const SUPPORT_PANE_MIN_HEIGHT = 80;

function clampRatio(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface PaneHeightTarget {
  paneIndex: number;
  ratio: number;
  minHeight?: number;
}

function applyPaneHeightTargets(
  chart: IChartApi,
  panes: ReturnType<IChartApi['panes']>,
  chartHeight: number,
  containerWidth: number | undefined,
  targets: PaneHeightTarget[],
): void {
  const activeTargets = targets.filter(
    (target) => target.ratio > 0 && panes[target.paneIndex] !== undefined,
  );

  if (!activeTargets.length) {
    return;
  }

  const totalHeight = panes.reduce((sum, pane) => sum + pane.getHeight(), 0);

  if (totalHeight <= 0) {
    return;
  }

  const totalRatio = activeTargets.reduce((sum, target) => sum + target.ratio, 0);

  if (totalRatio <= 0) {
    return;
  }

  const heights = activeTargets.map((target) =>
    Math.round((totalHeight * target.ratio) / totalRatio),
  );
  const minimumHeights = activeTargets.map((target) => target.minHeight ?? 0);

  for (let index = 0; index < heights.length; index += 1) {
    heights[index] = Math.max(heights[index] ?? 0, minimumHeights[index] ?? 0);
  }

  let overflow = heights.reduce((sum, height) => sum + height, 0) - totalHeight;

  while (overflow > 0) {
    const candidates = heights
      .map((height, index) => ({
        index,
        slack: height - (minimumHeights[index] ?? 0),
      }))
      .filter((candidate) => candidate.slack > 0)
      .sort((left, right) => right.slack - left.slack);

    if (!candidates.length) {
      break;
    }

    for (const candidate of candidates) {
      if (overflow <= 0) {
        break;
      }

      const reduction = Math.min(candidate.slack, overflow);
      heights[candidate.index] -= reduction;
      overflow -= reduction;
    }
  }

  const primaryIndex = activeTargets.reduce(
    (bestIndex, target, index, collection) =>
      target.ratio > collection[bestIndex]!.ratio ? index : bestIndex,
    0,
  );
  const remainingHeight = totalHeight - heights.reduce((sum, height) => sum + height, 0);

  if (remainingHeight !== 0) {
    heights[primaryIndex] = Math.max(
      (heights[primaryIndex] ?? 0) + remainingHeight,
      minimumHeights[primaryIndex] ?? 0,
    );
  }

  activeTargets.forEach((target, index) => {
    panes[target.paneIndex]?.setHeight(heights[index] ?? 0);
  });

  if (containerWidth) {
    chart.resize(containerWidth, chartHeight, true);
  }
}

interface OrderFlowChartProps {
  bars: OrderFlowBar[];
  seriesMode: SeriesMode;
  showOrderFlowPane?: boolean;
  showVisibleProfile?: boolean;
  showSessionProfiles?: boolean;
  showVwap?: boolean;
  showReferenceCandles?: boolean;
  referencePanePlacement?: 'top' | 'bottom';
  referencePaneHeightRatio?: number;
  showVolumePane?: boolean;
  showVolumeDeltaPivot?: boolean;
  showDeltaSummary?: boolean;
  deltaSummaryPaneHeightRatio?: number;
  chartHeight?: number;
  footerText?: string;
  theme?: Partial<OrderFlowChartTheme>;
  footprintOptions?: FootprintSeriesPartialOptions;
  volumeFootprintOptions?: VolumeFootprintPartialOptions;
  volumeProfileOptions?: VolumeProfilePartialOptions;
  sessionVolumeProfileOptions?: SessionVolumeProfilePartialOptions;
  deltaSummaryOptions?: DeltaSummarySeriesPartialOptions;
  volumeDeltaPivotData?: CandlestickData<TimeValue>[];
  volumeDeltaPivotSeriesOptions?: CandlestickSeriesPartialOptions;
  volumeDeltaPivotBaselineOptions?: LineSeriesPartialOptions;
  candleSeriesOptions?: CandlestickSeriesPartialOptions;
  candleHeatmapOptions?: CandleHeatmapPartialOptions;
  candleHeatmapAccessor?: (
    bar: OrderFlowBar,
    index: number,
    bars: readonly OrderFlowBar[],
  ) => number | null | undefined;
  candleMetricData?: SeriesMetricPrimitiveDatum[];
  volumeSeriesOptions?: HistogramSeriesPartialOptions;
  initialViewState?: ChartViewStateSnapshot | null;
  onViewStateChange?: (snapshot: ChartViewStateSnapshot) => void;
  defaultAutoFitEnabled?: boolean;
  dataSourceKey?: string;
  autoFitRequestKey?: number;
}

interface PriceScaleContextMenuState {
  x: number;
  y: number;
}

function hasAutoScaleRestorePanes(snapshot: ChartViewStateSnapshot | null | undefined): boolean {
  return Boolean(snapshot?.panes.some((pane) => pane.priceRange === null));
}

function hasExplicitPanePriceRange(snapshot: ChartViewStateSnapshot | null | undefined): boolean {
  return Boolean(snapshot?.panes.some((pane) => pane.priceRange !== null));
}

function freezeAutoScaleRestorePanes(
  chart: IChartApi,
  snapshot: ChartViewStateSnapshot | null | undefined,
): void {
  if (!snapshot) {
    return;
  }

  const panes = chart.panes();

  for (const pane of snapshot.panes) {
    if (pane.priceRange !== null || !panes[pane.paneIndex]) {
      continue;
    }

    const priceScale = chart.priceScale(pane.priceScaleId, pane.paneIndex);
    const visibleRange = priceScale.getVisibleRange();

    if (!visibleRange) {
      continue;
    }

    priceScale.setAutoScale(false);
    priceScale.setVisibleRange(visibleRange);
  }
}

function restorePanePriceRanges(
  chart: IChartApi,
  snapshot: ChartViewStateSnapshot | null | undefined,
): void {
  if (!snapshot) {
    return;
  }

  const panes = chart.panes();

  for (const pane of snapshot.panes) {
    if (!panes[pane.paneIndex]) {
      continue;
    }

    const priceScale = chart.priceScale(pane.priceScaleId, pane.paneIndex);

    if (pane.priceRange) {
      priceScale.setAutoScale(false);
      priceScale.setVisibleRange(pane.priceRange);
    } else {
      priceScale.setAutoScale(true);
    }
  }
}

export function OrderFlowChart({
  bars,
  seriesMode,
  showOrderFlowPane = true,
  showVisibleProfile = true,
  showSessionProfiles = true,
  showVwap = true,
  showReferenceCandles = true,
  referencePanePlacement = 'top',
  referencePaneHeightRatio,
  showVolumePane = true,
  showVolumeDeltaPivot = false,
  showDeltaSummary = false,
  deltaSummaryPaneHeightRatio,
  chartHeight = 860,
  footerText,
  theme,
  footprintOptions,
  volumeFootprintOptions,
  volumeProfileOptions,
  sessionVolumeProfileOptions,
  deltaSummaryOptions,
  volumeDeltaPivotData,
  volumeDeltaPivotSeriesOptions,
  volumeDeltaPivotBaselineOptions,
  candleSeriesOptions,
  candleHeatmapOptions,
  candleHeatmapAccessor,
  candleMetricData,
  volumeSeriesOptions,
  initialViewState,
  onViewStateChange,
  defaultAutoFitEnabled = false,
  dataSourceKey,
  autoFitRequestKey,
}: OrderFlowChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const candleMetricPrimitiveRef = useRef<SeriesMetricPrimitive | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', TimeValue> | null>(null);
  const volumeDeltaPivotSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const volumeDeltaPivotBaselineRef = useRef<ISeriesApi<'Line', TimeValue> | null>(null);
  const restoredMainViewSignatureRef = useRef<string | null>(null);
  const restoredViewSignatureRef = useRef<string | null>(null);
  const seriesRemountSignatureRef = useRef<string | null>(null);
  const pendingPaneRestoreSignatureRef = useRef<string | null>(null);
  const handledAutoFitRequestRef = useRef<number | null>(null);
  const emitFrameRef = useRef<number | null>(null);
  const emitTimeoutRef = useRef<number | null>(null);
  const emitResumeTimeoutRef = useRef<number | null>(null);
  const blockViewStateEmitRef = useRef(false);
  const autoFitFrameRef = useRef<number | null>(null);
  const autoFitTimeoutRef = useRef<number | null>(null);
  const autoFitLastAppliedAtRef = useRef(0);
  const autoFitEnabledRef = useRef(defaultAutoFitEnabled);
  const restoreRedrawFrameRef = useRef<number | null>(null);
  const restoreFreezeFrameRef = useRef<number | null>(null);
  const seriesDataSourceKeyRef = useRef<string | null>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(null);
  const [seriesDataSourceKey, setSeriesDataSourceKey] = useState<string | null>(null);
  const [seriesRenderKey, setSeriesRenderKey] = useState(0);
  const [referenceCandleReady, setReferenceCandleReady] = useState(false);
  const [deltaSummaryReady, setDeltaSummaryReady] = useState(false);
  const [volumePaneReady, setVolumePaneReady] = useState(false);
  const [volumeDeltaPivotReady, setVolumeDeltaPivotReady] = useState(false);
  const [autoFitEnabled, setAutoFitEnabled] = useState(defaultAutoFitEnabled);
  const [priceScaleContextMenu, setPriceScaleContextMenu] =
    useState<PriceScaleContextMenuState | null>(null);
  const resolvedTheme = useMemo(
    () => ({
      ...DEFAULT_THEME,
      ...theme,
    }),
    [theme],
  );
  const showCandleSeries = seriesMode === 'candle-heatmap' || showReferenceCandles;
  const showOrderFlowSeries = showOrderFlowPane && seriesMode !== 'candle-heatmap';
  const referenceCandlePaneIndex = showCandleSeries
    ? showOrderFlowSeries && referencePanePlacement === 'bottom'
      ? 1
      : 0
    : null;
  const orderFlowPaneIndex = showOrderFlowSeries
    ? showCandleSeries
      ? referencePanePlacement === 'bottom'
        ? 0
        : 1
      : 0
    : null;
  let nextStudyPaneIndex = Math.max(referenceCandlePaneIndex ?? -1, orderFlowPaneIndex ?? -1) + 1;
  const volumePaneIndex = showVolumePane ? nextStudyPaneIndex++ : null;
  const volumeDeltaPivotPaneIndex = showVolumeDeltaPivot ? nextStudyPaneIndex++ : null;
  const deltaSummaryPaneIndex = showDeltaSummary ? nextStudyPaneIndex++ : null;
  const mainPricePaneIndex = referenceCandlePaneIndex ?? orderFlowPaneIndex ?? 0;
  const resolvedDataSourceKey = dataSourceKey ?? 'default';
  const orderFlowSeriesReady = Boolean(series) && seriesDataSourceKey === resolvedDataSourceKey;
  const handleOrderFlowSeriesReady = useCallback(
    (nextSeries: ISeriesApi<'Custom', TimeValue> | null) => {
      if (nextSeries) {
        setSeries(nextSeries);
        setSeriesDataSourceKey(resolvedDataSourceKey);
        return;
      }

      if (seriesDataSourceKeyRef.current !== resolvedDataSourceKey) {
        return;
      }

      setSeries(null);
      setSeriesDataSourceKey(null);
    },
    [resolvedDataSourceKey],
  );
  const handleDeltaSummaryReady = useCallback(() => {
    setDeltaSummaryReady(true);
  }, []);
  const primaryPaneReady = showOrderFlowSeries
    ? orderFlowSeriesReady
    : showCandleSeries
      ? referenceCandleReady
      : Boolean(chart);
  const restorablePaneStateReady =
    primaryPaneReady &&
    (!showCandleSeries || referenceCandleReady) &&
    (!showVolumePane || volumePaneReady) &&
    (!showVolumeDeltaPivot || volumeDeltaPivotReady) &&
    (!showDeltaSummary || deltaSummaryReady);

  const cancelScheduledAutoFit = () => {
    if (autoFitTimeoutRef.current !== null) {
      window.clearTimeout(autoFitTimeoutRef.current);
      autoFitTimeoutRef.current = null;
    }

    if (autoFitFrameRef.current !== null) {
      window.cancelAnimationFrame(autoFitFrameRef.current);
      autoFitFrameRef.current = null;
    }
  };

  const applyAutoFitNow = () => {
    if (!chart || !primaryPaneReady || !bars.length) {
      return;
    }

    autoFitLastAppliedAtRef.current = Date.now();
    series?.setData(bars);
    candleSeriesRef.current?.setData(candleData);

    const visibleLogicalRange = chart.timeScale().getVisibleLogicalRange();
    const startIndex = visibleLogicalRange
      ? Math.max(0, Math.floor(visibleLogicalRange.from) - 1)
      : 0;
    const endIndex = visibleLogicalRange
      ? Math.min(bars.length - 1, Math.ceil(visibleLogicalRange.to) + 1)
      : bars.length - 1;
    const visibleBars = bars.slice(startIndex, endIndex + 1);

    if (!visibleBars.length) {
      return;
    }

    const highestPrice = visibleBars.reduce(
      (maximum, bar) => Math.max(maximum, bar.high),
      Number.NEGATIVE_INFINITY,
    );
    const lowestPrice = visibleBars.reduce(
      (minimum, bar) => Math.min(minimum, bar.low),
      Number.POSITIVE_INFINITY,
    );
    const inferredStep =
      inferPriceStep(visibleBars.flatMap((bar) => bar.levels)) ??
      inferPriceStep(
        visibleBars.flatMap((bar) => [
          { price: bar.open },
          { price: bar.high },
          { price: bar.low },
          { price: bar.close },
        ]),
      ) ??
      0.01;
    const contentSpan = Math.max(highestPrice - lowestPrice, inferredStep);
    const usableRatio = Math.max(1 - AUTO_FIT_TOP_INSET_RATIO - AUTO_FIT_BOTTOM_INSET_RATIO, 0.01);
    const paddedSpan = contentSpan / usableRatio;
    const priceScale = chart.priceScale('right', mainPricePaneIndex);

    priceScale.applyOptions({
      autoScale: false,
      scaleMargins: {
        top: AUTO_FIT_TOP_INSET_RATIO,
        bottom: AUTO_FIT_BOTTOM_INSET_RATIO,
      },
    });
    priceScale.setAutoScale(false);
    priceScale.setVisibleRange({
      from: lowestPrice - paddedSpan * AUTO_FIT_BOTTOM_INSET_RATIO,
      to: highestPrice + paddedSpan * AUTO_FIT_TOP_INSET_RATIO,
    });

    const width = containerRef.current?.clientWidth;

    if (width) {
      chart.applyOptions({ width });
    }
  };

  const requestAutoFit = (immediate = false) => {
    if (!chart || !primaryPaneReady) {
      return;
    }

    if (immediate) {
      cancelScheduledAutoFit();
    } else if (autoFitTimeoutRef.current !== null || autoFitFrameRef.current !== null) {
      return;
    }

    const elapsedMs = Date.now() - autoFitLastAppliedAtRef.current;
    const delayMs = immediate ? 0 : Math.max(AUTO_FIT_UPDATE_THROTTLE_MS - elapsedMs, 0);

    const scheduleFrame = () => {
      autoFitTimeoutRef.current = null;
      autoFitFrameRef.current = window.requestAnimationFrame(() => {
        autoFitFrameRef.current = null;

        if (!autoFitEnabledRef.current && !immediate) {
          return;
        }

        applyAutoFitNow();
      });
    };

    if (delayMs === 0) {
      scheduleFrame();
      return;
    }

    autoFitTimeoutRef.current = window.setTimeout(scheduleFrame, delayMs);
  };

  const setAutoFitMode = (enabled: boolean) => {
    setAutoFitEnabled(enabled);
    autoFitEnabledRef.current = enabled;
    setPriceScaleContextMenu(null);

    cancelScheduledAutoFit();

    if (!chart) {
      return;
    }

    if (enabled) {
      requestAutoFit(true);
      return;
    }

    setPriceScaleAutoFit(chart, false, {
      paneIndex: mainPricePaneIndex,
      topInsetRatio: AUTO_FIT_TOP_INSET_RATIO,
      bottomInsetRatio: AUTO_FIT_BOTTOM_INSET_RATIO,
    });
  };

  const candleData = useMemo(() => {
    if (seriesMode === 'candle-heatmap' && candleHeatmapAccessor) {
      return buildCandleHeatmapSeriesData({
        bars,
        options: candleHeatmapOptions,
        backgroundColor: resolvedTheme.backgroundColor,
        getValue: candleHeatmapAccessor,
      });
    }

    return bars.map((bar) => ({
      time: bar.time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
  }, [
    bars,
    candleHeatmapAccessor,
    candleHeatmapOptions,
    resolvedTheme.backgroundColor,
    seriesMode,
  ]);

  const volumeData = useMemo(
    () =>
      bars.map((bar) => ({
        time: bar.time,
        value:
          bar.totalVolume ??
          bar.levels.reduce(
            (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
            0,
          ),
        color: bar.close >= bar.open ? 'rgba(34, 197, 94, 0.55)' : 'rgba(239, 68, 68, 0.55)',
      })),
    [bars],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const nextChart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: DEFAULT_THEME.backgroundColor },
        textColor: DEFAULT_THEME.textColor,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: DEFAULT_THEME.gridColor, visible: true, style: 0 },
        horzLines: { color: DEFAULT_THEME.gridColor, visible: true, style: 0 },
      },
      rightPriceScale: {
        borderColor: DEFAULT_THEME.borderColor,
      },
      timeScale: {
        borderColor: DEFAULT_THEME.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 3,
        minBarSpacing: 8,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: DEFAULT_THEME.crosshairColor },
        horzLine: { color: DEFAULT_THEME.crosshairColor },
      },
    });

    const handleResize = () => {
      if (containerRef.current) {
        nextChart.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    setChart(nextChart);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.setTimeout(() => {
        nextChart.remove();
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (!chart || !containerRef.current) {
      return;
    }

    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: resolvedTheme.backgroundColor },
        textColor: resolvedTheme.textColor,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: resolvedTheme.gridColor, visible: true, style: 0 },
        horzLines: { color: resolvedTheme.gridColor, visible: true, style: 0 },
      },
      rightPriceScale: {
        borderColor: resolvedTheme.borderColor,
      },
      timeScale: {
        borderColor: resolvedTheme.borderColor,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: resolvedTheme.crosshairColor },
        horzLine: { color: resolvedTheme.crosshairColor },
      },
    });
  }, [chart, chartHeight, resolvedTheme]);

  useEffect(() => {
    if (!chart || !bars.length || initialViewState || !primaryPaneReady) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      chart.timeScale().fitContent();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    bars,
    chart,
    initialViewState,
    primaryPaneReady,
    seriesMode,
    showDeltaSummary,
    showCandleSeries,
    showVolumePane,
  ]);

  useEffect(() => {
    if (
      !chart ||
      !showCandleSeries ||
      (showOrderFlowSeries && referencePanePlacement === 'bottom' && !orderFlowSeriesReady)
    ) {
      return;
    }

    const candleSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: '#22c55e',
        downColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        borderVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
        ...candleSeriesOptions,
      },
      referenceCandlePaneIndex ?? 0,
    );

    candleSeries.setData(candleData);
    const metricPrimitive = createSeriesMetricPrimitive({
      data: candleMetricData ?? [],
    });
    candleSeries.attachPrimitive(metricPrimitive);
    candleMetricPrimitiveRef.current = metricPrimitive;
    candleSeriesRef.current = candleSeries;
    setReferenceCandleReady(true);

    return () => {
      candleSeries.detachPrimitive(metricPrimitive);
      candleMetricPrimitiveRef.current = null;
      safeRemoveSeries(chart, candleSeries);
      candleSeriesRef.current = null;
      setReferenceCandleReady(false);
    };
  }, [
    candleData,
    candleMetricData,
    candleSeriesOptions,
    chart,
    orderFlowSeriesReady,
    referenceCandlePaneIndex,
    referencePanePlacement,
    showCandleSeries,
    showOrderFlowSeries,
  ]);

  useEffect(() => {
    seriesDataSourceKeyRef.current = seriesDataSourceKey;
  }, [seriesDataSourceKey]);

  useEffect(() => {
    if (!showOrderFlowSeries) {
      setSeries(null);
      setSeriesDataSourceKey(null);
    }
  }, [showOrderFlowSeries]);

  useEffect(() => {
    if (
      !chart ||
      !showVolumePane ||
      volumePaneIndex === null ||
      (showOrderFlowSeries && !orderFlowSeriesReady)
    ) {
      return;
    }

    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'volume' },
        lastValueVisible: false,
        priceLineVisible: false,
        ...volumeSeriesOptions,
      },
      volumePaneIndex,
    );

    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;
    setVolumePaneReady(true);

    return () => {
      safeRemoveSeries(chart, volumeSeries);
      volumeSeriesRef.current = null;
      setVolumePaneReady(false);
    };
  }, [
    chart,
    orderFlowSeriesReady,
    showOrderFlowSeries,
    showVolumePane,
    volumeData,
    volumePaneIndex,
    volumeSeriesOptions,
  ]);

  useEffect(() => {
    candleSeriesRef.current?.setData(candleData);
    candleMetricPrimitiveRef.current?.setData(candleMetricData ?? []);
    volumeSeriesRef.current?.setData(volumeData);
    volumeDeltaPivotSeriesRef.current?.setData(volumeDeltaPivotData ?? []);
    volumeDeltaPivotBaselineRef.current?.setData(
      (volumeDeltaPivotData ?? []).map((point) => ({
        time: point.time,
        value: 0,
      })),
    );
  }, [candleData, candleMetricData, volumeData, volumeDeltaPivotData]);

  useEffect(() => {
    if (!chart || !showVolumeDeltaPivot || volumeDeltaPivotPaneIndex === null) {
      return;
    }

    const pivotSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: '#34d399',
        downColor: '#f87171',
        wickUpColor: '#34d399',
        wickDownColor: '#f87171',
        borderVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
        ...volumeDeltaPivotSeriesOptions,
      },
      volumeDeltaPivotPaneIndex,
    );

    pivotSeries.setData(volumeDeltaPivotData ?? []);
    volumeDeltaPivotSeriesRef.current = pivotSeries;
    setVolumeDeltaPivotReady(true);
    const baselineSeries = chart.addSeries(
      LineSeries,
      {
        color: 'rgba(148, 163, 184, 0.52)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        ...volumeDeltaPivotBaselineOptions,
      },
      volumeDeltaPivotPaneIndex,
    );
    baselineSeries.setData(
      (volumeDeltaPivotData ?? []).map((point) => ({
        time: point.time,
        value: 0,
      })),
    );
    volumeDeltaPivotBaselineRef.current = baselineSeries;

    return () => {
      safeRemoveSeries(chart, baselineSeries);
      volumeDeltaPivotBaselineRef.current = null;
      safeRemoveSeries(chart, pivotSeries);
      volumeDeltaPivotSeriesRef.current = null;
      setVolumeDeltaPivotReady(false);
    };
  }, [
    chart,
    showVolumeDeltaPivot,
    volumeDeltaPivotData,
    volumeDeltaPivotBaselineOptions,
    volumeDeltaPivotPaneIndex,
    volumeDeltaPivotSeriesOptions,
  ]);

  useEffect(() => {
    if (
      !chart ||
      !showVolumeDeltaPivot ||
      volumeDeltaPivotPaneIndex === null ||
      !volumeDeltaPivotData?.length
    ) {
      return;
    }

    if (initialViewState?.panes.some((pane) => pane.paneIndex === volumeDeltaPivotPaneIndex)) {
      return;
    }

    const maxAbsDelta = volumeDeltaPivotData.reduce(
      (maximum, point) =>
        Math.max(maximum, Math.abs(point.high), Math.abs(point.low), Math.abs(point.close)),
      0,
    );
    const visibleHalfRange = Math.max(maxAbsDelta * 1.08, 1);
    const pivotScale = chart.priceScale('right', volumeDeltaPivotPaneIndex);

    pivotScale.setAutoScale(false);
    pivotScale.setVisibleRange({
      from: -visibleHalfRange,
      to: visibleHalfRange,
    });
  }, [
    chart,
    initialViewState,
    showVolumeDeltaPivot,
    volumeDeltaPivotData,
    volumeDeltaPivotPaneIndex,
  ]);

  useEffect(() => {
    if (!showDeltaSummary) {
      setDeltaSummaryReady(false);
    }
  }, [showDeltaSummary]);

  useEffect(() => {
    if (!showVolumePane) {
      setVolumePaneReady(false);
    }
  }, [showVolumePane]);

  useEffect(() => {
    if (!showVolumeDeltaPivot) {
      setVolumeDeltaPivotReady(false);
    }
  }, [showVolumeDeltaPivot]);

  useEffect(() => {
    if (!chart) {
      return;
    }

    let settleFrame: number | null = null;
    let lateTimeout: number | null = null;
    let finalTimeout: number | null = null;
    const applyStretchFactors = () => {
      const panes = chart.panes();
      const supportingPaneCount = [showVolumePane, showVolumeDeltaPivot, showDeltaSummary].filter(
        Boolean,
      ).length;
      const usesDeltaSummaryOnlySupportingPane =
        showOrderFlowSeries &&
        !showCandleSeries &&
        showDeltaSummary &&
        !showVolumePane &&
        !showVolumeDeltaPivot;
      const usesCandleOnlySingleSupportingPane =
        showCandleSeries && !showOrderFlowSeries && supportingPaneCount === 1;
      const resolvedDeltaSummaryPaneHeightRatio =
        deltaSummaryPaneHeightRatio != null
          ? clampRatio(deltaSummaryPaneHeightRatio, 0.08, 0.5)
          : null;
      const resolvedReferencePaneHeightRatio =
        referencePaneHeightRatio != null ? clampRatio(referencePaneHeightRatio, 0.08, 0.5) : null;
      const paneTargets: PaneHeightTarget[] = [];

      if (usesCandleOnlySingleSupportingPane) {
        const supportPaneIndex =
          volumePaneIndex ?? volumeDeltaPivotPaneIndex ?? deltaSummaryPaneIndex ?? null;

        if (supportPaneIndex !== null && panes[0] && panes[supportPaneIndex]) {
          applyPaneHeightTargets(chart, panes, chartHeight, containerRef.current?.clientWidth, [
            { paneIndex: 0, ratio: 0.8 },
            { paneIndex: supportPaneIndex, ratio: 0.2, minHeight: SUPPORT_PANE_MIN_HEIGHT },
          ]);
          return;
        }
      }

      if (showCandleSeries && referenceCandlePaneIndex !== null) {
        if (!showOrderFlowSeries) {
          paneTargets.push({
            paneIndex: referenceCandlePaneIndex,
            ratio: supportingPaneCount ? 0.8 : 1,
          });
        } else if (referencePanePlacement === 'bottom') {
          paneTargets.push({
            paneIndex: referenceCandlePaneIndex,
            ratio: resolvedReferencePaneHeightRatio ?? (supportingPaneCount ? 0.22 : 0.3),
          });
        } else {
          paneTargets.push({ paneIndex: referenceCandlePaneIndex, ratio: 0.18 });
        }
      }

      if (showOrderFlowSeries && orderFlowPaneIndex !== null) {
        if (usesDeltaSummaryOnlySupportingPane) {
          paneTargets.push({
            paneIndex: orderFlowPaneIndex,
            ratio: 1 - (resolvedDeltaSummaryPaneHeightRatio ?? 0.2),
          });
        } else {
          paneTargets.push({
            paneIndex: orderFlowPaneIndex,
            ratio:
              showCandleSeries && referencePanePlacement === 'bottom'
                ? supportingPaneCount
                  ? 0.5
                  : 0.7
                : showCandleSeries
                  ? supportingPaneCount
                    ? 0.5
                    : 0.82
                  : supportingPaneCount
                    ? 0.68
                    : 1,
          });
        }
      }

      if (showVolumePane && volumePaneIndex !== null) {
        paneTargets.push({
          paneIndex: volumePaneIndex,
          ratio: 0.14,
          minHeight: SUPPORT_PANE_MIN_HEIGHT,
        });
      }

      if (showVolumeDeltaPivot && volumeDeltaPivotPaneIndex !== null) {
        paneTargets.push({
          paneIndex: volumeDeltaPivotPaneIndex,
          ratio: 0.2,
          minHeight: SUPPORT_PANE_MIN_HEIGHT,
        });
      }

      if (showDeltaSummary && deltaSummaryPaneIndex !== null) {
        paneTargets.push({
          paneIndex: deltaSummaryPaneIndex,
          ratio: usesDeltaSummaryOnlySupportingPane
            ? (resolvedDeltaSummaryPaneHeightRatio ?? 0.2)
            : showVolumePane || showVolumeDeltaPivot
              ? (resolvedDeltaSummaryPaneHeightRatio ?? 0.2)
              : (resolvedDeltaSummaryPaneHeightRatio ?? 0.26),
          minHeight: SUPPORT_PANE_MIN_HEIGHT,
        });
      }

      applyPaneHeightTargets(
        chart,
        panes,
        chartHeight,
        containerRef.current?.clientWidth,
        paneTargets,
      );
    };
    const frame = window.requestAnimationFrame(() => {
      applyStretchFactors();
      settleFrame = window.requestAnimationFrame(() => {
        settleFrame = null;
        applyStretchFactors();
      });
      lateTimeout = window.setTimeout(() => {
        lateTimeout = null;
        applyStretchFactors();
      }, 80);
      finalTimeout = window.setTimeout(() => {
        finalTimeout = null;
        applyStretchFactors();
      }, 220);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (settleFrame !== null) {
        window.cancelAnimationFrame(settleFrame);
      }
      if (lateTimeout !== null) {
        window.clearTimeout(lateTimeout);
      }
      if (finalTimeout !== null) {
        window.clearTimeout(finalTimeout);
      }
    };
  }, [
    chart,
    chartHeight,
    dataSourceKey,
    deltaSummaryPaneIndex,
    deltaSummaryPaneHeightRatio,
    deltaSummaryReady,
    referenceCandlePaneIndex,
    referencePaneHeightRatio,
    referencePanePlacement,
    referenceCandleReady,
    orderFlowPaneIndex,
    series,
    showDeltaSummary,
    showCandleSeries,
    showOrderFlowSeries,
    showVolumeDeltaPivot,
    showVolumePane,
    volumeDeltaPivotPaneIndex,
    volumeDeltaPivotReady,
    volumePaneIndex,
    volumePaneReady,
  ]);

  useEffect(() => {
    if (!chart || !bars.length || !initialViewState || !primaryPaneReady) {
      return;
    }

    const baseSnapshot: ChartViewStateSnapshot = {
      ...initialViewState,
      panes: initialViewState.panes.filter((pane) => pane.paneIndex === 0),
    };
    const signature = JSON.stringify(baseSnapshot);

    if (restoredMainViewSignatureRef.current === signature) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      restoreChartViewState(chart, baseSnapshot);
      restoredMainViewSignatureRef.current = signature;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [bars.length, chart, initialViewState, primaryPaneReady]);

  useEffect(() => {
    if (!chart || !bars.length || !initialViewState || !restorablePaneStateReady) {
      return;
    }

    const signature = JSON.stringify(initialViewState);
    const shouldFreezeAutoScale = !autoFitEnabled && hasAutoScaleRestorePanes(initialViewState);

    if (restoredViewSignatureRef.current === signature) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      restoreChartViewState(chart, initialViewState);
      restoredViewSignatureRef.current = signature;
      restoreRedrawFrameRef.current = window.requestAnimationFrame(() => {
        restoreRedrawFrameRef.current = null;
        const width = containerRef.current?.clientWidth;

        if (width) {
          chart.applyOptions({ width });
        }

        series?.setData(bars);

        if (
          showOrderFlowSeries &&
          !showDeltaSummary &&
          referencePanePlacement !== 'bottom' &&
          hasExplicitPanePriceRange(initialViewState) &&
          seriesRemountSignatureRef.current !== signature
        ) {
          seriesRemountSignatureRef.current = signature;
          pendingPaneRestoreSignatureRef.current = signature;
          setSeriesRenderKey((value) => value + 1);
        }

        if (shouldFreezeAutoScale) {
          restoreFreezeFrameRef.current = window.requestAnimationFrame(() => {
            restoreFreezeFrameRef.current = null;
            freezeAutoScaleRestorePanes(chart, initialViewState);
          });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (restoreRedrawFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreRedrawFrameRef.current);
        restoreRedrawFrameRef.current = null;
      }
      if (restoreFreezeFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreFreezeFrameRef.current);
        restoreFreezeFrameRef.current = null;
      }
    };
  }, [
    bars.length,
    autoFitEnabled,
    chart,
    initialViewState,
    restorablePaneStateReady,
    series,
    showDeltaSummary,
    showCandleSeries,
    showOrderFlowSeries,
    showVolumeDeltaPivot,
    showVolumePane,
  ]);

  useEffect(() => {
    if (!chart || !orderFlowSeriesReady || !series || !showOrderFlowSeries || !initialViewState) {
      return;
    }

    const signature = JSON.stringify(initialViewState);

    if (pendingPaneRestoreSignatureRef.current !== signature) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      pendingPaneRestoreSignatureRef.current = null;
      restorePanePriceRanges(chart, initialViewState);
      series.setData(bars);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    bars,
    chart,
    initialViewState,
    orderFlowSeriesReady,
    series,
    seriesRenderKey,
    showOrderFlowSeries,
  ]);

  useEffect(() => {
    restoredMainViewSignatureRef.current = null;
    restoredViewSignatureRef.current = null;
    seriesRemountSignatureRef.current = null;
    pendingPaneRestoreSignatureRef.current = null;
    blockViewStateEmitRef.current = true;

    if (emitTimeoutRef.current !== null) {
      window.clearTimeout(emitTimeoutRef.current);
      emitTimeoutRef.current = null;
    }

    if (emitFrameRef.current !== null) {
      window.cancelAnimationFrame(emitFrameRef.current);
      emitFrameRef.current = null;
    }

    if (emitResumeTimeoutRef.current !== null) {
      window.clearTimeout(emitResumeTimeoutRef.current);
    }

    emitResumeTimeoutRef.current = window.setTimeout(() => {
      emitResumeTimeoutRef.current = null;
      blockViewStateEmitRef.current = false;
    }, 260);

    return () => {
      if (emitResumeTimeoutRef.current !== null) {
        window.clearTimeout(emitResumeTimeoutRef.current);
        emitResumeTimeoutRef.current = null;
      }
    };
  }, [chart, dataSourceKey, onViewStateChange]);

  useEffect(() => {
    if (autoFitRequestKey === undefined || autoFitRequestKey === handledAutoFitRequestRef.current) {
      return;
    }

    handledAutoFitRequestRef.current = autoFitRequestKey;
    setAutoFitEnabled(true);
    autoFitEnabledRef.current = true;
    requestAutoFit(true);
  }, [autoFitRequestKey]);

  useEffect(() => {
    autoFitEnabledRef.current = autoFitEnabled;
  }, [autoFitEnabled]);

  useEffect(() => {
    if (!autoFitEnabled) {
      return;
    }

    requestAutoFit(false);
  }, [
    autoFitEnabled,
    bars,
    chart,
    dataSourceKey,
    initialViewState,
    mainPricePaneIndex,
    primaryPaneReady,
  ]);

  useEffect(() => {
    if (!chart || !autoFitEnabled) {
      return;
    }

    const handleVisibleLogicalRangeChange = () => {
      requestAutoFit(false);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
    };
  }, [autoFitEnabled, chart, dataSourceKey, primaryPaneReady]);

  useEffect(
    () => () => {
      cancelScheduledAutoFit();
    },
    [],
  );

  useEffect(() => {
    if (!chart || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const isRightPriceScaleTarget = (event: MouseEvent | PointerEvent): boolean => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const priceScaleWidth = chart.priceScale('right', mainPricePaneIndex).width();
      const timeScaleHeight = chart.timeScale().height();

      return (
        priceScaleWidth > 0 &&
        x >= rect.width - priceScaleWidth &&
        x <= rect.width &&
        y >= 0 &&
        y <= rect.height - timeScaleHeight
      );
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (!isRightPriceScaleTarget(event)) {
        return;
      }

      event.preventDefault();
      setPriceScaleContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    };

    const handlePointerDownCapture = (event: PointerEvent) => {
      setPriceScaleContextMenu(null);

      if (!autoFitEnabled || event.button !== 0 || !isRightPriceScaleTarget(event)) {
        return;
      }

      setAutoFitMode(false);
    };

    const handlePointerDown = () => {
      setPriceScaleContextMenu(null);
    };

    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('pointerdown', handlePointerDownCapture, true);
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('pointerdown', handlePointerDownCapture, true);
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [autoFitEnabled, chart, mainPricePaneIndex]);

  useEffect(() => {
    if (!priceScaleContextMenu) {
      return;
    }

    const handlePointerDown = () => {
      setPriceScaleContextMenu(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPriceScaleContextMenu(null);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [priceScaleContextMenu]);

  useEffect(() => {
    if (!chart || !containerRef.current || !onViewStateChange) {
      return;
    }

    const scheduleEmit = () => {
      if (blockViewStateEmitRef.current) {
        return;
      }

      if (emitTimeoutRef.current !== null) {
        window.clearTimeout(emitTimeoutRef.current);
      }

      emitTimeoutRef.current = window.setTimeout(() => {
        emitTimeoutRef.current = null;

        if (emitFrameRef.current !== null) {
          window.cancelAnimationFrame(emitFrameRef.current);
        }

        emitFrameRef.current = window.requestAnimationFrame(() => {
          emitFrameRef.current = null;
          const paneIndices = chart.panes().map((_, index) => index);
          onViewStateChange(captureChartViewState(chart, { paneIndices }));
        });
      }, 140);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(scheduleEmit);
    containerRef.current.addEventListener('wheel', scheduleEmit, { passive: true });
    containerRef.current.addEventListener('pointerup', scheduleEmit);
    containerRef.current.addEventListener('touchend', scheduleEmit);
    window.addEventListener('mouseup', scheduleEmit);
    window.addEventListener('touchend', scheduleEmit);
    window.addEventListener('resize', scheduleEmit);
    scheduleEmit();

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(scheduleEmit);
      containerRef.current?.removeEventListener('wheel', scheduleEmit);
      containerRef.current?.removeEventListener('pointerup', scheduleEmit);
      containerRef.current?.removeEventListener('touchend', scheduleEmit);
      window.removeEventListener('mouseup', scheduleEmit);
      window.removeEventListener('touchend', scheduleEmit);
      window.removeEventListener('resize', scheduleEmit);
      if (emitTimeoutRef.current !== null) {
        window.clearTimeout(emitTimeoutRef.current);
        emitTimeoutRef.current = null;
      }
      if (emitFrameRef.current !== null) {
        window.cancelAnimationFrame(emitFrameRef.current);
        emitFrameRef.current = null;
      }
    };
  }, [
    bars.length,
    chart,
    onViewStateChange,
    showDeltaSummary,
    showCandleSeries,
    showVolumeDeltaPivot,
    showVolumePane,
  ]);

  return (
    <>
      <section
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: resolvedTheme.panelBackground,
          border: resolvedTheme.panelBorder,
        }}
      >
        <div ref={containerRef} />
      </section>

      {priceScaleContextMenu ? (
        <div
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(priceScaleContextMenu.y, window.innerHeight - 56),
            left: Math.min(priceScaleContextMenu.x, window.innerWidth - 260),
            zIndex: 30,
            minWidth: 240,
            borderRadius: 12,
            background: '#1f1f1f',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            boxShadow: '0 18px 50px rgba(2, 6, 23, 0.45)',
            padding: 6,
          }}
        >
          <button
            onClick={() => setAutoFitMode(!autoFitEnabled)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              border: 0,
              borderRadius: 8,
              background: 'transparent',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              font: '500 14px Inter, Arial, sans-serif',
            }}
          >
            <span style={{ width: 16, textAlign: 'center' }}>{autoFitEnabled ? '✓' : ''}</span>
            <span>Auto (fits data to screen)</span>
          </button>
        </div>
      ) : null}

      {footerText ? (
        <footer style={{ marginTop: 12, color: '#94a3b8', fontSize: 14 }}>{footerText}</footer>
      ) : null}

      <ChartProvider chart={chart}>
        {showOrderFlowSeries ? (
          seriesMode === 'footprint' ? (
            <FootprintSeries
              key={`footprint-${seriesRenderKey}-${dataSourceKey ?? 'default'}`}
              chart={chart}
              data={bars}
              options={footprintOptions}
              paneIndex={orderFlowPaneIndex ?? undefined}
              onReady={handleOrderFlowSeriesReady}
            />
          ) : (
            <VolumeFootprint
              key={`volume-footprint-${seriesRenderKey}-${dataSourceKey ?? 'default'}`}
              chart={chart}
              data={bars}
              options={volumeFootprintOptions}
              paneIndex={orderFlowPaneIndex ?? undefined}
              onReady={handleOrderFlowSeriesReady}
            />
          )
        ) : null}
        {showOrderFlowSeries && showVisibleProfile && orderFlowSeriesReady ? (
          <VolumeProfile series={series} data={bars} options={volumeProfileOptions} />
        ) : null}
        {showOrderFlowSeries && showSessionProfiles && orderFlowSeriesReady ? (
          <SessionVolumeProfiles
            series={series}
            data={bars}
            options={sessionVolumeProfileOptions}
          />
        ) : null}
        {showVwap ? <VwapSeries chart={chart} data={bars} paneIndex={mainPricePaneIndex} /> : null}
        {showDeltaSummary && deltaSummaryPaneIndex !== null ? (
          <DeltaSummarySeries
            key={`delta-summary-${deltaSummaryPaneIndex}`}
            chart={chart}
            data={bars}
            options={deltaSummaryOptions}
            paneIndex={deltaSummaryPaneIndex}
            onReady={handleDeltaSummaryReady}
          />
        ) : null}
      </ChartProvider>
    </>
  );
}
