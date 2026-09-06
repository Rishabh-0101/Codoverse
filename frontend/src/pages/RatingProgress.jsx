import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import BottomNav from "../components/BottomNav.jsx";

const PLATFORM_COLORS = {
  leetcode: "#4f8cff",
  codeforces: "#f45b69",
  codechef: "#f5a524"
};
const PLATFORM_LABELS = { leetcode: "LeetCode", codeforces: "Codeforces", codechef: "CodeChef" };

function buildSeries(history) {
  if (!history || history.length === 0) return null;
  return [...history]
    .filter((c) => c.date && typeof c.rating === "number")
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export default function RatingProgress() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard(token).then(setData).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;
  if (error) return <div className="app-shell flex items-center justify-center text-bad text-sm px-6">{error}</div>;

  const results = data?.platformResults || {};
  const series = {
    leetcode: buildSeries(results.leetcode?.contestHistory),
    codeforces: buildSeries(results.codeforces?.contestHistory),
    codechef: buildSeries(results.codechef?.contestHistory)
  };
  const available = Object.entries(series).filter(([, s]) => s && s.length > 0);

  if (!data?.isRealData || available.length === 0) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Rating Progress" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">📈</p>
          <p className="font-semibold mb-1">No contest history yet</p>
          <p className="text-sm text-gray-400 mb-4">Connect LeetCode, Codeforces or CodeChef and sync to see your real rating trend.</p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const allDates = available.flatMap(([, s]) => s.map((c) => new Date(c.date).getTime()));
  const minT = Math.min(...allDates);
  const maxT = Math.max(...allDates);
  const spanT = Math.max(1, maxT - minT);

  const allRatings = available.flatMap(([, s]) => s.map((c) => c.rating));
  const minR = Math.min(...allRatings);
  const maxR = Math.max(...allRatings);
  const spanR = Math.max(1, maxR - minR);

  const W = 320, H = 160, PAD = 8;
  const toX = (t) => PAD + ((t - minT) / spanT) * (W - PAD * 2);
  const toY = (r) => H - PAD - ((r - minR) / spanR) * (H - PAD * 2);

  return (
    <div className="app-shell px-4">
      <TopBar title="Rating Progress" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Your real contest rating over time, every platform</p>

      <div className="card p-4 mb-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {[0, 0.33, 0.66, 1].map((f) => (
            <line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="#1a2338" strokeWidth="1" />
          ))}
          {available.map(([platform, s]) => (
            <polyline
              key={platform}
              points={s.map((c) => `${toX(new Date(c.date).getTime())},${toY(c.rating)}`).join(" ")}
              fill="none"
              stroke={PLATFORM_COLORS[platform]}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {available.map(([platform, s]) => {
            const last = s[s.length - 1];
            return (
              <circle
                key={platform}
                cx={toX(new Date(last.date).getTime())}
                cy={toY(last.rating)}
                r="4"
                fill={PLATFORM_COLORS[platform]}
                stroke="#0b0e1a"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="flex gap-4 mt-2 flex-wrap">
          {available.map(([platform]) => (
            <span key={platform} className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PLATFORM_COLORS[platform] }} />
              {PLATFORM_LABELS[platform]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {available.map(([platform, s]) => {
          const peak = Math.max(...s.map((c) => c.rating));
          const current = s[s.length - 1].rating;
          return (
            <div key={platform} className="card p-3 text-center">
              <p className="text-[10px] text-gray-500 mb-1">{PLATFORM_LABELS[platform]}</p>
              <p className="font-bold text-sm" style={{ color: PLATFORM_COLORS[platform] }}>{peak}</p>
              <p className="text-[9px] text-gray-500">peak · now {current}</p>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
