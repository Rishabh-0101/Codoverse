import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";
import BottomNav from "../components/BottomNav.jsx";

const FIELDS = [
  { key: "github", label: "GitHub username" },
  { key: "leetcode", label: "LeetCode username" },
  { key: "codechef", label: "CodeChef username" },
  { key: "codeforces", label: "Codeforces handle" }
];

function emptyHandles() {
  return { github: "", leetcode: "", codechef: "", codeforces: "" };
}

function Row({ label, mine, theirs, higherIsBetter = true }) {
  const hasMine = mine !== null && mine !== undefined;
  const hasTheirs = theirs !== null && theirs !== undefined;
  const mineWins = hasMine && hasTheirs && (higherIsBetter ? mine > theirs : mine < theirs);
  const theirsWins = hasMine && hasTheirs && (higherIsBetter ? theirs > mine : theirs < mine);
  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-[#1a2338] last:border-0">
      <p className={`text-sm text-center font-semibold ${mineWins ? "text-good" : ""}`}>{hasMine ? mine : "—"}</p>
      <p className="text-[10px] text-gray-500 text-center">{label}</p>
      <p className={`text-sm text-center font-semibold ${theirsWins ? "text-good" : ""}`}>{hasTheirs ? theirs : "—"}</p>
    </div>
  );
}

export default function Compare() {
  const { token, user } = useAuth();
  const [you, setYou] = useState(emptyHandles());
  const [friend, setFriend] = useState(emptyHandles());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runCompare = async () => {
    setError("");
    setResult(null);
    const hasYou = Object.values(you).some((v) => v.trim());
    const hasFriend = Object.values(friend).some((v) => v.trim());
    if (!hasYou || !hasFriend) {
      setError("Fill in at least one handle on both sides.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.compare(token, you, friend);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const y = result?.you?.results || {};
  const f = result?.friend?.results || {};

  return (
    <div className="app-shell px-4">
      <TopBar title="Compare with a Friend" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">
        Live, real data for both sides — your friend doesn't need a Codoverse account.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-accent mb-2">You ({user?.name})</p>
          {FIELDS.map((f2) => (
            <input
              key={f2.key}
              value={you[f2.key]}
              onChange={(e) => setYou({ ...you, [f2.key]: e.target.value })}
              placeholder={f2.label}
              className="w-full mb-2 rounded-lg bg-panel2 border border-[#212a45] px-3 py-2 text-xs outline-none focus:border-accent"
            />
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-warn mb-2">Friend</p>
          {FIELDS.map((f2) => (
            <input
              key={f2.key}
              value={friend[f2.key]}
              onChange={(e) => setFriend({ ...friend, [f2.key]: e.target.value })}
              placeholder={f2.label}
              className="w-full mb-2 rounded-lg bg-panel2 border border-[#212a45] px-3 py-2 text-xs outline-none focus:border-accent"
            />
          ))}
        </div>
      </div>

      {error && <p className="text-bad text-xs mb-3">{error}</p>}

      <button type="button" onClick={runCompare} disabled={loading} className="btn-primary w-full mb-4">
        {loading ? "Fetching real data…" : "Compare"}
      </button>

      {result && (
        <div className="card p-4">
          <div className="grid grid-cols-3 mb-2">
            <p className="text-xs text-center font-semibold text-accent">You</p>
            <span />
            <p className="text-xs text-center font-semibold text-warn">Friend</p>
          </div>
          <Row label="GitHub repos" mine={y.github?.publicRepos} theirs={f.github?.publicRepos} />
          <Row label="GitHub contributions" mine={y.github?.totalContributions} theirs={f.github?.totalContributions} />
          <Row label="LeetCode solved" mine={y.leetcode?.totalSolved} theirs={f.leetcode?.totalSolved} />
          <Row label="LeetCode rating" mine={y.leetcode?.contestRating} theirs={f.leetcode?.contestRating} />
          <Row label="Codeforces solved" mine={y.codeforces?.solvedCount} theirs={f.codeforces?.solvedCount} />
          <Row label="Codeforces rating" mine={y.codeforces?.rating} theirs={f.codeforces?.rating} />
          <Row label="CodeChef solved" mine={y.codechef?.totalSolved} theirs={f.codechef?.totalSolved} />
          <Row label="CodeChef rating" mine={y.codechef?.rating} theirs={f.codechef?.rating} />

          {(Object.keys(result.you.errors || {}).length > 0 || Object.keys(result.friend.errors || {}).length > 0) && (
            <p className="text-[10px] text-gray-500 mt-3">
              Some handles couldn't be fetched (wrong username, or that platform's profile is private) — those rows show "—".
            </p>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
