import React from "react";

export default function RadarChart({ data }) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const n = labels.length;
  const size = 220;
  const center = size / 2;
  const radius = size / 2 - 30;

  const point = (i, value) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const polygonPoints = values.map((v, i) => point(i, v).join(",")).join(" ");
  const rings = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} className="mx-auto">
      {rings.map((r) => (
        <polygon
          key={r}
          points={labels
            .map((_, i) => point(i, r).join(","))
            .join(" ")}
          fill="none"
          stroke="#212a45"
          strokeWidth="1"
        />
      ))}
      {labels.map((label, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 118);
        return (
          <g key={label}>
            <line x1={center} y1={center} x2={x} y2={y} stroke="#212a45" strokeWidth="1" />
            <text x={lx} y={ly} fontSize="9" fill="#9aa4c2" textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill="rgba(79,140,255,0.35)" stroke="#7c5cff" strokeWidth="2" />
    </svg>
  );
}
