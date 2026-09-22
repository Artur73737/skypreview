export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function normalizeDeg360(deg: number): number {
  let v = deg % 360;
  if (v < 0) v += 360;
  return v;
}

export function normalizeRaHours(hours: number): number {
  let v = hours % 24;
  if (v < 0) v += 24;
  return v;
}

export function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function greenwichSiderealDeg(date: Date): number {
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545);
  gmst += 0.000387933 * t * t - (t * t * t) / 38710000;
  return normalizeDeg360(gmst);
}

export function localSiderealHours(date: Date, lonDegEast: number): number {
  const lstDeg = normalizeDeg360(greenwichSiderealDeg(date) + lonDegEast);
  return lstDeg / 15;
}

export interface AltAz {
  altDeg: number;
  azDeg: number;
}

export function raDecToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDegEast: number,
  date: Date,
): AltAz {
  const lst = localSiderealHours(date, lonDegEast);
  let hourAngleDeg = normalizeDeg360((lst - raHours) * 15);
  if (hourAngleDeg > 180) hourAngleDeg -= 360;
  const h = hourAngleDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const lat = latDeg * DEG2RAD;
  const sinAlt =
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  // atan2 remains stable at the poles and across the meridian.
  const east = -Math.cos(dec) * Math.sin(h);
  const north = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.cos(h) * Math.sin(lat);
  const az = Math.atan2(east, north) * RAD2DEG;

  return { altDeg: alt * RAD2DEG, azDeg: normalizeDeg360(az) };
}

export function altAzToRaDec(
  altDeg: number,
  azDegNorthEast: number,
  latDeg: number,
  lonDegEast: number,
  date: Date,
): { raHours: number; decDeg: number } {
  const alt = altDeg * DEG2RAD;
  const az = azDegNorthEast * DEG2RAD;
  const lat = latDeg * DEG2RAD;
  const sinDec = Math.sin(alt) * Math.sin(lat) + Math.cos(alt) * Math.cos(lat) * Math.cos(az);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const cosH = (Math.sin(alt) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
  const sinH = (-Math.sin(az) * Math.cos(alt)) / Math.cos(dec);
  const hourAngleDeg = Math.atan2(sinH, Math.max(-1, Math.min(1, cosH))) * RAD2DEG;
  const lst = localSiderealHours(date, lonDegEast);
  const raHours = normalizeRaHours(lst - hourAngleDeg / 15);
  return { raHours, decDeg: dec * RAD2DEG };
}

export function angularSeparationDeg(
  raAHours: number,
  decADeg: number,
  raBHours: number,
  decBDeg: number,
): number {
  const aDec = decADeg * DEG2RAD;
  const bDec = decBDeg * DEG2RAD;
  const dRa = (raBHours - raAHours) * 15 * DEG2RAD;
  const cosD =
    Math.sin(aDec) * Math.sin(bDec) + Math.cos(aDec) * Math.cos(bDec) * Math.cos(dRa);
  return Math.acos(Math.max(-1, Math.min(1, cosD))) * RAD2DEG;
}
