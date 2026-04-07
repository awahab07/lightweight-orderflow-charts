import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  SeriesAttachedParameter,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

import type { OrderFlowBar, TimeValue } from '../../models/contracts';
import type { ProfileModel } from '../../models/studies';
import type {
  SessionVolumeProfileOptions,
  SessionVolumeProfilePartialOptions,
} from '../../models/options';
import { mergeSessionVolumeProfileOptions } from '../../models/options';
import { buildSessionProfiles } from '../../calculations/profile/buildSessionProfiles';
import { resolveProfileLevelWidth } from '../shared/renderModel';

interface SessionProfilePrimitiveConfig {
  bars: OrderFlowBar[];
  options?: SessionVolumeProfilePartialOptions;
}

interface SessionProfileRenderState {
  profiles: ProfileModel[];
  options: SessionVolumeProfileOptions;
}

class SessionProfileRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly getState: () => SessionProfileRenderState,
    private readonly getAttached: () => SeriesAttachedParameter<TimeValue, 'Custom'> | undefined,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const attached = this.getAttached();
    const state = this.getState();

    if (!attached || !state.profiles.length) {
      return;
    }

    target.useMediaCoordinateSpace(({ context }) => {
      context.save();
      context.font = `11px Inter, Arial, sans-serif`;

      for (const profile of state.profiles) {
        if (!profile.levels.length || !profile.fromTime || !profile.toTime) {
          continue;
        }

        const fromX = attached.chart.timeScale().timeToCoordinate(profile.fromTime);
        const toX = attached.chart.timeScale().timeToCoordinate(profile.toTime);

        if (fromX === null || toX === null) {
          continue;
        }

        const sessionWidth = Math.max(toX - fromX, 24);
        const profileWidth = sessionWidth * state.options.widthRatio;
        const startX = state.options.align === 'left' ? fromX : toX - profileWidth;

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
          const x = state.options.align === 'left' ? startX : toX - width;
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

        if (state.options.showSessionLabels) {
          context.save();
          context.fillStyle = state.options.style.sessionLabelColor;
          context.textAlign = 'center';
          context.textBaseline = 'top';
          context.fillText(profile.label ?? profile.scopeId, (fromX + toX) / 2, 4);
          context.restore();
        }
      }

      context.restore();
    });
  }
}

export class SessionVolumeProfilePrimitive implements ISeriesPrimitive<TimeValue> {
  private readonly options: SessionVolumeProfileOptions;
  private readonly paneRenderer: SessionProfileRenderer;
  private readonly paneView: IPrimitivePaneView;
  private attachedParam?: SeriesAttachedParameter<TimeValue, 'Custom'>;
  private bars: OrderFlowBar[];
  private renderState: SessionProfileRenderState;

  constructor(config: SessionProfilePrimitiveConfig) {
    this.options = mergeSessionVolumeProfileOptions(config.options);
    this.bars = config.bars;
    this.renderState = {
      profiles: [],
      options: this.options,
    };
    this.paneRenderer = new SessionProfileRenderer(
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
    const profiles = buildSessionProfiles(this.bars, this.options.valueAreaPercent);
    const sessionScope = this.options.scope.kind === 'session' ? this.options.scope : undefined;
    const filteredProfiles = sessionScope?.sessionIds?.length
      ? profiles.filter((profile) => sessionScope.sessionIds!.includes(profile.scopeId))
      : profiles;

    this.renderState = {
      ...this.renderState,
      profiles: filteredProfiles,
    };
  }

  setData(bars: OrderFlowBar[]): void {
    this.bars = bars;
    this.attachedParam?.requestUpdate();
  }
}

export function createSessionVolumeProfilePrimitive(
  config: SessionProfilePrimitiveConfig,
): SessionVolumeProfilePrimitive {
  return new SessionVolumeProfilePrimitive(config);
}
