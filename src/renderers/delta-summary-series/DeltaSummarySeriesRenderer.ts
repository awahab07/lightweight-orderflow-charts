import type {
  CustomBarItemData,
  ICustomSeriesPaneRenderer,
  PriceToCoordinateConverter,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { DeltaSummaryColumnKey, DeltaSummarySeriesOptions } from '../../models/options';
import type { DeltaSummaryColumnModel } from '../../models/studies';
import { clamp } from '../../utils/math';
import { resolveColorScale } from '../../utils/color';
import { resolveWidthRange } from '../../utils/width';

export interface RenderableDeltaSummaryColumn {
  item: CustomBarItemData<TimeValue, OrderFlowBar>;
  column: DeltaSummaryColumnModel;
}

export interface DeltaSummaryRendererState {
  columns: RenderableDeltaSummaryColumn[];
  barSpacing: number;
  options: DeltaSummarySeriesOptions;
}

function resolveSummaryBarWidth(barSpacing: number, options: DeltaSummarySeriesOptions): number {
  const widthRange = resolveWidthRange(barSpacing, options.columnWidth);

  return clamp(Math.floor(barSpacing), Math.floor(widthRange.min), Math.floor(widthRange.max));
}

function formatMetricValue(metric: DeltaSummaryColumnKey, value: number): string {
  if (metric === 'cumulativeDeltaToVolumeRatio') {
    return `${value.toFixed(2)}%`;
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function metricLabel(metric: DeltaSummaryColumnKey, options: DeltaSummarySeriesOptions): string {
  return options.rowLabels[metric] ?? metric;
}

function metricValue(column: DeltaSummaryColumnModel, metric: DeltaSummaryColumnKey): number {
  return column[metric];
}

function metricDirection(
  metric: DeltaSummaryColumnKey,
  value: number,
): 'positive' | 'negative' | 'neutral' {
  if (metric === 'volume') {
    return 'positive';
  }

  if (value > 0) {
    return 'positive';
  }

  if (value < 0) {
    return 'negative';
  }

  return 'neutral';
}

function resolveMetricFillColor(
  ratio: number,
  direction: 'positive' | 'negative' | 'neutral',
  rowStyle: DeltaSummarySeriesOptions['rowStyles'][DeltaSummaryColumnKey],
): string {
  if (direction === 'positive') {
    return resolveColorScale(rowStyle.positiveFillScale, ratio);
  }

  if (direction === 'negative') {
    return resolveColorScale(rowStyle.negativeFillScale, ratio);
  }

  return resolveColorScale(rowStyle.neutralFillScale, ratio);
}

export class DeltaSummarySeriesRenderer implements ICustomSeriesPaneRenderer {
  public state: DeltaSummaryRendererState = {
    columns: [],
    barSpacing: 0,
    options: {} as DeltaSummarySeriesOptions,
  };

  draw(target: CanvasRenderingTarget2D, _priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace(({ context, bitmapSize }) => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
      context.restore();
    });

    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      context.save();
      context.beginPath();
      context.rect(0, 0, mediaSize.width, mediaSize.height);
      context.clip();

      const rows = this.state.options.rows;

      if (!rows.length) {
        context.restore();
        return;
      }

      const barWidth = resolveSummaryBarWidth(this.state.barSpacing, this.state.options);
      const rowHeight = Math.min(this.state.options.rowHeight, mediaSize.height / rows.length);
      const labelWidth = this.state.options.showLabels ? this.state.options.labelWidth : 0;

      context.font = `${this.state.options.fontSize}px ${this.state.options.fontFamily}`;

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const metric = rows[rowIndex];
        const top = rowIndex * rowHeight;
        const rowStyle = this.state.options.rowStyles[metric];
        const maxAbsValue = this.state.columns.reduce((maximum, entry) => {
          const value = metricValue(entry.column, metric);
          return Math.max(maximum, Math.abs(value));
        }, 0);

        context.save();
        if (this.state.options.showLabels) {
          const dataWidth = Math.max(mediaSize.width - labelWidth, 0);
          context.beginPath();
          context.rect(labelWidth, top, dataWidth, rowHeight);
          context.clip();
        }

        for (const entry of this.state.columns) {
          const value = metricValue(entry.column, metric);
          const left = entry.item.x - barWidth / 2;
          const direction = metricDirection(metric, value);
          const ratio = maxAbsValue > 0 ? Math.abs(value) / maxAbsValue : 0;
          const fillColor = resolveMetricFillColor(ratio, direction, rowStyle);

          context.fillStyle = fillColor;
          context.fillRect(left, top, barWidth, rowHeight);

          if (this.state.options.cellBorderWidth > 0) {
            context.strokeStyle = this.state.options.cellBorderColor;
            context.lineWidth = this.state.options.cellBorderWidth;
            context.strokeRect(left, top, barWidth, rowHeight);
          }

          context.save();
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = rowStyle.textColor;
          context.fillText(formatMetricValue(metric, value), entry.item.x, top + rowHeight / 2);
          context.restore();
        }

        context.restore();

        if (this.state.options.showLabels) {
          context.fillStyle = this.state.options.labelBackgroundColor;
          context.fillRect(0, top, labelWidth, rowHeight);

          if (this.state.options.cellBorderWidth > 0) {
            context.strokeStyle = this.state.options.cellBorderColor;
            context.lineWidth = this.state.options.cellBorderWidth;
            context.strokeRect(0, top, labelWidth, rowHeight);
          }

          context.save();
          context.textAlign = 'left';
          context.textBaseline = 'middle';
          context.fillStyle = this.state.options.labelTextColor;
          context.fillText(metricLabel(metric, this.state.options), 8, top + rowHeight / 2);
          context.restore();
        }
      }

      context.restore();
    });
  }
}
