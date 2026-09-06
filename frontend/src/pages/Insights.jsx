import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import BottomNav from "../components/BottomNav.jsx";

const LEVEL_COLORS = ["#1a2338", "#0f6e56", "#1d9e75", "#5dcaa5"];

function longestRun(cells) {
  let longest = 0, current = 0;
  for (const v of cells) {
    if (v > 0) { current++; longest = Math.max(longest, current); }
    else current = 0;
  }
  return longest;
}

export default function Insights() {
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
  const gh = results.github;

  if (!data?.isRealData) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Insights" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">💡</p>
          <p className="font-semibold mb-1">Nothing to show yet</p>
          <p className="text-sm text-gray-400 mb-4">Connect a platform and sync to unlock real insights.</p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Real personal records, computed only from data that's already been synced.
  const totalStars = gh?.totalStars ?? null;
  const longestStreak = longestRun(data.activityHeatmap || []);
  const ratingPeaks = ["leetcode", "codeforces", "codechef"]
    .map((p) => {
      const r = results[p];
      if (!r) return null;
      const peak = p === "codeforces" ? r.maxRating : r.contestHistory?.length ? Math.max(...r.contestHistory.map((c) => c.rating)) : null;
      return peak ? { platform: p, peak } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.peak - a.peak)[0];
  const mostActiveDay = gh?.activity?.length
    ? gh.activity.reduce((best, d) => (d.count > (best?.count || 0) ? d : best), null)
    : null;

  return (
    <div className="app-shell px-4">
      <TopBar title="Insights" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Real numbers, pulled together from your synced data</p>

      {gh?.activity?.length > 0 && (
        <div className="card p-4 mb-3">
          <h3 className="font-semibold text-sm mb-1">GitHub activity — full year</h3>
          <p className="text-[10px] text-gray-500 mb-3">Real {gh.activity.length}-day contribution calendar</p>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${Math.ceil(gh.activity.length / 7)}, 1fr)` }}>
            {gh.activity.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`}
                className="rounded-[2px]"
                style={{ paddingTop: "100%", background: LEVEL_COLORS[d.level] || LEVEL_COLORS[0] }}
              />
            ))}
          </div>
        </div>
      )}

      {gh?.topLanguages?.length > 0 && (
        <div className="card p-4 mb-3">
          <h3 className="font-semibold text-sm mb-3">Top languages</h3>
          <p className="text-[10px] text-gray-500 -mt-2 mb-3">From your real GitHub repos</p>
          <div className="space-y-2.5">
            {gh.topLanguages.map((l, i) => {
              const max = gh.topLanguages[0].count;
              const colors = ["#f5a524", "#4f8cff", "#7c5cff", "#2dd4bf", "#f45b69"];
              return (
                <div key={l.language}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{l.language}</span>
                    <span className="text-gray-500">{l.count} repo{l.count === 1 ? "" : "s"}</span>
                  </div>
                  <div className="h-2 bg-panel2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(l.count / max) * 100}%`, background: colors[i % colors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-1">Your records</h3>
        <p className="text-[10px] text-gray-500 mb-3">Real personal bests from your synced data</p>
        <div className="space-y-2">
          {totalStars !== null && (
            <Record label="⭐ Total GitHub stars earned" value={totalStars} />
          )}
          <Record label="🔥 Longest streak (last 119 days)" value={`${longestStreak} day${longestStreak === 1 ? "" : "s"}`} />
          {ratingPeaks && (
            <Record
              label="📈 Highest contest rating reached"
              value={`${ratingPeaks.platform === "leetcode" ? "LeetCode" : ratingPeaks.platform === "codeforces" ? "Codeforces" : "CodeChef"} ${ratingPeaks.peak}`}
            />
          )}
          {mostActiveDay && (
            <Record label="⚡ Most active GitHub day" value={`${mostActiveDay.count} on ${mostActiveDay.date}`} />
          )}
          {totalStars === null && !ratingPeaks && !mostActiveDay && (
            <p className="text-xs text-gray-500">Connect more platforms and sync to unlock more records.</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Record({ label, value }) {
  return (
    <div className="bg-panel2 rounded-lg p-2.5 flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
