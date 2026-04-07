import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  SeriesAttachedParameter,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { ProfileModel } from '../../models/studies';
import type { VolumeProfileOptions, VolumeProfilePartialOptions } from '../../models/options';
import { mergeVolumeProfileOptions } from '../../models/options';
import { buildVisibleRangeProfile } from '../../calculations/profile/buildVisibleRangeProfile';
import { resolveProfileLevelWidth } from '../shared/renderModel';

interface VolumeProfilePrimitiveConfig {
  bars: OrderFlowBar[];
  options?: VolumeProfilePartialOptions;
}

interface VolumeProfileRenderState {
  profile: ProfileModel | null;
  options: VolumeProfileOptions;
}

class VolumeProfilePaneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly getState: () => VolumeProfileRenderState,
    private readonly getSeries: () => SeriesAttachedParameter<TimeValue, 'Custom'> | undefined,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const attached = this.getSeries();
    const state = this.getState();

    if (!attached || !state.profile?.levels.length) {
      return;
    }
    const profile = state.profile;

    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      const profileWidth = mediaSize.width * state.options.widthRatio;
      const startX = state.options.align === 'left' ? 0 : mediaSize.width - profileWidth;

      context.save();

      for (let index = 0; index < profile.levels.length; index += 1) {
        const level = profile.levels[index];
        const currentY = attached.series.priceToCoordinate(level.price);

        if (currentY === null) {
          continue;
        }

        const previousY =
          index > 0
            ? (attached.series.priceToCoordinate(profile.levels[index - 1].price) ?? currentY + 6)
            : currentY + 6;
        const nextY =
          index < profile.levels.length - 1
            ? (attached.series.priceToCoordinate(profile.levels[index + 1].price) ?? currentY - 6)
            : currentY - 6;
        const top = Math.min((currentY + nextY) / 2, (currentY + previousY) / 2);
        const bottom = Math.max((currentY + nextY) / 2, (currentY + previousY) / 2);
        const height = Math.max(bottom - top, 1);
        const width = resolveProfileLevelWidth(profile, profileWidth, level.totalVolume);
        const x = state.options.align === 'left' ? startX : mediaSize.width - width;
        const bidRatio = level.totalVolume ? level.bidVolume / level.totalVolume : 0;
        const bidWidth = width * bidRatio;
        const askWidth = width - bidWidth;

        if (
          state.options.showValueArea &&
          profile.valueArea &&
          level.price >= profile.valueArea.low &&
          level.price <= profile.valueArea.high
        ) {
          context.fillStyle = state.options.style.valueAreaColor;
          context.fillRect(startX, top, profileWidth, height);
        }

        context.fillStyle = state.options.style.profileBidColor;
        context.fillRect(x, top, bidWidth, height);
        context.fillStyle = state.options.style.profileAskColor;
        context.fillRect(x + bidWidth, top, askWidth, height);

        if (state.options.showPointOfControl && level.price === profile.pointOfControl) {
          context.save();
          context.fillStyle = state.options.pointOfControl.backgroundColor;
          context.fillRect(startX, top, profileWidth, height);
          context.strokeStyle = state.options.pointOfControl.borderColor;
          context.lineWidth = state.options.pointOfControl.lineWidth;
          context.strokeRect(startX, top, profileWidth, height);
          context.restore();
        }
      }

      context.restore();
    });
  }
}

export class VolumeProfilePrimitive implements ISeriesPrimitive<TimeValue> {
  private readonly options: VolumeProfileOptions;
  private readonly paneRenderer: VolumeProfilePaneRenderer;
  private readonly paneView: IPrimitivePaneView;
  private attachedParam?: SeriesAttachedParameter<TimeValue, 'Custom'>;
  private bars: OrderFlowBar[];
  private renderState: VolumeProfileRenderState;

  constructor(config: VolumeProfilePrimitiveConfig) {
    this.options = mergeVolumeProfileOptions(config.options);
    this.bars = config.bars;
    this.renderState = {
      profile: null,
      options: this.options,
    };
    this.paneRenderer = new VolumeProfilePaneRenderer(
      () => this.renderState,
      () => this.attachedParam,
    );
    this.paneView = {
      zOrder: () => 'bottom',
      renderer: () => this.paneRenderer,
    };
  }

  attached(param: SeriesAttachedParameter<TimeValue, 'Custom'>): void {
    this.attachedParam = param;
    this.updateAllViews();
  }

  detached(): void {
    this.attachedParam = undefined;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.paneView];
  }

  updateAllViews(): void {
    if (!this.attachedParam) {
      return;
    }

    const scope = this.options.scope;
    if (scope.kind === 'session') {
      return;
    }

    const visibleRange =
      scope.kind === 'fixed-range'
        ? scope
        : (this.attachedParam.chart.timeScale().getVisibleRange() ?? undefined);
    this.renderState = {
      ...this.renderState,
      profile: buildVisibleRangeProfile(
        this.bars,
        visibleRange?.from,
        visibleRange?.to,
        this.options.valueAreaPercent,
      ),
    };
  }

  setData(bars: OrderFlowBar[]): void {
    this.bars = bars;
    this.attachedParam?.requestUpdate();
  }
}

export function createVolumeProfilePrimitive(
  config: VolumeProfilePrimitiveConfig,
): VolumeProfilePrimitive {
  return new VolumeProfilePrimitive(config);
}
