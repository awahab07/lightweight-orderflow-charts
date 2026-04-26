import type { CSSProperties, ReactNode } from 'react';

const selectStyle: CSSProperties = {
  background: '#0f172a',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  padding: '6px 10px',
};

interface StringOption {
  value: string;
  label: string;
}

interface NumericOption {
  value: number;
  label: string;
}

export interface ConceptToolbarProps {
  presetId: string;
  presetOptions: StringOption[];
  onPresetChange: (value: string) => void;
  themeId: string;
  themeOptions: StringOption[];
  onThemeChange: (value: string) => void;
  sessionDate: string;
  dateOptions: StringOption[];
  onDateChange: (value: string) => void;
  symbol: string;
  symbolOptions: StringOption[];
  onSymbolChange: (value: string) => void;
  interval: string;
  intervalOptions: StringOption[];
  onIntervalChange: (value: string) => void;
  mintick: number;
  mintickOptions: NumericOption[];
  onMintickChange: (value: number) => void;
  statusContent?: ReactNode;
  rightActions?: ReactNode;
}

function ToolbarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: StringOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} style={selectStyle}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ConceptToolbar({
  presetId,
  presetOptions,
  onPresetChange,
  themeId,
  themeOptions,
  onThemeChange,
  sessionDate,
  dateOptions,
  onDateChange,
  symbol,
  symbolOptions,
  onSymbolChange,
  interval,
  intervalOptions,
  onIntervalChange,
  mintick,
  mintickOptions,
  onMintickChange,
  statusContent,
  rightActions,
}: ConceptToolbarProps) {
  return (
    <>
      <style>{`
        .concept-toolbar {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(160px, 320px) auto;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .concept-toolbar__controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          min-width: 0;
          align-items: center;
        }

        .concept-toolbar__status {
          min-width: 160px;
          display: flex;
          align-items: center;
          justify-content: stretch;
        }

        .concept-toolbar__actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        @media (max-width: 1180px) {
          .concept-toolbar {
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-areas:
              "controls actions"
              "status status";
          }

          .concept-toolbar__controls {
            grid-area: controls;
          }

          .concept-toolbar__status {
            grid-area: status;
          }

          .concept-toolbar__actions {
            grid-area: actions;
          }
        }
      `}</style>

      <section className="concept-toolbar">
        <div className="concept-toolbar__controls">
          <ToolbarSelect
            label="Preset"
            value={presetId}
            options={presetOptions}
            onChange={onPresetChange}
          />

          <ToolbarSelect
            label="Theme"
            value={themeId}
            options={themeOptions}
            onChange={onThemeChange}
          />

          <ToolbarSelect
            label="Date"
            value={sessionDate}
            options={dateOptions}
            onChange={onDateChange}
          />

          <ToolbarSelect
            label="Symbol"
            value={symbol}
            options={symbolOptions}
            onChange={onSymbolChange}
          />

          <ToolbarSelect
            label="Interval"
            value={interval}
            options={intervalOptions}
            onChange={onIntervalChange}
          />

          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Mintick
            <select
              value={String(mintick)}
              onChange={(event) => onMintickChange(Number(event.target.value))}
              style={selectStyle}
            >
              {mintickOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {statusContent ? <div className="concept-toolbar__status">{statusContent}</div> : null}
        {rightActions ? <div className="concept-toolbar__actions">{rightActions}</div> : null}
      </section>
    </>
  );
}
