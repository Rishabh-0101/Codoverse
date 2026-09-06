import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import Heatmap from "../components/Heatmap.jsx";
import RadarChart from "../components/RadarChart.jsx";
import BottomNav from "../components/BottomNav.jsx";

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  return (
    <div className="app-shell px-4">
      <div className="pt-5 pb-3 flex justify-between items-center">
        <h1 className="text-xl font-display font-bold">Profile</h1>
        <button type="button" onClick={logout} className="text-xs text-bad">Log out</button>
      </div>

      <div className="card p-4 bg-gradient-to-br from-[#16213f] to-[#101731]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center text-xl shrink-0">
            {user?.avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.handle}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] bg-panel2 px-2 py-0.5 rounded-full">{user?.totalXp ?? 0} XP</span>
              <span className="text-[10px] bg-panel2 px-2 py-0.5 rounded-full">{user?.streak ?? 0} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-bad text-xs mt-3">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <MiniStat label="C-Score" value={data.user.cScore ?? 0} />
            <MiniStat label="Global" value={data.user.globalRank ? `#${data.user.globalRank}` : "—"} />
            <MiniStat label="Country" value={data.user.countryRank ? `#${data.user.countryRank}` : "—"} />
            <MiniStat label="Streak" value={`${data.user.streak ?? 0}d`} />
          </div>

          <div className="responsive-grid-2 mt-3">
            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-1">Code quality radar</h3>
              {data.codeQuality ? (
                <RadarChart data={data.codeQuality} />
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 mb-3">Run the AI repo analyzer to see this.</p>
                  <Link to="/analyze-repo" className="btn-outline text-xs inline-block">Analyze a Repo</Link>
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-3">Activity heatmap</h3>
              <Heatmap cells={data.activityHeatmap} />
            </div>
          </div>
        </>
      )}

      <Link to="/connect" className="card p-4 mt-3 flex items-center gap-3">
        <span className="text-xl">🔗</span>
        <div>
          <p className="font-semibold text-sm">Connect platforms</p>
          <p className="text-xs text-gray-400">Link your usernames to pull real activity into your profile charts</p>
        </div>
      </Link>

      <Link to="/rank" className="card p-4 mt-3 flex items-center gap-3">
        <span className="text-xl">🏅</span>
        <div>
          <p className="font-semibold text-sm">View Leaderboard</p>
          <p className="text-xs text-gray-400">See real registered users ranked by C-Score</p>
        </div>
      </Link>

      <BottomNav />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card p-2">
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
