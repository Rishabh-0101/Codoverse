import { Router } from "express";
import * as store from "../lib/store.js";

const router = Router();

// No requireAuth here on purpose — this is the whole point of the feature:
// anyone with the link can view it, no Codoverse account needed.
router.get("/:handle", async (req, res) => {
  const user = await store.findUserByHandle(req.params.handle);
  if (!user) return res.status(404).json({ error: "No profile with this handle" });

  const settings = await store.getBlob(user.id, "settings", {});
  if (settings.publicProfile === false) {
    return res.status(403).json({ error: "This user has kept their profile private" });
  }

  const synced = await store.getBlob(user.id, "platformStats", null);
  const results = synced?.results || {};

  // Only ever return what's needed for a public card — never email,
  // password hash, or anything from settings/notes/sheets progress.
  res.json({
    name: user.name,
    handle: user.handle,
    avatarInitials: user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
    totalXp: user.totalXp,
    cScore: user.cScore,
    globalRank: user.globalRank,
    isRealData: !!synced,
    platformResults: results,
    difficultySummary: synced?.difficultySummary || null,
    contestWins: (synced?.results
      ? ["leetcode", "codeforces", "codechef"].reduce(
          (sum, p) => sum + (results[p]?.contestHistory?.filter((c) => c.rank === 1).length || 0),
          0
        )
      : 0)
  });
});

export default router;
