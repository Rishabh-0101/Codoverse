import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import Heatmap from "../components/Heatmap.jsx";
import RadarChart from "../components/RadarChart.jsx";
import BarChart from "../components/BarChart.jsx";
import PieChart from "../components/PieChart.jsx";
import LabeledBarChart from "../components/LabeledBarChart.jsx";
import StackedBarChart from "../components/StackedBarChart.jsx";
import BottomNav from "../components/BottomNav.jsx";

export default function Home() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard(token).then(setData).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="app-shell flex items-center justify-center text-gray-400">Loading your stats…</div>;
  }
  if (error || !data) {
    return (
      <div className="app-shell flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-bad text-sm">{error || "Could not load dashboard"}</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell px-4">
      <div className="flex items-center justify-between pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-good" />
          <span className="font-display font-semibold">Codoverse</span>
        </div>
        <Link to="/settings" className="w-8 h-8 rounded-full bg-panel border border-[#212a45] flex items-center justify-center">
          ⚙️
        </Link>
      </div>

      {/* Profile card */}
      <div className="card p-4 bg-gradient-to-br from-[#16213f] to-[#101731]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center text-lg shrink-0">
              {user?.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">
                @{user?.handle} · {user?.totalXp ?? 0} XP · C-Score {user?.cScore ?? 0}
              </p>
            </div>
          </div>
          <Link to="/rewind" className="bg-warn text-black text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
            ⏪ Rewind
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <Stat label="Total XP" value={user?.totalXp ?? 0} />
        <Stat label="Global" value={data.user.globalRank ? `#${data.user.globalRank}` : "Unranked"} highlight />
        <Stat label="Country" value={data.user.countryRank ? `#${data.user.countryRank}` : "—"} />
        <Stat label="C-Score" value={data.user.cScore ?? 0} />
      </div>

      <div className="responsive-grid-2 mt-3">
        {/* Activity heatmap */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Activity — last {data.activityHeatmap.length} days</h3>
            <span className="text-xs text-good bg-good/10 px-2 py-0.5 rounded-full">
              {data.activityHeatmap.filter((v) => v > 0).length} active days
            </span>
          </div>
          <Heatmap cells={data.activityHeatmap} />
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3">GitHub commits by weekday</h3>
          {data.githubCommitsByWeekday.some((v) => v > 0) ? (
            <BarChart values={data.githubCommitsByWeekday} />
          ) : (
            <p className="text-xs text-gray-500">Connect GitHub &amp; sync to see this.</p>
          )}
        </div>
      </div>

      <div className="card p-4 mt-3">
        <h3 className="font-semibold text-sm mb-1">Code quality skills</h3>
        {data.codeQuality ? (
          <RadarChart data={data.codeQuality} />
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 mb-3">Run the AI repo analyzer to see your real code quality profile.</p>
            <Link to="/analyze-repo" className="btn-outline text-xs inline-block">Analyze a Repo</Link>
          </div>
        )}
      </div>

      {data.difficultySummary && data.difficultySummary.totals.total > 0 && (
        <div className="card p-4 mt-3">
          <h3 className="font-semibold text-sm mb-3">Problems solved by difficulty</h3>
          <PieChart
            data={[
              { label: "Easy", value: data.difficultySummary.totals.easy, color: "#2dd4bf" },
              { label: "Medium", value: data.difficultySummary.totals.medium, color: "#f5a524" },
              { label: "Hard", value: data.difficultySummary.totals.hard, color: "#f45b69" }
            ]}
          />
        </div>
      )}

      {data.difficultySummary?.perPlatform && (
        <div className="card p-4 mt-3">
          <h3 className="font-semibold text-sm mb-3">Difficulty split by platform</h3>
          <StackedBarChart
            rows={[
              data.difficultySummary.perPlatform.leetcode?.available && {
                label: "LeetCode",
                segments: [
                  { name: "Easy", value: data.difficultySummary.perPlatform.leetcode.easy, color: "#2dd4bf" },
                  { name: "Medium", value: data.difficultySummary.perPlatform.leetcode.medium, color: "#f5a524" },
                  { name: "Hard", value: data.difficultySummary.perPlatform.leetcode.hard, color: "#f45b69" }
                ]
              },
              data.difficultySummary.perPlatform.codeforces?.available && {
                label: "Codeforces",
                segments: [
                  { name: "Easy", value: data.difficultySummary.perPlatform.codeforces.easy, color: "#2dd4bf" },
                  { name: "Medium", value: data.difficultySummary.perPlatform.codeforces.medium, color: "#f5a524" },
                  { name: "Hard", value: data.difficultySummary.perPlatform.codeforces.hard, color: "#f45b69" },
                  { name: "Unrated", value: data.difficultySummary.perPlatform.codeforces.unrated, color: "#9aa4c2" }
                ]
              }
            ].filter(Boolean)}
          />
          <p className="text-[10px] text-gray-500 mt-2">
            CodeChef's public profile doesn't expose per-problem difficulty, so it's left out here rather than guessed.
          </p>
        </div>
      )}

      {(data.platformResults?.leetcode?.contestRating || data.platformResults?.codeforces?.rating || data.platformResults?.codechef?.rating) && (
        <div className="card p-4 mt-3">
          <h3 className="font-semibold text-sm mb-3">Contest rating by platform</h3>
          <LabeledBarChart
            bars={[
              data.platformResults.leetcode?.contestRating && { label: "LeetCode", value: data.platformResults.leetcode.contestRating },
              data.platformResults.codeforces?.rating > 0 && { label: "Codeforces", value: data.platformResults.codeforces.rating },
              data.platformResults.codechef?.rating > 0 && { label: "CodeChef", value: data.platformResults.codechef.rating }
            ].filter(Boolean)}
          />
        </div>
      )}

      {data.platformResults && (
        <div className="card p-4 mt-3">
          <h3 className="font-semibold text-sm mb-3">Problems solved by platform</h3>
          <LabeledBarChart
            bars={[
              { label: "LeetCode", value: data.platformResults.leetcode?.totalSolved || 0 },
              { label: "Codeforces", value: data.platformResults.codeforces?.solvedCount || 0 },
              { label: "CodeChef", value: data.platformResults.codechef?.totalSolved || 0 }
            ]}
          />
        </div>
      )}

      {data.isRealData && data.totalContests && (
        <Link to="/contest-stats" className="card p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Contest history</p>
            <p className="text-xs text-gray-400">{data.totalContests.total} total contests · last 7 months tracked</p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      )}

      {data.isRealData && (
        <Link to="/contest-history" className="card p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">🥇 Contests you've won</p>
            <p className="text-xs text-gray-400">Every real #1 finish, across all platforms</p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      )}

      {data.isRealData && (
        <Link to="/rating-progress" className="card p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">📈 Rating progress</p>
            <p className="text-xs text-gray-400">Your real rating over time, every platform</p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      )}

      {data.isRealData && (
        <Link to="/insights" className="card p-4 mt-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">💡 Insights</p>
            <p className="text-xs text-gray-400">Full-year activity, top languages, personal records</p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      )}

      <Link to="/compare" className="card p-4 mt-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">⚔️ Compare with a friend</p>
          <p className="text-xs text-gray-400">Live, real, no account needed for them</p>
        </div>
        <span className="text-accent">→</span>
      </Link>

      {!data.isRealData && (
        <Link to="/connect" className="card p-4 mt-3 flex items-center gap-3 border-accent/40">
          <span className="text-xl">🔗</span>
          <div>
            <p className="font-semibold text-sm">
              {data.connectedPlatforms > 0 ? "Sync your connected platforms" : "Connect platforms to unlock real data"}
            </p>
            <p className="text-xs text-gray-400">
              {data.connectedPlatforms > 0
                ? "Tap Save & Sync now to pull live stats"
                : "Link GitHub, LeetCode, CodeChef & Codeforces"}
            </p>
          </div>
        </Link>
      )}
      {data.isRealData && (
        <p className="text-[10px] text-good text-center mt-2">
          ✓ Real data · last synced {new Date(data.syncedAt).toLocaleString()}
        </p>
      )}

      <BottomNav />
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="card p-2.5 text-center">
      <p className={`font-bold text-sm ${highlight ? "text-warn" : ""}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
