import React from "react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function BarChart({ values = [] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-2 h-24">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-accent to-accent2"
            style={{ height: `${(v / max) * 70 + 4}px` }}
          />
          <span className="text-[10px] text-gray-500">{DAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}
