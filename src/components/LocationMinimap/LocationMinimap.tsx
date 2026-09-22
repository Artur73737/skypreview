import { useEffect, useRef } from "react";

interface LocationMinimapProps {
  latDeg: number;
  lonDegEast: number;
  onPick: (latDeg: number, lonDegEast: number) => void;
}

export function LocationMinimap({ latDeg, lonDegEast, onPick }: LocationMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/surveys/earth.jpg`;
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#020409";
    ctx.fillRect(0, 0, w, h);
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, w, h);
    const x = ((lonDegEast + 180) / 360) * w;
    const y = ((90 - latDeg) / 180) * h;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  const onClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const lon = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;
    onPick(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100);
  };

  return (
    <canvas
      ref={canvasRef}
      width={264}
      height={132}
      onClick={onClick}
      style={{ width: "100%", borderRadius: 12, cursor: "crosshair", display: "block" }}
    />
  );
}
