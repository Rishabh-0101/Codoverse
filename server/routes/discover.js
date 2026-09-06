import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { fetchAllContests } from "../services/platforms.js";

const router = Router();

router.get("/leaderboard", requireAuth, async (req, res) => {
  const users = await store.listAllUsers();

  // Only real registered Codoverse users who have actually synced real
  // platform data appear here — nothing invented to pad the list.
  const rows = [];
  for (const u of users) {
    const synced = await store.getBlob(u.id, "platformStats", null);
    if (!synced) continue;
    rows.push({
      name: u.name,
      handle: u.handle,
      score: u.cScore || 0,
      isMe: u.id === req.userId
    });
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => (r.rank = i + 1));

  res.json({ leaderboard: rows });
});

router.get("/contests", requireAuth, async (req, res) => {
  try {
    const contests = await fetchAllContests();
    res.json({ contests });
  } catch (err) {
    res.status(502).json({ error: "Could not fetch live contests right now. Try again shortly.", contests: [] });
  }
});

router.get("/achievements", requireAuth, async (req, res) => {
  const achievements = await store.getBlob(req.userId, "achievements", []);
  res.json({ achievements });
});

export default router;
