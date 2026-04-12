import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import {
  DEFAULT_FOOTPRINT_STYLE,
  aggregateOrderFlowBarsByInterval,
  buildSupportedMinticks,
  buildVolumeDeltaPivotSeriesData,
  clusterOrderFlowBarsByMintick,
  formatCompactNumericValue,
  inferPricePrecision,
  normalizeMintick,
  resolveMetricStyleToken,
  type ChartViewStateSnapshot,
  type OrderFlowBar,
  type SeriesMetricPrimitiveDatum,
  type TimeValue,
  type VolumeDeltaPivotPoint,
} from 'lightweight-orderflow-charts';

import type {
  ConnectorBridgeEvent,
  ConnectorBridgeState,
  ConnectorConfigValue,
  MarketDataConnectorDescriptor,
} from '../../../connectors/core/contracts';
import {
  connectConnector,
  disconnectConnector,
  getConnectorBridgeBaseUrl,
  loadConnectorBridgeState,
  startConnectorGrab,
  subscribeToConnectorBridgeEvents,
  testConnectorConnection,
} from '../connect/connectorBridgeClient';
import {
  CONCEPT_PRESETS,
  getConceptPreset,
  getThemePreset,
  THEME_PRESETS,
} from '../content/learnCatalog';
import {
  AVAILABLE_INTERVALS,
  AVAILABLE_SYMBOLS,
  availableDatesForSymbol,
  intervalToSeconds,
  loadInstrument,
  loadOrderFlowBars,
  preferredTickDateForSymbol,
  type BarInterval,
  type SymbolCode,
} from '../lib/marketData';
import { readLearnDemoUrlState } from '../lib/learnDemoUrlState';
import {
  mergeDeltaSummaryStudyOptions,
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

function fingerprintConfig(
  vendorId: string,
  config: Record<string, ConnectorConfigValue>,
): string {
  const sortedEntries = Object.entries(config).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify([vendorId, sortedEntries]);
}

function buttonBaseStyle(enabled: boolean): CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'inline-grid',
    placeItems: 'center',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: enabled ? 'rgba(15, 23, 42, 0.9)' : 'rgba(51, 65, 85, 0.45)',
    color: enabled ? '#e2e8f0' : '#64748b',
    cursor: enabled ? 'pointer' : 'not-allowed',
  };
}

function renderPlugIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7V3" />
      <path d="M16 7V3" />
      <path d="M7 10h10v2a5 5 0 0 1-5 5v4" />
      <path d="M12 21v-4" />
    </svg>
  );
}

function renderStreamIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 0 1 8-8" />
      <path d="M4 12a8 8 0 0 0 8 8" />
      <path d="M12 4a8 8 0 0 1 8 8" />
      <path d="M12 20a8 8 0 0 0 8-8" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function renderSaveIcon(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 4v6h6V4" />
      <path d="M9 18h6" />
    </svg>
  );
}

function resolveConnectButtonVisual(state: ConnectorBridgeState | null): {
  color: string;
  borderColor: string;
  background: string;
  pulse: boolean;
  title: string;
} {
  const status = state?.connection.status ?? 'disconnected';

  switch (status) {
    case 'testing':
      return {
        color: '#facc15',
        borderColor: 'rgba(250, 204, 21, 0.28)',
        background: 'rgba(202, 138, 4, 0.16)',
        pulse: true,
        title: 'Testing connector',
      };
    case 'connecting':
      return {
        color: '#60a5fa',
        borderColor: 'rgba(96, 165, 250, 0.28)',
        background: 'rgba(37, 99, 235, 0.16)',
        pulse: true,
        title: 'Connecting to vendor',
      };
    case 'connected':
    case 'test-passed':
      return {
        color: '#4ade80',
        borderColor: 'rgba(74, 222, 128, 0.28)',
        background: 'rgba(22, 163, 74, 0.16)',
        pulse: false,
        title: state?.connection.message || 'Connected',
      };
    case 'streaming':
      return {
        color: '#22d3ee',
        borderColor: 'rgba(34, 211, 238, 0.28)',
        background: 'rgba(8, 145, 178, 0.16)',
        pulse: true,
        title: 'Connected and actively retrieving vendor data',
      };
    case 'test-failed':
    case 'error':
      return {
        color: '#f87171',
        borderColor: 'rgba(248, 113, 113, 0.28)',
        background: 'rgba(220, 38, 38, 0.16)',
        pulse: false,
        title: state?.connection.message || 'Connector error',
      };
    default:
      return {
        color: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.24)',
        background: 'rgba(51, 65, 85, 0.22)',
        pulse: false,
        title: 'Disconnected',
      };
  }
}

function ConnectDialog({
  bridgeState,
  bridgeError,
  isOpen,
  selectedVendor,
  selectedVendorId,
  connectorConfig,
  onClose,
  onVendorChange,
  onConfigChange,
  onTest,
  onConnect,
  testEnabled,
  connectEnabled,
  isTesting,
  isConnecting,
  resultMessage,
}: {
  bridgeState: ConnectorBridgeState | null;
  bridgeError: string | null;
  isOpen: boolean;
  selectedVendor: MarketDataConnectorDescriptor | null;
  selectedVendorId: string;
  connectorConfig: Record<string, ConnectorConfigValue>;
  onClose: () => void;
  onVendorChange: (vendorId: string) => void;
  onConfigChange: (fieldId: string, value: ConnectorConfigValue) => void;
  onTest: () => void;
  onConnect: () => void;
  testEnabled: boolean;
  connectEnabled: boolean;
  isTesting: boolean;
  isConnecting: boolean;
  resultMessage: string | null;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.72)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        zIndex: 30,
      }}
    >
      <section
        style={{
          width: 'min(640px, 100%)',
          borderRadius: 18,
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 24 }}>Connect feed</h3>
            <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
              Configure and test a vendor connection before enabling direct retrieval.
            </p>
          </div>
          <button
            onClick={onClose}
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

        {!bridgeState ? (
          <div
            style={{
              borderRadius: 12,
              padding: 14,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              color: '#cbd5e1',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 600, color: '#f8fafc' }}>Bridge unavailable</div>
            <div style={{ marginTop: 6 }}>
              {bridgeError || 'Start the local connector bridge to test and connect a vendor feed.'}
            </div>
            <div style={{ marginTop: 6, color: '#93c5fd' }}>
              Expected bridge URL: {getConnectorBridgeBaseUrl()}
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: 'grid', gap: 8 }}>
              Feed / platform
              <select
                value={selectedVendorId}
                onChange={(event) => onVendorChange(event.target.value)}
                style={{
                  background: '#020617',
                  color: '#e2e8f0',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                {bridgeState.vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedVendor ? (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {selectedVendor.configFields.map((field) => (
                  <label key={field.id} style={{ display: 'grid', gap: 8 }}>
                    <span>{field.label}</span>
                    <input
                      value={String(connectorConfig[field.id] ?? field.defaultValue ?? '')}
                      onChange={(event) =>
                        onConfigChange(
                          field.id,
                          field.kind === 'number' ? Number(event.target.value) : event.target.value,
                        )
                      }
                      type={field.kind === 'number' ? 'number' : 'text'}
                      min={field.min}
                      step={field.step}
                      placeholder={field.placeholder}
                      style={{
                        background: '#020617',
                        color: '#e2e8f0',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: 8,
                        padding: '10px 12px',
                      }}
                    />
                    {field.description ? (
                      <span style={{ color: '#64748b', fontSize: 13 }}>{field.description}</span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}

            {resultMessage ? (
              <div
                style={{
                  borderRadius: 10,
                  padding: 12,
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  color: '#cbd5e1',
                }}
              >
                {resultMessage}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={onTest}
                disabled={!testEnabled || isTesting}
                style={{
                  background: testEnabled ? 'rgba(59, 130, 246, 0.18)' : 'rgba(51, 65, 85, 0.4)',
                  color: testEnabled ? '#dbeafe' : '#64748b',
                  border: '1px solid rgba(96, 165, 250, 0.24)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: testEnabled ? 'pointer' : 'not-allowed',
                }}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={onConnect}
                disabled={!connectEnabled || isConnecting}
                style={{
                  background: connectEnabled ? 'rgba(34, 197, 94, 0.18)' : 'rgba(51, 65, 85, 0.4)',
                  color: connectEnabled ? '#bbf7d0' : '#64748b',
                  border: '1px solid rgba(34, 197, 94, 0.24)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: connectEnabled ? 'pointer' : 'not-allowed',
                }}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function ConnectPage() {
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
    initialUrlState?.interval && AVAILABLE_INTERVALS.includes(initialUrlState.interval as BarInterval)
      ? (initialUrlState.interval as BarInterval)
      : initialPreset.defaultInterval,
  );
  const [sessionDate, setSessionDate] = useState(
    () =>
      initialUrlState?.sessionDate ??
      preferredTickDateForSymbol(initialPreset.defaultSymbol) ??
      initialPreset.defaultDate,
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
  const [bridgeState, setBridgeState] = useState<ConnectorBridgeState | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('ibkr-tws');
  const [connectorConfig, setConnectorConfig] = useState<Record<string, ConnectorConfigValue>>({});
  const [connectorResultMessage, setConnectorResultMessage] = useState<string | null>(null);
  const [testedConfigFingerprint, setTestedConfigFingerprint] = useState<string | null>(null);
  const [testingConnector, setTestingConnector] = useState(false);
  const [connectingConnector, setConnectingConnector] = useState(false);
  const [liveBars, setLiveBars] = useState<OrderFlowBar[] | null>(null);

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
  const staticSourceBars = useMemo(
    () => loadOrderFlowBars(symbol, sessionDate, interval),
    [interval, sessionDate, symbol],
  );
  const intervalSeconds = useMemo(() => intervalToSeconds(interval), [interval]);
  const liveBarsForInterval = useMemo(
    () =>
      !liveBars
        ? null
        : interval === '1m'
          ? liveBars
          : aggregateOrderFlowBarsByInterval(liveBars, intervalSeconds),
    [interval, intervalSeconds, liveBars],
  );

  const activeGrabMatchesSelection =
    bridgeState?.activeGrab?.symbol === symbol && bridgeState?.activeGrab?.sessionDate === sessionDate;
  const directModeActive =
    activeGrabMatchesSelection &&
    ['loading-cache', 'loading-vendor', 'paused', 'completed'].includes(
      bridgeState?.activeGrab?.status ?? '',
    ) &&
    Boolean(liveBarsForInterval);
  const activeSourceBars = directModeActive ? liveBarsForInterval ?? [] : staticSourceBars;
  const clusteredBars = useMemo(
    () => clusterOrderFlowBarsByMintick(activeSourceBars, effectiveMintick, instrument.tickSize),
    [activeSourceBars, effectiveMintick, instrument.tickSize],
  );
  const deltaSourceBars = useMemo(
    () =>
      clusteredBars.map((bar) => ({
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
    [clusteredBars],
  );
  const lowerDeltaSourceBars = deltaSourceBars;
  const volumeDeltaPivotData = useMemo<VolumeDeltaPivotPoint[]>(() => {
    if (!preset.showVolumeDeltaPivot) {
      return [];
    }

    return buildVolumeDeltaPivotSeriesData(deltaSourceBars, lowerDeltaSourceBars, {
      intervalSeconds,
    });
  }, [deltaSourceBars, intervalSeconds, lowerDeltaSourceBars, preset.showVolumeDeltaPivot]);
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

    return clusteredBars.map((bar, index) => {
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
  }, [clusteredBars, instrumentAwareFootprintOptions?.style, preset.showVolumeDeltaPivot, volumeDeltaPivotData]);
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

  const footerText = useMemo(() => {
    const sourceLabel = directModeActive
      ? `cache-first ${bridgeState?.connection.vendorLabel ?? 'vendor'} load`
      : 'canonical aggregated data';
    return `${symbol} | ${sessionDate} | ${interval} | Mintick: ${formatMintick(
      effectiveMintick,
    )} | Theme: ${themePreset.label} | Source: ${sourceLabel}`;
  }, [
    bridgeState?.connection.vendorLabel,
    directModeActive,
    effectiveMintick,
    interval,
    sessionDate,
    symbol,
    themePreset.label,
  ]);

  const selectedVendor = useMemo(
    () => bridgeState?.vendors.find((vendor) => vendor.id === selectedVendorId) ?? null,
    [bridgeState?.vendors, selectedVendorId],
  );

  const connectVisual = resolveConnectButtonVisual(bridgeState);

  const canTestConnection = Boolean(
    selectedVendor &&
      selectedVendor.configFields.every((field) => {
        if (!field.required) {
          return true;
        }

        const value = connectorConfig[field.id];
        if (field.kind === 'number') {
          return Number.isFinite(Number(value)) && Number(value) > 0;
        }

        return String(value ?? '').trim().length > 0;
      }),
  );
  const currentConfigFingerprint = selectedVendor
    ? fingerprintConfig(selectedVendor.id, connectorConfig)
    : null;
  const canConnect = Boolean(
    selectedVendor &&
      bridgeState &&
      testedConfigFingerprint &&
      currentConfigFingerprint === testedConfigFingerprint,
  );

  useEffect(() => {
    document.title = `Lightweight Order Flow Charts | Connect`;
  }, []);

  useEffect(() => {
    if (availableDates.length && !availableDates.includes(sessionDate)) {
      const nextViewState = prepareDataSourceViewState(viewState ?? restoredViewState);
      setSessionDate(availableDates[availableDates.length - 1]);
      setRestoredViewState(nextViewState);
      setViewState(nextViewState);
    }
  }, [availableDates, restoredViewState, sessionDate, viewState]);

  useEffect(() => {
    let disposed = false;

    loadConnectorBridgeState()
      .then((state) => {
        if (disposed) {
          return;
        }

        setBridgeState(state);
        setBridgeError(null);
        if (state.vendors.length && !state.vendors.some((vendor) => vendor.id === selectedVendorId)) {
          setSelectedVendorId(state.vendors[0].id);
        }
      })
      .catch((error) => {
        if (disposed) {
          return;
        }

        setBridgeError(error instanceof Error ? error.message : String(error));
      });

    const unsubscribe = subscribeToConnectorBridgeEvents(
      (event: ConnectorBridgeEvent) => {
        if (disposed) {
          return;
        }

        if (event.type === 'state') {
          setBridgeState(event.payload);
          return;
        }

        if (event.type === 'session-data') {
          const payload = event.payload;
          if (payload.progress.symbol !== symbol || payload.progress.sessionDate !== sessionDate) {
            return;
          }

          setLiveBars(payload.orderFlowBars.length ? payload.orderFlowBars : null);
          if (payload.progress.message) {
            setConnectorResultMessage(payload.progress.message);
          }
          return;
        }

        if (event.type === 'order-flow-patch') {
          return;
        }
      },
      () => {
        if (!disposed) {
          setBridgeError(`Connector bridge is unavailable at ${getConnectorBridgeBaseUrl()}.`);
        }
      },
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [selectedVendorId, sessionDate, symbol]);

  useEffect(() => {
    if (!selectedVendor) {
      return;
    }

    setConnectorConfig((current) => {
      const next = { ...current };
      for (const field of selectedVendor.configFields) {
        if (next[field.id] == null && field.defaultValue != null) {
          next[field.id] = field.defaultValue;
        }
      }
      return next;
    });
  }, [selectedVendor]);

  useEffect(() => {
    setLiveBars(null);
  }, [sessionDate, symbol]);

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

  const handleTestConnection = async () => {
    if (!selectedVendor) {
      return;
    }

    try {
      setTestingConnector(true);
      setConnectorResultMessage(null);
      const result = await testConnectorConnection(selectedVendor.id, connectorConfig);
      setConnectorResultMessage(result.message);
      if (result.ok && currentConfigFingerprint) {
        setTestedConfigFingerprint(currentConfigFingerprint);
      }
    } catch (error) {
      setConnectorResultMessage(error instanceof Error ? error.message : String(error));
      setTestedConfigFingerprint(null);
    } finally {
      setTestingConnector(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedVendor) {
      return;
    }

    try {
      setConnectingConnector(true);
      setConnectorResultMessage(null);
      const result = await connectConnector(selectedVendor.id, connectorConfig);
      setConnectorResultMessage(result.message);
      setConnectionDialogOpen(false);
    } catch (error) {
      setConnectorResultMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setConnectingConnector(false);
    }
  };

  const handleLoad = async () => {
    if (!bridgeState) {
      setConnectorResultMessage(
        `Connector bridge is unavailable. Start it at ${getConnectorBridgeBaseUrl()}.`,
      );
      return;
    }

    try {
      await startConnectorGrab({
        symbol,
        sessionDate,
        intervalSeconds: 60,
        includeTicks: true,
        includeQuotes: true,
      });
    } catch (error) {
      setConnectorResultMessage(error instanceof Error ? error.message : String(error));
    }
  };
  const loadEnabled = Boolean(
    bridgeState &&
      !connectingConnector &&
      !['loading-cache', 'loading-vendor'].includes(bridgeState.activeGrab?.status ?? ''),
  );
  const loadInProgress = ['loading-cache', 'loading-vendor'].includes(
    bridgeState?.activeGrab?.status ?? '',
  );

  return (
    <>
      <style>{`
        @keyframes connectPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.94); opacity: 0.72; }
        }
      `}</style>

      <header style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Connect</h2>
        <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>
          Connect a direct vendor feed, load aggregated minute data through the local cache, and
          render the selected interval from that `1m` source.
        </p>
        <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
          <a href="#/" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
            Open learn mode
          </a>
          <a href="#/playground" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
            Open playground
          </a>
        </div>
      </header>

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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleLoad}
              disabled={!loadEnabled}
              title={
                loadInProgress
                  ? 'Loading from cache or vendor'
                  : 'Load cached data or refresh it from the vendor'
              }
              style={{
                ...buttonBaseStyle(loadEnabled),
                color: loadInProgress ? '#22d3ee' : buttonBaseStyle(loadEnabled).color,
                borderColor: loadInProgress
                  ? 'rgba(34, 211, 238, 0.28)'
                  : 'rgba(148, 163, 184, 0.22)',
                background: loadInProgress
                  ? 'rgba(8, 145, 178, 0.16)'
                  : buttonBaseStyle(loadEnabled).background,
                animation: loadInProgress ? 'connectPulse 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {renderStreamIcon()}
            </button>

            <button
              onClick={() => setConnectionDialogOpen(true)}
              title={connectVisual.title}
              style={{
                ...buttonBaseStyle(true),
                color: connectVisual.color,
                borderColor: connectVisual.borderColor,
                background: connectVisual.background,
                animation: connectVisual.pulse ? 'connectPulse 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {renderPlugIcon()}
            </button>
          </div>
        }
      />

      {connectorResultMessage || bridgeError ? (
        <section
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(148, 163, 184, 0.14)',
            color: '#cbd5e1',
          }}
        >
          {connectorResultMessage || bridgeError}
        </section>
      ) : null}

      {clusteredBars.length ? (
        <OrderFlowChart
          bars={clusteredBars}
          chartHeight={900}
          footerText={footerText}
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
          dataSourceKey={`${symbol}:${sessionDate}:${interval}:${effectiveMintick}:${directModeActive ? 'connect-live' : 'connect-static'}`}
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
          {directModeActive
            ? 'Waiting for cached or vendor-loaded minute data to materialize the selected chart.'
            : 'No stored market data is available for this selection yet.'}
        </section>
      )}

      <ConnectDialog
        bridgeState={bridgeState}
        bridgeError={bridgeError}
        isOpen={connectionDialogOpen}
        selectedVendor={selectedVendor}
        selectedVendorId={selectedVendorId}
        connectorConfig={connectorConfig}
        onClose={() => setConnectionDialogOpen(false)}
        onVendorChange={(vendorId) => {
          setSelectedVendorId(vendorId);
          setTestedConfigFingerprint(null);
          setConnectorResultMessage(null);
        }}
        onConfigChange={(fieldId, value) => {
          setConnectorConfig((current) => ({
            ...current,
            [fieldId]: value,
          }));
          setTestedConfigFingerprint(null);
        }}
        onTest={handleTestConnection}
        onConnect={handleConnect}
        testEnabled={canTestConnection}
        connectEnabled={canConnect}
        isTesting={testingConnector}
        isConnecting={connectingConnector}
        resultMessage={connectorResultMessage}
      />
    </>
  );
}
