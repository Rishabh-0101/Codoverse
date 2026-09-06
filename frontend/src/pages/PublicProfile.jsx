import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function PublicProfile() {
  const { handle } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicProfile(handle).then(setData).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [handle]);

  if (loading) return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;

  if (error) {
    return (
      <div className="app-shell flex flex-col items-center justify-center text-center px-6 gap-3">
        <p className="text-3xl">🔒</p>
        <p className="text-gray-300">{error}</p>
        <Link to="/login" className="text-accent text-sm">Go to Codoverse</Link>
      </div>
    );
  }

  const r = data.platformResults || {};

  return (
    <div className="app-shell px-4 py-6">
      <div className="rounded-2xl p-6 bg-gradient-to-br from-[#16213f] via-[#1a2650] to-[#0e1731] border border-[#2a3660]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center text-xl">
            {data.avatarInitials}
          </div>
          <div>
            <p className="font-semibold text-lg">{data.name}</p>
            <p className="text-xs text-gray-400">@{data.handle}{data.globalRank ? ` · Global #${data.globalRank}` : ""}</p>
          </div>
          <span className="ml-auto text-xs font-display font-bold text-accent">Codoverse</span>
        </div>

        {!data.isRealData ? (
          <p className="text-sm text-gray-400 text-center py-6">This user hasn't synced any platforms yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <MiniStat label="C-Score" value={data.cScore} />
              <MiniStat label="XP" value={data.totalXp} />
              <MiniStat label="Contests won" value={data.contestWins} />
            </div>
            <div className="space-y-1.5 text-xs text-gray-300">
              {r.leetcode && (
                <p>🟧 LeetCode — {r.leetcode.totalSolved} solved{r.leetcode.contestRating ? ` · rating ${r.leetcode.contestRating}` : ""}</p>
              )}
              {r.codeforces && (
                <p>🔴 Codeforces — {r.codeforces.solvedCount} solved · rating {r.codeforces.rating} ({r.codeforces.rank})</p>
              )}
              {r.codechef && (
                <p>🍳 CodeChef — rating {r.codechef.rating}{r.codechef.stars ? ` (${r.codechef.stars}★)` : ""}</p>
              )}
              {r.github && (
                <p>🐙 GitHub — {r.github.totalContributions} contributions · {r.github.publicRepos} repos</p>
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-gray-500 mt-4">
        Made with <Link to="/signup" className="text-accent">Codoverse</Link> — track your real growth as a developer.
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-2 text-center">
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[9px] text-gray-400">{label}</p>
    </div>
  );
}
