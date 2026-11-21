export const qualityRanges = {
  textureSize: [512, 4096, 256],
  previewSize: [256, 1024, 128],
  maxOrder: [0, 9, 1],
  pixelRatio: [1, 3, 0.25],
  exposure: [-3, 1, 0.1],
  highlights: [0, 1, 0.05],
  gamma: [0.5, 2, 0.05],
  saturation: [0, 2, 0.05],
} as const;

export const defaultQuality = {
  textureSize: 0,
  previewSize: 512,
  maxOrder: 9,
  pixelRatio: 2,
  exposure: -0.3,
  highlights: 0.25,
  gamma: 1,
  saturation: 1,
  smooth: false,
  localPack: true,
};

export type ImageQuality = typeof defaultQuality;

export function readQuality(value: Partial<ImageQuality> | null | undefined): ImageQuality {
  const quality = { ...defaultQuality };
  for (const key of Object.keys(qualityRanges) as (keyof typeof qualityRanges)[]) {
    const n = value?.[key];
    if (key === "textureSize" && n === 0) continue;
    const [min, max, step] = qualityRanges[key];
    if (typeof n === "number" && Number.isFinite(n) && n >= min && n <= max)
      quality[key] = Number((min + Math.round((n - min) / step) * step).toFixed(2));
  }
  if (typeof value?.smooth === "boolean") quality.smooth = value.smooth;
  if (typeof value?.localPack === "boolean") quality.localPack = value.localPack;
  return quality;
}
