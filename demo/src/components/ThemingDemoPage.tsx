import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import type { CandlestickSeriesPartialOptions } from 'lightweight-charts';
import type {
  DeltaSummarySeriesPartialOptions,
  FootprintCandlePosition,
  FootprintSeriesPartialOptions,
  OrderFlowBar,
  OrderFlowSurfaceTheme,
  OrderFlowThemePresetPack,
  VolumeProfilePartialOptions,
} from 'lightweight-orderflow-charts';
import {
  ORDER_FLOW_THEME_PRESETS,
  buildSupportedMinticks,
  clusterOrderFlowBarsByMintick,
} from 'lightweight-orderflow-charts';

import { getConceptPreset } from '../content/learnCatalog';
import { loadInstrument, loadOrderFlowBars } from '../lib/marketData';
import {
  mergeDeltaSummaryStudyOptions,
  mergeFootprintStudyOptions,
  mergeVolumeProfileStudyOptions,
} from '../lib/mergeStudyOptions';

import { OrderFlowChart } from './OrderFlowChart';

const DEFAULT_SYMBOL = 'TSLA';
const DEFAULT_SESSION_DATE = '2026-03-10';
const DEFAULT_INTERVAL = '5m';
const THEME_PRESET = ORDER_FLOW_THEME_PRESETS.smoothLight;
const ORDER_FLOW_DELTA_PRESET = getConceptPreset('order-flow-delta');
const ABSORPTION_PRESET = getConceptPreset('absorption');
const THEME_PAGE_CHART_HEIGHT = 900;

type DraftLeafValue = string | number | boolean;

interface ThemeDraft {
  surface: OrderFlowSurfaceTheme;
  candleSeries: CandlestickSeriesPartialOptions;
  footprint: FootprintSeriesPartialOptions;
  volumeProfile: VolumeProfilePartialOptions;
  deltaSummary: DeltaSummarySeriesPartialOptions;
}

interface DraftLeafControl {
  path: string[];
  label: string;
  value: DraftLeafValue;
}

const SIDEBAR_SURFACE_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridColumn: '2 / 3',
  gridRow: '1 / 2',
  overflowY: 'auto',
  overflowX: 'hidden',
  height: THEME_PAGE_CHART_HEIGHT,
  maxHeight: THEME_PAGE_CHART_HEIGHT,
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
  gap: 10,
};

const SIDEBAR_LABEL_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  color: '#e2e8f0',
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
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
  width: 112,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

const ACTION_BUTTON_STYLE: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '9px 14px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: '#f8fafc',
  background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.94) 0%, rgba(29, 78, 216, 0.94) 100%)',
  border: '1px solid rgba(147, 197, 253, 0.4)',
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
  if (!rgbMatch) {
    return fallback;
  }

  const toHex = (raw: string) =>
    Math.max(0, Math.min(255, Math.round(Number(raw) || 0)))
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(rgbMatch[1] ?? '0')}${toHex(rgbMatch[2] ?? '0')}${toHex(rgbMatch[3] ?? '0')}`;
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={SIDEBAR_SECTION_STYLE}>
      <h3 style={SIDEBAR_SECTION_TITLE_STYLE}>{title}</h3>
      <div style={{ display: 'grid', gap: 10 }}>{children}</div>
    </section>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={SIDEBAR_FIELD_ROW_STYLE}>
      <span style={SIDEBAR_LABEL_STYLE}>{label}</span>
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
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
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

function humanizePathSegment(segment: string): string {
  if (/^\d+$/.test(segment)) {
    return `#${Number(segment) + 1}`;
  }

  return segment
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (value) => value.toUpperCase());
}

function isLeafValue(value: unknown): value is DraftLeafValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isColorLike(value: string): boolean {
  return /^#([\da-f]{3,8})$/i.test(value) || /^rgba?\(/i.test(value) || /^hsla?\(/i.test(value);
}

function collectDraftLeafControls(value: unknown, path: string[] = []): DraftLeafControl[] {
  if (isLeafValue(value)) {
    return [
      {
        path,
        label: path.map(humanizePathSegment).join(' / '),
        value,
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectDraftLeafControls(entry, [...path, String(index)]),
    );
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, entry]) =>
    collectDraftLeafControls(entry, [...path, key]),
  );
}

function setNestedDraftValue(draft: ThemeDraft, path: string[], value: DraftLeafValue): ThemeDraft {
  const nextDraft = structuredClone(draft);
  let target: unknown = nextDraft;

  for (const segment of path.slice(0, -1)) {
    if (Array.isArray(target)) {
      target = target[Number(segment)];
    } else {
      target = (target as Record<string, unknown>)[segment];
    }
  }

  const finalSegment = path[path.length - 1];
  if (!finalSegment) {
    return nextDraft;
  }

  if (Array.isArray(target)) {
    target[Number(finalSegment)] = value;
  } else {
    (target as Record<string, DraftLeafValue>)[finalSegment] = value;
  }

  return nextDraft;
}

function formatMintick(mintick: number): string {
  return mintick.toFixed(2);
}

function createThemeDraft(themePreset: OrderFlowThemePresetPack): ThemeDraft {
  return structuredClone({
    surface: themePreset.surface,
    candleSeries: themePreset.candleSeries ?? {},
    footprint: {
      style: themePreset.footprint?.style,
      shading: themePreset.footprint?.shading,
      pointOfControl: themePreset.footprint?.pointOfControl,
    },
    volumeProfile: {
      opacity: themePreset.volumeProfile?.opacity,
      pointOfControl: themePreset.volumeProfile?.pointOfControl,
      style: themePreset.volumeProfile?.style,
    },
    deltaSummary: {
      labelBackgroundColor: themePreset.deltaSummary?.labelBackgroundColor,
      labelTextColor: themePreset.deltaSummary?.labelTextColor,
      cellBorderColor: themePreset.deltaSummary?.cellBorderColor,
      rowStyles: themePreset.deltaSummary?.rowStyles,
    },
  }) as ThemeDraft;
}

interface ThemingDemoPageProps {
  showToolbar?: boolean;
}

export function ThemingDemoPage({ showToolbar = true }: ThemingDemoPageProps) {
  const instrument = useMemo(() => loadInstrument(DEFAULT_SYMBOL), []);
  const supportedMinticks = useMemo(
    () => buildSupportedMinticks(instrument.tickSize).filter((value) => value <= 1),
    [instrument.tickSize],
  );
  const [mintick, setMintick] = useState<number>(0.1);
  const [candlePosition, setCandlePosition] = useState<FootprintCandlePosition>(
    ORDER_FLOW_DELTA_PRESET.candlePosition,
  );
  const [themeDraft, setThemeDraft] = useState<ThemeDraft>(() => createThemeDraft(THEME_PRESET));
  const [orderFlowBarsBase, setOrderFlowBarsBase] = useState<OrderFlowBar[]>([]);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Lightweight Order Flow Charts | Theming';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDataStatus('loading');
    setDataError(null);

    Promise.all([loadOrderFlowBars(DEFAULT_SYMBOL, DEFAULT_SESSION_DATE, DEFAULT_INTERVAL)])
      .then(([orderFlowBars]) => {
        if (cancelled) {
          return;
        }

        setOrderFlowBarsBase(orderFlowBars);
        setDataStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setDataStatus('error');
        setDataError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const orderFlowBars = useMemo(
    () => clusterOrderFlowBarsByMintick(orderFlowBarsBase, mintick, instrument.tickSize),
    [instrument.tickSize, mintick, orderFlowBarsBase],
  );
  const footprintOptions = useMemo(
    () =>
      mergeFootprintStudyOptions(ORDER_FLOW_DELTA_PRESET.footprintOptions, {
        ...themeDraft.footprint,
        candle: {
          position: candlePosition,
        },
        ladder: {
          priceStep: mintick,
        },
      }),
    [candlePosition, mintick, themeDraft.footprint],
  );
  const deltaSummaryOptions = useMemo(
    () =>
      mergeDeltaSummaryStudyOptions(
        ORDER_FLOW_DELTA_PRESET.deltaSummaryOptions,
        themeDraft.deltaSummary,
      ),
    [themeDraft.deltaSummary],
  );
  const volumeProfileOptions = useMemo(
    () =>
      mergeVolumeProfileStudyOptions(
        ABSORPTION_PRESET.volumeProfileOptions,
        themeDraft.volumeProfile,
      ),
    [themeDraft.volumeProfile],
  );
  const themeSections = useMemo(
    () => [
      { key: 'surface', title: 'Surface', controls: collectDraftLeafControls(themeDraft.surface) },
      {
        key: 'candleSeries',
        title: 'Candles',
        controls: collectDraftLeafControls(themeDraft.candleSeries),
      },
      {
        key: 'footprint',
        title: 'Footprint',
        controls: collectDraftLeafControls(themeDraft.footprint),
      },
      {
        key: 'volumeProfile',
        title: 'Volume Profile',
        controls: collectDraftLeafControls(themeDraft.volumeProfile),
      },
      {
        key: 'deltaSummary',
        title: 'Delta Summary',
        controls: collectDraftLeafControls(themeDraft.deltaSummary),
      },
    ],
    [themeDraft],
  );

  const footerText = `${DEFAULT_SYMBOL} | ${DEFAULT_SESSION_DATE} | ${DEFAULT_INTERVAL} | Mintick: ${formatMintick(
    mintick,
  )} | Theme seed: ${THEME_PRESET.label}`;
  const chartHeight = showToolbar ? THEME_PAGE_CHART_HEIGHT : 520;
  const chartContent =
    dataStatus === 'ready' && orderFlowBars.length ? (
      <OrderFlowChart
        bars={orderFlowBars}
        chartHeight={chartHeight}
        footerText={showToolbar ? footerText : undefined}
        theme={themeDraft.surface}
        seriesMode="footprint"
        showVisibleProfile
        showSessionProfiles={false}
        showVwap={false}
        showReferenceCandles={false}
        showVolumePane={false}
        showDeltaSummary
        footprintOptions={footprintOptions}
        volumeProfileOptions={volumeProfileOptions}
        deltaSummaryOptions={deltaSummaryOptions}
        candleSeriesOptions={themeDraft.candleSeries}
        initialViewState={ORDER_FLOW_DELTA_PRESET.defaultViewState}
        dataSourceKey={`theming:${DEFAULT_SYMBOL}:${DEFAULT_SESSION_DATE}:${DEFAULT_INTERVAL}:${mintick}`}
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
          ? 'Loading canonical aggregated data for the theming surface.'
          : `Unable to load the theming surface data: ${dataError ?? 'Unknown error'}`}
      </section>
    );

  if (!showToolbar) {
    return <section style={{ minWidth: 0 }}>{chartContent}</section>;
  }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <section
        style={{
          padding: 18,
          borderRadius: 18,
          background: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          color: '#cbd5e1',
        }}
      >
        Tune the visible chart surface, footprint, volume profile, and delta-summary theme values on
        a fixed TSLA 5-minute composition.
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 360px)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>{chartContent}</div>

        <aside style={SIDEBAR_SURFACE_STYLE}>
          <SidebarSection title="Display">
            <FieldRow label="Candle position">
              <SelectControl
                value={candlePosition}
                onChange={(event) =>
                  setCandlePosition(event.target.value as FootprintCandlePosition)
                }
                style={{ width: 148 }}
              >
                <option value="left">Left</option>
                <option value="middle">Middle</option>
                <option value="right">Right</option>
              </SelectControl>
            </FieldRow>

            <FieldRow label="Mintick">
              <SelectControl
                value={mintick}
                onChange={(event) => setMintick(Number(event.target.value))}
                style={{ width: 148 }}
              >
                {supportedMinticks.map((value) => (
                  <option key={value} value={value}>
                    {formatMintick(value)}
                  </option>
                ))}
              </SelectControl>
            </FieldRow>
          </SidebarSection>

          {themeSections.map((section) => (
            <SidebarSection key={section.key} title={section.title}>
              {section.controls.map((control) => (
                <FieldRow key={`${section.key}:${control.path.join('.')}`} label={control.label}>
                  {typeof control.value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={control.value}
                      onChange={(event) =>
                        setThemeDraft((current) =>
                          setNestedDraftValue(current, control.path, event.target.checked),
                        )
                      }
                    />
                  ) : typeof control.value === 'number' ? (
                    <TextControl
                      type="number"
                      value={control.value}
                      step={Number.isInteger(control.value) ? 1 : 0.01}
                      onChange={(event) =>
                        setThemeDraft((current) =>
                          setNestedDraftValue(current, control.path, Number(event.target.value)),
                        )
                      }
                      style={{ width: 112 }}
                    />
                  ) : isColorLike(control.value) ? (
                    <ColorControl
                      value={control.value}
                      onChange={(nextValue) =>
                        setThemeDraft((current) =>
                          setNestedDraftValue(current, control.path, nextValue),
                        )
                      }
                    />
                  ) : (
                    <TextControl
                      type="text"
                      value={control.value}
                      onChange={(event) =>
                        setThemeDraft((current) =>
                          setNestedDraftValue(current, control.path, event.target.value),
                        )
                      }
                      style={{ width: 148 }}
                    />
                  )}
                </FieldRow>
              ))}
            </SidebarSection>
          ))}

          <SidebarSection title="Actions">
            <button
              type="button"
              onClick={() => {
                setThemeDraft(createThemeDraft(THEME_PRESET));
                setMintick(0.1);
                setCandlePosition(ORDER_FLOW_DELTA_PRESET.candlePosition);
              }}
              style={ACTION_BUTTON_STYLE}
            >
              Reset to Smooth Light
            </button>
          </SidebarSection>
        </aside>
      </div>
    </section>
  );
}
