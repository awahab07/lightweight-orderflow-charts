import { useEffect, useMemo, useState } from 'react';

import {
  applyOrderFlowPatch,
  buildSupportedMinticks,
  clusterOrderFlowBarsByMintick,
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
  type BarInterval,
  type SymbolCode,
} from '../lib/marketData';
import {
  buildReplayPatch,
  STREAM_STEP_INTERVAL_MS,
  STREAM_STEPS_PER_BAR,
} from '../lib/orderFlowReplay';

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

export function FixtureDemoPage() {
  const [presetId, setPresetId] = useState<FixturePresetId>('fp-candle-001');
  const preset = FIXTURE_PRESETS[presetId];
  const [symbol, setSymbol] = useState<SymbolCode>('TSLA');
  const [interval, setInterval] = useState<BarInterval>('5m');
  const [sessionDate, setSessionDate] = useState(() => availableDatesForSymbol('TSLA').at(-1) ?? '');
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
  const [autoFitRequestKey, setAutoFitRequestKey] = useState(0);
  const [streamEnabled, setStreamEnabled] = useState(false);
  const [streamBars, setStreamBars] = useState<OrderFlowBar[]>([]);

  useEffect(() => {
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
    setMintick(0.1);
  }, [preset]);

  const instrument = useMemo(() => loadInstrument(symbol), [symbol]);
  const availableDates = useMemo(() => availableDatesForSymbol(symbol), [symbol]);
  const sourceBars = useMemo(
    () => loadOrderFlowBars(symbol, sessionDate, interval),
    [interval, sessionDate, symbol],
  );
  const basePriceStep = instrument.tickSize > 0 ? instrument.tickSize : 0.01;

  useEffect(() => {
    if (availableDates.length && !availableDates.includes(sessionDate)) {
      setSessionDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, sessionDate]);

  useEffect(() => {
    if (!streamEnabled) {
      setStreamBars(sourceBars);
      return;
    }

    if (!sourceBars.length) {
      setStreamBars([]);
      return;
    }

    let barIndex = 0;
    let stageIndex = 0;
    let intervalId = 0;

    const advance = () => {
      const sourceBar = sourceBars[barIndex];

      if (!sourceBar) {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
        return;
      }

      const patch = buildReplayPatch(sourceBar, stageIndex, STREAM_STEPS_PER_BAR);
      setStreamBars((current) => applyOrderFlowPatch(current, patch));

      stageIndex += 1;
      if (stageIndex >= STREAM_STEPS_PER_BAR) {
        stageIndex = 0;
        barIndex += 1;
      }

      if (barIndex >= sourceBars.length && intervalId) {
        window.clearInterval(intervalId);
      }
    };

    setStreamBars([]);
    advance();
    intervalId = window.setInterval(advance, STREAM_STEP_INTERVAL_MS);

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
  const theme = preset.theme;
  const chartHeight = preset.chartHeight;

  const footerText = useMemo(
    () =>
      `Preset: ${preset.label} | ${symbol} ${sessionDate} ${interval} | Bars: ${displayBars.length} | Candle position: ${candlePosition} | Mintick: ${formatMintick(effectiveMintick)} | Delta summary: ${showDeltaSummary ? 'on' : 'off'} | Mode: ${seriesMode} | Stream: ${streamEnabled ? 'on' : 'off'}`,
    [
      candlePosition,
      displayBars.length,
      effectiveMintick,
      interval,
      preset,
      seriesMode,
      sessionDate,
      showDeltaSummary,
      streamEnabled,
      symbol,
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
    <>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Playground</h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
          Explore the lower-level chart controls, toggles, and renderer combinations.
        </p>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Use this view to stress the public options surface after learning the concepts on the main
          page.
        </p>
        <a
          href="#/"
          style={{
            display: 'inline-block',
            marginTop: 8,
            color: '#93c5fd',
            textDecoration: 'none',
          }}
        >
          Back to learn mode
        </a>
      </header>

      <section
        style={{
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
          </select>
        </label>

        <Toggle
          label="Visible Range Profile"
          checked={showVisibleProfile}
          onChange={setShowVisibleProfile}
        />
        <Toggle
          label="Reference Candles Pane"
          checked={showReferenceCandles}
          onChange={setShowReferenceCandles}
        />
        <Toggle
          label="Session Profiles"
          checked={showSessionProfiles}
          onChange={setShowSessionProfiles}
        />
        <Toggle label="Volume Pane" checked={showVolumePane} onChange={setShowVolumePane} />
        <Toggle label="VWAP" checked={showVwap} onChange={setShowVwap} />
        <Toggle label="Delta Summary" checked={showDeltaSummary} onChange={setShowDeltaSummary} />
        <Toggle label="Show Candle" checked={showCandle} onChange={setShowCandle} />
        <Toggle label="Show Wicks" checked={showWicks} onChange={setShowWicks} />
        <Toggle label="Show Unit Symbol" checked={showValueUnit} onChange={setShowValueUnit} />

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
          onClick={() => setStreamEnabled((current) => !current)}
          style={{
            background: streamEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.16)',
            color: streamEnabled ? '#bbf7d0' : '#e2e8f0',
            border: streamEnabled
              ? '1px solid rgba(34, 197, 94, 0.28)'
              : '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
          }}
        >
          Stream
        </button>
      </section>

      {clusteredBars.length ? (
        <OrderFlowChart
          bars={clusteredBars}
          seriesMode={seriesMode}
          showVisibleProfile={showVisibleProfile}
          showSessionProfiles={showSessionProfiles}
          showVwap={showVwap}
          showReferenceCandles={showReferenceCandles}
          showVolumePane={showVolumePane}
          showDeltaSummary={showDeltaSummary}
          chartHeight={chartHeight}
          footerText={footerText}
          theme={theme}
          footprintOptions={footprintOptions}
          volumeFootprintOptions={volumeFootprintOptions}
          volumeProfileOptions={volumeProfileOptions}
          sessionVolumeProfileOptions={sessionVolumeProfileOptions}
          deltaSummaryOptions={deltaSummaryOptions}
          candleSeriesOptions={preset.candleSeriesOptions}
          volumeSeriesOptions={preset.volumeSeriesOptions}
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
          No stored market data is available for this selection yet.
        </section>
      )}
    </>
  );
}
