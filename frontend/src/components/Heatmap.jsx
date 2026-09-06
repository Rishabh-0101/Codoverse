import React from "react";

const LEVEL_COLORS = ["#1a2338", "#164e4a", "#0d9488", "#2dd4bf"];

export default function Heatmap({ cells = [] }) {
  const cols = Math.ceil(cells.length / 7);
  const grid = Array.from({ length: cols }, (_, c) => cells.slice(c * 7, c * 7 + 7));

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {grid.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((level, ri) => (
            <div
              key={ri}
              className="w-3 h-3 rounded-sm"
              style={{ background: LEVEL_COLORS[level] || LEVEL_COLORS[0] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
