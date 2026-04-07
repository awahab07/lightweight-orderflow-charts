import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  DEFAULT_FOOTPRINT_STYLE,
  buildSupportedMinticks,
  buildVolumeDeltaPivotSeriesData,
  type ChartViewStateSnapshot,
  clusterOhlcBarsByMintick,
  clusterOrderFlowBarsByMintick,
  formatCompactNumericValue,
  inferPricePrecision,
  normalizeMintick,
  resolveMetricStyleToken,
  type VolumeDeltaPivotPoint,
  type SeriesMetricPrimitiveDatum,
  type TimeValue,
} from 'lightweight-orderflow-charts';

import {
  CONCEPT_PRESETS,
  getConceptPreset,
  getThemePreset,
  THEME_PRESETS,
} from '../content/learnCatalog';
import { getLesson, LESSONS } from '../content/lessons';
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
import { readLearnDemoUrlState, writeLearnDemoUrlState } from '../lib/learnDemoUrlState';
import {
  mergeDeltaSummaryStudyOptions,
  mergeFootprintStudyOptions,
  mergeSessionVolumeProfileStudyOptions,
  mergeVolumeProfileStudyOptions,
} from '../lib/mergeStudyOptions';

import { OrderFlowChart } from './OrderFlowChart';

const selectStyle: CSSProperties = {
  background: '#0f172a',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  padding: '6px 10px',
};

function formatMintick(value: number): string {
  return value.toFixed(Math.max(2, inferPricePrecision(value)));
}

function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div style={{ display: 'grid', gap: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
      {blocks.map((block, index) => {
        if (block.startsWith('# ')) {
          return (
            <h2 key={index} style={{ margin: 0, color: '#f8fafc', fontSize: 24 }}>
              {block.slice(2)}
            </h2>
          );
        }

        if (block.startsWith('## ')) {
          return (
            <h3 key={index} style={{ margin: 0, color: '#f8fafc', fontSize: 18 }}>
              {block.slice(3)}
            </h3>
          );
        }

        if (block.split('\n').every((line) => line.startsWith('- '))) {
          return (
            <ul key={index} style={{ margin: 0, paddingLeft: 20 }}>
              {block.split('\n').map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function LearnDemoPage() {
  const initialUrlState = useMemo(
    () => (typeof window === 'undefined' ? null : readLearnDemoUrlState(window.location.hash)),
    [],
  );
  const initialPreset = useMemo(
    () =>
      initialUrlState?.presetId &&
      CONCEPT_PRESETS.some((entry) => entry.id === initialUrlState.presetId)
        ? getConceptPreset(initialUrlState.presetId)
        : getConceptPreset(CONCEPT_PRESETS[0]?.id ?? 'order-flow'),
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
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [readingLessonId, setReadingLessonId] = useState<string | null>(null);
  const [restoredViewState, setRestoredViewState] = useState<ChartViewStateSnapshot | null>(
    initialUrlState?.chartView ?? initialPreset.defaultViewState ?? null,
  );
  const [viewState, setViewState] = useState<ChartViewStateSnapshot | null>(
    initialUrlState?.chartView ?? initialPreset.defaultViewState ?? null,
  );

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
  const rawBars = useMemo(
    () => loadOrderFlowBars(symbol, sessionDate, interval),
    [interval, sessionDate, symbol],
  );
  const rawChartBars = useMemo(
    () => loadMarketBars(symbol, sessionDate, interval),
    [interval, sessionDate, symbol],
  );
  const rawLowerOrderFlowBars = useMemo(
    () =>
      loadOrderFlowBars(
        symbol,
        sessionDate,
        interval === '15m' ? '5m' : interval === '5m' ? '1m' : interval,
      ),
    [interval, sessionDate, symbol],
  );
  const bars = useMemo(
    () => clusterOrderFlowBarsByMintick(rawBars, effectiveMintick, instrument.tickSize),
    [effectiveMintick, instrument.tickSize, rawBars],
  );
  const chartBars = useMemo(
    () => clusterOhlcBarsByMintick(rawChartBars, effectiveMintick, instrument.tickSize),
    [effectiveMintick, instrument.tickSize, rawChartBars],
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
        rawLowerOrderFlowBars,
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
    [effectiveMintick, instrument.tickSize, rawLowerOrderFlowBars],
  );
  const volumeDeltaPivotData = useMemo<VolumeDeltaPivotPoint[]>(() => {
    if (!preset.showVolumeDeltaPivot) {
      return [];
    }

    return buildVolumeDeltaPivotSeriesData(deltaSourceBars, lowerDeltaSourceBars, {
      intervalSeconds: interval === '15m' ? 900 : interval === '5m' ? 300 : 60,
    });
  }, [deltaSourceBars, interval, lowerDeltaSourceBars, preset.showVolumeDeltaPivot]);
  const visibleLessons = useMemo(
    () =>
      LESSONS.filter((lesson) => preset.lessonIds.includes(lesson.id)).length
        ? LESSONS.filter((lesson) => preset.lessonIds.includes(lesson.id))
        : LESSONS,
    [preset.lessonIds],
  );
  const readingLesson = readingLessonId ? getLesson(readingLessonId) : null;
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
    let runningCumulativeDelta = 0;

    return chartBars.map((bar, index) => {
      runningCumulativeDelta += volumeDeltaPivotData[index]?.delta ?? 0;
      const styleToken = resolveMetricStyleToken(
        mergedStyle.metricStyles,
        'metric1',
        runningCumulativeDelta < 0 ? 'secondary' : 'primary',
      );

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
              ...styleToken,
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
      setSessionDate(availableDates[availableDates.length - 1]);
      setRestoredViewState(null);
      setViewState(null);
    }
  }, [availableDates, sessionDate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      writeLearnDemoUrlState({
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
    setPresetId(nextPresetId);
    setThemeId(nextPreset.defaultThemeId);
    setSymbol(nextPreset.defaultSymbol);
    setInterval(nextPreset.defaultInterval);
    setSessionDate(nextPreset.defaultDate);
    setMintick(nextPreset.defaultMintick ?? null);
    setRestoredViewState(nextPreset.defaultViewState ?? null);
    setViewState(nextPreset.defaultViewState ?? null);
  };

  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>{preset.label}</h2>
        <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>{preset.summary}</p>
        <div style={{ marginTop: 8 }}>
          <a href="#/playground" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
            Open playground
          </a>
        </div>
      </header>

      <section
        style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Preset
          <select
            value={presetId}
            onChange={(event) => applyPresetDefaults(event.target.value)}
            style={selectStyle}
          >
            {CONCEPT_PRESETS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Theme
          <select
            value={themeId}
            onChange={(event) => {
              setThemeId(event.target.value);
            }}
            style={selectStyle}
          >
            {THEME_PRESETS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Date
          <select
            value={sessionDate}
            onChange={(event) => {
              setSessionDate(event.target.value);
              setRestoredViewState(null);
              setViewState(null);
            }}
            style={selectStyle}
          >
            {availableDates.map((dateValue) => (
              <option key={dateValue} value={dateValue}>
                {dateValue}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Symbol
          <select
            value={symbol}
            onChange={(event) => {
              setSymbol(event.target.value as SymbolCode);
              setRestoredViewState(null);
              setViewState(null);
            }}
            style={selectStyle}
          >
            {AVAILABLE_SYMBOLS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Interval
          <select
            value={interval}
            onChange={(event) => {
              setInterval(event.target.value as BarInterval);
              setRestoredViewState(null);
              setViewState(null);
            }}
            style={selectStyle}
          >
            {AVAILABLE_INTERVALS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Mintick
          <select
            value={String(effectiveMintick)}
            onChange={(event) => {
              setMintick(Number(event.target.value));
              setRestoredViewState(null);
              setViewState(null);
            }}
            style={selectStyle}
          >
            {mintickOptions.map((entry) => (
              <option key={entry} value={entry}>
                {formatMintick(entry)}
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            onClick={() => setLessonsOpen((open) => !open)}
            style={{
              background: 'rgba(37, 99, 235, 0.16)',
              color: '#dbeafe',
              border: '1px solid rgba(96, 165, 250, 0.28)',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Lessons
          </button>

          {lessonsOpen ? (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                width: 420,
                zIndex: 10,
                borderRadius: 12,
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                boxShadow: '0 18px 50px rgba(2, 6, 23, 0.45)',
                padding: 12,
                display: 'grid',
                gap: 10,
              }}
            >
              {visibleLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  style={{
                    borderRadius: 10,
                    padding: 12,
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>{lesson.title}</div>
                  <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
                    {lesson.shortDescription}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      onClick={() => {
                        setLessonsOpen(false);
                        applyPresetDefaults(lesson.presetId);
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.16)',
                        color: '#bbf7d0',
                        border: '1px solid rgba(34, 197, 94, 0.24)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      View chart
                    </button>
                    <button
                      onClick={() => {
                        setLessonsOpen(false);
                        setReadingLessonId(lesson.id);
                        applyPresetDefaults(lesson.presetId);
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.16)',
                        color: '#bfdbfe',
                        border: '1px solid rgba(96, 165, 250, 0.24)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Read
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {bars.length ? (
        <OrderFlowChart
          bars={bars}
          chartHeight={900}
          footerText={`${symbol} | ${sessionDate} | ${interval} | Mintick: ${formatMintick(
            effectiveMintick,
          )} | Theme: ${themePreset.label}`}
          theme={themePreset.surface}
          seriesMode={preset.seriesMode}
          showVisibleProfile={preset.showVisibleProfile}
          showSessionProfiles={preset.showSessionProfiles}
          showVwap={preset.showVwap}
          showReferenceCandles={preset.showReferenceCandles}
          showOrderFlowPane={preset.showOrderFlowPane ?? true}
          showVolumePane={preset.showVolumePane}
          showVolumeDeltaPivot={preset.showVolumeDeltaPivot}
          showDeltaSummary={preset.showDeltaSummary}
          footprintOptions={instrumentAwareFootprintOptions}
          volumeFootprintOptions={instrumentAwareVolumeFootprintOptions}
          volumeProfileOptions={themedVolumeProfileOptions}
          sessionVolumeProfileOptions={themedSessionVolumeProfileOptions}
          deltaSummaryOptions={themedDeltaSummaryOptions}
          volumeDeltaPivotData={volumeDeltaPivotData}
          candleSeriesOptions={themePreset.candleSeries}
          candleMetricData={candleMetricData}
          volumeSeriesOptions={themePreset.volumeSeries}
          volumeDeltaPivotSeriesOptions={themePreset.volumeDeltaPivotSeries}
          volumeDeltaPivotBaselineOptions={themePreset.volumeDeltaPivotBaseline}
          initialViewState={effectiveRestoredViewState}
          onViewStateChange={setViewState}
          dataSourceKey={`${symbol}:${sessionDate}:${interval}:${effectiveMintick}`}
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
          No stored market data is available for this selection yet.
        </section>
      )}

      {readingLesson ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            zIndex: 20,
          }}
        >
          <section
            style={{
              width: 'min(900px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              borderRadius: 18,
              background: '#0f172a',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 24 }}>{readingLesson.title}</h3>
                <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                  {readingLesson.shortDescription}
                </p>
              </div>
              <button
                onClick={() => setReadingLessonId(null)}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            {readingLesson.imageUrl ? (
              <img
                src={readingLesson.imageUrl}
                alt={readingLesson.title}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  marginBottom: 18,
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              />
            ) : null}

            <MarkdownView markdown={readingLesson.markdown} />
          </section>
        </div>
      ) : null}
    </>
  );
}
