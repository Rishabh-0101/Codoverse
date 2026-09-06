import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

const COMPANY_IDS = ["google", "amazon", "microsoft", "meta"];
const PAGE_SIZE = 150;

const DIFF_COLOR = { Easy: "text-good", Medium: "text-warn", Hard: "text-bad" };

export default function CompanyKit() {
  const { token } = useAuth();
  const [active, setActive] = useState("google");
  const [summary, setSummary] = useState({});
  const [problemsByCompany, setProblemsByCompany] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadSummary = () =>
    api
      .getCompanyKit(token)
      .then((d) => setSummary(d.companies))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingSummary(false));

  const loadList = (companyId) => {
    setLoadingList(true);
    api
      .getCompanyProblems(token, companyId)
      .then((d) => setProblemsByCompany((prev) => ({ ...prev, [companyId]: d.problems })))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setSearch("");
    setVisibleCount(PAGE_SIZE);
    if (!problemsByCompany[active]) loadList(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, token]);

  const toggle = async (problemId) => {
    // Optimistic flip so ticking a checkbox in a 1000+ row list feels instant.
    setProblemsByCompany((prev) => ({
      ...prev,
      [active]: prev[active].map((p) => (p.problemId === problemId ? { ...p, solved: !p.solved } : p))
    }));
    try {
      await api.toggleCompanyProblem(token, problemId);
      loadSummary();
    } catch (err) {
      setError(err.message);
      loadList(active);
    }
  };

  const fullList = problemsByCompany[active] || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fullList;
    return fullList.filter((p) => p.title.toLowerCase().includes(q));
  }, [fullList, search]);
  const visible = filtered.slice(0, visibleCount);

  const activeSummary = summary[active];
  const solvedCount = activeSummary?.solved ?? 0;
  const totalCount = activeSummary?.total ?? fullList.length;
  const pct = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <div className="app-shell px-4">
      <TopBar title="Company Wise Kit" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">
        Every real LeetCode question ever reported asked at each company — full list, not a shortlist.
      </p>

      {error && <p className="text-bad text-xs mb-3">{error}</p>}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {COMPANY_IDS.map((id) => (
          <button
            type="button"
            key={id}
            onClick={() => setActive(id)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${
              active === id ? "bg-accent border-accent text-white" : "border-[#212a45] text-gray-400"
            }`}
          >
            {summary[id]?.label || id} {summary[id] ? `(${summary[id].total})` : ""}
          </button>
        ))}
      </div>

      {!loadingSummary && (
        <div className="card p-4 mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">{activeSummary?.label} problems</span>
            <span className="text-gray-400">
              {solvedCount} of {totalCount} solved · {pct}%
            </span>
          </div>
          <div className="w-full h-2 bg-panel2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-good" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
        placeholder={`Search all ${totalCount || ""} ${activeSummary?.label || ""} questions...`}
        className="w-full mb-3 rounded-lg bg-panel2 border border-[#212a45] px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {loadingList && <p className="text-xs text-gray-500 mb-3">Loading the real question list…</p>}

      {!loadingList && (
        <>
          <div className="space-y-2">
            {visible.map((p) => (
              <div key={p.problemId} className="card p-3 flex items-center justify-between gap-2">
                <button type="button" onClick={() => toggle(p.problemId)} className="shrink-0">
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${
                      p.solved ? "bg-good border-good text-black" : "border-[#2a3350]"
                    }`}
                  >
                    {p.solved ? "✓" : ""}
                  </span>
                </button>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex-1 text-sm min-w-0 truncate hover:text-accent ${p.solved ? "line-through text-gray-500" : ""}`}
                >
                  {p.title}
                </a>
                <span className="text-[10px] text-gray-500 shrink-0">{p.frequency}% asked</span>
                <span className={`text-xs font-medium shrink-0 ${DIFF_COLOR[p.difficulty] || "text-gray-400"}`}>
                  {p.difficulty}
                </span>
                <a href={p.url} target="_blank" rel="noreferrer" className="text-gray-500 text-xs shrink-0">
                  ↗
                </a>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-6">No questions match "{search}".</p>
          )}

          {visible.length < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full mt-3 text-xs py-2 rounded-lg border border-[#212a45] text-gray-400 hover:text-accent hover:border-accent"
            >
              Show {Math.min(PAGE_SIZE, filtered.length - visible.length)} more (of {filtered.length} total)
            </button>
          )}
        </>
      )}
    </div>
  );
}
