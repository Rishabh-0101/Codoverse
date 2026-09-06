import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { publicUser } from "./auth.js";

const router = Router();

const EMPTY_HEATMAP = new Array(119).fill(0);
const EMPTY_WEEKDAY = [0, 0, 0, 0, 0, 0, 0];

router.get("/dashboard", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const platforms = await store.getBlob(user.id, "platforms", {});
  const connectedCount = Object.values(platforms).filter(Boolean).length;
  const synced = await store.getBlob(user.id, "platformStats", null);
  const lastAnalysis = await store.getBlob(user.id, "lastRepoAnalysis", null);

  if (synced) {
    return res.json({
      user: publicUser(user),
      isRealData: true,
      syncedAt: synced.syncedAt,
      platformResults: synced.results,
      platformErrors: synced.errors,
      activityHeatmap: synced.heatmap,
      connectedPlatforms: connectedCount,
      codeQuality: lastAnalysis?.codeQuality || null,
      githubCommitsByWeekday: synced.commitsByWeekday,
      totalContests: synced.totalContests || null,
      monthlyBreakdown: synced.monthlyBreakdown || [],
      difficultySummary: synced.difficultySummary || null
    });
  }

  // No sync yet — genuinely empty, not filled with placeholder numbers.
  res.json({
    user: publicUser(user),
    isRealData: false,
    connectedPlatforms: connectedCount,
    activityHeatmap: EMPTY_HEATMAP,
    codeQuality: lastAnalysis?.codeQuality || null,
    githubCommitsByWeekday: EMPTY_WEEKDAY
  });
});

router.put("/", requireAuth, async (req, res) => {
  const { name, handle } = req.body || {};
  const user = await store.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const updated = await store.updateUser(req.userId, { name, handle });
  res.json({ user: publicUser(updated) });
});

router.get("/rewind", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const synced = await store.getBlob(user.id, "platformStats", null);

  if (!synced) {
    return res.json({
      isRealData: false,
      month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      globalRank: null,
      daysShowedUp: 0,
      longestStreak: 0,
      totalSubmissions: 0,
      developmentScore: 0
    });
  }

  const heatmap = synced.heatmap;
  const activeDays = heatmap.filter((v) => v > 0).length;
  let longest = 0, current = 0;
  for (const v of heatmap) {
    if (v > 0) { current++; longest = Math.max(longest, current); }
    else current = 0;
  }
  const results = synced.results || {};
  const totalSubmissions =
    (results.codeforces?.totalSubmissions || 0) +
    (results.leetcode?.totalSolved || 0) +
    (results.codechef?.totalSolved || 0) +
    (results.github?.totalContributions || 0);

  res.json({
    isRealData: true,
    month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    globalRank: user.globalRank || null,
    daysShowedUp: activeDays,
    longestStreak: longest || user.streak || 0,
    totalSubmissions,
    developmentScore: Math.round(user.cScore || 0)
  });
});

export default router;
