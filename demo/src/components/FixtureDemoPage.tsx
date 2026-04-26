import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

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

const PLAYGROUND_CHART_HEIGHT = 900;

const SIDEBAR_SURFACE_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridColumn: '2 / 3',
  gridRow: '1 / 2',
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 12,
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(11, 18, 32, 0.98) 0%, rgba(10, 16, 30, 0.98) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  boxShadow: '0 20px 48px rgba(2, 6, 23, 0.36)',
  position: 'sticky',
  top: 16,
  boxSizing: 'border-box',
};

const SIDEBAR_SECTION_STYLE: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 10,
  borderRadius: 14,
  background: 'rgba(15, 23, 42, 0.52)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
};

const SIDEBAR_SECTION_TITLE_STYLE: CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const SIDEBAR_FIELD_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
};

const SIDEBAR_LABEL_STYLE: CSSProperties = {
  flex: '0 0 66px',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const SIDEBAR_SUBLABEL_STYLE: CSSProperties = {
  flex: '0 0 72px',
  color: '#e2e8f0',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
};

const SIDEBAR_CONTROL_STYLE: CSSProperties = {
  minWidth: 0,
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#f8fafc',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 10,
  padding: '7px 10px',
  fontSize: 13,
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  boxSizing: 'border-box',
};

const SIDEBAR_COLOR_TEXT_STYLE: CSSProperties = {
  ...SIDEBAR_CONTROL_STYLE,
  minWidth: 0,
  width: 70,
  fontFamily: 'ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 12,
};

const SIDEBAR_COLOR_SWATCH_STYLE: CSSProperties = {
  width: 30,
  height: 30,
  padding: 2,
  borderRadius: 10,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.92)',
  cursor: 'pointer',
};

const SIDEBAR_ACTION_BUTTON_STYLE: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '9px 14px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
};

function normalizeColorPickerValue(value: string, fallback = '#000000'): string {
  const trimmed = value.trim();
  const shortHexMatch = trimmed.match(/^#([\da-f]{3})$/i);

  if (shortHexMatch) {
    return `#${shortHexMatch[1]
      .split('')
      .map((part) => `${part}${part}`)
      .join('')
      .toLowerCase()}`;
  }

  const hexMatch = trimmed.match(/^#([\da-f]{6})(?:[\da-f]{2})?$/i);

  if (hexMatch) {
    return `#${hexMatch[1].toLowerCase()}`;
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i,
  );

  if (rgbMatch) {
    const toHex = (raw: string) =>
      Math.max(0, Math.min(255, Math.round(Number(raw) || 0)))
        .toString(16)
        .padStart(2, '0');

    return `#${toHex(rgbMatch[1] ?? '0')}${toHex(rgbMatch[2] ?? '0')}${toHex(rgbMatch[3] ?? '0')}`;
  }

  return fallback;
}

function SidebarSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section style={SIDEBAR_SECTION_STYLE}>
      {title ? <h3 style={SIDEBAR_SECTION_TITLE_STYLE}>{title}</h3> : null}
      <div style={{ display: 'grid', gap: 10 }}>{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  labelTone = 'accent',
  children,
}: {
  label: string;
  labelTone?: 'accent' | 'default';
  children: ReactNode;
}) {
  return (
    <label style={SIDEBAR_FIELD_ROW_STYLE}>
      <span style={labelTone === 'accent' ? SIDEBAR_LABEL_STYLE : SIDEBAR_SUBLABEL_STYLE}>
        {label}
      </span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', flex: '0 0 auto', minWidth: 0 }}>
        {children}
      </span>
    </label>
  );
}

function SelectControl({
  style,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
}) {
  return (
    <select {...props} style={{ ...SIDEBAR_CONTROL_STYLE, ...style }}>
      {children}
    </select>
  );
}

function TextControl(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;

  return <input {...rest} style={{ ...SIDEBAR_CONTROL_STYLE, ...style }} />;
}

function ColorControl({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="color"
        aria-label={`${value} color picker`}
        value={normalizeColorPickerValue(value, '#000000')}
        onChange={(event) => onChange(event.target.value)}
        style={SIDEBAR_COLOR_SWATCH_STYLE}
      />
      <TextControl
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        style={SIDEBAR_COLOR_TEXT_STYLE}
      />
    </div>
  );
}

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
    <label
      style={{
        display: 'inline-flex',
        gap: 10,
        alignItems: 'center',
        color: '#e2e8f0',
        fontSize: 14,
        lineHeight: 1.25,
      }}
    >
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
        style={{ accentColor: '#2563eb' }}
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
      setSessionDate(
        preferredTickDateForSymbol(symbol) ?? availableDates[availableDates.length - 1],
      );
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
  const chartHeight = PLAYGROUND_CHART_HEIGHT;
  const sidebarStyle = useMemo<CSSProperties>(
    () => ({
      ...SIDEBAR_SURFACE_STYLE,
      height: chartHeight,
      maxHeight: chartHeight,
    }),
    [chartHeight],
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 240px',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <section style={sidebarStyle}>
        <SidebarSection title="Setup">
          <FieldRow label="Preset">
            <SelectControl
              value={presetId}
              onChange={(event) => setPresetId(event.target.value as FixturePresetId)}
              style={{ width: 116 }}
            >
              {Object.values(FIXTURE_PRESETS).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </SelectControl>
          </FieldRow>

          <FieldRow label="Symbol">
            <SelectControl
              value={symbol}
              onChange={(event) => setSymbol(event.target.value as SymbolCode)}
              style={{ width: 78 }}
            >
              {AVAILABLE_SYMBOLS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </SelectControl>
          </FieldRow>

          <FieldRow label="Date">
            <SelectControl
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              style={{ width: 108 }}
            >
              {availableDates.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </SelectControl>
          </FieldRow>

          <FieldRow label="Interval">
            <SelectControl
              value={interval}
              onChange={(event) => setInterval(event.target.value as BarInterval)}
              style={{ width: 72 }}
            >
              {AVAILABLE_INTERVALS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </SelectControl>
          </FieldRow>

          <FieldRow label="Series Mode">
            <SelectControl
              value={seriesMode}
              onChange={(event) => setSeriesMode(event.target.value as SeriesMode)}
              style={{ width: 116 }}
            >
              <option value="footprint">Footprint</option>
              <option value="volume-footprint">Volume Footprint</option>
              <option value="candle-heatmap">Candle Heatmap</option>
            </SelectControl>
          </FieldRow>
        </SidebarSection>

        <SidebarSection title="Studies">
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
          <Toggle label="Volume Pane" checked={showVolumePane} onChange={setShowVolumePane} />
          <Toggle label="VWAP" checked={showVwap} onChange={setShowVwap} />
          <Toggle label="Delta Summary" checked={showDeltaSummary} onChange={setShowDeltaSummary} />
          {showOrderFlowControls ? (
            <Toggle label="Show Candle" checked={showCandle} onChange={setShowCandle} />
          ) : null}
          {showOrderFlowControls ? (
            <Toggle label="Show Wicks" checked={showWicks} onChange={setShowWicks} />
          ) : null}
          {showOrderFlowControls ? (
            <Toggle label="Show Unit Symbol" checked={showValueUnit} onChange={setShowValueUnit} />
          ) : null}
        </SidebarSection>

        <SidebarSection title="Display">
          {showOrderFlowControls ? (
            <FieldRow label="Candle Position" labelTone="default">
              <SelectControl
                value={candlePosition}
                onChange={(event) =>
                  setCandlePosition(event.target.value as FootprintCandlePosition)
                }
                style={{ width: 84 }}
              >
                <option value="left">Left</option>
                <option value="middle">Middle</option>
                <option value="right">Right</option>
              </SelectControl>
            </FieldRow>
          ) : null}

          <FieldRow label="Mintick" labelTone="default">
            <SelectControl
              value={String(effectiveMintick)}
              onChange={(event) => setMintick(Number(event.target.value))}
              style={{ width: 84 }}
            >
              {mintickOptions.map((entry) => (
                <option key={entry} value={entry}>
                  {formatMintick(entry)}
                </option>
              ))}
            </SelectControl>
          </FieldRow>
        </SidebarSection>

        {showHeatmapControls ? (
          <SidebarSection title="Heatmap">
            <FieldRow label="Down Fill" labelTone="default">
              <ColorControl value={heatmapDownColor} onChange={setHeatmapDownColor} />
            </FieldRow>

            <FieldRow label="Up Fill" labelTone="default">
              <ColorControl value={heatmapUpColor} onChange={setHeatmapUpColor} />
            </FieldRow>

            <FieldRow label="Down Wick" labelTone="default">
              <ColorControl value={heatmapWickDownColor} onChange={setHeatmapWickDownColor} />
            </FieldRow>

            <FieldRow label="Up Wick" labelTone="default">
              <ColorControl value={heatmapWickUpColor} onChange={setHeatmapWickUpColor} />
            </FieldRow>

            <FieldRow label="Down Border" labelTone="default">
              <ColorControl value={heatmapBorderDownColor} onChange={setHeatmapBorderDownColor} />
            </FieldRow>

            <FieldRow label="Up Border" labelTone="default">
              <ColorControl value={heatmapBorderUpColor} onChange={setHeatmapBorderUpColor} />
            </FieldRow>

            <Toggle
              label="Heatmap Borders"
              checked={heatmapBorderVisible}
              onChange={setHeatmapBorderVisible}
            />
            <Toggle
              label="Shade Wicks"
              checked={heatmapShadeWicks}
              onChange={setHeatmapShadeWicks}
            />

            <FieldRow label="Shader" labelTone="default">
              <SelectControl
                value={heatmapShader}
                onChange={(event) => setHeatmapShader(event.target.value as CandleHeatmapShader)}
                style={{ width: 82 }}
              >
                <option value="alpha">Alpha</option>
                <option value="hue">Hue</option>
              </SelectControl>
            </FieldRow>

            <FieldRow label="No. of Shades" labelTone="default">
              <SelectControl
                value={String(heatmapNoOfShades)}
                onChange={(event) => setHeatmapNoOfShades(Number(event.target.value))}
                style={{ width: 82 }}
              >
                <option value="0">Continuous</option>
                <option value="1">1</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="16">16</option>
              </SelectControl>
            </FieldRow>

            <FieldRow label="Min" labelTone="default">
              <TextControl
                type="text"
                inputMode="decimal"
                value={heatmapMin}
                onChange={(event) => setHeatmapMin(normalizeDecimalInput(event.target.value))}
                style={{ width: 82 }}
              />
            </FieldRow>

            <FieldRow label="Min Shade Threshold" labelTone="default">
              <TextControl
                type="text"
                inputMode="decimal"
                value={heatmapMinShadeThreshold}
                onChange={(event) =>
                  setHeatmapMinShadeThreshold(normalizeDecimalInput(event.target.value))
                }
                placeholder="off"
                style={{ width: 82 }}
              />
            </FieldRow>

            <FieldRow label="Threshold" labelTone="default">
              <TextControl
                type="text"
                inputMode="decimal"
                value={heatmapThreshold}
                onChange={(event) => setHeatmapThreshold(normalizeDecimalInput(event.target.value))}
                style={{ width: 82 }}
              />
            </FieldRow>

            <FieldRow label="Max Shade Threshold" labelTone="default">
              <TextControl
                type="text"
                inputMode="decimal"
                value={heatmapMaxShadeThreshold}
                onChange={(event) =>
                  setHeatmapMaxShadeThreshold(normalizeDecimalInput(event.target.value))
                }
                placeholder="off"
                style={{ width: 82 }}
              />
            </FieldRow>

            <FieldRow label="Max" labelTone="default">
              <TextControl
                type="text"
                inputMode="decimal"
                value={heatmapMax}
                onChange={(event) => setHeatmapMax(normalizeDecimalInput(event.target.value))}
                style={{ width: 82 }}
              />
            </FieldRow>
          </SidebarSection>
        ) : null}

        <SidebarSection title="Actions">
          <button
            onClick={() => setAutoFitRequestKey((current) => current + 1)}
            style={{
              ...SIDEBAR_ACTION_BUTTON_STYLE,
              background: 'rgba(37, 99, 235, 0.22)',
              color: '#dbeafe',
              border: '1px solid rgba(96, 165, 250, 0.28)',
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
              ...SIDEBAR_ACTION_BUTTON_STYLE,
              background: !sourceBars.length
                ? 'rgba(71, 85, 105, 0.18)'
                : streamEnabled
                  ? 'rgba(34, 197, 94, 0.22)'
                  : 'rgba(148, 163, 184, 0.14)',
              color: !sourceBars.length ? '#94a3b8' : streamEnabled ? '#bbf7d0' : '#e2e8f0',
              border: !sourceBars.length
                ? '1px solid rgba(71, 85, 105, 0.28)'
                : streamEnabled
                  ? '1px solid rgba(34, 197, 94, 0.28)'
                  : '1px solid rgba(148, 163, 184, 0.18)',
              cursor: sourceBars.length ? 'pointer' : 'not-allowed',
            }}
          >
            {sourceBars.length ? 'Stream' : 'Stream (data unavailable)'}
          </button>
        </SidebarSection>
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
