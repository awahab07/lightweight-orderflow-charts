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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={selectStyle}
      >
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
  rightActions,
}: ConceptToolbarProps) {
  return (
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

      {rightActions ? <div style={{ marginLeft: 'auto' }}>{rightActions}</div> : null}
    </section>
  );
}
