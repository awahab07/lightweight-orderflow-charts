import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  DEFAULT_FOOTPRINT_STYLE,
  buildAggregatedMarketBarsFromOrderFlowBars,
  buildSupportedMinticks,
  buildVolumeDeltaPivotSeriesData,
  type AggregatedMarketBar,
  type ChartViewStateSnapshot,
  clusterOhlcBarsByMintick,
  clusterOrderFlowBarsByMintick,
  formatCompactNumericValue,
  inferPricePrecision,
  normalizeMintick,
  type OrderFlowBar,
  type VolumeDeltaPivotPoint,
  type SeriesMetricPrimitiveDatum,
  type TimeValue,
  withAlpha,
} from 'lightweight-orderflow-charts';

import {
  CONCEPT_PRESETS,
  DEFAULT_CONCEPT_PRESET_ID,
  getConceptPreset,
  getThemePreset,
  resolveConceptPresetId,
  THEME_PRESETS,
} from '../content/learnCatalog';
import {
  AVAILABLE_INTERVALS,
  AVAILABLE_SYMBOLS,
  availableDatesForSymbol,
  loadInstrument,
  loadMarketBars,
  loadOrderFlowBars,
  type BarInterval,
  type SymbolCode,
} from '../lib/marketData';
import {
  buildSyntheticStreamBars,
  resolveSyntheticStreamFrameCount,
  STREAM_STEP_INTERVAL_MS,
} from '../lib/syntheticStream';
import {
  buildDemoCandleHeatmapScores,
  resolveDemoCandleHeatmapScore,
} from '../lib/candleHeatmapMetric';
import { readExploreDemoUrlState, writeExploreDemoUrlState } from '../lib/learnDemoUrlState';
import {
  mergeDeltaSummaryStudyOptions,
  mergeCandleHeatmapOptions,
  mergeFootprintStudyOptions,
  mergeSessionVolumeProfileStudyOptions,
  mergeVolumeProfileStudyOptions,
} from '../lib/mergeStudyOptions';

import { ConceptToolbar } from './ConceptToolbar';
import { OrderFlowChart } from './OrderFlowChart';

function prepareDataSourceViewState(
  snapshot: ChartViewStateSnapshot | null | undefined,
): ChartViewStateSnapshot | null {
  if (!snapshot) {
    return null;
  }

  return {
    version: 1,
    timeRange: snapshot.timeRange ? { ...snapshot.timeRange } : null,
    panes: snapshot.panes.map((pane) => ({
      paneIndex: pane.paneIndex,
      priceScaleId: pane.priceScaleId,
      priceRange: null,
    })),
  };
}

function formatMintick(value: number): string {
  return value.toFixed(Math.max(2, inferPricePrecision(value)));
}

export function ExploreDemoPage() {
  const initialUrlState = useMemo(
    () => (typeof window === 'undefined' ? null : readExploreDemoUrlState(window.location.hash)),
    [],
  );
  const initialPreset = useMemo(
    () =>
      resolveConceptPresetId(initialUrlState?.presetId)
        ? getConceptPreset(initialUrlState?.presetId ?? DEFAULT_CONCEPT_PRESET_ID)
        : getConceptPreset(DEFAULT_CONCEPT_PRESET_ID),
    [initialUrlState?.presetId],
  );
  const [presetId, setPresetId] = useState(() => initialPreset.id);
  const [themeId, setThemeId] = useState(() =>
    initialUrlState?.themeId && THEME_PRESETS.some((entry) => entry.id === initialUrlState.themeId)
      ? initialUrlState.themeId
      : initialPreset.defaultThemeId,
  );
  const [symbol, setSymbol] = useState<SymbolCode>(() =>
    initialUrlState?.symbol && AVAILABLE_SYMBOLS.includes(initialUrlState.symbol as SymbolCode)
      ? (initialUrlState.symbol as SymbolCode)
      : initialPreset.defaultSymbol,
  );
  const [interval, setInterval] = useState<BarInterval>(() =>
    initialUrlState?.interval &&
    AVAILABLE_INTERVALS.includes(initialUrlState.interval as BarInterval)
      ? (initialUrlState.interval as BarInterval)
      : initialPreset.defaultInterval,
  );
  const [sessionDate, setSessionDate] = useState(
    initialUrlState?.sessionDate ?? initialPreset.defaultDate,
  );
  const [mintick, setMintick] = useState<number | null>(
    initialUrlState?.mintick ?? initialPreset.defaultMintick ?? null,
  );
  const [restoredViewState, setRestoredViewState] = useState<ChartViewStateSnapshot | null>(
    initialUrlState?.chartView ?? initialPreset.defaultViewState ?? null,
  );
  const [viewState, setViewState] = useState<ChartViewStateSnapshot | null>(
    initialUrlState?.chartView ?? initialPreset.defaultViewState ?? null,
  );
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [dataStatus, setDataStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadedBars, setLoadedBars] = useState<OrderFlowBar[]>([]);
  const [loadedChartBars, setLoadedChartBars] = useState<AggregatedMarketBar[]>([]);
  const [loadedLowerOrderFlowBars, setLoadedLowerOrderFlowBars] = useState<OrderFlowBar[]>([]);
  const [streamBars, setStreamBars] = useState<OrderFlowBar[]>([]);

  const preset = useMemo(() => getConceptPreset(presetId), [presetId]);
  const themePreset = useMemo(() => getThemePreset(themeId), [themeId]);
  const instrument = useMemo(() => loadInstrument(symbol), [symbol]);
  const mintickOptions = useMemo(
    () => buildSupportedMinticks(instrument.tickSize),
    [instrument.tickSize],
  );
  const effectiveMintick = useMemo(
    () =>
      normalizeMintick(mintick ?? instrument.tickSize, instrument.tickSize) ?? instrument.tickSize,
    [instrument.tickSize, mintick],
  );
  const availableDates = useMemo(() => availableDatesForSymbol(symbol), [symbol]);
  const sourceBars = streamEnabled ? streamBars : loadedBars;
  const sourceChartBars = useMemo(
    () =>
      streamEnabled ? buildAggregatedMarketBarsFromOrderFlowBars(streamBars) : loadedChartBars,
    [loadedChartBars, streamBars, streamEnabled],
  );
  const lowerOrderFlowSourceBars = useMemo(() => {
    if (!streamEnabled) {
      return loadedLowerOrderFlowBars;
    }

    if (interval === '5m') {
      return loadedLowerOrderFlowBars.slice(
        0,
        Math.min(sourceBars.length * 5, loadedLowerOrderFlowBars.length),
      );
    }

    return sourceBars;
  }, [interval, loadedLowerOrderFlowBars, sourceBars, streamEnabled]);
  const bars = useMemo(
    () => clusterOrderFlowBarsByMintick(sourceBars, effectiveMintick, instrument.tickSize),
    [effectiveMintick, instrument.tickSize, sourceBars],
  );
  const chartBars = useMemo(
    () => clusterOhlcBarsByMintick(sourceChartBars, effectiveMintick, instrument.tickSize),
    [effectiveMintick, instrument.tickSize, sourceChartBars],
  );
  const deltaSourceBars = useMemo(
    () =>
      bars.map((bar) => ({
        time: bar.time as TimeValue,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume:
          bar.totalVolume ??
          bar.levels.reduce(
            (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
            0,
          ),
        delta:
          bar.delta ??
          bar.levels.reduce(
            (total, level) => total + (level.delta ?? level.askVolume - level.bidVolume),
            0,
          ),
      })),
    [bars],
  );
  const lowerDeltaSourceBars = useMemo(
    () =>
      clusterOrderFlowBarsByMintick(
        lowerOrderFlowSourceBars,
        effectiveMintick,
        instrument.tickSize,
      ).map((bar) => ({
        time: bar.time as TimeValue,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume:
          bar.totalVolume ??
          bar.levels.reduce(
            (total, level) => total + (level.totalVolume ?? level.bidVolume + level.askVolume),
            0,
          ),
        delta:
          bar.delta ??
          bar.levels.reduce(
            (total, level) => total + (level.delta ?? level.askVolume - level.bidVolume),
            0,
          ),
      })),
    [effectiveMintick, instrument.tickSize, lowerOrderFlowSourceBars],
  );
  const volumeDeltaPivotData = useMemo<VolumeDeltaPivotPoint[]>(() => {
    if (!preset.showVolumeDeltaPivot) {
      return [];
    }

    return buildVolumeDeltaPivotSeriesData(deltaSourceBars, lowerDeltaSourceBars, {
      intervalSeconds: interval === '5m' ? 300 : 60,
    });
  }, [deltaSourceBars, interval, lowerDeltaSourceBars, preset.showVolumeDeltaPivot]);
  const themedFootprintOptions = useMemo(
    () => mergeFootprintStudyOptions(preset.footprintOptions, themePreset.footprint),
    [preset.footprintOptions, themePreset.footprint],
  );
  const themedVolumeFootprintOptions = useMemo(
    () => mergeFootprintStudyOptions(preset.volumeFootprintOptions, themePreset.volumeFootprint),
    [preset.volumeFootprintOptions, themePreset.volumeFootprint],
  );
  const themedVolumeProfileOptions = useMemo(
    () => mergeVolumeProfileStudyOptions(preset.volumeProfileOptions, themePreset.volumeProfile),
    [preset.volumeProfileOptions, themePreset.volumeProfile],
  );
  const themedSessionVolumeProfileOptions = useMemo(
    () =>
      mergeSessionVolumeProfileStudyOptions(
        preset.sessionVolumeProfileOptions,
        themePreset.sessionVolumeProfile,
      ),
    [preset.sessionVolumeProfileOptions, themePreset.sessionVolumeProfile],
  );
  const themedDeltaSummaryOptions = useMemo(
    () => mergeDeltaSummaryStudyOptions(preset.deltaSummaryOptions, themePreset.deltaSummary),
    [preset.deltaSummaryOptions, themePreset.deltaSummary],
  );
  const themedCandleHeatmapOptions = useMemo(
    () => mergeCandleHeatmapOptions(preset.candleHeatmapOptions, themePreset.candleHeatmap),
    [preset.candleHeatmapOptions, themePreset.candleHeatmap],
  );
  const instrumentAwareFootprintOptions = useMemo(
    () =>
      mergeFootprintStudyOptions(themedFootprintOptions, {
        ladder: {
          priceStep: effectiveMintick,
        },
      }),
    [effectiveMintick, themedFootprintOptions],
  );
  const instrumentAwareVolumeFootprintOptions = useMemo(
    () =>
      mergeFootprintStudyOptions(themedVolumeFootprintOptions, {
        ladder: {
          priceStep: effectiveMintick,
        },
      }),
    [effectiveMintick, themedVolumeFootprintOptions],
  );
  const candleHeatmapScores = useMemo(() => buildDemoCandleHeatmapScores(bars), [bars]);
  const candleHeatmapAccessor = useCallback(
    (bar: OrderFlowBar) => resolveDemoCandleHeatmapScore(bar, candleHeatmapScores),
    [candleHeatmapScores],
  );
  const candleMetricData = useMemo<SeriesMetricPrimitiveDatum[]>(() => {
    if (!preset.showVolumeDeltaPivot) {
      return [];
    }

    const mergedStyle = {
      ...DEFAULT_FOOTPRINT_STYLE,
      ...(instrumentAwareFootprintOptions?.style ?? {}),
      metricStyles: {
        ...DEFAULT_FOOTPRINT_STYLE.metricStyles,
        ...(instrumentAwareFootprintOptions?.style?.metricStyles ?? {}),
      },
    };
    const mutedMetricStyle = {
      color: withAlpha(mergedStyle.textColor, themePreset.mode === 'light' ? 0.5 : 0.68),
      font: `600 ${Math.max(10, mergedStyle.fontSize - 1)}px ${mergedStyle.fontFamily}`,
    };
    let runningCumulativeDelta = 0;

    return chartBars.map((bar, index) => {
      runningCumulativeDelta += volumeDeltaPivotData[index]?.delta ?? 0;

      return {
        time: bar.time as TimeValue,
        anchorPrice: bar.low,
        items: [
          {
            id: 'cumulative-delta',
            text: `CD ${formatCompactNumericValue(runningCumulativeDelta, {
              integerDigits: mergedStyle.valueIntegerDigits,
              decimalDigits: mergedStyle.valueDecimalDigits,
              rounding: mergedStyle.valueRounding,
              suffixVisible: mergedStyle.valueUnitVisible,
            })}`,
            placement: 'below',
            offset: 6,
            orientation: 'vertical',
            style: {
              ...mutedMetricStyle,
              backgroundColor: 'transparent',
            },
          },
        ],
      };
    });
  }, [
    chartBars,
    instrumentAwareFootprintOptions?.style,
    preset.showVolumeDeltaPivot,
    themePreset.mode,
    volumeDeltaPivotData,
  ]);
  const effectiveRestoredViewState = useMemo(() => {
    if (!restoredViewState) {
      return null;
    }

    if (preset.showVolumeDeltaPivot && preset.showOrderFlowPane === false) {
      return {
        ...restoredViewState,
        panes: restoredViewState.panes.filter((pane) => pane.paneIndex === 0),
      };
    }

    return restoredViewState;
  }, [preset.showOrderFlowPane, preset.showVolumeDeltaPivot, restoredViewState]);

  useEffect(() => {
    document.title = `Lightweight Order Flow Charts | ${preset.label}`;
  }, [preset.label]);

  useEffect(() => {
    if (availableDates.length && !availableDates.includes(sessionDate)) {
      const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
      setSessionDate(availableDates[availableDates.length - 1]);
      setRestoredViewState(nextViewState);
      setViewState(nextViewState);
    }
  }, [availableDates, restoredViewState, sessionDate, viewState]);

  useEffect(() => {
    let cancelled = false;
    setDataStatus('loading');
    setDataError(null);
    setLoadedBars([]);
    setLoadedChartBars([]);
    setLoadedLowerOrderFlowBars([]);
    setStreamBars([]);

    Promise.all([
      loadOrderFlowBars(symbol, sessionDate, interval),
      loadMarketBars(symbol, sessionDate, interval),
      loadOrderFlowBars(symbol, sessionDate, interval === '5m' ? '1m' : interval),
    ])
      .then(([nextBars, nextChartBars, nextLowerOrderFlowBars]) => {
        if (cancelled) {
          return;
        }

        setLoadedBars(nextBars);
        setLoadedChartBars(nextChartBars);
        setLoadedLowerOrderFlowBars(nextLowerOrderFlowBars);
        setDataStatus('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setLoadedBars([]);
        setLoadedChartBars([]);
        setLoadedLowerOrderFlowBars([]);
        setDataStatus('error');
        setDataError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, [interval, sessionDate, symbol]);

  useEffect(() => {
    if (!streamEnabled || !loadedBars.length) {
      setStreamBars(loadedBars);
      return;
    }

    const frameCount = resolveSyntheticStreamFrameCount(loadedBars);
    let frameIndex = 0;
    let intervalId = 0;

    setStreamBars([]);
    setStreamBars(buildSyntheticStreamBars(loadedBars, frameIndex));
    frameIndex += 1;

    intervalId = window.setInterval(() => {
      setStreamBars(buildSyntheticStreamBars(loadedBars, frameIndex));
      frameIndex += 1;

      if (frameIndex >= frameCount && intervalId) {
        window.clearInterval(intervalId);
      }
    }, STREAM_STEP_INTERVAL_MS);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [loadedBars, streamEnabled]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      writeExploreDemoUrlState({
        presetId,
        themeId,
        symbol,
        sessionDate,
        interval,
        mintick: effectiveMintick,
        chartView: viewState,
      });
    }, 160);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [effectiveMintick, interval, presetId, sessionDate, symbol, themeId, viewState]);

  const applyPresetDefaults = (nextPresetId: string) => {
    const nextPreset = getConceptPreset(nextPresetId);
    setPresetId(nextPreset.id);
    setThemeId(nextPreset.defaultThemeId);
    setSymbol(nextPreset.defaultSymbol);
    setInterval(nextPreset.defaultInterval);
    setSessionDate(nextPreset.defaultDate);
    setMintick(nextPreset.defaultMintick ?? null);
    setRestoredViewState(nextPreset.defaultViewState ?? null);
    setViewState(nextPreset.defaultViewState ?? null);
  };
  const footerText = `${symbol} | ${sessionDate} | ${interval} | Mintick: ${formatMintick(
    effectiveMintick,
  )} | Theme: ${themePreset.label} | Source: ${
    streamEnabled ? 'canonical synthetic stream' : 'canonical aggregated data'
  } | Stream: ${streamEnabled ? 'on' : 'off'}`;

  return (
    <>
      <ConceptToolbar
        presetId={presetId}
        presetOptions={CONCEPT_PRESETS.map((entry) => ({
          value: entry.id,
          label: entry.label,
        }))}
        onPresetChange={applyPresetDefaults}
        themeId={themeId}
        themeOptions={THEME_PRESETS.map((entry) => ({
          value: entry.id,
          label: entry.label,
        }))}
        onThemeChange={setThemeId}
        sessionDate={sessionDate}
        dateOptions={availableDates.map((entry) => ({
          value: entry,
          label: entry,
        }))}
        onDateChange={(value) => {
          const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
          setSessionDate(value);
          setRestoredViewState(nextViewState);
          setViewState(nextViewState);
        }}
        symbol={symbol}
        symbolOptions={AVAILABLE_SYMBOLS.map((entry) => ({
          value: entry,
          label: entry,
        }))}
        onSymbolChange={(value) => {
          const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
          setSymbol(value as SymbolCode);
          setRestoredViewState(nextViewState);
          setViewState(nextViewState);
        }}
        interval={interval}
        intervalOptions={AVAILABLE_INTERVALS.map((entry) => ({
          value: entry,
          label: entry,
        }))}
        onIntervalChange={(value) => {
          const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
          setInterval(value as BarInterval);
          setRestoredViewState(nextViewState);
          setViewState(nextViewState);
        }}
        mintick={effectiveMintick}
        mintickOptions={mintickOptions.map((entry) => ({
          value: entry,
          label: formatMintick(entry),
        }))}
        onMintickChange={(value) => {
          const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
          setMintick(value);
          setRestoredViewState(nextViewState);
          setViewState(nextViewState);
        }}
        rightActions={
          <button
            onClick={() => {
              if (loadedBars.length > 0) {
                setStreamEnabled((current) => !current);
              }
            }}
            disabled={!loadedBars.length}
            style={{
              background: !loadedBars.length
                ? 'rgba(71, 85, 105, 0.18)'
                : streamEnabled
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(148, 163, 184, 0.16)',
              color: !loadedBars.length ? '#94a3b8' : streamEnabled ? '#bbf7d0' : '#e2e8f0',
              border: !loadedBars.length
                ? '1px solid rgba(71, 85, 105, 0.28)'
                : streamEnabled
                  ? '1px solid rgba(34, 197, 94, 0.28)'
                  : '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: loadedBars.length ? 'pointer' : 'not-allowed',
            }}
          >
            {loadedBars.length ? 'Stream' : 'Stream (data unavailable)'}
          </button>
        }
      />

      {bars.length ? (
        <OrderFlowChart
          key={`explore-preset-${presetId}-${themeId}`}
          bars={bars}
          chartHeight={900}
          footerText={footerText}
          theme={themePreset.surface}
          seriesMode={preset.seriesMode}
          showVisibleProfile={preset.showVisibleProfile}
          showSessionProfiles={preset.showSessionProfiles}
          showVwap={preset.showVwap}
          showReferenceCandles={preset.showReferenceCandles}
          referencePanePlacement={preset.referencePanePlacement}
          referencePaneHeightRatio={preset.referencePaneHeightRatio}
          showOrderFlowPane={preset.showOrderFlowPane ?? true}
          showVolumePane={preset.showVolumePane}
          showVolumeDeltaPivot={preset.showVolumeDeltaPivot}
          showDeltaSummary={preset.showDeltaSummary}
          deltaSummaryPaneHeightRatio={preset.deltaSummaryPaneHeightRatio}
          footprintOptions={instrumentAwareFootprintOptions}
          volumeFootprintOptions={instrumentAwareVolumeFootprintOptions}
          volumeProfileOptions={themedVolumeProfileOptions}
          sessionVolumeProfileOptions={themedSessionVolumeProfileOptions}
          deltaSummaryOptions={themedDeltaSummaryOptions}
          volumeDeltaPivotData={volumeDeltaPivotData}
          candleSeriesOptions={themePreset.candleSeries}
          candleHeatmapOptions={themedCandleHeatmapOptions}
          candleHeatmapAccessor={candleHeatmapAccessor}
          candleMetricData={candleMetricData}
          volumeSeriesOptions={themePreset.volumeSeries}
          volumeDeltaPivotSeriesOptions={themePreset.volumeDeltaPivotSeries}
          volumeDeltaPivotBaselineOptions={themePreset.volumeDeltaPivotBaseline}
          initialViewState={effectiveRestoredViewState}
          onViewStateChange={setViewState}
          dataSourceKey={`${symbol}:${sessionDate}:${interval}:${effectiveMintick}:${streamEnabled ? 'stream' : 'static'}`}
        />
      ) : (
        <section
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            color: '#cbd5e1',
          }}
        >
          {dataStatus === 'loading'
            ? 'Loading canonical aggregated data for this selection.'
            : dataError
              ? `Unable to load canonical aggregated data: ${dataError}`
              : 'No stored market data is available for this selection yet.'}
        </section>
      )}
    </>
  );
}
