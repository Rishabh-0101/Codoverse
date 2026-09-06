import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import TopBar from "../components/TopBar.jsx";

const SEVERITY_COLOR = {
  high: "text-bad bg-bad/10",
  medium: "text-warn bg-warn/10",
  low: "text-good bg-good/10"
};

export default function AnalyzeRepo() {
  const { token } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const scan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api.analyzeRepo(token, url);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell px-4">
      <TopBar title="Analyze a Repo" />
      <p className="text-sm text-gray-400 -mt-2 mb-4">Grade code quality with AI — paste a GitHub URL.</p>

      <form onSubmit={scan} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="flex-1 bg-panel border border-[#212a45] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" disabled={loading} className="btn-primary px-4">
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">Paste a public GitHub repo URL and click Scan to get an AI quality report.</p>

      {error && <p className="text-bad text-sm mt-4">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{result.repo}</p>
            {result.codeQuality !== null ? (
              <>
                <p className="text-4xl font-display font-extrabold text-good">{result.codeQuality}</p>
                <p className="text-xs text-gray-500">Code Quality Score / 100</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{result.note}</p>
            )}
            {result.summary && <p className="text-sm text-gray-300 mt-3">{result.summary}</p>}
          </div>

          {result.subscores && (
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-2">Saved to your Profile &amp; Home code-quality radar</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.subscores).map(([k, v]) => (
                  <div key={k} className="bg-panel2 rounded-lg p-2 flex justify-between">
                    <span className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-xs font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.filesScanned?.length > 0 && (
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-2">Files scanned</p>
              <div className="flex flex-wrap gap-1.5">
                {result.filesScanned.map((f) => (
                  <span key={f} className="text-[10px] bg-panel2 px-2 py-1 rounded-md">{f}</span>
                ))}
              </div>
            </div>
          )}

          {result.issues?.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Issues found ({result.issues.length})</p>
              <div className="space-y-2">
                {result.issues.map((iss, i) => (
                  <div key={i} className="card p-3">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLOR[iss.severity] || ""}`}>
                        {iss.severity}
                      </span>
                      <span className="text-[10px] text-gray-500">{iss.file}</span>
                    </div>
                    <p className="text-sm mt-1.5">{iss.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
