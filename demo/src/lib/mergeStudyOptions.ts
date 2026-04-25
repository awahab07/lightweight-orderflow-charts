import type {
  CandleHeatmapPartialOptions,
  CandleHeatmapOptions,
  DeltaSummarySeriesPartialOptions,
  DeltaSummarySeriesOptions,
  FootprintSeriesPartialOptions,
  FootprintSeriesOptions,
  SessionVolumeProfileOptions,
  SessionVolumeProfilePartialOptions,
  VolumeProfileOptions,
  VolumeProfilePartialOptions,
} from 'lightweight-orderflow-charts';
import {
  mergeCandleHeatmapOptions as mergeResolvedCandleHeatmapOptions,
  mergeDeltaSummarySeriesOptions,
  mergeFootprintSeriesOptions,
  mergeSessionVolumeProfileOptions,
  mergeVolumeProfileOptions,
} from 'lightweight-orderflow-charts';

function mergeColorScale(baseScale: any, overlayScale: any) {
  if (!overlayScale) {
    return baseScale;
  }

  return {
    ...baseScale,
    ...overlayScale,
    range: {
      ...baseScale?.range,
      ...overlayScale?.range,
    },
    stops: overlayScale.stops ?? baseScale?.stops,
  };
}

export function mergeFootprintStudyOptions(
  base?: FootprintSeriesPartialOptions,
  overlay?: FootprintSeriesPartialOptions,
): FootprintSeriesPartialOptions | undefined {
  if (!base && !overlay) {
    return undefined;
  }

  const resolvedBase = mergeFootprintSeriesOptions(base);

  if (!overlay) {
    return resolvedBase;
  }

  return {
    ...resolvedBase,
    ...overlay,
    layout: {
      ...resolvedBase.layout,
      ...overlay.layout,
      barWidth: {
        ...resolvedBase.layout.barWidth,
        ...overlay.layout?.barWidth,
      },
    },
    candle: {
      ...resolvedBase.candle,
      ...overlay.candle,
    },
    ladder: {
      ...resolvedBase.ladder,
      ...overlay.ladder,
    },
    pointOfControl: {
      ...resolvedBase.pointOfControl,
      ...overlay.pointOfControl,
    },
    shading: {
      ...resolvedBase.shading,
      ...overlay.shading,
      bidScale: mergeColorScale(resolvedBase.shading.bidScale, overlay.shading?.bidScale),
      askScale: mergeColorScale(resolvedBase.shading.askScale, overlay.shading?.askScale),
      positiveDeltaScale: mergeColorScale(
        resolvedBase.shading.positiveDeltaScale,
        overlay.shading?.positiveDeltaScale,
      ),
      negativeDeltaScale: mergeColorScale(
        resolvedBase.shading.negativeDeltaScale,
        overlay.shading?.negativeDeltaScale,
      ),
      neutralScale: mergeColorScale(
        resolvedBase.shading.neutralScale,
        overlay.shading?.neutralScale,
      ),
    },
    summary: {
      ...resolvedBase.summary,
      ...overlay.summary,
      items: overlay.summary?.items ?? resolvedBase.summary.items,
    },
    style: {
      ...resolvedBase.style,
      ...overlay.style,
    },
  };
}

function mergeProfileOptions<TResolved extends VolumeProfileOptions | SessionVolumeProfileOptions>(
  resolvedBase: TResolved,
  overlay?: VolumeProfilePartialOptions | SessionVolumeProfilePartialOptions,
) {
  if (!overlay) {
    return resolvedBase;
  }

  return {
    ...resolvedBase,
    ...overlay,
    pointOfControl: {
      ...resolvedBase.pointOfControl,
      ...overlay.pointOfControl,
    },
    style: {
      ...resolvedBase.style,
      ...overlay.style,
    },
  };
}

export function mergeVolumeProfileStudyOptions(
  base?: VolumeProfilePartialOptions,
  overlay?: VolumeProfilePartialOptions,
): VolumeProfilePartialOptions | undefined {
  if (!base && !overlay) {
    return undefined;
  }

  return mergeProfileOptions(mergeVolumeProfileOptions(base), overlay);
}

export function mergeSessionVolumeProfileStudyOptions(
  base?: SessionVolumeProfilePartialOptions,
  overlay?: SessionVolumeProfilePartialOptions,
): SessionVolumeProfilePartialOptions | undefined {
  if (!base && !overlay) {
    return undefined;
  }

  return mergeProfileOptions(mergeSessionVolumeProfileOptions(base), overlay);
}

function mergeResolvedRowStyles(
  resolvedBase: DeltaSummarySeriesOptions,
  overlay?: DeltaSummarySeriesPartialOptions,
) {
  const nextRowStyles = { ...resolvedBase.rowStyles };

  if (!overlay?.rowStyles) {
    return nextRowStyles;
  }

  for (const [rowKey, rowStyle] of Object.entries(overlay.rowStyles)) {
    if (!rowStyle) {
      continue;
    }

    const key = rowKey as keyof DeltaSummarySeriesOptions['rowStyles'];
    const baseStyle = resolvedBase.rowStyles[key];

    nextRowStyles[key] = {
      ...baseStyle,
      ...rowStyle,
      positiveFillScale: mergeColorScale(baseStyle.positiveFillScale, rowStyle.positiveFillScale),
      negativeFillScale: mergeColorScale(baseStyle.negativeFillScale, rowStyle.negativeFillScale),
      neutralFillScale: mergeColorScale(baseStyle.neutralFillScale, rowStyle.neutralFillScale),
    };
  }

  return nextRowStyles;
}

export function mergeDeltaSummaryStudyOptions(
  base?: DeltaSummarySeriesPartialOptions,
  overlay?: DeltaSummarySeriesPartialOptions,
): DeltaSummarySeriesPartialOptions | undefined {
  if (!base && !overlay) {
    return undefined;
  }

  const resolvedBase = mergeDeltaSummarySeriesOptions(base);

  if (!overlay) {
    return resolvedBase;
  }

  return {
    ...resolvedBase,
    ...overlay,
    columnWidth: {
      ...resolvedBase.columnWidth,
      ...overlay.columnWidth,
    },
    rowLabels: {
      ...resolvedBase.rowLabels,
      ...overlay.rowLabels,
    },
    rowStyles: mergeResolvedRowStyles(resolvedBase, overlay),
  };
}

export function mergeCandleHeatmapOptions(
  base?: CandleHeatmapPartialOptions,
  overlay?: CandleHeatmapPartialOptions,
): CandleHeatmapOptions {
  const resolvedBase = mergeResolvedCandleHeatmapOptions(base);

  if (!overlay) {
    return resolvedBase;
  }

  return mergeResolvedCandleHeatmapOptions({
    ...resolvedBase,
    ...overlay,
    range: {
      ...resolvedBase.range,
      ...overlay.range,
    },
  });
}
