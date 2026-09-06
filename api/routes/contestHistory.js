import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PLATFORMS = ["leetcode", "codeforces", "codechef"];

// "Won" means rank === 1 in a real contest the platform itself reported —
// never inferred, guessed, or padded. If a platform's contestHistory
// entries don't include a rank for some reason, that entry is skipped
// rather than assumed to be a win.
router.get("/", requireAuth, async (req, res) => {
  const synced = await store.getBlob(req.userId, "platformStats", null);

  if (!synced) {
    return res.json({
      isRealData: false,
      wins: [],
      totalContestsGiven: 0,
      totalWins: 0
    });
  }

  const results = synced.results || {};
  const wins = [];
  let totalContestsGiven = 0;

  for (const platform of PLATFORMS) {
    const history = results[platform]?.contestHistory || [];
    totalContestsGiven += history.length;
    for (const c of history) {
      if (c.rank === 1) {
        wins.push({
          platform,
          name: c.name,
          date: c.date,
          rating: c.rating ?? null,
          url: c.url || null
        });
      }
    }
  }

  wins.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    isRealData: true,
    wins,
    totalContestsGiven,
    totalWins: wins.length
  });
});

export default router;
