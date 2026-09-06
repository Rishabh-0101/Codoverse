import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

const PLATFORMS = [
  { key: "github", label: "GitHub", icon: "🐙", placeholder: "your-username", hint: "Real: repos, stars, languages, contribution calendar" },
  { key: "leetcode", label: "LeetCode", icon: "🟧", placeholder: "leetcode_user", hint: "Real: solved counts by difficulty, contest rating, submission calendar" },
  { key: "codechef", label: "CodeChef", icon: "🍳", placeholder: "codechef_user", hint: "Real: rating, stars, global/country rank, solved counts" },
  { key: "codeforces", label: "Codeforces", icon: "🔴", placeholder: "cf_handle", hint: "Real: rating, rank, solved problems, submission calendar" }
];

export default function Connect() {
  const { token, setUser } = useAuth();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    api.getPlatforms(token).then((d) => setValues(d.platforms || {}));
  }, [token]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.savePlatforms(token, values);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncResult(null);
    try {
      await save();
      const data = await api.syncPlatforms(token);
      setSyncResult(data);
      const me = await api.me(token);
      setUser(me.user);
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="app-shell px-4">
      <TopBar title="Connect platforms" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">
        Link your real usernames — Codoverse pulls live stats directly from each platform.
      </p>

      <div className="space-y-3">
        {PLATFORMS.map((p) => (
          <div key={p.key} className="card p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{p.label}</p>
                <input
                  value={values[p.key] || ""}
                  placeholder={p.placeholder}
                  onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm border-b border-[#212a45] pb-1 focus:border-accent"
                />
              </div>
              {syncResult?.results?.[p.key] && <span className="text-good text-xs">✓ synced</span>}
              {syncResult?.errors?.[p.key] && <span className="text-bad text-xs">✗ failed</span>}
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">{p.hint}</p>
            {syncResult?.errors?.[p.key] && (
              <p className="text-[10px] text-bad mt-1">{syncResult.errors[p.key]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving} className="btn-outline flex-1">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={sync} disabled={syncing} className="btn-primary flex-1">
          {syncing ? "Syncing real data…" : "Save & Sync now"}
        </button>
      </div>
      {saved && !syncing && <p className="text-good text-xs text-center mt-2">Saved!</p>}
      {syncError && <p className="text-bad text-xs text-center mt-2">{syncError}</p>}

      {syncResult && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400">SYNC RESULTS</p>
          {Object.entries(syncResult.results || {}).map(([platform, r]) => (
            <div key={platform} className="card p-3">
              <p className="text-sm font-semibold capitalize mb-1">{platform}</p>
              {platform === "github" && (
                <p className="text-xs text-gray-400">
                  {r.publicRepos} public repos · {r.followers} followers · {r.totalContributions} contributions (last year)
                </p>
              )}
              {platform === "leetcode" && (
                <>
                  <p className="text-xs text-gray-400">
                    {r.totalSolved} solved ({r.easySolved} easy / {r.mediumSolved} med / {r.hardSolved} hard)
                    {r.contestRating ? ` · Contest rating ${r.contestRating}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Contests counted: {r.totalContestsAttended ?? r.contestHistory?.length ?? 0}
                    <span className="text-gray-600"> (matches "Attended" on your LeetCode profile)</span>
                    {r._debugContestEntriesSeen !== undefined && (
                      <span className="text-gray-600">
                        {" "}(saw {r._debugContestEntriesSeen} contest record{r._debugContestEntriesSeen === 1 ? "" : "s"} from LeetCode, {r._debugContestEntriesAttended} marked attended)
                      </span>
                    )}
                  </p>
                </>
              )}
              {platform === "codeforces" && (
                <p className="text-xs text-gray-400">
                  Rating {r.rating} ({r.rank}) · {r.solvedCount} problems solved · {r.contestHistory?.length ?? 0} contests counted
                </p>
              )}
              {platform === "codechef" && (
                <>
                  <p className="text-xs text-gray-400">
                    Rating {r.rating} {r.stars ? `(${r.stars}★)` : ""}
                    {r.globalRank ? ` · Global rank #${r.globalRank}` : ""}
                    {" · "}{r.totalSolved !== null && r.totalSolved !== undefined ? `${r.totalSolved} solved` : "solved count not detected"}
                  </p>
                  {r._debugSolvedSnippets && r._debugSolvedSnippets.length > 0 && (
                    <div className="mt-2 bg-panel2 rounded-lg p-2">
                      <p className="text-[10px] text-warn mb-1">
                        Couldn't auto-detect your solved count. Copy the text below and send it back — it'll give an exact fix:
                      </p>
                      {r._debugSolvedSnippets.map((s, i) => (
                        <p key={i} className="text-[10px] text-gray-500 font-mono break-all mb-1">
                          "{s}"
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <p className="text-xs text-good text-center">
            Your dashboard, profile and rewind now reflect this real data.
          </p>
        </div>
      )}
    </div>
  );
}
