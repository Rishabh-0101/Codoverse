import React from "react";

// rows: [{ label, segments: [{ value, color, name }] }]
// Each row is a full-width horizontal bar split proportionally into its
// segments — used for "problems solved by difficulty, per platform".
// A row with all-zero segments is skipped so the chart never implies data
// that doesn't exist.
export default function StackedBarChart({ rows = [] }) {
  const visibleRows = rows.filter((r) => r.segments.some((s) => s.value > 0));

  if (visibleRows.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-6">No data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {visibleRows.map((row) => {
        const total = row.segments.reduce((sum, s) => sum + (s.value || 0), 0);
        return (
          <div key={row.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">{row.label}</span>
              <span className="text-gray-500">{total} solved</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden bg-panel2 flex">
              {row.segments.map((s, i) =>
                s.value > 0 ? (
                  <div
                    key={i}
                    style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                    title={`${s.name}: ${s.value}`}
                  />
                ) : null
              )}
            </div>
          </div>
        );
      })}
      <div className="flex gap-3 pt-1 flex-wrap">
        {[...new Map(visibleRows.flatMap((r) => r.segments).map((s) => [s.name, s.color])).entries()].map(
          ([name, color]) => (
            <div key={name} className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
              {name}
            </div>
          )
        )}
      </div>
    </div>
  );
}
