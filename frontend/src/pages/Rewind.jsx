import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function Rewind() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.rewind(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Rewind" />
        <p className="text-bad text-sm text-center mt-10">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="app-shell flex items-center justify-center text-gray-400">Loading rewind…</div>;
  }

  if (!data.isRealData) {
    return (
      <div className="app-shell px-4">
        <TopBar title="Rewind" />
        <div className="card p-6 text-center mt-6">
          <p className="text-3xl mb-2">⏪</p>
          <p className="font-semibold mb-1">No rewind yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Connect a platform and sync to generate your real {data.month} rewind.
          </p>
          <Link to="/connect" className="btn-primary inline-block">Connect platforms</Link>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Global rank on Codoverse",
      big: data.globalRank ? `#${data.globalRank.toLocaleString()}` : "Unranked",
      color: "from-[#7c5cff] to-[#4f8cff]"
    },
    {
      title: "You showed up",
      big: `${data.daysShowedUp} days`,
      sub: "Consistency beats motivation",
      color: "from-[#2dd4bf] to-[#4f8cff]"
    },
    {
      title: "Longest streak",
      big: `${data.longestStreak} days`,
      sub: `${data.totalSubmissions} total submissions across platforms`,
      color: "from-[#f5a524] to-[#f45b69]"
    },
    {
      title: "Development score",
      big: `${data.developmentScore}`,
      sub: "Your current C-Score",
      color: "from-[#4f8cff] to-[#2dd4bf]"
    }
  ];

  return (
    <div className="app-shell px-4">
      <TopBar title={`${data.month} Rewind`} />
      <div className="space-y-3">
        {cards.map((c, i) => (
          <div key={i} className={`rounded-2xl p-6 bg-gradient-to-br ${c.color}`}>
            <p className="text-sm opacity-90">{c.title}</p>
            <p className="text-4xl font-display font-extrabold mt-2">{c.big}</p>
            {c.sub && <p className="text-xs opacity-80 mt-2">{c.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
