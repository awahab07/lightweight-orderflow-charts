import type {
  CustomSeriesWhitespaceData,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
} from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type {
  DeltaSummarySeriesOptions,
  DeltaSummarySeriesPartialOptions,
} from '../../models/options';
import { mergeDeltaSummarySeriesOptions } from '../../models/options';
import { buildDeltaSummaryColumns } from '../../calculations/footprint/buildDeltaSummaryColumns';
import { DeltaSummarySeriesRenderer } from './DeltaSummarySeriesRenderer';

function isItemVisible(
  logicalIndex: number,
  visibleRange: { from: number; to: number } | null,
  conflationFactor: number,
): boolean {
  if (!visibleRange) {
    return true;
  }

  const logicalBuffer = Math.max(0, conflationFactor / 2 - 0.5);

  return (
    logicalIndex >= visibleRange.from - logicalBuffer &&
    logicalIndex <= visibleRange.to + logicalBuffer
  );
}

class DeltaSummarySeriesView implements ICustomSeriesPaneView<
  TimeValue,
  OrderFlowBar,
  DeltaSummarySeriesOptions
> {
  private readonly rendererInstance = new DeltaSummarySeriesRenderer();
  private readonly initialOptions: DeltaSummarySeriesOptions;
  private rowCount: number;

  constructor(options?: DeltaSummarySeriesPartialOptions) {
    this.initialOptions = mergeDeltaSummarySeriesOptions(options);
    this.rowCount = this.initialOptions.rows.length || 1;
    this.rendererInstance.state.options = this.initialOptions;
  }

  renderer() {
    return this.rendererInstance;
  }

  update(
    data: PaneRendererCustomData<TimeValue, OrderFlowBar>,
    seriesOptions: DeltaSummarySeriesOptions,
  ): void {
    const resolvedOptions = mergeDeltaSummarySeriesOptions(seriesOptions);
    const columns = buildDeltaSummaryColumns(data.bars.map((item) => item.originalData));
    this.rowCount = resolvedOptions.rows.length || 1;
    const visibleColumns = data.bars
      .map((item, index) => ({
        item,
        column: columns[index],
      }))
      .filter((entry) => isItemVisible(entry.item.time, data.visibleRange, data.conflationFactor));

    this.rendererInstance.state = {
      columns: visibleColumns,
      barSpacing: data.barSpacing * data.conflationFactor,
      options: resolvedOptions,
    };
  }

  priceValueBuilder(): number[] {
    return [this.rowCount, 0, 0];
  }

  isWhitespace(
    data: OrderFlowBar | CustomSeriesWhitespaceData<TimeValue>,
  ): data is CustomSeriesWhitespaceData<TimeValue> {
    return !('levels' in data);
  }

  defaultOptions(): DeltaSummarySeriesOptions {
    return this.initialOptions;
  }
}

export function createDeltaSummarySeries(
  options?: DeltaSummarySeriesPartialOptions,
): ICustomSeriesPaneView<TimeValue, OrderFlowBar, DeltaSummarySeriesOptions> {
  return new DeltaSummarySeriesView(options);
}
