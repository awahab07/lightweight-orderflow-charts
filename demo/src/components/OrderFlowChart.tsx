import { useEffect, useMemo, useRef, useState } from 'react';
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
  captureChartViewState,
  createSeriesMetricPrimitive,
  restoreChartViewState,
  setPriceScaleAutoFit,
  type SeriesMetricPrimitive,
} from 'lightweight-orderflow-charts';
import { safeRemoveSeries } from '../../../src/utils/lightweightCharts';

export type SeriesMode = 'footprint' | 'volume-footprint';

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

interface OrderFlowChartProps {
  bars: OrderFlowBar[];
  seriesMode: SeriesMode;
  showOrderFlowPane?: boolean;
  showVisibleProfile?: boolean;
  showSessionProfiles?: boolean;
  showVwap?: boolean;
  showReferenceCandles?: boolean;
  showVolumePane?: boolean;
  showVolumeDeltaPivot?: boolean;
  showDeltaSummary?: boolean;
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
  showVolumePane = true,
  showVolumeDeltaPivot = false,
  showDeltaSummary = false,
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
  const restoreRedrawFrameRef = useRef<number | null>(null);
  const restoreFreezeFrameRef = useRef<number | null>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(null);
  const [seriesRenderKey, setSeriesRenderKey] = useState(0);
  const [referenceCandleReady, setReferenceCandleReady] = useState(false);
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
  const orderFlowPaneIndex = showOrderFlowPane ? (showReferenceCandles ? 1 : 0) : null;
  let nextStudyPaneIndex = showReferenceCandles ? 1 : 0;
  if (orderFlowPaneIndex !== null) {
    nextStudyPaneIndex = orderFlowPaneIndex + 1;
  }
  const volumePaneIndex = showVolumePane ? nextStudyPaneIndex++ : null;
  const volumeDeltaPivotPaneIndex = showVolumeDeltaPivot ? nextStudyPaneIndex++ : null;
  const deltaSummaryPaneIndex = showDeltaSummary ? nextStudyPaneIndex++ : null;
  const mainPricePaneIndex = 0;
  const primaryPaneReady = showOrderFlowPane ? Boolean(series) : referenceCandleReady;

  const setAutoFitMode = (enabled: boolean) => {
    setAutoFitEnabled(enabled);
    setPriceScaleContextMenu(null);

    if (!chart) {
      return;
    }

    setPriceScaleAutoFit(chart, enabled, {
      paneIndex: mainPricePaneIndex,
      topInsetRatio: 0.05,
      bottomInsetRatio: 0.05,
    });
  };

  const candleData = useMemo(
    () =>
      bars.map((bar) => ({
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    [bars],
  );

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
      nextChart.remove();
      setChart(null);
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
    showReferenceCandles,
    showVolumePane,
  ]);

  useEffect(() => {
    if (!chart || !showReferenceCandles) {
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
      0,
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
  }, [candleData, candleMetricData, candleSeriesOptions, chart, showReferenceCandles]);

  useEffect(() => {
    if (!showOrderFlowPane) {
      setSeries(null);
    }
  }, [showOrderFlowPane]);

  useEffect(() => {
    if (!chart || !showVolumePane || volumePaneIndex === null) {
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

    return () => {
      safeRemoveSeries(chart, volumeSeries);
      volumeSeriesRef.current = null;
    };
  }, [chart, showVolumePane, volumeData, volumePaneIndex, volumeSeriesOptions]);

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
    if (!chart) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const panes = chart.panes();
      const supportingPaneCount = [showVolumePane, showVolumeDeltaPivot, showDeltaSummary].filter(
        Boolean,
      ).length;
      const stretchFactors: number[] = [];

      if (showReferenceCandles) {
        if (!showOrderFlowPane) {
          stretchFactors.push(supportingPaneCount ? 0.8 : 1);
        } else {
          stretchFactors.push(0.18);
        }
      }

      if (showOrderFlowPane) {
        stretchFactors.push(
          showReferenceCandles
            ? supportingPaneCount
              ? 0.5
              : 0.82
            : supportingPaneCount
              ? 0.68
              : 1,
        );
      }

      if (showVolumePane) {
        stretchFactors.push(0.14);
      }

      if (showVolumeDeltaPivot) {
        stretchFactors.push(0.2);
      }

      if (showDeltaSummary) {
        stretchFactors.push(0.2);
      }

      for (let index = 0; index < stretchFactors.length; index += 1) {
        panes[index]?.setStretchFactor(stretchFactors[index]);
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    chart,
    dataSourceKey,
    referenceCandleReady,
    series,
    showDeltaSummary,
    showOrderFlowPane,
    showReferenceCandles,
    showVolumeDeltaPivot,
    showVolumePane,
  ]);

  useEffect(() => {
    if (!chart || !bars.length || !initialViewState || !primaryPaneReady) {
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
          showOrderFlowPane &&
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
    primaryPaneReady,
    series,
    showDeltaSummary,
    showOrderFlowPane,
    showReferenceCandles,
    showVolumeDeltaPivot,
    showVolumePane,
  ]);

  useEffect(() => {
    if (!chart || !series || !showOrderFlowPane || !initialViewState) {
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
  }, [bars, chart, initialViewState, series, seriesRenderKey, showOrderFlowPane]);

  useEffect(() => {
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

      if (!chart || !onViewStateChange) {
        return;
      }

      const paneIndices = chart.panes().map((_, index) => index);
      onViewStateChange(captureChartViewState(chart, { paneIndices }));
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
  }, [autoFitRequestKey]);

  useEffect(() => {
    if (!chart || !primaryPaneReady || !autoFitEnabled) {
      return;
    }

    if (autoFitTimeoutRef.current !== null) {
      window.clearTimeout(autoFitTimeoutRef.current);
    }

    if (autoFitFrameRef.current !== null) {
      window.cancelAnimationFrame(autoFitFrameRef.current);
    }

    autoFitTimeoutRef.current = window.setTimeout(
      () => {
        autoFitTimeoutRef.current = null;
        autoFitFrameRef.current = window.requestAnimationFrame(() => {
          autoFitFrameRef.current = null;
          setPriceScaleAutoFit(chart, true, {
            paneIndex: mainPricePaneIndex,
            topInsetRatio: 0.05,
            bottomInsetRatio: 0.05,
          });

          const width = containerRef.current?.clientWidth;

          if (width) {
            chart.applyOptions({ width });
          }
        });
      },
      initialViewState ? 240 : 120,
    );

    return () => {
      if (autoFitTimeoutRef.current !== null) {
        window.clearTimeout(autoFitTimeoutRef.current);
        autoFitTimeoutRef.current = null;
      }
      if (autoFitFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitFrameRef.current);
        autoFitFrameRef.current = null;
      }
    };
  }, [
    autoFitEnabled,
    chart,
    dataSourceKey,
    initialViewState,
    mainPricePaneIndex,
    primaryPaneReady,
  ]);

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
    showReferenceCandles,
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
        {showOrderFlowPane ? (
          seriesMode === 'footprint' ? (
            <FootprintSeries
              key={`footprint-${seriesRenderKey}-${dataSourceKey ?? 'default'}`}
              chart={chart}
              data={bars}
              options={footprintOptions}
              paneIndex={orderFlowPaneIndex ?? undefined}
              onReady={setSeries}
            />
          ) : (
            <VolumeFootprint
              key={`volume-footprint-${seriesRenderKey}-${dataSourceKey ?? 'default'}`}
              chart={chart}
              data={bars}
              options={volumeFootprintOptions}
              paneIndex={orderFlowPaneIndex ?? undefined}
              onReady={setSeries as never}
            />
          )
        ) : null}
        {showOrderFlowPane && showVisibleProfile ? (
          <VolumeProfile series={series} data={bars} options={volumeProfileOptions} />
        ) : null}
        {showOrderFlowPane && showSessionProfiles ? (
          <SessionVolumeProfiles
            series={series}
            data={bars}
            options={sessionVolumeProfileOptions}
          />
        ) : null}
        {showVwap ? <VwapSeries chart={chart} data={bars} paneIndex={mainPricePaneIndex} /> : null}
        {showDeltaSummary && deltaSummaryPaneIndex !== null ? (
          <DeltaSummarySeries
            chart={chart}
            data={bars}
            options={deltaSummaryOptions}
            paneIndex={deltaSummaryPaneIndex}
          />
        ) : null}
      </ChartProvider>
    </>
  );
}
