import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

export default function Achievements() {
  const { token, user } = useAuth();
  const [list, setList] = useState([]);

  useEffect(() => {
    api.getAchievements(token).then((d) => setList(d.achievements));
  }, [token]);

  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <div className="app-shell px-4">
      <TopBar title="Achievements" />
      <div className="card p-4 flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">{unlocked} / {list.length} unlocked</p>
          <p className="text-xs text-gray-500">Keep solving to earn more badges</p>
        </div>
        <p className="text-2xl">🏆</p>
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <div key={a.id} className={`card p-4 flex items-center gap-3 ${a.unlocked ? "" : "opacity-50"}`}>
            <span className="text-2xl">{a.unlocked ? "🏅" : "🔒"}</span>
            <div>
              <p className="font-semibold text-sm">{a.name}</p>
              <p className="text-xs text-gray-500">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
