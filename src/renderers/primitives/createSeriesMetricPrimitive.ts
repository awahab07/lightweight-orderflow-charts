import type {
  Coordinate,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  SeriesAttachedParameter,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

import type { TimeValue } from '../../models/contracts';
import type { MetricStyleToken } from '../../models/options';
import { parseMetricBorderShorthand } from '../../utils/metricStylePalette';
import { fillCenteredText } from '../shared/canvas';

export interface SeriesMetricPrimitiveItem {
  id: string;
  text: string;
  placement?: 'above' | 'below';
  offset?: number;
  orientation?: 'horizontal' | 'vertical';
  style: MetricStyleToken;
}

export interface SeriesMetricPrimitiveDatum {
  time: TimeValue;
  anchorPrice: number;
  items: SeriesMetricPrimitiveItem[];
}

interface SeriesMetricPrimitiveConfig {
  data: SeriesMetricPrimitiveDatum[];
}

class SeriesMetricRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly getState: () => { data: SeriesMetricPrimitiveDatum[] },
    private readonly getAttached: () =>
      | SeriesAttachedParameter<TimeValue, 'Candlestick'>
      | undefined,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const attached = this.getAttached();
    const state = this.getState();

    if (!attached || !state.data.length) {
      return;
    }

    target.useMediaCoordinateSpace(({ context }) => {
      context.save();

      for (const point of state.data) {
        const x = attached.chart.timeScale().timeToCoordinate(point.time);
        const y = attached.series.priceToCoordinate(point.anchorPrice);

        if (x === null || y === null) {
          continue;
        }

        const aboveItems = point.items.filter((item) => item.placement === 'above');
        const belowItems = point.items.filter((item) => item.placement !== 'above');

        let aboveCursor = y as Coordinate;

        for (let index = 0; index < aboveItems.length; index += 1) {
          const item = aboveItems[index];
          const badge = measureMetricBadge(context, item);
          aboveCursor = (aboveCursor - ((item.offset ?? 4) + badge.height)) as Coordinate;
          drawMetricBadge(context, x, aboveCursor, badge, item);
        }

        let belowCursor = y as Coordinate;

        for (let index = 0; index < belowItems.length; index += 1) {
          const item = belowItems[index];
          const badge = measureMetricBadge(context, item);
          belowCursor = (belowCursor + (item.offset ?? 4)) as Coordinate;
          drawMetricBadge(context, x, belowCursor, badge, item);
          belowCursor = (belowCursor + badge.height) as Coordinate;
        }
      }

      context.restore();
    });
  }
}

interface MetricBadgeMeasurement {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

function measureMetricBadge(
  context: CanvasRenderingContext2D,
  item: SeriesMetricPrimitiveItem,
): MetricBadgeMeasurement {
  context.font = item.style.font;
  const textWidth = context.measureText(item.text).width;
  const paddingX = item.style.paddingX ?? 0;
  const paddingY = item.style.paddingY ?? 0;
  const textHeight = Math.ceil(
    Math.max(
      12,
      context.measureText('M').actualBoundingBoxAscent +
        context.measureText('M').actualBoundingBoxDescent,
    ),
  );
  const innerWidth = Math.ceil(textWidth + paddingX * 2);
  const innerHeight = Math.ceil(textHeight + paddingY * 2);

  if (item.orientation === 'vertical') {
    return {
      width: innerHeight,
      height: innerWidth,
      innerWidth,
      innerHeight,
    };
  }

  return {
    width: innerWidth,
    height: innerHeight,
    innerWidth,
    innerHeight,
  };
}

function drawMetricBadge(
  context: CanvasRenderingContext2D,
  centerX: number,
  top: number,
  badge: MetricBadgeMeasurement,
  item: SeriesMetricPrimitiveItem,
): void {
  const left = centerX - badge.width / 2;
  const border = parseMetricBorderShorthand(item.style.border);

  if (item.orientation === 'vertical') {
    const centerY = top + badge.height / 2;

    context.save();
    context.translate(centerX, centerY);
    context.rotate(-Math.PI / 2);

    if (item.style.backgroundColor && item.style.backgroundColor !== 'transparent') {
      context.fillStyle = item.style.backgroundColor;
      context.fillRect(
        -badge.innerWidth / 2,
        -badge.innerHeight / 2,
        badge.innerWidth,
        badge.innerHeight,
      );
    }

    if (border.width > 0 && border.color) {
      context.strokeStyle = border.color;
      context.lineWidth = border.width;
      context.strokeRect(
        -badge.innerWidth / 2,
        -badge.innerHeight / 2,
        badge.innerWidth,
        badge.innerHeight,
      );
    }

    fillCenteredText(context, item.text, 0, 0, item.style.color);
    context.restore();
    return;
  }

  if (item.style.backgroundColor && item.style.backgroundColor !== 'transparent') {
    context.fillStyle = item.style.backgroundColor;
    context.fillRect(left, top, badge.width, badge.height);
  }

  if (border.width > 0 && border.color) {
    context.strokeStyle = border.color;
    context.lineWidth = border.width;
    context.strokeRect(left, top, badge.width, badge.height);
  }

  fillCenteredText(context, item.text, centerX, top + badge.height / 2, item.style.color);
}

export class SeriesMetricPrimitive implements ISeriesPrimitive<TimeValue> {
  private readonly paneView: IPrimitivePaneView;
  private readonly renderer: SeriesMetricRenderer;
  private attachedParam?: SeriesAttachedParameter<TimeValue, 'Candlestick'>;
  private data: SeriesMetricPrimitiveDatum[];

  constructor(config: SeriesMetricPrimitiveConfig) {
    this.data = config.data;
    this.renderer = new SeriesMetricRenderer(
      () => ({
        data: this.data,
      }),
      () => this.attachedParam,
    );
    this.paneView = {
      zOrder: () => 'top',
      renderer: () => this.renderer,
    };
  }

  attached(param: SeriesAttachedParameter<TimeValue, 'Candlestick'>): void {
    this.attachedParam = param;
    this.updateAllViews();
  }

  detached(): void {
    this.attachedParam = undefined;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.paneView];
  }

  updateAllViews(): void {}

  setData(data: SeriesMetricPrimitiveDatum[]): void {
    this.data = data;
    this.attachedParam?.requestUpdate();
  }
}

export function createSeriesMetricPrimitive(
  config: SeriesMetricPrimitiveConfig,
): SeriesMetricPrimitive {
  return new SeriesMetricPrimitive(config);
}
