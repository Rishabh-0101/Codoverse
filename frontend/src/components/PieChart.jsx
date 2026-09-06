import React from "react";

const DEFAULT_COLORS = ["#2dd4bf", "#f5a524", "#f45b69", "#4f8cff", "#7c5cff", "#9aa4c2"];

// data: [{ label, value, color? }]. Renders an SVG donut + a small legend.
// Segments with value 0 are skipped so the chart never lies about having
// data it doesn't.
export default function PieChart({ data = [], size = 160, thickness = 22 }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const radius = size / 2;
  const innerRadius = radius - thickness;

  if (!total) {
    return <p className="text-xs text-gray-500 text-center py-6">No data yet.</p>;
  }

  let cumulative = 0;
  const arcs = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const fraction = d.value / total;
      const startAngle = cumulative * Math.PI * 2 - Math.PI / 2;
      cumulative += fraction;
      const endAngle = cumulative * Math.PI * 2 - Math.PI / 2;

      const x1 = radius + radius * Math.cos(startAngle);
      const y1 = radius + radius * Math.sin(startAngle);
      const x2 = radius + radius * Math.cos(endAngle);
      const y2 = radius + radius * Math.sin(endAngle);
      const ix1 = radius + innerRadius * Math.cos(startAngle);
      const iy1 = radius + innerRadius * Math.sin(startAngle);
      const ix2 = radius + innerRadius * Math.cos(endAngle);
      const iy2 = radius + innerRadius * Math.sin(endAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
        "Z"
      ].join(" ");

      return { path, color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length], label: d.label, value: d.value };
    });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {arcs.map((a) => (
          <path key={a.label} d={a.path} fill={a.color} />
        ))}
        <text x={radius} y={radius - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="#e6e9f5">
          {total}
        </text>
        <text x={radius} y={radius + 14} textAnchor="middle" fontSize="9" fill="#9aa4c2">
          total
        </text>
      </svg>
      <div className="space-y-1.5 min-w-0">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: a.color }} />
            <span className="text-gray-400 truncate">{a.label}</span>
            <span className="font-semibold ml-auto pl-2">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
