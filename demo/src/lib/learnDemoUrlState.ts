import {
  isChartViewStateSnapshot,
  type ChartViewStateSnapshot,
} from 'lightweight-orderflow-charts';

function readHashSearchParams(hash: string): URLSearchParams {
  const normalized = hash.replace(/^#/, '');
  const [, search = ''] = normalized.split('?');
  return new URLSearchParams(search);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const binary = atob(`${normalized}${padding}`);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export interface ExploreDemoUrlState {
  presetId?: string;
  themeId?: string;
  symbol?: string;
  sessionDate?: string;
  interval?: string;
  mintick?: number;
  chartView?: ChartViewStateSnapshot | null;
}

export function readExploreDemoUrlState(hash: string): ExploreDemoUrlState {
  const params = readHashSearchParams(hash);
  const viewValue = params.get('view');
  let chartView: ChartViewStateSnapshot | null = null;

  if (viewValue) {
    const decoded = decodeBase64Url(viewValue);

    if (decoded) {
      try {
        const parsed = JSON.parse(decoded) as unknown;
        if (isChartViewStateSnapshot(parsed)) {
          chartView = parsed;
        }
      } catch {
        chartView = null;
      }
    }
  }

  return {
    presetId: params.get('preset') ?? undefined,
    themeId: params.get('theme') ?? undefined,
    symbol: params.get('symbol') ?? undefined,
    sessionDate: params.get('date') ?? undefined,
    interval: params.get('interval') ?? undefined,
    mintick: params.get('mintick') ? Number(params.get('mintick')) : undefined,
    chartView,
  };
}

export function writeExploreDemoUrlState(state: ExploreDemoUrlState): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = readHashSearchParams(window.location.hash);

  if (state.presetId) {
    params.set('preset', state.presetId);
  } else {
    params.delete('preset');
  }

  if (state.themeId) {
    params.set('theme', state.themeId);
  } else {
    params.delete('theme');
  }

  if (state.symbol) {
    params.set('symbol', state.symbol);
  } else {
    params.delete('symbol');
  }

  if (state.sessionDate) {
    params.set('date', state.sessionDate);
  } else {
    params.delete('date');
  }

  if (state.interval) {
    params.set('interval', state.interval);
  } else {
    params.delete('interval');
  }

  if (Number.isFinite(state.mintick) && state.mintick && state.mintick > 0) {
    params.set('mintick', String(state.mintick));
  } else {
    params.delete('mintick');
  }

  if (state.chartView) {
    params.set('view', encodeBase64Url(JSON.stringify(state.chartView)));
  } else {
    params.delete('view');
  }

  const nextHash = params.toString() ? `#/explore?${params.toString()}` : '#/explore';
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(null, '', nextUrl);
}
