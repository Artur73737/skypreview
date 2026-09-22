export function starColor(bv: number): string {
  if (bv < -0.1) return "#bcd0ff";
  if (bv < 0.25) return "#e8eefc";
  if (bv < 0.6) return "#fff3d6";
  if (bv < 1.1) return "#ffd9a0";
  return "#ff9d6b";
}

export function starRadius(mag: number, scale: number): number {
  const r = (7.5 - mag) * 0.55 * scale;
  return Math.max(0.4, Math.min(3.4 * scale, r));
}

export function dsoColor(type: string): string {
  if (type.startsWith("Pl")) return "#9fe8c9";
  if (type.includes("Nb") || type.includes("HII") || type === "EN" || type === "RN") return "#7fd4d8";
  if (type === "OCl") return "#e8d9a0";
  if (type === "GCl" || type === "GC") return "#f0c98a";
  if (type === "SNR") return "#e08a8a";
  return "#cdd8ee";
}
