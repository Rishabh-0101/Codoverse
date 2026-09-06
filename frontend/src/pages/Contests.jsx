import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import BottomNav from "../components/BottomNav.jsx";
import ContestTabs from "../components/ContestTabs.jsx";

const PLATFORM_COLOR = {
  codechef: "bg-[#5b4638] text-[#f5c16c]",
  leetcode: "bg-[#3a2a1a] text-[#f5a524]",
  codeforces: "bg-[#1a2a44] text-[#4f8cff]"
};

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Contests() {
  const { token } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContests(token)
      .then((d) => setContests(d.contests))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="app-shell px-4">
      <div className="pt-5 pb-3">
        <h1 className="text-xl font-display font-bold">Contests</h1>
        <p className="text-xs text-gray-400">Live upcoming contests — LeetCode, Codeforces &amp; CodeChef</p>
      </div>

      <ContestTabs active="/contests" />

      {error && <p className="text-bad text-sm mb-3">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Loading live contests…</p>}
      {!loading && contests.length === 0 && !error && (
        <p className="text-gray-500 text-sm">No upcoming contests found right now.</p>
      )}

      <div className="space-y-3">
        {contests.map((c) => {
          const date = new Date(c.startsAt);
          const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
          const fullDate = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
          const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          const duration = formatDuration(c.durationSeconds);

          return (
            <a key={c.id} href={c.url} target="_blank" rel="noreferrer" className="card p-4 block">
              <div className="flex justify-between items-start">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLOR[c.platform] || "bg-panel2"}`}>
                  {c.platform}
                </span>
                <span className="text-[10px] text-gray-500">{c.level}</span>
              </div>
              <p className="font-semibold mt-2">{c.name}</p>
              <div className="mt-3 text-xs text-gray-400 space-y-0.5">
                <p>{dayName}, {fullDate}</p>
                <p>{time} (your local time){duration ? ` · ${duration}` : ""}</p>
              </div>
              <p className="text-accent text-xs mt-3">Open contest page ↗</p>
            </a>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
