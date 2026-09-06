import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

const DIFF_COLOR = { Easy: "text-good", Medium: "text-warn", Hard: "text-bad" };

export default function Sheets() {
  const { token } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [openSheet, setOpenSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api.getSheets(token).then((d) => setSheets(d.sheets)).catch((err) => setError(err.message)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggle = async (sheetId, problemId) => {
    try {
      await api.toggleSheetProblem(token, sheetId, problemId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (openSheet) {
    const sheet = sheets.find((s) => s.id === openSheet);
    return (
      <div className="app-shell px-4">
        <TopBar title={sheet.name} showBack onBack={() => setOpenSheet(null)} />
        <button type="button" onClick={() => setOpenSheet(null)} className="text-xs text-accent -mt-3 mb-3">← All sheets</button>
        <p className="text-xs text-gray-400 mb-3">
          Showing {sheet.problems.length} of {sheet.total} real problems from this sheet.{" "}
          <a href={sheet.sourceUrl} target="_blank" rel="noreferrer" className="text-accent">View full {sheet.total}-problem sheet ↗</a>
        </p>
        <div className="space-y-2">
          {sheet.problems.map((p) => (
            <div key={p.id} className="card p-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => toggle(sheet.id, p.id)} className="shrink-0">
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                    p.solved ? "bg-good border-good text-black" : "border-[#2a3350]"
                  }`}
                >
                  {p.solved ? "✓" : ""}
                </span>
              </button>
              <a href={p.url} target="_blank" rel="noreferrer" className={`flex-1 text-sm min-w-0 truncate hover:text-accent ${p.solved ? "line-through text-gray-500" : ""}`}>
                {p.title}
              </a>
              <span className={`text-xs font-medium shrink-0 ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
              <a href={p.url} target="_blank" rel="noreferrer" className="text-gray-500 text-xs shrink-0">↗</a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-4">
      <TopBar title="Explore Sheets" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Popular DSA sheets — real problems, real links</p>
      {error && <p className="text-bad text-xs mb-3">{error}</p>}

      {!loading && (
        <div className="space-y-3">
          {sheets.map((s) => {
            const pct = s.listedCount ? Math.round((s.solvedInList / s.listedCount) * 100) : 0;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setOpenSheet(s.id)}
                className="card p-4 w-full text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{s.name}</p>
                      {s.tag && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">{s.tag}</span>}
                    </div>
                    <p className="text-xs text-gray-500">{s.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400">{s.solvedInList}/{s.listedCount}</span>
                </div>
                <div className="w-full h-2 bg-panel2 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-gradient-to-r from-accent to-good" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-accent mt-3">Open sheet →</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
