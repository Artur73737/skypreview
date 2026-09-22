const BACKGROUND_URL =
  import.meta.env.VITE_SKY_BACKGROUND_URL ??
  "https://cdn.eso.org/images/large/eso0932a.jpg";

const DSS_BASE =
  import.meta.env.VITE_DSS_BASE_URL ??
  "https://archive.eso.org/dss/dss/image";

export function getSkyBackgroundUrl(): string {
  return BACKGROUND_URL;
}

export function getDssCutoutUrl(
  raDeg: number,
  decDeg: number,
  sizeArcmin = 30,
  survey: "DSS2-red" | "DSS2-blue" | "DSS1" = "DSS2-red",
): string {
  const params = new URLSearchParams({
    ra: String(raDeg),
    dec: String(decDeg),
    x: String(sizeArcmin),
    y: String(sizeArcmin),
    "Sky-Survey": survey,
    mimeType: "image/jpeg",
  });
  return `${DSS_BASE}?${params.toString()}`;
}

export function getAladinLiteUrl(raDeg: number, decDeg: number, fovDeg: number): string {
  const p = new URLSearchParams({
    target: `${raDeg} ${decDeg}`,
    fov: String(fovDeg),
    survey: "P/DSS2/color",
  });
  return `https://aladin.cds.unistra.fr/AladinLite/api/v3/embed?${p.toString()}`;
}
