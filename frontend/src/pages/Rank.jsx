import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import BottomNav from "../components/BottomNav.jsx";

export default function Rank() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getLeaderboard(token)
      .then((d) => setRows(d.leaderboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="app-shell px-4">
      <div className="pt-5 pb-3">
        <h1 className="text-xl font-display font-bold">Leaderboard</h1>
        <p className="text-xs text-gray-400">Real Codoverse users, ranked by C-Score from their synced platforms</p>
      </div>

      {error && <p className="text-bad text-sm">{error}</p>}
      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {!loading && rows.length === 0 && !error && (
        <div className="card p-6 text-center mt-4">
          <p className="text-2xl mb-2">🏁</p>
          <p className="text-sm text-gray-400">
            No one has synced real platform data yet — connect and sync to be the first on the board.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          {podium.length > 0 && (
            <div className="flex items-end justify-center gap-3 mb-6">
              {[podium[1], podium[0], podium[2]].map((p, i) =>
                p ? (
                  <div key={p.handle} className="text-center">
                    <div
                      className={`rounded-xl flex items-end justify-center font-bold text-lg ${
                        i === 1 ? "bg-warn text-black h-24 w-20" : i === 0 ? "bg-gray-300 text-black h-16 w-16" : "bg-[#8a5a2e] text-white h-14 w-16"
                      } pb-1`}
                    >
                      {p.rank}
                    </div>
                    <p className="text-xs mt-1 font-medium truncate w-20">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.score.toFixed(1)}</p>
                  </div>
                ) : (
                  <div key={i} />
                )
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div className="card divide-y divide-[#212a45]">
              {rest.map((r) => (
                <div key={r.handle} className={`flex items-center justify-between px-4 py-3 ${r.isMe ? "bg-accent/10" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-500 w-6 shrink-0">{r.rank}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.name} {r.isMe && <span className="text-accent">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">@{r.handle}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{r.score.toFixed(1)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}
