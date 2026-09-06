import React from "react";

// bars: [{ label, value, color? }]. Used for anything BarChart's fixed
// 7-weekday shape doesn't fit — per-platform totals, monthly contest
// counts, difficulty distribution, etc.
export default function LabeledBarChart({ bars = [], height = 96 }) {
  const max = Math.max(1, ...bars.map((b) => b.value || 0));

  if (bars.every((b) => !b.value)) {
    return <p className="text-xs text-gray-500 text-center py-6">No data yet.</p>;
  }

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((b) => (
        <div key={b.label} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
          <span className="text-[10px] text-gray-400">{b.value}</span>
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${(b.value / max) * (height - 32) + 4}px`,
              background: b.color || "linear-gradient(to top, #4f8cff, #7c5cff)"
            }}
          />
          <span className="text-[10px] text-gray-500 text-center leading-tight">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
