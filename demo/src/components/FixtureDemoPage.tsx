import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildSupportedMinticks,
  clusterOrderFlowBarsByMintick,
  mergeCandleHeatmapOptions,
  type CandleHeatmapPartialOptions,
  type CandleHeatmapShader,
  type FootprintCandlePosition,
  type FootprintSeriesPartialOptions,
  inferPricePrecision,
  normalizeMintick,
  type OrderFlowBar,
  type VolumeFootprintPartialOptions,
} from 'lightweight-orderflow-charts';

import { FIXTURE_PRESETS, type FixturePresetId } from '../fixtures/fixturePresets';
import {
  AVAILABLE_INTERVALS,
  AVAILABLE_SYMBOLS,
  availableDatesForSymbol,
  loadInstrument,
  loadOrderFlowBars,
  preferredTickDateForSymbol,
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

import { OrderFlowChart, type SeriesMode } from './OrderFlowChart';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function formatMintick(value: number): string {
  return value.toFixed(Math.max(2, inferPricePrecision(value)));
}

function formatOptionalNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function normalizeDecimalInput(value: string): string {
  return value.replace(/,/g, '.');
}

function parseDecimalInput(value: string, fallback: number): number {
  const parsed = Number(normalizeDecimalInput(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalDecimalInput(value: string): number | undefined {
  const trimmed = normalizeDecimalInput(value).trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function FixtureDemoPage() {
  const [presetId, setPresetId] = useState<FixturePresetId>('fp-candle-001');
  const preset = FIXTURE_PRESETS[presetId];
  const [symbol, setSymbol] = useState<SymbolCode>('TSLA');
  const [interval, setInterval] = useState<BarInterval>('5m');
  const [sessionDate, setSessionDate] = useState(
    () => preferredTickDateForSymbol('TSLA') ?? availableDatesForSymbol('TSLA').at(-1) ?? '',
  );
  const [seriesMode, setSeriesMode] = useState<SeriesMode>(preset.seriesMode);
  const [showVisibleProfile, setShowVisibleProfile] = useState(true);
  const [showSessionProfiles, setShowSessionProfiles] = useState(true);
  const [showVwap, setShowVwap] = useState(true);
  const [showReferenceCandles, setShowReferenceCandles] = useState(false);
  const [showVolumePane, setShowVolumePane] = useState(false);
  const [showDeltaSummary, setShowDeltaSummary] = useState(true);
  const [showCandle, setShowCandle] = useState(true);
  const [showWicks, setShowWicks] = useState(false);
  const [candlePosition, setCandlePosition] = useState<FootprintCandlePosition>('middle');
  const [mintick, setMintick] = useState<number | null>(0.1);
  const [showValueUnit, setShowValueUnit] = useState(true);
  const [heatmapDownColor, setHeatmapDownColor] = useState('#f23645');
  const [heatmapUpColor, setHeatmapUpColor] = useState('#089981');
  const [heatmapWickDownColor, setHeatmapWickDownColor] = useState('#f23645');
  const [heatmapWickUpColor, setHeatmapWickUpColor] = useState('#089981');
  const [heatmapBorderDownColor, setHeatmapBorderDownColor] = useState('#f23645');
  const [heatmapBorderUpColor, setHeatmapBorderUpColor] = useState('#089981');
  const [heatmapBorderVisible, setHeatmapBorderVisible] = useState(true);
  const [heatmapShadeWicks, setHeatmapShadeWicks] = useState(false);
  const [heatmapNoOfShades, setHeatmapNoOfShades] = useState(1);
  const [heatmapShader, setHeatmapShader] = useState<CandleHeatmapShader>('alpha');
  const [heatmapMin, setHeatmapMin] = useState('0');
  const [heatmapMinShadeThreshold, setHeatmapMinShadeThreshold] = useState('0.1');
  const [heatmapThreshold, setHeatmapThreshold] = useState('0.5');
  const [heatmapMaxShadeThreshold, setHeatmapMaxShadeThreshold] = useState('0.9');
  const [heatmapMax, setHeatmapMax] = useState('1');
  const [autoFitRequestKey, setAutoFitRequestKey] = useState(0);
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [dataStatus, setDataStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dataError, setDataError] = useState<string | null>(null);
  const [sourceBars, setSourceBars] = useState<OrderFlowBar[]>([]);
  const [streamBars, setStreamBars] = useState<OrderFlowBar[]>([]);

  useEffect(() => {
    const resolvedHeatmap = mergeCandleHeatmapOptions(preset.candleHeatmapOptions);
    setSeriesMode(preset.seriesMode);
    setShowVisibleProfile(preset.showVisibleProfile);
    setShowSessionProfiles(preset.showSessionProfiles);
    setShowVwap(preset.showVwap);
    setShowReferenceCandles(preset.showReferenceCandles);
    setShowVolumePane(preset.showVolumePane);
    setShowDeltaSummary(preset.showDeltaSummary);
    setShowCandle(preset.showCandle);
    setShowWicks(preset.showWicks);
    setCandlePosition(preset.candlePosition);
    setShowValueUnit(preset.footprintOptions?.style?.valueUnitVisible ?? true);
    setHeatmapDownColor(resolvedHeatmap.downColor);
    setHeatmapUpColor(resolvedHeatmap.upColor);
    setHeatmapWickDownColor(resolvedHeatmap.wickDownColor ?? resolvedHeatmap.downColor);
    setHeatmapWickUpColor(resolvedHeatmap.wickUpColor ?? resolvedHeatmap.upColor);
    setHeatmapBorderDownColor(resolvedHeatmap.borderDownColor ?? resolvedHeatmap.downColor);
    setHeatmapBorderUpColor(resolvedHeatmap.borderUpColor ?? resolvedHeatmap.upColor);
    setHeatmapBorderVisible(resolvedHeatmap.borderVisible);
    setHeatmapShadeWicks(resolvedHeatmap.shadeWicks);
    setHeatmapNoOfShades(resolvedHeatmap.noOfShades);
    setHeatmapShader(resolvedHeatmap.shader);
    setHeatmapMin(String(resolvedHeatmap.range.min));
    setHeatmapMinShadeThreshold(formatOptionalNumber(resolvedHeatmap.range.minShadeThreshold));
    setHeatmapThreshold(String(resolvedHeatmap.range.threshold));
    setHeatmapMaxShadeThreshold(formatOptionalNumber(resolvedHeatmap.range.maxShadeThreshold));
    setHeatmapMax(String(resolvedHeatmap.range.max));
    setMintick(0.1);
  }, [preset]);

  const instrument = useMemo(() => loadInstrument(symbol), [symbol]);
  const availableDates = useMemo(() => availableDatesForSymbol(symbol), [symbol]);
  const basePriceStep = instrument.tickSize > 0 ? instrument.tickSize : 0.01;

  useEffect(() => {
    if (availableDates.length && !availableDates.includes(sessionDate)) {
      setSessionDate(preferredTickDateForSymbol(symbol) ?? availableDates[availableDates.length - 1]);
    }
  }, [availableDates, sessionDate, symbol]);

  useEffect(() => {
    let cancelled = false;
    setDataStatus('loading');
    setDataError(null);

    loadOrderFlowBars(symbol, sessionDate, interval)
      .then((bars) => {
        if (cancelled) {
          return;
        }

        setSourceBars(bars);
        setDataStatus('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSourceBars([]);
        setDataStatus('error');
        setDataError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, [interval, sessionDate, symbol]);

  useEffect(() => {
    if (!streamEnabled || !sourceBars.length) {
      setStreamBars(sourceBars);
      return;
    }

    const frameCount = resolveSyntheticStreamFrameCount(sourceBars);
    let frameIndex = 0;
    let intervalId = 0;

    setStreamBars([]);
    setStreamBars(buildSyntheticStreamBars(sourceBars, frameIndex));
    frameIndex += 1;

    intervalId = window.setInterval(() => {
      setStreamBars(buildSyntheticStreamBars(sourceBars, frameIndex));
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
  }, [sourceBars, streamEnabled]);

  const displayBars = streamEnabled ? streamBars : sourceBars;

  const mintickOptions = useMemo(() => buildSupportedMinticks(basePriceStep), [basePriceStep]);
  const effectiveMintick = useMemo(
    () => normalizeMintick(mintick ?? basePriceStep, basePriceStep) ?? basePriceStep,
    [basePriceStep, mintick],
  );
  const clusteredBars = useMemo(
    () => clusterOrderFlowBarsByMintick(displayBars, effectiveMintick, basePriceStep),
    [basePriceStep, displayBars, effectiveMintick],
  );
  const showOrderFlowControls = seriesMode !== 'candle-heatmap';
  const showHeatmapControls = seriesMode === 'candle-heatmap';
  const resolvedPresetHeatmapOptions = useMemo(
    () => mergeCandleHeatmapOptions(preset.candleHeatmapOptions),
    [preset.candleHeatmapOptions],
  );
  const candleHeatmapOptions = useMemo<CandleHeatmapPartialOptions>(
    () => ({
      downColor: heatmapDownColor.trim() || resolvedPresetHeatmapOptions.downColor,
      upColor: heatmapUpColor.trim() || resolvedPresetHeatmapOptions.upColor,
      wickDownColor: heatmapWickDownColor.trim() || resolvedPresetHeatmapOptions.wickDownColor,
      wickUpColor: heatmapWickUpColor.trim() || resolvedPresetHeatmapOptions.wickUpColor,
      borderDownColor:
        heatmapBorderDownColor.trim() || resolvedPresetHeatmapOptions.borderDownColor,
      borderUpColor: heatmapBorderUpColor.trim() || resolvedPresetHeatmapOptions.borderUpColor,
      borderVisible: heatmapBorderVisible,
      shadeWicks: heatmapShadeWicks,
      noOfShades: heatmapNoOfShades,
      shader: heatmapShader,
      range: {
        min: parseDecimalInput(heatmapMin, resolvedPresetHeatmapOptions.range.min),
        minShadeThreshold: parseOptionalDecimalInput(heatmapMinShadeThreshold),
        threshold: parseDecimalInput(
          heatmapThreshold,
          resolvedPresetHeatmapOptions.range.threshold,
        ),
        maxShadeThreshold: parseOptionalDecimalInput(heatmapMaxShadeThreshold),
        max: parseDecimalInput(heatmapMax, resolvedPresetHeatmapOptions.range.max),
      },
    }),
    [
      heatmapMax,
      heatmapMaxShadeThreshold,
      heatmapBorderDownColor,
      heatmapBorderUpColor,
      heatmapBorderVisible,
      heatmapDownColor,
      heatmapThreshold,
      heatmapMin,
      heatmapMinShadeThreshold,
      heatmapNoOfShades,
      heatmapShadeWicks,
      heatmapShader,
      heatmapUpColor,
      heatmapWickDownColor,
      heatmapWickUpColor,
      resolvedPresetHeatmapOptions.borderDownColor,
      resolvedPresetHeatmapOptions.borderUpColor,
      resolvedPresetHeatmapOptions.downColor,
      resolvedPresetHeatmapOptions.range.max,
      resolvedPresetHeatmapOptions.range.threshold,
      resolvedPresetHeatmapOptions.range.min,
      resolvedPresetHeatmapOptions.upColor,
      resolvedPresetHeatmapOptions.wickDownColor,
      resolvedPresetHeatmapOptions.wickUpColor,
    ],
  );
  const candleHeatmapScores = useMemo(
    () => buildDemoCandleHeatmapScores(clusteredBars),
    [clusteredBars],
  );
  const candleHeatmapAccessor = useCallback(
    (bar: OrderFlowBar) => resolveDemoCandleHeatmapScore(bar, candleHeatmapScores),
    [candleHeatmapScores],
  );
  const theme = preset.theme;
  const chartHeight = preset.chartHeight;

  const footerText = useMemo(
    () =>
      `Preset: ${preset.label} | ${symbol} ${sessionDate} ${interval} | Bars: ${displayBars.length} | Source: ${streamEnabled ? 'synthetic-stream' : 'canonical aggregated data'} | ${showOrderFlowControls ? `Candle position: ${candlePosition} | ` : ''}Mintick: ${formatMintick(effectiveMintick)} | Delta summary: ${showDeltaSummary ? 'on' : 'off'} | Mode: ${seriesMode}${showHeatmapControls ? ` | Heatmap: ${heatmapShader}/${heatmapNoOfShades === 0 ? 'continuous' : `${heatmapNoOfShades} shades`}` : ''} | Stream: ${streamEnabled ? 'on' : 'off'}`,
    [
      candlePosition,
      displayBars.length,
      effectiveMintick,
      heatmapNoOfShades,
      heatmapShader,
      interval,
      preset,
      seriesMode,
      sessionDate,
      showDeltaSummary,
      showHeatmapControls,
      showOrderFlowControls,
      streamEnabled,
      symbol,
    ],
  );
  const heatmapRenderKey = useMemo(
    () =>
      [
        heatmapDownColor.trim(),
        heatmapUpColor.trim(),
        heatmapWickDownColor.trim(),
        heatmapWickUpColor.trim(),
        heatmapBorderDownColor.trim(),
        heatmapBorderUpColor.trim(),
        heatmapBorderVisible,
        heatmapShadeWicks,
        heatmapNoOfShades,
        heatmapShader,
        heatmapMin,
        heatmapMinShadeThreshold,
        heatmapThreshold,
        heatmapMaxShadeThreshold,
        heatmapMax,
      ].join(':'),
    [
      heatmapMax,
      heatmapBorderDownColor,
      heatmapBorderUpColor,
      heatmapBorderVisible,
      heatmapDownColor,
      heatmapMaxShadeThreshold,
      heatmapMin,
      heatmapMinShadeThreshold,
      heatmapNoOfShades,
      heatmapShadeWicks,
      heatmapShader,
      heatmapThreshold,
      heatmapUpColor,
      heatmapWickDownColor,
      heatmapWickUpColor,
    ],
  );
  const footprintOptions = useMemo<FootprintSeriesPartialOptions>(() => {
    const base = preset.footprintOptions ?? {};
    return {
      ...base,
      ladder: {
        ...base.ladder,
        priceStep: effectiveMintick,
      },
      style: {
        ...base.style,
        valueUnitVisible: showValueUnit,
      },
      candle: {
        ...base.candle,
        visible: showCandle,
        position: candlePosition,
        showWicks,
      },
    };
  }, [candlePosition, effectiveMintick, preset, showCandle, showValueUnit, showWicks]);

  const volumeFootprintOptions = useMemo<VolumeFootprintPartialOptions>(
    () => ({
      ...(preset.volumeFootprintOptions ?? footprintOptions),
      ladder: {
        ...(preset.volumeFootprintOptions?.ladder ?? footprintOptions.ladder),
        priceStep: effectiveMintick,
      },
      style: {
        ...(preset.volumeFootprintOptions?.style ?? footprintOptions.style),
        valueUnitVisible: showValueUnit,
      },
      candle: {
        ...(preset.volumeFootprintOptions?.candle ?? footprintOptions.candle),
        visible: showCandle,
        position: candlePosition,
        showWicks,
      },
    }),
    [
      candlePosition,
      effectiveMintick,
      footprintOptions,
      preset.volumeFootprintOptions,
      showCandle,
      showValueUnit,
      showWicks,
    ],
  );
  const volumeProfileOptions = preset.volumeProfileOptions;
  const sessionVolumeProfileOptions = preset.sessionVolumeProfileOptions;
  const deltaSummaryOptions = preset.deltaSummaryOptions;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 240px',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <section
        style={{
          display: 'grid',
          gap: 12,
          gridColumn: '2 / 3',
          gridRow: '1 / 2',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          position: 'sticky',
          top: 16,
        }}
      >
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Preset
          <select
            value={presetId}
            onChange={(event) => setPresetId(event.target.value as FixturePresetId)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            {Object.values(FIXTURE_PRESETS).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Symbol
          <select
            value={symbol}
            onChange={(event) => setSymbol(event.target.value as SymbolCode)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            {AVAILABLE_SYMBOLS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Date
          <select
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            {availableDates.map((entry) => (
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
            onChange={(event) => setInterval(event.target.value as BarInterval)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            {AVAILABLE_INTERVALS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Series Mode
          <select
            value={seriesMode}
            onChange={(event) => setSeriesMode(event.target.value as SeriesMode)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            <option value="footprint">Footprint</option>
            <option value="volume-footprint">Volume Footprint</option>
            <option value="candle-heatmap">Candle Heatmap</option>
          </select>
        </label>

        {showOrderFlowControls ? (
          <Toggle
            label="Visible Range Profile"
            checked={showVisibleProfile}
            onChange={setShowVisibleProfile}
          />
        ) : null}
        {showOrderFlowControls ? (
          <Toggle
            label="Reference Candles Pane"
            checked={showReferenceCandles}
            onChange={setShowReferenceCandles}
          />
        ) : null}
        {showOrderFlowControls ? (
          <Toggle
            label="Session Profiles"
            checked={showSessionProfiles}
            onChange={setShowSessionProfiles}
          />
        ) : null}
        <Toggle label="Volume Pane" checked={showVolumePane} onChange={setShowVolumePane} />
        <Toggle label="VWAP" checked={showVwap} onChange={setShowVwap} />
        <Toggle label="Delta Summary" checked={showDeltaSummary} onChange={setShowDeltaSummary} />
        {showOrderFlowControls ? (
          <Toggle label="Show Candle" checked={showCandle} onChange={setShowCandle} />
        ) : null}
        <Toggle label="Show Wicks" checked={showWicks} onChange={setShowWicks} />
        {showOrderFlowControls ? (
          <Toggle label="Show Unit Symbol" checked={showValueUnit} onChange={setShowValueUnit} />
        ) : null}

        {showOrderFlowControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Candle Position
            <select
              value={candlePosition}
              onChange={(event) => setCandlePosition(event.target.value as FootprintCandlePosition)}
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <option value="left">Left</option>
              <option value="middle">Middle</option>
              <option value="right">Right</option>
            </select>
          </label>
        ) : null}

        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Mintick
          <select
            value={String(effectiveMintick)}
            onChange={(event) => setMintick(Number(event.target.value))}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            {mintickOptions.map((entry) => (
              <option key={entry} value={entry}>
                {formatMintick(entry)}
              </option>
            ))}
          </select>
        </label>

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Down Fill
            <input
              type="text"
              value={heatmapDownColor}
              onChange={(event) => setHeatmapDownColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Up Fill
            <input
              type="text"
              value={heatmapUpColor}
              onChange={(event) => setHeatmapUpColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Down Wick
            <input
              type="text"
              value={heatmapWickDownColor}
              onChange={(event) => setHeatmapWickDownColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Up Wick
            <input
              type="text"
              value={heatmapWickUpColor}
              onChange={(event) => setHeatmapWickUpColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Down Border
            <input
              type="text"
              value={heatmapBorderDownColor}
              onChange={(event) => setHeatmapBorderDownColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Up Border
            <input
              type="text"
              value={heatmapBorderUpColor}
              onChange={(event) => setHeatmapBorderUpColor(event.target.value)}
              spellCheck={false}
              style={{
                width: 116,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <Toggle
            label="Heatmap Borders"
            checked={heatmapBorderVisible}
            onChange={setHeatmapBorderVisible}
          />
        ) : null}

        {showHeatmapControls ? (
          <Toggle label="Shade Wicks" checked={heatmapShadeWicks} onChange={setHeatmapShadeWicks} />
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Shader
            <select
              value={heatmapShader}
              onChange={(event) => setHeatmapShader(event.target.value as CandleHeatmapShader)}
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <option value="alpha">Alpha</option>
              <option value="hue">Hue</option>
            </select>
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            No. of Shades
            <select
              value={String(heatmapNoOfShades)}
              onChange={(event) => setHeatmapNoOfShades(Number(event.target.value))}
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <option value="0">Continuous</option>
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="16">16</option>
            </select>
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Min
            <input
              type="text"
              inputMode="decimal"
              value={heatmapMin}
              onChange={(event) => setHeatmapMin(normalizeDecimalInput(event.target.value))}
              style={{
                width: 88,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Min Shade Threshold
            <input
              type="text"
              inputMode="decimal"
              value={heatmapMinShadeThreshold}
              onChange={(event) =>
                setHeatmapMinShadeThreshold(normalizeDecimalInput(event.target.value))
              }
              placeholder="off"
              style={{
                width: 110,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Threshold
            <input
              type="text"
              inputMode="decimal"
              value={heatmapThreshold}
              onChange={(event) => setHeatmapThreshold(normalizeDecimalInput(event.target.value))}
              style={{
                width: 96,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Max Shade Threshold
            <input
              type="text"
              inputMode="decimal"
              value={heatmapMaxShadeThreshold}
              onChange={(event) =>
                setHeatmapMaxShadeThreshold(normalizeDecimalInput(event.target.value))
              }
              placeholder="off"
              style={{
                width: 110,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        {showHeatmapControls ? (
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Max
            <input
              type="text"
              inputMode="decimal"
              value={heatmapMax}
              onChange={(event) => setHeatmapMax(normalizeDecimalInput(event.target.value))}
              style={{
                width: 88,
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            />
          </label>
        ) : null}

        <button
          onClick={() => setAutoFitRequestKey((current) => current + 1)}
          style={{
            background: 'rgba(59, 130, 246, 0.16)',
            color: '#dbeafe',
            border: '1px solid rgba(96, 165, 250, 0.24)',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
          }}
        >
          Focus chart
        </button>

        <button
          onClick={() => {
            if (sourceBars.length > 0) {
              setStreamEnabled((current) => !current);
            }
          }}
          disabled={!sourceBars.length}
          style={{
            background: !sourceBars.length
              ? 'rgba(71, 85, 105, 0.18)'
              : streamEnabled
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(148, 163, 184, 0.16)',
            color: !sourceBars.length ? '#94a3b8' : streamEnabled ? '#bbf7d0' : '#e2e8f0',
            border: !sourceBars.length
              ? '1px solid rgba(71, 85, 105, 0.28)'
              : streamEnabled
                ? '1px solid rgba(34, 197, 94, 0.28)'
                : '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: sourceBars.length ? 'pointer' : 'not-allowed',
          }}
        >
          {sourceBars.length ? 'Stream' : 'Stream (data unavailable)'}
        </button>
      </section>

      <main style={{ gridColumn: '1 / 2', gridRow: '1 / 2', minWidth: 0 }}>
        {clusteredBars.length ? (
        <OrderFlowChart
          key={`${preset.id}:${seriesMode}:${seriesMode === 'candle-heatmap' ? heatmapRenderKey : 'default'}`}
          bars={clusteredBars}
          seriesMode={seriesMode}
          showVisibleProfile={showVisibleProfile}
          showSessionProfiles={showSessionProfiles}
          showVwap={showVwap}
          showReferenceCandles={showReferenceCandles}
          showOrderFlowPane={showOrderFlowControls}
          showVolumePane={showVolumePane}
          showDeltaSummary={showDeltaSummary}
          deltaSummaryPaneHeightRatio={preset.deltaSummaryPaneHeightRatio}
          chartHeight={chartHeight}
          footerText={footerText}
          theme={theme}
          footprintOptions={footprintOptions}
          volumeFootprintOptions={volumeFootprintOptions}
          volumeProfileOptions={volumeProfileOptions}
          sessionVolumeProfileOptions={sessionVolumeProfileOptions}
          deltaSummaryOptions={deltaSummaryOptions}
          candleSeriesOptions={preset.candleSeriesOptions}
          candleHeatmapOptions={candleHeatmapOptions}
          candleHeatmapAccessor={candleHeatmapAccessor}
          volumeSeriesOptions={preset.volumeSeriesOptions}
          initialViewState={preset.initialViewState}
          autoFitRequestKey={autoFitRequestKey}
          dataSourceKey={`${preset.id}:${symbol}:${sessionDate}:${interval}:${effectiveMintick}:${streamEnabled ? 'stream' : 'static'}`}
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
      </main>
    </div>
  );
}
