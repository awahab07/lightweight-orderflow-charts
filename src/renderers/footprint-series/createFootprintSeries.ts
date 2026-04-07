import type {
  CustomSeriesWhitespaceData,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
} from 'lightweight-charts';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { FootprintSeriesOptions, FootprintSeriesPartialOptions } from '../../models/options';
import { mergeFootprintSeriesOptions } from '../../models/options';
import { buildFootprintBarModel } from '../../calculations/footprint/buildFootprintBarModel';
import { FootprintSeriesRenderer } from './FootprintSeriesRenderer';

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

class FootprintSeriesView implements ICustomSeriesPaneView<
  TimeValue,
  OrderFlowBar,
  FootprintSeriesOptions
> {
  private readonly rendererInstance = new FootprintSeriesRenderer();
  private readonly initialOptions: FootprintSeriesOptions;

  constructor(options?: FootprintSeriesPartialOptions) {
    this.initialOptions = mergeFootprintSeriesOptions(options);
    this.rendererInstance.state.options = this.initialOptions;
  }

  renderer() {
    return this.rendererInstance;
  }

  update(
    data: PaneRendererCustomData<TimeValue, OrderFlowBar>,
    seriesOptions: FootprintSeriesOptions,
  ): void {
    const visibleBars = data.bars.filter((item) =>
      isItemVisible(item.time, data.visibleRange, data.conflationFactor),
    );

    this.rendererInstance.state = {
      bars: visibleBars.map((item) => ({
        item,
        model: buildFootprintBarModel(item.originalData, seriesOptions),
      })),
      barSpacing: data.barSpacing * data.conflationFactor,
      options: mergeFootprintSeriesOptions(seriesOptions),
    };
  }

  priceValueBuilder(plotRow: OrderFlowBar): number[] {
    return [plotRow.high, plotRow.low, plotRow.close];
  }

  isWhitespace(
    data: OrderFlowBar | CustomSeriesWhitespaceData<TimeValue>,
  ): data is CustomSeriesWhitespaceData<TimeValue> {
    return !('levels' in data);
  }

  defaultOptions(): FootprintSeriesOptions {
    return this.initialOptions;
  }
}

export function createFootprintSeries(
  options?: FootprintSeriesPartialOptions,
): ICustomSeriesPaneView<TimeValue, OrderFlowBar, FootprintSeriesOptions> {
  return new FootprintSeriesView(options);
}
