import { Router } from "express";
import fetch from "node-fetch";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function parseRepoUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return { error: "That's not a github.com URL. Paste a link like https://github.com/owner/repo" };
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return { error: "That looks like a GitHub profile, not a repository. Paste a specific repo URL, e.g. https://github.com/owner/repo" };
    }
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return { error: "Enter a valid public GitHub repo URL, e.g. https://github.com/owner/repo" };
  }
}

async function githubFetch(url) {
  const headers = { "User-Agent": "codoverse-app" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`GitHub API error ${r.status}`);
  return r.json();
}

const CODE_EXT = [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rb", ".php", ".c", ".cpp"];

router.post("/", requireAuth, async (req, res) => {
  const { repoUrl } = req.body || {};
  const parsed = parseRepoUrl(repoUrl || "");
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const repoInfo = await githubFetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
    const branch = repoInfo.default_branch || "main";
    const tree = await githubFetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`
    );

    const codeFiles = (tree.tree || [])
      .filter((f) => f.type === "blob" && CODE_EXT.some((ext) => f.path.endsWith(ext)))
      .filter((f) => f.size && f.size < 20000)
      .slice(0, 6);

    if (codeFiles.length === 0) {
      return res.json({
        repo: `${parsed.owner}/${parsed.repo}`,
        codeQuality: null,
        issues: [],
        note: "No scannable source files were found in this repo (or they were all too large / binary)."
      });
    }

    const fileContents = [];
    for (const f of codeFiles) {
      try {
        const raw = await fetch(
          `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${f.path}`
        );
        if (raw.ok) {
          const text = await raw.text();
          fileContents.push({ path: f.path, content: text.slice(0, 4000) });
        }
      } catch {
        // skip unreadable file
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        repo: `${parsed.owner}/${parsed.repo}`,
        filesScanned: fileContents.map((f) => f.path),
        codeQuality: null,
        issues: [],
        note: "Add ANTHROPIC_API_KEY as an environment variable to enable AI grading. Files were fetched successfully but not graded."
      });
    }

    const prompt = `You are a strict senior code reviewer. Review the following files from the GitHub repo ${parsed.owner}/${parsed.repo} and respond with ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:
{
  "score": <integer 0-100 overall code quality>,
  "summary": "<one sentence>",
  "subscores": {
    "cleanCode": <0-100>,
    "readability": <0-100>,
    "testCoverage": <0-100, estimate from presence/absence of test files and patterns>,
    "errorHandling": <0-100>,
    "structure": <0-100, project/module organization>
  },
  "issues": [{"severity": "high|medium|low", "file": "<path>", "issue": "<short description>"}]
}
List at most 6 issues, most severe first. Be honest and specific — base every subscore only on what you can actually see in the files given.

Files:
${fileContents.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`Anthropic API error ${aiRes.status}: ${errText.slice(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const textBlock = (aiData.content || []).find((c) => c.type === "text");
    let parsedJson;
    try {
      const cleaned = (textBlock?.text || "{}").replace(/```json|```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch {
      parsedJson = { score: null, summary: "Could not parse AI response.", subscores: null, issues: [] };
    }

    // unlock "repo-scanner" achievement
    const achievements = await store.getBlob(req.userId, "achievements", []);
    const ach = achievements.find((a) => a.id === "repo-scanner");
    if (ach) {
      ach.unlocked = true;
      await store.setBlob(req.userId, "achievements", achievements);
    }

    // Store this as the user's current code-quality profile (used on the
    // Home/Profile radar chart) — real, AI-derived from their actual code,
    // never fabricated.
    if (parsedJson.subscores) {
      await store.setBlob(req.userId, "lastRepoAnalysis", {
        repo: `${parsed.owner}/${parsed.repo}`,
        analyzedAt: new Date().toISOString(),
        codeQuality: parsedJson.subscores
      });
    }

    res.json({
      repo: `${parsed.owner}/${parsed.repo}`,
      filesScanned: fileContents.map((f) => f.path),
      codeQuality: parsedJson.score,
      summary: parsedJson.summary,
      subscores: parsedJson.subscores || null,
      issues: parsedJson.issues || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not analyze this repo. Check the URL and try again. " + err.message });
  }
});

export default router;
