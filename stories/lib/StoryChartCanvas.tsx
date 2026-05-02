import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type CandlestickData,
  type CandlestickSeriesPartialOptions,
  type HistogramData,
  type HistogramSeriesPartialOptions,
  type IChartApi,
  type ISeriesApi,
  type LineSeriesPartialOptions,
} from 'lightweight-charts';
import {
  buildCandleHeatmapSeriesData,
  type AggregatedMarketBar,
  type CandleHeatmapPartialOptions,
  type DeltaSummarySeriesPartialOptions,
  type FootprintSeriesPartialOptions,
  type OrderFlowBar,
  type OrderFlowSurfaceTheme,
  type SessionVolumeProfilePartialOptions,
  type TimeValue,
  type VolumeFootprintPartialOptions,
  type VolumeProfilePartialOptions,
  type VolumeDeltaPivotPoint,
  type VwapOptions,
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

const DEFAULT_HEIGHT = 720;

function removeSeries(chart: IChartApi | null, series: ISeriesApi<any, any> | null): void {
  if (!chart || !series) {
    return;
  }

  try {
    chart.removeSeries(series);
  } catch {
    // Storybook unmounts can race chart disposal.
  }
}

export interface StoryChartCanvasProps {
  title: string;
  subtitle: string;
  orderFlowBars: OrderFlowBar[];
  marketBars: AggregatedMarketBar[];
  theme: OrderFlowSurfaceTheme;
  height?: number;
  showCandles?: boolean;
  showFootprint?: boolean;
  showVolumeFootprint?: boolean;
  showVolumeProfile?: boolean;
  showSessionProfiles?: boolean;
  showVwap?: boolean;
  showDeltaSummary?: boolean;
  showVolumePane?: boolean;
  volumePaneLabel?: string;
  showVolumeDeltaPivot?: boolean;
  footprintOptions?: FootprintSeriesPartialOptions;
  volumeFootprintOptions?: VolumeFootprintPartialOptions;
  volumeProfileOptions?: VolumeProfilePartialOptions;
  sessionVolumeProfileOptions?: SessionVolumeProfilePartialOptions;
  deltaSummaryOptions?: DeltaSummarySeriesPartialOptions;
  candleSeriesOptions?: CandlestickSeriesPartialOptions;
  candleHeatmapOptions?: CandleHeatmapPartialOptions;
  candleHeatmapAccessor?: (
    bar: OrderFlowBar,
    index: number,
    bars: readonly OrderFlowBar[],
  ) => number | null | undefined;
  volumeSeriesOptions?: HistogramSeriesPartialOptions;
  volumeDeltaPivotData?: VolumeDeltaPivotPoint[];
  volumeDeltaPivotSeriesOptions?: CandlestickSeriesPartialOptions;
  volumeDeltaPivotBaselineOptions?: LineSeriesPartialOptions;
  vwapOptions?: Partial<VwapOptions>;
}

export function StoryChartCanvas({
  title,
  subtitle,
  orderFlowBars,
  marketBars,
  theme,
  height = DEFAULT_HEIGHT,
  showCandles = true,
  showFootprint = false,
  showVolumeFootprint = false,
  showVolumeProfile = false,
  showSessionProfiles = false,
  showVwap = false,
  showDeltaSummary = false,
  showVolumePane = false,
  volumePaneLabel = 'Volume',
  showVolumeDeltaPivot = false,
  footprintOptions,
  volumeFootprintOptions,
  volumeProfileOptions,
  sessionVolumeProfileOptions,
  deltaSummaryOptions,
  candleSeriesOptions,
  candleHeatmapOptions,
  candleHeatmapAccessor,
  volumeSeriesOptions,
  volumeDeltaPivotData,
  volumeDeltaPivotSeriesOptions,
  volumeDeltaPivotBaselineOptions,
  vwapOptions,
}: StoryChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [mainStudySeries, setMainStudySeries] = useState<ISeriesApi<'Custom', TimeValue> | null>(
    null,
  );
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', TimeValue> | null>(null);
  const pivotSeriesRef = useRef<ISeriesApi<'Candlestick', TimeValue> | null>(null);
  const pivotBaselineRef = useRef<ISeriesApi<'Line', TimeValue> | null>(null);

  const supportPaneIndex = showDeltaSummary || showVolumePane || showVolumeDeltaPivot ? 1 : null;
  const candleData = useMemo<CandlestickData<TimeValue>[]>(() => {
    if (candleHeatmapOptions && candleHeatmapAccessor) {
      return buildCandleHeatmapSeriesData({
        bars: orderFlowBars,
        options: candleHeatmapOptions,
        backgroundColor: theme.backgroundColor,
        getValue: candleHeatmapAccessor,
      });
    }

    return marketBars.map((bar) => ({
      time: bar.time as TimeValue,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
  }, [
    candleHeatmapAccessor,
    candleHeatmapOptions,
    marketBars,
    orderFlowBars,
    theme.backgroundColor,
  ]);
  const volumeData = useMemo<HistogramData<TimeValue>[]>(() => {
    return marketBars.map((bar) => ({
      time: bar.time as TimeValue,
      value: bar.volume,
      color:
        bar.close >= bar.open
          ? (volumeSeriesOptions?.color ?? 'rgba(34, 197, 94, 0.5)')
          : (volumeSeriesOptions?.color ?? 'rgba(239, 68, 68, 0.5)'),
    }));
  }, [marketBars, volumeSeriesOptions?.color]);
  const frameStyle = useMemo<CSSProperties>(
    () => ({
      display: 'grid',
      gap: 12,
      padding: 16,
      borderRadius: 18,
      background: theme.backgroundColor,
      border: `1px solid ${theme.borderColor}`,
      boxShadow: '0 18px 46px rgba(2, 6, 23, 0.24)',
    }),
    [theme.backgroundColor, theme.borderColor],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const nextChart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: theme.backgroundColor },
        textColor: theme.textColor,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
        horzLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
      },
      rightPriceScale: {
        borderColor: theme.borderColor,
      },
      timeScale: {
        borderColor: theme.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
        minBarSpacing: 8,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: theme.crosshairColor },
        horzLine: { color: theme.crosshairColor },
      },
    });

    const handleResize = () => {
      if (!containerRef.current) {
        return;
      }

      nextChart.applyOptions({
        width: containerRef.current.clientWidth,
        height,
      });
    };

    window.addEventListener('resize', handleResize);
    setChart(nextChart);

    return () => {
      window.removeEventListener('resize', handleResize);
      setMainStudySeries(null);
      removeSeries(nextChart, candleSeriesRef.current);
      removeSeries(nextChart, volumeSeriesRef.current);
      removeSeries(nextChart, pivotSeriesRef.current);
      removeSeries(nextChart, pivotBaselineRef.current);
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      pivotSeriesRef.current = null;
      pivotBaselineRef.current = null;
      window.setTimeout(() => {
        nextChart.remove();
      }, 0);
      setChart(null);
    };
  }, [
    height,
    theme.backgroundColor,
    theme.borderColor,
    theme.crosshairColor,
    theme.gridColor,
    theme.gridVisible,
    theme.textColor,
  ]);

  useEffect(() => {
    if (!chart || !containerRef.current) {
      return;
    }

    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: theme.backgroundColor },
        textColor: theme.textColor,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
        horzLines: { color: theme.gridColor, visible: theme.gridVisible, style: 0 },
      },
      rightPriceScale: {
        borderColor: theme.borderColor,
      },
      timeScale: {
        borderColor: theme.borderColor,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: theme.crosshairColor },
        horzLine: { color: theme.crosshairColor },
      },
    });
  }, [
    chart,
    height,
    theme.backgroundColor,
    theme.borderColor,
    theme.crosshairColor,
    theme.gridColor,
    theme.gridVisible,
    theme.textColor,
  ]);

  useEffect(() => {
    if (!chart || !showCandles) {
      removeSeries(chart, candleSeriesRef.current);
      candleSeriesRef.current = null;
      return;
    }

    const nextSeries = chart.addSeries(
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
    nextSeries.setData(candleData);
    candleSeriesRef.current = nextSeries;

    return () => {
      removeSeries(chart, nextSeries);
      if (candleSeriesRef.current === nextSeries) {
        candleSeriesRef.current = null;
      }
    };
  }, [candleData, candleSeriesOptions, chart, showCandles]);

  useEffect(() => {
    candleSeriesRef.current?.setData(candleData);
  }, [candleData]);

  useEffect(() => {
    if (!chart || !showVolumePane || supportPaneIndex === null) {
      removeSeries(chart, volumeSeriesRef.current);
      volumeSeriesRef.current = null;
      return;
    }

    const nextSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'volume' },
        lastValueVisible: false,
        priceLineVisible: false,
        ...volumeSeriesOptions,
      },
      supportPaneIndex,
    );
    nextSeries.setData(volumeData);
    volumeSeriesRef.current = nextSeries;

    return () => {
      removeSeries(chart, nextSeries);
      if (volumeSeriesRef.current === nextSeries) {
        volumeSeriesRef.current = null;
      }
    };
  }, [chart, showVolumePane, supportPaneIndex, volumeData, volumeSeriesOptions]);

  useEffect(() => {
    volumeSeriesRef.current?.setData(volumeData);
  }, [volumeData]);

  useEffect(() => {
    if (
      !chart ||
      !showVolumeDeltaPivot ||
      supportPaneIndex === null ||
      !volumeDeltaPivotData?.length
    ) {
      removeSeries(chart, pivotBaselineRef.current);
      removeSeries(chart, pivotSeriesRef.current);
      pivotBaselineRef.current = null;
      pivotSeriesRef.current = null;
      return;
    }

    const nextPivotSeries = chart.addSeries(
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
      supportPaneIndex,
    );
    nextPivotSeries.setData(volumeDeltaPivotData);
    pivotSeriesRef.current = nextPivotSeries;

    const nextBaseline = chart.addSeries(
      LineSeries,
      {
        color: 'rgba(148, 163, 184, 0.52)',
        lineWidth: 1,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        ...volumeDeltaPivotBaselineOptions,
      },
      supportPaneIndex,
    );
    nextBaseline.setData(
      volumeDeltaPivotData.map((point) => ({
        time: point.time,
        value: 0,
      })),
    );
    pivotBaselineRef.current = nextBaseline;

    return () => {
      removeSeries(chart, nextBaseline);
      removeSeries(chart, nextPivotSeries);
      if (pivotBaselineRef.current === nextBaseline) {
        pivotBaselineRef.current = null;
      }
      if (pivotSeriesRef.current === nextPivotSeries) {
        pivotSeriesRef.current = null;
      }
    };
  }, [
    chart,
    showVolumeDeltaPivot,
    supportPaneIndex,
    volumeDeltaPivotBaselineOptions,
    volumeDeltaPivotData,
    volumeDeltaPivotSeriesOptions,
  ]);

  useEffect(() => {
    pivotSeriesRef.current?.setData(volumeDeltaPivotData ?? []);
    pivotBaselineRef.current?.setData(
      (volumeDeltaPivotData ?? []).map((point) => ({
        time: point.time,
        value: 0,
      })),
    );
  }, [volumeDeltaPivotData]);

  useEffect(() => {
    if (!chart) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      chart.timeScale().fitContent();
      if (supportPaneIndex !== null) {
        chart.panes()[supportPaneIndex]?.setHeight(Math.round(height * 0.24));
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [chart, height, supportPaneIndex, orderFlowBars.length, marketBars.length]);

  return (
    <div style={frameStyle}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ color: theme.textColor, fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ color: theme.textColor, opacity: 0.72, fontSize: 13 }}>{subtitle}</div>
      </div>

      <div ref={containerRef} style={{ width: '100%', height }} />

      {chart ? (
        <ChartProvider chart={chart}>
          {showFootprint ? (
            <FootprintSeries
              chart={chart}
              data={orderFlowBars}
              paneIndex={0}
              options={footprintOptions}
              onReady={setMainStudySeries}
            />
          ) : null}

          {showVolumeFootprint ? (
            <VolumeFootprint
              chart={chart}
              data={orderFlowBars}
              paneIndex={0}
              options={volumeFootprintOptions}
              onReady={setMainStudySeries}
            />
          ) : null}

          {showDeltaSummary && supportPaneIndex !== null ? (
            <DeltaSummarySeries
              chart={chart}
              data={orderFlowBars}
              paneIndex={supportPaneIndex}
              options={deltaSummaryOptions}
            />
          ) : null}

          {showVolumeProfile && mainStudySeries ? (
            <VolumeProfile
              series={mainStudySeries}
              data={orderFlowBars}
              options={volumeProfileOptions}
            />
          ) : null}

          {showSessionProfiles && mainStudySeries ? (
            <SessionVolumeProfiles
              series={mainStudySeries}
              data={orderFlowBars}
              options={sessionVolumeProfileOptions}
            />
          ) : null}

          {showVwap ? (
            <VwapSeries chart={chart} data={orderFlowBars} options={vwapOptions} />
          ) : null}
        </ChartProvider>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          color: theme.textColor,
          opacity: 0.7,
          fontSize: 12,
        }}
      >
        <span>{`Bars: ${marketBars.length}`}</span>
        <span>{`Order flow bars: ${orderFlowBars.length}`}</span>
        {showVolumePane ? <span>{volumePaneLabel}</span> : null}
        {showDeltaSummary ? <span>Delta summary</span> : null}
        {showVolumeDeltaPivot ? <span>Volume delta pivot</span> : null}
      </div>
    </div>
  );
}
