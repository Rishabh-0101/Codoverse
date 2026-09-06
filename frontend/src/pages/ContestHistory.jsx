import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import ContestTabs from "../components/ContestTabs.jsx";

const PLATFORM_LABEL = { leetcode: "LeetCode", codeforces: "Codeforces", codechef: "CodeChef" };
const PLATFORM_COLOR = {
  codechef: "bg-[#5b4638] text-[#f5c16c]",
  leetcode: "bg-[#3a2a1a] text-[#f5a524]",
  codeforces: "bg-[#1a2a44] text-[#4f8cff]"
};

export default function ContestHistory() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContestHistory(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Contest History" />
        <p className="text-bad text-sm text-center mt-10">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (!data.isRealData) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Contest History" />
        <ContestTabs active="/contest-history" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">🏆</p>
          <p className="font-semibold mb-1">No contest data yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Connect LeetCode, Codeforces or CodeChef and sync to see contests you've actually won.
          </p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4">
      <TopBar title="Contest History" />
      <ContestTabs active="/contest-history" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">
        Every contest you've actually placed <span className="text-good font-semibold">#1</span> in — real rank data, straight from each platform.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-display font-extrabold text-good">{data.totalWins}</p>
          <p className="text-xs text-gray-500 mt-1">Contests won</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-display font-extrabold">{data.totalContestsGiven}</p>
          <p className="text-xs text-gray-500 mt-1">Total contests given</p>
        </div>
      </div>

      {data.wins.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-semibold mb-1">No wins yet</p>
          <p className="text-sm text-gray-400">
            You've given {data.totalContestsGiven} contest{data.totalContestsGiven === 1 ? "" : "s"} so far — a #1 finish will show up here the moment it happens.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.wins.map((w, i) => (
            <a
              key={`${w.platform}-${w.name}-${i}`}
              href={w.url || undefined}
              target={w.url ? "_blank" : undefined}
              rel="noreferrer"
              className="card p-4 block"
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLOR[w.platform] || "bg-panel2"}`}>
                  {PLATFORM_LABEL[w.platform] || w.platform}
                </span>
                <span className="text-[10px] font-bold text-good">🥇 RANK #1</span>
              </div>
              <p className="font-semibold mt-2">{w.name}</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>{new Date(w.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
                {w.rating !== null && <p>Rating after contest: {w.rating}</p>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
