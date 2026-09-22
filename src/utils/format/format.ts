export function formatDegrees(valueDeg: number, digits = 2): string {
  return `${valueDeg.toFixed(digits)}°`;
}

export function formatArcmin(valueDeg: number): string {
  const totalArcmin = valueDeg * 60;
  if (totalArcmin < 120) return `${totalArcmin.toFixed(1)}′`;
  return `${valueDeg.toFixed(2)}°`;
}

export function formatRa(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.round((((hours - h) * 60) - m) * 60);
  return `${h}h ${m}m ${s}s`;
}

export function formatDec(deg: number): string {
  const sign = deg < 0 ? "-" : "+";
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.round((abs - d) * 60);
  return `${sign}${d}° ${m}′`;
}

export function formatLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
