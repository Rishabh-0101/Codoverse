import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function ShareCard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const cardRef = useRef(null);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#0b0e1a", scale: 2 });
      const link = document.createElement("a");
      link.download = `codoverse-${user?.handle || "profile"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setDownloadError("Couldn't generate the image — try the copy-as-text option instead.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    api.dashboard(token).then(setData);
  }, [token]);

  if (!data) return <div className="app-shell flex items-center justify-center text-gray-400">Loading…</div>;

  if (!data.isRealData) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Share Card" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">🪪</p>
          <p className="font-semibold mb-1">Nothing to share yet</p>
          <p className="text-sm text-gray-400 mb-4">Connect a platform and sync to generate your real share card.</p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
      </div>
    );
  }

  const r = data.platformResults || {};
  const activeDays = data.activityHeatmap.filter((v) => v > 0).length;

  const lines = [
    `${user.name} (@${user.handle}) — Codoverse`,
    `C-Score: ${data.user.cScore} · XP: ${data.user.totalXp}${data.user.globalRank ? ` · Rank #${data.user.globalRank}` : ""}`,
    `Active days (last ${data.activityHeatmap.length}d): ${activeDays}`,
    r.leetcode ? `LeetCode: ${r.leetcode.totalSolved} solved (${r.leetcode.easySolved}E/${r.leetcode.mediumSolved}M/${r.leetcode.hardSolved}H)${r.leetcode.contestRating ? `, rating ${r.leetcode.contestRating}` : ""}` : null,
    r.codeforces ? `Codeforces: ${r.codeforces.solvedCount} solved, rating ${r.codeforces.rating} (${r.codeforces.rank})` : null,
    r.codechef ? `CodeChef: rating ${r.codechef.rating}${r.codechef.stars ? ` (${r.codechef.stars}★)` : ""}` : null,
    r.github ? `GitHub: ${r.github.totalContributions} contributions, ${r.github.publicRepos} repos` : null,
    "codoverse.app"
  ].filter(Boolean);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — fall back silently, text is still visible on screen
    }
  };

  return (
    <div className="app-shell px-4">
      <TopBar title="Share Card" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Your real stats, ready to share</p>

      <div ref={cardRef} className="rounded-2xl p-6 bg-gradient-to-br from-[#16213f] via-[#1a2650] to-[#0e1731] border border-[#2a3660]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-white text-[#0b0e1a] font-bold flex items-center justify-center text-lg">
            {user.avatarInitials}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-gray-400">@{user.handle}</p>
          </div>
          <span className="ml-auto text-xs font-display font-bold text-accent">Codoverse</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <MiniStat label="C-Score" value={data.user.cScore} />
          <MiniStat label="XP" value={data.user.totalXp} />
          <MiniStat label="Active days" value={activeDays} />
        </div>

        <div className="space-y-1.5 text-xs text-gray-300">
          {r.leetcode && (
            <p>🟧 LeetCode — {r.leetcode.totalSolved} solved · {r.leetcode.easySolved}E/{r.leetcode.mediumSolved}M/{r.leetcode.hardSolved}H{r.leetcode.contestRating ? ` · rating ${r.leetcode.contestRating}` : ""}</p>
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
      </div>

      {downloadError && <p className="text-bad text-xs mt-3 text-center">{downloadError}</p>}
      <button type="button" onClick={downloadImage} disabled={downloading} className="btn-primary w-full mt-4">
        {downloading ? "Generating image…" : "Download as image"}
      </button>
      <button onClick={copyText} className="btn-outline w-full mt-2">
        {copied ? "Copied! ✅" : "Copy as text"}
      </button>
      <p className="text-[10px] text-gray-500 text-center mt-2">
        Downloads a real PNG of the card above — share it anywhere, or paste the copied text.
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
