import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  fetchGithubStats,
  fetchCodeforcesStats,
  fetchLeetcodeStats,
  fetchCodechefStats,
  sanitizeUsername
} from "../services/platforms.js";

const router = Router();

async function fetchSide(handles = {}) {
  const jobs = [];
  const gh = sanitizeUsername("github", handles.github);
  const cf = sanitizeUsername("codeforces", handles.codeforces);
  const lc = sanitizeUsername("leetcode", handles.leetcode);
  const cc = sanitizeUsername("codechef", handles.codechef);
  if (gh) jobs.push(["github", fetchGithubStats(gh)]);
  if (cf) jobs.push(["codeforces", fetchCodeforcesStats(cf)]);
  if (lc) jobs.push(["leetcode", fetchLeetcodeStats(lc)]);
  if (cc) jobs.push(["codechef", fetchCodechefStats(cc)]);

  if (jobs.length === 0) return { results: {}, errors: {} };

  const settled = await Promise.allSettled(jobs.map(([, p]) => p));
  const results = {};
  const errors = {};
  settled.forEach((outcome, i) => {
    const [key] = jobs[i];
    if (outcome.status === "fulfilled") results[key] = outcome.value;
    else errors[key] = outcome.reason.message || "Failed to fetch";
  });
  return { results, errors };
}

// Both sides are fetched live, the same way a real sync works — the friend
// never needs a Codoverse account, they just need public profiles on
// whichever platforms you want to compare.
router.post("/", requireAuth, async (req, res) => {
  const { you, friend } = req.body || {};
  if (!you || !friend) {
    return res.status(400).json({ error: "Provide handles for both you and your friend" });
  }

  const [youData, friendData] = await Promise.all([fetchSide(you), fetchSide(friend)]);

  if (Object.keys(youData.results).length === 0 && Object.keys(friendData.results).length === 0) {
    return res.status(502).json({ error: "Could not fetch any real data for either side. Check the handles." });
  }

  res.json({ you: youData, friend: friendData });
});

export default router;
