// src/components/SparklineCanvas.tsx
import React, { useEffect, useRef } from "react";

export default function SparklineCanvas({
  data,
  width = 180,
  height = 48,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !data || data.length < 2) return;
    el.width = width * devicePixelRatio;
    el.height = height * devicePixelRatio;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    const ctx = el.getContext("2d")!;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const norm = (v: number) => (max - min > 0 ? (v - min) / (max - min) : 0.5);

    // gradient line
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(62,203,255,1)");
    grad.addColorStop(1, "rgba(62,203,255,.2)");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(62,203,255,1)";

    // path
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = (1 - norm(v)) * (height - 4) + 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // fill under line
    ctx.lineTo(width - 1, height - 2);
    ctx.lineTo(1, height - 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data, width, height]);

  return <canvas ref={ref} />;
}
