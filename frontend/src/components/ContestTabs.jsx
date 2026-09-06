import React from "react";
import { Link } from "react-router-dom";

const TABS = [
  { to: "/contests", label: "Upcoming" },
  { to: "/contest-stats", label: "Stats" },
  { to: "/contest-history", label: "Won 🥇" }
];

export default function ContestTabs({ active }) {
  return (
    <div className="flex gap-2 mb-4">
      {TABS.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg ${
            active === t.to ? "bg-accent/15 text-accent" : "bg-panel2 text-gray-400"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
