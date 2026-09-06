import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { sanitizeUsername } from "../services/platforms.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const platforms = await store.getBlob(req.userId, "platforms", {});
  res.json({ platforms });
});

router.put("/", requireAuth, async (req, res) => {
  const { github, leetcode, codechef, codeforces } = req.body || {};
  const existing = await store.getBlob(req.userId, "platforms", {});
  const updated = {
    github: github !== undefined ? sanitizeUsername("github", github) : existing.github ?? "",
    leetcode: leetcode !== undefined ? sanitizeUsername("leetcode", leetcode) : existing.leetcode ?? "",
    codechef: codechef !== undefined ? sanitizeUsername("codechef", codechef) : existing.codechef ?? "",
    codeforces: codeforces !== undefined ? sanitizeUsername("codeforces", codeforces) : existing.codeforces ?? ""
  };
  await store.setBlob(req.userId, "platforms", updated);
  res.json({ platforms: updated });
});

export default router;
