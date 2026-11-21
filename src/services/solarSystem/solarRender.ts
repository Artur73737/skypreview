const DEG = Math.PI / 180;
const DISK_BUCKETS = [32, 48, 64, 96, 128, 192, 256, 384, 512, 768];

const diskCache = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement>>();
const sourceCache = new WeakMap<HTMLImageElement, ImageData>();
const ringProfileCache = new WeakMap<HTMLImageElement, Float32Array>();

function bucketFor(radiusPx: number): number {
  for (const bucket of DISK_BUCKETS) if (bucket >= radiusPx) return bucket;
  return DISK_BUCKETS[DISK_BUCKETS.length - 1];
}

function sourcePixels(image: HTMLImageElement): ImageData | null {
  const cached = sourceCache.get(image);
  if (cached) return cached;
  if (!image.naturalWidth || !image.naturalHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  sourceCache.set(image, data);
  return data;
}

function orthographicDisk(image: HTMLImageElement, bucket: number): HTMLCanvasElement | null {
  const source = sourcePixels(image);
  if (!source) return null;
  const canvas = document.createElement("canvas");
  canvas.width = bucket * 2;
  canvas.height = bucket * 2;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const output = context.createImageData(bucket * 2, bucket * 2);
  const pixels = output.data;
  const width = source.width;
  const height = source.height;
  const sourcePixelsData = source.data;
  const center = bucket;
  const radius = bucket;

  for (let y = 0; y < bucket * 2; y += 1) {
    const ny = (y + 0.5 - center) / radius;
    for (let x = 0; x < bucket * 2; x += 1) {
      const nx = (x + 0.5 - center) / radius;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      const longitude = Math.atan2(nx, nz);
      const latitude = Math.asin(-ny);
      const u = (0.25 + longitude / (2 * Math.PI)) * (width - 1);
      const v = (0.5 - latitude / Math.PI) * (height - 1);
      const x0 = Math.floor(u);
      const y0 = Math.floor(v);
      const x1 = Math.min(width - 1, x0 + 1);
      const y1 = Math.min(height - 1, y0 + 1);
      const fx = u - x0;
      const fy = v - y0;
      const offset = (y * (bucket * 2) + x) * 4;
      const i00 = (y0 * width + x0) * 4;
      const i10 = (y0 * width + x1) * 4;
      const i01 = (y1 * width + x0) * 4;
      const i11 = (y1 * width + x1) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const top = sourcePixelsData[i00 + channel] * (1 - fx) + sourcePixelsData[i10 + channel] * fx;
        const bottom = sourcePixelsData[i01 + channel] * (1 - fx) + sourcePixelsData[i11 + channel] * fx;
        pixels[offset + channel] = top * (1 - fy) + bottom * fy;
      }
      pixels[offset + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return canvas;
}

export function getTexturedDisk(
  image: HTMLImageElement,
  radiusPx: number,
): HTMLCanvasElement | null {
  const bucket = bucketFor(Math.max(1, radiusPx));
  let entries = diskCache.get(image);
  if (!entries) {
    entries = new Map();
    diskCache.set(image, entries);
  }
  const cached = entries.get(bucket);
  if (cached) return cached;
  const disk = orthographicDisk(image, bucket);
  if (disk) entries.set(bucket, disk);
  return disk;
}

function drawPhaseShadow(
  context: CanvasRenderingContext2D,
  radiusPx: number,
  phaseFraction: number,
  sunAngleRad: number,
): void {
  if (phaseFraction > 0.995) return;
  const cosPhase = Math.max(-1, Math.min(1, 2 * phaseFraction - 1));
  context.save();
  context.rotate(sunAngleRad);
  context.beginPath();
  context.arc(0, 0, radiusPx, Math.PI / 2, (3 * Math.PI) / 2, false);
  if (cosPhase >= 0) {
    context.ellipse(
      0,
      0,
      radiusPx * cosPhase,
      radiusPx,
      0,
      (3 * Math.PI) / 2,
      Math.PI / 2,
      true,
    );
  } else {
    context.ellipse(
      0,
      0,
      -radiusPx * cosPhase,
      radiusPx,
      0,
      -Math.PI / 2,
      Math.PI / 2,
      false,
    );
  }
  context.closePath();
  context.fillStyle = "rgba(2,4,9,0.92)";
  context.fill();
  context.restore();
}

function ringProfile(image: HTMLImageElement): Float32Array {
  const cached = ringProfileCache.get(image);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new Float32Array(0);
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, Math.floor(canvas.height / 2), canvas.width, 1).data;
  const profile = new Float32Array(canvas.width);
  for (let i = 0; i < canvas.width; i += 1) profile[i] = data[i * 4 + 3] / 255;
  ringProfileCache.set(image, profile);
  return profile;
}

function drawRingHalf(
  context: CanvasRenderingContext2D,
  radiusPx: number,
  tiltDeg: number,
  alphaImage: HTMLImageElement,
  opacity: number,
  front: boolean,
): void {
  const profile = ringProfile(alphaImage);
  if (profile.length === 0) return;
  const minor = Math.abs(Math.sin(tiltDeg * DEG));
  const inner = radiusPx * 1.24;
  const outer = radiusPx * 2.27;
  const bands = Math.min(160, Math.max(16, Math.round((outer - inner) / 2)));
  const step = (outer - inner) / bands;
  const startAngle = front ? 0 : Math.PI;
  const endAngle = front ? Math.PI : 2 * Math.PI;

  for (let i = 0; i < bands; i += 1) {
    const radial = inner + step * (i + 0.5);
    const profileIndex = Math.min(
      profile.length - 1,
      Math.round((i / Math.max(1, bands - 1)) * (profile.length - 1)),
    );
    const alpha = profile[profileIndex] * opacity;
    if (alpha < 0.01) continue;
    context.strokeStyle = `rgba(224,209,176,${alpha * 0.92})`;
    context.lineWidth = Math.max(0.6, step * Math.max(minor, 0.02));
    context.beginPath();
    context.ellipse(0, 0, radial, Math.max(0.6, radial * minor), 0, startAngle, endAngle);
    context.stroke();
  }
}

export interface TexturedBodyOptions {
  phaseFraction: number;
  sunAngleRad: number;
  opacity: number;
  ringTiltDeg?: number | null;
  ringAlpha?: HTMLImageElement | null;
}

export function drawTexturedBody(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  radiusPx: number,
  options: TexturedBodyOptions,
): void {
  const disk = getTexturedDisk(image, radiusPx);
  if (!disk) return;
  const hasRing = options.ringTiltDeg != null && options.ringAlpha;
  const frontStart = (options.ringTiltDeg ?? 0) >= 0;

  context.save();
  context.translate(x, y);
  if (hasRing) {
    drawRingHalf(
      context,
      radiusPx,
      options.ringTiltDeg as number,
      options.ringAlpha as HTMLImageElement,
      options.opacity,
      !frontStart,
    );
  }
  context.globalAlpha = options.opacity;
  context.drawImage(disk, -radiusPx, -radiusPx, radiusPx * 2, radiusPx * 2);
  context.globalAlpha = 1;
  drawPhaseShadow(context, radiusPx, options.phaseFraction, options.sunAngleRad);
  if (hasRing) {
    drawRingHalf(
      context,
      radiusPx,
      options.ringTiltDeg as number,
      options.ringAlpha as HTMLImageElement,
      options.opacity,
      frontStart,
    );
  }
  context.restore();
}
