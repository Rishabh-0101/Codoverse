import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import ContestTabs from "../components/ContestTabs.jsx";

const PLATFORM_LABEL = { leetcode: "LeetCode", codeforces: "Codeforces", codechef: "CodeChef" };

export default function ContestStats() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Contest Stats" />
        <p className="text-bad text-sm text-center mt-10">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!data.isRealData || !data.totalContests) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Contest Stats" />
        <ContestTabs active="/contest-stats" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">📊</p>
          <p className="font-semibold mb-1">No contest data yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Connect LeetCode, Codeforces or CodeChef and sync to see your real contest history.
          </p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
      </div>
    );
  }

  const { totalContests, monthlyBreakdown, difficultySummary } = data;

  return (
    <div className="app-shell px-4">
      <TopBar title="Contest Stats" />
      <ContestTabs active="/contest-stats" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Your real contest history, straight from each platform</p>

      <div className="card p-4 mb-4">
        <p className="text-xs text-gray-400 mb-1">TOTAL CONTESTS GIVEN</p>
        <p className="text-3xl font-display font-extrabold">{totalContests.total}</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {Object.entries(PLATFORM_LABEL).map(([key, label]) => (
            <div key={key} className="bg-panel2 rounded-lg p-2 text-center">
              <p className="text-lg font-bold">{totalContests[key] ?? 0}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {difficultySummary && (
        <div className="card p-4 mb-4">
          <p className="text-xs text-gray-400 mb-1">PROBLEMS SOLVED — ALL PLATFORMS</p>
          <p className="text-3xl font-display font-extrabold">{difficultySummary.totals.total}</p>
          <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
            <div className="bg-good/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-good">{difficultySummary.totals.easy}</p>
              <p className="text-[10px] text-gray-500">Easy</p>
            </div>
            <div className="bg-warn/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-warn">{difficultySummary.totals.medium}</p>
              <p className="text-[10px] text-gray-500">Medium</p>
            </div>
            <div className="bg-bad/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-bad">{difficultySummary.totals.hard}</p>
              <p className="text-[10px] text-gray-500">Hard</p>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(PLATFORM_LABEL).map(([key, label]) => {
              const p = difficultySummary.perPlatform[key];
              if (!p?.available) return null;
              return (
                <div key={key} className="flex justify-between items-center text-xs py-1.5 border-t border-[#212a45]">
                  <span className="text-gray-400">{label}</span>
                  {key === "codechef" ? (
                    <span>
                      {p.total === null
                        ? "Solved count not detected on your CodeChef page (layout may have changed)"
                        : `${p.total} solved (CodeChef doesn't expose per-problem difficulty)`}
                    </span>
                  ) : (
                    <span>
                      {p.total} total · <span className="text-good">{p.easy} easy</span> ·{" "}
                      <span className="text-warn">{p.medium} med</span> · <span className="text-bad">{p.hard} hard</span>
                      {p.unrated ? ` · ${p.unrated} unrated` : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 mb-2">LAST 7 MONTHS</p>
      <div className="space-y-3">
        {[...monthlyBreakdown].reverse().map((m) => (
          <div key={m.month} className="card p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-sm">{m.month}</p>
              <span className="text-xs text-gray-400">{m.totalContestsThisMonth} contest{m.totalContestsThisMonth === 1 ? "" : "s"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="bg-panel2 rounded-lg p-2">
                <p className="text-gray-500">Active days</p>
                <p className="font-semibold text-sm">{m.activeDays}</p>
              </div>
              <div className="bg-panel2 rounded-lg p-2">
                <p className="text-gray-500">GitHub contributions</p>
                <p className="font-semibold text-sm">{m.githubContributions}</p>
              </div>
            </div>

            {Object.entries(PLATFORM_LABEL).map(([key, label]) => {
              const p = m.perPlatform[key];
              if (!p || p.contests === 0) return null;
              return (
                <div key={key} className="flex justify-between items-center text-xs py-1.5 border-t border-[#212a45]">
                  <span className="text-gray-400">{label}</span>
                  <span>
                    {p.contests} contest{p.contests === 1 ? "" : "s"}
                    {p.ratingAtMonthEnd ? ` · rating ${p.ratingAtMonthEnd}` : ""}
                    {p.bestRank ? ` · best rank #${p.bestRank}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
