// Real company-wise LeetCode question data — the FULL list per company,
// not a hand-picked handful. Source: a public, community-maintained
// dataset of real LeetCode "asked at this company" questions
// (liquidslr/leetcode-company-wise-problems on GitHub), which mirrors
// what LeetCode's own company-tag pages show. We always read the
// "All time" file, so the count is however many real questions exist
// for that company — no artificial cap.

const REPO_BASE = "https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main";

// Internal id -> exact folder name in the dataset repo.
const COMPANY_FOLDERS = {
  google: "Google",
  amazon: "Amazon",
  microsoft: "Microsoft",
  meta: "Meta"
};

export const COMPANY_LABELS = {
  google: "Google",
  amazon: "Amazon",
  microsoft: "Microsoft",
  meta: "Meta"
};

// Parses a CSV row respecting quoted fields that themselves contain commas
// (the Topics column, e.g. "Array, Hash Table").
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function slugFromLink(link) {
  const m = /leetcode\.com\/problems\/([^/]+)/.exec(link || "");
  return m ? m[1] : null;
}

function titleCase(s) {
  return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
}

async function fetchCompanyCsv(folder) {
  const url = `${REPO_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent("5. All.csv")}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Could not load real question data for ${folder} (status ${resp.status})`);
  }
  const text = await resp.text();
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const rows = lines.slice(1); // drop header
  const seen = new Set();
  const problems = [];
  for (const line of rows) {
    const cols = parseCsvLine(line);
    if (cols.length < 6) continue;
    const [difficulty, title, frequency, acceptance, link] = cols;
    const slug = slugFromLink(link);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    problems.push({
      id: slug,
      title: title.trim(),
      difficulty: titleCase((difficulty || "").trim()),
      frequency: Number(frequency) || 0,
      acceptanceRate: Math.round((Number(acceptance) || 0) * 10000) / 100,
      url: link.trim()
    });
  }
  // Real questions, ordered by how often they're actually reported asked —
  // most-frequently-asked first, same ordering LeetCode's own page uses.
  problems.sort((a, b) => b.frequency - a.frequency);
  return problems;
}

// Cached per cold start so we aren't re-downloading a ~150KB CSV on every
// request, while still reflecting the real dataset (refreshed every 12h).
const cache = new Map();
const TTL_MS = 12 * 60 * 60 * 1000;

export async function getCompanyProblems(companyId) {
  const folder = COMPANY_FOLDERS[companyId];
  if (!folder) throw new Error("Unknown company");

  const cached = cache.get(companyId);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.problems;
  }
  const problems = await fetchCompanyCsv(folder);
  cache.set(companyId, { problems, at: Date.now() });
  return problems;
}

export function listCompanies() {
  return Object.keys(COMPANY_FOLDERS);
}
