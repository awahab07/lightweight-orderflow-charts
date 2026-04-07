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
  focusOrderFlowChart,
  restoreChartViewState,
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
  autoFocusOnDataChange?: boolean;
  dataSourceKey?: string;
  focusRequestKey?: number;
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
  autoFocusOnDataChange = false,
  dataSourceKey,
  focusRequestKey,
}: OrderFlowChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const candleMetricPrimitiveRef = useRef<SeriesMetricPrimitive | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', TimeValue> | null>(null);
  const volumeDeltaPivotSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const volumeDeltaPivotBaselineRef = useRef<ISeriesApi<'Line', TimeValue> | null>(null);
  const restoredViewSignatureRef = useRef<string | null>(null);
  const focusedDataSourceKeyRef = useRef<string | null>(null);
  const handledFocusRequestRef = useRef<number | null>(null);
  const emitFrameRef = useRef<number | null>(null);
  const emitTimeoutRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const focusTimeoutRef = useRef<number | null>(null);
  const restoreRedrawFrameRef = useRef<number | null>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(null);
  const [referenceCandleReady, setReferenceCandleReady] = useState(false);
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
        showReferenceCandles ? (supportingPaneCount ? 0.5 : 0.82) : supportingPaneCount ? 0.68 : 1,
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
  }, [
    chart,
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
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (restoreRedrawFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreRedrawFrameRef.current);
        restoreRedrawFrameRef.current = null;
      }
    };
  }, [
    bars.length,
    chart,
    initialViewState,
    primaryPaneReady,
    showDeltaSummary,
    showOrderFlowPane,
    showReferenceCandles,
    showVolumeDeltaPivot,
    showVolumePane,
  ]);

  useEffect(() => {
    if (!chart || !bars.length || !primaryPaneReady) {
      return;
    }

    const scheduleFocus = (afterFocus?: () => void) => {
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }

      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
      }

      focusTimeoutRef.current = window.setTimeout(
        () => {
          focusTimeoutRef.current = null;
          focusFrameRef.current = window.requestAnimationFrame(() => {
            focusFrameRef.current = null;
            focusOrderFlowChart(chart, bars, { paneIndex: orderFlowPaneIndex ?? 0 });
            afterFocus?.();
            const width = containerRef.current?.clientWidth;

            if (width) {
              chart.applyOptions({ width });
            }
          });
        },
        initialViewState ? 240 : 140,
      );
    };

    if (
      autoFocusOnDataChange &&
      dataSourceKey &&
      focusedDataSourceKeyRef.current !== dataSourceKey
    ) {
      scheduleFocus(() => {
        focusedDataSourceKeyRef.current = dataSourceKey;
      });
    }

    if (focusRequestKey !== undefined && focusRequestKey !== handledFocusRequestRef.current) {
      scheduleFocus(() => {
        handledFocusRequestRef.current = focusRequestKey;
      });
    }

    return () => {
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [
    autoFocusOnDataChange,
    bars,
    chart,
    dataSourceKey,
    focusRequestKey,
    orderFlowPaneIndex,
    initialViewState,
    primaryPaneReady,
  ]);

  useEffect(() => {
    if (!chart || !containerRef.current || !onViewStateChange) {
      return;
    }

    const scheduleEmit = () => {
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

      {footerText ? (
        <footer style={{ marginTop: 12, color: '#94a3b8', fontSize: 14 }}>{footerText}</footer>
      ) : null}

      <ChartProvider chart={chart}>
        {showOrderFlowPane ? (
          seriesMode === 'footprint' ? (
            <FootprintSeries
              chart={chart}
              data={bars}
              options={footprintOptions}
              paneIndex={orderFlowPaneIndex ?? undefined}
              onReady={setSeries}
            />
          ) : (
            <VolumeFootprint
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
