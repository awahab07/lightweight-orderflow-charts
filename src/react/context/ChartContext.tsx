import { createContext, useContext, type ReactNode } from 'react';
import type { IChartApi } from 'lightweight-charts';

export const ChartContext = createContext<IChartApi | null>(null);

export interface ChartProviderProps {
  chart: IChartApi | null;
  children: ReactNode;
}

export function ChartProvider({ chart, children }: ChartProviderProps) {
  return <ChartContext.Provider value={chart}>{children}</ChartContext.Provider>;
}

export function useChartApi() {
  return useContext(ChartContext);
}
